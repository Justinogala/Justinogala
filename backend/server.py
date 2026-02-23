from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Set
import uuid
import json
from datetime import datetime, timezone, timedelta
import asyncio
import base64
from collections import defaultdict


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# ============== Models ==============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"  # text, image, file, gif, location, poll, contact, voice
    attachments: List[dict] = []
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class ChatMessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"
    attachments: List[dict] = []

class UserPresence(BaseModel):
    user_id: str
    status: str = "online"  # online, offline, away, busy
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TypingIndicator(BaseModel):
    user_id: str
    conversation_id: str
    is_typing: bool


class Recording(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    recording_type: str  # 'screen' or 'camera'
    duration: int  # in seconds
    file_size: int  # in bytes
    file_data: str  # base64 encoded video data
    mime_type: str = "video/webm"
    category: str = "Uncategorized"  # Recording category/folder
    is_shared: bool = False  # Whether recording is shared
    share_token: Optional[str] = None  # Token for shared access
    shared_with: List[str] = []  # List of user IDs with access
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))

class RecordingCreate(BaseModel):
    user_id: str
    title: str
    recording_type: str
    duration: int
    file_data: str  # base64 encoded
    mime_type: str = "video/webm"
    category: str = "Uncategorized"

class RecordingUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None

class RecordingShare(BaseModel):
    share_with_users: List[str] = []  # User IDs to share with
    is_public: bool = False  # Generate public share link


# ============== WebSocket Connection Manager ==============

class ConnectionManager:
    """Manages WebSocket connections for real-time messaging"""
    
    def __init__(self):
        # Map user_id to their WebSocket connections (user can have multiple tabs)
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Track user presence
        self.user_presence: Dict[str, UserPresence] = {}
        # Track typing indicators
        self.typing_users: Dict[str, Dict[str, bool]] = {}  # {conversation_id: {user_id: is_typing}}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        
        # Update presence
        self.user_presence[user_id] = UserPresence(
            user_id=user_id,
            status="online",
            last_seen=datetime.now(timezone.utc)
        )
        
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections)}")
        
        # Broadcast presence update to all users
        await self.broadcast_presence(user_id, "online")
    
    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # If no more connections, user is offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                self.user_presence[user_id] = UserPresence(
                    user_id=user_id,
                    status="offline",
                    last_seen=datetime.now(timezone.utc)
                )
                logger.info(f"User {user_id} disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected = []
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending to {user_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected sockets
            for ws in disconnected:
                self.active_connections[user_id].discard(ws)
    
    async def broadcast_to_conversation(self, message: dict, sender_id: str, receiver_id: str):
        """Send message to both participants in a conversation"""
        await self.send_personal_message(message, sender_id)
        await self.send_personal_message(message, receiver_id)
    
    async def broadcast_presence(self, user_id: str, status: str):
        """Broadcast user presence to all connected users"""
        presence_msg = {
            "type": "presence",
            "user_id": user_id,
            "status": status,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        
        for uid in self.active_connections:
            await self.send_personal_message(presence_msg, uid)
    
    async def broadcast_typing(self, user_id: str, conversation_id: str, is_typing: bool, receiver_id: str):
        """Broadcast typing indicator to conversation partner"""
        typing_msg = {
            "type": "typing",
            "user_id": user_id,
            "conversation_id": conversation_id,
            "is_typing": is_typing,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.send_personal_message(typing_msg, receiver_id)
    
    def get_online_users(self) -> List[str]:
        """Get list of online user IDs"""
        return list(self.active_connections.keys())
    
    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is online"""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


# Global connection manager
manager = ConnectionManager()


# ============== SSE (Server-Sent Events) for Real-time Chat ==============

class SSEManager:
    """Manages Server-Sent Events connections for real-time updates"""
    
    def __init__(self):
        self.connections: Dict[str, asyncio.Queue] = {}
        self.user_queues: Dict[str, List[asyncio.Queue]] = defaultdict(list)
    
    async def connect(self, user_id: str) -> asyncio.Queue:
        """Create a new SSE connection for a user"""
        queue = asyncio.Queue()
        self.user_queues[user_id].append(queue)
        logger.info(f"SSE: User {user_id} connected. Total connections: {len(self.user_queues[user_id])}")
        return queue
    
    def disconnect(self, user_id: str, queue: asyncio.Queue):
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


# Global SSE manager
sse_manager = SSEManager()


async def event_generator(user_id: str):
    """Generate SSE events for a user"""
    queue = await sse_manager.connect(user_id)
    
    # Broadcast that user is online
    await sse_manager.broadcast_presence(user_id, "online")
    
    try:
        # Send initial connection success
        yield f"event: connected\ndata: {json.dumps({'user_id': user_id, 'status': 'connected'})}\n\n"
        
        while True:
            try:
                # Wait for events with timeout (for keep-alive)
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                yield f"event: {event['type']}\ndata: {json.dumps(event['data'])}\n\n"
            except asyncio.TimeoutError:
                # Send keep-alive ping
                yield f"event: ping\ndata: {json.dumps({'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
    except asyncio.CancelledError:
        pass
    finally:
        sse_manager.disconnect(user_id, queue)
        # Broadcast that user is offline
        await sse_manager.broadcast_presence(user_id, "offline")


@api_router.get("/chat/stream/{user_id}")
async def chat_stream(user_id: str):
    """SSE endpoint for real-time chat updates"""
    return StreamingResponse(
        event_generator(user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


# ============== WebSocket Endpoint ==============

@app.websocket("/ws/chat/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time chat"""
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()
            message_type = data.get("type", "message")
            
            if message_type == "message":
                # Handle new chat message
                msg_data = data.get("data", {})
                
                # Create message in database
                message = ChatMessage(
                    sender_id=user_id,
                    receiver_id=msg_data.get("receiver_id"),
                    content=msg_data.get("content", ""),
                    message_type=msg_data.get("message_type", "text"),
                    attachments=msg_data.get("attachments", [])
                )
                
                # Save to MongoDB
                doc = message.model_dump()
                doc['created_at'] = doc['created_at'].isoformat()
                if doc['updated_at']:
                    doc['updated_at'] = doc['updated_at'].isoformat()
                await db.chat_messages.insert_one(doc)
                
                # Prepare message for broadcast
                broadcast_msg = {
                    "type": "new_message",
                    "data": {
                        "id": message.id,
                        "sender_id": message.sender_id,
                        "receiver_id": message.receiver_id,
                        "content": message.content,
                        "message_type": message.message_type,
                        "attachments": message.attachments,
                        "is_read": message.is_read,
                        "created_at": doc['created_at'],
                        "timestamp": doc['created_at']
                    }
                }
                
                # Send to both sender and receiver
                await manager.broadcast_to_conversation(
                    broadcast_msg, 
                    message.sender_id, 
                    message.receiver_id
                )
                
                logger.info(f"Message from {user_id} to {message.receiver_id}")
            
            elif message_type == "typing":
                # Handle typing indicator
                receiver_id = data.get("receiver_id")
                is_typing = data.get("is_typing", False)
                conversation_id = f"{min(user_id, receiver_id)}_{max(user_id, receiver_id)}"
                
                await manager.broadcast_typing(user_id, conversation_id, is_typing, receiver_id)
            
            elif message_type == "read_receipt":
                # Handle read receipts
                message_ids = data.get("message_ids", [])
                sender_id = data.get("sender_id")
                
                # Update messages as read in database
                if message_ids:
                    await db.chat_messages.update_many(
                        {"id": {"$in": message_ids}},
                        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
                    )
                
                # Notify sender that messages were read
                read_receipt_msg = {
                    "type": "read_receipt",
                    "message_ids": message_ids,
                    "read_by": user_id,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                await manager.send_personal_message(read_receipt_msg, sender_id)
            
            elif message_type == "ping":
                # Keep-alive ping
                await websocket.send_json({"type": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
        await manager.broadcast_presence(user_id, "offline")
        logger.info(f"User {user_id} disconnected")
    except Exception as e:
        logger.error(f"WebSocket error for {user_id}: {e}")
        manager.disconnect(websocket, user_id)


# ============== REST API Endpoints ==============

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks


# Chat REST endpoints (for initial load and history)

@api_router.get("/chat/messages/{user_id}/{partner_id}")
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
    
    # Reverse to get chronological order
    messages.reverse()
    return {"messages": messages, "total": len(messages)}

@api_router.post("/chat/messages")
async def create_message(message: ChatMessageCreate):
    """Create a new message (REST fallback for non-WebSocket clients)"""
    msg = ChatMessage(**message.model_dump())
    doc = msg.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc['updated_at']:
        doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.chat_messages.insert_one(doc)
    
    # Prepare message data for broadcast
    message_data = {
        "id": msg.id,
        "sender_id": msg.sender_id,
        "receiver_id": msg.receiver_id,
        "content": msg.content,
        "message_type": msg.message_type,
        "attachments": msg.attachments,
        "is_read": msg.is_read,
        "created_at": doc['created_at'],
        "timestamp": doc['created_at']
    }
    
    # Send via SSE (Server-Sent Events) - more reliable
    if sse_manager.is_user_online(msg.receiver_id):
        await sse_manager.send_to_user(msg.receiver_id, "message", message_data)
    
    # Also send to sender for confirmation
    if sse_manager.is_user_online(msg.sender_id):
        await sse_manager.send_to_user(msg.sender_id, "message_sent", message_data)
    
    # Fallback: If receiver is online via WebSocket, send there too
    if manager.is_user_online(msg.receiver_id):
        broadcast_msg = {"type": "new_message", "data": message_data}
        await manager.send_personal_message(broadcast_msg, msg.receiver_id)
    
    return {"id": msg.id, "created_at": doc['created_at']}

@api_router.put("/chat/messages/read")
async def mark_messages_read(message_ids: List[str], reader_id: str):
    """Mark messages as read"""
    result = await db.chat_messages.update_many(
        {"id": {"$in": message_ids}},
        {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"modified_count": result.modified_count}

@api_router.get("/chat/online-users")
async def get_online_users():
    """Get list of currently online users (from both WebSocket and SSE)"""
    ws_users = set(manager.get_online_users())
    sse_users = set(sse_manager.get_online_users())
    all_online = list(ws_users | sse_users)
    return {"online_users": all_online}

@api_router.get("/chat/user-status/{user_id}")
async def get_user_status(user_id: str):
    """Get user's online status"""
    is_online = manager.is_user_online(user_id)
    presence = manager.user_presence.get(user_id)
    
    return {
        "user_id": user_id,
        "is_online": is_online,
        "status": presence.status if presence else "offline",
        "last_seen": presence.last_seen.isoformat() if presence else None
    }


# ============== Recording Endpoints ==============

@api_router.post("/recordings")
async def create_recording(recording: RecordingCreate):
    """Save a new recording (stored for 7 days)"""
    try:
        # First, clean up expired recordings
        await db.recordings.delete_many({
            "expires_at": {"$lt": datetime.now(timezone.utc)}
        })
        
        # Calculate file size from base64 data
        file_size = len(recording.file_data) * 3 // 4  # Approximate decoded size
        
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": recording.user_id,
            "title": recording.title,
            "recording_type": recording.recording_type,
            "duration": recording.duration,
            "file_size": file_size,
            "file_data": recording.file_data,
            "mime_type": recording.mime_type,
            "category": recording.category,
            "is_shared": False,
            "share_token": None,
            "shared_with": [],
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7)
        }
        
        await db.recordings.insert_one(doc)
        
        # Return without the file_data to reduce response size
        return {
            "id": doc["id"],
            "user_id": doc["user_id"],
            "title": doc["title"],
            "recording_type": doc["recording_type"],
            "duration": doc["duration"],
            "file_size": doc["file_size"],
            "mime_type": doc["mime_type"],
            "category": doc["category"],
            "is_shared": doc["is_shared"],
            "created_at": doc["created_at"].isoformat(),
            "expires_at": doc["expires_at"].isoformat()
        }
    except Exception as e:
        logger.error(f"Error saving recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/{user_id}")
async def get_user_recordings(user_id: str):
    """Get all recordings for a user (excluding expired ones)"""
    try:
        # Clean up expired recordings first
        await db.recordings.delete_many({
            "expires_at": {"$lt": datetime.now(timezone.utc)}
        })
        
        # Get user's recordings without file_data to reduce response size
        recordings = await db.recordings.find(
            {"user_id": user_id},
            {"_id": 0, "file_data": 0}
        ).sort("created_at", -1).to_list(100)
        
        # Convert datetime objects to ISO strings
        for rec in recordings:
            if "created_at" in rec:
                rec["created_at"] = rec["created_at"].isoformat()
            if "expires_at" in rec:
                rec["expires_at"] = rec["expires_at"].isoformat()
        
        return {"recordings": recordings}
    except Exception as e:
        logger.error(f"Error fetching recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/user/{user_id}/categories")
async def get_recording_categories(user_id: str):
    """Get all unique categories for a user's recordings"""
    try:
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$category", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        
        categories = await db.recordings.aggregate(pipeline).to_list(50)
        
        return {
            "categories": [
                {"name": cat["_id"] or "Uncategorized", "count": cat["count"]}
                for cat in categories
            ]
        }
    except Exception as e:
        logger.error(f"Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/user/{user_id}/shared-with-me")
async def get_recordings_shared_with_me(user_id: str):
    """Get recordings that have been shared with this user"""
    try:
        recordings = await db.recordings.find(
            {"shared_with": user_id, "is_shared": True},
            {"_id": 0, "file_data": 0}
        ).sort("created_at", -1).to_list(100)
        
        for rec in recordings:
            if "created_at" in rec:
                rec["created_at"] = rec["created_at"].isoformat()
            if "expires_at" in rec:
                rec["expires_at"] = rec["expires_at"].isoformat()
        
        return {"recordings": recordings}
    except Exception as e:
        logger.error(f"Error fetching shared recordings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/{user_id}/{recording_id}")
async def get_recording(user_id: str, recording_id: str):
    """Get a specific recording with file data"""
    try:
        recording = await db.recordings.find_one(
            {"id": recording_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # Check if expired
        if recording.get("expires_at") and recording["expires_at"] < datetime.now(timezone.utc):
            await db.recordings.delete_one({"id": recording_id})
            raise HTTPException(status_code=404, detail="Recording has expired")
        
        # Convert datetime objects
        if "created_at" in recording:
            recording["created_at"] = recording["created_at"].isoformat()
        if "expires_at" in recording:
            recording["expires_at"] = recording["expires_at"].isoformat()
        
        return recording
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/recordings/{user_id}/{recording_id}")
async def delete_recording(user_id: str, recording_id: str):
    """Delete a recording"""
    try:
        result = await db.recordings.delete_one({"id": recording_id, "user_id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return {"message": "Recording deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/recordings/{user_id}/{recording_id}")
async def update_recording(user_id: str, recording_id: str, update: RecordingUpdate):
    """Update recording title or category"""
    try:
        update_data = {}
        if update.title is not None:
            update_data["title"] = update.title
        if update.category is not None:
            update_data["category"] = update.category
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        result = await db.recordings.update_one(
            {"id": recording_id, "user_id": user_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return {"message": "Recording updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/recordings/{user_id}/{recording_id}/share")
async def share_recording(user_id: str, recording_id: str, share_data: RecordingShare):
    """Share a recording with other users or generate a public link"""
    try:
        recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        update_data = {
            "is_shared": True,
            "shared_with": share_data.share_with_users
        }
        
        # Generate share token for public sharing
        if share_data.is_public:
            share_token = str(uuid.uuid4())[:8]
            update_data["share_token"] = share_token
        
        await db.recordings.update_one(
            {"id": recording_id},
            {"$set": update_data}
        )
        
        response = {"message": "Recording shared successfully"}
        if share_data.is_public:
            response["share_url"] = f"/shared/recording/{update_data.get('share_token', recording.get('share_token'))}"
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sharing recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/recordings/{user_id}/{recording_id}/share")
async def unshare_recording(user_id: str, recording_id: str):
    """Remove sharing from a recording"""
    try:
        result = await db.recordings.update_one(
            {"id": recording_id, "user_id": user_id},
            {"$set": {"is_shared": False, "share_token": None, "shared_with": []}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        return {"message": "Sharing removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsharing recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/shared/{share_token}")
async def get_shared_recording(share_token: str):
    """Get a publicly shared recording by share token"""
    try:
        recording = await db.recordings.find_one(
            {"share_token": share_token, "is_shared": True},
            {"_id": 0}
        )
        
        if not recording:
            raise HTTPException(status_code=404, detail="Shared recording not found")
        
        # Check if expired
        if recording.get("expires_at") and recording["expires_at"] < datetime.now(timezone.utc):
            await db.recordings.delete_one({"share_token": share_token})
            raise HTTPException(status_code=404, detail="Recording has expired")
        
        # Convert datetime objects
        if "created_at" in recording:
            recording["created_at"] = recording["created_at"].isoformat()
        if "expires_at" in recording:
            recording["expires_at"] = recording["expires_at"].isoformat()
        
        return recording
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shared recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()