"""
Software Update / Version Management API
- Admins: Create, edit, delete version entries
- Users: Check for updates, view changelog, acknowledge updates
"""
import uuid
import json
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Body
from pydantic import BaseModel
from typing import Optional

from .auth import get_current_user
from config import db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/updates", tags=["updates"])

CURRENT_APP_VERSION = "2.1.0"


class VersionCreate(BaseModel):
    version: str
    title: str
    release_notes: str
    is_critical: bool = False


class VersionUpdate(BaseModel):
    version: Optional[str] = None
    title: Optional[str] = None
    release_notes: Optional[str] = None
    is_critical: Optional[bool] = None


# ============== User Endpoints ==============

@router.get("/check")
async def check_for_updates(user: dict = Depends(get_current_user)):
    """Check if a newer version is available compared to user's last seen version."""
    user_doc = await db.users.find_one({"id": user["id"]}, {"_id": 0, "last_seen_version": 1})
    last_seen = (user_doc or {}).get("last_seen_version", "0.0.0")

    latest = await db.app_versions.find_one(
        {},
        {"_id": 0},
        sort=[("created_at", -1)]
    )

    if not latest:
        return {
            "update_available": False,
            "current_version": CURRENT_APP_VERSION,
            "last_seen_version": last_seen,
            "latest_version": None,
        }

    update_available = _compare_versions(latest["version"], last_seen) > 0

    return {
        "update_available": update_available,
        "current_version": CURRENT_APP_VERSION,
        "last_seen_version": last_seen,
        "latest_version": {
            "id": latest["id"],
            "version": latest["version"],
            "title": latest["title"],
            "release_notes": latest["release_notes"],
            "is_critical": latest.get("is_critical", False),
            "release_date": latest["created_at"],
        }
    }


@router.get("/changelog")
async def get_changelog(user: dict = Depends(get_current_user)):
    """Get all version entries (changelog)."""
    versions = await db.app_versions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=50)
    return versions


@router.post("/acknowledge")
async def acknowledge_update(user: dict = Depends(get_current_user)):
    """Mark the latest version as seen by this user."""
    latest = await db.app_versions.find_one(
        {},
        {"_id": 0, "version": 1},
        sort=[("created_at", -1)]
    )
    if latest:
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_seen_version": latest["version"]}}
        )
    return {"status": "acknowledged", "version": latest["version"] if latest else CURRENT_APP_VERSION}


# ============== Admin Endpoints ==============

@router.get("/admin/versions")
async def admin_list_versions(user: dict = Depends(get_current_user)):
    """Admin: List all versions."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        raise HTTPException(403, "Admin access required")
    versions = await db.app_versions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    return versions


@router.post("/admin/versions")
async def admin_create_version(data: VersionCreate, user: dict = Depends(get_current_user)):
    """Admin: Publish a new version entry."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        raise HTTPException(403, "Admin access required")

    # Check for duplicate version
    existing = await db.app_versions.find_one({"version": data.version}, {"_id": 0, "id": 1})
    if existing:
        raise HTTPException(400, f"Version {data.version} already exists")

    version_doc = {
        "id": str(uuid.uuid4()),
        "version": data.version,
        "title": data.title,
        "release_notes": data.release_notes,
        "is_critical": data.is_critical,
        "created_by": user["id"],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.app_versions.insert_one(version_doc)
    version_doc.pop("_id", None)
    return version_doc


@router.patch("/admin/versions/{version_id}")
async def admin_update_version(version_id: str, data: VersionUpdate, user: dict = Depends(get_current_user)):
    """Admin: Edit a version entry."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        raise HTTPException(403, "Admin access required")

    update_fields = {k: v for k, v in data.dict().items() if v is not None}
    if not update_fields:
        raise HTTPException(400, "No fields to update")

    result = await db.app_versions.update_one(
        {"id": version_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Version not found")

    updated = await db.app_versions.find_one({"id": version_id}, {"_id": 0})
    return updated


@router.delete("/admin/versions/{version_id}")
async def admin_delete_version(version_id: str, user: dict = Depends(get_current_user)):
    """Admin: Delete a version entry."""
    if user.get("role") not in ["Super Admin", "Admin"]:
        raise HTTPException(403, "Admin access required")

    result = await db.app_versions.delete_one({"id": version_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Version not found")
    return {"status": "deleted"}


# ============== Helpers ==============

def _compare_versions(v1: str, v2: str) -> int:
    """Compare two version strings (e.g., '2.1.0' vs '2.0.1'). Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal."""
    try:
        parts1 = [int(x) for x in v1.split(".")]
        parts2 = [int(x) for x in v2.split(".")]
        # Pad shorter version with zeros
        while len(parts1) < len(parts2):
            parts1.append(0)
        while len(parts2) < len(parts1):
            parts2.append(0)
        for a, b in zip(parts1, parts2):
            if a > b:
                return 1
            if a < b:
                return -1
        return 0
    except (ValueError, AttributeError):
        return 0
