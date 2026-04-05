"""
Chat routes - messaging, files, typing indicators, presence.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import base64
import asyncio
import json
import os
import requests
from collections import defaultdict

from config import db, fs_chat_files, logger

router = APIRouter(tags=["Chat"])

# ============== Object Storage ==============

STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "munal-echonote"
_storage_key = None

def init_storage():
    """Initialize object storage. Call once at startup."""
    global _storage_key
    if _storage_key:
        return _storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _storage_key = resp.json()["storage_key"]
        logger.info("Object storage initialized successfully")
        return _storage_key
    except Exception as e:
        logger.error(f"Object storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    """Upload file to object storage."""
    key = init_storage()
    if not key:
        raise Exception("Object storage not initialized")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    """Download file from object storage."""
    key = init_storage()
    if not key:
        raise Exception("Object storage not initialized")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


# ============== SSE Manager ==============

class SSEManager:
    """Manages Server-Sent Events connections for real-time updates"""
    
    def __init__(self):
        self.connections = {}
        self.user_queues = defaultdict(list)
        self._offline_timers = {}  # Grace period timers for offline broadcasts
    
    async def connect(self, user_id: str):
        """Create a new SSE connection for a user"""
        # Cancel any pending offline broadcast for this user
        if user_id in self._offline_timers:
            self._offline_timers[user_id].cancel()
            del self._offline_timers[user_id]
        
        queue = asyncio.Queue()
        self.user_queues[user_id].append(queue)
        logger.info(f"SSE: User {user_id} connected. Total connections: {len(self.user_queues[user_id])}")
        return queue
    
    def disconnect(self, user_id: str, queue):
        """Remove an SSE connection"""
        if user_id in self.user_queues:
            if queue in self.user_queues[user_id]:
                self.user_queues[user_id].remove(queue)
            if not self.user_queues[user_id]:
                del self.user_queues[user_id]
        logger.info(f"SSE: User {user_id} disconnected (remaining queues: {len(self.user_queues.get(user_id, []))})")
    
    async def send_to_user(self, user_id: str, event_type: str, data: dict):
        """Send an event to all connections of a specific user"""
        if user_id in self.user_queues:
            event = {"type": event_type, "data": data}
            dead_queues = []
            for queue in self.user_queues[user_id]:
                try:
                    await queue.put(event)
                except Exception as e:
                    logger.error(f"SSE: Error sending to {user_id}: {e}")
                    dead_queues.append(queue)
            # Clean up dead queues
            for dq in dead_queues:
                if dq in self.user_queues[user_id]:
                    self.user_queues[user_id].remove(dq)
    
    async def broadcast_presence(self, user_id: str, status: str):
        """Broadcast user presence to all connected users"""
        event_data = {
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        for uid in list(self.user_queues.keys()):
            await self.send_to_user(uid, "presence", event_data)

    async def broadcast_all(self, event_type: str, data: dict):
        """Broadcast an event to ALL connected users"""
        for uid in list(self.user_queues.keys()):
            await self.send_to_user(uid, event_type, data)
    
    async def delayed_offline_broadcast(self, user_id: str, delay: float = 5.0):
        """Broadcast offline with a grace period to allow reconnection"""
        await asyncio.sleep(delay)
        # Only broadcast offline if user is truly disconnected
        if not self.is_user_online(user_id):
            await self.broadcast_presence(user_id, "offline")
            logger.info(f"SSE: User {user_id} confirmed offline after grace period")
    
    def schedule_offline(self, user_id: str, loop):
        """Schedule an offline broadcast with grace period"""
        if user_id in self._offline_timers:
            self._offline_timers[user_id].cancel()
        task = loop.create_task(self.delayed_offline_broadcast(user_id))
        self._offline_timers[user_id] = task
    
    def get_online_users(self) -> List[str]:
        """Get list of users with active SSE connections"""
        return list(self.user_queues.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if user has active SSE connection"""
        return user_id in self.user_queues and len(self.user_queues[user_id]) > 0


# Global SSE manager instance
sse_manager = SSEManager()


async def event_generator(user_id: str):
    """Generate SSE events for a user"""
    queue = await sse_manager.connect(user_id)
    await sse_manager.broadcast_presence(user_id, "online")
    
    try:
        yield f"event: connected\ndata: {json.dumps({'user_id': user_id, 'status': 'connected'})}\n\n"
        
        while True:
            try:
                event = await asyncio.wait_for(queue.get(), timeout=25.0)
                yield f"event: {event['type']}\ndata: {json.dumps(event['data'])}\n\n"
            except asyncio.TimeoutError:
                yield f"event: ping\ndata: {json.dumps({'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        sse_manager.disconnect(user_id, queue)
        # Use grace period instead of immediate offline broadcast
        try:
            loop = asyncio.get_event_loop()
            sse_manager.schedule_offline(user_id, loop)
        except Exception:
            pass


# ============== Routes ==============

@router.get("/chat/stream/{user_id}")
async def chat_stream(user_id: str):
    """SSE endpoint for real-time chat updates"""
    return StreamingResponse(
        event_generator(user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )


@router.get("/chat/messages/{user_id}/{partner_id}")
async def get_conversation_messages(user_id: str, partner_id: str, limit: int = 50, offset: int = 0):
    """Get messages between two users"""
    messages = await db.chat_messages.find(
        {
            "$or": [
                {"sender_id": user_id, "receiver_id": partner_id},
                {"sender_id": partner_id, "receiver_id": user_id}
            ]
        },
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    messages.reverse()
    return {"messages": messages, "total": len(messages)}


@router.post("/chat/messages")
async def send_chat_message(body: dict):
    """Send a chat message"""
    sender_id = body.get("sender_id")
    receiver_id = body.get("receiver_id")
    content = body.get("content", "")
    message_type = body.get("message_type", "text")
    attachments = body.get("attachments", [])
    
    if not sender_id or not receiver_id:
        raise HTTPException(status_code=400, detail="sender_id and receiver_id are required")
    
    message_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    message_doc = {
        "id": message_id,
        "sender_id": sender_id,
        "receiver_id": receiver_id,
        "content": content,
        "message_type": message_type,
        "attachments": attachments,
        "is_read": False,
        "created_at": now.isoformat(),
        "updated_at": None
    }
    
    await db.chat_messages.insert_one(message_doc)
    
    # Return without _id
    response_doc = {k: v for k, v in message_doc.items() if k != "_id"}
    
    # Send via SSE to both parties
    await sse_manager.send_to_user(receiver_id, "new_message", response_doc)
    await sse_manager.send_to_user(sender_id, "message_sent", response_doc)
    
    return {"success": True, "message": response_doc, "id": message_id, "created_at": now.isoformat()}


@router.put("/chat/messages/read")
async def mark_messages_read(message_ids: List[str], reader_id: str):
    """Mark messages as read"""
    await db.chat_messages.update_many(
        {"id": {"$in": message_ids}},
        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "updated": len(message_ids)}


@router.get("/chat/online-users")
async def get_online_users():
    """Get list of online users"""
    return {"online_users": sse_manager.get_online_users()}


@router.get("/chat/user-status/{user_id}")
async def get_user_status(user_id: str):
    """Check if a specific user is online"""
    is_online = sse_manager.is_user_online(user_id)
    return {
        "user_id": user_id,
        "status": "online" if is_online else "offline",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@router.post("/chat/typing")
async def send_typing_indicator(user_id: str, receiver_id: str, is_typing: bool = True):
    """Send typing indicator"""
    typing_data = {
        "user_id": user_id,
        "is_typing": is_typing,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    if sse_manager.is_user_online(receiver_id):
        await sse_manager.send_to_user(receiver_id, "typing", typing_data)
    
    return {"status": "sent"}


@router.post("/chat/files/upload")
async def upload_chat_file(
    file: UploadFile = File(None),
    user_id: str = Form(...),
    file_name: str = Form(None),
    file_data: str = Form(None),
    content_type: str = Form(None),
    category: str = Form("chat-files")
):
    """Upload a file for chat - supports both multipart file and base64 encoded data"""
    try:
        file_id = str(uuid.uuid4())
        
        # Determine source: multipart file upload or base64 encoded
        if file and file.filename:
            actual_file_name = file.filename
            actual_content_type = file.content_type or "application/octet-stream"
            file_bytes = await file.read()
        elif file_data:
            actual_file_name = file_name or f"file_{file_id}"
            actual_content_type = content_type or "application/octet-stream"
            file_bytes = base64.b64decode(file_data)
        else:
            raise HTTPException(status_code=400, detail="No file provided")
        
        ext = actual_file_name.rsplit(".", 1)[-1] if "." in actual_file_name else "bin"
        storage_path = f"{APP_NAME}/chat-files/{user_id}/{file_id}.{ext}"
        
        # Try object storage first, fallback to GridFS
        download_url = None
        storage_provider = "gridfs"
        
        try:
            put_object(storage_path, file_bytes, actual_content_type)
            storage_provider = "object_storage"
            download_url = f"/api/chat/files/{file_id}/download"
            logger.info(f"File uploaded to object storage: {storage_path}")
        except Exception as e:
            logger.warning(f"Object storage upload failed, falling back to GridFS: {e}")
            grid_id = await fs_chat_files.upload_from_stream(
                actual_file_name,
                file_bytes,
                metadata={
                    "file_id": file_id,
                    "user_id": user_id,
                    "content_type": actual_content_type,
                    "category": category,
                    "uploaded_at": datetime.now(timezone.utc).isoformat()
                }
            )
            download_url = f"/api/chat/files/{file_id}/download"
            storage_path = None
        
        file_doc = {
            "id": file_id,
            "user_id": user_id,
            "file_name": actual_file_name,
            "content_type": actual_content_type,
            "size": len(file_bytes),
            "category": category,
            "storage_provider": storage_provider,
            "storage_path": storage_path if storage_provider == "object_storage" else None,
            "grid_id": str(grid_id) if storage_provider == "gridfs" else None,
            "is_deleted": False,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.chat_files.insert_one(file_doc)
        
        return {
            "success": True, 
            "file": {
                "id": file_id,
                "file_name": actual_file_name,
                "content_type": actual_content_type,
                "size": len(file_bytes),
                "category": category,
                "url": download_url,
                "uploaded_at": file_doc["uploaded_at"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/files/{file_id}/download")
async def download_chat_file(file_id: str):
    """Download a chat file from object storage or GridFS"""
    file_doc = await db.chat_files.find_one({"id": file_id, "is_deleted": {"$ne": True}})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        if file_doc.get("storage_provider") == "object_storage" and file_doc.get("storage_path"):
            data, ct = get_object(file_doc["storage_path"])
            return Response(
                content=data,
                media_type=file_doc.get("content_type", ct),
                headers={"Content-Disposition": f'inline; filename="{file_doc["file_name"]}"'}
            )
        elif file_doc.get("grid_id"):
            from bson import ObjectId
            grid_out = await fs_chat_files.open_download_stream(ObjectId(file_doc["grid_id"]))
            
            async def file_iterator():
                while True:
                    chunk = await grid_out.read(8192)
                    if not chunk:
                        break
                    yield chunk
            
            return StreamingResponse(
                file_iterator(),
                media_type=file_doc.get("content_type", "application/octet-stream"),
                headers={"Content-Disposition": f'inline; filename="{file_doc["file_name"]}"'}
            )
        else:
            raise HTTPException(status_code=404, detail="File data not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/files/user/{user_id}")
async def get_user_files(user_id: str, category: Optional[str] = None, limit: int = 50):
    """Get files uploaded by a user"""
    query = {"user_id": user_id, "is_deleted": {"$ne": True}}
    if category:
        query["category"] = category
    
    files = await db.chat_files.find(query, {"_id": 0, "grid_id": 0, "storage_path": 0}).sort("uploaded_at", -1).limit(limit).to_list(limit)
    # Add download URLs
    for f in files:
        f["url"] = f"/api/chat/files/{f['id']}/download"
    return {"files": files, "count": len(files)}


@router.get("/chat/files/{file_id}")
async def get_chat_file(file_id: str):
    """Download a chat file (legacy endpoint - redirects to download)"""
    file_doc = await db.chat_files.find_one({"id": file_id, "is_deleted": {"$ne": True}})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        if file_doc.get("storage_provider") == "object_storage" and file_doc.get("storage_path"):
            data, ct = get_object(file_doc["storage_path"])
            return Response(
                content=data,
                media_type=file_doc.get("content_type", ct),
                headers={"Content-Disposition": f'attachment; filename="{file_doc["file_name"]}"'}
            )
        elif file_doc.get("grid_id"):
            from bson import ObjectId
            grid_out = await fs_chat_files.open_download_stream(ObjectId(file_doc["grid_id"]))
            
            async def file_iterator():
                while True:
                    chunk = await grid_out.read(8192)
                    if not chunk:
                        break
                    yield chunk
            
            return StreamingResponse(
                file_iterator(),
                media_type=file_doc.get("content_type", "application/octet-stream"),
                headers={"Content-Disposition": f'attachment; filename="{file_doc["file_name"]}"'}
            )
        else:
            raise HTTPException(status_code=404, detail="File data not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/files/{file_id}")
async def delete_chat_file(file_id: str):
    """Soft-delete a chat file"""
    file_doc = await db.chat_files.find_one({"id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Soft delete (object storage has no delete API)
    await db.chat_files.update_one(
        {"id": file_id},
        {"$set": {"is_deleted": True, "deleted_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "File deleted"}


# ============== Rich Presence Status ==============

VALID_STATUS_TYPES = ["available", "busy", "do_not_disturb", "be_right_back", "appear_offline", "away"]
VALID_DURATIONS = ["30_minutes", "1_hour", "2_hours", "today", "this_week", "custom"]

@router.put("/chat/presence/status")
async def set_user_presence(body: dict):
    """Set user's rich presence status"""
    user_id = body.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    status_type = body.get("status_type", "available")
    if status_type not in VALID_STATUS_TYPES:
        raise HTTPException(status_code=400, detail=f"Invalid status_type. Must be one of: {VALID_STATUS_TYPES}")
    
    status_message = body.get("status_message", "")
    clear_after = body.get("clear_after")  # duration key or ISO datetime
    
    now = datetime.now(timezone.utc)
    
    presence_doc = {
        "status_type": status_type,
        "status_message": status_message[:200] if status_message else "",
        "clear_after": clear_after,
        "updated_at": now.isoformat()
    }
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"presence": presence_doc}}
    )
    
    # Broadcast presence change to all connected users
    await sse_manager.broadcast_presence(user_id, status_type)
    
    return {"success": True, "presence": presence_doc}


@router.get("/chat/presence/status/{user_id}")
async def get_user_presence(user_id: str):
    """Get user's rich presence status"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "presence": 1, "name": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    presence = user.get("presence", {
        "status_type": "available",
        "status_message": "",
        "clear_after": None,
        "updated_at": None
    })
    
    # Merge with SSE online state
    is_online = sse_manager.is_user_online(user_id)
    presence["is_online"] = is_online
    
    return {"user_id": user_id, "presence": presence}


@router.get("/chat/presence/bulk")
async def get_bulk_presence(user_ids: str):
    """Get presence for multiple users (comma-separated IDs)"""
    ids = [uid.strip() for uid in user_ids.split(",") if uid.strip()]
    if not ids:
        return {"presences": {}}
    
    users = await db.users.find(
        {"id": {"$in": ids}},
        {"_id": 0, "id": 1, "presence": 1}
    ).to_list(100)
    
    result = {}
    for u in users:
        presence = u.get("presence", {"status_type": "available", "status_message": ""})
        presence["is_online"] = sse_manager.is_user_online(u["id"])
        result[u["id"]] = presence
    
    # Add missing users with default
    for uid in ids:
        if uid not in result:
            result[uid] = {
                "status_type": "available",
                "status_message": "",
                "is_online": sse_manager.is_user_online(uid)
            }
    
    return {"presences": result}
