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
    start_time: datetime
    end_time: datetime
    organizer_id: str
    organizer_name: Optional[str] = None
    attendees: List[dict] = []
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    reminders: List[dict] = []

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[dict]] = None
    location: Optional[str] = None
    status: Optional[str] = None

class EventResponse(BaseModel):
    response: str  # accepted, declined, tentative


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
        meeting_link = f"/workspace/meeting/{event_id}"
        
        event_doc = {
            "id": event_id,
            "title": event.title,
            "description": event.description,
            "start_time": event.start_time.isoformat() if isinstance(event.start_time, datetime) else event.start_time,
            "end_time": event.end_time.isoformat() if isinstance(event.end_time, datetime) else event.end_time,
            "organizer_id": event.organizer_id,
            "organizer_name": event.organizer_name,
            "attendees": event.attendees,
            "location": event.location,
            "meeting_link": meeting_link,
            "is_recurring": event.is_recurring,
            "recurrence_rule": event.recurrence_rule,
            "reminders": event.reminders,
            "status": "scheduled",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.calendar_events.insert_one(event_doc)
        
        if "_id" in event_doc:
            del event_doc["_id"]
        
        logger.info(f"Event {event_id} created by {event.organizer_id}")
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
