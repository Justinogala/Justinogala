"""
Push Notification Routes
Manage browser push subscriptions, native mobile device tokens (FCM),
and send notifications to both web and mobile platforms.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import os
import json
import base64
import logging
import httpx

from config import db

router = APIRouter(prefix="/push", tags=["push-notifications"])
logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_B64 = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:noreply@munal.ai")

# Firebase Cloud Messaging (for Capacitor native apps)
FCM_SERVER_KEY = os.environ.get("FCM_SERVER_KEY", "")
FCM_API_URL = "https://fcm.googleapis.com/fcm/send"


# ── Models ──

class PushSubscription(BaseModel):
    user_id: str
    subscription: dict  # PushSubscription JSON from browser


class PushMessage(BaseModel):
    user_id: str
    title: str
    body: str
    url: Optional[str] = "/"
    icon: Optional[str] = "/icons/icon-192x192.svg"


class DeviceTokenRegistration(BaseModel):
    user_id: str
    token: str
    platform: str  # 'android' | 'ios'
    device_name: Optional[str] = None


class BroadcastNotification(BaseModel):
    title: str
    body: str
    url: Optional[str] = "/"
    target: Optional[str] = "all"  # 'all', 'web', 'mobile'


# ── Web Push (VAPID) ──

@router.get("/vapid-key")
async def get_vapid_public_key():
    """Return the VAPID public key for the frontend to subscribe."""
    return {"public_key": VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe_push(data: PushSubscription):
    """Store a push subscription for a user (web browser)."""
    try:
        existing = await db.push_subscriptions.find_one({
            "user_id": data.user_id,
            "subscription.endpoint": data.subscription.get("endpoint"),
        })
        if existing:
            return {"success": True, "message": "Already subscribed"}

        entry = {
            "id": str(uuid.uuid4()),
            "user_id": data.user_id,
            "subscription": data.subscription,
            "platform": "web",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.push_subscriptions.insert_one(entry)
        entry.pop("_id", None)
        return {"success": True, "id": entry["id"]}
    except Exception as e:
        logger.error(f"Error storing push subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/unsubscribe/{user_id}")
async def unsubscribe_push(user_id: str, endpoint: Optional[str] = None):
    """Remove push subscription(s) for a user."""
    try:
        query = {"user_id": user_id}
        if endpoint:
            query["subscription.endpoint"] = endpoint
        result = await db.push_subscriptions.delete_many(query)
        return {"success": True, "deleted": result.deleted_count}
    except Exception as e:
        logger.error(f"Error removing push subscription: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{user_id}")
async def get_push_status(user_id: str):
    """Check if user has active push subscriptions (web + mobile)."""
    web_count = await db.push_subscriptions.count_documents({"user_id": user_id, "platform": "web"})
    mobile_count = await db.device_tokens.count_documents({"user_id": user_id})
    return {
        "subscribed": (web_count + mobile_count) > 0,
        "web_count": web_count,
        "mobile_count": mobile_count,
    }


# ── Mobile Device Token (FCM) ──

@router.post("/register-device")
async def register_device_token(data: DeviceTokenRegistration):
    """Register a native mobile device token for FCM push notifications."""
    try:
        # Upsert: update if same token exists, else insert
        existing = await db.device_tokens.find_one({"token": data.token})
        if existing:
            await db.device_tokens.update_one(
                {"token": data.token},
                {"$set": {
                    "user_id": data.user_id,
                    "platform": data.platform,
                    "device_name": data.device_name,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }}
            )
            return {"success": True, "message": "Device token updated"}

        entry = {
            "id": str(uuid.uuid4()),
            "user_id": data.user_id,
            "token": data.token,
            "platform": data.platform,
            "device_name": data.device_name,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.device_tokens.insert_one(entry)
        entry.pop("_id", None)
        return {"success": True, "id": entry["id"]}
    except Exception as e:
        logger.error(f"Error registering device token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/unregister-device/{user_id}")
async def unregister_device_token(user_id: str, token: Optional[str] = None):
    """Remove device token(s) for a user."""
    try:
        query = {"user_id": user_id}
        if token:
            query["token"] = token
        result = await db.device_tokens.delete_many(query)
        return {"success": True, "deleted": result.deleted_count}
    except Exception as e:
        logger.error(f"Error removing device token: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/devices/{user_id}")
async def list_user_devices(user_id: str):
    """List all registered mobile devices for a user."""
    devices = await db.device_tokens.find(
        {"user_id": user_id}, {"_id": 0}
    ).to_list(20)
    return {"devices": devices, "count": len(devices)}


# ── Unified Send Functions ──

async def send_push_to_user(user_id: str, title: str, body: str, url: str = "/", icon: str = "/icons/icon-192x192.svg"):
    """Send push notification to ALL platforms (web + mobile) for a user."""
    web_sent = await _send_web_push(user_id, title, body, url, icon)
    mobile_sent = await _send_fcm_push(user_id, title, body, url)
    total = web_sent + mobile_sent
    logger.info(f"Sent {total} notifications to user {user_id} (web={web_sent}, mobile={mobile_sent})")
    return total


async def _send_web_push(user_id: str, title: str, body: str, url: str = "/", icon: str = "/icons/icon-192x192.svg"):
    """Send web push notification via VAPID."""
    if not VAPID_PRIVATE_KEY_B64:
        return 0

    try:
        from pywebpush import webpush, WebPushException

        private_key_pem = base64.b64decode(VAPID_PRIVATE_KEY_B64).decode()

        subs = await db.push_subscriptions.find(
            {"user_id": user_id}, {"_id": 0, "subscription": 1, "id": 1}
        ).to_list(50)

        payload = json.dumps({
            "title": title,
            "body": body,
            "url": url,
            "icon": icon,
        })

        sent = 0
        stale_ids = []
        for sub in subs:
            try:
                webpush(
                    subscription_info=sub["subscription"],
                    data=payload,
                    vapid_private_key=private_key_pem,
                    vapid_claims={"sub": VAPID_CLAIMS_EMAIL},
                )
                sent += 1
            except WebPushException as e:
                if e.response and e.response.status_code in (404, 410):
                    stale_ids.append(sub["id"])
                else:
                    logger.error(f"Web push send error: {e}")
            except Exception as e:
                logger.error(f"Web push send error: {e}")

        if stale_ids:
            await db.push_subscriptions.delete_many({"id": {"$in": stale_ids}})

        return sent
    except Exception as e:
        logger.error(f"Error sending web push: {e}")
        return 0


async def _send_fcm_push(user_id: str, title: str, body: str, url: str = "/"):
    """Send FCM push notifications to native mobile devices.
    
    NOTE: FCM_SERVER_KEY is currently a placeholder.
    To enable real mobile push notifications:
    1. Create a Firebase project at https://console.firebase.google.com
    2. Get your Server Key from Project Settings > Cloud Messaging
    3. Set FCM_SERVER_KEY in backend/.env
    4. Add google-services.json (Android) / GoogleService-Info.plist (iOS) to native projects
    """
    if not FCM_SERVER_KEY:
        logger.debug("FCM_SERVER_KEY not set — mobile push notifications disabled (mock mode)")
        return 0

    try:
        tokens_cursor = db.device_tokens.find(
            {"user_id": user_id}, {"_id": 0, "token": 1, "id": 1}
        )
        tokens = await tokens_cursor.to_list(50)

        if not tokens:
            return 0

        sent = 0
        stale_ids = []

        async with httpx.AsyncClient() as client:
            for device in tokens:
                try:
                    response = await client.post(
                        FCM_API_URL,
                        headers={
                            "Authorization": f"key={FCM_SERVER_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "to": device["token"],
                            "notification": {
                                "title": title,
                                "body": body,
                                "click_action": url,
                                "sound": "default",
                            },
                            "data": {
                                "url": url,
                                "title": title,
                                "body": body,
                            },
                        },
                        timeout=10,
                    )
                    result = response.json()
                    if result.get("success", 0) > 0:
                        sent += 1
                    elif result.get("failure", 0) > 0:
                        # Token is invalid/expired
                        stale_ids.append(device["id"])
                except Exception as e:
                    logger.error(f"FCM send error for token {device['token'][:20]}...: {e}")

        if stale_ids:
            await db.device_tokens.delete_many({"id": {"$in": stale_ids}})

        return sent
    except Exception as e:
        logger.error(f"Error sending FCM push: {e}")
        return 0
