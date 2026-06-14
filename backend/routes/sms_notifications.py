"""
SMS/Messaging notification settings and sender.
Supports: Telegram (free), Twilio, Vonage, MSG91.
"""
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/admin/sms", tags=["Admin SMS"])


# ── Models ──

class SMSConfig(BaseModel):
    provider: str  # "telegram" | "twilio" | "vonage" | "msg91"
    enabled: bool = False
    # Telegram
    telegram_bot_token: str = ""
    telegram_bot_name: str = ""
    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    # Vonage
    vonage_api_key: str = ""
    vonage_api_secret: str = ""
    vonage_from_number: str = ""
    # MSG91
    msg91_auth_key: str = ""
    msg91_sender_id: str = ""
    msg91_template_id: str = ""


class TestMessageRequest(BaseModel):
    chat_id: str = ""  # Telegram chat ID or phone number


def _admin_check(user: dict):
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")


# ── Endpoints ──

@router.get("")
async def get_sms_config(user: dict = Depends(get_current_user)):
    _admin_check(user)
    config = await db.admin_settings.find_one({"category": "sms_notifications"}, {"_id": 0})
    if not config:
        return {
            "provider": "telegram",
            "enabled": False,
            "telegram_bot_token": "",
            "telegram_bot_name": "",
            "twilio_account_sid": "",
            "twilio_auth_token": "",
            "twilio_phone_number": "",
            "vonage_api_key": "",
            "vonage_api_secret": "",
            "vonage_from_number": "",
            "msg91_auth_key": "",
            "msg91_sender_id": "",
            "msg91_template_id": "",
        }
    config.pop("category", None)
    config.pop("updated_at", None)
    return config


@router.put("")
async def update_sms_config(config: SMSConfig, user: dict = Depends(get_current_user)):
    _admin_check(user)
    await db.admin_settings.update_one(
        {"category": "sms_notifications"},
        {"$set": {
            "category": "sms_notifications",
            **config.dict(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )
    return {"success": True, "provider": config.provider}


@router.post("/test")
async def send_test_message(body: TestMessageRequest, user: dict = Depends(get_current_user)):
    _admin_check(user)
    config = await db.admin_settings.find_one({"category": "sms_notifications"}, {"_id": 0})
    if not config or not config.get("enabled"):
        raise HTTPException(400, "SMS notifications not enabled")

    provider = config.get("provider", "telegram")

    if provider == "telegram":
        token = config.get("telegram_bot_token", "")
        chat_id = body.chat_id.strip()
        if not token or not chat_id:
            raise HTTPException(400, "Telegram bot token and chat ID are required")
        success = await _send_telegram(token, chat_id, "Test notification from Munal AI")
        if success:
            return {"success": True, "message": f"Test message sent to Telegram chat {chat_id}"}
        raise HTTPException(500, "Failed to send Telegram message. Check bot token and chat ID.")

    elif provider == "twilio":
        raise HTTPException(400, "Twilio integration requires API keys. Configure and try again.")
    elif provider == "vonage":
        raise HTTPException(400, "Vonage integration requires API keys. Configure and try again.")
    elif provider == "msg91":
        raise HTTPException(400, "MSG91 integration requires API keys. Configure and try again.")

    raise HTTPException(400, f"Unknown provider: {provider}")


# ── Telegram Sender ──

async def _send_telegram(bot_token: str, chat_id: str, text: str) -> bool:
    """Send a message via Telegram Bot API."""
    import requests
    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        resp = await asyncio.to_thread(
            requests.post, url,
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10
        )
        if resp.status_code == 200:
            return True
        logger.error(f"Telegram API error: {resp.status_code} {resp.text}")
        return False
    except Exception as e:
        logger.error(f"Telegram send failed: {e}")
        return False


# ── Public send function (used by other modules) ──

async def send_notification(recipient: str, message: str) -> bool:
    """Send a notification using the configured SMS provider. Returns True on success."""
    config = await db.admin_settings.find_one({"category": "sms_notifications"}, {"_id": 0})
    if not config or not config.get("enabled"):
        return False

    provider = config.get("provider", "telegram")

    if provider == "telegram":
        token = config.get("telegram_bot_token", "")
        if not token or not recipient:
            return False
        return await _send_telegram(token, recipient, message)

    # Future: Twilio, Vonage, MSG91 implementations
    return False
