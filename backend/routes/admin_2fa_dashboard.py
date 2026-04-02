"""
2FA Adoption Dashboard Routes
Provides aggregate stats on 2FA adoption across the platform,
lets admins send reminder emails to non-compliant users,
and supports weekly auto-reminder scheduling.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
from config import db, logger, SENDER_EMAIL
import asyncio
import resend

router = APIRouter(prefix="/admin/2fa-dashboard", tags=["Admin 2FA Dashboard"])

REMINDER_EMAIL_HTML = """
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
    <div style="text-align: center; margin-bottom: 28px;">
        <div style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #6D28D9); border-radius: 14px; padding: 14px; margin-bottom: 12px;">
            <span style="color: white; font-size: 26px; font-weight: 800;">M</span>
        </div>
        <h2 style="margin: 8px 0 0; color: #1a1a1a; font-size: 22px;">Secure Your Account</h2>
    </div>
    <p style="color: #444; font-size: 15px; line-height: 1.6;">Hi {name},</p>
    <p style="color: #444; font-size: 15px; line-height: 1.6;">
        Your Munal account does not have Two-Factor Authentication (2FA) enabled yet.
        2FA adds a critical extra layer of security, protecting your account even if your password is compromised.
    </p>
    <div style="text-align: center; margin: 28px 0;">
        <a href="https://munal.ai/settings" style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #6D28D9); color: white; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 600; font-size: 15px;">
            Enable 2FA Now
        </a>
    </div>
    <p style="color: #888; font-size: 13px; text-align: center;">
        You can set up 2FA using an authenticator app or email verification in your account settings.
    </p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
    <p style="color: #aaa; font-size: 12px; text-align: center;">Munal AI &mdash; Secure Collaboration Platform</p>
</div>
"""


# ── Models ──

class ReminderRequest(BaseModel):
    user_ids: Optional[List[str]] = None


# ── Helpers ──

async def _send_2fa_reminder_to_user(email: str, name: str):
    """Send a single 2FA reminder email. Returns True on success."""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [email],
            "subject": "Action Required: Enable Two-Factor Authentication on Munal",
            "html": REMINDER_EMAIL_HTML.format(name=name),
        }
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        logger.error(f"Failed to send 2FA reminder to {email}: {e}")
        return False


async def _send_reminders_to_non_2fa_users():
    """Core logic: send reminders to ALL non-2FA users. Used by both API and scheduler."""
    query = {"$or": [{"two_factor_enabled": False}, {"two_factor_enabled": {"$exists": False}}]}
    cursor = db.users.find(query, {"_id": 0, "id": 1, "email": 1, "name": 1})
    users = [doc async for doc in cursor]

    sent = 0
    failed = 0
    for user in users:
        email = user.get("email")
        if not email:
            continue
        ok = await _send_2fa_reminder_to_user(email, user.get("name", "User"))
        if ok:
            sent += 1
        else:
            failed += 1

    return {"sent": sent, "failed": failed, "total_targeted": len(users)}


# ── Scheduled job (called by APScheduler) ──

async def run_2fa_auto_reminders():
    """Weekly scheduled job: send 2FA reminders if auto-reminder is enabled."""
    settings = await db.admin_settings.find_one({"key": "2fa_auto_reminder"}, {"_id": 0})
    if not settings or not settings.get("enabled"):
        logger.info("2FA auto-reminder is disabled, skipping.")
        return

    logger.info("Running scheduled 2FA auto-reminders...")
    result = await _send_reminders_to_non_2fa_users()

    # Record the run
    await db.admin_settings.update_one(
        {"key": "2fa_auto_reminder"},
        {"$set": {
            "last_run": datetime.now(timezone.utc).isoformat(),
            "last_result": result,
        }},
    )
    logger.info(f"2FA auto-reminders complete: {result}")

    try:
        from services.audit import log_audit_event
        await log_audit_event(
            action="2fa_auto_reminders_sent", category="2fa", severity="info",
            details=result,
        )
    except Exception:
        pass


# ── Routes ──

@router.get("/stats")
async def get_2fa_stats():
    """Aggregate 2FA adoption stats grouped by role."""
    pipeline = [
        {"$group": {
            "_id": {
                "role": {"$toLower": {"$ifNull": ["$role", "user"]}},
                "two_factor_enabled": {"$ifNull": ["$two_factor_enabled", False]},
            },
            "count": {"$sum": 1},
        }}
    ]
    cursor = db.users.aggregate(pipeline)
    buckets = [doc async for doc in cursor]

    by_role = {}
    total_enabled = 0
    total_disabled = 0

    for b in buckets:
        role = b["_id"]["role"]
        enabled = b["_id"]["two_factor_enabled"]
        count = b["count"]

        if role not in by_role:
            by_role[role] = {"enabled": 0, "disabled": 0}

        if enabled:
            by_role[role]["enabled"] += count
            total_enabled += count
        else:
            by_role[role]["disabled"] += count
            total_disabled += count

    total = total_enabled + total_disabled

    # Get enforcement setting
    enforcement = await db.admin_settings.find_one({"key": "2fa_enforcement"}, {"_id": 0})
    enforced = enforcement.get("enforced", False) if enforcement else False

    # Get auto-reminder setting
    auto_reminder = await db.admin_settings.find_one({"key": "2fa_auto_reminder"}, {"_id": 0})

    # Get list of users without 2FA (for the table)
    non_2fa_cursor = db.users.find(
        {"$or": [{"two_factor_enabled": False}, {"two_factor_enabled": {"$exists": False}}]},
        {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1, "created_at": 1, "last_login": 1}
    ).sort("created_at", -1).limit(100)
    non_2fa_users = [doc async for doc in non_2fa_cursor]

    return {
        "total_users": total,
        "total_enabled": total_enabled,
        "total_disabled": total_disabled,
        "adoption_rate": round((total_enabled / total * 100), 1) if total > 0 else 0,
        "by_role": by_role,
        "enforced": enforced,
        "non_2fa_users": non_2fa_users,
        "auto_reminder": {
            "enabled": auto_reminder.get("enabled", False) if auto_reminder else False,
            "last_run": auto_reminder.get("last_run") if auto_reminder else None,
            "last_result": auto_reminder.get("last_result") if auto_reminder else None,
        },
    }


@router.post("/send-reminders")
async def send_2fa_reminders(req: ReminderRequest):
    """Send reminder emails to users who haven't enabled 2FA."""
    query = {"$or": [{"two_factor_enabled": False}, {"two_factor_enabled": {"$exists": False}}]}

    if req.user_ids:
        query["id"] = {"$in": req.user_ids}

    cursor = db.users.find(query, {"_id": 0, "id": 1, "email": 1, "name": 1})
    users = [doc async for doc in cursor]

    if not users:
        return {"success": True, "sent": 0, "message": "No eligible users found"}

    sent = 0
    failed = 0
    for user in users:
        email = user.get("email")
        if not email:
            continue
        ok = await _send_2fa_reminder_to_user(email, user.get("name", "User"))
        if ok:
            sent += 1
        else:
            failed += 1

    try:
        from services.audit import log_audit_event
        await log_audit_event(
            action="2fa_reminders_sent", category="2fa", severity="info",
            details={"sent": sent, "failed": failed, "targeted": len(users)},
        )
    except Exception:
        pass

    return {"success": True, "sent": sent, "failed": failed, "total_targeted": len(users)}


@router.post("/auto-reminder")
async def toggle_auto_reminder(request_body: dict):
    """Enable or disable the weekly auto-reminder for 2FA."""
    enabled = bool(request_body.get("enabled", False))
    await db.admin_settings.update_one(
        {"key": "2fa_auto_reminder"},
        {"$set": {
            "key": "2fa_auto_reminder",
            "enabled": enabled,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    logger.info(f"2FA auto-reminder set to: {enabled}")

    try:
        from services.audit import log_audit_event
        await log_audit_event(
            action="2fa_auto_reminder_toggled", category="2fa", severity="info",
            details={"enabled": enabled},
        )
    except Exception:
        pass

    return {"success": True, "enabled": enabled}
