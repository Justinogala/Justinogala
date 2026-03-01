"""
Meeting room routes - meeting signaling, participants.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Dict, Optional
from pydantic import BaseModel
import uuid

from config import db, logger

router = APIRouter(prefix="/meeting-room", tags=["Meeting Room"])


# ============== Models ==============

class MeetingJoin(BaseModel):
    meeting_id: str
    user_id: str
    user_name: str
    video_enabled: bool = True
    audio_enabled: bool = True

class MeetingLeave(BaseModel):
    meeting_id: str
    user_id: str

class MeetingSignal(BaseModel):
    meeting_id: str
    from_user_id: str
    to_user_id: str
    signal_type: str
    signal_data: dict

class MeetingStatusUpdate(BaseModel):
    user_id: str
    video_enabled: Optional[bool] = None
    audio_enabled: Optional[bool] = None
    screen_sharing: Optional[bool] = None


# In-memory storage
active_meetings: Dict[str, Dict] = {}


def get_sse_manager():
    from routes.chat import sse_manager
    return sse_manager


# ============== Routes ==============

@router.post("/join")
async def join_meeting(request: MeetingJoin):
    """Join a meeting room"""
    sse_manager = get_sse_manager()
    meeting_id = request.meeting_id
    
    # Get meeting info from calendar
    meeting = await db.calendar_events.find_one({"id": meeting_id}, {"_id": 0})
    
    # Create meeting room if not exists
    if meeting_id not in active_meetings:
        active_meetings[meeting_id] = {
            "id": meeting_id,
            "title": meeting.get("title", "Meeting") if meeting else "Instant Meeting",
            "participants": [],
            "started_at": datetime.now(timezone.utc).isoformat(),
            "host_id": meeting.get("organizer_id") if meeting else request.user_id
        }
    
    room = active_meetings[meeting_id]
    
    # Check if already in room
    existing = next((p for p in room["participants"] if p["user_id"] == request.user_id), None)
    
    if existing:
        existing["video_enabled"] = request.video_enabled
        existing["audio_enabled"] = request.audio_enabled
        existing["rejoined_at"] = datetime.now(timezone.utc).isoformat()
    else:
        participant = {
            "user_id": request.user_id,
            "user_name": request.user_name,
            "video_enabled": request.video_enabled,
            "audio_enabled": request.audio_enabled,
            "screen_sharing": False,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        room["participants"].append(participant)
    
    # Notify others
    for p in room["participants"]:
        if p["user_id"] != request.user_id:
            await sse_manager.send_to_user(p["user_id"], "meeting_participant_joined", {
                "meeting_id": meeting_id,
                "participant": {
                    "user_id": request.user_id,
                    "user_name": request.user_name,
                    "video_enabled": request.video_enabled,
                    "audio_enabled": request.audio_enabled
                }
            })
    
    logger.info(f"User {request.user_id} joined meeting {meeting_id}")
    
    return {
        "success": True,
        "meeting": {
            "id": room["id"],
            "title": room["title"],
            "participants": room["participants"],
            "host_id": room["host_id"]
        }
    }


@router.post("/leave")
async def leave_meeting(request: MeetingLeave):
    """Leave a meeting room"""
    sse_manager = get_sse_manager()
    meeting_id = request.meeting_id
    
    if meeting_id not in active_meetings:
        return {"success": False, "error": "Meeting not found"}
    
    room = active_meetings[meeting_id]
    room["participants"] = [p for p in room["participants"] if p["user_id"] != request.user_id]
    
    # Notify others
    for p in room["participants"]:
        await sse_manager.send_to_user(p["user_id"], "meeting_participant_left", {
            "meeting_id": meeting_id,
            "user_id": request.user_id
        })
    
    logger.info(f"User {request.user_id} left meeting {meeting_id}")
    
    # Clean up empty meetings
    if len(room["participants"]) == 0:
        del active_meetings[meeting_id]
        logger.info(f"Meeting {meeting_id} ended (empty)")
    
    return {"success": True}


@router.get("/{meeting_id}/participants")
async def get_meeting_participants(meeting_id: str):
    """Get participants in a meeting"""
    if meeting_id not in active_meetings:
        return {"participants": [], "count": 0}
    
    room = active_meetings[meeting_id]
    return {
        "participants": room["participants"],
        "count": len(room["participants"]),
        "host_id": room.get("host_id")
    }


@router.post("/signal")
async def send_meeting_signal(request: MeetingSignal):
    """Send WebRTC signaling to another participant"""
    sse_manager = get_sse_manager()
    
    await sse_manager.send_to_user(request.to_user_id, "meeting_signal", {
        "meeting_id": request.meeting_id,
        "from_user_id": request.from_user_id,
        "signal_type": request.signal_type,
        "signal_data": request.signal_data
    })
    
    return {"success": True}


@router.post("/{meeting_id}/update-status")
async def update_meeting_status(meeting_id: str, update: MeetingStatusUpdate):
    """Update participant status in meeting"""
    sse_manager = get_sse_manager()
    
    if meeting_id not in active_meetings:
        return {"success": False, "error": "Meeting not found"}
    
    room = active_meetings[meeting_id]
    participant = next((p for p in room["participants"] if p["user_id"] == update.user_id), None)
    
    if not participant:
        return {"success": False, "error": "Participant not found"}
    
    update_data = {}
    if update.video_enabled is not None:
        participant["video_enabled"] = update.video_enabled
        update_data["video_enabled"] = update.video_enabled
    if update.audio_enabled is not None:
        participant["audio_enabled"] = update.audio_enabled
        update_data["audio_enabled"] = update.audio_enabled
    if update.screen_sharing is not None:
        participant["screen_sharing"] = update.screen_sharing
        update_data["screen_sharing"] = update.screen_sharing
    
    # Notify others
    for p in room["participants"]:
        if p["user_id"] != update.user_id:
            await sse_manager.send_to_user(p["user_id"], "meeting_participant_updated", {
                "meeting_id": meeting_id,
                "user_id": update.user_id,
                "updates": update_data
            })
    
    return {"success": True, "participant": participant}
