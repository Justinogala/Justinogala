"""
Admin routes - settings, monitoring, analytics, user management, cloud storage.
"""
from fastapi import APIRouter, HTTPException, Request, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
from typing import Dict, Optional, List
from pydantic import BaseModel
from collections import defaultdict
import uuid
import asyncio
import resend

from config import db, logger, SENDER_EMAIL
from services.storage import storage_service, STORAGE_PROVIDERS
from encryption import decrypt_field

router = APIRouter(prefix="/admin", tags=["Admin"])
security = HTTPBearer(auto_error=False)


async def _get_caller(credentials):
    """Extract caller info from auth token."""
    if not credentials:
        return None
    try:
        from routes.auth import verify_jwt_token
        payload = verify_jwt_token(credentials.credentials)
        user = await db.users.find_one(
            {"id": payload["sub"]},
            {"_id": 0, "id": 1, "role": 1, "organization_id": 1, "name": 1, "email": 1}
        )
        return user
    except Exception:
        return None


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
    user_agent: Optional[str] = None,
    severity: str = "info",
    target_id: Optional[str] = None,
    target_email: Optional[str] = None,
):
    audit_doc = {
        "id": str(uuid.uuid4()),
        "action": action,
        "category": category or "system",
        "severity": severity,
        "actor_id": admin_id,
        "actor_email": admin_email,
        "target_id": target_id,
        "target_email": target_email,
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
# Audit log listing is now handled by /app/backend/routes/audit_logs.py


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
        elif action == "set_role_admin":
            update_data = {"role": "Admin"}
        elif action == "set_role_manager":
            update_data = {"role": "Manager"}
        elif action == "set_role_user":
            update_data = {"role": "User"}
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
        
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        
        await log_audit_event(
            action=f"user_{action}",
            category="user_mgmt",
            severity="warning" if action in ("disable", "set_role_admin") else "info",
            details={"user_id": user_id, "action": action, "reason": action_data.reason},
            target_id=user_id,
            target_email=user.get("email"),
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



# ============== Admin Chat Messages ==============

@router.get("/chat/messages/{user_id}")
async def get_user_messages(user_id: str, limit: int = 100):
    """Get all chat messages for a specific user (as sender or receiver)"""
    try:
        messages = await db.chat_messages.find(
            {
                "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id}
                ]
            },
            {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        
        # Get unique partner IDs
        partner_ids = set()
        for msg in messages:
            if msg["sender_id"] == user_id:
                partner_ids.add(msg["receiver_id"])
            else:
                partner_ids.add(msg["sender_id"])
        
        # Get partner details
        partners = {}
        for partner_id in partner_ids:
            partner = await db.users.find_one({"id": partner_id}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if partner:
                partners[partner_id] = partner
        
        return {
            "success": True,
            "messages": messages,
            "partners": partners,
            "total": len(messages)
        }
    except Exception as e:
        logger.error(f"Error fetching user messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/all-messages")
async def get_all_messages(limit: int = 200, skip: int = 0):
    """Get all chat messages across the platform (for admin monitoring)"""
    try:
        messages = await db.chat_messages.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.chat_messages.count_documents({})
        
        # Get all user IDs involved
        user_ids = set()
        for msg in messages:
            user_ids.add(msg["sender_id"])
            user_ids.add(msg["receiver_id"])
        
        # Get user details
        users = {}
        for uid in user_ids:
            user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if user:
                users[uid] = user
        
        return {
            "success": True,
            "messages": messages,
            "users": users,
            "total": total,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error fetching all messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== Admin Internal Email Messages ==============

@router.get("/internal-messages")
async def get_all_internal_messages(limit: int = 50, skip: int = 0, status: str = "all"):
    """Get all internal email messages for admin monitoring"""
    try:
        query = {}
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "drafts":
            query["is_draft"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        
        # Exclude drafts from main view unless specifically requested
        if status != "drafts":
            query["is_draft"] = {"$ne": True}
        
        messages = await db.user_messages.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(query)
        
        # Get all user IDs involved
        user_ids = set()
        for msg in messages:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        
        # Get user details
        users = {}
        for uid in user_ids:
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
                if user:
                    users[uid] = user
        
        # Get counts for different statuses
        counts = {
            "total": await db.user_messages.count_documents({"is_draft": {"$ne": True}}),
            "unread": await db.user_messages.count_documents({"is_read": False, "is_draft": {"$ne": True}}),
            "drafts": await db.user_messages.count_documents({"is_draft": True}),
            "junk": await db.user_messages.count_documents({"is_junk": True}),
            "trash": await db.user_messages.count_documents({"in_trash": True})
        }
        
        return {
            "success": True,
            "messages": messages,
            "users": users,
            "total": total,
            "counts": counts,
            "limit": limit,
            "skip": skip
        }
    except Exception as e:
        logger.error(f"Error fetching internal messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/{message_id}")
async def get_internal_message_detail(message_id: str):
    """Get detailed view of an internal message including thread"""
    try:
        message = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Get thread if exists
        thread_id = message.get("thread_id", message_id)
        thread = await db.user_messages.find(
            {"$or": [{"id": thread_id}, {"thread_id": thread_id}]},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        
        # Get participants
        user_ids = set()
        for msg in thread:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        
        users = {}
        for uid in user_ids:
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
                if user:
                    users[uid] = user
        
        # Get attachments if any
        attachments = []
        for msg in thread:
            if msg.get("attachments"):
                attachments.extend(msg.get("attachments"))
        
        return {
            "success": True,
            "message": message,
            "thread": thread,
            "users": users,
            "attachments": attachments
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching message detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/internal-messages/{message_id}")
async def admin_delete_internal_message(message_id: str, permanent: bool = False):
    """Admin delete an internal message"""
    try:
        if permanent:
            result = await db.user_messages.delete_one({"id": message_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Message not found")
            return {"success": True, "permanently_deleted": True}
        else:
            result = await db.user_messages.update_one(
                {"id": message_id},
                {"$set": {"in_trash": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Message not found")
            return {"success": True, "moved_to_trash": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))



class AdminReplyRequest(BaseModel):
    content: str


@router.post("/internal-messages/{message_id}/reply")
async def admin_reply_to_message(message_id: str, request: AdminReplyRequest):
    """Admin reply to an internal message"""
    try:
        # Get the original message
        original = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not original:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Get admin user info
        admin = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not admin:
            admin = {"id": "admin", "name": "Admin", "email": "admin@munal.com"}
        
        # Determine recipient (the original sender)
        recipient_id = original["sender_id"]
        recipient = await db.users.find_one({"id": recipient_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        
        reply_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        reply = {
            "id": reply_id,
            "thread_id": original.get("thread_id", message_id),
            "parent_id": message_id,
            "sender_id": admin.get("id"),
            "sender_name": f"Admin ({admin.get('name', 'Support')})",
            "recipient_id": recipient_id,
            "recipient_name": recipient.get("name") if recipient else original.get("sender_name", "Unknown"),
            "subject": f"Re: {original['subject']}",
            "content": request.content,
            "is_read": False,
            "is_starred": False,
            "is_draft": False,
            "is_junk": False,
            "in_trash": False,
            "is_admin_reply": True,
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.user_messages.insert_one(reply)
        reply.pop("_id", None)
        
        return {"success": True, "message": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending admin reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/export/csv")
async def export_messages_csv(
    start_date: str = None, 
    end_date: str = None,
    status: str = "all"
):
    """Export internal messages as CSV for compliance"""
    try:
        import csv
        import io
        
        query = {"is_draft": {"$ne": True}}
        
        if start_date:
            query["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = end_date
            else:
                query["created_at"] = {"$lte": end_date}
        
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header row
        writer.writerow([
            "Message ID",
            "Thread ID",
            "Sender Name",
            "Sender ID",
            "Recipient Name", 
            "Recipient ID",
            "Subject",
            "Content",
            "Status",
            "Is Starred",
            "Is Junk",
            "In Trash",
            "Has Attachments",
            "Created At",
            "Updated At"
        ])
        
        # Data rows
        for msg in messages:
            status_str = "Trash" if msg.get("in_trash") else ("Junk" if msg.get("is_junk") else ("Read" if msg.get("is_read") else "Unread"))
            writer.writerow([
                msg.get("id", ""),
                msg.get("thread_id", ""),
                msg.get("sender_name", ""),
                msg.get("sender_id", ""),
                msg.get("recipient_name", ""),
                msg.get("recipient_id", ""),
                msg.get("subject", ""),
                msg.get("content", "").replace("\n", " "),
                status_str,
                "Yes" if msg.get("is_starred") else "No",
                "Yes" if msg.get("is_junk") else "No",
                "Yes" if msg.get("in_trash") else "No",
                "Yes" if msg.get("attachments") else "No",
                msg.get("created_at", ""),
                msg.get("updated_at", "")
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        from fastapi.responses import Response
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/export/json")
async def export_messages_json(
    start_date: str = None,
    end_date: str = None, 
    status: str = "all"
):
    """Export internal messages as JSON for compliance"""
    try:
        query = {"is_draft": {"$ne": True}}
        
        if start_date:
            query["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = end_date
            else:
                query["created_at"] = {"$lte": end_date}
        
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        
        # Get all user details
        user_ids = set()
        for msg in messages:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        
        users = {}
        for uid in user_ids:
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1})
                if user:
                    users[uid] = user
        
        export_data = {
            "export_date": datetime.now(timezone.utc).isoformat(),
            "total_messages": len(messages),
            "filters": {
                "start_date": start_date,
                "end_date": end_date,
                "status": status
            },
            "users": users,
            "messages": messages
        }
        
        import json
        json_content = json.dumps(export_data, indent=2, default=str)
        
        from fastapi.responses import Response
        return Response(
            content=json_content,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
            }
        )
    except Exception as e:
        logger.error(f"Error exporting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== Scheduled Export & Broadcast ==============

class ScheduledExportCreate(BaseModel):
    name: str
    frequency: str  # daily, weekly, monthly
    format: str  # csv, json
    status_filter: str = "all"
    email_recipients: List[str]
    enabled: bool = True


class BroadcastMessageCreate(BaseModel):
    subject: str
    content: str
    send_email: bool = True


@router.get("/scheduled-exports")
async def get_scheduled_exports(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get scheduled export configurations. Scoped to caller's org for Admin/Manager."""
    try:
        query = {}
        caller = await _get_caller(credentials)
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            org_id = caller.get("organization_id")
            if role in ("admin", "manager") and org_id:
                query["organization_id"] = org_id

        exports = await db.scheduled_exports.find(query, {"_id": 0}).to_list(100)
        return {"success": True, "exports": exports}
    except Exception as e:
        logger.error(f"Error fetching scheduled exports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduled-exports")
async def create_scheduled_export(
    request: ScheduledExportCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a new scheduled export. Scoped to caller's org for Admin/Manager."""
    try:
        export_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        caller = await _get_caller(credentials)
        caller_org_id = None
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            if role in ("admin", "manager"):
                caller_org_id = caller.get("organization_id")
        
        # Calculate next run time based on frequency
        next_run = datetime.now(timezone.utc)
        if request.frequency == "daily":
            next_run += timedelta(days=1)
        elif request.frequency == "weekly":
            next_run += timedelta(weeks=1)
        elif request.frequency == "monthly":
            next_run += timedelta(days=30)
        
        export_config = {
            "id": export_id,
            "name": request.name,
            "frequency": request.frequency,
            "format": request.format,
            "status_filter": request.status_filter,
            "email_recipients": request.email_recipients,
            "enabled": request.enabled,
            "organization_id": caller_org_id,
            "last_run": None,
            "next_run": next_run.isoformat(),
            "run_count": 0,
            "created_at": now,
            "updated_at": now
        }
        
        await db.scheduled_exports.insert_one(export_config)
        export_config.pop("_id", None)
        
        return {"success": True, "export": export_config}
    except Exception as e:
        logger.error(f"Error creating scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/scheduled-exports/{export_id}")
async def update_scheduled_export(export_id: str, request: ScheduledExportCreate):
    """Update a scheduled export configuration"""
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        result = await db.scheduled_exports.update_one(
            {"id": export_id},
            {"$set": {
                "name": request.name,
                "frequency": request.frequency,
                "format": request.format,
                "status_filter": request.status_filter,
                "email_recipients": request.email_recipients,
                "enabled": request.enabled,
                "updated_at": now
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        
        export = await db.scheduled_exports.find_one({"id": export_id}, {"_id": 0})
        return {"success": True, "export": export}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/scheduled-exports/{export_id}")
async def delete_scheduled_export(export_id: str):
    """Delete a scheduled export configuration"""
    try:
        result = await db.scheduled_exports.delete_one({"id": export_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduled-exports/{export_id}/run")
async def run_scheduled_export_now(export_id: str):
    """Manually trigger a scheduled export"""
    try:
        export = await db.scheduled_exports.find_one({"id": export_id}, {"_id": 0})
        if not export:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        
        # Get messages based on filter
        query = {"is_draft": {"$ne": True}}
        if export["status_filter"] == "unread":
            query["is_read"] = False
        elif export["status_filter"] == "read":
            query["is_read"] = True
        
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        
        # Generate export content
        if export["format"] == "csv":
            import csv
            import io
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Message ID", "Sender", "Recipient", "Subject", "Content", "Status", "Created At"])
            for msg in messages:
                status = "Read" if msg.get("is_read") else "Unread"
                writer.writerow([
                    msg.get("id", ""),
                    msg.get("sender_name", ""),
                    msg.get("recipient_name", ""),
                    msg.get("subject", ""),
                    msg.get("content", "").replace("\n", " ")[:500],
                    status,
                    msg.get("created_at", "")
                ])
            export_content = output.getvalue()
            content_type = "text/csv"
            file_ext = "csv"
        else:
            import json
            export_content = json.dumps({"messages": messages, "export_date": datetime.now(timezone.utc).isoformat()}, default=str)
            content_type = "application/json"
            file_ext = "json"
        
        # Send email to recipients
        if export["email_recipients"] and SENDER_EMAIL:
            for recipient in export["email_recipients"]:
                try:
                    params = {
                        "from": SENDER_EMAIL,
                        "to": [recipient],
                        "subject": f"Scheduled Export: {export['name']} - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
                        "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Scheduled Message Export</h2>
                            <p>Your scheduled export <strong>{export['name']}</strong> has been generated.</p>
                            <p>Total messages: {len(messages)}</p>
                            <p>Export format: {export['format'].upper()}</p>
                            <p>Generated at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                            <hr>
                            <p style="color: #666; font-size: 12px;">This is an automated compliance report from Munal AI.</p>
                        </div>
                        """,
                        "attachments": [{
                            "filename": f"messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d')}.{file_ext}",
                            "content": export_content
                        }]
                    }
                    await asyncio.to_thread(resend.Emails.send, params)
                except Exception as email_error:
                    logger.error(f"Failed to send export email to {recipient}: {email_error}")
        
        # Update last run time
        now = datetime.now(timezone.utc)
        next_run = now
        if export["frequency"] == "daily":
            next_run += timedelta(days=1)
        elif export["frequency"] == "weekly":
            next_run += timedelta(weeks=1)
        elif export["frequency"] == "monthly":
            next_run += timedelta(days=30)
        
        await db.scheduled_exports.update_one(
            {"id": export_id},
            {"$set": {
                "last_run": now.isoformat(),
                "next_run": next_run.isoformat(),
                "run_count": export.get("run_count", 0) + 1
            }}
        )
        
        return {
            "success": True,
            "messages_exported": len(messages),
            "recipients_notified": len(export["email_recipients"])
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Admin Broadcast Messages ==============

@router.get("/broadcasts")
async def get_broadcasts(
    limit: int = 50,
    skip: int = 0,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get broadcast messages. Admin sees own org's broadcasts, Super_Admin sees all."""
    try:
        query = {}
        caller = await _get_caller(credentials)
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            org_id = caller.get("organization_id")
            if role in ("admin", "manager") and org_id:
                query["organization_id"] = org_id

        broadcasts = await db.admin_broadcasts.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.admin_broadcasts.count_documents(query)
        
        return {
            "success": True,
            "broadcasts": broadcasts,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error fetching broadcasts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcasts")
async def create_broadcast(
    request: BroadcastMessageCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Send a broadcast message. Admin/Manager sends to their org only, Super_Admin sends to all."""
    try:
        broadcast_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        caller = await _get_caller(credentials)
        caller_role = ""
        caller_org_id = None
        org_name = None
        
        if caller:
            caller_role = (caller.get("role") or "").lower().replace(" ", "_")
            caller_org_id = caller.get("organization_id")
        
        # Determine user query based on caller's role
        user_query = {"status": {"$ne": "disabled"}, "id": {"$exists": True, "$ne": None}}
        
        if caller_role in ("admin", "manager") and caller_org_id:
            # Admin/Manager: only broadcast to their organization members
            user_query["organization_id"] = caller_org_id
            org = await db.organizations.find_one({"id": caller_org_id}, {"_id": 0, "name": 1})
            org_name = org.get("name") if org else "Organization"
        # Super_Admin or no auth: broadcast to all users
        
        users = await db.users.find(
            user_query,
            {"_id": 0, "id": 1, "name": 1, "email": 1}
        ).to_list(10000)
        
        # Filter out users without valid IDs
        users = [u for u in users if u.get("id")]
        
        if not users:
            raise HTTPException(status_code=400, detail="No active users found")
        
        # Get admin info
        admin_info = caller or {"id": "admin", "name": "Admin", "email": "admin@munal.com"}
        
        # Create individual messages for each user
        messages_created = 0
        emails_sent = 0
        
        for user in users:
            if not user.get("id"):
                continue
                
            message_id = str(uuid.uuid4())
            message = {
                "id": message_id,
                "thread_id": message_id,
                "broadcast_id": broadcast_id,
                "sender_id": admin_info.get("id") or "admin",
                "sender_name": admin_info.get("name") or "Munal Admin",
                "recipient_id": user["id"],
                "recipient_name": user.get("name") or user.get("email", "User"),
                "subject": request.subject,
                "content": request.content,
                "is_read": False,
                "is_starred": False,
                "is_draft": False,
                "is_junk": False,
                "in_trash": False,
                "is_broadcast": True,
                "deleted_by_sender": False,
                "deleted_by_recipient": False,
                "created_at": now,
                "updated_at": now
            }
            
            await db.user_messages.insert_one(message)
            messages_created += 1
            
            # Send email notification if requested
            if request.send_email and SENDER_EMAIL and user.get("email"):
                try:
                    params = {
                        "from": SENDER_EMAIL,
                        "to": [user["email"]],
                        "subject": f"[Munal] {request.subject}",
                        "html": f"""
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                                <h1 style="color: white; margin: 0;">Munal AI</h1>
                            </div>
                            <div style="padding: 30px; background: #f9fafb;">
                                <h2 style="color: #1f2937;">{request.subject}</h2>
                                <div style="color: #4b5563; line-height: 1.6;">
                                    {request.content.replace(chr(10), '<br>')}
                                </div>
                                <a href="https://munal.ai/messages" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View in App</a>
                            </div>
                            <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                                <p>&copy; 2026 Munal AI. All rights reserved.</p>
                            </div>
                        </div>
                        """
                    }
                    await asyncio.to_thread(resend.Emails.send, params)
                    emails_sent += 1
                except Exception as email_error:
                    logger.error(f"Failed to send broadcast email to {user['email']}: {email_error}")
        
        # Save broadcast record with org scoping
        broadcast = {
            "id": broadcast_id,
            "subject": request.subject,
            "content": request.content,
            "send_email": request.send_email,
            "recipients_count": len(users),
            "messages_created": messages_created,
            "emails_sent": emails_sent,
            "organization_id": caller_org_id,
            "org_name": org_name,
            "created_at": now,
            "created_by": admin_info.get("id")
        }
        
        await db.admin_broadcasts.insert_one(broadcast)
        broadcast.pop("_id", None)
        
        return {
            "success": True,
            "broadcast": broadcast
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/broadcasts/{broadcast_id}")
async def get_broadcast_detail(broadcast_id: str):
    """Get broadcast details including delivery stats"""
    try:
        broadcast = await db.admin_broadcasts.find_one({"id": broadcast_id}, {"_id": 0})
        if not broadcast:
            raise HTTPException(status_code=404, detail="Broadcast not found")
        
        # Get read stats for this broadcast
        total_messages = await db.user_messages.count_documents({"broadcast_id": broadcast_id})
        read_messages = await db.user_messages.count_documents({"broadcast_id": broadcast_id, "is_read": True})
        
        broadcast["delivery_stats"] = {
            "total_delivered": total_messages,
            "total_read": read_messages,
            "read_rate": round((read_messages / total_messages * 100) if total_messages > 0 else 0, 1)
        }
        
        return {"success": True, "broadcast": broadcast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching broadcast detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/broadcasts/{broadcast_id}")
async def delete_broadcast(broadcast_id: str):
    """Delete a broadcast and all associated messages"""
    try:
        # Delete all messages from this broadcast
        await db.user_messages.delete_many({"broadcast_id": broadcast_id})
        
        # Delete broadcast record
        result = await db.admin_broadcasts.delete_one({"id": broadcast_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Broadcast not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))
