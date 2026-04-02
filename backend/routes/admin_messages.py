"""
Admin Messages & Broadcasts Routes — internal email messages, chat monitoring, broadcasts, scheduled exports.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from pydantic import BaseModel
from config import db, logger, SENDER_EMAIL
import uuid
import asyncio
import resend

router = APIRouter(prefix="/admin", tags=["Admin Messages"])
security = HTTPBearer(auto_error=False)


async def _get_caller(credentials):
    if not credentials:
        return None
    try:
        from routes.auth import verify_jwt_token
        payload = verify_jwt_token(credentials.credentials)
        user = await db.users.find_one(
            {"id": payload["sub"]},
            {"_id": 0, "id": 1, "role": 1, "organization_id": 1, "name": 1, "email": 1},
        )
        return user
    except Exception:
        return None


# ── Models ──

class AdminReplyRequest(BaseModel):
    content: str

class ScheduledExportCreate(BaseModel):
    name: str
    frequency: str
    format: str
    status_filter: str = "all"
    email_recipients: List[str]
    enabled: bool = True

class BroadcastMessageCreate(BaseModel):
    subject: str
    content: str
    send_email: bool = True


# ── Chat Messages ──

@router.get("/chat/messages/{user_id}")
async def get_user_messages(user_id: str, limit: int = 100):
    try:
        messages = await db.chat_messages.find(
            {"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        partner_ids = set()
        for msg in messages:
            if msg["sender_id"] == user_id:
                partner_ids.add(msg["receiver_id"])
            else:
                partner_ids.add(msg["sender_id"])
        partners = {}
        for pid in partner_ids:
            p = await db.users.find_one({"id": pid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if p:
                partners[pid] = p
        return {"success": True, "messages": messages, "partners": partners, "total": len(messages)}
    except Exception as e:
        logger.error(f"Error fetching user messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat/all-messages")
async def get_all_messages(limit: int = 200, skip: int = 0):
    try:
        messages = await db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.chat_messages.count_documents({})
        user_ids = set()
        for msg in messages:
            user_ids.add(msg["sender_id"])
            user_ids.add(msg["receiver_id"])
        users = {}
        for uid in user_ids:
            u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if u:
                users[uid] = u
        return {"success": True, "messages": messages, "users": users, "total": total, "limit": limit, "skip": skip}
    except Exception as e:
        logger.error(f"Error fetching all messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Internal Email Messages ──

@router.get("/internal-messages")
async def get_all_internal_messages(limit: int = 50, skip: int = 0, status: str = "all"):
    try:
        query = {}
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "drafts":
            query["is_draft"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        if status != "drafts":
            query["is_draft"] = {"$ne": True}
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.user_messages.count_documents(query)
        user_ids = set()
        for msg in messages:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        users = {}
        for uid in user_ids:
            if uid:
                u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
                if u:
                    users[uid] = u
        counts = {
            "total": await db.user_messages.count_documents({"is_draft": {"$ne": True}}),
            "unread": await db.user_messages.count_documents({"is_read": False, "is_draft": {"$ne": True}}),
            "drafts": await db.user_messages.count_documents({"is_draft": True}),
            "junk": await db.user_messages.count_documents({"is_junk": True}),
            "trash": await db.user_messages.count_documents({"in_trash": True}),
        }
        return {"success": True, "messages": messages, "users": users, "total": total, "counts": counts, "limit": limit, "skip": skip}
    except Exception as e:
        logger.error(f"Error fetching internal messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/{message_id}")
async def get_internal_message_detail(message_id: str):
    try:
        message = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        thread_id = message.get("thread_id", message_id)
        thread = await db.user_messages.find(
            {"$or": [{"id": thread_id}, {"thread_id": thread_id}]}, {"_id": 0}
        ).sort("created_at", 1).to_list(100)
        user_ids = set()
        for msg in thread:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        users = {}
        for uid in user_ids:
            if uid:
                u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
                if u:
                    users[uid] = u
        attachments = []
        for msg in thread:
            if msg.get("attachments"):
                attachments.extend(msg.get("attachments"))
        return {"success": True, "message": message, "thread": thread, "users": users, "attachments": attachments}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching message detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/internal-messages/{message_id}")
async def admin_delete_internal_message(message_id: str, permanent: bool = False):
    try:
        if permanent:
            result = await db.user_messages.delete_one({"id": message_id})
            if result.deleted_count == 0:
                raise HTTPException(status_code=404, detail="Message not found")
            return {"success": True, "permanently_deleted": True}
        else:
            result = await db.user_messages.update_one(
                {"id": message_id},
                {"$set": {"in_trash": True, "deleted_at": datetime.now(timezone.utc).isoformat()}},
            )
            if result.matched_count == 0:
                raise HTTPException(status_code=404, detail="Message not found")
            return {"success": True, "moved_to_trash": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting message: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/internal-messages/{message_id}/reply")
async def admin_reply_to_message(message_id: str, request: AdminReplyRequest):
    try:
        original = await db.user_messages.find_one({"id": message_id}, {"_id": 0})
        if not original:
            raise HTTPException(status_code=404, detail="Message not found")
        admin = await db.users.find_one({"role": "admin"}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not admin:
            admin = {"id": "admin", "name": "Admin", "email": "admin@munal.com"}
        recipient_id = original["sender_id"]
        recipient = await db.users.find_one({"id": recipient_id}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        reply_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        reply = {
            "id": reply_id,
            "thread_id": original.get("thread_id", message_id),
            "parent_id": message_id,
            "sender_id": admin.get("id"),
            "sender_name": f"Admin ({admin.get('name', 'Support')})",
            "recipient_id": recipient_id,
            "recipient_name": recipient.get("name") if recipient else original.get("sender_name", "Unknown"),
            "subject": f"Re: {original['subject']}",
            "content": request.content,
            "is_read": False, "is_starred": False, "is_draft": False,
            "is_junk": False, "in_trash": False, "is_admin_reply": True,
            "deleted_by_sender": False, "deleted_by_recipient": False,
            "created_at": now, "updated_at": now,
        }
        await db.user_messages.insert_one(reply)
        reply.pop("_id", None)
        return {"success": True, "message": reply}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending admin reply: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/export/csv")
async def export_messages_csv(start_date: str = None, end_date: str = None, status: str = "all"):
    try:
        import csv, io
        query = {"is_draft": {"$ne": True}}
        if start_date:
            query["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = end_date
            else:
                query["created_at"] = {"$lte": end_date}
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Message ID", "Thread ID", "Sender Name", "Sender ID", "Recipient Name", "Recipient ID", "Subject", "Content", "Status", "Is Starred", "Is Junk", "In Trash", "Has Attachments", "Created At", "Updated At"])
        for msg in messages:
            s = "Trash" if msg.get("in_trash") else ("Junk" if msg.get("is_junk") else ("Read" if msg.get("is_read") else "Unread"))
            writer.writerow([msg.get("id",""), msg.get("thread_id",""), msg.get("sender_name",""), msg.get("sender_id",""), msg.get("recipient_name",""), msg.get("recipient_id",""), msg.get("subject",""), msg.get("content","").replace("\n"," "), s, "Yes" if msg.get("is_starred") else "No", "Yes" if msg.get("is_junk") else "No", "Yes" if msg.get("in_trash") else "No", "Yes" if msg.get("attachments") else "No", msg.get("created_at",""), msg.get("updated_at","")])
        csv_content = output.getvalue()
        output.close()
        from fastapi.responses import Response
        return Response(content=csv_content, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"})
    except Exception as e:
        logger.error(f"Error exporting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/internal-messages/export/json")
async def export_messages_json(start_date: str = None, end_date: str = None, status: str = "all"):
    try:
        import json as _json
        query = {"is_draft": {"$ne": True}}
        if start_date:
            query["created_at"] = {"$gte": start_date}
        if end_date:
            if "created_at" in query:
                query["created_at"]["$lte"] = end_date
            else:
                query["created_at"] = {"$lte": end_date}
        if status == "unread":
            query["is_read"] = False
        elif status == "read":
            query["is_read"] = True
        elif status == "junk":
            query["is_junk"] = True
        elif status == "trash":
            query["in_trash"] = True
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        user_ids = set()
        for msg in messages:
            user_ids.add(msg.get("sender_id"))
            if msg.get("recipient_id"):
                user_ids.add(msg.get("recipient_id"))
        users = {}
        for uid in user_ids:
            if uid:
                u = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1})
                if u:
                    users[uid] = u
        export_data = {"export_date": datetime.now(timezone.utc).isoformat(), "total_messages": len(messages), "filters": {"start_date": start_date, "end_date": end_date, "status": status}, "users": users, "messages": messages}
        json_content = _json.dumps(export_data, indent=2, default=str)
        from fastapi.responses import Response
        return Response(content=json_content, media_type="application/json", headers={"Content-Disposition": f"attachment; filename=messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"})
    except Exception as e:
        logger.error(f"Error exporting messages: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Scheduled Exports ──

@router.get("/scheduled-exports")
async def get_scheduled_exports(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        query = {}
        caller = await _get_caller(credentials)
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            org_id = caller.get("organization_id")
            if role in ("admin", "manager") and org_id:
                query["organization_id"] = org_id
        exports = await db.scheduled_exports.find(query, {"_id": 0}).to_list(100)
        return {"success": True, "exports": exports}
    except Exception as e:
        logger.error(f"Error fetching scheduled exports: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduled-exports")
async def create_scheduled_export(request: ScheduledExportCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        export_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        caller = await _get_caller(credentials)
        caller_org_id = None
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            if role in ("admin", "manager"):
                caller_org_id = caller.get("organization_id")
        next_run = datetime.now(timezone.utc)
        if request.frequency == "daily":
            next_run += timedelta(days=1)
        elif request.frequency == "weekly":
            next_run += timedelta(weeks=1)
        elif request.frequency == "monthly":
            next_run += timedelta(days=30)
        export_config = {
            "id": export_id, "name": request.name, "frequency": request.frequency, "format": request.format,
            "status_filter": request.status_filter, "email_recipients": request.email_recipients,
            "enabled": request.enabled, "organization_id": caller_org_id,
            "last_run": None, "next_run": next_run.isoformat(), "run_count": 0,
            "created_at": now, "updated_at": now,
        }
        await db.scheduled_exports.insert_one(export_config)
        export_config.pop("_id", None)
        return {"success": True, "export": export_config}
    except Exception as e:
        logger.error(f"Error creating scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/scheduled-exports/{export_id}")
async def update_scheduled_export(export_id: str, request: ScheduledExportCreate):
    try:
        now = datetime.now(timezone.utc).isoformat()
        result = await db.scheduled_exports.update_one(
            {"id": export_id},
            {"$set": {"name": request.name, "frequency": request.frequency, "format": request.format, "status_filter": request.status_filter, "email_recipients": request.email_recipients, "enabled": request.enabled, "updated_at": now}},
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        export = await db.scheduled_exports.find_one({"id": export_id}, {"_id": 0})
        return {"success": True, "export": export}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/scheduled-exports/{export_id}")
async def delete_scheduled_export(export_id: str):
    try:
        result = await db.scheduled_exports.delete_one({"id": export_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scheduled-exports/{export_id}/run")
async def run_scheduled_export_now(export_id: str):
    try:
        export = await db.scheduled_exports.find_one({"id": export_id}, {"_id": 0})
        if not export:
            raise HTTPException(status_code=404, detail="Scheduled export not found")
        query = {"is_draft": {"$ne": True}}
        if export["status_filter"] == "unread":
            query["is_read"] = False
        elif export["status_filter"] == "read":
            query["is_read"] = True
        messages = await db.user_messages.find(query, {"_id": 0}).sort("created_at", -1).to_list(10000)
        if export["format"] == "csv":
            import csv, io
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Message ID", "Sender", "Recipient", "Subject", "Content", "Status", "Created At"])
            for msg in messages:
                s = "Read" if msg.get("is_read") else "Unread"
                writer.writerow([msg.get("id",""), msg.get("sender_name",""), msg.get("recipient_name",""), msg.get("subject",""), msg.get("content","").replace("\n"," ")[:500], s, msg.get("created_at","")])
            export_content = output.getvalue()
            file_ext = "csv"
        else:
            import json as _json
            export_content = _json.dumps({"messages": messages, "export_date": datetime.now(timezone.utc).isoformat()}, default=str)
            file_ext = "json"
        if export["email_recipients"] and SENDER_EMAIL:
            for recipient in export["email_recipients"]:
                try:
                    params = {
                        "from": SENDER_EMAIL, "to": [recipient],
                        "subject": f"Scheduled Export: {export['name']} - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
                        "html": f"<div style='font-family:Arial;max-width:600px;margin:0 auto;'><h2>Scheduled Message Export</h2><p>Export <strong>{export['name']}</strong> generated. Total messages: {len(messages)}. Format: {export['format'].upper()}.</p></div>",
                        "attachments": [{"filename": f"messages_export_{datetime.now(timezone.utc).strftime('%Y%m%d')}.{file_ext}", "content": export_content}],
                    }
                    await asyncio.to_thread(resend.Emails.send, params)
                except Exception as email_error:
                    logger.error(f"Failed to send export email to {recipient}: {email_error}")
        now = datetime.now(timezone.utc)
        next_run = now
        if export["frequency"] == "daily":
            next_run += timedelta(days=1)
        elif export["frequency"] == "weekly":
            next_run += timedelta(weeks=1)
        elif export["frequency"] == "monthly":
            next_run += timedelta(days=30)
        await db.scheduled_exports.update_one(
            {"id": export_id},
            {"$set": {"last_run": now.isoformat(), "next_run": next_run.isoformat(), "run_count": export.get("run_count", 0) + 1}},
        )
        return {"success": True, "messages_exported": len(messages), "recipients_notified": len(export["email_recipients"])}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running scheduled export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ── Broadcasts ──

@router.get("/broadcasts")
async def get_broadcasts(limit: int = 50, skip: int = 0, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        query = {}
        caller = await _get_caller(credentials)
        if caller:
            role = (caller.get("role") or "").lower().replace(" ", "_")
            org_id = caller.get("organization_id")
            if role in ("admin", "manager") and org_id:
                query["organization_id"] = org_id
        broadcasts = await db.admin_broadcasts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        total = await db.admin_broadcasts.count_documents(query)
        return {"success": True, "broadcasts": broadcasts, "total": total}
    except Exception as e:
        logger.error(f"Error fetching broadcasts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/broadcasts")
async def create_broadcast(request: BroadcastMessageCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        broadcast_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        caller = await _get_caller(credentials)
        caller_role = ""
        caller_org_id = None
        org_name = None
        if caller:
            caller_role = (caller.get("role") or "").lower().replace(" ", "_")
            caller_org_id = caller.get("organization_id")
        user_query = {"status": {"$ne": "disabled"}, "id": {"$exists": True, "$ne": None}}
        if caller_role in ("admin", "manager") and caller_org_id:
            user_query["organization_id"] = caller_org_id
            org = await db.organizations.find_one({"id": caller_org_id}, {"_id": 0, "name": 1})
            org_name = org.get("name") if org else "Organization"
        users = await db.users.find(user_query, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(10000)
        users = [u for u in users if u.get("id")]
        if not users:
            raise HTTPException(status_code=400, detail="No active users found")
        admin_info = caller or {"id": "admin", "name": "Admin", "email": "admin@munal.com"}
        messages_created = 0
        emails_sent = 0
        for user in users:
            if not user.get("id"):
                continue
            message_id = str(uuid.uuid4())
            message = {
                "id": message_id, "thread_id": message_id, "broadcast_id": broadcast_id,
                "sender_id": admin_info.get("id") or "admin",
                "sender_name": admin_info.get("name") or "Munal Admin",
                "recipient_id": user["id"],
                "recipient_name": user.get("name") or user.get("email", "User"),
                "subject": request.subject, "content": request.content,
                "is_read": False, "is_starred": False, "is_draft": False,
                "is_junk": False, "in_trash": False, "is_broadcast": True,
                "deleted_by_sender": False, "deleted_by_recipient": False,
                "created_at": now, "updated_at": now,
            }
            await db.user_messages.insert_one(message)
            messages_created += 1
            if request.send_email and SENDER_EMAIL and user.get("email"):
                try:
                    params = {
                        "from": SENDER_EMAIL, "to": [user["email"]],
                        "subject": f"[Munal] {request.subject}",
                        "html": f"<div style='font-family:Arial;max-width:600px;margin:0 auto;'><div style='background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px;text-align:center;'><h1 style='color:white;margin:0;'>Munal AI</h1></div><div style='padding:30px;background:#f9fafb;'><h2 style='color:#1f2937;'>{request.subject}</h2><div style='color:#4b5563;line-height:1.6;'>{request.content.replace(chr(10),'<br>')}</div><a href='https://munal.ai/messages' style='display:inline-block;background:#667eea;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:20px;'>View in App</a></div></div>",
                    }
                    await asyncio.to_thread(resend.Emails.send, params)
                    emails_sent += 1
                except Exception as email_error:
                    logger.error(f"Failed to send broadcast email to {user['email']}: {email_error}")
        broadcast = {
            "id": broadcast_id, "subject": request.subject, "content": request.content,
            "send_email": request.send_email, "recipients_count": len(users),
            "messages_created": messages_created, "emails_sent": emails_sent,
            "organization_id": caller_org_id, "org_name": org_name,
            "created_at": now, "created_by": admin_info.get("id"),
        }
        await db.admin_broadcasts.insert_one(broadcast)
        broadcast.pop("_id", None)
        return {"success": True, "broadcast": broadcast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/broadcasts/{broadcast_id}")
async def get_broadcast_detail(broadcast_id: str):
    try:
        broadcast = await db.admin_broadcasts.find_one({"id": broadcast_id}, {"_id": 0})
        if not broadcast:
            raise HTTPException(status_code=404, detail="Broadcast not found")
        total_messages = await db.user_messages.count_documents({"broadcast_id": broadcast_id})
        read_messages = await db.user_messages.count_documents({"broadcast_id": broadcast_id, "is_read": True})
        broadcast["delivery_stats"] = {
            "total_delivered": total_messages,
            "total_read": read_messages,
            "read_rate": round((read_messages / total_messages * 100) if total_messages > 0 else 0, 1),
        }
        return {"success": True, "broadcast": broadcast}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching broadcast detail: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/broadcasts/{broadcast_id}")
async def delete_broadcast(broadcast_id: str):
    try:
        await db.user_messages.delete_many({"broadcast_id": broadcast_id})
        result = await db.admin_broadcasts.delete_one({"id": broadcast_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Broadcast not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting broadcast: {e}")
        raise HTTPException(status_code=500, detail=str(e))
