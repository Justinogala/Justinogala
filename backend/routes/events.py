"""
Events routes - CRUD for events, applications, gallery, reviews, discussions.
"""
from fastapi import APIRouter, HTTPException, Query, Request, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
import uuid, os

from config import db, logger
from security import limiter
from routes.event_notifications import send_host_proposal_confirmation, send_host_proposal_admin_notification
from routes.auth_helpers import get_optional_user

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


class GalleryItem(BaseModel):
    type: str = "photo"
    url: str
    caption: str = ""
    uploaded_by: str = ""


class ReviewCreate(BaseModel):
    name: str = "Anonymous"
    email: str
    rating: int = Field(ge=1, le=5, default=5)
    comment: str = ""


class DiscussionPost(BaseModel):
    author_name: str = "Anonymous"
    author_email: str = ""
    content: str = Field(min_length=1)


class DiscussionReply(BaseModel):
    author_name: str = "Anonymous"
    author_email: str = ""
    content: str = Field(min_length=1)


class HostProposal(BaseModel):
    name: str
    email: str
    event_title: str
    description: str = ""
    preferred_date: str = ""
    event_format: str = ""
    expected_attendees: str = ""


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


@router.post("/host-proposal")
@limiter.limit("5/minute")
async def submit_host_proposal(request: Request, proposal: HostProposal):
    """Submit a proposal to host an event"""
    doc = {
        "id": str(uuid.uuid4()),
        **proposal.dict(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_host_proposals.insert_one(doc)
    logger.info(f"Host proposal submitted: {proposal.event_title} by {proposal.email}")

    # Send email notifications (non-blocking)
    import asyncio
    asyncio.create_task(send_host_proposal_confirmation(proposal.email, proposal.name, proposal.event_title))
    asyncio.create_task(send_host_proposal_admin_notification(
        proposal.name, proposal.email, proposal.event_title,
        proposal.description, proposal.event_format, proposal.expected_attendees
    ))

    return {"success": True, "proposal_id": doc["id"]}


@router.get("/{event_id}")
async def get_event(event_id: str):
    """Get single event detail"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{event_id}/livestream-access")
async def check_livestream_access(event_id: str, user=Depends(get_optional_user)):
    """Check if user has access to event livestream (login + payment for paid events)"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "price": 1, "stream_url": 1, "is_live": 1, "stream_platform": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not event.get("stream_url"):
        return {"has_access": False, "reason": "no_stream"}

    price = event.get("price", "Free")
    is_paid = price and price != "Free"

    if not user:
        return {"has_access": False, "reason": "login_required"}

    user_id = user.get("id")

    if is_paid:
        user_email = user.get("email", "")
        paid = await db.event_payments.find_one(
            {"event_id": event_id, "email": user_email, "status": "paid"}
        )
        if not paid:
            sub = await db.subscriptions.find_one(
                {"user_id": user_id, "status": "active", "plan": {"$in": ["pro", "enterprise"]}}
            )
            if not sub:
                return {"has_access": False, "reason": "payment_required", "price": price}

    return {
        "has_access": True,
        "stream_url": event.get("stream_url"),
        "is_live": event.get("is_live", False),
        "stream_platform": event.get("stream_platform", ""),
    }


@router.get("/{event_id}/sponsors")
async def get_event_sponsors(event_id: str):
    """Get sponsors for an event (public)"""
    sponsors = []
    async for s in db.event_sponsors.find(
        {"event_id": event_id, "deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("tier_order", 1):
        sponsors.append(s)
    return {"sponsors": sponsors}


@router.get("/programs/featured")
async def get_featured_programs():
    """Get featured programs/courses from events marked as featured or recurring"""
    now = datetime.now(timezone.utc).isoformat()
    programs = await db.events.find(
        {
            "deleted": {"$ne": True},
            "event_format": {"$in": ["Courses", "Bootcamps", "Certifications", "Workshops"]},
            "date": {"$gte": now},
        },
        {"_id": 0}
    ).sort("date", 1).limit(6).to_list(6)

    # If not enough programs, get any upcoming events
    if len(programs) < 4:
        extra = await db.events.find(
            {"deleted": {"$ne": True}, "date": {"$gte": now}, "id": {"$nin": [p["id"] for p in programs]}},
            {"_id": 0}
        ).sort("registered", -1).limit(6 - len(programs)).to_list(6 - len(programs))
        programs.extend(extra)

    return {"programs": programs}


@router.post("/{event_id}/apply")
@limiter.limit("10/minute")
async def apply_to_event(request: Request, event_id: str, application: EventApplication):
    """Submit application for an event. For paid events, creates Stripe checkout."""
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

    # Check if paid event — create Stripe checkout
    price_str = event.get("price", "Free")
    is_paid = price_str and price_str != "Free"
    checkout_url = None

    if is_paid:
        try:
            amount = int(float(price_str.replace("$", "").replace(",", "").strip()) * 100)
            if amount > 0:
                settings = await db.admin_settings.find_one({"category": "stripe"})
                stripe_key = settings.get("api_key", "") if settings else ""
                if stripe_key:
                    import stripe
                    stripe.api_key = stripe_key
                    frontend_url = os.environ.get("FRONTEND_URL", "https://munal.ai")
                    payment_id = str(uuid.uuid4())

                    session = stripe.checkout.Session.create(
                        payment_method_types=["card"],
                        line_items=[{
                            "price_data": {
                                "currency": "usd",
                                "product_data": {
                                    "name": event["title"],
                                    "description": f"Event Registration - {event.get('event_format', 'Event')}",
                                },
                                "unit_amount": amount,
                            },
                            "quantity": 1,
                        }],
                        mode="payment",
                        success_url=f"{frontend_url}/events/{event_id}?payment=success&session_id={{CHECKOUT_SESSION_ID}}",
                        cancel_url=f"{frontend_url}/events/{event_id}?payment=cancelled",
                        customer_email=application.email,
                        metadata={
                            "event_id": event_id,
                            "payment_id": payment_id,
                            "application_id": app_doc["id"],
                            "applicant_name": application.name,
                        }
                    )

                    await db.event_payments.insert_one({
                        "id": payment_id,
                        "event_id": event_id,
                        "application_id": app_doc["id"],
                        "email": application.email,
                        "name": application.name,
                        "amount": amount,
                        "currency": "usd",
                        "stripe_session_id": session.id,
                        "status": "pending",
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })

                    checkout_url = session.url
                    await db.event_applications.update_one(
                        {"id": app_doc["id"]},
                        {"$set": {"payment_status": "pending", "payment_id": payment_id}}
                    )
        except Exception as e:
            logger.error(f"Stripe checkout for event {event_id} failed: {e}")

    return {
        "success": True,
        "application_id": app_doc["id"],
        "status": "submitted",
        "is_paid": is_paid,
        "checkout_url": checkout_url,
        "price": price_str if is_paid else None,
    }


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
@limiter.limit("20/minute")
async def add_gallery_item(request: Request, event_id: str, item: GalleryItem):
    """Add a gallery item (photo/video URL)"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    gallery_item = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "type": item.type,
        "url": item.url,
        "caption": item.caption,
        "uploaded_by": item.uploaded_by,
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
@limiter.limit("10/minute")
async def add_event_review(request: Request, event_id: str, review: ReviewCreate):
    """Submit a review for an event"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    email = review.email.lower().strip()
    existing = await db.event_reviews.find_one({"event_id": event_id, "email": email})
    if existing:
        raise HTTPException(status_code=400, detail="You have already reviewed this event")

    review_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "name": review.name,
        "email": email,
        "rating": review.rating,
        "comment": review.comment,
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
@limiter.limit("20/minute")
async def add_discussion_post(request: Request, event_id: str, post: DiscussionPost):
    """Add a discussion post"""
    event = await db.events.find_one({"id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    post_doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "author_name": post.author_name,
        "author_email": post.author_email,
        "content": post.content,
        "replies": [],
        "likes": 0,
        "deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.event_discussions.insert_one(post_doc)
    return {"success": True, "post": {k: v for k, v in post_doc.items() if k != "_id"}}


@router.post("/{event_id}/discussions/{post_id}/reply")
@limiter.limit("20/minute")
async def reply_to_discussion(request: Request, event_id: str, post_id: str, reply: DiscussionReply):
    """Reply to a discussion post"""
    reply_doc = {
        "id": str(uuid.uuid4()),
        "author_name": reply.author_name,
        "author_email": reply.author_email,
        "content": reply.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.event_discussions.update_one(
        {"id": post_id, "event_id": event_id},
        {"$push": {"replies": reply_doc}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"success": True, "reply": reply_doc}
