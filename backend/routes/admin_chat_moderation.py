"""
Admin Chat Moderation Routes
Provides admin oversight and moderation capabilities for workspace chats
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from config import db, logger
import uuid

router = APIRouter(prefix="/admin/chat-moderation", tags=["Admin Chat Moderation"])


# ============== Models ==============

class MessageAction(BaseModel):
    action: str  # flag, unflag, delete, restore
    reason: Optional[str] = None


class BulkMessageAction(BaseModel):
    message_ids: List[str]
    action: str
    reason: Optional[str] = None


# ============== Helper Functions ==============

async def log_moderation_action(action: str, message_id: str, admin_id: str, details: Dict = None):
    """Log moderation actions for audit trail"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "action": action,
        "message_id": message_id,
        "admin_id": admin_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.chat_moderation_logs.insert_one(log_entry)
    return log_entry


# ============== API Routes ==============

@router.get("/stats")
async def get_moderation_stats():
    """Get chat moderation statistics"""
    try:
        # Total messages
        total_messages = await db.workspace_messages.count_documents({})
        
        # Flagged messages
        flagged_messages = await db.workspace_messages.count_documents({"is_flagged": True})
        
        # Deleted messages
        deleted_messages = await db.workspace_messages.count_documents({"is_deleted": True})
        
        # Messages today
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        messages_today = await db.workspace_messages.count_documents({
            "created_at": {"$gte": today_start.isoformat()}
        })
        
        # Messages this week
        week_start = today_start - timedelta(days=today_start.weekday())
        messages_this_week = await db.workspace_messages.count_documents({
            "created_at": {"$gte": week_start.isoformat()}
        })
        
        # Active workspaces with chat (had messages in last 7 days)
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        active_chat_workspaces = await db.workspace_messages.distinct(
            "workspace_id",
            {"created_at": {"$gte": seven_days_ago}}
        )
        
        # Moderation actions this month
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        moderation_actions = await db.chat_moderation_logs.count_documents({
            "timestamp": {"$gte": month_start.isoformat()}
        })
        
        return {
            "success": True,
            "stats": {
                "total_messages": total_messages,
                "flagged_messages": flagged_messages,
                "deleted_messages": deleted_messages,
                "messages_today": messages_today,
                "messages_this_week": messages_this_week,
                "active_chat_workspaces": len(active_chat_workspaces),
                "moderation_actions_this_month": moderation_actions
            }
        }
    except Exception as e:
        logger.error(f"Error fetching moderation stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/messages")
async def get_messages_for_moderation(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    flagged_only: bool = False,
    search: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get messages for moderation review"""
    try:
        query = {"is_deleted": {"$ne": True}}
        
        if workspace_id:
            query["workspace_id"] = workspace_id
        if user_id:
            query["sender_id"] = user_id
        if flagged_only:
            query["is_flagged"] = True
        if search:
            query["content"] = {"$regex": search, "$options": "i"}
        if date_from:
            query["created_at"] = {"$gte": date_from}
        if date_to:
            if "created_at" in query:
                query["created_at"]["$lte"] = date_to
            else:
                query["created_at"] = {"$lte": date_to}
        
        total = await db.workspace_messages.count_documents(query)
        skip = (page - 1) * limit
        
        messages = await db.workspace_messages.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with user and workspace info
        enriched_messages = []
        for msg in messages:
            # Get sender info
            sender = await db.users.find_one(
                {"id": msg.get("sender_id")},
                {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1}
            )
            
            # Get workspace info
            workspace = await db.workspaces.find_one(
                {"id": msg.get("workspace_id")},
                {"_id": 0, "id": 1, "name": 1}
            )
            
            enriched_messages.append({
                **msg,
                "sender": sender,
                "workspace": workspace
            })
        
        return {
            "success": True,
            "messages": enriched_messages,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching messages for moderation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/flagged")
async def get_flagged_messages(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Get all flagged messages requiring review"""
    try:
        query = {"is_flagged": True, "is_deleted": {"$ne": True}}
        
        total = await db.workspace_messages.count_documents(query)
        skip = (page - 1) * limit
        
        messages = await db.workspace_messages.find(
            query, {"_id": 0}
        ).sort("flagged_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich messages
        enriched_messages = []
        for msg in messages:
            sender = await db.users.find_one(
                {"id": msg.get("sender_id")},
                {"_id": 0, "id": 1, "name": 1, "email": 1}
            )
            workspace = await db.workspaces.find_one(
                {"id": msg.get("workspace_id")},
                {"_id": 0, "id": 1, "name": 1}
            )
            enriched_messages.append({
                **msg,
                "sender": sender,
                "workspace": workspace
            })
        
        return {
            "success": True,
            "messages": enriched_messages,
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching flagged messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workspace/{workspace_id}/messages")
async def get_workspace_chat_history(
    workspace_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100)
):
    """Get full chat history for a specific workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "name": 1})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        query = {"workspace_id": workspace_id}
        total = await db.workspace_messages.count_documents(query)
        skip = (page - 1) * limit
        
        messages = await db.workspace_messages.find(
            query, {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        
        # Get unique sender IDs
        sender_ids = list(set(m.get("sender_id") for m in messages))
        senders = await db.users.find(
            {"id": {"$in": sender_ids}},
            {"_id": 0, "id": 1, "name": 1, "avatar": 1}
        ).to_list(100)
        sender_lookup = {s["id"]: s for s in senders}
        
        enriched_messages = []
        for msg in messages:
            enriched_messages.append({
                **msg,
                "sender": sender_lookup.get(msg.get("sender_id"))
            })
        
        return {
            "success": True,
            "workspace": workspace,
            "messages": enriched_messages,
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/{message_id}/action")
async def moderate_message(message_id: str, action: MessageAction, admin_id: str = "admin"):
    """Perform moderation action on a message"""
    try:
        message = await db.workspace_messages.find_one({"id": message_id})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        update_data = {"moderated_at": datetime.now(timezone.utc).isoformat()}
        
        if action.action == "flag":
            update_data["is_flagged"] = True
            update_data["flagged_at"] = datetime.now(timezone.utc).isoformat()
            update_data["flag_reason"] = action.reason
            result_message = "Message flagged for review"
            
        elif action.action == "unflag":
            update_data["is_flagged"] = False
            update_data["flagged_at"] = None
            update_data["flag_reason"] = None
            result_message = "Message unflagged"
            
        elif action.action == "delete":
            update_data["is_deleted"] = True
            update_data["deleted_at"] = datetime.now(timezone.utc).isoformat()
            update_data["deleted_by"] = admin_id
            update_data["deletion_reason"] = action.reason
            result_message = "Message deleted"
            
        elif action.action == "restore":
            update_data["is_deleted"] = False
            update_data["deleted_at"] = None
            update_data["deleted_by"] = None
            update_data["deletion_reason"] = None
            result_message = "Message restored"
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action.action}")
        
        await db.workspace_messages.update_one({"id": message_id}, {"$set": update_data})
        
        # Log moderation action
        await log_moderation_action(
            action=action.action,
            message_id=message_id,
            admin_id=admin_id,
            details={
                "reason": action.reason,
                "workspace_id": message.get("workspace_id"),
                "sender_id": message.get("sender_id")
            }
        )
        
        return {"success": True, "message": result_message}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moderating message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/messages/bulk-action")
async def bulk_moderate_messages(action: BulkMessageAction, admin_id: str = "admin"):
    """Perform bulk moderation action on multiple messages"""
    try:
        if not action.message_ids:
            raise HTTPException(status_code=400, detail="No message IDs provided")
        
        update_data = {"moderated_at": datetime.now(timezone.utc).isoformat()}
        
        if action.action == "flag":
            update_data["is_flagged"] = True
            update_data["flagged_at"] = datetime.now(timezone.utc).isoformat()
            update_data["flag_reason"] = action.reason
        elif action.action == "unflag":
            update_data["is_flagged"] = False
        elif action.action == "delete":
            update_data["is_deleted"] = True
            update_data["deleted_at"] = datetime.now(timezone.utc).isoformat()
            update_data["deleted_by"] = admin_id
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action.action}")
        
        result = await db.workspace_messages.update_many(
            {"id": {"$in": action.message_ids}},
            {"$set": update_data}
        )
        
        # Log bulk action
        for msg_id in action.message_ids:
            await log_moderation_action(
                action=f"bulk_{action.action}",
                message_id=msg_id,
                admin_id=admin_id,
                details={"reason": action.reason}
            )
        
        return {
            "success": True,
            "message": f"Action '{action.action}' applied to {result.modified_count} messages"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk moderating messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/logs")
async def get_moderation_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = None
):
    """Get moderation action logs"""
    try:
        query = {}
        if action:
            query["action"] = action
        
        total = await db.chat_moderation_logs.count_documents(query)
        skip = (page - 1) * limit
        
        logs = await db.chat_moderation_logs.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)
        
        return {
            "success": True,
            "logs": logs,
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching moderation logs: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics")
async def get_chat_analytics():
    """Get chat analytics across all workspaces"""
    try:
        now = datetime.now(timezone.utc)
        
        # Messages per day for the last 30 days
        thirty_days_ago = now - timedelta(days=30)
        
        pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago.isoformat()}
                }
            },
            {
                "$group": {
                    "_id": {"$substr": ["$created_at", 0, 10]},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        daily_messages = await db.workspace_messages.aggregate(pipeline).to_list(30)
        
        # Top active workspaces
        workspace_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago.isoformat()}
                }
            },
            {
                "$group": {
                    "_id": "$workspace_id",
                    "message_count": {"$sum": 1}
                }
            },
            {"$sort": {"message_count": -1}},
            {"$limit": 10}
        ]
        
        top_workspaces = await db.workspace_messages.aggregate(workspace_pipeline).to_list(10)
        
        # Enrich with workspace names
        for ws in top_workspaces:
            workspace = await db.workspaces.find_one(
                {"id": ws["_id"]},
                {"_id": 0, "name": 1}
            )
            ws["workspace_name"] = workspace.get("name") if workspace else "Unknown"
        
        # Top active users
        user_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": thirty_days_ago.isoformat()}
                }
            },
            {
                "$group": {
                    "_id": "$sender_id",
                    "message_count": {"$sum": 1}
                }
            },
            {"$sort": {"message_count": -1}},
            {"$limit": 10}
        ]
        
        top_users = await db.workspace_messages.aggregate(user_pipeline).to_list(10)
        
        # Enrich with user names
        for user in top_users:
            user_doc = await db.users.find_one(
                {"id": user["_id"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            user["user_name"] = user_doc.get("name") if user_doc else "Unknown"
            user["user_email"] = user_doc.get("email") if user_doc else ""
        
        return {
            "success": True,
            "analytics": {
                "daily_messages": daily_messages,
                "top_workspaces": top_workspaces,
                "top_users": top_users
            }
        }
    except Exception as e:
        logger.error(f"Error fetching chat analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))
