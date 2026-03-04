"""
Internal Messaging System Routes
Email-like messaging between users on the platform
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging
import asyncio
import resend

from config import db, SENDER_EMAIL

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)


class SendMessageRequest(BaseModel):
    recipient_id: str
    subject: str
    content: str


class DraftMessageRequest(BaseModel):
    recipient_id: Optional[str] = None
    subject: Optional[str] = ""
    content: Optional[str] = ""


class ReplyMessageRequest(BaseModel):
    content: str


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
            "messages": messages,
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
            "messages": messages,
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
            "messages": messages,
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
            "messages": messages,
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
            "messages": messages,
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
            "thread": thread_messages,
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
    """Send a new message to another user"""
    try:
        # Verify recipient exists
        recipient = await db.users.find_one({"id": request.recipient_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not recipient:
            raise HTTPException(status_code=404, detail="Recipient not found")
        
        # Get sender details
        sender = await db.users.find_one({"id": sender_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not sender:
            raise HTTPException(status_code=404, detail="Sender not found")
        
        message_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        message = {
            "id": message_id,
            "thread_id": message_id,  # First message is its own thread
            "sender_id": sender_id,
            "sender_name": sender.get("name") or sender.get("email", "Unknown"),
            "recipient_id": request.recipient_id,
            "recipient_name": recipient.get("name") or recipient.get("email", "Unknown"),
            "subject": request.subject,
            "content": request.content,
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
        
        # Remove _id for response
        message.pop("_id", None)
        
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
        
        return {"success": True, "message": message}
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
                    "subject": request.subject or "",
                    "content": request.content or "",
                    "updated_at": now
                }}
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Draft not found")
            
            draft = await db.user_messages.find_one({"id": draft_id}, {"_id": 0})
            return {"success": True, "message": draft}
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
                "subject": request.subject or "",
                "content": request.content or "",
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
            
            return {"success": True, "message": draft}
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
            "subject": f"Re: {original['subject']}",
            "content": request.content,
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
        
        # Send email notification
        if recipient and recipient.get("email"):
            background_tasks.add_task(
                send_email_notification,
                recipient.get("email"),
                recipient.get("name") or "User",
                sender.get("name") if sender else "Someone",
                f"Re: {original['subject']}",
                request.content
            )
        
        return {"success": True, "message": reply}
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
