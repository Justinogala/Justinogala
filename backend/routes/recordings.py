"""
Recording routes - CRUD, sharing, streaming.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid
import base64
import secrets

from config import db, fs_recordings, logger

router = APIRouter(prefix="/recordings", tags=["Recordings"])


# ============== Models ==============

class RecordingCreate(BaseModel):
    user_id: str
    title: str
    recording_type: str
    duration: int
    file_data: str
    mime_type: str = "video/webm"
    category: str = "Uncategorized"

class RecordingUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None

class RecordingShare(BaseModel):
    share_with_users: List[str] = []
    is_public: bool = False


# ============== Routes ==============

@router.post("")
async def create_recording(recording: RecordingCreate):
    """Create a new recording"""
    try:
        file_bytes = base64.b64decode(recording.file_data)
        recording_id = str(uuid.uuid4())
        
        # Store in GridFS
        grid_id = await fs_recordings.upload_from_stream(
            f"{recording.title}.webm",
            file_bytes,
            metadata={
                "recording_id": recording_id,
                "user_id": recording.user_id,
                "recording_type": recording.recording_type
            }
        )
        
        recording_doc = {
            "id": recording_id,
            "grid_id": str(grid_id),
            "user_id": recording.user_id,
            "title": recording.title,
            "recording_type": recording.recording_type,
            "duration": recording.duration,
            "file_size": len(file_bytes),
            "mime_type": recording.mime_type,
            "category": recording.category,
            "is_shared": False,
            "share_token": None,
            "shared_with": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }
        
        await db.recordings.insert_one(recording_doc)
        
        # Return without grid_id and _id
        result = {k: v for k, v in recording_doc.items() if k not in ["grid_id", "_id"]}
        
        logger.info(f"Recording {recording_id} created for user {recording.user_id}")
        return {"success": True, "recording": result}
    except Exception as e:
        logger.error(f"Error creating recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_recordings(user_id: str, category: Optional[str] = None):
    """Get all recordings for a user"""
    query = {"user_id": user_id}
    if category:
        query["category"] = category
    
    recordings = await db.recordings.find(
        query,
        {"_id": 0, "grid_id": 0, "file_data": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"recordings": recordings, "count": len(recordings)}


@router.get("/user/{user_id}/categories")
async def get_user_recording_categories(user_id: str):
    """Get unique categories for a user's recordings"""
    pipeline = [
        {"$match": {"user_id": user_id}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    
    result = await db.recordings.aggregate(pipeline).to_list(50)
    categories = [{"name": r["_id"], "count": r["count"]} for r in result]
    
    return {"categories": categories}


@router.get("/user/{user_id}/shared-with-me")
async def get_shared_recordings(user_id: str):
    """Get recordings shared with a user"""
    recordings = await db.recordings.find(
        {"shared_with": user_id},
        {"_id": 0, "grid_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return {"recordings": recordings, "count": len(recordings)}


@router.get("/{user_id}/{recording_id}")
async def get_recording(user_id: str, recording_id: str):
    """Get a specific recording"""
    recording = await db.recordings.find_one(
        {"id": recording_id, "user_id": user_id},
        {"_id": 0, "grid_id": 0}
    )
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    return recording


@router.get("/{user_id}/{recording_id}/stream")
async def stream_recording(user_id: str, recording_id: str):
    """Stream a recording file"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        from bson import ObjectId
        grid_out = await fs_recordings.open_download_stream(ObjectId(recording["grid_id"]))
        
        async def file_iterator():
            while True:
                chunk = await grid_out.read(8192)
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_iterator(),
            media_type=recording.get("mime_type", "video/webm"),
            headers={
                "Content-Disposition": f'inline; filename="{recording["title"]}.webm"',
                "Accept-Ranges": "bytes"
            }
        )
    except Exception as e:
        logger.error(f"Error streaming recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{user_id}/{recording_id}")
async def delete_recording(user_id: str, recording_id: str):
    """Delete a recording"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        from bson import ObjectId
        await fs_recordings.delete(ObjectId(recording["grid_id"]))
        await db.recordings.delete_one({"id": recording_id})
        
        logger.info(f"Recording {recording_id} deleted")
        return {"success": True, "message": "Recording deleted"}
    except Exception as e:
        logger.error(f"Error deleting recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{user_id}/{recording_id}")
async def update_recording(user_id: str, recording_id: str, update: RecordingUpdate):
    """Update recording metadata"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    await db.recordings.update_one(
        {"id": recording_id},
        {"$set": update_data}
    )
    
    updated = await db.recordings.find_one({"id": recording_id}, {"_id": 0, "grid_id": 0})
    return {"success": True, "recording": updated}


@router.post("/{user_id}/{recording_id}/share")
async def share_recording(user_id: str, recording_id: str, share: RecordingShare):
    """Share a recording"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    update_data = {"is_shared": True}
    
    if share.is_public:
        share_token = secrets.token_urlsafe(32)
        update_data["share_token"] = share_token
    
    if share.share_with_users:
        update_data["shared_with"] = list(set(recording.get("shared_with", []) + share.share_with_users))
    
    await db.recordings.update_one({"id": recording_id}, {"$set": update_data})
    
    updated = await db.recordings.find_one({"id": recording_id}, {"_id": 0, "grid_id": 0})
    return {"success": True, "recording": updated}


@router.delete("/{user_id}/{recording_id}/share")
async def unshare_recording(user_id: str, recording_id: str):
    """Remove sharing from a recording"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    await db.recordings.update_one(
        {"id": recording_id},
        {"$set": {"is_shared": False, "share_token": None, "shared_with": []}}
    )
    
    return {"success": True, "message": "Sharing removed"}


@router.get("/shared/{share_token}")
async def get_shared_recording(share_token: str):
    """Get a publicly shared recording by token"""
    recording = await db.recordings.find_one(
        {"share_token": share_token, "is_shared": True},
        {"_id": 0, "grid_id": 0}
    )
    
    if not recording:
        raise HTTPException(status_code=404, detail="Shared recording not found or expired")
    
    return recording


@router.get("/shared/{share_token}/stream")
async def stream_shared_recording(share_token: str):
    """Stream a publicly shared recording"""
    recording = await db.recordings.find_one({"share_token": share_token, "is_shared": True})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Shared recording not found")
    
    try:
        from bson import ObjectId
        grid_out = await fs_recordings.open_download_stream(ObjectId(recording["grid_id"]))
        
        async def file_iterator():
            while True:
                chunk = await grid_out.read(8192)
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_iterator(),
            media_type=recording.get("mime_type", "video/webm"),
            headers={"Content-Disposition": f'inline; filename="{recording["title"]}.webm"'}
        )
    except Exception as e:
        logger.error(f"Error streaming shared recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))
