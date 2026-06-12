"""
Storage Quota Management — per-user storage limits based on plan.
Admin endpoints for viewing/managing quotas.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/storage", tags=["Storage Quotas"])

# Default quota limits (bytes)
PLAN_QUOTAS = {
    "Free": 100 * 1024 * 1024,       # 100 MB
    "Pro": 1024 * 1024 * 1024,        # 1 GB
    "Enterprise": 10 * 1024 * 1024 * 1024,  # 10 GB
}


def _format_bytes(b: int) -> str:
    if b >= 1024 * 1024 * 1024:
        return f"{b / (1024**3):.1f} GB"
    if b >= 1024 * 1024:
        return f"{b / (1024**2):.1f} MB"
    if b >= 1024:
        return f"{b / 1024:.1f} KB"
    return f"{b} B"


async def get_user_usage(user_id: str) -> int:
    """Calculate total storage used by a user's generated files."""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": None, "total_size": {"$sum": {"$ifNull": ["$file_size", 0]}}, "count": {"$sum": 1}}}
    ]
    result = await db.ai_generated_files.aggregate(pipeline).to_list(1)
    if result:
        return result[0].get("total_size", 0), result[0].get("count", 0)
    return 0, 0


async def get_user_quota_limit(user_id: str) -> int:
    """Get the storage quota limit for a user (custom override or plan-based)."""
    override = await db.storage_quotas.find_one({"user_id": user_id}, {"_id": 0})
    if override and override.get("custom_limit"):
        return override["custom_limit"]
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "plan": 1})
    plan = (user or {}).get("plan", "Free") or "Free"
    return PLAN_QUOTAS.get(plan, PLAN_QUOTAS["Free"])


async def check_quota(user_id: str, additional_bytes: int = 0) -> dict:
    """Check if user has enough storage quota. Returns quota info."""
    limit = await get_user_quota_limit(user_id)
    used, file_count = await get_user_usage(user_id)
    remaining = max(0, limit - used)
    return {
        "user_id": user_id,
        "limit": limit,
        "used": used,
        "remaining": remaining,
        "file_count": file_count,
        "limit_formatted": _format_bytes(limit),
        "used_formatted": _format_bytes(used),
        "remaining_formatted": _format_bytes(remaining),
        "usage_pct": round((used / max(limit, 1)) * 100, 1),
        "can_generate": (used + additional_bytes) <= limit,
    }


# ============== User Endpoints ==============

@router.get("/my-quota")
async def get_my_quota(user: dict = Depends(get_current_user)):
    """Get current user's storage quota info."""
    return await check_quota(user["id"])


# ============== Admin Endpoints ==============

@router.get("/admin/quotas")
async def admin_list_quotas(
    search: Optional[str] = None,
    plan: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Admin: List all users with their quota usage."""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")

    query = {"deleted": {"$ne": True}}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if plan:
        query["plan"] = plan

    users = await db.users.find(query, {"_id": 0, "password": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)

    result = []
    for u in users:
        quota = await check_quota(u["id"])
        override = await db.storage_quotas.find_one({"user_id": u["id"]}, {"_id": 0})
        result.append({
            "id": u["id"],
            "name": u.get("name", ""),
            "email": u.get("email", ""),
            "plan": u.get("plan", "Free") or "Free",
            "avatar": u.get("avatar"),
            "quota": quota,
            "has_custom_limit": bool(override and override.get("custom_limit")),
        })

    return {"users": result, "total": total, "plan_defaults": {k: {"bytes": v, "formatted": _format_bytes(v)} for k, v in PLAN_QUOTAS.items()}}


@router.put("/admin/quotas/{user_id}")
async def admin_set_user_quota(user_id: str, body: dict, user: dict = Depends(get_current_user)):
    """Admin: Set a custom storage quota for a user."""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")

    custom_limit = body.get("custom_limit")  # In bytes, or null to reset to plan default
    if custom_limit is not None and custom_limit < 0:
        raise HTTPException(400, "Quota limit cannot be negative")

    target = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "email": 1})
    if not target:
        raise HTTPException(404, "User not found")

    if custom_limit is None or custom_limit == 0:
        await db.storage_quotas.delete_one({"user_id": user_id})
        return {"status": "reset_to_plan_default", "user_id": user_id}

    await db.storage_quotas.update_one(
        {"user_id": user_id},
        {"$set": {
            "custom_limit": custom_limit,
            "set_by": user["id"],
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }, "$setOnInsert": {"user_id": user_id}},
        upsert=True
    )
    return {"status": "custom_limit_set", "user_id": user_id, "custom_limit": custom_limit, "formatted": _format_bytes(custom_limit)}


@router.put("/admin/plan-defaults")
async def admin_update_plan_defaults(body: dict, user: dict = Depends(get_current_user)):
    """Admin: Update default quota limits for plans."""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")

    for plan_name, limit_bytes in body.items():
        if plan_name in PLAN_QUOTAS and isinstance(limit_bytes, (int, float)) and limit_bytes > 0:
            PLAN_QUOTAS[plan_name] = int(limit_bytes)

    return {"plan_defaults": {k: {"bytes": v, "formatted": _format_bytes(v)} for k, v in PLAN_QUOTAS.items()}}
