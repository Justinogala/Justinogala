"""
Admin User Management Routes — user listing, activity, account actions.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Request, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict
from pydantic import BaseModel
from config import db, logger
import uuid

router = APIRouter(prefix="/admin", tags=["Admin Users"])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")

def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")

async def _audit(action, category="user_mgmt", severity="info", details=None, target_id=None, target_email=None, ip=None, ua=None):
    doc = {
        "id": str(uuid.uuid4()), "action": action, "category": category, "severity": severity,
        "details": details or {}, "target_id": target_id, "target_email": target_email,
        "ip_address": ip, "user_agent": ua, "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_logs.insert_one(doc)


class UserAccountAction(BaseModel):
    action: str
    reason: Optional[str] = None


@router.get("/users")
async def get_admin_users_list(
    status: Optional[str] = None,
    role: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 50
):
    try:
        query = {"deleted": {"$ne": True}}
        if status:
            query["status"] = status
        if role:
            query["role"] = role
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        sort_direction = -1 if sort_order == "desc" else 1
        total = await db.users.count_documents(query)
        users = await db.users.find(
            query, {"_id": 0, "password": 0}
        ).sort(sort_by, sort_direction).skip(skip).limit(limit).to_list(limit)
        return {"users": users, "total": total, "skip": skip, "limit": limit}
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/action")
async def perform_user_action(user_id: str, action_data: UserAccountAction, request: Request):
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        update_data = {}
        action = action_data.action
        if action == "enable":
            update_data = {"status": "Active", "locked_until": None, "failed_login_attempts": 0}
        elif action == "disable":
            update_data = {"status": "Suspended"}
        elif action == "force_password_reset":
            update_data = {"requires_password_change": True}
        elif action == "unlock":
            update_data = {"locked_until": None, "failed_login_attempts": 0}
        elif action == "set_role_admin":
            update_data = {"role": "Admin"}
        elif action == "set_role_manager":
            update_data = {"role": "Manager"}
        elif action == "set_role_user":
            update_data = {"role": "User"}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        await _audit(
            f"user_{action}",
            severity="warning" if action in ("disable", "set_role_admin") else "info",
            details={"user_id": user_id, "action": action, "reason": action_data.reason},
            target_id=user_id, target_email=user.get("email"),
            ip=get_client_ip(request), ua=get_user_agent(request),
        )
        return {"success": True, "message": f"User {action} successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing user action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/users/trash")
async def get_trashed_users(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """List all soft-deleted (trashed) users."""
    try:
        query = {"deleted": True}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}}
            ]
        total = await db.users.count_documents(query)
        users = await db.users.find(
            query, {"_id": 0, "password": 0}
        ).sort("deleted_at", -1).skip(skip).limit(limit).to_list(limit)
        return {"users": users, "total": total}
    except Exception as e:
        logger.error(f"Error fetching trashed users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/users/{user_id}/restore")
async def restore_user(user_id: str, request: Request):
    """Restore a soft-deleted user from trash."""
    try:
        user = await db.users.find_one({"id": user_id, "deleted": True})
        if not user:
            raise HTTPException(status_code=404, detail="Trashed user not found")
        prev_status = user.get("pre_delete_status", "Active")
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"deleted": False, "status": prev_status, "restored_at": datetime.now(timezone.utc).isoformat()},
             "$unset": {"deleted_at": "", "pre_delete_status": ""}}
        )
        await _audit(
            "user_restore", severity="info",
            details={"user_id": user_id, "restored_status": prev_status},
            target_id=user_id, target_email=user.get("email"),
            ip=get_client_ip(request), ua=get_user_agent(request),
        )
        return {"success": True, "message": f"User {user.get('email')} restored"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}/permanent")
async def permanently_delete_user(user_id: str, request: Request):
    """Permanently delete a user from the database. Only works on trashed users."""
    try:
        user = await db.users.find_one({"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        if not user.get("deleted"):
            raise HTTPException(status_code=400, detail="User must be in trash before permanent deletion. Soft-delete first.")
        await db.users.delete_one({"id": user_id})
        await _audit(
            "user_permanent_delete", severity="warning",
            details={"user_id": user_id, "email": user.get("email")},
            target_id=user_id, target_email=user.get("email"),
            ip=get_client_ip(request), ua=get_user_agent(request),
        )
        return {"success": True, "message": "User permanently deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error permanently deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))
async def get_user_activity(user_id: Optional[str] = None, days: int = 7, limit: int = 100):
    try:
        query = {}
        if user_id:
            query["user_id"] = user_id
        since = datetime.now(timezone.utc) - timedelta(days=days)
        query["timestamp"] = {"$gte": since.isoformat()}
        activities = await db.user_activity.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        return {"activities": activities, "period_days": days}
    except Exception as e:
        logger.error(f"Error fetching user activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics/meetings")
async def get_meeting_analytics(days: int = 30):
    try:
        from collections import defaultdict
        since = datetime.now(timezone.utc) - timedelta(days=days)
        meetings = await db.calendar_events.find(
            {"created_at": {"$gte": since.isoformat()}}, {"_id": 0}
        ).to_list(10000)
        hour_counts = defaultdict(int)
        day_counts = defaultdict(int)
        for meeting in meetings:
            try:
                start_time = datetime.fromisoformat(meeting.get("start_time", "").replace("Z", "+00:00"))
                hour_counts[start_time.hour] += 1
                day_counts[start_time.strftime("%Y-%m-%d")] += 1
            except Exception:
                pass
        return {
            "total_meetings": len(meetings),
            "peak_hours": [{"hour": h, "count": c} for h, c in sorted(hour_counts.items())],
            "daily_meetings": [{"date": d, "count": c} for d, c in sorted(day_counts.items())],
            "period_days": days,
        }
    except Exception as e:
        logger.error(f"Error fetching meeting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
