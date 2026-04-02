"""
Admin Video Routes — video history stats, listing, CRUD, API key settings.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
from pydantic import BaseModel
from config import db, logger

router = APIRouter(prefix="/admin", tags=["Admin Video"])


# ── Video History ──

@router.get("/video-history/stats")
async def get_video_stats():
    try:
        total = await db.video_history.count_documents({})
        pipeline = [{"$group": {"_id": None, "total_size": {"$sum": "$file_size"}}}]
        result = await db.video_history.aggregate(pipeline).to_list(1)
        total_size = result[0]["total_size"] if result else 0
        duration_pipeline = [{"$group": {"_id": "$duration", "count": {"$sum": 1}}}]
        duration_stats = await db.video_history.aggregate(duration_pipeline).to_list(None)
        return {
            "total_videos": total,
            "total_storage_bytes": total_size,
            "total_storage_mb": round(total_size / (1024 * 1024), 2) if total_size else 0,
            "videos_by_duration": {str(d["_id"]): d["count"] for d in duration_stats},
        }
    except Exception as e:
        logger.error(f"Error fetching video stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-history")
async def get_all_video_history(
    limit: int = Query(default=50, le=100),
    skip: int = 0,
    search: Optional[str] = None,
):
    try:
        query = {}
        if search:
            query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"prompt": {"$regex": search, "$options": "i"}},
            ]
        cursor = db.video_history.find(query, {"video_base64": 0}).sort("created_at", -1).skip(skip).limit(limit)
        videos = []
        now = datetime.now(timezone.utc)
        async for doc in cursor:
            created_at = doc.get("created_at")
            days_remaining = None
            if created_at:
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
                "days_until_deletion": days_remaining,
            })
        total = await db.video_history.count_documents(query)
        return {"videos": videos, "total": total, "limit": limit, "skip": skip}
    except Exception as e:
        logger.error(f"Error fetching video history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/video-history/{video_id}")
async def get_admin_video(video_id: str):
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
            "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching video: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/video-history/{video_id}")
async def delete_admin_video(video_id: str):
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
    try:
        result = await db.video_history.delete_many({})
        return {"success": True, "deleted_count": result.deleted_count, "message": f"Deleted {result.deleted_count} videos"}
    except Exception as e:
        logger.error(f"Error deleting all videos: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Video API Key Settings ──

class VideoAPIKeyUpdate(BaseModel):
    api_key: str
    provider: str = "openai"

@router.get("/video-api-settings")
async def get_video_api_settings():
    try:
        settings = await db.admin_settings.find_one({"category": "video_api"})
        if not settings:
            return {"success": True, "configured": False, "provider": "openai", "key_preview": None}
        api_key = settings.get("api_key", "")
        masked_key = f"{api_key[:8]}...{api_key[-4:]}" if len(api_key) > 12 else "****"
        return {
            "success": True,
            "configured": bool(api_key),
            "provider": settings.get("provider", "openai"),
            "key_preview": masked_key if api_key else None,
            "updated_at": settings.get("updated_at"),
        }
    except Exception as e:
        logger.error(f"Error getting video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-api-settings")
async def update_video_api_settings(request: VideoAPIKeyUpdate):
    try:
        await db.admin_settings.update_one(
            {"category": "video_api"},
            {"$set": {"category": "video_api", "api_key": request.api_key, "provider": request.provider, "updated_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        masked_key = f"{request.api_key[:8]}...{request.api_key[-4:]}" if len(request.api_key) > 12 else "****"
        return {"success": True, "message": "Video API key updated successfully", "key_preview": masked_key}
    except Exception as e:
        logger.error(f"Error updating video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/video-api-settings")
async def delete_video_api_settings():
    try:
        await db.admin_settings.delete_one({"category": "video_api"})
        return {"success": True, "message": "Video API key removed"}
    except Exception as e:
        logger.error(f"Error deleting video API settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/video-api-settings/test")
async def test_video_api_key():
    try:
        settings = await db.admin_settings.find_one({"category": "video_api"})
        if not settings or not settings.get("api_key"):
            return {"success": False, "error": "No API key configured"}
        return {"success": True, "message": "API key is configured", "provider": settings.get("provider", "openai")}
    except Exception as e:
        logger.error(f"Error testing video API key: {e}")
        return {"success": False, "error": str(e)}
