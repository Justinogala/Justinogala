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
        # Filter by event_format field
        query["event_format"] = event_type
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


# ============== Gallery ==============

@router.get("/{event_id}/gallery")
async def get_event_gallery(event_id: str):
    """Get gallery items for an event"""
    items = await db.event_gallery.find({"event_id": event_id, "deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"items": items, "count": len(items)}


@router.post("/{event_id}/gallery")
async def add_gallery_item(event_id: str, item: dict):
    """Add a gallery item (photo/video URL)"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    gallery_item = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "type": item.get("type", "photo"),
        "url": item.get("url", ""),
        "caption": item.get("caption", ""),
        "uploaded_by": item.get("uploaded_by", ""),
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_gallery.insert_one(gallery_item)
    return {"success": True, "item": {k: v for k, v in gallery_item.items() if k != "_id"}}


# ============== Ratings & Reviews ==============

@router.get("/{event_id}/reviews")
async def get_event_reviews(event_id: str):
    """Get reviews for an event"""
    reviews = await db.event_reviews.find({"event_id": event_id, "deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    avg_rating = 0
    if reviews:
        avg_rating = round(sum(r.get("rating", 0) for r in reviews) / len(reviews), 1)
    return {"reviews": reviews, "count": len(reviews), "average_rating": avg_rating}


@router.post("/{event_id}/reviews")
async def add_event_review(event_id: str, review: dict):
    """Submit a review for an event"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    email = review.get("email", "")
    existing = await db.event_reviews.find_one({"event_id": event_id, "email": email})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this event")

    review_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "name": review.get("name", "Anonymous"),
        "email": email,
        "rating": min(max(int(review.get("rating", 5)), 1), 5),
        "comment": review.get("comment", ""),
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_reviews.insert_one(review_doc)
    return {"success": True, "review": {k: v for k, v in review_doc.items() if k != "_id"}}


# ============== Community Discussion ==============

@router.get("/{event_id}/discussions")
async def get_event_discussions(event_id: str):
    """Get discussion posts for an event"""
    posts = await db.event_discussions.find({"event_id": event_id, "deleted": {"$ne": True}}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return {"posts": posts, "count": len(posts)}


@router.post("/{event_id}/discussions")
async def add_discussion_post(event_id: str, post: dict):
    """Add a discussion post"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    post_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "author_name": post.get("author_name", "Anonymous"),
        "author_email": post.get("author_email", ""),
        "content": post.get("content", ""),
        "replies": [],
        "likes": 0,
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_discussions.insert_one(post_doc)
    return {"success": True, "post": {k: v for k, v in post_doc.items() if k != "_id"}}


@router.post("/{event_id}/discussions/{post_id}/reply")
async def reply_to_discussion(event_id: str, post_id: str, reply: dict):
    """Reply to a discussion post"""
    reply_doc = {
        "id": str(uuid.uuid4()),
        "author_name": reply.get("author_name", "Anonymous"),
        "author_email": reply.get("author_email", ""),
        "content": reply.get("content", ""),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.event_discussions.update_one(
        {"id": post_id, "event_id": event_id},
        {"$push": {"replies": reply_doc}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "reply": reply_doc}
