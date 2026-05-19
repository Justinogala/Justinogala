"""
Calendar routes - events, scheduling.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid

from config import db, logger

router = APIRouter(prefix="/calendar", tags=["Calendar"])


# ============== Models ==============

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: str  # Accept string format from frontend
    end_time: str
    created_by: Optional[str] = None  # From frontend
    organizer_id: Optional[str] = None
    organizer_name: Optional[str] = None
    attendees: List[dict] = []
    invitees: List[str] = []  # User IDs from frontend
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence: Optional[str] = None  # From frontend (daily, weekly, monthly)
    recurrence_rule: Optional[str] = None
    reminders: List[dict] = []
    all_day: bool = False
    video_call: bool = False
    meeting_link: Optional[str] = None  # Custom meeting link from user
    color: Optional[str] = "blue"
    category: Optional[str] = "meeting"

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    attendees: Optional[List[dict]] = None
    invitees: Optional[List[str]] = None
    location: Optional[str] = None
    status: Optional[str] = None
    all_day: Optional[bool] = None
    video_call: Optional[bool] = None
    meeting_link: Optional[str] = None
    color: Optional[str] = None
    category: Optional[str] = None
    recurrence: Optional[str] = None

class EventResponse(BaseModel):
    response: str  # accepted, declined, tentative


DEFAULT_REMINDERS = [
    {"minutes_before": 10, "channels": ["in_app", "email", "push"], "sent": False},
    {"minutes_before": 5, "channels": ["in_app", "email", "push"], "sent": False},
]


# ============== Routes ==============

@router.get("/events")
async def get_calendar_events(
    user_id: str = Query(...),
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get calendar events for a user"""
    try:
        query = {
            "$or": [
                {"organizer_id": user_id},
                {"attendees.user_id": user_id}
            ]
        }
        
        if start_date and end_date:
            query["start_time"] = {
                "$gte": start_date,
                "$lte": end_date
            }
        
        events = await db.calendar_events.find(query, {"_id": 0}).sort("start_time", 1).to_list(500)
        
        return {"events": events, "count": len(events)}
    except Exception as e:
        logger.error(f"Error fetching events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/events")
async def create_calendar_event(event: CalendarEventCreate):
    """Create a new calendar event"""
    try:
        event_id = str(uuid.uuid4())
        
        # Use user-provided meeting link if available, otherwise generate one for video calls
        video_call_link = None
        if event.video_call:
            video_call_link = event.meeting_link if event.meeting_link else f"/workspace/meeting/{event_id}"
        
        # Get organizer info
        organizer_id = event.created_by or event.organizer_id
        
        # Build attendees from invitees list
        attendees = event.attendees or []
        if event.invitees:
            users = await db.users.find(
                {"id": {"$in": event.invitees}},
                {"_id": 0, "id": 1, "name": 1, "email": 1}
            ).to_list(len(event.invitees))
            users_dict = {u["id"]: u for u in users}
            for user_id in event.invitees:
                user = users_dict.get(user_id)
                if user:
                    attendees.append({
                        "user_id": user_id,
                        "name": user.get("name"),
                        "email": user.get("email"),
                        "status": "pending"
                    })
        
        event_doc = {
            "id": event_id,
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time,
            "end_time": event.end_time,
            "organizer_id": organizer_id,
            "organizer_name": event.organizer_name,
            "attendees": attendees,
            "invitees": [{"user_id": a.get("user_id"), "name": a.get("name"), "email": a.get("email"), "status": a.get("status")} for a in attendees],
            "location": event.location,
            "all_day": event.all_day,
            "video_call": event.video_call,
            "meeting_link": video_call_link,
            "color": event.color or "blue",
            "category": event.category or "meeting",
            "recurrence": event.recurrence,
            "is_recurring": event.recurrence is not None and event.recurrence != "none",
            "recurrence_rule": event.recurrence_rule,
            "reminders": event.reminders if event.reminders else [
                {"minutes_before": 10, "channels": ["in_app", "email", "push"], "sent_10": False},
                {"minutes_before": 5, "channels": ["in_app", "email", "push"], "sent_5": False},
            ],
            "status": "scheduled",
            "created_by": organizer_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.calendar_events.insert_one(event_doc)
        
        if "_id" in event_doc:
            del event_doc["_id"]
        
        logger.info(f"Event {event_id} created by {organizer_id}")
        return {"success": True, "event": event_doc}
    except Exception as e:
        logger.error(f"Error creating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/events/{event_id}")
async def get_calendar_event(event_id: str):
    """Get a specific calendar event"""
    event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event


@router.put("/events/{event_id}")
async def update_calendar_event(event_id: str, update: CalendarEventUpdate):
    """Update a calendar event"""
    try:
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        for field, value in update.model_dump().items():
            if value is not None:
                if isinstance(value, datetime):
                    update_data[field] = value.isoformat()
                else:
                    update_data[field] = value
        
        result = await db.calendar_events.update_one({"id": event_id}, {"$set": update_data})
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = await db.calendar_events.find_one({"id": event_id}, {"_id": 0})
        return {"success": True, "event": event}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/events/{event_id}")
async def delete_calendar_event(event_id: str):
    """Delete a calendar event"""
    result = await db.calendar_events.delete_one({"id": event_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return {"success": True, "message": "Event deleted"}


@router.post("/events/{event_id}/respond")
async def respond_to_event(event_id: str, user_id: str, response: EventResponse):
    """Respond to a calendar event invitation"""
    try:
        event = await db.calendar_events.find_one({"id": event_id})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Update attendee response
        attendees = event.get("attendees", [])
        attendee_found = False
        
        for attendee in attendees:
            if attendee.get("user_id") == user_id:
                attendee["response"] = response.response
                attendee["responded_at"] = datetime.now(timezone.utc).isoformat()
                attendee_found = True
                break
        
        if not attendee_found:
            attendees.append({
                "user_id": user_id,
                "response": response.response,
                "responded_at": datetime.now(timezone.utc).isoformat()
            })
        
        await db.calendar_events.update_one(
            {"id": event_id},
            {"$set": {"attendees": attendees, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "message": f"Response '{response.response}' recorded"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to event: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/upcoming")
async def get_upcoming_events(user_id: str, days: int = 7, limit: int = 10):
    """Get upcoming events for a user"""
    try:
        now = datetime.now(timezone.utc)
        end_date = now + timedelta(days=days)
        
        events = await db.calendar_events.find(
            {
                "$or": [
                    {"organizer_id": user_id},
                    {"attendees.user_id": user_id}
                ],
                "start_time": {
                    "$gte": now.isoformat(),
                    "$lte": end_date.isoformat()
                },
                "status": {"$ne": "cancelled"}
            },
            {"_id": 0}
        ).sort("start_time", 1).limit(limit).to_list(limit)
        
        return {"events": events, "count": len(events)}
    except Exception as e:
        logger.error(f"Error fetching upcoming events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Meeting Reminder Scheduler ==============

async def send_meeting_reminders():
    """Check for upcoming events and send 10-min and 5-min reminders via all channels."""
    import asyncio
    try:
        now = datetime.now(timezone.utc)
        window_end = now + timedelta(minutes=12)

        events = await db.calendar_events.find(
            {
                "start_time": {"$gte": now.isoformat(), "$lte": window_end.isoformat()},
                "status": {"$ne": "cancelled"},
            },
            {"_id": 0}
        ).to_list(100)

        for event in events:
            try:
                start_str = event.get("start_time", "")
                start_time = datetime.fromisoformat(start_str.replace("Z", "+00:00"))
                if start_time.tzinfo is None:
                    start_time = start_time.replace(tzinfo=timezone.utc)
                mins_until = (start_time - now).total_seconds() / 60

                reminders = event.get("reminders", DEFAULT_REMINDERS)
                event_id = event.get("id")
                title = event.get("title", "Meeting")
                organizer_id = event.get("organizer_id")
                attendees = event.get("attendees", [])

                # Collect all user IDs to notify (organizer + accepted attendees)
                notify_ids = set()
                if organizer_id:
                    notify_ids.add(organizer_id)
                for att in attendees:
                    status = att.get("status", "").lower()
                    if status in ("accepted", "pending"):
                        uid = att.get("user_id")
                        if uid:
                            notify_ids.add(uid)

                for reminder in reminders:
                    mins_before = reminder.get("minutes_before", 10)
                    sent_key = f"sent_{mins_before}"
                    channels = reminder.get("channels", ["in_app", "email", "push"])

                    if reminder.get(sent_key):
                        continue

                    # Check if we're within the reminder window (±1 min tolerance)
                    if abs(mins_until - mins_before) <= 1.5:
                        logger.info(f"Sending {mins_before}-min reminder for event '{title}' ({event_id}) to {len(notify_ids)} users")

                        for user_id in notify_ids:
                            reminder_body = f"'{title}' starts in {mins_before} minutes"
                            meeting_link = event.get("meeting_link", "")

                            # In-app notification via SSE
                            if "in_app" in channels:
                                try:
                                    from routes.chat import sse_manager
                                    await sse_manager.send_to_user(user_id, "meeting_reminder", {
                                        "event_id": event_id,
                                        "title": title,
                                        "minutes_before": mins_before,
                                        "start_time": start_str,
                                        "meeting_link": meeting_link,
                                        "message": reminder_body,
                                    })
                                except Exception as e:
                                    logger.error(f"SSE reminder failed for {user_id}: {e}")

                            # Push notification
                            if "push" in channels:
                                try:
                                    from routes.push_notifications import send_push_to_user
                                    await send_push_to_user(
                                        user_id=user_id,
                                        title=f"Meeting in {mins_before} min",
                                        body=reminder_body,
                                        url=meeting_link or "/calendar",
                                    )
                                except Exception as e:
                                    logger.error(f"Push reminder failed for {user_id}: {e}")

                            # Email notification
                            if "email" in channels:
                                try:
                                    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "name": 1})
                                    if user_doc and user_doc.get("email"):
                                        await _send_reminder_email(
                                            email=user_doc["email"],
                                            user_name=user_doc.get("name", ""),
                                            event_title=title,
                                            minutes_before=mins_before,
                                            start_time=start_str,
                                            meeting_link=meeting_link,
                                        )
                                except Exception as e:
                                    logger.error(f"Email reminder failed for {user_id}: {e}")

                        # Mark this reminder as sent
                        await db.calendar_events.update_one(
                            {"id": event_id, f"reminders.minutes_before": mins_before},
                            {"$set": {f"reminders.$.{sent_key}": True}}
                        )

            except Exception as e:
                logger.error(f"Error processing reminder for event {event.get('id')}: {e}")

    except Exception as e:
        logger.error(f"Meeting reminder scheduler error: {e}")


async def _send_reminder_email(email: str, user_name: str, event_title: str, minutes_before: int, start_time: str, meeting_link: str):
    """Send a meeting reminder email via Resend"""
    import asyncio as aio
    import resend
    import os
    from config import SENDER_EMAIL

    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    if not resend.api_key:
        return

    # Format start time
    try:
        dt = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
        formatted_time = dt.strftime("%I:%M %p, %B %d, %Y")
    except Exception:
        formatted_time = start_time

    join_btn = ""
    if meeting_link:
        join_btn = f'<a href="{meeting_link}" style="display:inline-block;padding:12px 24px;background-color:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:600;margin-top:16px;">Join Meeting</a>'

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="text-align:center;padding:20px 0;">
            <h2 style="color:#7c3aed;margin:0;">Meeting Reminder</h2>
        </div>
        <div style="background:#f5f3ff;border-radius:12px;padding:24px;margin:16px 0;">
            <p style="color:#4b5563;font-size:15px;">Hi {user_name or 'there'},</p>
            <p style="color:#1f2937;font-size:18px;font-weight:600;">"{event_title}" starts in {minutes_before} minutes</p>
            <p style="color:#6b7280;font-size:14px;">Scheduled for: {formatted_time}</p>
            <div style="text-align:center;">{join_btn}</div>
        </div>
        <div style="text-align:center;padding:16px 0;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;">Munal AI Calendar Reminder</p>
        </div>
    </div>
    """

    params = {
        "from": f"Munal AI <{SENDER_EMAIL}>",
        "to": [email],
        "subject": f"Reminder: {event_title} in {minutes_before} min",
        "html": html,
    }

    try:
        await aio.to_thread(resend.Emails.send, params)
        logger.info(f"Reminder email sent to {email} for '{event_title}'")
    except Exception as e:
        logger.error(f"Reminder email failed to {email}: {e}")
