"""
Time Clock Routes
Workspace-level punch in/out for daily work tracking.
Independent of scheduled shifts — any workspace member can clock in/out.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from config import db

router = APIRouter(prefix="/time-clock", tags=["time-clock"])
logger = logging.getLogger(__name__)


class ClockInRequest(BaseModel):
    workspace_id: str
    user_id: str
    notes: Optional[str] = None


class ClockOutRequest(BaseModel):
    workspace_id: str
    user_id: str
    notes: Optional[str] = None


@router.post("/clock-in")
async def clock_in(req: ClockInRequest):
    """Punch in to a workspace. Only one active session per user per workspace."""
    active = await db.time_clock.find_one({
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "clock_out": None,
    })
    if active:
        raise HTTPException(status_code=400, detail="Already clocked in")

    user = await db.users.find_one({"id": req.user_id}, {"_id": 0, "name": 1, "email": 1})

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    entry = {
        "id": entry_id,
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "user_name": user.get("name") if user else "Unknown",
        "clock_in": now,
        "clock_out": None,
        "duration_minutes": 0,
        "notes_in": req.notes,
        "notes_out": None,
        "status": "active",
        "created_at": now,
    }

    await db.time_clock.insert_one(entry)
    entry.pop("_id", None)

    return {"success": True, "entry": entry}


@router.post("/clock-out")
async def clock_out(req: ClockOutRequest):
    """Punch out of the active session for this workspace."""
    active = await db.time_clock.find_one({
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "clock_out": None,
    })
    if not active:
        raise HTTPException(status_code=400, detail="Not clocked in")

    now = datetime.now(timezone.utc)
    clock_in_time = datetime.fromisoformat(active["clock_in"].replace("Z", "+00:00"))
    duration = (now - clock_in_time).total_seconds() / 60

    await db.time_clock.update_one(
        {"id": active["id"]},
        {"$set": {
            "clock_out": now.isoformat(),
            "duration_minutes": round(duration, 2),
            "notes_out": req.notes,
            "status": "completed",
        }},
    )

    return {
        "success": True,
        "entry_id": active["id"],
        "duration_minutes": round(duration, 2),
        "duration_hours": round(duration / 60, 2),
    }


@router.get("/status/{workspace_id}/{user_id}")
async def get_clock_status(workspace_id: str, user_id: str):
    """Check if user is currently clocked in to this workspace."""
    active = await db.time_clock.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "clock_out": None},
        {"_id": 0},
    )
    if active:
        clock_in_time = datetime.fromisoformat(active["clock_in"].replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - clock_in_time).total_seconds()
        return {
            "clocked_in": True,
            "entry": active,
            "elapsed_seconds": round(elapsed),
        }
    return {"clocked_in": False, "entry": None, "elapsed_seconds": 0}


@router.get("/history/{workspace_id}/{user_id}")
async def get_clock_history(workspace_id: str, user_id: str, limit: int = 30):
    """Get recent time clock entries for a user in a workspace."""
    entries = await db.time_clock.find(
        {"workspace_id": workspace_id, "user_id": user_id},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit).to_list(limit)

    total_minutes = sum(e.get("duration_minutes", 0) for e in entries if e.get("status") == "completed")

    return {
        "entries": entries,
        "total_minutes": round(total_minutes, 2),
        "total_hours": round(total_minutes / 60, 2),
        "count": len(entries),
    }


@router.get("/today/{workspace_id}")
async def get_today_clocks(workspace_id: str):
    """Get all clock entries for today (for the whole workspace)."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    entries = await db.time_clock.find(
        {"workspace_id": workspace_id, "clock_in": {"$gte": today_start}},
        {"_id": 0},
    ).sort("clock_in", -1).to_list(200)
    return {"entries": entries, "count": len(entries)}
