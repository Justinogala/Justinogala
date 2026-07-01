"""
Munal Music Studio — AI Music Generation via Suno API with Munal Credits system.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
import os, base64, uuid, logging, requests

from config import db
from routes.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Music Studio"])

SUNO_API_KEY = os.environ.get("SUNO_API_KEY", "")
SUNO_BASE_URL = "https://api.sunoapi.org"
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")

# Credit cost per music generation
CREDITS_PER_SONG = 50

# Users exempt from credit checks
FREE_ACCESS_EMAILS = ["info@kollabri.com", "admin@munal.com"]

# Credit packages
CREDIT_PACKAGES = [
    {"id": "credits_1000", "credits": 1000, "price": 10.00, "label": "$10 — 1,000 Credits"},
    {"id": "credits_3000", "credits": 3000, "price": 25.00, "label": "$25 — 3,000 Credits", "save": "20%"},
    {"id": "credits_7500", "credits": 7500, "price": 50.00, "label": "$50 — 7,500 Credits", "save": "25%"},
    {"id": "credits_18000", "credits": 18000, "price": 100.00, "label": "$100 — 18,000 Credits", "save": "40%"},
]


class MusicGenerateRequest(BaseModel):
    prompt: str
    instrumental: bool = False
    custom_mode: bool = False
    title: str = ""
    style: str = ""
    type: str = "music"


class CreditPurchaseRequest(BaseModel):
    package_id: str


# ============== Credit System ==============

async def get_user_credits(user_id: str) -> int:
    profile = await db.music_credits.find_one({"user_id": user_id})
    return profile.get("credits", 0) if profile else 0


async def deduct_credits(user_id: str, amount: int) -> int:
    result = await db.music_credits.find_one_and_update(
        {"user_id": user_id, "credits": {"$gte": amount}},
        {"$inc": {"credits": -amount}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=402, detail="Insufficient Munal Credits. Please purchase more credits.")
    return result.get("credits", 0)


async def add_credits(user_id: str, amount: int) -> int:
    result = await db.music_credits.find_one_and_update(
        {"user_id": user_id},
        {
            "$inc": {"credits": amount},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()},
            "$setOnInsert": {"user_id": user_id, "created_at": datetime.now(timezone.utc).isoformat()}
        },
        upsert=True, return_document=True
    )
    return result.get("credits", 0)


def is_free_user(user: dict) -> bool:
    email = user.get("email", "")
    return email.lower() in [e.lower() for e in FREE_ACCESS_EMAILS]


# ============== Endpoints ==============

@router.get("/music-studio/status")
async def music_studio_status():
    return {
        "available": bool(SUNO_API_KEY),
        "provider": "suno",
        "credits_per_song": CREDITS_PER_SONG,
        "packages": CREDIT_PACKAGES,
    }


@router.get("/music-studio/credits")
async def get_credits(user=Depends(get_current_user)):
    credits = await get_user_credits(user["id"])
    return {
        "credits": credits,
        "is_free": is_free_user(user),
        "credits_per_song": CREDITS_PER_SONG,
        "songs_remaining": credits // CREDITS_PER_SONG if not is_free_user(user) else 999999,
    }


@router.post("/music-studio/purchase-credits")
async def purchase_credits(req: CreditPurchaseRequest, user=Depends(get_current_user)):
    package = next((p for p in CREDIT_PACKAGES if p["id"] == req.package_id), None)
    if not package:
        raise HTTPException(status_code=400, detail="Invalid package")

    import stripe
    from routes.payments import get_stripe_api_key

    api_key = await get_stripe_api_key()
    stripe.api_key = api_key

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "product_data": {
                        "name": f"Munal Credits — {package['credits']:,} Credits",
                        "description": f"{package['credits']:,} Munal Music Studio credits",
                    },
                    "unit_amount": int(package["price"] * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=os.environ.get("FRONTEND_URL", "https://munal.ai") + "/music-studio?credits=success&session_id={CHECKOUT_SESSION_ID}",
            cancel_url=os.environ.get("FRONTEND_URL", "https://munal.ai") + "/music-studio?credits=cancelled",
            metadata={
                "type": "music_credits",
                "user_id": user["id"],
                "user_email": user.get("email", ""),
                "package_id": package["id"],
                "credits": str(package["credits"]),
            }
        )

        # Store pending purchase
        await db.music_credit_purchases.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "session_id": session.id,
            "package_id": package["id"],
            "credits": package["credits"],
            "amount": package["price"],
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        return {"checkout_url": session.url}

    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/music-studio/verify-purchase")
async def verify_purchase(session_id: str, user=Depends(get_current_user)):
    """Verify Stripe payment and add credits"""
    import stripe
    from routes.payments import get_stripe_api_key

    api_key = await get_stripe_api_key()
    stripe.api_key = api_key

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        if session.payment_status != "paid":
            return {"success": False, "message": "Payment not completed"}

        # Check if already processed
        existing = await db.music_credit_purchases.find_one({"session_id": session_id, "status": "completed"})
        if existing:
            credits = await get_user_credits(user["id"])
            return {"success": True, "credits": credits, "message": "Credits already added"}

        # Get credits from metadata
        credits_to_add = int(session.metadata.get("credits", 0))
        if credits_to_add <= 0:
            return {"success": False, "message": "Invalid credit amount"}

        # Add credits
        new_balance = await add_credits(user["id"], credits_to_add)

        # Mark purchase as completed
        await db.music_credit_purchases.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )

        logger.info(f"Credits added: {credits_to_add} to user {user['id']} (balance: {new_balance})")
        return {"success": True, "credits_added": credits_to_add, "credits": new_balance}

    except Exception as e:
        logger.error(f"Purchase verification error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Music Generation ==============

# In-memory job store
music_jobs = {}


@router.post("/music-studio/generate")
async def generate_music(request: MusicGenerateRequest, user=Depends(get_current_user)):
    if request.type == "sfx":
        return await _generate_sfx(request.prompt, user)

    if not SUNO_API_KEY:
        raise HTTPException(status_code=500, detail="Music Studio not configured")

    # Credit check (skip for free users)
    if not is_free_user(user):
        credits = await get_user_credits(user["id"])
        if credits < CREDITS_PER_SONG:
            raise HTTPException(status_code=402, detail=f"Insufficient Munal Credits. You need {CREDITS_PER_SONG} credits per song. Current balance: {credits}")

    try:
        headers = {"Authorization": f"Bearer {SUNO_API_KEY}", "Content-Type": "application/json"}
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

        res = requests.post(f"{SUNO_BASE_URL}/api/v1/generate", json=payload, headers=headers, timeout=30)

        if res.status_code != 200:
            error_data = res.json() if res.headers.get('content-type','').startswith('application/json') else {}
            msg = error_data.get("msg", res.text[:200])
            raise HTTPException(status_code=res.status_code, detail=f"Suno API: {msg}")

        data = res.json()
        task_id = data.get("data", {}).get("taskId") if data.get("data") else None
        if not task_id:
            raise HTTPException(status_code=500, detail="No task ID from Suno")

        # Deduct credits (skip for free users)
        new_balance = None
        if not is_free_user(user):
            new_balance = await deduct_credits(user["id"], CREDITS_PER_SONG)

        job_id = str(uuid.uuid4())
        music_jobs[job_id] = {
            "suno_task_id": task_id,
            "status": "generating",
            "prompt": request.prompt,
            "instrumental": request.instrumental,
            "user_id": user["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        logger.info(f"Suno job {job_id} started for user {user['id']} (task={task_id})")

        return {
            "success": True,
            "job_id": job_id,
            "status": "generating",
            "credits_remaining": new_balance,
            "message": "Music generation started. Suno AI is composing your song..."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Music generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/music-studio/job/{job_id}")
async def get_music_job_status(job_id: str):
    if job_id not in music_jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = music_jobs[job_id]
    if job.get("status") in ("completed", "failed"):
        return job

    suno_task_id = job.get("suno_task_id")
    if not suno_task_id:
        return {"status": "failed", "error": "No Suno task ID"}

    try:
        headers = {"Authorization": f"Bearer {SUNO_API_KEY}"}
        res = requests.get(f"{SUNO_BASE_URL}/api/v1/generate/record-info?taskId={suno_task_id}", headers=headers, timeout=15)

        if res.status_code != 200:
            return {"status": "generating", "message": "Waiting for Suno AI..."}

        resp = res.json()
        suno_songs = resp.get("data", {}).get("response", {}).get("sunoData", [])

        if not suno_songs:
            return {"status": "generating", "message": "Suno AI is composing your music..."}

        song = suno_songs[0]
        audio_url = song.get("audioUrl") or ""
        stream_url = song.get("streamAudioUrl") or ""
        title = song.get("title") or job.get("prompt", "")[:50]
        image_url = song.get("imageUrl") or ""
        duration = song.get("duration") or 0
        tags = song.get("tags") or ""
        lyrics = song.get("prompt") or ""
        if lyrics == "[Instrumental]":
            lyrics = ""

        if not audio_url and not stream_url:
            return {"status": "generating", "message": "Suno AI is composing your music..."}

        # Download audio
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
                logger.warning(f"Audio download failed: {e}")

        job.update({
            "status": "completed",
            "audio_url": audio_url or stream_url,
            "audio_base64": audio_b64,
            "file_size": file_size,
            "title": title,
            "image_url": image_url,
            "duration": duration,
            "tags": tags,
            "lyrics": lyrics,
        })

        # Save to history
        doc = {
            "id": job_id,
            "user_id": job.get("user_id"),
            "type": "music",
            "prompt": job.get("prompt", ""),
            "title": title,
            "instrumental": job.get("instrumental", False),
            "audio_url": audio_url or stream_url,
            "image_url": image_url,
            "duration": duration,
            "file_size": file_size,
            "tags": tags,
            "lyrics": lyrics,
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


async def _generate_sfx(prompt: str, user: dict):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="Sound effects not configured")

    # SFX costs 10 credits
    if not is_free_user(user):
        credits = await get_user_credits(user["id"])
        if credits < 10:
            raise HTTPException(status_code=402, detail="Insufficient Munal Credits for sound effects (10 credits needed)")
        await deduct_credits(user["id"], 10)

    try:
        from elevenlabs.client import ElevenLabs
        client = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        audio_data = b""
        sfx = client.text_to_sound_effects.convert(text=prompt, duration_seconds=10, prompt_influence=0.3)
        for chunk in sfx:
            audio_data += chunk

        if not audio_data or len(audio_data) < 100:
            raise Exception("Empty audio")

        audio_b64 = base64.b64encode(audio_data).decode('utf-8')
        doc = {
            "id": str(uuid.uuid4()), "user_id": user["id"], "type": "sfx",
            "prompt": prompt, "file_size": len(audio_data), "audio_base64": audio_b64,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.music_studio_history.insert_one(doc)
        doc.pop("_id", None)

        return {"success": True, "status": "completed", "audio_base64": audio_b64, "type": "sfx", "file_size": len(audio_data), "id": doc["id"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/music-studio/history")
async def get_music_history(user=Depends(get_current_user), limit: int = 20):
    items = await db.music_studio_history.find(
        {"user_id": user["id"]}, {"_id": 0, "audio_base64": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return {"items": items}


@router.get("/music-studio/history/{item_id}")
async def get_music_item(item_id: str):
    item = await db.music_studio_history.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.delete("/music-studio/history/{item_id}")
async def delete_music_item(item_id: str, user=Depends(get_current_user)):
    result = await db.music_studio_history.delete_one({"id": item_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"success": True}
