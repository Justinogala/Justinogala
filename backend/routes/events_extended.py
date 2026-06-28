"""
Calendar, Networking Lounge, and AI Event Matchmaker endpoints.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
import uuid
import os
import io

from config import db, logger
from routes.auth_helpers import get_current_user
from llm_client import chat_completion
from security import limiter

router = APIRouter(prefix="/events", tags=["Events Extended"])


# ============== Calendar ==============

@router.get("/{event_id}/calendar.ics")
async def download_ics(event_id: str):
    """Download .ics calendar file for Outlook/Apple Calendar"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    start = event.get("date", "").replace("-", "").replace(":", "").replace(".", "")[:15] + "Z"
    end = (event.get("end_date") or event.get("date", "")).replace("-", "").replace(":", "").replace(".", "")[:15] + "Z"
    title = event.get("title", "Munal AI Event")
    desc = event.get("description", "")[:500].replace("\n", "\\n")
    location = event.get("location", "Online (Jizira, Munal AI)")

    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Munal AI//Academy & Events//EN
BEGIN:VEVENT
DTSTART:{start}
DTEND:{end}
SUMMARY:{title}
DESCRIPTION:{desc}
LOCATION:{location}
ORGANIZER:mailto:events@munal.ai
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR"""

    return StreamingResponse(
        iter([ics]),
        media_type="text/calendar",
        headers={"Content-Disposition": f"attachment; filename={event_id}.ics"}
    )


@router.get("/user/my-calendar")
async def get_user_calendar(user=Depends(get_current_user)):
    """Get all events the user has registered for"""
    user_email = user.get("email", "")
    applications = await db.event_applications.find(
        {"email": {"$regex": f"^{user_email}$", "$options": "i"}},
        {"_id": 0, "event_id": 1, "status": 1, "created_at": 1}
    ).to_list(500)

    event_ids = [a["event_id"] for a in applications]
    if not event_ids:
        return {"events": [], "count": 0}

    events = await db.events.find(
        {"id": {"$in": event_ids}, "deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("date", 1).to_list(500)

    # Attach application status to each event
    app_status = {a["event_id"]: a.get("status", "submitted") for a in applications}
    for e in events:
        e["application_status"] = app_status.get(e["id"], "submitted")

    return {"events": events, "count": len(events)}


# ============== Networking Lounge ==============

class ConnectRequest(BaseModel):
    target_email: str
    message: str = ""


@router.get("/{event_id}/networking/attendees")
async def get_event_attendees(event_id: str):
    """Get attendee directory for networking"""
    attendees = await db.event_applications.find(
        {"event_id": event_id, "status": {"$in": ["accepted", "submitted"]}},
        {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "company": 1, "position": 1,
         "industry": 1, "linkedin": 1, "country": 1}
    ).to_list(500)

    return {"attendees": attendees, "count": len(attendees)}


@router.post("/{event_id}/networking/connect")
@limiter.limit("20/minute")
async def send_connect_request(request: Request, event_id: str, req: ConnectRequest, user=Depends(get_current_user)):
    """Send a networking connect request to another attendee"""
    connect_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "from_email": user.get("email"),
        "from_name": user.get("name", ""),
        "to_email": req.target_email,
        "message": req.message,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_connections.insert_one(connect_doc)
    logger.info(f"Connect request: {user.get('email')} -> {req.target_email} for event {event_id}")
    return {"success": True, "connection_id": connect_doc["id"]}


@router.get("/{event_id}/networking/connections")
async def get_my_connections(event_id: str, user=Depends(get_current_user)):
    """Get user's networking connections for an event"""
    email = user.get("email", "")
    connections = await db.event_connections.find(
        {"event_id": event_id, "$or": [{"from_email": email}, {"to_email": email}]},
        {"_id": 0}
    ).to_list(200)
    return {"connections": connections, "count": len(connections)}


@router.put("/networking/connections/{connection_id}")
async def respond_to_connection(connection_id: str, status: str, user=Depends(get_current_user)):
    """Accept or decline a connection request"""
    if status not in ["accepted", "declined"]:
        raise HTTPException(status_code=400, detail="Status must be 'accepted' or 'declined'")

    result = await db.event_connections.update_one(
        {"id": connection_id, "to_email": user.get("email")},
        {"$set": {"status": status, "responded_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True, "status": status}


# ============== AI Event Matchmaker ==============

class MatchmakerRequest(BaseModel):
    interests: list = []
    industry: str = ""
    experience_level: str = ""
    preferred_formats: list = []


@router.post("/ai/recommendations")
@limiter.limit("5/minute")
async def get_ai_recommendations(request: Request, req: MatchmakerRequest, user=Depends(get_current_user)):
    """AI-powered event recommendations based on user profile"""
    now = datetime.now(timezone.utc).isoformat()

    # Get upcoming events
    events = await db.events.find(
        {"date": {"$gte": now}, "deleted": {"$ne": True}, "status": {"$nin": ["cancelled"]}},
        {"_id": 0, "id": 1, "title": 1, "description": 1, "category": 1, "event_format": 1,
         "date": 1, "location": 1, "price": 1, "seats": 1, "registered": 1, "tags": 1}
    ).sort("date", 1).to_list(50)

    if not events:
        return {"recommendations": [], "message": "No upcoming events found"}

    # Get user's past attendance
    user_email = user.get("email", "")
    past_apps = await db.event_applications.find(
        {"email": {"$regex": f"^{user_email}$", "$options": "i"}},
        {"_id": 0, "event_id": 1}
    ).to_list(100)
    attended_ids = set(a["event_id"] for a in past_apps)

    # Filter out already-applied events
    available = [e for e in events if e["id"] not in attended_ids]
    if not available:
        return {"recommendations": events[:5], "message": "You've applied to all upcoming events!"}

    # Build event summaries for AI
    events_text = "\n".join([
        f"- ID:{e['id']} | {e['title']} | {e.get('category','')} | {e.get('event_format','')} | {e.get('date','')[:10]} | {e.get('price','Free')} | Tags: {','.join(e.get('tags',[]))}"
        for e in available[:30]
    ])

    user_profile = f"""
User Profile:
- Interests: {', '.join(req.interests) if req.interests else 'General tech'}
- Industry: {req.industry or 'Technology'}
- Experience: {req.experience_level or 'Mid-level'}
- Preferred formats: {', '.join(req.preferred_formats) if req.preferred_formats else 'Any'}
- Past events attended: {len(attended_ids)}
"""

    try:
        api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY", "")
        response = chat_completion(
            messages=[
                {"role": "system", "content": "You are an AI event recommender for Munal AI Academy & Events. Given a user profile and available events, rank the top 5 most relevant events. Return ONLY a JSON array of event IDs in order of relevance, like: [\"id1\", \"id2\", \"id3\", \"id4\", \"id5\"]. No explanation."},
                {"role": "user", "content": f"{user_profile}\n\nAvailable Events:\n{events_text}\n\nReturn the top 5 event IDs as a JSON array, most relevant first."}
            ],
            model="gpt-5.5",
            api_key=api_key,
            max_tokens=200,
            temperature=0.3
        )

        import json
        raw = response.choices[0].message.content.strip()
        # Extract JSON array from response
        if "[" in raw:
            raw = raw[raw.index("["):raw.rindex("]")+1]
        recommended_ids = json.loads(raw)

        # Build ordered recommendations
        event_map = {e["id"]: e for e in available}
        recommendations = [event_map[eid] for eid in recommended_ids if eid in event_map]

        # Pad with remaining events if less than 5
        if len(recommendations) < 5:
            remaining = [e for e in available if e["id"] not in set(recommended_ids)]
            recommendations.extend(remaining[:5 - len(recommendations)])

        return {"recommendations": recommendations, "count": len(recommendations)}

    except Exception as e:
        logger.error(f"AI matchmaker failed: {e}")
        # Fallback: return events sorted by registration popularity
        available.sort(key=lambda x: x.get("registered", 0), reverse=True)
        return {"recommendations": available[:5], "count": min(5, len(available)), "fallback": True}
