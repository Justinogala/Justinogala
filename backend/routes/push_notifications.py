"""
Push Notification Routes
Manage browser push subscriptions and send web push notifications.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import uuid
import os
import json
import base64
import logging

from config import db

router = APIRouter(prefix="/push", tags=["push-notifications"])
logger = logging.getLogger(__name__)

VAPID_PUBLIC_KEY = os.environ.get("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY_B64 = os.environ.get("VAPID_PRIVATE_KEY", "")
VAPID_CLAIMS_EMAIL = os.environ.get("VAPID_CLAIMS_EMAIL", "mailto:noreply@munal.ai")


class PushSubscription(BaseModel):
    user_id: str
    subscription: dict  # PushSubscription JSON from browser


class PushMessage(BaseModel):
    user_id: str
    title: str
    body: str
    url: Optional[str] = "/"
    icon: Optional[str] = "/icons/icon-192x192.svg"


@router.get("/vapid-key")
async def get_vapid_public_key():
    """Return the VAPID public key for the frontend to subscribe."""
    return {"public_key": VAPID_PUBLIC_KEY}


@router.post("/subscribe")
async def subscribe_push(data: PushSubscription):
    """Store a push subscription for a user."""
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
    """Check if user has an active push subscription."""
    count = await db.push_subscriptions.count_documents({"user_id": user_id})
    return {"subscribed": count > 0, "count": count}


async def send_push_to_user(user_id: str, title: str, body: str, url: str = "/", icon: str = "/icons/icon-192x192.svg"):
    """Send push notification to all subscriptions for a user."""
    if not VAPID_PRIVATE_KEY_B64:
        logger.warning("VAPID_PRIVATE_KEY not set, skipping push")
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
                    logger.error(f"Push send error: {e}")
            except Exception as e:
                logger.error(f"Push send error: {e}")

        # Clean up stale subscriptions
        if stale_ids:
            await db.push_subscriptions.delete_many({"id": {"$in": stale_ids}})

        logger.info(f"Sent {sent} push notifications to user {user_id}")
        return sent
    except Exception as e:
        logger.error(f"Error sending push notifications: {e}")
        return 0
