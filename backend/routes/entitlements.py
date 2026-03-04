"""
User Entitlements & Usage Routes
Handles subscription limit checking, usage tracking, and enforcement
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict
from datetime import datetime, timezone, timedelta
from config import db, logger
import uuid

router = APIRouter(prefix="/entitlements", tags=["Entitlements"])


# ============== Plan Limits Configuration ==============

PLAN_LIMITS = {
    "free": {
        "meetings_per_month": 5,
        "transcription_minutes": 30,
        "storage_gb": 1,
        "workspaces": 1,
        "team_members": 1,
        "video_duration_seconds": 4,
        "ai_chat_messages": 50,
        "shifts_per_workspace": 10,
    },
    "pro": {
        "meetings_per_month": 50,
        "transcription_minutes": 300,
        "storage_gb": 5,
        "workspaces": 3,
        "team_members": 5,
        "video_duration_seconds": 8,
        "ai_chat_messages": 500,
        "shifts_per_workspace": 100,
    },
    "business": {
        "meetings_per_month": 150,
        "transcription_minutes": 1000,
        "storage_gb": 25,
        "workspaces": 10,
        "team_members": 25,
        "video_duration_seconds": 24,
        "ai_chat_messages": 2000,
        "shifts_per_workspace": 500,
    },
    "enterprise": {
        "meetings_per_month": -1,  # Unlimited
        "transcription_minutes": -1,  # Unlimited
        "storage_gb": 100,
        "workspaces": -1,  # Unlimited
        "team_members": -1,  # Unlimited
        "video_duration_seconds": 60,
        "ai_chat_messages": -1,  # Unlimited
        "shifts_per_workspace": -1,  # Unlimited
    }
}


# ============== Models ==============

class UsageRecord(BaseModel):
    user_id: str
    feature: str  # meetings, transcription, storage, ai_chat, etc.
    amount: float = 1
    metadata: Optional[Dict] = None


class UsageCheckResponse(BaseModel):
    allowed: bool
    current_usage: float
    limit: float
    remaining: float
    percentage_used: float
    message: str


# ============== Helper Functions ==============

def get_plan_limits(plan_id: str) -> dict:
    """Get limits for a plan"""
    plan_key = plan_id.lower().replace(" ", "_")
    return PLAN_LIMITS.get(plan_key, PLAN_LIMITS["free"])


def get_month_start() -> datetime:
    """Get the start of the current billing month"""
    now = datetime.now(timezone.utc)
    return datetime(now.year, now.month, 1, tzinfo=timezone.utc)


async def get_user_plan(user_id: str) -> str:
    """Get user's current subscription plan"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "plan": 1, "subscription_status": 1})
    if not user:
        return "free"
    
    # Check if subscription is active
    status = user.get("subscription_status", "active")
    if status in ["cancelled", "expired", "past_due"]:
        return "free"
    
    return user.get("plan", "free").lower()


async def get_user_usage(user_id: str, feature: str, period_start: datetime = None) -> float:
    """Get user's usage for a specific feature in the current billing period"""
    if period_start is None:
        period_start = get_month_start()
    
    usage = await db.usage_records.aggregate([
        {
            "$match": {
                "user_id": user_id,
                "feature": feature,
                "created_at": {"$gte": period_start.isoformat()}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$amount"}
            }
        }
    ]).to_list(1)
    
    return usage[0]["total"] if usage else 0


async def record_usage(user_id: str, feature: str, amount: float = 1, metadata: dict = None):
    """Record usage for a feature"""
    record = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "feature": feature,
        "amount": amount,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.usage_records.insert_one(record)
    return record


async def check_entitlement(user_id: str, feature: str, amount: float = 1) -> UsageCheckResponse:
    """Check if user has entitlement for a feature"""
    plan = await get_user_plan(user_id)
    limits = get_plan_limits(plan)
    
    # Map feature names to limit keys
    feature_limit_map = {
        "meetings": "meetings_per_month",
        "transcription": "transcription_minutes",
        "storage": "storage_gb",
        "workspaces": "workspaces",
        "team_members": "team_members",
        "video": "video_duration_seconds",
        "ai_chat": "ai_chat_messages",
        "shifts": "shifts_per_workspace",
    }
    
    limit_key = feature_limit_map.get(feature, feature)
    limit = limits.get(limit_key, 0)
    
    # -1 means unlimited
    if limit == -1:
        return UsageCheckResponse(
            allowed=True,
            current_usage=0,
            limit=-1,
            remaining=-1,
            percentage_used=0,
            message="Unlimited access"
        )
    
    current_usage = await get_user_usage(user_id, feature)
    remaining = max(0, limit - current_usage)
    percentage_used = (current_usage / limit * 100) if limit > 0 else 0
    
    # Check if adding the amount would exceed the limit
    allowed = (current_usage + amount) <= limit
    
    if not allowed:
        message = f"You've reached your {feature} limit ({int(current_usage)}/{limit}). Upgrade your plan for more."
    elif percentage_used >= 80:
        message = f"You're approaching your {feature} limit ({int(current_usage)}/{limit}). Consider upgrading."
    else:
        message = f"{feature.title()} usage: {int(current_usage)}/{limit}"
    
    return UsageCheckResponse(
        allowed=allowed,
        current_usage=current_usage,
        limit=limit,
        remaining=remaining,
        percentage_used=round(percentage_used, 1),
        message=message
    )


# ============== API Routes ==============

@router.get("/check/{feature}")
async def check_feature_entitlement(feature: str, user_id: str, amount: float = 1):
    """Check if user can use a specific feature"""
    try:
        result = await check_entitlement(user_id, feature, amount)
        return {
            "success": True,
            "feature": feature,
            **result.model_dump()
        }
    except Exception as e:
        logger.error(f"Error checking entitlement: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage/{user_id}")
async def get_all_usage(user_id: str):
    """Get user's current usage across all features"""
    try:
        plan = await get_user_plan(user_id)
        limits = get_plan_limits(plan)
        
        features = ["meetings", "transcription", "storage", "ai_chat", "workspaces"]
        usage_data = {}
        
        for feature in features:
            current = await get_user_usage(user_id, feature)
            limit_key = {
                "meetings": "meetings_per_month",
                "transcription": "transcription_minutes",
                "storage": "storage_gb",
                "ai_chat": "ai_chat_messages",
                "workspaces": "workspaces"
            }.get(feature, feature)
            
            limit = limits.get(limit_key, 0)
            
            usage_data[feature] = {
                "current": current,
                "limit": limit if limit != -1 else "Unlimited",
                "remaining": max(0, limit - current) if limit != -1 else "Unlimited",
                "percentage": round(current / limit * 100, 1) if limit > 0 else 0
            }
        
        # Get storage usage from actual files
        storage_result = await db.user_files.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total_bytes": {"$sum": "$size"}}}
        ]).to_list(1)
        
        storage_used_gb = (storage_result[0]["total_bytes"] / (1024**3)) if storage_result else 0
        storage_limit = limits.get("storage_gb", 1)
        
        usage_data["storage"] = {
            "current": round(storage_used_gb, 2),
            "limit": storage_limit if storage_limit != -1 else "Unlimited",
            "remaining": round(max(0, storage_limit - storage_used_gb), 2) if storage_limit != -1 else "Unlimited",
            "percentage": round(storage_used_gb / storage_limit * 100, 1) if storage_limit > 0 else 0,
            "unit": "GB"
        }
        
        # Get workspace count
        workspace_count = await db.workspaces.count_documents({
            "$or": [
                {"owner_id": user_id},
                {"members.user_id": user_id}
            ]
        })
        workspace_limit = limits.get("workspaces", 1)
        
        usage_data["workspaces"] = {
            "current": workspace_count,
            "limit": workspace_limit if workspace_limit != -1 else "Unlimited",
            "remaining": max(0, workspace_limit - workspace_count) if workspace_limit != -1 else "Unlimited",
            "percentage": round(workspace_count / workspace_limit * 100, 1) if workspace_limit > 0 else 0
        }
        
        return {
            "success": True,
            "user_id": user_id,
            "plan": plan,
            "usage": usage_data,
            "billing_period_start": get_month_start().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/record")
async def record_feature_usage(usage: UsageRecord):
    """Record usage for a feature (internal use)"""
    try:
        # First check if allowed
        check = await check_entitlement(usage.user_id, usage.feature, usage.amount)
        
        if not check.allowed:
            raise HTTPException(
                status_code=403,
                detail={
                    "message": check.message,
                    "current_usage": check.current_usage,
                    "limit": check.limit,
                    "upgrade_required": True
                }
            )
        
        # Record the usage
        record = await record_usage(usage.user_id, usage.feature, usage.amount, usage.metadata)
        
        return {
            "success": True,
            "recorded": True,
            "usage_id": record["id"],
            "new_total": check.current_usage + usage.amount,
            "remaining": check.remaining - usage.amount if check.remaining != -1 else "Unlimited"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recording usage: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/limits/{plan_id}")
async def get_plan_limits_endpoint(plan_id: str):
    """Get limits for a specific plan"""
    try:
        limits = get_plan_limits(plan_id)
        return {
            "success": True,
            "plan": plan_id,
            "limits": limits
        }
    except Exception as e:
        logger.error(f"Error fetching plan limits: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{user_id}")
async def get_usage_summary(user_id: str):
    """Get a quick usage summary for display in UI"""
    try:
        plan = await get_user_plan(user_id)
        limits = get_plan_limits(plan)
        
        # Get key usage metrics
        meetings = await get_user_usage(user_id, "meetings")
        transcription = await get_user_usage(user_id, "transcription")
        ai_chat = await get_user_usage(user_id, "ai_chat")
        
        # Storage
        storage_result = await db.user_files.aggregate([
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": None, "total_bytes": {"$sum": "$size"}}}
        ]).to_list(1)
        storage_gb = (storage_result[0]["total_bytes"] / (1024**3)) if storage_result else 0
        
        # Workspaces
        workspace_count = await db.workspaces.count_documents({
            "$or": [{"owner_id": user_id}, {"members.user_id": user_id}]
        })
        
        def format_usage(current, limit):
            if limit == -1:
                return {"current": current, "limit": "∞", "status": "ok"}
            pct = (current / limit * 100) if limit > 0 else 0
            status = "critical" if pct >= 90 else "warning" if pct >= 70 else "ok"
            return {"current": current, "limit": limit, "percentage": round(pct, 1), "status": status}
        
        return {
            "success": True,
            "plan": plan.title(),
            "summary": {
                "meetings": format_usage(meetings, limits["meetings_per_month"]),
                "transcription": format_usage(transcription, limits["transcription_minutes"]),
                "storage": format_usage(round(storage_gb, 2), limits["storage_gb"]),
                "ai_chat": format_usage(ai_chat, limits["ai_chat_messages"]),
                "workspaces": format_usage(workspace_count, limits["workspaces"])
            },
            "needs_upgrade": any(
                format_usage(v, limits[k])["status"] == "critical" 
                for k, v in [
                    ("meetings_per_month", meetings),
                    ("transcription_minutes", transcription),
                    ("ai_chat_messages", ai_chat),
                    ("workspaces", workspace_count)
                ]
            )
        }
    except Exception as e:
        logger.error(f"Error fetching usage summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Enforcement Middleware Helpers ==============

async def enforce_meeting_limit(user_id: str) -> bool:
    """Check and enforce meeting limit before starting a meeting"""
    check = await check_entitlement(user_id, "meetings", 1)
    if not check.allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "MEETING_LIMIT_REACHED",
                "message": check.message,
                "upgrade_url": "/pricing"
            }
        )
    return True


async def enforce_transcription_limit(user_id: str, minutes: float) -> bool:
    """Check and enforce transcription limit"""
    check = await check_entitlement(user_id, "transcription", minutes)
    if not check.allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "TRANSCRIPTION_LIMIT_REACHED",
                "message": check.message,
                "upgrade_url": "/pricing"
            }
        )
    return True


async def enforce_storage_limit(user_id: str, file_size_bytes: int) -> bool:
    """Check and enforce storage limit before file upload"""
    file_size_gb = file_size_bytes / (1024**3)
    check = await check_entitlement(user_id, "storage", file_size_gb)
    if not check.allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "STORAGE_LIMIT_REACHED",
                "message": check.message,
                "upgrade_url": "/pricing"
            }
        )
    return True


async def enforce_workspace_limit(user_id: str) -> bool:
    """Check and enforce workspace creation limit"""
    check = await check_entitlement(user_id, "workspaces", 1)
    if not check.allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "WORKSPACE_LIMIT_REACHED",
                "message": check.message,
                "upgrade_url": "/pricing"
            }
        )
    return True


async def enforce_ai_chat_limit(user_id: str) -> bool:
    """Check and enforce AI chat message limit"""
    check = await check_entitlement(user_id, "ai_chat", 1)
    if not check.allowed:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "AI_CHAT_LIMIT_REACHED",
                "message": check.message,
                "upgrade_url": "/pricing"
            }
        )
    return True
