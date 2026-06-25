"""
Events routes - CRUD for events, applications, and public listing.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid

from config import db, logger

router = APIRouter(prefix="/events", tags=["Events"])


# ============== Models ==============

class EventApplication(BaseModel):
    first_name: str
    last_name: str
    email: str
    phone: str = ""
    company: str = ""
    position: str = ""
    country: str = ""
    linkedin: str = ""
    portfolio: str = ""
    years_experience: str = ""
    industry: str = ""
    why_attend: str = ""
    accept_terms: bool = True


# ============== Public Routes ==============

@router.get("")
async def list_events(
    status: Optional[str] = None,
    category: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    tab: str = "upcoming",
    limit: int = 50,
    offset: int = 0
):
    """List events with filters"""
    limit = min(max(limit, 1), 200)
    now = datetime.now(timezone.utc).isoformat()
    query = {"deleted": {"$ne": True}}

    if tab == "upcoming":
        query["date"] = {"$gte": now}
        query["status"] = {"$nin": ["cancelled", "completed"]}
    elif tab == "ongoing":
        query["status"] = "ongoing"
    elif tab == "past":
        query["$or"] = [{"date": {"$lt": now}}, {"status": {"$in": ["completed"]}}]

    if category and category != "All":
        query["category"] = category
    if event_type and event_type != "All":
        query["event_type"] = event_type
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
            {"speakers.name": {"$regex": search, "$options": "i"}}
        ]

    total = await db.events.count_documents(query)
    events = await db.events.find(query, {"_id": 0}).sort("date", 1 if tab == "upcoming" else -1).skip(offset).limit(limit).to_list(limit)

    return {"events": events, "total": total, "count": len(events)}


@router.get("/{event_id}")
async def get_event(event_id: str):
    """Get single event detail"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.post("/{event_id}/apply")
async def apply_to_event(event_id: str, application: EventApplication):
    """Submit application for an event"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = await db.event_applications.find_one({"event_id": event_id, "email": application.email})
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied to this event")

    app_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "status": "submitted",
        **application.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    await db.event_applications.insert_one(app_doc)

    await db.events.update_one({"id": event_id}, {"$inc": {"registered": 1}})

    logger.info(f"Application submitted for event {event_id} by {application.email}")
    return {"success": True, "application_id": app_doc["id"], "status": "submitted"}


@router.get("/{event_id}/applications/count")
async def get_application_count(event_id: str):
    """Get number of applications for an event"""
    count = await db.event_applications.count_documents({"event_id": event_id})
    return {"count": count}
