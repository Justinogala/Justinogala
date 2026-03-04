"""
Internal Messaging System Routes
Email-like messaging between users on the platform
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
import uuid
import logging

from config import db

router = APIRouter(prefix="/messages", tags=["messages"])
logger = logging.getLogger(__name__)


class SendMessageRequest(BaseModel):
    recipient_id: str
    subject: str
    content: str


class ReplyMessageRequest(BaseModel):
    content: str


class MessageResponse(BaseModel):
    success: bool
    message: Optional[dict] = None
    error: Optional[str] = None


@router.get("/inbox/{user_id}")
async def get_inbox(user_id: str, limit: int = 50, skip: int = 0):
    """Get all messages received by a user (inbox)"""
    try:
        messages = await db.user_messages.find(
            {"recipient_id": user_id, "deleted_by_recipient": {"$ne": True}},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {"recipient_id": user_id, "deleted_by_recipient": {"$ne": True}}
        )
        
        unread_count = await db.user_messages.count_documents(
            {"recipient_id": user_id, "is_read": False, "deleted_by_recipient": {"$ne": True}}
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
            {"sender_id": user_id, "deleted_by_sender": {"$ne": True}},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        total = await db.user_messages.count_documents(
            {"sender_id": user_id, "deleted_by_sender": {"$ne": True}}
        )
        
        # Get recipient details
        recipient_ids = list(set(msg["recipient_id"] for msg in messages))
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
            {"$or": [{"id": thread_id}, {"thread_id": thread_id}]},
            {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        
        # Get all participants
        participant_ids = set()
        for msg in thread_messages:
            participant_ids.add(msg["sender_id"])
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


@router.post("/send/{sender_id}")
async def send_message(sender_id: str, request: SendMessageRequest):
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
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.user_messages.insert_one(message)
        
        # Remove _id for response
        message.pop("_id", None)
        
        return {"success": True, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reply/{message_id}/{sender_id}")
async def reply_to_message(message_id: str, sender_id: str, request: ReplyMessageRequest):
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
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.user_messages.insert_one(reply)
        reply.pop("_id", None)
        
        return {"success": True, "message": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error replying to message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


@router.delete("/{message_id}/{user_id}")
async def delete_message(message_id: str, user_id: str):
    """Delete a message (soft delete for the user)"""
    try:
        message = await db.user_messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        update = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if message["sender_id"] == user_id:
            update["deleted_by_sender"] = True
        elif message["recipient_id"] == user_id:
            update["deleted_by_recipient"] = True
        else:
            raise HTTPException(status_code=403, detail="Not authorized to delete this message")
        
        await db.user_messages.update_one({"id": message_id}, {"$set": update})
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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


@router.get("/unread-count/{user_id}")
async def get_unread_count(user_id: str):
    """Get count of unread messages for a user"""
    try:
        count = await db.user_messages.count_documents(
            {"recipient_id": user_id, "is_read": False, "deleted_by_recipient": {"$ne": True}}
        )
        return {"success": True, "count": count}
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(status_code=500, detail=str(e))
