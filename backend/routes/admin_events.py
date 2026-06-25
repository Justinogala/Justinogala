"""
Admin Events routes - CRUD, application management, analytics, CSV export, QR check-in, certificates.
"""
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid
import io
import csv
import json
import hashlib

from config import db, logger
from routes.auth_helpers import get_current_user

router = APIRouter(prefix="/admin/events", tags=["Admin Events"])


# ============== Models ==============

class EventCreate(BaseModel):
    title: str
    description: str = ""
    category: str = "AI"
    event_type: str = "Virtual"
    date: str
    end_date: str = ""
    time: str = ""
    duration: str = ""
    location: str = "Online (Jizira, Munal AI)"
    status: str = "registration_open"
    price: str = "Free"
    seats: int = 100
    banner: str = ""
    speakers: list = []
    agenda: list = []
    faqs: list = []
    tags: list = []
    deadline: str = ""


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    event_type: Optional[str] = None
    date: Optional[str] = None
    end_date: Optional[str] = None
    time: Optional[str] = None
    duration: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    price: Optional[str] = None
    seats: Optional[int] = None
    banner: Optional[str] = None
    speakers: Optional[list] = None
    agenda: Optional[list] = None
    faqs: Optional[list] = None
    tags: Optional[list] = None
    deadline: Optional[str] = None


class ApplicationAction(BaseModel):
    status: str  # accepted, rejected, waitlisted


# ============== Event CRUD ==============

@router.post("")
async def create_event(event: EventCreate, user=Depends(get_current_user)):
    """Create a new event"""
    event_doc = {
        "id": str(uuid.uuid4()),
        **event.dict(),
        "registered": 0,
        "deleted": False,
        "created_by": user.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.events.insert_one(event_doc)
    result = {k: v for k, v in event_doc.items() if k != "_id"}
    logger.info(f"Event created: {event_doc['id']} by {user.get('email')}")
    return {"success": True, "event": result}


@router.put("/{event_id}")
async def update_event(event_id: str, update: EventUpdate, user=Depends(get_current_user)):
    """Update an event"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.events.update_one({"id": event_id}, {"$set": update_data})
    updated = await db.events.find_one({"id": event_id}, {"_id": 0})
    logger.info(f"Event updated: {event_id} by {user.get('email')}")
    return {"success": True, "event": updated}


@router.delete("/{event_id}")
async def delete_event(event_id: str, user=Depends(get_current_user)):
    """Soft delete an event"""
    result = await db.events.update_one(
        {"id": event_id},
        {"$set": {"deleted": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    logger.info(f"Event deleted: {event_id} by {user.get('email')}")
    return {"success": True, "message": "Event deleted"}


@router.post("/{event_id}/duplicate")
async def duplicate_event(event_id: str, user=Depends(get_current_user)):
    """Duplicate an event"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    new_event = {**event}
    new_event["id"] = str(uuid.uuid4())
    new_event["title"] = f"{event['title']} (Copy)"
    new_event["registered"] = 0
    new_event["status"] = "draft"
    new_event["deleted"] = False
    new_event["created_by"] = user.get("id")
    new_event["created_at"] = datetime.now(timezone.utc).isoformat()
    new_event["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.events.insert_one(new_event)
    result = {k: v for k, v in new_event.items() if k != "_id"}
    logger.info(f"Event duplicated: {event_id} -> {new_event['id']}")
    return {"success": True, "event": result}


# ============== Application Management ==============

@router.get("/{event_id}/applications")
async def list_applications(event_id: str, status: Optional[str] = None, user=Depends(get_current_user)):
    """List all applications for an event"""
    query = {"event_id": event_id}
    if status:
        query["status"] = status

    applications = await db.event_applications.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    total = len(applications)
    stats = {}
    for app in applications:
        s = app.get("status", "submitted")
        stats[s] = stats.get(s, 0) + 1

    return {"applications": applications, "total": total, "stats": stats}


@router.put("/applications/{application_id}")
async def update_application(application_id: str, action: ApplicationAction, user=Depends(get_current_user)):
    """Update application status (approve/reject/waitlist)"""
    if action.status not in ["accepted", "rejected", "waitlisted", "submitted"]:
        raise HTTPException(status_code=400, detail="Invalid status")

    result = await db.event_applications.update_one(
        {"id": application_id},
        {"$set": {"status": action.status, "reviewed_by": user.get("email"), "reviewed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")

    return {"success": True, "status": action.status}


@router.put("/applications/bulk-action")
async def bulk_update_applications(application_ids: List[str], action: ApplicationAction, user=Depends(get_current_user)):
    """Bulk update application statuses"""
    result = await db.event_applications.update_many(
        {"id": {"$in": application_ids}},
        {"$set": {"status": action.status, "reviewed_by": user.get("email"), "reviewed_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "modified": result.modified_count}


# ============== CSV Export ==============

@router.get("/{event_id}/applications/export")
async def export_applications_csv(event_id: str, user=Depends(get_current_user)):
    """Export applications as CSV"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "title": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    applications = await db.event_applications.find({"event_id": event_id}, {"_id": 0}).to_list(10000)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["First Name", "Last Name", "Email", "Phone", "Company", "Position", "Country", "LinkedIn", "Industry", "Years Experience", "Why Attend", "Status", "Applied At"])

    for app in applications:
        writer.writerow([
            app.get("first_name", ""), app.get("last_name", ""), app.get("email", ""),
            app.get("phone", ""), app.get("company", ""), app.get("position", ""),
            app.get("country", ""), app.get("linkedin", ""), app.get("industry", ""),
            app.get("years_experience", ""), app.get("why_attend", ""),
            app.get("status", ""), app.get("created_at", "")
        ])

    output.seek(0)
    filename = f"applications_{event.get('title', 'event').replace(' ', '_')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ============== Analytics ==============

@router.get("/analytics/overview")
async def events_analytics(user=Depends(get_current_user)):
    """Get events analytics overview"""
    total_events = await db.events.count_documents({"deleted": {"$ne": True}})
    total_apps = await db.event_applications.count_documents({})
    
    # Status breakdown
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    app_stats = {}
    async for doc in db.event_applications.aggregate(pipeline):
        app_stats[doc["_id"]] = doc["count"]
    
    # Events by category
    cat_pipeline = [
        {"$match": {"deleted": {"$ne": True}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    categories = {}
    async for doc in db.events.aggregate(cat_pipeline):
        categories[doc["_id"]] = doc["count"]
    
    # Total registrations
    reg_pipeline = [
        {"$match": {"deleted": {"$ne": True}}},
        {"$group": {"_id": None, "total_registered": {"$sum": "$registered"}, "total_seats": {"$sum": "$seats"}}}
    ]
    reg_stats = {"total_registered": 0, "total_seats": 0}
    async for doc in db.events.aggregate(reg_pipeline):
        reg_stats = {"total_registered": doc["total_registered"], "total_seats": doc["total_seats"]}
    
    # Top events by registration
    top_events = await db.events.find(
        {"deleted": {"$ne": True}},
        {"_id": 0, "id": 1, "title": 1, "registered": 1, "seats": 1, "category": 1}
    ).sort("registered", -1).to_list(5)

    return {
        "total_events": total_events,
        "total_applications": total_apps,
        "total_registered": reg_stats["total_registered"],
        "total_seats": reg_stats["total_seats"],
        "fill_rate": round((reg_stats["total_registered"] / max(reg_stats["total_seats"], 1)) * 100, 1),
        "application_stats": app_stats,
        "categories": categories,
        "top_events": top_events
    }


# ============== QR Check-in ==============

@router.get("/{event_id}/qr-code")
async def generate_qr_data(event_id: str, user=Depends(get_current_user)):
    """Generate QR code data for event check-in"""
    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}}, {"_id": 0, "id": 1, "title": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    checkin_url = f"/events/{event_id}/checkin"
    qr_token = hashlib.sha256(f"{event_id}-checkin-{event['title']}".encode()).hexdigest()[:16]
    
    return {"event_id": event_id, "title": event["title"], "checkin_url": checkin_url, "qr_token": qr_token}


@router.post("/{event_id}/checkin")
async def checkin_attendee(event_id: str, email: str, user=Depends(get_current_user)):
    """Check in an attendee"""
    app = await db.event_applications.find_one({"event_id": event_id, "email": email})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    await db.event_applications.update_one(
        {"id": app["id"]},
        {"$set": {"checked_in": True, "checked_in_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "name": f"{app.get('first_name', '')} {app.get('last_name', '')}", "status": app.get("status")}


@router.get("/{event_id}/attendance")
async def get_attendance(event_id: str, user=Depends(get_current_user)):
    """Get attendance report for an event"""
    apps = await db.event_applications.find({"event_id": event_id}, {"_id": 0}).to_list(10000)
    total = len(apps)
    checked_in = sum(1 for a in apps if a.get("checked_in"))
    accepted = sum(1 for a in apps if a.get("status") == "accepted")
    
    return {
        "event_id": event_id,
        "total_applications": total,
        "accepted": accepted,
        "checked_in": checked_in,
        "attendance_rate": round((checked_in / max(accepted, 1)) * 100, 1),
        "attendees": [a for a in apps if a.get("checked_in")]
    }


# ============== Certificates ==============

@router.post("/{event_id}/certificates/generate")
async def generate_certificates(event_id: str, user=Depends(get_current_user)):
    """Generate certificates for all checked-in attendees"""
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "title": 1, "date": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    attendees = await db.event_applications.find(
        {"event_id": event_id, "checked_in": True},
        {"_id": 0}
    ).to_list(10000)
    
    certificates = []
    for attendee in attendees:
        cert_id = str(uuid.uuid4())[:8].upper()
        cert = {
            "id": cert_id,
            "event_id": event_id,
            "event_title": event["title"],
            "event_date": event.get("date", ""),
            "attendee_name": f"{attendee.get('first_name', '')} {attendee.get('last_name', '')}",
            "attendee_email": attendee.get("email"),
            "issued_at": datetime.now(timezone.utc).isoformat(),
            "verification_code": hashlib.sha256(f"{cert_id}-{event_id}-{attendee.get('email')}".encode()).hexdigest()[:12].upper()
        }
        certificates.append(cert)
    
    if certificates:
        # Insert without _id field — let MongoDB auto-generate ObjectId
        await db.event_certificates.insert_many([{k: v for k, v in c.items() if k != '_id'} for c in certificates])
        
        # Update applications with certificate IDs
        for cert in certificates:
            await db.event_applications.update_one(
                {"event_id": event_id, "email": cert["attendee_email"]},
                {"$set": {"certificate_id": cert["id"]}}
            )
    
    return {"success": True, "certificates_generated": len(certificates), "certificates": certificates}


@router.get("/certificates/{cert_id}/verify")
async def verify_certificate(cert_id: str):
    """Verify a certificate (public endpoint)"""
    cert = await db.event_certificates.find_one({"id": cert_id}, {"_id": 0})
    if not cert:
        raise HTTPException(status_code=404, detail="Certificate not found")
    return {"valid": True, "certificate": cert}
