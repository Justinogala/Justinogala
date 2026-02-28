"""
Chat routes - messaging, files, typing indicators, presence.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import base64
import asyncio
import json
from collections import defaultdict

from config import db, fs_chat_files, logger

router = APIRouter(tags=["Chat"])


# ============== SSE Manager ==============

class SSEManager:
    """Manages Server-Sent Events connections for real-time updates"""
    
    def __init__(self):
        self.connections = {}
        self.user_queues = defaultdict(list)
    
    async def connect(self, user_id: str):
        """Create a new SSE connection for a user"""
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
        logger.info(f"SSE: User {user_id} disconnected")
    
    async def send_to_user(self, user_id: str, event_type: str, data: dict):
        """Send an event to all connections of a specific user"""
        if user_id in self.user_queues:
            event = {"type": event_type, "data": data}
            for queue in self.user_queues[user_id]:
                try:
                    await queue.put(event)
                except Exception as e:
                    logger.error(f"SSE: Error sending to {user_id}: {e}")
    
    async def broadcast_presence(self, user_id: str, status: str):
        """Broadcast user presence to all connected users"""
        event_data = {
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        for uid in self.user_queues:
            await self.send_to_user(uid, "presence", event_data)
    
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
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"event: {event['type']}\ndata: {json.dumps(event['data'])}\n\n"
            except asyncio.TimeoutError:
                yield f"event: ping\ndata: {json.dumps({'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        sse_manager.disconnect(user_id, queue)
        await sse_manager.broadcast_presence(user_id, "offline")


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
async def send_chat_message(
    sender_id: str,
    receiver_id: str,
    content: str,
    message_type: str = "text",
    attachments: List[dict] = []
):
    """Send a chat message"""
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
    
    # Send via SSE
    await sse_manager.send_to_user(receiver_id, "new_message", message_doc)
    await sse_manager.send_to_user(sender_id, "message_sent", message_doc)
    
    return {"success": True, "message": message_doc}


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
    user_id: str = Form(...),
    file_name: str = Form(...),
    file_data: str = Form(...),
    content_type: str = Form(...),
    category: str = Form("chat-files")
):
    """Upload a file for chat (base64 encoded)"""
    try:
        file_bytes = base64.b64decode(file_data)
        file_id = str(uuid.uuid4())
        
        # Store in GridFS
        grid_id = await fs_chat_files.upload_from_stream(
            file_name,
            file_bytes,
            metadata={
                "file_id": file_id,
                "user_id": user_id,
                "content_type": content_type,
                "category": category,
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        file_doc = {
            "id": file_id,
            "grid_id": str(grid_id),
            "user_id": user_id,
            "file_name": file_name,
            "content_type": content_type,
            "size": len(file_bytes),
            "category": category,
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.chat_files.insert_one(file_doc)
        
        return {"success": True, "file": {k: v for k, v in file_doc.items() if k != "grid_id"}}
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/files/user/{user_id}")
async def get_user_files(user_id: str, category: Optional[str] = None, limit: int = 50):
    """Get files uploaded by a user"""
    query = {"user_id": user_id}
    if category:
        query["category"] = category
    
    files = await db.chat_files.find(query, {"_id": 0, "grid_id": 0}).sort("uploaded_at", -1).limit(limit).to_list(limit)
    return {"files": files, "count": len(files)}


@router.get("/chat/files/{file_id}")
async def get_chat_file(file_id: str):
    """Download a chat file"""
    file_doc = await db.chat_files.find_one({"id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
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
    except Exception as e:
        logger.error(f"Error downloading file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/chat/files/{file_id}")
async def delete_chat_file(file_id: str):
    """Delete a chat file"""
    file_doc = await db.chat_files.find_one({"id": file_id})
    if not file_doc:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        from bson import ObjectId
        await fs_chat_files.delete(ObjectId(file_doc["grid_id"]))
        await db.chat_files.delete_one({"id": file_id})
        return {"success": True, "message": "File deleted"}
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
