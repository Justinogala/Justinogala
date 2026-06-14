"""
Pydantic models for the application.
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Dict, Optional
from datetime import datetime, timezone, timedelta
import uuid


# ============== Status Models ==============

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str


# ============== Chat Models ==============

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    message_type: str = "text"
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
    status: str = "online"
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TypingIndicator(BaseModel):
    user_id: str
    conversation_id: str
    is_typing: bool

class ChatFileUpload(BaseModel):
    user_id: str
    file_name: str
    content_type: str
    category: str = "chat-files"

class ChatFileUploadJSON(BaseModel):
    user_id: str
    file_name: str
    file_data: str  # base64 encoded
    content_type: str
    category: str = "chat-files"


# ============== User Models ==============

# Default permissions by role
DEFAULT_PERMISSIONS = {
    "Admin": {
        "dashboard": {"view": True, "analytics": True},
        "users": {"view": True, "create": True, "edit": True, "delete": True},
        "workspaces": {"view": True, "manage": True, "suspend": True, "delete": True},
        "chat_moderation": {"view": True, "flag": True, "delete": True, "export": True},
        "shifts": {"view": True, "manage": True, "override": True, "export": True},
        "billing": {"view": True, "manage": True, "refunds": True},
        "settings": {"view": True, "modify": True, "security": True},
        "support": {"view": True, "respond": True},
        "messages": {"view": True, "send": True, "broadcast": True}
    },
    "Manager": {
        "dashboard": {"view": True, "analytics": True},
        "users": {"view": True, "create": False, "edit": False, "delete": False},
        "workspaces": {"view": True, "manage": True, "suspend": False, "delete": False},
        "chat_moderation": {"view": True, "flag": True, "delete": False, "export": False},
        "shifts": {"view": True, "manage": True, "override": False, "export": True},
        "billing": {"view": True, "manage": False, "refunds": False},
        "settings": {"view": True, "modify": False, "security": False},
        "support": {"view": True, "respond": True},
        "messages": {"view": True, "send": True, "broadcast": False}
    },
    "User": {
        "dashboard": {"view": False, "analytics": False},
        "users": {"view": False, "create": False, "edit": False, "delete": False},
        "workspaces": {"view": False, "manage": False, "suspend": False, "delete": False},
        "chat_moderation": {"view": False, "flag": False, "delete": False, "export": False},
        "shifts": {"view": False, "manage": False, "override": False, "export": False},
        "billing": {"view": False, "manage": False, "refunds": False},
        "settings": {"view": False, "modify": False, "security": False},
        "support": {"view": False, "respond": False},
        "messages": {"view": False, "send": False, "broadcast": False}
    }
}

class UserPermissions(BaseModel):
    dashboard: Dict[str, bool] = {"view": False, "analytics": False}
    users: Dict[str, bool] = {"view": False, "create": False, "edit": False, "delete": False}
    workspaces: Dict[str, bool] = {"view": False, "manage": False, "suspend": False, "delete": False}
    chat_moderation: Dict[str, bool] = {"view": False, "flag": False, "delete": False, "export": False}
    shifts: Dict[str, bool] = {"view": False, "manage": False, "override": False, "export": False}
    billing: Dict[str, bool] = {"view": False, "manage": False, "refunds": False}
    settings: Dict[str, bool] = {"view": False, "modify": False, "security": False}
    support: Dict[str, bool] = {"view": False, "respond": False}
    messages: Dict[str, bool] = {"view": False, "send": False, "broadcast": False}

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "User"
    status: str = "Active"
    plan: str = "Free"
    account_type: str = "personal"  # "personal" or "business"
    organization_id: Optional[str] = None
    permissions: Optional[Dict] = None  # If not provided, defaults based on role

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    plan: Optional[str] = None
    avatar: Optional[str] = None
    account_type: Optional[str] = None
    organization_id: Optional[str] = None
    telegram_chat_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    temp_password: str
    new_password: str


# ============== Recording Models ==============

class Recording(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    recording_type: str
    duration: int
    file_size: int
    file_data: str
    mime_type: str = "video/webm"
    category: str = "Uncategorized"
    is_shared: bool = False
    share_token: Optional[str] = None
    shared_with: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc) + timedelta(days=7))

class RecordingCreate(BaseModel):
    user_id: str
    title: str
    recording_type: str
    duration: int
    file_data: str
    mime_type: str = "video/webm"
    category: str = "Uncategorized"

class RecordingUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None

class RecordingShare(BaseModel):
    share_with_users: List[str] = []
    is_public: bool = False


# ============== Payment Models ==============

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
    payment_status: str = "pending"
    status: str = "initiated"
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None


# ============== Call Models ==============

class CallInitiate(BaseModel):
    caller_id: str
    caller_name: str
    callee_id: str
    call_type: str = "video"

class CallResponse(BaseModel):
    call_id: str
    responder_id: str
    action: str

class CallSignal(BaseModel):
    call_id: str
    from_user_id: str
    to_user_id: str
    signal_type: str
    signal_data: dict


# ============== Group Call Models ==============

class GroupCallJoin(BaseModel):
    room_id: str
    user_id: str
    user_name: str
    video_enabled: bool = True
    audio_enabled: bool = True

class GroupCallLeave(BaseModel):
    room_id: str
    user_id: str

class GroupCallSignal(BaseModel):
    room_id: str
    from_user_id: str
    to_user_id: str
    signal_type: str
    signal_data: dict

class GroupCallParticipantUpdate(BaseModel):
    room_id: str
    user_id: str
    video_enabled: Optional[bool] = None
    audio_enabled: Optional[bool] = None
    hand_raised: Optional[bool] = None
    is_speaking: Optional[bool] = None


# ============== Calendar Models ==============

class CalendarEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    organizer_id: str
    organizer_name: Optional[str] = None
    attendees: List[dict] = []
    location: Optional[str] = None
    meeting_link: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    reminders: List[dict] = []
    status: str = "scheduled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    organizer_id: str
    organizer_name: Optional[str] = None
    attendees: List[dict] = []
    location: Optional[str] = None
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None
    reminders: List[dict] = []

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[dict]] = None
    location: Optional[str] = None
    is_recurring: Optional[bool] = None
    recurrence_rule: Optional[str] = None
    reminders: Optional[List[dict]] = None
    status: Optional[str] = None


# ============== Workspace Models ==============

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class WorkspaceMemberAdd(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: str = "member"
    invited_by: str


# ============== Admin Models ==============

class AdminSettings(BaseModel):
    category: str
    settings: Dict

class CouponCreate(BaseModel):
    code: str
    discount_type: str = "percentage"
    discount_value: float
    max_uses: Optional[int] = None
    expires_at: Optional[datetime] = None
    min_purchase: Optional[float] = None
    applicable_packages: List[str] = []
    description: Optional[str] = None

class TaxRateCreate(BaseModel):
    name: str
    rate: float
    country: str
    region: Optional[str] = None
    tax_type: str = "vat"
    description: Optional[str] = None


# ============== AI Models ==============

class TranscriptAnalyzeRequest(BaseModel):
    transcript: str
    analysis_type: str = "summary"

class TTSRequest(BaseModel):
    text: str
    voice: str = "alloy"
    speed: float = 1.0

class AIChatRequest(BaseModel):
    message: str
    conversation_history: List[dict] = []
    system_prompt: Optional[str] = None


# ============== Meeting Room Models ==============

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
