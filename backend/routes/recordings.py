"""
Recording routes - CRUD, sharing, streaming, auto-transcription.
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from pydantic import BaseModel
import uuid
import base64
import secrets
import asyncio
import io
import os

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


# ============== Auto-Transcription ==============

async def _transcribe_recording(recording_id: str, grid_id_str: str):
    """Background task: fetch audio from GridFS, send to Whisper, store transcript."""
    try:
        from bson import ObjectId
        from llm_client import speech_to_text
        
        logger.info(f"Starting transcription for recording {recording_id}")
        
        await db.recordings.update_one(
            {"id": recording_id},
            {"$set": {"transcript_status": "processing", "transcript_updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Read file from GridFS
        grid_out = await fs_recordings.open_download_stream(ObjectId(grid_id_str))
        file_bytes = await grid_out.read()
        
        # Whisper expects a file-like object with a name attribute
        audio_file = io.BytesIO(file_bytes)
        audio_file.name = "recording.webm"
        
        # Call Whisper via Emergent LLM proxy (run in thread to avoid blocking)
        api_key = os.environ.get("EMERGENT_LLM_KEY") or os.environ.get("EMERGENT_API_KEY", "")
        result = await asyncio.to_thread(speech_to_text, audio_file, api_key=api_key)
        
        transcript_text = result.text if hasattr(result, 'text') else str(result)
        
        await db.recordings.update_one(
            {"id": recording_id},
            {"$set": {
                "transcript": transcript_text,
                "transcript_status": "completed",
                "transcript_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        logger.info(f"Transcription completed for recording {recording_id} ({len(transcript_text)} chars)")
        
    except Exception as e:
        logger.error(f"Transcription failed for recording {recording_id}: {e}")
        await db.recordings.update_one(
            {"id": recording_id},
            {"$set": {
                "transcript_status": "failed",
                "transcript_error": str(e)[:500],
                "transcript_updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )


# ============== Routes ==============

@router.post("")
async def create_recording(recording: RecordingCreate, background_tasks: BackgroundTasks):
    """Create a new recording and kick off auto-transcription"""
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
            "pinned": False,
            "is_shared": False,
            "share_token": None,
            "shared_with": [],
            "transcript": None,
            "transcript_status": "pending",
            "transcript_error": None,
            "transcript_updated_at": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        }
        
        await db.recordings.insert_one(recording_doc)
        
        # Kick off auto-transcription in background
        background_tasks.add_task(_transcribe_recording, recording_id, str(grid_id))
        
        # Return without grid_id and _id
        result = {k: v for k, v in recording_doc.items() if k not in ["grid_id", "_id"]}
        
        logger.info(f"Recording {recording_id} created for user {recording.user_id}, transcription queued")
        return {"success": True, "recording": result}
    except Exception as e:
        logger.error(f"Error creating recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
async def get_user_recordings(user_id: str, category: Optional[str] = None, limit: int = 50, offset: int = 0):
    """Get recordings for a user with pagination. Pinned recordings sort first."""
    limit = min(max(limit, 1), 200)
    query = {"user_id": user_id}
    if category:
        query["category"] = category
    
    total = await db.recordings.count_documents(query)
    
    recordings = await db.recordings.find(
        query,
        {"_id": 0, "grid_id": 0, "file_data": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).skip(offset).limit(limit).to_list(limit)
    
    return {"recordings": recordings, "count": len(recordings), "total": total, "limit": limit, "offset": offset}


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


@router.get("/{user_id}/{recording_id}/transcript")
async def get_transcript(user_id: str, recording_id: str):
    """Get the transcript for a recording"""
    recording = await db.recordings.find_one(
        {"id": recording_id, "$or": [{"user_id": user_id}, {"shared_with": user_id}]},
        {"_id": 0, "transcript": 1, "transcript_status": 1, "transcript_error": 1, "transcript_updated_at": 1, "title": 1, "id": 1}
    )
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    return {
        "id": recording.get("id"),
        "title": recording.get("title"),
        "transcript": recording.get("transcript"),
        "transcript_status": recording.get("transcript_status", "none"),
        "transcript_error": recording.get("transcript_error"),
        "transcript_updated_at": recording.get("transcript_updated_at"),
    }


@router.post("/{user_id}/{recording_id}/retranscribe")
async def retranscribe_recording(user_id: str, recording_id: str, background_tasks: BackgroundTasks):
    """Re-trigger transcription for a recording (e.g., after failure)"""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    await db.recordings.update_one(
        {"id": recording_id},
        {"$set": {"transcript_status": "pending", "transcript_error": None, "transcript": None}}
    )
    
    background_tasks.add_task(_transcribe_recording, recording_id, recording["grid_id"])
    
    return {"success": True, "message": "Transcription re-queued"}


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


@router.put("/{user_id}/{recording_id}/pin")
async def toggle_pin_recording(user_id: str, recording_id: str):
    """Toggle pin status. Pinned recordings are exempt from 7-day auto-deletion."""
    recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
    
    if not recording:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    new_pinned = not recording.get("pinned", False)
    update_data = {"pinned": new_pinned}
    
    if new_pinned:
        # Remove expiry for pinned recordings
        update_data["expires_at"] = None
    else:
        # Restore 7-day expiry from now when unpinning
        update_data["expires_at"] = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    
    await db.recordings.update_one({"id": recording_id}, {"$set": update_data})
    
    updated = await db.recordings.find_one({"id": recording_id}, {"_id": 0, "grid_id": 0})
    logger.info(f"Recording {recording_id} {'pinned' if new_pinned else 'unpinned'} by {user_id}")
    return {"success": True, "recording": updated, "pinned": new_pinned}


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
    
    result = {"success": True, "recording": updated}
    if share.is_public and "share_token" in update_data:
        result["share_url"] = f"/shared/recording/{update_data['share_token']}"
    
    return result


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
