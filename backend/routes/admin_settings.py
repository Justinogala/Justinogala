"""
Admin Settings Routes — settings CRUD, SMTP test, security policies, 2FA enforcement.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel
import asyncio
import resend

from config import db, logger, SENDER_EMAIL
from routes.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Settings"])


# ── Models ──

class AdminSettingsUpdate(BaseModel):
    category: str
    settings: Dict

class SMTPTestRequest(BaseModel):
    to_email: str


# ── Helpers (shared) ──

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")


# ── Routes ──

@router.get("/settings")
async def get_all_admin_settings():
    settings = await db.admin_settings.find({}, {"_id": 0}).to_list(100)
    result = {}
    for setting in settings:
        category = setting.get('category')
        if category:
            result[category] = setting.get('settings', {})
    return result


@router.get("/settings/{category}")
async def get_admin_settings(category: str):
    setting = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    if not setting:
        return {"category": category, "settings": {}}
    return setting


@router.put("/settings")
async def update_admin_settings(update: AdminSettingsUpdate, request: Request):
    try:
        from services.audit import log_audit_event as _log
        settings_doc = {
            "category": update.category,
            "settings": update.settings,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": "admin"
        }
        await db.admin_settings.update_one(
            {"category": update.category},
            {"$set": settings_doc},
            upsert=True
        )
        await _log(
            action=f"Updated {update.category} settings",
            category="settings",
            details={"category": update.category},
        )
        return {"success": True, "settings": settings_doc}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/smtp/test")
async def test_smtp(request_data: SMTPTestRequest):
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [request_data.to_email],
            "subject": "SMTP Test - Munal AI",
            "html": "<div style='font-family:Arial;padding:20px;'><h2>SMTP Test Successful!</h2><p>Sent at: " + datetime.now(timezone.utc).isoformat() + "</p></div>"
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"success": True, "message": "Test email sent", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"SMTP test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── 2FA Enforcement ──

@router.get("/2fa-enforcement")
async def get_2fa_enforcement():
    settings = await db.admin_settings.find_one({"key": "2fa_enforcement"}, {"_id": 0})
    return {"enforced": settings.get("enforced", False) if settings else False}


@router.post("/2fa-enforcement")
async def set_2fa_enforcement(request: Request):
    body = await request.json()
    enforce = bool(body.get("enforce", False))
    await db.admin_settings.update_one(
        {"key": "2fa_enforcement"},
        {"$set": {"key": "2fa_enforcement", "enforced": enforce, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    from services.audit import log_audit_event
    await log_audit_event(
        action="2fa_enforcement_changed", category="2fa", severity="warning",
        details={"enforced": enforce},
    )
    logger.info(f"2FA enforcement set to: {enforce}")
    return {"success": True, "enforced": enforce}


# ── Security Policies ──

@router.get("/security/policies")
async def get_security_policies():
    policies = await db.admin_settings.find_one({"category": "security_policies"}, {"_id": 0})
    if not policies:
        return {
            "max_login_attempts": 5,
            "lockout_duration_minutes": 30,
            "session_timeout_minutes": 60,
            "require_strong_passwords": True,
            "min_password_length": 8,
            "require_mfa_for_admin": False,
            "allowed_ip_ranges": "",
            "force_password_change_days": 0,
        }
    return policies.get("settings", policies)


@router.put("/security/policies")
async def update_security_policies(request: Request):
    body = await request.json()
    await db.admin_settings.update_one(
        {"category": "security_policies"},
        {"$set": {"category": "security_policies", "settings": body, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"success": True}


# ── Search API Configuration ──

class SearchAPIConfig(BaseModel):
    provider: str  # "duckduckgo" | "perplexity" | "tavily" | "brave"
    api_key: str = ""

@router.get("/search-api")
async def get_search_api_config(user: dict = Depends(get_current_user)):
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")
    config = await db.admin_settings.find_one({"category": "search_api"}, {"_id": 0})
    if not config:
        return {"provider": "duckduckgo", "api_key": ""}
    return {"provider": config.get("provider", "duckduckgo"), "api_key": config.get("api_key", "")}

@router.put("/search-api")
async def update_search_api_config(config: SearchAPIConfig, user: dict = Depends(get_current_user)):
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")
    await db.admin_settings.update_one(
        {"category": "search_api"},
        {"$set": {
            "category": "search_api",
            "provider": config.provider,
            "api_key": config.api_key,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"success": True, "provider": config.provider}
