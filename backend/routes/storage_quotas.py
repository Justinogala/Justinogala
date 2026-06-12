"""
Storage Quota Management — per-user storage limits based on plan.
Admin endpoints for viewing/managing quotas. Email alerts at 80% and 100%.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone
from typing import Optional
from config import db, logger, SENDER_EMAIL
from routes.auth import get_current_user
import resend
import asyncio
import os

resend.api_key = os.environ.get("RESEND_API_KEY", "")

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


async def check_and_alert_quota(user_id: str):
    """Check quota and send email alerts at 80% and 100% thresholds."""
    quota = await check_quota(user_id)
    pct = quota["usage_pct"]

    if pct < 80:
        return quota

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "name": 1})
    if not user:
        return quota

    email = user.get("email", "")
    name = user.get("name", email.split("@")[0])

    # Check if we already sent an alert for this threshold
    threshold = 100 if pct >= 100 else 80
    alert_key = f"quota_alert_{threshold}"
    existing = await db.quota_alerts.find_one({"user_id": user_id, "threshold": threshold})
    if existing:
        return quota

    # Record that we sent this alert
    await db.quota_alerts.update_one(
        {"user_id": user_id, "threshold": threshold},
        {"$set": {"sent_at": datetime.now(timezone.utc).isoformat(), "usage_pct": pct}},
        upsert=True
    )

    # Send the email
    try:
        if threshold == 100:
            subject = "Storage Quota Full — Munal AI"
            html = _build_quota_email(name, quota, is_full=True)
        else:
            subject = "Storage Almost Full (80%) — Munal AI"
            html = _build_quota_email(name, quota, is_full=False)

        await asyncio.to_thread(resend.Emails.send, {
            "from": f"Munal AI <{SENDER_EMAIL}>",
            "to": [email],
            "subject": subject,
            "html": html,
        })
        logger.info(f"Quota alert ({threshold}%) sent to {email}")
    except Exception as e:
        logger.error(f"Failed to send quota alert to {email}: {e}")

    return quota


def _build_quota_email(name: str, quota: dict, is_full: bool) -> str:
    """Build HTML email for quota alerts."""
    pct = quota["usage_pct"]
    used = quota["used_formatted"]
    limit = quota["limit_formatted"]
    remaining = quota["remaining_formatted"]
    bar_color = "#ef4444" if is_full else "#f59e0b"
    bar_width = min(pct, 100)

    if is_full:
        msg = f"Your Munal AI storage is <strong>completely full</strong>. You won't be able to generate new files (images, PDFs, documents) until you free up space or upgrade your plan."
    else:
        msg = f"Your Munal AI storage has reached <strong>80%</strong> capacity. Consider upgrading your plan or cleaning up old files to avoid disruption."

    cta_text = "Upgrade Plan" if is_full else "Manage Storage"
    icon_bg = "#fef2f2" if is_full else "#fffbeb"
    emoji = "&#128683;" if is_full else "&#9888;&#65039;"
    heading = "Storage Quota Full" if is_full else "Storage Almost Full"

    return f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 48px; height: 48px; background: {icon_bg}; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                <span style="font-size: 24px;">{emoji}</span>
            </div>
            <h1 style="font-size: 22px; color: #111827; margin: 0;">{heading}</h1>
        </div>

        <p style="font-size: 15px; color: #374151; line-height: 1.6;">Hi {name},</p>
        <p style="font-size: 15px; color: #374151; line-height: 1.6;">{msg}</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 13px; color: #6b7280;">Used</span>
                <span style="font-size: 13px; font-weight: 600; color: #111827;">{used} / {limit}</span>
            </div>
            <div style="height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                <div style="height: 100%; width: {bar_width}%; background: {bar_color}; border-radius: 4px;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px;">
                <span style="font-size: 12px; color: #9ca3af;">{pct}% used</span>
                <span style="font-size: 12px; color: #9ca3af;">{remaining} remaining</span>
            </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
            <a href="https://munal.ai/settings" style="display: inline-block; padding: 12px 28px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                {cta_text}
            </a>
        </div>

        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 32px; border-top: 1px solid #f3f4f6; padding-top: 16px;">
            Munal AI by Jiffix Inc.
        </p>
    </div>
    """


# ============== User Endpoints ==============

@router.get("/my-quota")
async def get_my_quota(user: dict = Depends(get_current_user)):
    """Get current user's storage quota info."""
    return await check_quota(user["id"])


@router.get("/my-files")
async def get_my_files(
    sort: str = Query("created_at", regex="^(created_at|file_size|filename|type)$"),
    order: str = Query("desc", regex="^(asc|desc)$"),
    file_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    user: dict = Depends(get_current_user)
):
    """Get user's generated files with sorting and filtering."""
    query = {"user_id": user["id"]}
    if file_type:
        query["type"] = file_type
    sort_dir = 1 if order == "asc" else -1
    files = await db.ai_generated_files.find(query, {"_id": 0}).sort(sort, sort_dir).skip(skip).limit(limit).to_list(limit)
    total = await db.ai_generated_files.count_documents(query)
    # Format file sizes
    for f in files:
        f["file_size_formatted"] = _format_bytes(f.get("file_size", 0))
    return {"files": files, "total": total}


@router.delete("/my-files/{file_id}")
async def delete_my_file(file_id: str, user: dict = Depends(get_current_user)):
    """Delete a specific generated file to free storage."""
    record = await db.ai_generated_files.find_one({"id": file_id, "user_id": user["id"]})
    if not record:
        raise HTTPException(404, "File not found")
    # Delete from object storage
    try:
        from config import STORAGE_URL, STORAGE_KEY, BUCKET_NAME
        import requests
        path = record.get("storage_path", "")
        if path:
            requests.delete(f"{STORAGE_URL}/{BUCKET_NAME}/{path}", headers={"x-api-key": STORAGE_KEY}, timeout=10)
    except Exception as e:
        logger.warning(f"Could not delete from storage: {e}")
    # Delete metadata
    await db.ai_generated_files.delete_one({"id": file_id, "user_id": user["id"]})
    # Reset quota alerts if usage dropped below thresholds
    quota = await check_quota(user["id"])
    if quota["usage_pct"] < 80:
        await db.quota_alerts.delete_many({"user_id": user["id"]})
    elif quota["usage_pct"] < 100:
        await db.quota_alerts.delete_one({"user_id": user["id"], "threshold": 100})
    return {"deleted": True, "freed": _format_bytes(record.get("file_size", 0))}


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


@router.delete("/admin/quota-alerts/{user_id}")
async def admin_reset_quota_alerts(user_id: str, user: dict = Depends(get_current_user)):
    """Admin: Reset quota alert flags so user receives fresh alerts."""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")
    result = await db.quota_alerts.delete_many({"user_id": user_id})
    return {"reset": True, "cleared": result.deleted_count}
