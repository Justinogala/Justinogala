"""
Group video call routes - multi-participant calls.
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Dict, Optional
from pydantic import BaseModel

from config import logger

router = APIRouter(prefix="/group-call", tags=["Group Calls"])


# ============== Models ==============

class GroupCallJoinRequest(BaseModel):
    room_id: str
    user_id: str
    user_name: str
    video_enabled: bool = True
    audio_enabled: bool = True

class GroupCallLeaveRequest(BaseModel):
    room_id: str
    user_id: str

class GroupCallSignalRequest(BaseModel):
    room_id: str
    sender_id: str
    sender_name: str = ""
    target_id: str
    signal_type: str
    signal_data: Dict

class GroupCallParticipantUpdate(BaseModel):
    room_id: str
    user_id: str
    video_enabled: Optional[bool] = None
    audio_enabled: Optional[bool] = None
    hand_raised: Optional[bool] = None
    is_speaking: Optional[bool] = None


# In-memory storage (use Redis in production)
meeting_rooms: Dict[str, Dict] = {}
room_signals: Dict[str, list] = {}


def get_sse_manager():
    from routes.chat import sse_manager
    return sse_manager


# ============== Routes ==============

@router.post("/join")
async def group_call_join(request: GroupCallJoinRequest):
    """Join a group video call room"""
    sse_manager = get_sse_manager()
    room_id = request.room_id
    
    if room_id not in meeting_rooms:
        meeting_rooms[room_id] = {
            "id": room_id,
            "participants": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "active_speaker": None
        }
    
    room = meeting_rooms[room_id]
    
    existing = next((p for p in room["participants"] if p["user_id"] == request.user_id), None)
    if existing:
        existing["video_enabled"] = request.video_enabled
        existing["audio_enabled"] = request.audio_enabled
        existing["joined_at"] = datetime.now(timezone.utc).isoformat()
    else:
        participant = {
            "user_id": request.user_id,
            "user_name": request.user_name,
            "video_enabled": request.video_enabled,
            "audio_enabled": request.audio_enabled,
            "hand_raised": False,
            "is_speaking": False,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        room["participants"].append(participant)
    
    for p in room["participants"]:
        if p["user_id"] != request.user_id:
            await sse_manager.send_to_user(p["user_id"], "group_call_participant_joined", {
                "room_id": room_id,
                "participant": {
                    "user_id": request.user_id,
                    "user_name": request.user_name,
                    "video_enabled": request.video_enabled,
                    "audio_enabled": request.audio_enabled
                }
            })
    
    logger.info(f"User {request.user_id} joined room {room_id}. Total: {len(room['participants'])}")
    
    return {
        "success": True,
        "room": {
            "id": room_id,
            "participants": room["participants"],
            "created_at": room["created_at"]
        }
    }


@router.post("/leave")
async def group_call_leave(request: GroupCallLeaveRequest):
    """Leave a group video call room"""
    sse_manager = get_sse_manager()
    room_id = request.room_id
    
    if room_id not in meeting_rooms:
        return {"success": False, "error": "Room not found"}
    
    room = meeting_rooms[room_id]
    room["participants"] = [p for p in room["participants"] if p["user_id"] != request.user_id]
    
    for p in room["participants"]:
        await sse_manager.send_to_user(p["user_id"], "group_call_participant_left", {
            "room_id": room_id,
            "user_id": request.user_id
        })
    
    logger.info(f"User {request.user_id} left room {room_id}. Remaining: {len(room['participants'])}")
    
    if len(room["participants"]) == 0:
        del meeting_rooms[room_id]
        logger.info(f"Room {room_id} deleted (empty)")
    
    return {"success": True, "remaining_participants": len(room.get("participants", []))}


@router.post("/signal")
async def group_call_signal(request: GroupCallSignalRequest):
    """Send WebRTC signaling data to a specific participant"""
    sse_manager = get_sse_manager()
    room_id = request.room_id
    
    if room_id not in meeting_rooms:
        return {"success": False, "error": "Room not found"}
    
    await sse_manager.send_to_user(request.target_id, "group_call_signal", {
        "room_id": room_id,
        "sender_id": request.sender_id,
        "sender_name": request.sender_name,
        "signal_type": request.signal_type,
        "signal_data": request.signal_data
    })
    
    logger.debug(f"Signal {request.signal_type} sent from {request.sender_id} to {request.target_id}")
    
    return {"success": True}


@router.get("/room/{room_id}")
async def get_group_call_room(room_id: str):
    """Get current state of a group call room"""
    if room_id not in meeting_rooms:
        return {
            "exists": False,
            "room": {"id": room_id, "participants": [], "created_at": None}
        }
    
    room = meeting_rooms[room_id]
    return {
        "exists": True,
        "room": {
            "id": room_id,
            "participants": room["participants"],
            "created_at": room["created_at"],
            "active_speaker": room.get("active_speaker")
        }
    }


@router.post("/update-participant")
async def update_group_call_participant(request: GroupCallParticipantUpdate):
    """Update a participant's status"""
    sse_manager = get_sse_manager()
    room_id = request.room_id
    
    if room_id not in meeting_rooms:
        return {"success": False, "error": "Room not found"}
    
    room = meeting_rooms[room_id]
    participant = next((p for p in room["participants"] if p["user_id"] == request.user_id), None)
    
    if not participant:
        return {"success": False, "error": "Participant not found"}
    
    update_data = {}
    if request.video_enabled is not None:
        participant["video_enabled"] = request.video_enabled
        update_data["video_enabled"] = request.video_enabled
    if request.audio_enabled is not None:
        participant["audio_enabled"] = request.audio_enabled
        update_data["audio_enabled"] = request.audio_enabled
    if request.hand_raised is not None:
        participant["hand_raised"] = request.hand_raised
        update_data["hand_raised"] = request.hand_raised
    if request.is_speaking is not None:
        participant["is_speaking"] = request.is_speaking
        update_data["is_speaking"] = request.is_speaking
        if request.is_speaking:
            room["active_speaker"] = request.user_id
    
    for p in room["participants"]:
        if p["user_id"] != request.user_id:
            await sse_manager.send_to_user(p["user_id"], "group_call_participant_updated", {
                "room_id": room_id,
                "user_id": request.user_id,
                "updates": update_data
            })
    
    return {"success": True, "participant": participant}


@router.get("/participants/{room_id}")
async def get_group_call_participants(room_id: str):
    """Get list of participants in a group call room"""
    if room_id not in meeting_rooms:
        return {"participants": [], "count": 0}
    
    room = meeting_rooms[room_id]
    return {
        "participants": room["participants"],
        "count": len(room["participants"]),
        "active_speaker": room.get("active_speaker")
    }
