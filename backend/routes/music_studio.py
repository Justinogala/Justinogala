"""
Munal Music Studio — AI Music Generation via Suno API (sunoapi.org).
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os, base64, uuid, logging, requests, time

from config import db

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Music Studio"])

SUNO_API_KEY = os.environ.get("SUNO_API_KEY", "")
SUNO_BASE_URL = "https://api.sunoapi.org"
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")


class MusicGenerateRequest(BaseModel):
    prompt: str
    instrumental: bool = False
    custom_mode: bool = False
    title: str = ""
    style: str = ""  # e.g. "Pop, Upbeat, 120 BPM"
    type: str = "music"  # "music" or "sfx"


class SFXGenerateRequest(BaseModel):
    prompt: str
    duration_seconds: float = 10.0


# In-memory job store for async generation
music_jobs = {}


@router.get("/music-studio/status")
async def music_studio_status():
    """Check if Music Studio is available"""
    return {
        "available": bool(SUNO_API_KEY),
        "provider": "suno",
        "features": ["music", "sound_effects"],
        "sfx_available": bool(ELEVENLABS_API_KEY),
    }


@router.post("/music-studio/generate")
async def generate_music(request: MusicGenerateRequest):
    """Generate AI music via Suno or sound effects via ElevenLabs"""
    if request.type == "sfx":
        return await _generate_sfx(request.prompt)

    if not SUNO_API_KEY:
        raise HTTPException(status_code=500, detail="Music Studio not configured. Missing Suno API key.")

    try:
        headers = {
            "Authorization": f"Bearer {SUNO_API_KEY}",
            "Content-Type": "application/json"
        }

        payload = {
            "prompt": request.prompt,
            "model": "V4_5ALL",
            "instrumental": request.instrumental,
            "customMode": request.custom_mode,
            "callBackUrl": "https://example.com/no-op",
        }
        if request.custom_mode and request.title:
            payload["title"] = request.title
        if request.custom_mode and request.style:
            payload["style"] = request.style

        # Submit generation request
        res = requests.post(
            f"{SUNO_BASE_URL}/api/v1/generate",
            json=payload, headers=headers, timeout=30
        )

        if res.status_code != 200:
            logger.error(f"Suno API error: {res.status_code} {res.text[:300]}")
            raise HTTPException(status_code=res.status_code, detail=f"Suno API error: {res.text[:200]}")

        data = res.json()
        task_id = data.get("data", {}).get("taskId") if data.get("data") else None
        if not task_id:
            raise HTTPException(status_code=500, detail=f"No task ID returned from Suno: {str(data)[:200]}")

        # Store job
        job_id = str(uuid.uuid4())
        music_jobs[job_id] = {
            "suno_task_id": task_id,
            "status": "generating",
            "prompt": request.prompt,
            "instrumental": request.instrumental,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"Suno job {job_id} started (task={task_id}): '{request.prompt[:50]}'")

        return {
            "success": True,
            "job_id": job_id,
            "status": "generating",
            "message": "Music generation started. Poll /api/music-studio/job/{job_id} for status."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Music generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/music-studio/job/{job_id}")
async def get_music_job_status(job_id: str):
    """Poll music generation job status"""
    if job_id not in music_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = music_jobs[job_id]

    # If already completed or failed, return cached result
    if job.get("status") in ("completed", "failed"):
        return job

    # Poll Suno API
    suno_task_id = job.get("suno_task_id")
    if not suno_task_id:
        return {"status": "failed", "error": "No Suno task ID"}

    try:
        headers = {"Authorization": f"Bearer {SUNO_API_KEY}"}
        res = requests.get(
            f"{SUNO_BASE_URL}/api/v1/generate/record-info?taskId={suno_task_id}",
            headers=headers, timeout=15
        )

        if res.status_code != 200:
            return {"status": "generating", "message": "Waiting for Suno..."}

        resp = res.json()
        data = resp.get("data", {})
        response_data = data.get("response", {})
        suno_songs = response_data.get("sunoData", [])

        if not suno_songs:
            return {"status": "generating", "message": "Suno is composing your music..."}

        # Check if any song has an audioUrl (means generation is complete)
        song = suno_songs[0]
        audio_url = song.get("audioUrl") or ""
        stream_url = song.get("streamAudioUrl") or ""
        title = song.get("title") or job.get("prompt", "")[:50]
        image_url = song.get("imageUrl") or ""
        duration = song.get("duration") or 0

        # If no audioUrl yet, still generating
        if not audio_url and not stream_url:
            return {"status": "generating", "message": "Suno is composing your music..."}

        # Download audio and convert to base64
        audio_b64 = ""
        file_size = 0
        dl_url = audio_url or stream_url
        if dl_url:
            try:
                audio_res = requests.get(dl_url, timeout=60)
                if audio_res.status_code == 200 and len(audio_res.content) > 100:
                    audio_b64 = base64.b64encode(audio_res.content).decode('utf-8')
                    file_size = len(audio_res.content)
            except Exception as e:
                logger.warning(f"Failed to download audio: {e}")
                # If download fails but stream URL exists, still mark as completed with URL
                if not audio_b64 and stream_url:
                    pass

        job.update({
            "status": "completed",
            "audio_url": audio_url or stream_url,
            "stream_url": stream_url,
            "audio_base64": audio_b64,
            "file_size": file_size,
            "title": title,
            "image_url": image_url,
            "duration": duration,
        })

        # Save to DB history
        doc = {
            "id": job_id,
            "type": "music",
            "prompt": job.get("prompt", ""),
            "title": title,
            "instrumental": job.get("instrumental", False),
            "audio_url": audio_url or stream_url,
            "image_url": image_url,
            "duration": duration,
            "file_size": file_size,
            "audio_base64": audio_b64,
            "created_at": job.get("created_at"),
        }
        await db.music_studio_history.insert_one(doc)

        logger.info(f"Suno job {job_id} completed: {file_size} bytes, title='{title}'")

        music_jobs[job_id] = job
        return job

    except Exception as e:
        logger.warning(f"Poll error for {job_id}: {e}")
        return {"status": "generating", "message": "Checking status..."}


async def _generate_sfx(prompt: str):
    """Generate sound effects via ElevenLabs (free tier)"""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="Sound effects not configured")

    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)

        audio_data = b""
        sfx = client.text_to_sound_effects.convert(
            text=prompt,
            duration_seconds=min(30, 10),
            prompt_influence=0.3,
        )
        for chunk in sfx:
            audio_data += chunk

        if not audio_data or len(audio_data) < 100:
            raise Exception("Empty audio returned")

        audio_b64 = base64.b64encode(audio_data).decode('utf-8')

        doc = {
            "id": str(uuid.uuid4()),
            "type": "sfx",
            "prompt": prompt,
            "file_size": len(audio_data),
            "audio_base64": audio_b64,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.music_studio_history.insert_one(doc)
        doc.pop("_id", None)

        return {
            "success": True,
            "status": "completed",
            "audio_base64": audio_b64,
            "type": "sfx",
            "file_size": len(audio_data),
            "id": doc["id"],
        }
    except Exception as e:
        logger.error(f"SFX generation failed: {e}")
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
