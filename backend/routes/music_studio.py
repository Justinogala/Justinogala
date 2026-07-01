"""
Munal Music Studio — AI Music & Sound Effects Generation via ElevenLabs.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os, base64, uuid, logging

from config import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Music Studio"])

ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")


class MusicGenerateRequest(BaseModel):
    prompt: str
    duration_ms: int = 30000  # 3000 - 600000 ms
    instrumental: bool = True
    type: str = "music"  # "music" or "sfx"


class SFXGenerateRequest(BaseModel):
    prompt: str
    duration_seconds: float = 10.0  # 0.5 - 30
    prompt_influence: float = 0.3  # 0-1


@router.get("/music-studio/status")
async def music_studio_status():
    """Check if Music Studio is available"""
    return {
        "available": bool(ELEVENLABS_API_KEY),
        "provider": "elevenlabs",
        "features": ["music", "sound_effects"],
        "limits": {
            "music_max_ms": 600000,
            "sfx_max_seconds": 30,
        }
    }


@router.post("/music-studio/generate-music")
async def generate_music(request: MusicGenerateRequest):
    """Generate AI music or sound effects from a text prompt"""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="Music Studio not configured. Missing ElevenLabs API key.")

    # SFX API max is 30 seconds
    dur_s = request.duration_ms / 1000
    if dur_s < 0.5 or dur_s > 30:
        raise HTTPException(status_code=400, detail="Duration must be between 0.5s and 30s")

    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

        audio_data = b""

        # Use sound effects API for both music and sfx (free tier compatible)
        sfx = client.text_to_sound_effects.convert(
            text=request.prompt,
            duration_seconds=min(30, request.duration_ms / 1000),
            prompt_influence=0.3,
        )
        for chunk in sfx:
            audio_data += chunk

        if not audio_data or len(audio_data) < 100:
            raise Exception("ElevenLabs returned empty audio")

        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        # Save to history
        doc = {
            "id": str(uuid.uuid4()),
            "type": request.type,
            "prompt": request.prompt,
            "duration_ms": request.duration_ms,
            "instrumental": request.instrumental,
            "file_size": len(audio_data),
            "audio_base64": audio_b64,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.music_studio_history.insert_one(doc)
        doc.pop("_id", None)

        logger.info(f"Music Studio: generated {request.type} ({len(audio_data)} bytes) — '{request.prompt[:50]}'")

        return {
            "success": True,
            "audio_base64": audio_b64,
            "type": request.type,
            "duration_ms": request.duration_ms,
            "file_size": len(audio_data),
            "id": doc["id"],
        }

    except Exception as e:
        logger.error(f"Music Studio generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/music-studio/history")
async def get_music_history(limit: int = 20):
    """Get recent music generation history"""
    items = await db.music_studio_history.find(
        {}, {"_id": 0, "audio_base64": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"items": items}


@router.get("/music-studio/history/{item_id}")
async def get_music_item(item_id: str):
    """Get a specific music item with audio data"""
    item = await db.music_studio_history.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/music-studio/history/{item_id}")
async def delete_music_item(item_id: str):
    """Delete a music item"""
    result = await db.music_studio_history.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}
