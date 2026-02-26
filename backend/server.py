from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Query, Depends, Request
from fastapi.responses import StreamingResponse, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Optional, Set
import uuid
import json
from datetime import datetime, timezone, timedelta
import asyncio
import base64
from collections import defaultdict
from bson import ObjectId
import io
import jwt
import secrets
import string
import resend


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# GridFS buckets for file storage
fs_recordings = AsyncIOMotorGridFSBucket(db, bucket_name="recordings")
fs_chat_files = AsyncIOMotorGridFSBucket(db, bucket_name="chat_files")

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Resend Configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Security
security = HTTPBearer(auto_error=False)

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


# ============== User Models ==============

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "User"
    status: str = "Active"
    plan: str = "Free"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None
    avatar: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    temp_password: str
    new_password: str


# ============== JWT Helper Functions ==============

def generate_temp_password(length=12):
    """Generate a random temporary password"""
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(chars) for _ in range(length))

def create_jwt_token(user_id: str, email: str, role: str = "User") -> str:
    """Create a JWT token for a user"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get the current authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to optionally get the current user (doesn't fail if not authenticated)"""
    if not credentials:
        return None
    
    try:
        payload = verify_jwt_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None

async def send_password_reset_email(email: str, temp_password: str, user_name: str):
    """Send password reset email with temporary password"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #7c3aed; margin: 0;">Munal AI</h1>
            <p style="color: #6b7280; font-size: 14px;">Your AI Meeting Companion</p>
        </div>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #4b5563;">Hi {user_name},</p>
                <p style="color: #4b5563;">We received a request to reset your password. Here is your temporary password:</p>
            
            <div style="background-color: #fff; border: 2px dashed #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 24px; font-weight: bold; color: #7c3aed; letter-spacing: 2px; margin: 0;">{temp_password}</p>
            </div>
            
            <p style="color: #4b5563;">Please log in with this temporary password. You will be required to change it on your first login.</p>
            
            <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> This temporary password will expire in 24 hours.</p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
              <p className="color: #9ca3af; font-size: 12px;">If you didn&apos;t request this password reset, please ignore this email or contact support.</p>
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI. All rights reserved.</p>
        </div>
    </div>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "Password Reset - Munal AI",
        "html": html_content
    }
    
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {email}")
        return result
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise


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


# ============== Payment Models ==============

# Define fixed subscription packages (prices in USD)
SUBSCRIPTION_PACKAGES = {
    "free": {"name": "Free", "price": 0.00, "features": ["5 meetings/month", "1 GB storage", "30 min transcription"]},
    "pro_monthly": {"name": "Pro Monthly", "price": 29.00, "features": ["100 meetings/month", "10 GB storage", "500 min transcription", "Priority support"]},
    "pro_annual": {"name": "Pro Annual", "price": 290.00, "features": ["100 meetings/month", "10 GB storage", "500 min transcription", "Priority support", "2 months free"]},
    "enterprise_monthly": {"name": "Enterprise Monthly", "price": 99.00, "features": ["Unlimited meetings", "100 GB storage", "Unlimited transcription", "24/7 support", "SSO"]},
    "enterprise_annual": {"name": "Enterprise Annual", "price": 990.00, "features": ["Unlimited meetings", "100 GB storage", "Unlimited transcription", "24/7 support", "SSO", "2 months free"]}
}

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    package_id: str
    package_name: str
    amount: float
    currency: str = "usd"
    payment_status: str = "pending"  # pending, paid, failed, expired, refunded
    status: str = "initiated"  # initiated, completed, cancelled, expired
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


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

@api_router.get("/admin/chat/messages/{user_id}")
async def get_user_all_messages(user_id: str, limit: int = 100, offset: int = 0):
    """Get all messages for a specific user (admin only) - both sent and received"""
    messages = await db.chat_messages.find(
        {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]},
        {"_id": 0}
    ).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    
    # Get unique user IDs from messages for partner info
    partner_ids = set()
    for msg in messages:
        if msg['sender_id'] != user_id:
            partner_ids.add(msg['sender_id'])
        if msg['receiver_id'] != user_id:
            partner_ids.add(msg['receiver_id'])
    
    # Fetch partner info
    partners = {}
    for pid in partner_ids:
        partner = await db.users.find_one({"id": pid}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if partner:
            partners[pid] = partner
    
    return {"messages": messages, "total": len(messages), "partners": partners}


# ==================== ADMIN SETTINGS API ====================

# Audit logging helper function (defined early so all endpoints can use it)
async def log_audit_event(
    action: str,
    category: Optional[str] = None,
    admin_id: Optional[str] = None,
    admin_email: Optional[str] = "admin",
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None
):
    """Helper function to log audit events to MongoDB"""
    audit_doc = {
        "action": action,
        "category": category,
        "admin_id": admin_id,
        "admin_email": admin_email,
        "details": details or {},
        "ip_address": ip_address,
        "user_agent": user_agent,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_doc)
    return audit_doc

class AdminSettingsUpdate(BaseModel):
    category: str  # e.g., 'general', 'email', 'api', 'security', 'notifications', 'system'
    settings: Dict

def get_client_ip(request: Request) -> str:
    """Extract client IP address from request headers"""
    # Check for forwarded headers (when behind proxy/load balancer)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip
    # Fall back to direct connection IP
    return request.client.host if request.client else "unknown"

def get_user_agent(request: Request) -> str:
    """Extract user agent from request headers"""
    return request.headers.get("user-agent", "unknown")

@api_router.get("/admin/settings")
async def get_all_admin_settings():
    """Get all admin settings from database"""
    settings = await db.admin_settings.find({}, {"_id": 0}).to_list(length=100)
    
    # Convert to a dictionary keyed by category
    result = {}
    for setting in settings:
        category = setting.get('category')
        if category:
            result[category] = setting.get('settings', {})
            result[category]['_metadata'] = {
                'updated_at': setting.get('updated_at'),
                'updated_by': setting.get('updated_by')
            }
    
    return {"settings": result, "success": True}

@api_router.get("/admin/settings/{category}")
async def get_admin_settings_by_category(category: str):
    """Get admin settings for a specific category"""
    setting = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    
    if not setting:
        # Return default empty settings
        return {"category": category, "settings": {}, "exists": False}
    
    return {
        "category": category,
        "settings": setting.get('settings', {}),
        "updated_at": setting.get('updated_at'),
        "updated_by": setting.get('updated_by'),
        "exists": True
    }

@api_router.put("/admin/settings/{category}")
async def update_admin_settings(category: str, data: AdminSettingsUpdate, request: Request):
    """Update admin settings for a specific category - persists to MongoDB with audit logging"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get previous settings for audit comparison
    prev_settings = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    
    update_doc = {
        "category": category,
        "settings": data.settings,
        "updated_at": now,
        "updated_by": "admin"
    }
    
    # Upsert - create if doesn't exist, update if exists
    result = await db.admin_settings.update_one(
        {"category": category},
        {"$set": update_doc},
        upsert=True
    )
    
    # Log audit event with IP and user agent
    await log_audit_event(
        action="settings_update",
        category=category,
        admin_email="admin",
        details={
            "previous": prev_settings.get("settings") if prev_settings else None,
            "new": data.settings,
            "modified": result.modified_count > 0,
            "created": result.upserted_id is not None
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {
        "success": True,
        "category": category,
        "updated_at": now,
        "modified": result.modified_count > 0,
        "created": result.upserted_id is not None
    }

@api_router.delete("/admin/settings/{category}")
async def delete_admin_settings(category: str, request: Request):
    """Delete admin settings for a specific category with audit logging"""
    # Get settings before deletion for audit
    prev_settings = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    
    result = await db.admin_settings.delete_one({"category": category})
    
    # Log audit event with IP and user agent
    if result.deleted_count > 0:
        await log_audit_event(
            action="settings_delete",
            category=category,
            admin_email="admin",
            details={"deleted_settings": prev_settings.get("settings") if prev_settings else None},
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )
    
    return {
        "success": result.deleted_count > 0,
        "category": category,
        "deleted": result.deleted_count > 0
    }

@api_router.post("/admin/settings/reset-defaults")
async def reset_admin_settings_to_defaults(request: Request):
    """Reset all admin settings to defaults (clears database settings) with audit logging"""
    # Get all settings before reset for audit
    all_settings = await db.admin_settings.find({}, {"_id": 0}).to_list(length=100)
    
    result = await db.admin_settings.delete_many({})
    
    # Log audit event with IP and user agent
    await log_audit_event(
        action="settings_reset",
        category="all",
        admin_email="admin",
        details={
            "deleted_count": result.deleted_count,
            "previous_settings": {s["category"]: s.get("settings") for s in all_settings}
        },
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": "All settings reset to defaults"
    }
    result = await db.admin_settings.delete_many({})
    
    return {
        "success": True,
        "deleted_count": result.deleted_count,
        "message": "All settings reset to defaults"
    }


# ==================== SMTP TEST & AUDIT LOGGING ====================

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class SMTPTestRequest(BaseModel):
    smtpHost: str
    smtpPort: int = 587
    username: str = ""
    password: str = ""
    senderName: str = "Test Sender"
    senderEmail: str
    recipientEmail: str
    useTLS: bool = True

class AuditLogEntry(BaseModel):
    action: str  # e.g., 'settings_update', 'settings_reset', 'user_login'
    category: Optional[str] = None
    admin_id: Optional[str] = None
    admin_email: Optional[str] = None
    details: Optional[Dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

@api_router.post("/admin/smtp/test")
async def test_smtp_connection(config: SMTPTestRequest):
    """Test SMTP connection by sending a real test email"""
    try:
        # Create test email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = '🧪 SMTP Test - Munal Admin'
        msg['From'] = f"{config.senderName} <{config.senderEmail}>"
        msg['To'] = config.recipientEmail
        
        # Plain text version
        text_content = f"""
SMTP Connection Test Successful!

This email confirms that your SMTP settings are working correctly.

Configuration tested:
- SMTP Host: {config.smtpHost}
- SMTP Port: {config.smtpPort}
- TLS Enabled: {config.useTLS}
- Sender: {config.senderName} <{config.senderEmail}>

Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}

-- 
Munal Admin System
        """
        
        # HTML version
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 40px; }}
                .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
                .header {{ text-align: center; margin-bottom: 30px; }}
                .icon {{ font-size: 48px; margin-bottom: 10px; }}
                h1 {{ color: #1e293b; margin: 0; font-size: 24px; }}
                .success {{ color: #10b981; font-weight: 600; }}
                .details {{ background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0; }}
                .detail-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }}
                .detail-row:last-child {{ border-bottom: none; }}
                .label {{ color: #64748b; }}
                .value {{ color: #1e293b; font-weight: 500; }}
                .footer {{ text-align: center; color: #94a3b8; font-size: 12px; margin-top: 30px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="icon">✅</div>
                    <h1>SMTP Test <span class="success">Successful</span></h1>
                </div>
                <p>Your email configuration is working correctly. This test email was sent from the Munal Admin panel.</p>
                <div class="details">
                    <div class="detail-row">
                        <span class="label">SMTP Host</span>
                        <span class="value">{config.smtpHost}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">SMTP Port</span>
                        <span class="value">{config.smtpPort}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">TLS/SSL</span>
                        <span class="value">{'Enabled' if config.useTLS else 'Disabled'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Sender</span>
                        <span class="value">{config.senderEmail}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Timestamp</span>
                        <span class="value">{datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}</span>
                    </div>
                </div>
                <div class="footer">
                    <p>Munal Admin System • Automated Test Email</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        
        # Send email via SMTP
        smtp_client = aiosmtplib.SMTP(
            hostname=config.smtpHost,
            port=config.smtpPort,
            use_tls=config.useTLS,
            start_tls=not config.useTLS  # Use STARTTLS if not using direct TLS
        )
        
        await smtp_client.connect()
        
        # Login if credentials provided
        if config.username and config.password:
            await smtp_client.login(config.username, config.password)
        
        await smtp_client.send_message(msg)
        await smtp_client.quit()
        
        # Log the successful test
        await log_audit_event(
            action="smtp_test",
            category="email",
            details={
                "smtp_host": config.smtpHost,
                "smtp_port": config.smtpPort,
                "recipient": config.recipientEmail,
                "success": True
            }
        )
        
        return {
            "success": True,
            "message": f"Test email sent successfully to {config.recipientEmail}",
            "details": {
                "host": config.smtpHost,
                "port": config.smtpPort,
                "tls": config.useTLS
            }
        }
        
    except aiosmtplib.SMTPAuthenticationError as e:
        await log_audit_event(
            action="smtp_test",
            category="email",
            details={"error": "Authentication failed", "smtp_host": config.smtpHost, "success": False}
        )
        return {
            "success": False,
            "message": "SMTP Authentication failed. Please check your username and password.",
            "error": str(e)
        }
    except aiosmtplib.SMTPConnectError as e:
        await log_audit_event(
            action="smtp_test",
            category="email",
            details={"error": "Connection failed", "smtp_host": config.smtpHost, "success": False}
        )
        return {
            "success": False,
            "message": f"Could not connect to SMTP server at {config.smtpHost}:{config.smtpPort}",
            "error": str(e)
        }
    except Exception as e:
        await log_audit_event(
            action="smtp_test",
            category="email",
            details={"error": str(e), "smtp_host": config.smtpHost, "success": False}
        )
        return {
            "success": False,
            "message": f"Failed to send test email: {str(e)}",
            "error": str(e)
        }

@api_router.get("/admin/audit-logs")
async def get_audit_logs(
    action: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get audit logs with optional filtering"""
    query = {}
    if action:
        query["action"] = action
    if category:
        query["category"] = category
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).skip(offset).limit(limit).to_list(length=limit)
    total = await db.audit_logs.count_documents(query)
    
    return {
        "logs": logs,
        "total": total,
        "limit": limit,
        "offset": offset
    }

@api_router.get("/admin/audit-logs/summary")
async def get_audit_logs_summary():
    """Get summary of audit logs by action type"""
    pipeline = [
        {"$group": {"_id": "$action", "count": {"$sum": 1}, "last_occurrence": {"$max": "$timestamp"}}},
        {"$sort": {"count": -1}}
    ]
    results = await db.audit_logs.aggregate(pipeline).to_list(length=100)
    
    return {
        "summary": [{"action": r["_id"], "count": r["count"], "last_occurrence": r["last_occurrence"]} for r in results]
    }

@api_router.get("/admin/audit-logs/export")
async def export_audit_logs(
    format: str = Query("json", regex="^(json|csv)$"),
    action: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 1000
):
    """Export audit logs to JSON or CSV format"""
    import csv
    import io
    
    query = {}
    if action:
        query["action"] = action
    if category:
        query["category"] = category
    if start_date or end_date:
        query["timestamp"] = {}
        if start_date:
            query["timestamp"]["$gte"] = start_date
        if end_date:
            query["timestamp"]["$lte"] = end_date
    
    logs = await db.audit_logs.find(query, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(length=limit)
    
    if format == "csv":
        # Generate CSV
        output = io.StringIO()
        if logs:
            # Flatten the details dict for CSV
            fieldnames = ["timestamp", "action", "category", "admin_email", "admin_id", "ip_address", "user_agent", "details"]
            writer = csv.DictWriter(output, fieldnames=fieldnames)
            writer.writeheader()
            
            for log in logs:
                row = {
                    "timestamp": log.get("timestamp", ""),
                    "action": log.get("action", ""),
                    "category": log.get("category", ""),
                    "admin_email": log.get("admin_email", ""),
                    "admin_id": log.get("admin_id", ""),
                    "ip_address": log.get("ip_address", ""),
                    "user_agent": log.get("user_agent", ""),
                    "details": json.dumps(log.get("details", {}))
                }
                writer.writerow(row)
        
        csv_content = output.getvalue()
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
        )
    else:
        # JSON format
        return Response(
            content=json.dumps({"logs": logs, "exported_at": datetime.now(timezone.utc).isoformat(), "count": len(logs)}, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename=audit_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"}
        )

# ==================== COUPONS API ====================

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"  # "percentage" or "fixed"
    discount_value: float
    description: Optional[str] = None
    max_uses: Optional[int] = None
    max_uses_per_user: int = 1
    min_order_amount: Optional[float] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    applicable_plans: Optional[List[str]] = None
    is_active: bool = True

class CouponUpdate(BaseModel):
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    description: Optional[str] = None
    max_uses: Optional[int] = None
    max_uses_per_user: Optional[int] = None
    min_order_amount: Optional[float] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    applicable_plans: Optional[List[str]] = None
    is_active: Optional[bool] = None

@api_router.get("/admin/coupons")
async def get_all_coupons(
    is_active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get all coupons with optional filtering"""
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    coupons = await db.coupons.find(query, {"_id": 0}).sort("created_at", -1).skip(offset).limit(limit).to_list(length=limit)
    total = await db.coupons.count_documents(query)
    
    return {"coupons": coupons, "total": total, "limit": limit, "offset": offset}

@api_router.get("/admin/coupons/{code}")
async def get_coupon(code: str):
    """Get a specific coupon by code"""
    coupon = await db.coupons.find_one({"code": code.upper()}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon

@api_router.post("/admin/coupons")
async def create_coupon(coupon: CouponCreate, request: Request):
    """Create a new coupon"""
    # Check if coupon code already exists
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_doc = {
        "id": str(uuid.uuid4()),
        "code": coupon.code.upper(),
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value,
        "description": coupon.description,
        "max_uses": coupon.max_uses,
        "max_uses_per_user": coupon.max_uses_per_user,
        "min_order_amount": coupon.min_order_amount,
        "valid_from": coupon.valid_from,
        "valid_until": coupon.valid_until,
        "applicable_plans": coupon.applicable_plans or [],
        "is_active": coupon.is_active,
        "times_used": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.coupons.insert_one(coupon_doc)
    
    # Log audit event
    await log_audit_event(
        action="coupon_create",
        category="billing",
        admin_email="admin",
        details={"coupon_code": coupon.code.upper(), "discount_type": coupon.discount_type, "discount_value": coupon.discount_value},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    # Remove MongoDB _id before returning
    coupon_doc.pop("_id", None)
    return {"success": True, "coupon": coupon_doc}

@api_router.put("/admin/coupons/{code}")
async def update_coupon(code: str, update: CouponUpdate, request: Request):
    """Update an existing coupon"""
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.coupons.update_one({"code": code.upper()}, {"$set": update_data})
    
    # Log audit event
    await log_audit_event(
        action="coupon_update",
        category="billing",
        admin_email="admin",
        details={"coupon_code": code.upper(), "updates": update_data},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    updated_coupon = await db.coupons.find_one({"code": code.upper()}, {"_id": 0})
    return {"success": True, "coupon": updated_coupon}

@api_router.delete("/admin/coupons/{code}")
async def delete_coupon(code: str, request: Request):
    """Delete a coupon"""
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    await db.coupons.delete_one({"code": code.upper()})
    
    # Log audit event
    await log_audit_event(
        action="coupon_delete",
        category="billing",
        admin_email="admin",
        details={"coupon_code": code.upper()},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"success": True, "message": f"Coupon {code.upper()} deleted"}

@api_router.post("/admin/coupons/{code}/toggle")
async def toggle_coupon_status(code: str, request: Request):
    """Toggle coupon active status"""
    coupon = await db.coupons.find_one({"code": code.upper()})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    
    new_status = not coupon.get("is_active", True)
    await db.coupons.update_one(
        {"code": code.upper()},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log audit event
    await log_audit_event(
        action="coupon_toggle",
        category="billing",
        admin_email="admin",
        details={"coupon_code": code.upper(), "new_status": new_status},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"success": True, "code": code.upper(), "is_active": new_status}

# Validate coupon (for checkout)
@api_router.post("/coupons/validate")
async def validate_coupon(code: str = Query(...), plan: Optional[str] = None, amount: Optional[float] = None):
    """Validate a coupon code for checkout"""
    coupon = await db.coupons.find_one({"code": code.upper(), "is_active": True}, {"_id": 0})
    
    if not coupon:
        return {"valid": False, "message": "Invalid or inactive coupon code"}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Check validity period
    if coupon.get("valid_from") and now < coupon["valid_from"]:
        return {"valid": False, "message": "Coupon is not yet active"}
    if coupon.get("valid_until") and now > coupon["valid_until"]:
        return {"valid": False, "message": "Coupon has expired"}
    
    # Check max uses
    if coupon.get("max_uses") and coupon.get("times_used", 0) >= coupon["max_uses"]:
        return {"valid": False, "message": "Coupon usage limit reached"}
    
    # Check min order amount
    if coupon.get("min_order_amount") and amount and amount < coupon["min_order_amount"]:
        return {"valid": False, "message": f"Minimum order amount is ${coupon['min_order_amount']}"}
    
    # Check applicable plans
    if coupon.get("applicable_plans") and plan and plan not in coupon["applicable_plans"]:
        return {"valid": False, "message": "Coupon not valid for this plan"}
    
    # Calculate discount
    discount = 0
    if amount:
        if coupon["discount_type"] == "percentage":
            discount = amount * (coupon["discount_value"] / 100)
        else:
            discount = min(coupon["discount_value"], amount)
    
    return {
        "valid": True,
        "coupon": coupon,
        "discount_amount": round(discount, 2),
        "message": f"Coupon applied: {coupon['discount_value']}{'%' if coupon['discount_type'] == 'percentage' else ' off'}"
    }

# ==================== TAX RATES API ====================

class TaxRateCreate(BaseModel):
    name: str
    rate: float  # Percentage (e.g., 20 for 20%)
    country: str
    state: Optional[str] = None
    description: Optional[str] = None
    is_inclusive: bool = False  # Whether tax is included in price
    is_active: bool = True

class TaxRateUpdate(BaseModel):
    name: Optional[str] = None
    rate: Optional[float] = None
    country: Optional[str] = None
    state: Optional[str] = None
    description: Optional[str] = None
    is_inclusive: Optional[bool] = None
    is_active: Optional[bool] = None

@api_router.get("/admin/tax-rates")
async def get_all_tax_rates(
    country: Optional[str] = None,
    is_active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    """Get all tax rates with optional filtering"""
    query = {}
    if country:
        query["country"] = country.upper()
    if is_active is not None:
        query["is_active"] = is_active
    
    tax_rates = await db.tax_rates.find(query, {"_id": 0}).sort("country", 1).skip(offset).limit(limit).to_list(length=limit)
    total = await db.tax_rates.count_documents(query)
    
    return {"tax_rates": tax_rates, "total": total, "limit": limit, "offset": offset}

@api_router.get("/admin/tax-rates/{tax_id}")
async def get_tax_rate(tax_id: str):
    """Get a specific tax rate"""
    tax_rate = await db.tax_rates.find_one({"id": tax_id}, {"_id": 0})
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    return tax_rate

@api_router.post("/admin/tax-rates")
async def create_tax_rate(tax_rate: TaxRateCreate, request: Request):
    """Create a new tax rate"""
    tax_doc = {
        "id": str(uuid.uuid4()),
        "name": tax_rate.name,
        "rate": tax_rate.rate,
        "country": tax_rate.country.upper(),
        "state": tax_rate.state.upper() if tax_rate.state else None,
        "description": tax_rate.description,
        "is_inclusive": tax_rate.is_inclusive,
        "is_active": tax_rate.is_active,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.tax_rates.insert_one(tax_doc)
    
    # Log audit event
    await log_audit_event(
        action="tax_rate_create",
        category="billing",
        admin_email="admin",
        details={"tax_name": tax_rate.name, "rate": tax_rate.rate, "country": tax_rate.country},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    tax_doc.pop("_id", None)
    return {"success": True, "tax_rate": tax_doc}

@api_router.put("/admin/tax-rates/{tax_id}")
async def update_tax_rate(tax_id: str, update: TaxRateUpdate, request: Request):
    """Update an existing tax rate"""
    tax_rate = await db.tax_rates.find_one({"id": tax_id})
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    update_data = {k: v for k, v in update.dict().items() if v is not None}
    if "country" in update_data:
        update_data["country"] = update_data["country"].upper()
    if "state" in update_data and update_data["state"]:
        update_data["state"] = update_data["state"].upper()
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.tax_rates.update_one({"id": tax_id}, {"$set": update_data})
    
    # Log audit event
    await log_audit_event(
        action="tax_rate_update",
        category="billing",
        admin_email="admin",
        details={"tax_id": tax_id, "updates": update_data},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    updated_tax = await db.tax_rates.find_one({"id": tax_id}, {"_id": 0})
    return {"success": True, "tax_rate": updated_tax}

@api_router.delete("/admin/tax-rates/{tax_id}")
async def delete_tax_rate(tax_id: str, request: Request):
    """Delete a tax rate"""
    tax_rate = await db.tax_rates.find_one({"id": tax_id})
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    await db.tax_rates.delete_one({"id": tax_id})
    
    # Log audit event
    await log_audit_event(
        action="tax_rate_delete",
        category="billing",
        admin_email="admin",
        details={"tax_id": tax_id, "tax_name": tax_rate.get("name")},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"success": True, "message": f"Tax rate deleted"}

@api_router.post("/admin/tax-rates/{tax_id}/toggle")
async def toggle_tax_rate_status(tax_id: str, request: Request):
    """Toggle tax rate active status"""
    tax_rate = await db.tax_rates.find_one({"id": tax_id})
    if not tax_rate:
        raise HTTPException(status_code=404, detail="Tax rate not found")
    
    new_status = not tax_rate.get("is_active", True)
    await db.tax_rates.update_one(
        {"id": tax_id},
        {"$set": {"is_active": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log audit event
    await log_audit_event(
        action="tax_rate_toggle",
        category="billing",
        admin_email="admin",
        details={"tax_id": tax_id, "new_status": new_status},
        ip_address=get_client_ip(request),
        user_agent=get_user_agent(request)
    )
    
    return {"success": True, "id": tax_id, "is_active": new_status}

# Calculate tax for an amount
@api_router.get("/tax/calculate")
async def calculate_tax(amount: float, country: str, state: Optional[str] = None):
    """Calculate tax for a given amount and location"""
    query = {"country": country.upper(), "is_active": True}
    if state:
        query["state"] = state.upper()
    
    tax_rate = await db.tax_rates.find_one(query, {"_id": 0})
    
    if not tax_rate:
        # Try to find country-level rate without state
        tax_rate = await db.tax_rates.find_one(
            {"country": country.upper(), "state": None, "is_active": True},
            {"_id": 0}
        )
    
    if not tax_rate:
        return {"tax_amount": 0, "rate": 0, "message": "No tax rate found for location"}
    
    tax_amount = amount * (tax_rate["rate"] / 100)
    
    return {
        "tax_amount": round(tax_amount, 2),
        "rate": tax_rate["rate"],
        "tax_rate": tax_rate,
        "total_with_tax": round(amount + tax_amount, 2)
    }

# Update the settings endpoints to include audit logging
@api_router.put("/admin/settings/{category}/with-audit")
async def update_admin_settings_with_audit(category: str, data: AdminSettingsUpdate, admin_email: str = "admin"):
    """Update admin settings with audit logging"""
    now = datetime.now(timezone.utc).isoformat()
    
    # Get previous settings for comparison
    prev_settings = await db.admin_settings.find_one({"category": category}, {"_id": 0})
    
    update_doc = {
        "category": category,
        "settings": data.settings,
        "updated_at": now,
        "updated_by": admin_email
    }
    
    # Upsert
    result = await db.admin_settings.update_one(
        {"category": category},
        {"$set": update_doc},
        upsert=True
    )
    
    # Log the change
    await log_audit_event(
        action="settings_update",
        category=category,
        admin_email=admin_email,
        details={
            "previous": prev_settings.get("settings") if prev_settings else None,
            "new": data.settings,
            "modified": result.modified_count > 0,
            "created": result.upserted_id is not None
        }
    )
    
    return {
        "success": True,
        "category": category,
        "updated_at": now,
        "modified": result.modified_count > 0,
        "created": result.upserted_id is not None,
        "audit_logged": True
    }





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
    ws_online = manager.is_user_online(user_id)
    sse_online = sse_manager.is_user_online(user_id)
    is_online = ws_online or sse_online
    presence = manager.user_presence.get(user_id)
    
    return {
        "user_id": user_id,
        "is_online": is_online,
        "status": "online" if is_online else (presence.status if presence else "offline"),
        "last_seen": presence.last_seen.isoformat() if presence else None
    }

@api_router.post("/chat/typing")
async def send_typing_indicator(user_id: str, receiver_id: str, is_typing: bool):
    """Send typing indicator to receiver"""
    typing_data = {
        "user_id": user_id,
        "is_typing": is_typing,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    # Send via SSE
    if sse_manager.is_user_online(receiver_id):
        await sse_manager.send_to_user(receiver_id, "typing", typing_data)
    
    # Also send via WebSocket if connected
    if manager.is_user_online(receiver_id):
        await manager.broadcast_typing(user_id, f"{user_id}_{receiver_id}", is_typing, receiver_id)
    
    return {"status": "sent"}


# ============== User Management Endpoints ==============

@api_router.post("/auth/register")
async def register_user(user_data: UserCreate):
    """Register a new user"""
    try:
        # Check if email already exists
        existing = await db.users.find_one({"email": user_data.email.lower()})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create user document
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)
        
        user_doc = {
            "id": user_id,
            "email": user_data.email.lower(),
            "password": user_data.password,
            "name": user_data.name,
            "full_name": user_data.name,
            "role": user_data.role,
            "status": user_data.status,
            "plan": user_data.plan,
            "avatar": None,
            "created_at": now,
            "joined_date": now,
            "last_active": now,
            "must_change_password": False
        }
        
        await db.users.insert_one(user_doc)
        
        # Generate JWT token
        token = create_jwt_token(user_id, user_data.email.lower(), user_data.role)
        
        # Return user without password and _id
        user_doc.pop("password", None)
        user_doc.pop("_id", None)
        user_doc["created_at"] = user_doc["created_at"].isoformat()
        user_doc["joined_date"] = user_doc["joined_date"].isoformat()
        user_doc["last_active"] = user_doc["last_active"].isoformat()
        
        return {"user": user_doc, "token": token, "message": "User registered successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error registering user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/login")
async def login_user(credentials: UserLogin):
    """Login a user"""
    try:
        user = await db.users.find_one({"email": credentials.email.lower()})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check password - first try regular password, then temp password
        password_valid = False
        using_temp_password = False
        
        if user.get("password") == credentials.password:
            password_valid = True
        elif user.get("temp_password") and user.get("temp_password") == credentials.password:
            # Check if temp password is not expired
            temp_expires = user.get("temp_password_expires")
            if temp_expires:
                # Make sure both are timezone-aware for comparison
                if temp_expires.tzinfo is None:
                    temp_expires = temp_expires.replace(tzinfo=timezone.utc)
                if temp_expires >= datetime.now(timezone.utc):
                    password_valid = True
                    using_temp_password = True
                else:
                    raise HTTPException(status_code=401, detail="Temporary password has expired. Please request a new one.")
            else:
                password_valid = True
                using_temp_password = True
        
        if not password_valid:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        if user.get("status") == "Suspended":
            raise HTTPException(status_code=403, detail="Your account has been suspended")
        
        # Update last active
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"last_active": datetime.now(timezone.utc)}}
        )
        
        # Generate JWT token
        token = create_jwt_token(user["id"], user["email"], user.get("role", "User"))
        
        # Return user data (without password and _id)
        user_data = {k: v for k, v in user.items() if k not in ["password", "_id"]}
        for key in ["created_at", "joined_date", "last_active"]:
            if key in user_data and hasattr(user_data[key], 'isoformat'):
                user_data[key] = user_data[key].isoformat()
        
        return {"user": user_data, "token": token}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error logging in: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/auth/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    """Request a password reset - sends temporary password via email"""
    try:
        user = await db.users.find_one({"email": request.email.lower()})
        
        if not user:
            # Don't reveal if user exists or not for security
            return {"message": "If an account exists with this email, a password reset email will be sent."}
        
        # Generate temporary password
        temp_password = generate_temp_password()
        
        # Store temporary password and set flag
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "temp_password": temp_password,
                    "temp_password_expires": datetime.now(timezone.utc) + timedelta(hours=24),
                    "must_change_password": True
                }
            }
        )
        
        # Send email with temporary password
        user_name = user.get("name") or user.get("full_name") or "User"
        try:
            await send_password_reset_email(request.email.lower(), temp_password, user_name)
        except Exception as e:
            logger.error(f"Failed to send reset email: {e}")
            # Still return success to not reveal if email sending failed
        
        return {"message": "If an account exists with this email, a password reset email will be sent."}
    except Exception as e:
        logger.error(f"Error in forgot password: {e}")
        raise HTTPException(status_code=500, detail="An error occurred processing your request")

@api_router.post("/auth/change-password")
async def change_password(request: ResetPasswordRequest):
    """Change password after logging in with temporary password"""
    try:
        user = await db.users.find_one({"email": request.email.lower()})
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Check if using temp password
        if user.get("temp_password"):
            # Validate temp password
            if user.get("temp_password") != request.temp_password:
                raise HTTPException(status_code=401, detail="Invalid temporary password")
            
            # Check if temp password expired
            if user.get("temp_password_expires") and user["temp_password_expires"] < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Temporary password has expired. Please request a new one.")
        else:
            # Using current password
            if user.get("password") != request.temp_password:
                raise HTTPException(status_code=401, detail="Invalid current password")
        
        # Validate new password
        if len(request.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
        # Update password and clear temp password
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "password": request.new_password,
                    "must_change_password": False
                },
                "$unset": {
                    "temp_password": "",
                    "temp_password_expires": ""
                }
            }
        )
        
        # Generate new JWT token
        token = create_jwt_token(user["id"], user["email"], user.get("role", "User"))
        
        # Return user data
        user_data = {k: v for k, v in user.items() if k not in ["password", "_id", "temp_password", "temp_password_expires"]}
        user_data["must_change_password"] = False
        for key in ["created_at", "joined_date", "last_active"]:
            if key in user_data and hasattr(user_data[key], 'isoformat'):
                user_data[key] = user_data[key].isoformat()
        
        return {"user": user_data, "token": token, "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error changing password: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/auth/verify-token")
async def verify_token(current_user: dict = Depends(get_current_user)):
    """Verify if the current JWT token is valid"""
    return {"valid": True, "user": current_user}

@api_router.get("/users")
async def get_all_users():
    """Get all users (for admin)"""
    try:
        users_cursor = db.users.find({}, {"_id": 0, "password": 0}).sort("created_at", -1)
        users = await users_cursor.to_list(length=1000)
        
        # Convert datetime to ISO string
        for user in users:
            for key in ["created_at", "joined_date", "last_active"]:
                if key in user and hasattr(user[key], 'isoformat'):
                    user[key] = user[key].isoformat()
        
        return {"users": users}
    except Exception as e:
        logger.error(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/users/{user_id}")
async def get_user(user_id: str):
    """Get a single user by ID"""
    try:
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        for key in ["created_at", "joined_date", "last_active"]:
            if key in user and hasattr(user[key], 'isoformat'):
                user[key] = user[key].isoformat()
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate):
    """Update a user"""
    try:
        # Check if user exists
        existing = await db.users.find_one({"id": user_id})
        if not existing:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Build update document
        update_data = {}
        if updates.name is not None:
            update_data["name"] = updates.name
            update_data["full_name"] = updates.name
        if updates.email is not None:
            # Check email uniqueness
            email_check = await db.users.find_one({"email": updates.email.lower(), "id": {"$ne": user_id}})
            if email_check:
                raise HTTPException(status_code=400, detail="Email already in use")
            update_data["email"] = updates.email.lower()
        if updates.password is not None:
            update_data["password"] = updates.password
        if updates.role is not None:
            update_data["role"] = updates.role
        if updates.status is not None:
            update_data["status"] = updates.status
        if updates.plan is not None:
            update_data["plan"] = updates.plan
        if updates.avatar is not None:
            update_data["avatar"] = updates.avatar
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        await db.users.update_one({"id": user_id}, {"$set": update_data})
        
        # Return updated user
        updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        for key in ["created_at", "joined_date", "last_active"]:
            if key in updated and hasattr(updated[key], 'isoformat'):
                updated[key] = updated[key].isoformat()
        
        return {"user": updated, "message": "User updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    try:
        result = await db.users.delete_one({"id": user_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/users")
async def create_user_admin(user_data: UserCreate):
    """Create a user (admin endpoint)"""
    # Reuse the register endpoint logic
    return await register_user(user_data)


# ============== Chat File Upload Endpoints (GridFS Storage) ==============

@api_router.post("/chat/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    conversation_id: str = Form(...)
):
    """Upload a file for chat (images, documents, etc.)"""
    try:
        # Read file content
        content = await file.read()
        file_size = len(content)
        
        # Limit file size to 50MB
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Determine file type
        content_type = file.content_type or "application/octet-stream"
        filename = file.filename or f"file_{file_id}"
        
        # Upload to GridFS
        gridfs_id = await fs_chat_files.upload_from_stream(
            filename,
            io.BytesIO(content),
            metadata={
                "file_id": file_id,
                "user_id": user_id,
                "conversation_id": conversation_id,
                "original_filename": filename,
                "content_type": content_type,
                "file_size": file_size,
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Save metadata
        doc = {
            "id": file_id,
            "gridfs_id": str(gridfs_id),
            "user_id": user_id,
            "conversation_id": conversation_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": file_size,
            "created_at": datetime.now(timezone.utc)
        }
        await db.chat_files.insert_one(doc)
        
        return {
            "id": file_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": file_size,
            "url": f"/api/chat/files/{file_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading chat file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class ChatFileUploadJSON(BaseModel):
    user_id: str
    file_name: str
    file_data: str  # base64 encoded
    content_type: str = "application/octet-stream"
    category: str = "documents"
    conversation_id: str = "general"

@api_router.post("/chat/files/upload")
async def upload_chat_file_json(request: ChatFileUploadJSON):
    """Upload a file for chat using JSON (base64 encoded)"""
    try:
        # Decode base64 file data
        try:
            content = base64.b64decode(request.file_data)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 file data")
        
        file_size = len(content)
        
        # Limit file size to 50MB
        if file_size > 50 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 50MB.")
        
        # Generate unique file ID
        file_id = str(uuid.uuid4())
        
        # Upload to GridFS
        gridfs_id = await fs_chat_files.upload_from_stream(
            request.file_name,
            io.BytesIO(content),
            metadata={
                "file_id": file_id,
                "user_id": request.user_id,
                "conversation_id": request.conversation_id,
                "original_filename": request.file_name,
                "content_type": request.content_type,
                "file_size": file_size,
                "category": request.category,
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Save metadata
        doc = {
            "id": file_id,
            "gridfs_id": str(gridfs_id),
            "user_id": request.user_id,
            "conversation_id": request.conversation_id,
            "filename": request.file_name,
            "content_type": request.content_type,
            "file_size": file_size,
            "category": request.category,
            "created_at": datetime.now(timezone.utc)
        }
        await db.chat_files.insert_one(doc)
        
        return {
            "file_id": file_id,
            "filename": request.file_name,
            "content_type": request.content_type,
            "file_size": file_size,
            "url": f"/api/chat/files/{file_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading chat file (JSON): {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/chat/files/user/{user_id}")
async def list_user_files(user_id: str, category: str = None):
    """List all files for a user"""
    try:
        query = {"user_id": user_id}
        if category:
            query["category"] = category
        
        files_cursor = db.chat_files.find(query, {"_id": 0, "gridfs_id": 0}).sort("created_at", -1)
        files = await files_cursor.to_list(length=100)
        
        # Convert datetime to ISO string for JSON serialization
        for f in files:
            if f.get("created_at"):
                f["created_at"] = f["created_at"].isoformat() if hasattr(f["created_at"], 'isoformat') else str(f["created_at"])
        
        return {"files": files}
    except Exception as e:
        logger.error(f"Error listing user files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/chat/files/{file_id}")
async def get_chat_file(file_id: str):
    """Download/stream a chat file"""
    try:
        file_doc = await db.chat_files.find_one({"id": file_id})
        
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        if not file_doc.get("gridfs_id"):
            raise HTTPException(status_code=404, detail="File data not found")
        
        # Stream from GridFS
        grid_out = await fs_chat_files.open_download_stream(ObjectId(file_doc["gridfs_id"]))
        
        async def file_iterator():
            while True:
                chunk = await grid_out.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_iterator(),
            media_type=file_doc.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f"inline; filename=\"{file_doc.get('filename', 'file')}\""
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting chat file: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/chat/files/{file_id}")
async def delete_chat_file(file_id: str, user_id: str = Query(...)):
    """Delete a chat file"""
    try:
        file_doc = await db.chat_files.find_one({"id": file_id, "user_id": user_id})
        
        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")
        
        # Delete from GridFS
        if file_doc.get("gridfs_id"):
            try:
                await fs_chat_files.delete(ObjectId(file_doc["gridfs_id"]))
            except Exception as e:
                logger.warning(f"Could not delete GridFS file: {e}")
        
        # Delete metadata
        await db.chat_files.delete_one({"id": file_id})
        
        return {"message": "File deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting chat file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Recording Endpoints (GridFS Storage) ==============

@api_router.post("/recordings")
async def create_recording(recording: RecordingCreate):
    """Save a new recording to GridFS (stored for 7 days)"""
    try:
        # First, clean up expired recordings
        expired = await db.recordings.find({
            "expires_at": {"$lt": datetime.now(timezone.utc)}
        }).to_list(100)
        
        for exp_rec in expired:
            # Delete file from GridFS
            if exp_rec.get("gridfs_id"):
                try:
                    await fs_recordings.delete(ObjectId(exp_rec["gridfs_id"]))
                except Exception:
                    pass
            await db.recordings.delete_one({"id": exp_rec["id"]})
        
        # Decode base64 file data
        file_bytes = base64.b64decode(recording.file_data)
        file_size = len(file_bytes)
        
        # Generate unique ID
        recording_id = str(uuid.uuid4())
        
        # Upload file to GridFS
        gridfs_id = await fs_recordings.upload_from_stream(
            f"{recording_id}.webm",
            io.BytesIO(file_bytes),
            metadata={
                "recording_id": recording_id,
                "user_id": recording.user_id,
                "mime_type": recording.mime_type,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        # Save metadata to recordings collection (without file data)
        doc = {
            "id": recording_id,
            "user_id": recording.user_id,
            "title": recording.title,
            "recording_type": recording.recording_type,
            "duration": recording.duration,
            "file_size": file_size,
            "gridfs_id": str(gridfs_id),
            "mime_type": recording.mime_type,
            "category": recording.category,
            "is_shared": False,
            "share_token": None,
            "shared_with": [],
            "created_at": datetime.now(timezone.utc),
            "expires_at": datetime.now(timezone.utc) + timedelta(days=7)
        }
        
        await db.recordings.insert_one(doc)
        
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
        expired = await db.recordings.find({
            "expires_at": {"$lt": datetime.now(timezone.utc)}
        }).to_list(100)
        
        for exp_rec in expired:
            if exp_rec.get("gridfs_id"):
                try:
                    await fs_recordings.delete(ObjectId(exp_rec["gridfs_id"]))
                except Exception:
                    pass
            await db.recordings.delete_one({"id": exp_rec["id"]})
        
        # Get user's recordings without gridfs_id (internal)
        recordings = await db.recordings.find(
            {"user_id": user_id},
            {"_id": 0, "gridfs_id": 0}
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
    """Get a specific recording with file data from GridFS"""
    try:
        recording = await db.recordings.find_one(
            {"id": recording_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # Check if expired
        if recording.get("expires_at") and recording["expires_at"] < datetime.now(timezone.utc):
            # Delete from GridFS
            if recording.get("gridfs_id"):
                try:
                    await fs_recordings.delete(ObjectId(recording["gridfs_id"]))
                except Exception:
                    pass
            await db.recordings.delete_one({"id": recording_id})
            raise HTTPException(status_code=404, detail="Recording has expired")
        
        # Fetch file data from GridFS
        file_data = None
        if recording.get("gridfs_id"):
            try:
                grid_out = await fs_recordings.open_download_stream(ObjectId(recording["gridfs_id"]))
                file_bytes = await grid_out.read()
                file_data = base64.b64encode(file_bytes).decode('utf-8')
            except Exception as e:
                logger.error(f"Error reading from GridFS: {e}")
        
        # Convert datetime objects
        if "created_at" in recording:
            recording["created_at"] = recording["created_at"].isoformat()
        if "expires_at" in recording:
            recording["expires_at"] = recording["expires_at"].isoformat()
        
        # Add file data to response
        recording["file_data"] = file_data
        # Remove internal gridfs_id from response
        recording.pop("gridfs_id", None)
        
        return recording
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recordings/{user_id}/{recording_id}/stream")
async def stream_recording(user_id: str, recording_id: str):
    """Stream a recording directly (for video playback without base64)"""
    try:
        recording = await db.recordings.find_one(
            {"id": recording_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        if not recording.get("gridfs_id"):
            raise HTTPException(status_code=404, detail="Recording file not found")
        
        # Stream from GridFS
        grid_out = await fs_recordings.open_download_stream(ObjectId(recording["gridfs_id"]))
        
        async def file_iterator():
            while True:
                chunk = await grid_out.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_iterator(),
            media_type=recording.get("mime_type", "video/webm"),
            headers={
                "Content-Disposition": f"inline; filename={recording_id}.webm"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/recordings/{user_id}/{recording_id}")
async def delete_recording(user_id: str, recording_id: str):
    """Delete a recording and its GridFS file"""
    try:
        # First get the recording to find GridFS ID
        recording = await db.recordings.find_one({"id": recording_id, "user_id": user_id})
        
        if not recording:
            raise HTTPException(status_code=404, detail="Recording not found")
        
        # Delete from GridFS
        if recording.get("gridfs_id"):
            try:
                await fs_recordings.delete(ObjectId(recording["gridfs_id"]))
            except Exception as e:
                logger.warning(f"Could not delete GridFS file: {e}")
        
        # Delete metadata
        await db.recordings.delete_one({"id": recording_id, "user_id": user_id})
        
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

@api_router.get("/recordings/shared/{share_token}/stream")
async def stream_shared_recording(share_token: str):
    """Stream a publicly shared recording"""
    try:
        recording = await db.recordings.find_one(
            {"share_token": share_token, "is_shared": True}
        )
        
        if not recording:
            raise HTTPException(status_code=404, detail="Shared recording not found")
        
        # Check if expired
        if recording.get("expires_at") and recording["expires_at"] < datetime.now(timezone.utc):
            await db.recordings.delete_one({"share_token": share_token})
            raise HTTPException(status_code=404, detail="Recording has expired")
        
        if not recording.get("gridfs_id"):
            raise HTTPException(status_code=404, detail="Recording data not found")
        
        # Stream from GridFS
        grid_out = await fs_recordings.open_download_stream(ObjectId(recording["gridfs_id"]))
        
        async def file_iterator():
            while True:
                chunk = await grid_out.read(1024 * 1024)  # 1MB chunks
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_iterator(),
            media_type=recording.get("mime_type", "video/webm"),
            headers={
                "Content-Disposition": f"inline; filename=\"{recording.get('title', 'recording')}.webm\""
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error streaming shared recording: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Transcript Analysis Endpoint ==============

class TranscriptAnalysisRequest(BaseModel):
    text: str
    analysis_types: List[str] = ["summary", "key_points", "action_items", "sentiment", "topics"]

@api_router.post("/transcripts/analyze")
async def analyze_transcript(request: TranscriptAnalysisRequest):
    """Analyze a transcript using AI to extract insights"""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        
        llm_key = os.environ.get('EMERGENT_LLM_KEY')
        if not llm_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Truncate text if too long (to avoid token limits)
        max_chars = 15000
        text = request.text[:max_chars] if len(request.text) > max_chars else request.text
        
        # Create system prompt for analysis
        system_prompt = """You are an expert meeting transcript analyzer. Analyze the given transcript and provide structured insights.
        
Always respond in valid JSON format with the following structure:
{
    "summary": "A concise 2-3 sentence summary of the main discussion",
    "key_points": ["Point 1", "Point 2", "Point 3", ...],
    "action_items": [{"task": "Task description", "assignee": "Person name or 'Unassigned'", "priority": "high/medium/low"}],
    "sentiment": {"overall": "positive/neutral/negative", "score": 0.0-1.0, "highlights": ["Notable emotional moments"]},
    "topics": [{"name": "Topic name", "relevance": 0.0-1.0}],
    "speakers": [{"name": "Speaker name", "talk_time_percent": 0-100, "key_contributions": ["Contribution 1"]}],
    "questions_raised": ["Question 1", "Question 2"],
    "decisions_made": ["Decision 1", "Decision 2"]
}

Only include the sections that are relevant based on the transcript content. If a section has no data, use an empty array or appropriate default."""

        # Initialize chat
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"transcript_analysis_{uuid.uuid4()}",
            system_message=system_prompt
        ).with_model("openai", "gpt-4o")
        
        # Create analysis request
        analysis_prompt = f"""Analyze this meeting transcript and provide insights:

---TRANSCRIPT START---
{text}
---TRANSCRIPT END---

Provide a comprehensive analysis in JSON format."""

        user_message = UserMessage(text=analysis_prompt)
        
        # Get response
        response = await chat.send_message(user_message)
        
        # Try to parse as JSON
        try:
            # Clean up response if it has markdown code blocks
            cleaned_response = response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            analysis_result = json.loads(cleaned_response.strip())
        except json.JSONDecodeError:
            # If parsing fails, return raw response
            analysis_result = {
                "summary": response,
                "key_points": [],
                "action_items": [],
                "sentiment": {"overall": "neutral", "score": 0.5},
                "topics": [],
                "raw_response": response
            }
        
        return {
            "success": True,
            "analysis": analysis_result,
            "analyzed_at": datetime.now(timezone.utc).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Stripe Payment Endpoints ==============

@api_router.get("/payments/packages")
async def get_payment_packages():
    """Get all available subscription packages"""
    return {
        "packages": [
            {"id": k, **v} for k, v in SUBSCRIPTION_PACKAGES.items()
        ]
    }

@api_router.post("/payments/checkout")
async def create_checkout_session(request: CheckoutRequest):
    """Create a Stripe checkout session for a subscription package"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
        
        # Validate package exists
        if request.package_id not in SUBSCRIPTION_PACKAGES:
            raise HTTPException(status_code=400, detail=f"Invalid package: {request.package_id}")
        
        package = SUBSCRIPTION_PACKAGES[request.package_id]
        
        # Skip checkout for free plan
        if package["price"] == 0:
            return {
                "success": True,
                "package": request.package_id,
                "message": "Free plan activated",
                "requires_payment": False
            }
        
        # Get Stripe API key
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Payment service not configured")
        
        # Build success and cancel URLs using frontend origin
        success_url = f"{request.origin_url}/user/checkout?session_id={{CHECKOUT_SESSION_ID}}&status=success"
        cancel_url = f"{request.origin_url}/user/plans?status=cancelled"
        
        # Initialize Stripe checkout
        webhook_url = f"{request.origin_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Create metadata
        metadata = {
            "package_id": request.package_id,
            "package_name": package["name"],
            "user_id": request.user_id or "anonymous",
            "user_email": request.user_email or "anonymous"
        }
        
        # Create checkout session with amount from server-side package definition
        checkout_request = CheckoutSessionRequest(
            amount=package["price"],
            currency="usd",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record BEFORE redirect
        transaction_doc = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": request.user_id,
            "user_email": request.user_email,
            "package_id": request.package_id,
            "package_name": package["name"],
            "amount": package["price"],
            "currency": "usd",
            "payment_status": "pending",
            "status": "initiated",
            "metadata": metadata,
            "created_at": datetime.now(timezone.utc),
            "updated_at": None
        }
        
        await db.payment_transactions.insert_one(transaction_doc)
        logger.info(f"Created payment transaction: {transaction_doc['id']} for session: {session.session_id}")
        
        return {
            "success": True,
            "checkout_url": session.url,
            "session_id": session.session_id,
            "transaction_id": transaction_doc["id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/status/{session_id}")
async def get_checkout_status(session_id: str):
    """Get the status of a checkout session and update transaction"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Payment service not configured")
        
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        # Get checkout status from Stripe
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        # Find and update the transaction
        transaction = await db.payment_transactions.find_one({"session_id": session_id})
        
        if transaction:
            # Only update if status has changed and not already processed
            if transaction.get("payment_status") != checkout_status.payment_status:
                update_data = {
                    "payment_status": checkout_status.payment_status,
                    "status": "completed" if checkout_status.payment_status == "paid" else checkout_status.status,
                    "updated_at": datetime.now(timezone.utc)
                }
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": update_data}
                )
                logger.info(f"Updated transaction {transaction['id']} status to: {checkout_status.payment_status}")
        
        return {
            "session_id": session_id,
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "amount_total": checkout_status.amount_total,
            "currency": checkout_status.currency,
            "metadata": checkout_status.metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting checkout status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/transactions")
async def get_user_transactions(user_id: Optional[str] = None, user_email: Optional[str] = None):
    """Get payment transactions for a user"""
    try:
        query = {}
        if user_id:
            query["user_id"] = user_id
        elif user_email:
            query["user_email"] = user_email
        
        transactions = await db.payment_transactions.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        # Convert datetime objects to ISO strings
        for txn in transactions:
            if "created_at" in txn and hasattr(txn["created_at"], "isoformat"):
                txn["created_at"] = txn["created_at"].isoformat()
            if "updated_at" in txn and txn["updated_at"] and hasattr(txn["updated_at"], "isoformat"):
                txn["updated_at"] = txn["updated_at"].isoformat()
        
        return {"transactions": transactions}
        
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/payments/transactions/all")
async def get_all_transactions(skip: int = 0, limit: int = 50):
    """Get all payment transactions (admin endpoint)"""
    try:
        transactions = await db.payment_transactions.find(
            {},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.payment_transactions.count_documents({})
        
        # Convert datetime objects to ISO strings
        for txn in transactions:
            if "created_at" in txn and hasattr(txn["created_at"], "isoformat"):
                txn["created_at"] = txn["created_at"].isoformat()
            if "updated_at" in txn and txn["updated_at"] and hasattr(txn["updated_at"], "isoformat"):
                txn["updated_at"] = txn["updated_at"].isoformat()
        
        return {
            "transactions": transactions,
            "total": total,
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"Error fetching all transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi import Request

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        stripe_api_key = os.environ.get('STRIPE_API_KEY')
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Payment service not configured")
        
        # Get webhook body and signature
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            update_data = {
                "payment_status": webhook_response.payment_status,
                "status": "completed" if webhook_response.payment_status == "paid" else webhook_response.event_type,
                "updated_at": datetime.now(timezone.utc)
            }
            
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": update_data}
            )
            logger.info(f"Webhook updated session {webhook_response.session_id} to: {webhook_response.payment_status}")
        
        return {"received": True, "event_type": webhook_response.event_type}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ============== Text-to-Speech Endpoints ==============

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"  # alloy, ash, coral, echo, fable, nova, onyx, sage, shimmer
    model: str = "tts-1"  # tts-1 or tts-1-hd
    speed: float = 1.0  # 0.25 to 4.0

# Available TTS voices with descriptions
TTS_VOICES = {
    "alloy": {"name": "Alloy", "gender": "neutral", "description": "Neutral, balanced voice"},
    "ash": {"name": "Ash", "gender": "male", "description": "Clear, articulate male voice"},
    "coral": {"name": "Coral", "gender": "female", "description": "Warm, friendly female voice"},
    "echo": {"name": "Echo", "gender": "male", "description": "Smooth, calm male voice"},
    "fable": {"name": "Fable", "gender": "neutral", "description": "Expressive, storytelling voice"},
    "nova": {"name": "Nova", "gender": "female", "description": "Energetic, upbeat female voice"},
    "onyx": {"name": "Onyx", "gender": "male", "description": "Deep, authoritative male voice"},
    "sage": {"name": "Sage", "gender": "female", "description": "Wise, measured female voice"},
    "shimmer": {"name": "Shimmer", "gender": "female", "description": "Bright, cheerful female voice"}
}

@api_router.get("/tts/voices")
async def get_tts_voices():
    """Get available TTS voices"""
    return {
        "voices": [
            {"id": k, **v} for k, v in TTS_VOICES.items()
        ],
        "models": [
            {"id": "tts-1", "name": "Standard", "description": "Fast, good quality"},
            {"id": "tts-1-hd", "name": "HD", "description": "High quality, slower"}
        ]
    }

@api_router.post("/tts/generate")
async def generate_speech(request: TTSRequest):
    """Generate speech from text using OpenAI TTS"""
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        # Validate text length
        if len(request.text) > 4096:
            raise HTTPException(status_code=400, detail="Text exceeds maximum length of 4096 characters")
        
        if len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Validate voice
        if request.voice not in TTS_VOICES:
            raise HTTPException(status_code=400, detail=f"Invalid voice. Choose from: {', '.join(TTS_VOICES.keys())}")
        
        # Validate speed
        if request.speed < 0.25 or request.speed > 4.0:
            raise HTTPException(status_code=400, detail="Speed must be between 0.25 and 4.0")
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="TTS service not configured")
        
        # Initialize TTS
        tts = OpenAITextToSpeech(api_key=api_key)
        
        # Generate speech
        audio_bytes = await tts.generate_speech(
            text=request.text,
            model=request.model,
            voice=request.voice,
            speed=request.speed,
            response_format="mp3"
        )
        
        # Return audio as streaming response
        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": f"attachment; filename=speech_{request.voice}.mp3"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/tts/generate-base64")
async def generate_speech_base64(request: TTSRequest):
    """Generate speech and return as base64 for embedding"""
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        
        # Validate text length
        if len(request.text) > 4096:
            raise HTTPException(status_code=400, detail="Text exceeds maximum length of 4096 characters")
        
        if len(request.text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        
        # Validate voice
        if request.voice not in TTS_VOICES:
            raise HTTPException(status_code=400, detail=f"Invalid voice. Choose from: {', '.join(TTS_VOICES.keys())}")
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="TTS service not configured")
        
        # Initialize TTS
        tts = OpenAITextToSpeech(api_key=api_key)
        
        # Generate speech as base64
        audio_base64 = await tts.generate_speech_base64(
            text=request.text,
            model=request.model,
            voice=request.voice,
            speed=request.speed,
            response_format="mp3"
        )
        
        return {
            "success": True,
            "audio_base64": audio_base64,
            "format": "mp3",
            "voice": request.voice,
            "text_length": len(request.text)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== AI Chat Endpoints ==============

class AIChatMessage(BaseModel):
    role: str
    content: str

class AIChatRequest(BaseModel):
    messages: List[AIChatMessage]
    model: str = "gpt-4o"
    max_tokens: int = 1000
    temperature: float = 0.7

MUNAL_AI_SYSTEM_PROMPT = """You are Munal AI, an intelligent assistant specialized in helping users with:
- Meeting transcriptions and summaries
- Audio/video content analysis
- Scheduling and productivity tips
- General questions about the Munal platform

You are friendly, helpful, and concise. When users ask about transcriptions or meetings, provide actionable advice.
Keep responses focused and under 300 words unless more detail is specifically requested."""

@api_router.post("/ai/chat")
async def ai_chat(request: AIChatRequest):
    """AI chat endpoint using OpenAI via Emergent LLM Key"""
    try:
        from emergentintegrations.llm.openai import LlmChat, UserMessage
        
        # Get API key
        api_key = os.environ.get('EMERGENT_LLM_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="AI service not configured")
        
        # Initialize chat with system message
        chat = LlmChat(
            api_key=api_key,
            session_id=f"ai_chat_{uuid.uuid4()}",
            system_message=MUNAL_AI_SYSTEM_PROMPT
        ).with_model("openai", "gpt-4o")
        
        # Build conversation context
        for msg in request.messages[:-1]:  # All messages except last
            if msg.role == "user":
                await chat.send_message(UserMessage(text=msg.content))
        
        # Send the last user message and get response
        last_msg = request.messages[-1] if request.messages else None
        if not last_msg or last_msg.role != "user":
            raise HTTPException(status_code=400, detail="Last message must be from user")
        
        response = await chat.send_message(UserMessage(text=last_msg.content))
        
        return {
            "success": True,
            "response": response,
            "model": request.model
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/chat/stream")
async def ai_chat_stream(request: AIChatRequest):
    """AI chat - redirects to non-streaming endpoint (streaming not supported by library)"""
    # Streaming not supported by emergentintegrations LlmChat, use non-streaming
    return await ai_chat(request)


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