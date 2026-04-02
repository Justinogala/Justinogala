"""
Admin Monitoring Routes — dashboard stats, system health.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from config import db, logger

router = APIRouter(prefix="/admin", tags=["Admin Monitoring"])


@router.get("/monitoring/dashboard")
async def get_monitoring_dashboard():
    try:
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"status": "Active"})
        total_meetings = await db.calendar_events.count_documents({})
        total_recordings = await db.recordings.count_documents({})
        recent_logins = await db.user_activity.find(
            {"action": "login"}, {"_id": 0}
        ).sort("timestamp", -1).limit(10).to_list(10)
        return {
            "users": {"total": total_users, "active": active_users},
            "meetings": {"total": total_meetings},
            "recordings": {"total": total_recordings},
            "recent_logins": recent_logins,
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitoring/system-health")
async def get_system_health():
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
