"""
Admin routes - settings, monitoring, analytics, user management, cloud storage.
"""
from fastapi import APIRouter, HTTPException, Request, Query
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List
from pydantic import BaseModel
from collections import defaultdict
import uuid
import asyncio
import resend

from config import db, logger, SENDER_EMAIL
from services.storage import storage_service, STORAGE_PROVIDERS

router = APIRouter(prefix="/admin", tags=["Admin"])


# ============== Models ==============

class AdminSettingsUpdate(BaseModel):
    category: str
    settings: Dict

class UserAccountAction(BaseModel):
    action: str  # enable, disable, force_password_reset, unlock
    reason: Optional[str] = None

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    min_purchase: Optional[float] = None
    applicable_packages: List[str] = []
    description: Optional[str] = None

class TaxRateCreate(BaseModel):
    name: str
    rate: float
    country: str
    region: Optional[str] = None
    tax_type: str = "vat"

class SMTPTestRequest(BaseModel):
    to_email: str

class CloudStorageConfig(BaseModel):
    provider: str
    config: Dict[str, str]

class MigrationRequest(BaseModel):
    target_provider: str


# ============== Helper Functions ==============

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

async def log_audit_event(
    action: str,
    category: Optional[str] = None,
    admin_id: Optional[str] = None,
    admin_email: Optional[str] = "admin",
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    audit_doc = {
        "action": action,
        "category": category,
        "admin_id": admin_id,
        "admin_email": admin_email,
        "details": details or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_doc)
    return audit_doc


# ============== Settings Routes ==============

@router.get("/settings")
async def get_all_admin_settings():
    """Get all admin settings"""
    settings = await db.admin_settings.find({}, {"_id": 0}).to_list(100)
    
    result = {}
    for setting in settings:
        category = setting.get('category')
        if category:
            result[category] = setting.get('settings', {})
    
    return result


@router.get("/settings/{category}")
async def get_admin_settings(category: str):
    """Get settings for a specific category"""
    setting = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    
    if not setting:
        return {"category": category, "settings": {}}
    
    return setting


@router.put("/settings")
async def update_admin_settings(update: AdminSettingsUpdate, request: Request):
    """Update admin settings for a category"""
    try:
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
        
        await log_audit_event(
            action=f"Updated {update.category} settings",
            category="settings",
            details={"category": update.category},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return {"success": True, "settings": settings_doc}
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Audit Logs ==============

@router.get("/audit-logs")
async def get_audit_logs(
    category: Optional[str] = None,
    action: Optional[str] = None,
    admin_id: Optional[str] = None,
    days: int = 30,
    limit: int = 100
):
    """Get audit logs with filtering"""
    try:
        query = {}
        if category:
            query["category"] = category
        if action:
            query["action"] = {"$regex": action, "$options": "i"}
        if admin_id:
            query["admin_id"] = admin_id
        
        logs = await db.audit_logs.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return {"logs": logs, "count": len(logs)}
    except Exception as e:
        logger.error(f"Error fetching audit logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== SMTP Testing ==============

@router.post("/smtp/test")
async def test_smtp(request_data: SMTPTestRequest):
    """Test SMTP configuration by sending a test email"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [request_data.to_email],
            "subject": "SMTP Test - Munal AI",
            "html": """
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>SMTP Test Successful!</h2>
                <p>This is a test email from Munal AI admin panel.</p>
                <p>Sent at: """ + datetime.now(timezone.utc).isoformat() + """</p>
            </div>
            """
        }
        
        result = await asyncio.to_thread(resend.Emails.send, params)
        
        return {"success": True, "message": "Test email sent", "email_id": result.get("id")}
    except Exception as e:
        logger.error(f"SMTP test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== User Activity ==============

@router.get("/users/activity")
async def get_user_activity(
    user_id: Optional[str] = None,
    days: int = 7,
    limit: int = 100
):
    """Get user activity data"""
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


# ============== Analytics ==============

@router.get("/analytics/meetings")
async def get_meeting_analytics(days: int = 30):
    """Get meeting analytics"""
    try:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        
        meetings = await db.calendar_events.find({
            "created_at": {"$gte": since.isoformat()}
        }, {"_id": 0}).to_list(10000)
        
        # Peak hours
        hour_counts = defaultdict(int)
        day_counts = defaultdict(int)
        
        for meeting in meetings:
            try:
                start_time = datetime.fromisoformat(meeting.get("start_time", "").replace("Z", "+00:00"))
                hour_counts[start_time.hour] += 1
                day_counts[start_time.strftime("%Y-%m-%d")] += 1
            except:
                pass
        
        return {
            "total_meetings": len(meetings),
            "peak_hours": [{"hour": h, "count": c} for h, c in sorted(hour_counts.items())],
            "daily_meetings": [{"date": d, "count": c} for d, c in sorted(day_counts.items())],
            "period_days": days
        }
    except Exception as e:
        logger.error(f"Error fetching meeting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== User Management ==============

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
    """Get all users with filtering"""
    try:
        query = {}
        
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
    """Perform action on user account"""
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
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        
        await log_audit_event(
            action=f"User {action}: {user.get('email')}",
            category="user_management",
            details={"user_id": user_id, "action": action, "reason": action_data.reason},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return {"success": True, "message": f"User {action} successful"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing user action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Coupons ==============

@router.get("/coupons")
async def get_coupons(active_only: bool = False):
    """Get all coupons"""
    query = {}
    if active_only:
        query["is_active"] = True
    
    coupons = await db.coupons.find(query, {"_id": 0}).to_list(100)
    return {"coupons": coupons, "count": len(coupons)}


@router.post("/coupons")
async def create_coupon(coupon: CouponCreate, request: Request):
    """Create a new coupon"""
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_doc = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "max_uses": coupon.max_uses,
        "current_uses": 0,
        "expires_at": coupon.expires_at.isoformat() if coupon.expires_at else None,
        "min_purchase": coupon.min_purchase,
        "applicable_packages": coupon.applicable_packages,
        "description": coupon.description,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    await log_audit_event(
        action=f"Created coupon: {coupon.code}",
        category="coupons",
        ip_address=get_client_ip(request)
    )
    
    return {"success": True, "coupon": {k: v for k, v in coupon_doc.items() if k != "_id"}}


@router.delete("/coupons/{coupon_id}")
async def delete_coupon(coupon_id: str, request: Request):
    """Delete a coupon"""
    result = await db.coupons.delete_one({"id": coupon_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    await log_audit_event(
        action=f"Deleted coupon: {coupon_id}",
        category="coupons",
        ip_address=get_client_ip(request)
    )
    
    return {"success": True, "message": "Coupon deleted"}


# ============== Tax Rates ==============

@router.get("/tax-rates")
async def get_tax_rates():
    """Get all tax rates"""
    rates = await db.tax_rates.find({}, {"_id": 0}).to_list(100)
    return {"tax_rates": rates, "count": len(rates)}


@router.post("/tax-rates")
async def create_tax_rate(tax_rate: TaxRateCreate, request: Request):
    """Create a new tax rate"""
    rate_doc = {
        "id": str(uuid.uuid4()),
        "name": tax_rate.name,
        "rate": tax_rate.rate,
        "country": tax_rate.country,
        "region": tax_rate.region,
        "tax_type": tax_rate.tax_type,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tax_rates.insert_one(rate_doc)
    
    await log_audit_event(
        action=f"Created tax rate: {tax_rate.name}",
        category="tax_rates",
        ip_address=get_client_ip(request)
    )
    
    return {"success": True, "tax_rate": {k: v for k, v in rate_doc.items() if k != "_id"}}


@router.delete("/tax-rates/{rate_id}")
async def delete_tax_rate(rate_id: str, request: Request):
    """Delete a tax rate"""
    result = await db.tax_rates.delete_one({"id": rate_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    await log_audit_event(
        action=f"Deleted tax rate: {rate_id}",
        category="tax_rates",
        ip_address=get_client_ip(request)
    )
    
    return {"success": True, "message": "Tax rate deleted"}


# ============== Monitoring Dashboard ==============

@router.get("/monitoring/dashboard")
async def get_monitoring_dashboard():
    """Get monitoring dashboard data"""
    try:
        # User stats
        total_users = await db.users.count_documents({})
        active_users = await db.users.count_documents({"status": "Active"})
        
        # Meeting stats
        total_meetings = await db.calendar_events.count_documents({})
        
        # Recording stats
        total_recordings = await db.recordings.count_documents({})
        
        # Recent activity
        recent_logins = await db.user_activity.find(
            {"action": "login"},
            {"_id": 0}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        return {
            "users": {"total": total_users, "active": active_users},
            "meetings": {"total": total_meetings},
            "recordings": {"total": total_recordings},
            "recent_logins": recent_logins
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitoring/system-health")
async def get_system_health():
    """Get system health status"""
    try:
        # Check database connection
        await db.command("ping")
        db_status = "healthy"
    except:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }



# ============== Cloud Storage Management ==============

@router.get("/storage/providers")
async def get_storage_providers():
    """Get available cloud storage providers and their configuration fields"""
    return {
        "providers": STORAGE_PROVIDERS,
        "provider_list": list(STORAGE_PROVIDERS.keys())
    }


@router.get("/storage/config")
async def get_storage_config():
    """Get current cloud storage configuration"""
    provider, config = await storage_service.load_config()
    
    # Mask sensitive fields
    masked_config = {}
    if config:
        for key, value in config.items():
            if key in ['secret_access_key', 'application_key', 'credentials_json']:
                masked_config[key] = '********' if value else ''
            else:
                masked_config[key] = value
    
    return {
        "current_provider": provider,
        "config": masked_config,
        "provider_info": STORAGE_PROVIDERS.get(provider, {})
    }


@router.post("/storage/config")
async def save_storage_config(config_data: CloudStorageConfig, request: Request):
    """Save cloud storage configuration"""
    try:
        # Validate provider
        if config_data.provider not in STORAGE_PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {config_data.provider}")
        
        # Validate required fields
        provider_info = STORAGE_PROVIDERS[config_data.provider]
        for field in provider_info.get("fields", []):
            if field["required"] and not config_data.config.get(field["key"]):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required field: {field['label']}"
                )
        
        await storage_service.save_config(config_data.provider, config_data.config)
        
        await log_audit_event(
            action=f"Updated cloud storage config to {config_data.provider}",
            category="storage",
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return {"success": True, "message": f"Storage configured for {config_data.provider}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving storage config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/storage/test")
async def test_storage_connection(config_data: CloudStorageConfig):
    """Test connection to cloud storage provider"""
    try:
        result = await storage_service.test_connection(config_data.provider, config_data.config)
        return result
    except Exception as e:
        logger.error(f"Storage test failed: {e}")
        return {"success": False, "message": str(e)}


@router.get("/storage/migration/status")
async def get_migration_status():
    """Get current migration status"""
    status = await storage_service.get_migration_status()
    
    # Get file counts
    recordings_count = await db.recordings.count_documents({})
    chat_files_count = await db.chat_files.count_documents({})
    
    # Count by provider
    recordings_gridfs = await db.recordings.count_documents({"storage_provider": {"$in": [None, "gridfs"]}})
    chat_files_gridfs = await db.chat_files.count_documents({"storage_provider": {"$in": [None, "gridfs"]}})
    
    return {
        "migration": status,
        "storage_stats": {
            "total_recordings": recordings_count,
            "total_chat_files": chat_files_count,
            "recordings_in_gridfs": recordings_gridfs,
            "chat_files_in_gridfs": chat_files_gridfs
        }
    }


@router.post("/storage/migration/start")
async def start_storage_migration(migration: MigrationRequest, request: Request):
    """Start migration to new storage provider"""
    try:
        # Verify target provider is configured
        provider, config = await storage_service.load_config()
        
        if migration.target_provider != provider:
            raise HTTPException(
                status_code=400,
                detail=f"Target provider '{migration.target_provider}' is not configured. Please configure it first."
            )
        
        if migration.target_provider == "gridfs":
            raise HTTPException(
                status_code=400,
                detail="Cannot migrate to GridFS. It's the default storage."
            )
        
        # Test connection first
        test_result = await storage_service.test_connection(provider, config)
        if not test_result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=f"Connection test failed: {test_result.get('message')}"
            )
        
        # Start migration
        status = await storage_service.start_migration(migration.target_provider)
        
        await log_audit_event(
            action=f"Started storage migration to {migration.target_provider}",
            category="storage",
            details={"total_files": status.get("total_files")},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
        
        return {
            "success": True,
            "message": f"Migration started to {migration.target_provider}",
            "status": status
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting migration: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Video History Management ==============

@router.get("/video-history/stats")
async def get_video_stats():
    """Get video history statistics"""
    try:
        total = await db.video_history.count_documents({})
        
        # Get total storage used
        pipeline = [
            {"$group": {"_id": None, "total_size": {"$sum": "$file_size"}}}
        ]
        result = await db.video_history.aggregate(pipeline).to_list(1)
        total_size = result[0]["total_size"] if result else 0
        
        # Get videos by duration
        duration_pipeline = [
            {"$group": {"_id": "$duration", "count": {"$sum": 1}}}
        ]
        duration_stats = await db.video_history.aggregate(duration_pipeline).to_list(None)
        
        return {
            "total_videos": total,
            "total_storage_bytes": total_size,
            "total_storage_mb": round(total_size / (1024 * 1024), 2) if total_size else 0,
            "videos_by_duration": {str(d["_id"]): d["count"] for d in duration_stats}
        }
    except Exception as e:
        logger.error(f"Error fetching video stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-history")
async def get_all_video_history(
    limit: int = Query(default=50, le=100),
    skip: int = 0,
    search: Optional[str] = None
):
    """Get all video history for admin (without video data for listing)"""
    try:
        query = {}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"prompt": {"$regex": search, "$options": "i"}}
            ]
        
        cursor = db.video_history.find(
            query,
            {"video_base64": 0}  # Exclude large video data
        ).sort("created_at", -1).skip(skip).limit(limit)
        
        videos = []
        now = datetime.now(timezone.utc)
        async for doc in cursor:
            # Calculate days until deletion
            created_at = doc.get("created_at")
            days_remaining = None
            if created_at:
                # Ensure timezone awareness
                if created_at.tzinfo is None:
                    created_at = created_at.replace(tzinfo=timezone.utc)
                expires_at = created_at + timedelta(days=7)
                days_remaining = max(0, (expires_at - now).days)
            
            videos.append({
                "id": str(doc["_id"]),
                "title": doc.get("title", "Untitled"),
                "prompt": doc.get("prompt", ""),
                "duration": doc.get("duration"),
                "size": doc.get("size"),
                "file_size": doc.get("file_size"),
                "created_at": created_at.isoformat() if created_at else None,
                "days_until_deletion": days_remaining
            })
        
        total = await db.video_history.count_documents(query)
        
        return {
            "videos": videos,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error fetching video history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-history/{video_id}")
async def get_admin_video(video_id: str):
    """Get a specific video from history (includes video data) - Admin only"""
    try:
        from bson import ObjectId
        
        doc = await db.video_history.find_one({"_id": ObjectId(video_id)})
        
        if not doc:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {
            "id": str(doc["_id"]),
            "title": doc.get("title", "Untitled"),
            "prompt": doc.get("prompt", ""),
            "duration": doc.get("duration"),
            "size": doc.get("size"),
            "file_size": doc.get("file_size"),
            "video_base64": doc.get("video_base64"),
            "mime_type": doc.get("mime_type", "video/mp4"),
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/video-history/{video_id}")
async def delete_admin_video(video_id: str):
    """Delete a video from history - Admin only"""
    try:
        from bson import ObjectId
        
        result = await db.video_history.delete_one({"_id": ObjectId(video_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Video not found")
        
        return {"success": True, "message": "Video deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/video-history")
async def delete_all_videos():
    """Delete all video history - Admin only (use with caution)"""
    try:
        result = await db.video_history.delete_many({})
        return {
            "success": True,
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} videos"
        }
    except Exception as e:
        logger.error(f"Error deleting all videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== Video Generation API Key Settings ==============

class VideoAPIKeyUpdate(BaseModel):
    api_key: str
    provider: str = "openai"  # openai for Sora 2

@router.get("/video-api-settings")
async def get_video_api_settings():
    """Get video generation API key settings (masked)"""
    try:
        settings = await db.admin_settings.find_one({"category": "video_api"})
        
        if not settings:
            return {
                "success": True,
                "configured": False,
                "provider": "openai",
                "key_preview": None
            }
        
        # Mask the API key for display
        api_key = settings.get("api_key", "")
        masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "****"
        
        return {
            "success": True,
            "configured": bool(api_key),
            "provider": settings.get("provider", "openai"),
            "key_preview": masked_key if api_key else None,
            "updated_at": settings.get("updated_at")
        }
    except Exception as e:
        logger.error(f"Error getting video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-api-settings")
async def update_video_api_settings(request: VideoAPIKeyUpdate):
    """Update video generation API key"""
    try:
        await db.admin_settings.update_one(
            {"category": "video_api"},
            {
                "$set": {
                    "category": "video_api",
                    "api_key": request.api_key,
                    "provider": request.provider,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        # Mask for response
        masked_key = f"{request.api_key[:8]}...{request.api_key[-4:]}" if len(request.api_key) > 12 else "****"
        
        return {
            "success": True,
            "message": "Video API key updated successfully",
            "key_preview": masked_key
        }
    except Exception as e:
        logger.error(f"Error updating video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/video-api-settings")
async def delete_video_api_settings():
    """Remove video generation API key"""
    try:
        await db.admin_settings.delete_one({"category": "video_api"})
        return {"success": True, "message": "Video API key removed"}
    except Exception as e:
        logger.error(f"Error deleting video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-api-settings/test")
async def test_video_api_key():
    """Test the configured video API key"""
    try:
        settings = await db.admin_settings.find_one({"category": "video_api"})
        
        if not settings or not settings.get("api_key"):
            return {"success": False, "error": "No API key configured"}
        
        # Try to validate the key by making a simple check
        # For now just return success if key exists
        return {
            "success": True,
            "message": "API key is configured",
            "provider": settings.get("provider", "openai")
        }
    except Exception as e:
        logger.error(f"Error testing video API key: {e}")
        return {"success": False, "error": str(e)}
