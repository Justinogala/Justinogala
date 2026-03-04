"""
Usage Alerts Routes
Sends notifications when users approach or exceed their plan limits
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from config import db, logger
import uuid

router = APIRouter(prefix="/usage-alerts", tags=["Usage Alerts"])


# ============== Models ==============

class UsageAlert(BaseModel):
    id: str
    user_id: str
    feature: str
    alert_type: str  # "warning_80", "warning_90", "limit_reached", "limit_exceeded"
    current_usage: float
    limit: float
    percentage: float
    message: str
    read: bool = False
    created_at: str


class AlertPreferences(BaseModel):
    email_alerts: bool = True
    push_alerts: bool = True
    warning_threshold: int = 80  # Percentage to trigger warning
    features_to_track: List[str] = ["ai_chat", "meetings", "transcription", "storage"]


# ============== Helper Functions ==============

def get_alert_message(feature: str, alert_type: str, percentage: float, current: float, limit: float) -> str:
    """Generate human-readable alert message"""
    feature_labels = {
        "ai_chat": "AI Chat Messages",
        "meetings": "Meetings",
        "transcription": "Transcription Minutes",
        "storage": "Storage",
        "workspaces": "Workspaces",
        "team_members": "Team Members",
        "shifts": "Shifts",
        "video": "Video Duration"
    }
    
    feature_label = feature_labels.get(feature, feature.replace("_", " ").title())
    
    if alert_type == "limit_exceeded":
        return f"You've exceeded your {feature_label} limit! Current usage: {int(current)}/{int(limit)}. Upgrade now to continue using this feature."
    elif alert_type == "limit_reached":
        return f"You've reached your {feature_label} limit ({int(limit)}). Upgrade your plan to continue."
    elif alert_type == "warning_90":
        return f"Heads up! You've used {int(percentage)}% of your {feature_label} ({int(current)}/{int(limit)}). Consider upgrading soon."
    else:  # warning_80
        return f"You're approaching your {feature_label} limit - {int(percentage)}% used ({int(current)}/{int(limit)})."


async def check_and_create_alert(user_id: str, feature: str, current_usage: float, limit: float) -> Optional[UsageAlert]:
    """Check if an alert should be created and create it if needed"""
    if limit <= 0 or limit == -1:  # No limit or unlimited
        return None
    
    percentage = (current_usage / limit) * 100
    
    # Determine alert type
    alert_type = None
    if percentage > 100:
        alert_type = "limit_exceeded"
    elif percentage >= 100:
        alert_type = "limit_reached"
    elif percentage >= 90:
        alert_type = "warning_90"
    elif percentage >= 80:
        alert_type = "warning_80"
    else:
        return None
    
    # Check if we've already sent this alert today
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    existing = await db.usage_alerts.find_one({
        "user_id": user_id,
        "feature": feature,
        "alert_type": alert_type,
        "created_at": {"$gte": today_start.isoformat()}
    })
    
    if existing:
        return None  # Already sent today
    
    # Create new alert
    alert = UsageAlert(
        id=str(uuid.uuid4()),
        user_id=user_id,
        feature=feature,
        alert_type=alert_type,
        current_usage=current_usage,
        limit=limit,
        percentage=round(percentage, 1),
        message=get_alert_message(feature, alert_type, percentage, current_usage, limit),
        read=False,
        created_at=datetime.now(timezone.utc).isoformat()
    )
    
    await db.usage_alerts.insert_one(alert.dict())
    
    # Also create a notification for the user
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "plan_limit",
        "title": f"Usage Alert: {feature.replace('_', ' ').title()}",
        "message": alert.message,
        "read": False,
        "actionUrl": "/plans",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    
    return alert


# ============== API Routes ==============

@router.get("/user/{user_id}")
async def get_user_alerts(user_id: str, unread_only: bool = False):
    """Get all usage alerts for a user"""
    query = {"user_id": user_id}
    if unread_only:
        query["read"] = False
    
    alerts = await db.usage_alerts.find(
        query,
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"success": True, "alerts": alerts}


@router.put("/user/{user_id}/mark-read")
async def mark_alerts_read(user_id: str, alert_ids: List[str] = None):
    """Mark alerts as read"""
    if alert_ids:
        await db.usage_alerts.update_many(
            {"user_id": user_id, "id": {"$in": alert_ids}},
            {"$set": {"read": True}}
        )
    else:
        await db.usage_alerts.update_many(
            {"user_id": user_id},
            {"$set": {"read": True}}
        )
    
    return {"success": True, "message": "Alerts marked as read"}


@router.get("/user/{user_id}/preferences")
async def get_alert_preferences(user_id: str):
    """Get user's alert preferences"""
    prefs = await db.alert_preferences.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not prefs:
        # Return default preferences
        prefs = AlertPreferences().dict()
        prefs["user_id"] = user_id
    
    return {"success": True, "preferences": prefs}


@router.put("/user/{user_id}/preferences")
async def update_alert_preferences(user_id: str, preferences: AlertPreferences):
    """Update user's alert preferences"""
    prefs_data = preferences.dict()
    prefs_data["user_id"] = user_id
    prefs_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.alert_preferences.update_one(
        {"user_id": user_id},
        {"$set": prefs_data},
        upsert=True
    )
    
    return {"success": True, "message": "Preferences updated", "preferences": prefs_data}


@router.post("/check/{user_id}")
async def check_all_usage_alerts(user_id: str):
    """Check all features and create alerts if needed"""
    from routes.entitlements import get_user_plan, get_plan_limits, get_user_usage, PLAN_LIMITS
    
    plan = await get_user_plan(user_id)
    limits = get_plan_limits(plan)
    
    features_to_check = ["ai_chat", "meetings", "transcription", "storage", "workspaces"]
    alerts_created = []
    
    for feature in features_to_check:
        # Map feature to limit key
        limit_key_map = {
            "ai_chat": "ai_chat_messages",
            "meetings": "meetings_per_month",
            "transcription": "transcription_minutes",
            "storage": "storage_gb",
            "workspaces": "workspaces"
        }
        
        limit_key = limit_key_map.get(feature, feature)
        limit = limits.get(limit_key, 0)
        
        if limit == -1:  # Unlimited
            continue
        
        current_usage = await get_user_usage(user_id, feature)
        alert = await check_and_create_alert(user_id, feature, current_usage, limit)
        
        if alert:
            alerts_created.append(alert.dict())
    
    return {
        "success": True,
        "alerts_created": len(alerts_created),
        "alerts": alerts_created
    }
