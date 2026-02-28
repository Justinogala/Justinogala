"""
Video call routes - 1-on-1 calls.
"""
from fastapi import APIRouter
from datetime import datetime, timezone
from typing import Dict, Optional
from pydantic import BaseModel
import uuid

from config import logger

router = APIRouter(prefix="/call", tags=["Calls"])


# ============== Models ==============

class CallInitiateRequest(BaseModel):
    target_user_id: str
    call_type: str = "audio"
    call_id: Optional[str] = None

class CallSignalRequest(BaseModel):
    caller_id: Optional[str] = None
    target_user_id: Optional[str] = None
    call_id: str
    call_type: Optional[str] = None
    signal_type: Optional[str] = None
    signal_data: Optional[Dict] = None


# In-memory storage (use Redis in production)
pending_calls: Dict[str, Dict] = {}
call_signals: Dict[str, list] = {}


# Import SSE manager from chat module
def get_sse_manager():
    from routes.chat import sse_manager
    return sse_manager


# ============== Routes ==============

@router.post("/initiate")
async def initiate_call(request: CallInitiateRequest, caller_id: str = None):
    """Initiate a call to another user"""
    sse_manager = get_sse_manager()
    call_id = request.call_id or str(uuid.uuid4())
    
    call_data = {
        "call_id": call_id,
        "caller_id": caller_id,
        "target_user_id": request.target_user_id,
        "call_type": request.call_type,
        "status": "ringing",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    pending_calls[call_id] = call_data
    call_signals[call_id] = []
    
    await sse_manager.send_to_user(request.target_user_id, "incoming_call", {
        "call_id": call_id,
        "caller_id": caller_id,
        "call_type": request.call_type,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })
    
    logger.info(f"Call {call_id} initiated from {caller_id} to {request.target_user_id}")
    return {"success": True, "call": call_data}


@router.post("/accept")
async def accept_call(request: CallSignalRequest):
    """Accept an incoming call"""
    sse_manager = get_sse_manager()
    call_id = request.call_id
    
    if call_id in pending_calls:
        pending_calls[call_id]["status"] = "connecting"
        
        await sse_manager.send_to_user(request.caller_id, "call_accepted", {
            "call_id": call_id,
            "accepted_by": request.target_user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        logger.info(f"Call {call_id} accepted")
        return {"success": True, "status": "connecting"}
    
    return {"success": False, "error": "Call not found"}


@router.post("/reject")
async def reject_call(request: CallSignalRequest):
    """Reject an incoming call"""
    sse_manager = get_sse_manager()
    call_id = request.call_id
    
    if call_id in pending_calls:
        pending_calls[call_id]["status"] = "rejected"
        
        await sse_manager.send_to_user(request.caller_id, "call_rejected", {
            "call_id": call_id,
            "rejected_by": request.target_user_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        del pending_calls[call_id]
        if call_id in call_signals:
            del call_signals[call_id]
        
        logger.info(f"Call {call_id} rejected")
        return {"success": True, "status": "rejected"}
    
    return {"success": False, "error": "Call not found"}


@router.post("/end")
async def end_call(request: CallSignalRequest):
    """End an active call"""
    sse_manager = get_sse_manager()
    call_id = request.call_id
    target_user_id = request.target_user_id
    
    if call_id in pending_calls:
        pending_calls[call_id]["status"] = "ended"
        
        await sse_manager.send_to_user(target_user_id, "call_ended", {
            "call_id": call_id,
            "ended_by": request.caller_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        del pending_calls[call_id]
        if call_id in call_signals:
            del call_signals[call_id]
        
        logger.info(f"Call {call_id} ended")
        return {"success": True, "status": "ended"}
    
    return {"success": False, "error": "Call not found"}


@router.post("/signal")
async def send_call_signal(request: CallSignalRequest):
    """Send WebRTC signaling data"""
    sse_manager = get_sse_manager()
    call_id = request.call_id
    
    if call_id not in call_signals:
        call_signals[call_id] = []
    
    signal = {
        "from_user_id": request.caller_id,
        "signal_type": request.signal_type,
        "signal_data": request.signal_data,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    call_signals[call_id].append(signal)
    
    await sse_manager.send_to_user(request.target_user_id, f"webrtc_{request.signal_type}", {
        "call_id": call_id,
        "from_user_id": request.caller_id,
        request.signal_type: request.signal_data
    })
    
    return {"success": True}


@router.get("/signals/{call_id}")
async def get_call_signals(call_id: str, after: int = 0):
    """Poll for new signaling data"""
    if call_id in call_signals:
        signals = call_signals[call_id][after:]
        return {"signals": signals, "count": len(signals)}
    return {"signals": [], "count": 0}


@router.get("/status/{call_id}")
async def get_call_status(call_id: str):
    """Get the current status of a call"""
    if call_id in pending_calls:
        return {"call": pending_calls[call_id]}
    return {"call": None, "error": "Call not found"}
