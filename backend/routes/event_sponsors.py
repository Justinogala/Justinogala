"""
Event Sponsors routes - CRUD for sponsors attached to events.
Managed by Super Admin from the admin panel.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel
import uuid

from config import db, logger
from routes.auth_helpers import get_current_user

router = APIRouter(prefix="/admin/events", tags=["Event Sponsors"])


# ============== Models ==============

class SponsorCreate(BaseModel):
    name: str
    logo_url: str = ""
    website: str = ""
    tier: str = "silver"  # platinum, gold, silver, bronze, community
    description: str = ""

TIER_ORDER = {"platinum": 0, "gold": 1, "silver": 2, "bronze": 3, "community": 4}
VALID_TIERS = set(TIER_ORDER.keys())


class SponsorUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None
    tier: Optional[str] = None
    description: Optional[str] = None


# ============== Sponsor CRUD ==============

@router.get("/{event_id}/sponsors")
async def list_sponsors(event_id: str):
    """List all sponsors for an event (public)"""
    sponsors = []
    async for s in db.event_sponsors.find(
        {"event_id": event_id, "deleted": {"$ne": True}},
        {"_id": 0}
    ).sort("order", 1):
        sponsors.append(s)
    return {"sponsors": sponsors}


@router.post("/{event_id}/sponsors")
async def add_sponsor(event_id: str, sponsor: SponsorCreate, user=Depends(get_current_user)):
    """Add a sponsor to an event"""
    # Role check
    user_role = (user.get("role") or "").lower().replace(" ", "_")
    if user_role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    if sponsor.tier not in VALID_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(VALID_TIERS)}")

    event = await db.events.find_one({"id": event_id, "deleted": {"$ne": True}})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get current max order
    last = await db.event_sponsors.find_one(
        {"event_id": event_id, "deleted": {"$ne": True}},
        sort=[("order", -1)]
    )
    next_order = (last.get("order", 0) + 1) if last else 0

    doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        **sponsor.dict(),
        "order": next_order,
        "tier_order": TIER_ORDER.get(sponsor.tier, 5),
        "deleted": False,
        "created_by": user.get("id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.event_sponsors.insert_one(doc)
    doc.pop("_id", None)
    logger.info(f"Sponsor added to event {event_id}: {sponsor.name}")
    return {"success": True, "sponsor": doc}


@router.put("/{event_id}/sponsors/{sponsor_id}")
async def update_sponsor(event_id: str, sponsor_id: str, update: SponsorUpdate, user=Depends(get_current_user)):
    """Update a sponsor"""
    user_role = (user.get("role") or "").lower().replace(" ", "_")
    if user_role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    existing = await db.event_sponsors.find_one({"id": sponsor_id, "event_id": event_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Sponsor not found")

    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if "tier" in update_data:
        if update_data["tier"] not in VALID_TIERS:
            raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(VALID_TIERS)}")
        update_data["tier_order"] = TIER_ORDER.get(update_data["tier"], 5)

    await db.event_sponsors.update_one({"id": sponsor_id}, {"$set": update_data})
    updated = await db.event_sponsors.find_one({"id": sponsor_id}, {"_id": 0})
    return {"success": True, "sponsor": updated}


@router.delete("/{event_id}/sponsors/{sponsor_id}")
async def delete_sponsor(event_id: str, sponsor_id: str, user=Depends(get_current_user)):
    """Delete a sponsor"""
    user_role = (user.get("role") or "").lower().replace(" ", "_")
    if user_role not in ("super_admin", "admin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.event_sponsors.update_one(
        {"id": sponsor_id, "event_id": event_id},
        {"$set": {"deleted": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Sponsor not found")
    return {"success": True}
