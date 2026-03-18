"""
Internal Messaging System Routes
Email-like messaging between users on the platform
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
import asyncio
import resend
import base64
import io

from config import db, SENDER_EMAIL
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
from encryption import encrypt_field, decrypt_field, encrypt_dict, decrypt_dict

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)

# Sensitive fields encrypted at rest
MSG_ENCRYPT_FIELDS = ["content", "subject"]


def _decrypt_messages(messages: list[dict]) -> list[dict]:
    """Decrypt sensitive fields in a list of message dicts."""
    return [decrypt_dict(m, MSG_ENCRYPT_FIELDS) for m in messages]


def _decrypt_message(message: dict) -> dict:
    """Decrypt sensitive fields in a single message dict."""
    return decrypt_dict(message, MSG_ENCRYPT_FIELDS)

# GridFS bucket for message attachments
fs_attachments = None

async def get_attachments_bucket():
    global fs_attachments
    if fs_attachments is None:
        fs_attachments = AsyncIOMotorGridFSBucket(db, bucket_name="message_attachments")
    return fs_attachments


class SendMessageRequest(BaseModel):
    recipient_id: str
    subject: str
    content: str
    attachments: Optional[List[dict]] = None
    cc_ids: Optional[List[str]] = None
    bcc_ids: Optional[List[str]] = None


class DraftMessageRequest(BaseModel):
    recipient_id: Optional[str] = None
    subject: Optional[str] = ""
    content: Optional[str] = ""
    attachments: Optional[List[dict]] = None
    cc_ids: Optional[List[str]] = None
    bcc_ids: Optional[List[str]] = None


class ReplyMessageRequest(BaseModel):
    content: str
    attachments: Optional[List[dict]] = None


class MessageResponse(BaseModel):
    success: bool
    message: Optional[dict] = None
    error: Optional[str] = None


# ============== Email Notification Helper ==============

async def send_email_notification(recipient_email: str, recipient_name: str, sender_name: str, subject: str, preview: str):
    """Send email notification for new message"""
    try:
        if not SENDER_EMAIL:
            logger.warning("SENDER_EMAIL not configured, skipping email notification")
            return
        
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0;">Munal AI</h1>
            </div>
            <div style="padding: 30px; background: #f9fafb;">
                <h2 style="color: #1f2937; margin-bottom: 20px;">New Message from {sender_name}</h2>
                <p style="color: #4b5563; font-size: 16px;">Hi {recipient_name},</p>
                <p style="color: #4b5563; font-size: 16px;">You have received a new message:</p>
                <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <p style="color: #1f2937; font-weight: bold; margin: 0 0 10px 0;">Subject: {subject}</p>
                    <p style="color: #6b7280; margin: 0;">{preview[:200]}...</p>
                </div>
                <a href="https://munal.ai/messages" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">View Message</a>
            </div>
            <div style="padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>© 2026 Munal AI. All rights reserved.</p>
            </div>
        </div>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": [recipient_email],
            "subject": f"New message from {sender_name}: {subject}",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email notification sent to {recipient_email}")
    except Exception as e:
        logger.error(f"Failed to send email notification: {e}")


# ============== Inbox / Sent / Folders ==============

@router.get("/inbox/{user_id}")
async def get_inbox(user_id: str, limit: int = 50, skip: int = 0):
    """Get all messages received by a user (inbox) - excludes junk and trash"""
    try:
        messages = await db.user_messages.find(
            {
                "recipient_id": user_id, 
                "is_draft": {"$ne": True},
                "is_junk": {"$ne": True},
                "in_trash": {"$ne": True},
                "deleted_by_recipient": {"$ne": True}
            },
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {
                "recipient_id": user_id, 
                "is_draft": {"$ne": True},
                "is_junk": {"$ne": True},
                "in_trash": {"$ne": True},
                "deleted_by_recipient": {"$ne": True}
            }
        )
        
        unread_count = await db.user_messages.count_documents(
            {
                "recipient_id": user_id, 
                "is_read": False, 
                "is_draft": {"$ne": True},
                "is_junk": {"$ne": True},
                "in_trash": {"$ne": True},
                "deleted_by_recipient": {"$ne": True}
            }
        )
        
        # Get sender details
        sender_ids = list(set(msg["sender_id"] for msg in messages))
        senders = {}
        for sid in sender_ids:
            sender = await db.users.find_one({"id": sid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if sender:
                senders[sid] = sender
        
        return {
            "success": True,
            "messages": _decrypt_messages(messages),
            "senders": senders,
            "total": total,
            "unread_count": unread_count
        }
    except Exception as e:
        logger.error(f"Error fetching inbox: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/sent/{user_id}")
async def get_sent_messages(user_id: str, limit: int = 50, skip: int = 0):
    """Get all messages sent by a user"""
    try:
        messages = await db.user_messages.find(
            {
                "sender_id": user_id, 
                "is_draft": {"$ne": True},
                "in_trash": {"$ne": True},
                "deleted_by_sender": {"$ne": True}
            },
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {
                "sender_id": user_id, 
                "is_draft": {"$ne": True},
                "in_trash": {"$ne": True},
                "deleted_by_sender": {"$ne": True}
            }
        )
        
        # Get recipient details
        recipient_ids = list(set(msg["recipient_id"] for msg in messages if msg.get("recipient_id")))
        recipients = {}
        for rid in recipient_ids:
            recipient = await db.users.find_one({"id": rid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if recipient:
                recipients[rid] = recipient
        
        return {
            "success": True,
            "messages": _decrypt_messages(messages),
            "recipients": recipients,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error fetching sent messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/drafts/{user_id}")
async def get_drafts(user_id: str, limit: int = 50, skip: int = 0):
    """Get all draft messages for a user"""
    try:
        messages = await db.user_messages.find(
            {"sender_id": user_id, "is_draft": True, "in_trash": {"$ne": True}},
            {"_id": 0}
        ).sort("updated_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {"sender_id": user_id, "is_draft": True, "in_trash": {"$ne": True}}
        )
        
        # Get recipient details for drafts that have recipients
        recipient_ids = list(set(msg["recipient_id"] for msg in messages if msg.get("recipient_id")))
        recipients = {}
        for rid in recipient_ids:
            recipient = await db.users.find_one({"id": rid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if recipient:
                recipients[rid] = recipient
        
        return {
            "success": True,
            "messages": _decrypt_messages(messages),
            "recipients": recipients,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error fetching drafts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/junk/{user_id}")
async def get_junk_messages(user_id: str, limit: int = 50, skip: int = 0):
    """Get all junk/spam messages for a user"""
    try:
        messages = await db.user_messages.find(
            {"recipient_id": user_id, "is_junk": True, "in_trash": {"$ne": True}},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {"recipient_id": user_id, "is_junk": True, "in_trash": {"$ne": True}}
        )
        
        # Get sender details
        sender_ids = list(set(msg["sender_id"] for msg in messages))
        senders = {}
        for sid in sender_ids:
            sender = await db.users.find_one({"id": sid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if sender:
                senders[sid] = sender
        
        return {
            "success": True,
            "messages": _decrypt_messages(messages),
            "senders": senders,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error fetching junk messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/trash/{user_id}")
async def get_trash_messages(user_id: str, limit: int = 50, skip: int = 0):
    """Get all messages in trash for a user"""
    try:
        messages = await db.user_messages.find(
            {
                "$or": [
                    {"recipient_id": user_id, "in_trash": True},
                    {"sender_id": user_id, "in_trash": True, "is_draft": True}
                ]
            },
            {"_id": 0}
        ).sort("deleted_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {
                "$or": [
                    {"recipient_id": user_id, "in_trash": True},
                    {"sender_id": user_id, "in_trash": True, "is_draft": True}
                ]
            }
        )
        
        # Get user details
        user_ids = set()
        for msg in messages:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        
        users = {}
        for uid in user_ids:
            if uid:
                user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
                if user:
                    users[uid] = user
        
        return {
            "success": True,
            "messages": _decrypt_messages(messages),
            "users": users,
            "total": total
        }
    except Exception as e:
        logger.error(f"Error fetching trash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Message Thread ==============

@router.get("/thread/{message_id}")
async def get_message_thread(message_id: str):
    """Get a message and all its replies (thread)"""
    try:
        # Get the original message
        message = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Get the thread (original + all replies)
        thread_id = message.get("thread_id", message_id)
        thread_messages = await db.user_messages.find(
            {"$or": [{"id": thread_id}, {"thread_id": thread_id}], "is_draft": {"$ne": True}},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        
        # Get all participants
        participant_ids = set()
        for msg in thread_messages:
            participant_ids.add(msg["sender_id"])
            if msg.get("recipient_id"):
                participant_ids.add(msg["recipient_id"])
        
        participants = {}
        for pid in participant_ids:
            user = await db.users.find_one({"id": pid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if user:
                participants[pid] = user
        
        return {
            "success": True,
            "thread": _decrypt_messages(thread_messages),
            "participants": participants
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching message thread: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Send / Reply / Draft ==============

@router.post("/send/{sender_id}")
async def send_message(sender_id: str, request: SendMessageRequest, background_tasks: BackgroundTasks):
    """Send a new message to another user, with optional CC and BCC."""
    try:
        # Sanitize inputs
        subject = sanitize_text(request.subject)
        content = sanitize_text(request.content)
        recipient_id = guard_mongo_query(request.recipient_id)

        # Verify recipient exists
        recipient = await db.users.find_one({"id": recipient_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Get sender details
        sender = await db.users.find_one({"id": sender_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")

        # Resolve CC / BCC user names
        cc_ids = request.cc_ids or []
        bcc_ids = request.bcc_ids or []
        cc_names = {}
        bcc_names = {}
        for uid in cc_ids:
            u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1})
            if u:
                cc_names[uid] = u.get("name") or u.get("email", "Unknown")
        for uid in bcc_ids:
            u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1})
            if u:
                bcc_names[uid] = u.get("name") or u.get("email", "Unknown")

        message_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        message = {
            "id": message_id,
            "thread_id": message_id,
            "sender_id": sender_id,
            "sender_name": sender.get("name") or sender.get("email", "Unknown"),
            "recipient_id": recipient_id,
            "recipient_name": recipient.get("name") or recipient.get("email", "Unknown"),
            "subject": encrypt_field(subject),
            "content": encrypt_field(content),
            "attachments": request.attachments or [],
            "cc": [{"id": uid, "name": cc_names[uid]} for uid in cc_ids if uid in cc_names],
            "bcc": [{"id": uid, "name": bcc_names[uid]} for uid in bcc_ids if uid in bcc_names],
            "is_read": False,
            "is_starred": False,
            "is_draft": False,
            "is_junk": False,
            "in_trash": False,
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.user_messages.insert_one(message)
        message.pop("_id", None)

        # Return decrypted version to sender
        response_msg = _decrypt_message(message)

        # Create copies for CC recipients
        for uid in cc_ids:
            if uid in cc_names and uid != request.recipient_id:
                cc_copy = {**message, "id": str(uuid.uuid4()), "recipient_id": uid,
                           "recipient_name": cc_names[uid], "is_cc_copy": True}
                cc_copy.pop("_id", None)
                await db.user_messages.insert_one(cc_copy)

        # Create copies for BCC recipients (bcc list stripped)
        for uid in bcc_ids:
            if uid in bcc_names and uid != request.recipient_id and uid not in cc_ids:
                bcc_copy = {**message, "id": str(uuid.uuid4()), "recipient_id": uid,
                            "recipient_name": bcc_names[uid], "is_bcc_copy": True, "bcc": []}
                bcc_copy.pop("_id", None)
                await db.user_messages.insert_one(bcc_copy)
        
        # Send email notification in background
        recipient_email = recipient.get("email")
        if recipient_email:
            background_tasks.add_task(
                send_email_notification,
                recipient_email,
                recipient.get("name") or "User",
                sender.get("name") or sender.get("email", "Someone"),
                request.subject,
                request.content
            )
        
        return {"success": True, "message": response_msg}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/draft/{sender_id}")
async def save_draft(sender_id: str, request: DraftMessageRequest, draft_id: Optional[str] = None):
    """Save a message as draft"""
    try:
        # Get sender details
        sender = await db.users.find_one({"id": sender_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Get recipient details if provided
        recipient_name = None
        if request.recipient_id:
            recipient = await db.users.find_one({"id": request.recipient_id}, {"_id": 0, "name": 1, "email": 1})
            if recipient:
                recipient_name = recipient.get("name") or recipient.get("email", "Unknown")
        
        if draft_id:
            # Update existing draft
            result = await db.user_messages.update_one(
                {"id": draft_id, "sender_id": sender_id, "is_draft": True},
                {"$set": {
                    "recipient_id": request.recipient_id,
                    "recipient_name": recipient_name,
                    "subject": encrypt_field(request.subject or ""),
                    "content": encrypt_field(request.content or ""),
                    "attachments": request.attachments or [],
                    "cc_ids": request.cc_ids or [],
                    "bcc_ids": request.bcc_ids or [],
                    "updated_at": now
                }}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Draft not found")
            
            draft = await db.user_messages.find_one({"id": draft_id}, {"_id": 0})
            return {"success": True, "message": _decrypt_message(draft)}
        else:
            # Create new draft
            message_id = str(uuid.uuid4())
            
            draft = {
                "id": message_id,
                "thread_id": message_id,
                "sender_id": sender_id,
                "sender_name": sender.get("name") or sender.get("email", "Unknown"),
                "recipient_id": request.recipient_id,
                "recipient_name": recipient_name,
                "subject": encrypt_field(request.subject or ""),
                "content": encrypt_field(request.content or ""),
                "attachments": request.attachments or [],
                "is_read": False,
                "is_starred": False,
                "is_draft": True,
                "is_junk": False,
                "in_trash": False,
                "deleted_by_sender": False,
                "deleted_by_recipient": False,
                "created_at": now,
                "updated_at": now
            }
            
            await db.user_messages.insert_one(draft)
            draft.pop("_id", None)
            
            return {"success": True, "message": _decrypt_message(draft)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/draft/{draft_id}/send/{sender_id}")
async def send_draft(draft_id: str, sender_id: str, background_tasks: BackgroundTasks):
    """Convert a draft to a sent message"""
    try:
        draft = await db.user_messages.find_one(
            {"id": draft_id, "sender_id": sender_id, "is_draft": True},
            {"_id": 0}
        )
        if not draft:
            raise HTTPException(status_code=404, detail="Draft not found")
        
        if not draft.get("recipient_id") or not draft.get("subject") or not draft.get("content"):
            raise HTTPException(status_code=400, detail="Draft must have recipient, subject, and content to send")
        
        # Get recipient for email notification
        recipient = await db.users.find_one({"id": draft["recipient_id"]}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        sender = await db.users.find_one({"id": sender_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        
        now = datetime.now(timezone.utc).isoformat()
        
        await db.user_messages.update_one(
            {"id": draft_id},
            {"$set": {"is_draft": False, "updated_at": now, "created_at": now}}
        )
        
        # Send email notification
        if recipient and recipient.get("email"):
            background_tasks.add_task(
                send_email_notification,
                recipient.get("email"),
                recipient.get("name") or "User",
                sender.get("name") if sender else "Someone",
                draft.get("subject"),
                draft.get("content")
            )
        
        updated = await db.user_messages.find_one({"id": draft_id}, {"_id": 0})
        return {"success": True, "message": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reply/{message_id}/{sender_id}")
async def reply_to_message(message_id: str, sender_id: str, request: ReplyMessageRequest, background_tasks: BackgroundTasks):
    """Reply to an existing message"""
    try:
        # Get the original message
        original = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not original:
            raise HTTPException(status_code=404, detail="Original message not found")
        
        # Determine recipient (the other party in the conversation)
        if original["sender_id"] == sender_id:
            recipient_id = original["recipient_id"]
        else:
            recipient_id = original["sender_id"]
        
        # Get user details
        sender = await db.users.find_one({"id": sender_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        recipient = await db.users.find_one({"id": recipient_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        
        # Decrypt original subject for the reply subject line
        orig_subject = decrypt_field(original.get("subject", ""))
        
        reply_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        reply = {
            "id": reply_id,
            "thread_id": original.get("thread_id", message_id),
            "parent_id": message_id,
            "sender_id": sender_id,
            "sender_name": sender.get("name") or sender.get("email", "Unknown") if sender else "Unknown",
            "recipient_id": recipient_id,
            "recipient_name": recipient.get("name") or recipient.get("email", "Unknown") if recipient else "Unknown",
            "subject": encrypt_field(f"Re: {orig_subject}"),
            "content": encrypt_field(sanitize_text(request.content)),
            "attachments": request.attachments or [],
            "is_read": False,
            "is_starred": False,
            "is_draft": False,
            "is_junk": False,
            "in_trash": False,
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.user_messages.insert_one(reply)
        reply.pop("_id", None)
        
        # Send email notification (use decrypted content)
        if recipient and recipient.get("email"):
            background_tasks.add_task(
                send_email_notification,
                recipient.get("email"),
                recipient.get("name") or "User",
                sender.get("name") if sender else "Someone",
                f"Re: {orig_subject}",
                request.content
            )
        
        return {"success": True, "message": _decrypt_message(reply)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error replying to message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Message Actions ==============

@router.put("/read/{message_id}")
async def mark_as_read(message_id: str):
    """Mark a message as read"""
    try:
        result = await db.user_messages.update_one(
            {"id": message_id},
            {"$set": {"is_read": True, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking message as read: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/star/{message_id}")
async def toggle_star(message_id: str):
    """Toggle star status on a message"""
    try:
        message = await db.user_messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        new_starred = not message.get("is_starred", False)
        await db.user_messages.update_one(
            {"id": message_id},
            {"$set": {"is_starred": new_starred, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "is_starred": new_starred}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling star: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/junk/{message_id}")
async def mark_as_junk(message_id: str):
    """Move a message to junk/spam folder"""
    try:
        message = await db.user_messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        new_junk = not message.get("is_junk", False)
        await db.user_messages.update_one(
            {"id": message_id},
            {"$set": {"is_junk": new_junk, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        return {"success": True, "is_junk": new_junk}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking as junk: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/trash/{message_id}")
async def move_to_trash(message_id: str):
    """Move a message to trash"""
    try:
        result = await db.user_messages.update_one(
            {"id": message_id},
            {"$set": {
                "in_trash": True, 
                "deleted_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving to trash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/restore/{message_id}")
async def restore_from_trash(message_id: str):
    """Restore a message from trash"""
    try:
        result = await db.user_messages.update_one(
            {"id": message_id},
            {"$set": {
                "in_trash": False, 
                "deleted_at": None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error restoring from trash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Attachment Endpoints ==============
# NOTE: These MUST be defined before /{message_id}/{user_id} catch-all routes

@router.post("/attachments/upload")
async def upload_attachment(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """Upload a file attachment for a message"""
    try:
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")
        
        attachment_id = str(uuid.uuid4())
        fs = await get_attachments_bucket()
        grid_id = await fs.upload_from_stream(
            file.filename,
            contents,
            metadata={
                "attachment_id": attachment_id,
                "user_id": user_id,
                "filename": file.filename,
                "content_type": file.content_type,
                "size": len(contents),
                "uploaded_at": datetime.now(timezone.utc).isoformat()
            }
        )
        
        attachment = {
            "id": attachment_id,
            "grid_id": str(grid_id),
            "user_id": user_id,
            "filename": file.filename,
            "content_type": file.content_type,
            "size": len(contents),
            "uploaded_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.message_attachments.insert_one(attachment)
        attachment.pop("_id", None)
        return {"success": True, "attachment": attachment}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/attachments/{attachment_id}")
async def get_attachment(attachment_id: str):
    """Download an attachment"""
    try:
        attachment = await db.message_attachments.find_one({"id": attachment_id}, {"_id": 0})
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        
        from bson import ObjectId
        fs = await get_attachments_bucket()
        grid_id = ObjectId(attachment["grid_id"])
        grid_out = await fs.open_download_stream(grid_id)
        
        async def file_stream():
            while True:
                chunk = await grid_out.read(8192)
                if not chunk:
                    break
                yield chunk
        
        return StreamingResponse(
            file_stream(),
            media_type=attachment.get("content_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="{attachment["filename"]}"',
                "Content-Length": str(attachment.get("size", 0))
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/attachments/{attachment_id}")
async def delete_attachment(attachment_id: str, user_id: str):
    """Delete an attachment"""
    try:
        attachment = await db.message_attachments.find_one({"id": attachment_id})
        if not attachment:
            raise HTTPException(status_code=404, detail="Attachment not found")
        if attachment["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Not authorized to delete this attachment")
        
        from bson import ObjectId
        fs = await get_attachments_bucket()
        await fs.delete(ObjectId(attachment["grid_id"]))
        await db.message_attachments.delete_one({"id": attachment_id})
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting attachment: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{message_id}/{user_id}")
async def delete_message(message_id: str, user_id: str):
    """Permanently delete a message"""
    try:
        message = await db.user_messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Only allow permanent delete if already in trash or is a draft
        if not message.get("in_trash") and not message.get("is_draft"):
            # Move to trash instead of permanent delete
            await db.user_messages.update_one(
                {"id": message_id},
                {"$set": {
                    "in_trash": True,
                    "deleted_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            return {"success": True, "moved_to_trash": True}
        
        # Permanent delete
        await db.user_messages.delete_one({"id": message_id})
        return {"success": True, "permanently_deleted": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/trash/empty/{user_id}")
async def empty_trash(user_id: str):
    """Permanently delete all messages in trash for a user"""
    try:
        result = await db.user_messages.delete_many({
            "$or": [
                {"recipient_id": user_id, "in_trash": True},
                {"sender_id": user_id, "in_trash": True, "is_draft": True}
            ]
        })
        
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        logger.error(f"Error emptying trash: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== User Search & Counts ==============

@router.get("/users/search")
async def search_users(q: str, current_user_id: str, limit: int = 10):
    """Search for users to send messages to"""
    try:
        # Search by name or email
        users = await db.users.find(
            {
                "id": {"$ne": current_user_id},  # Exclude current user
                "$or": [
                    {"name": {"$regex": q, "$options": "i"}},
                    {"email": {"$regex": q, "$options": "i"}}
                ]
            },
            {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1}
        ).limit(limit).to_list(limit)
        
        return {"success": True, "users": users}
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/counts/{user_id}")
async def get_message_counts(user_id: str):
    """Get counts for all message folders"""
    try:
        inbox_unread = await db.user_messages.count_documents({
            "recipient_id": user_id,
            "is_read": False,
            "is_draft": {"$ne": True},
            "is_junk": {"$ne": True},
            "in_trash": {"$ne": True},
            "deleted_by_recipient": {"$ne": True}
        })
        
        drafts = await db.user_messages.count_documents({
            "sender_id": user_id,
            "is_draft": True,
            "in_trash": {"$ne": True}
        })
        
        junk = await db.user_messages.count_documents({
            "recipient_id": user_id,
            "is_junk": True,
            "in_trash": {"$ne": True}
        })
        
        trash = await db.user_messages.count_documents({
            "$or": [
                {"recipient_id": user_id, "in_trash": True},
                {"sender_id": user_id, "in_trash": True, "is_draft": True}
            ]
        })
        
        return {
            "success": True,
            "counts": {
                "inbox_unread": inbox_unread,
                "drafts": drafts,
                "junk": junk,
                "trash": trash
            }
        }
    except Exception as e:
        logger.error(f"Error getting message counts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/unread-count/{user_id}")
async def get_unread_count(user_id: str):
    """Get count of unread messages for a user"""
    try:
        count = await db.user_messages.count_documents({
            "recipient_id": user_id, 
            "is_read": False, 
            "is_draft": {"$ne": True},
            "is_junk": {"$ne": True},
            "in_trash": {"$ne": True},
            "deleted_by_recipient": {"$ne": True}
        })
        return {"success": True, "count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))



# ============== AI Features ==============

import os
import json as json_lib

from security import limiter, sanitize_text, guard_mongo_query

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')


async def _get_user_ai_settings(user_id: str):
    """Fetch merged AI + assistant settings for a user."""
    ai = await db.message_settings.find_one({"user_id": user_id}, {"_id": 0}) or {}
    asst = await db.message_assistant_settings.find_one({"user_id": user_id}, {"_id": 0}) or {}
    return {
        "ai_enabled": ai.get("ai_personalization_enabled", True),
        "tone": ai.get("ai_tone", "professional"),
        "smart_replies": ai.get("ai_smart_replies", True),
        "auto_categorize": ai.get("ai_auto_categorize", True),
        "assistant_enabled": asst.get("enabled", True),
        "auto_draft": asst.get("auto_draft_replies", False),
        "summarize": asst.get("summarize_threads", True),
        "suggest_actions": asst.get("suggest_actions", True),
        "writing_style": asst.get("writing_style", "concise"),
    }


async def _ai_chat(system_prompt: str, user_prompt: str):
    api_key = EMERGENT_LLM_KEY or OPENAI_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    from emergentintegrations.llm.openai import LlmChat, UserMessage
    import uuid as _uuid
    llm = LlmChat(
        api_key=api_key,
        session_id=str(_uuid.uuid4()),
        system_message=system_prompt,
    )
    llm = llm.with_model("openai", "gpt-4o")
    response = await llm.send_message(UserMessage(text=user_prompt))
    return response


class AIMessageRequest(BaseModel):
    user_id: str
    message_content: str
    message_subject: Optional[str] = ""
    sender_name: Optional[str] = ""
    thread_messages: Optional[List[dict]] = []


@router.post("/ai/smart-replies")
@limiter.limit("20/minute")
async def ai_smart_replies(request: Request, req: AIMessageRequest):
    """Generate 3 short smart reply suggestions for a message."""
    cfg = await _get_user_ai_settings(req.user_id)
    if not cfg["ai_enabled"] or not cfg["smart_replies"]:
        return {"success": True, "replies": []}

    tone = cfg["tone"]
    system = (
        f"You are an AI assistant. Generate exactly 3 short reply suggestions for the message below. "
        f"Use a {tone} tone. Return ONLY a JSON array of 3 strings, nothing else. "
        f"Each reply should be 1-2 sentences max."
    )
    prompt = f"Subject: {req.message_subject}\nFrom: {req.sender_name}\n\n{req.message_content}"
    try:
        raw = await _ai_chat(system, prompt)
        replies = json_lib.loads(raw) if raw.strip().startswith("[") else [r.strip().strip('"') for r in raw.strip().split("\n") if r.strip()]
        return {"success": True, "replies": replies[:3]}
    except Exception as e:
        logger.error(f"Smart replies error: {e}")
        return {"success": False, "replies": [], "error": str(e)}


@router.post("/ai/summarize-thread")
@limiter.limit("10/minute")
async def ai_summarize_thread(request: Request, req: AIMessageRequest):
    """Summarize a conversation thread."""
    cfg = await _get_user_ai_settings(req.user_id)
    if not cfg["assistant_enabled"] or not cfg["summarize"]:
        return {"success": True, "summary": ""}

    thread_text = "\n\n".join(
        [f"{m.get('sender_name', 'User')}: {m.get('content', '')}" for m in (req.thread_messages or [])]
    )
    if not thread_text.strip():
        thread_text = f"{req.sender_name}: {req.message_content}"

    system = "You are an AI assistant. Provide a concise summary (3-5 sentences) of the conversation thread below. Focus on key points, decisions, and action items."
    try:
        summary = await _ai_chat(system, f"Subject: {req.message_subject}\n\n{thread_text}")
        return {"success": True, "summary": summary}
    except Exception as e:
        logger.error(f"Summarize thread error: {e}")
        return {"success": False, "summary": "", "error": str(e)}


@router.post("/ai/suggest-actions")
@limiter.limit("15/minute")
async def ai_suggest_actions(request: Request, req: AIMessageRequest):
    """Suggest follow-up actions based on a message."""
    cfg = await _get_user_ai_settings(req.user_id)
    if not cfg["assistant_enabled"] or not cfg["suggest_actions"]:
        return {"success": True, "actions": []}

    system = (
        "You are an AI assistant. Based on the message below, suggest 2-4 practical follow-up actions. "
        'Return ONLY a JSON array of objects: [{"action": "short label", "description": "one line detail"}]. Nothing else.'
    )
    prompt = f"Subject: {req.message_subject}\nFrom: {req.sender_name}\n\n{req.message_content}"
    try:
        raw = await _ai_chat(system, prompt)
        actions = json_lib.loads(raw) if raw.strip().startswith("[") else []
        return {"success": True, "actions": actions[:4]}
    except Exception as e:
        logger.error(f"Suggest actions error: {e}")
        return {"success": False, "actions": [], "error": str(e)}


@router.post("/ai/draft-reply")
@limiter.limit("15/minute")
async def ai_draft_reply(request: Request, req: AIMessageRequest):
    """Auto-draft a full reply to a message."""
    cfg = await _get_user_ai_settings(req.user_id)
    if not cfg["assistant_enabled"]:
        return {"success": True, "draft": ""}

    tone = cfg["tone"]
    style = cfg["writing_style"]
    style_instruction = {
        "concise": "Keep the reply short and to the point (2-3 sentences).",
        "detailed": "Write a thorough, well-structured reply with context.",
        "creative": "Write in a warm, creative, and engaging tone.",
        "match_my_style": "Write in a natural, balanced way.",
    }.get(style, "Keep it concise.")

    system = (
        f"You are an AI assistant drafting a reply to a message. "
        f"Use a {tone} tone. {style_instruction} "
        f"Write only the reply body — no subject line, no greeting name header, just the message content ready to send."
    )
    thread_context = ""
    if req.thread_messages:
        thread_context = "\n\nThread context:\n" + "\n".join(
            [f"{m.get('sender_name', 'User')}: {m.get('content', '')[:200]}" for m in req.thread_messages[-5:]]
        )

    prompt = f"Subject: {req.message_subject}\nFrom: {req.sender_name}\n\n{req.message_content}{thread_context}"
    try:
        draft = await _ai_chat(system, prompt)
        return {"success": True, "draft": draft}
    except Exception as e:
        logger.error(f"Draft reply error: {e}")
        return {"success": False, "draft": "", "error": str(e)}


@router.post("/ai/categorize")
@limiter.limit("20/minute")
async def ai_categorize_message(request: Request, req: AIMessageRequest):
    """Categorize a message using AI."""
    cfg = await _get_user_ai_settings(req.user_id)
    if not cfg["ai_enabled"] or not cfg["auto_categorize"]:
        return {"success": True, "category": ""}

    system = (
        "You are an AI that categorizes messages. Classify the message below into EXACTLY one category: "
        "work, personal, urgent, finance, scheduling, support, social, or other. "
        "Return ONLY the single category word in lowercase, nothing else."
    )
    prompt = f"Subject: {req.message_subject}\nFrom: {req.sender_name}\n\n{req.message_content[:500]}"
    try:
        raw = await _ai_chat(system, prompt)
        category = raw.strip().lower().split()[0] if raw.strip() else "other"
        valid = {"work", "personal", "urgent", "finance", "scheduling", "support", "social", "other"}
        category = category if category in valid else "other"
        return {"success": True, "category": category}
    except Exception as e:
        logger.error(f"Categorize error: {e}")
        return {"success": False, "category": "", "error": str(e)}


@router.post("/ai/compose")
@limiter.limit("15/minute")
async def ai_compose_message(request: Request, req: AIMessageRequest):
    """Generate a full message (subject + body) from a brief prompt."""
    cfg = await _get_user_ai_settings(req.user_id)
    tone = cfg["tone"]
    style = cfg["writing_style"]

    style_instruction = {
        "concise": "Keep the message short and to the point.",
        "detailed": "Write a thorough, well-structured message.",
        "creative": "Write in a warm, creative, and engaging way.",
        "match_my_style": "Write in a natural, balanced way.",
    }.get(style, "Keep it concise.")

    recipient_ctx = f" The recipient is {req.sender_name}." if req.sender_name else ""

    system = (
        f"You are an AI assistant composing an email/message. Use a {tone} tone. {style_instruction}"
        f"{recipient_ctx} Based on the user's brief prompt, generate a message."
        " Return ONLY valid JSON with exactly two keys: "
        '{"subject": "...", "body": "..."}. No markdown, no extra text.'
    )
    try:
        raw = await _ai_chat(system, req.message_content)
        # Strip markdown code fences if present
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = cleaned.split("\n", 1)[-1]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3].strip()
        result = json_lib.loads(cleaned)
        return {
            "success": True,
            "subject": result.get("subject", ""),
            "body": result.get("body", ""),
        }
    except Exception as e:
        logger.error(f"AI compose error: {e}")
        return {"success": False, "subject": "", "body": "", "error": str(e)}


# ============== Message Settings ==============

class MessageSettingsUpdate(BaseModel):
    signature: Optional[str] = None
    email_alias: Optional[str] = None
    auto_reply_enabled: Optional[bool] = None
    auto_reply_message: Optional[str] = None
    ai_personalization_enabled: Optional[bool] = None
    ai_tone: Optional[str] = None  # professional, casual, friendly
    ai_auto_categorize: Optional[bool] = None
    ai_smart_replies: Optional[bool] = None
    notifications_enabled: Optional[bool] = None
    notification_sound: Optional[bool] = None


class MessageFilterCreate(BaseModel):
    name: str
    conditions: dict  # { field: "from" | "subject" | "content", operator: "contains" | "equals", value: str }
    action: str  # "move_to_folder" | "mark_as_read" | "delete" | "star"
    action_value: Optional[str] = None  # folder name if action is move_to_folder


class ContactCreate(BaseModel):
    name: str
    email: str
    nickname: Optional[str] = None
    notes: Optional[str] = None
    group: Optional[str] = None


class AssistantSettingsUpdate(BaseModel):
    enabled: Optional[bool] = None
    auto_draft_replies: Optional[bool] = None
    summarize_threads: Optional[bool] = None
    suggest_actions: Optional[bool] = None
    writing_style: Optional[str] = None


@router.get("/settings/{user_id}")
async def get_message_settings(user_id: str):
    """Get user's message settings"""
    try:
        settings = await db.message_settings.find_one({"user_id": user_id}, {"_id": 0})
        
        if not settings:
            # Return default settings
            settings = {
                "user_id": user_id,
                "signature": "",
                "email_alias": "",
                "auto_reply_enabled": False,
                "auto_reply_message": "",
                "ai_personalization_enabled": True,
                "ai_tone": "professional",
                "ai_auto_categorize": True,
                "ai_smart_replies": True,
                "notifications_enabled": True,
                "notification_sound": True,
                "assistant_enabled": True,
                "assistant_auto_draft": False,
                "assistant_summarize": True,
                "assistant_suggest_actions": True,
                "assistant_writing_style": "match_my_style"
            }
        
        return {"success": True, "settings": settings}
    except Exception as e:
        logger.error(f"Error fetching message settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/settings/{user_id}")
async def update_message_settings(user_id: str, settings: MessageSettingsUpdate):
    """Update user's message settings"""
    try:
        update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
        update_data["user_id"] = user_id
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.message_settings.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        updated = await db.message_settings.find_one({"user_id": user_id}, {"_id": 0})
        return {"success": True, "settings": updated}
    except Exception as e:
        logger.error(f"Error updating message settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Filters ==============

@router.get("/filters/{user_id}")
async def get_message_filters(user_id: str):
    """Get user's message filters"""
    try:
        filters = await db.message_filters.find(
            {"user_id": user_id},
            {"_id": 0}
        ).sort("created_at", 1).to_list(50)
        
        return {"success": True, "filters": filters}
    except Exception as e:
        logger.error(f"Error fetching filters: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/filters/{user_id}")
async def create_message_filter(user_id: str, filter_data: MessageFilterCreate):
    """Create a new message filter"""
    try:
        filter_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        filter_doc = {
            "id": filter_id,
            "user_id": user_id,
            "name": filter_data.name,
            "conditions": filter_data.conditions,
            "action": filter_data.action,
            "action_value": filter_data.action_value,
            "enabled": True,
            "created_at": now,
            "updated_at": now
        }
        
        await db.message_filters.insert_one(filter_doc)
        filter_doc.pop("_id", None)
        
        return {"success": True, "filter": filter_doc}
    except Exception as e:
        logger.error(f"Error creating filter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/filters/{filter_id}")
async def update_message_filter(filter_id: str, filter_data: MessageFilterCreate):
    """Update a message filter"""
    try:
        update_data = {
            "name": filter_data.name,
            "conditions": filter_data.conditions,
            "action": filter_data.action,
            "action_value": filter_data.action_value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.message_filters.update_one(
            {"id": filter_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Filter not found")
        
        updated = await db.message_filters.find_one({"id": filter_id}, {"_id": 0})
        return {"success": True, "filter": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating filter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/filters/{filter_id}")
async def delete_message_filter(filter_id: str):
    """Delete a message filter"""
    try:
        result = await db.message_filters.delete_one({"id": filter_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Filter not found")
        
        return {"success": True, "message": "Filter deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting filter: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Contacts ==============

@router.get("/contacts/{user_id}")
async def get_contacts(user_id: str, group: Optional[str] = None):
    """Get user's contacts"""
    try:
        query = {"user_id": user_id}
        if group:
            query["group"] = group
        
        contacts = await db.message_contacts.find(query, {"_id": 0}).sort("name", 1).to_list(500)
        
        # Get unique groups
        groups = await db.message_contacts.distinct("group", {"user_id": user_id, "group": {"$ne": None}})
        
        return {"success": True, "contacts": contacts, "groups": groups}
    except Exception as e:
        logger.error(f"Error fetching contacts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contacts/{user_id}")
async def create_contact(user_id: str, contact: ContactCreate):
    """Create a new contact"""
    try:
        contact_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        contact_doc = {
            "id": contact_id,
            "user_id": user_id,
            "name": contact.name,
            "email": contact.email,
            "nickname": contact.nickname,
            "notes": contact.notes,
            "group": contact.group,
            "created_at": now,
            "updated_at": now
        }
        
        await db.message_contacts.insert_one(contact_doc)
        contact_doc.pop("_id", None)
        
        return {"success": True, "contact": contact_doc}
    except Exception as e:
        logger.error(f"Error creating contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/contacts/{contact_id}")
async def update_contact(contact_id: str, contact: ContactCreate):
    """Update a contact"""
    try:
        update_data = {
            "name": contact.name,
            "email": contact.email,
            "nickname": contact.nickname,
            "notes": contact.notes,
            "group": contact.group,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.message_contacts.update_one(
            {"id": contact_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        updated = await db.message_contacts.find_one({"id": contact_id}, {"_id": 0})
        return {"success": True, "contact": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str):
    """Delete a contact"""
    try:
        result = await db.message_contacts.delete_one({"id": contact_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Contact not found")
        
        return {"success": True, "message": "Contact deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting contact: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Assistant Settings ==============

@router.get("/assistant/{user_id}")
async def get_assistant_settings(user_id: str):
    """Get AI assistant settings"""
    try:
        settings = await db.message_assistant_settings.find_one({"user_id": user_id}, {"_id": 0})
        
        if not settings:
            settings = {
                "user_id": user_id,
                "enabled": True,
                "auto_draft_replies": False,
                "summarize_threads": True,
                "suggest_actions": True,
                "writing_style": "match_my_style",
                "learned_phrases": [],
                "preferred_greetings": ["Hi", "Hello", "Hey"],
                "preferred_closings": ["Best regards", "Thanks", "Cheers"]
            }
        
        return {"success": True, "settings": settings}
    except Exception as e:
        logger.error(f"Error fetching assistant settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/assistant/{user_id}")
async def update_assistant_settings(user_id: str, settings: AssistantSettingsUpdate):
    """Update AI assistant settings"""
    try:
        update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
        update_data["user_id"] = user_id
        update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.message_assistant_settings.update_one(
            {"user_id": user_id},
            {"$set": update_data},
            upsert=True
        )
        
        updated = await db.message_assistant_settings.find_one({"user_id": user_id}, {"_id": 0})
        return {"success": True, "settings": updated}
    except Exception as e:
        logger.error(f"Error updating assistant settings: {e}")
        raise HTTPException(status_code=500, detail=str(e))

