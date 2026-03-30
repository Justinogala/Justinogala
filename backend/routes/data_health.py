"""
Admin Data Health Dashboard Routes
Provides system health metrics, orphan detection, and cleanup utilities
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from config import db, logger

router = APIRouter(prefix="/admin/data-health", tags=["Admin Data Health"])


@router.get("/stats")
async def get_data_health_stats():
    """Get comprehensive data health statistics"""
    try:
        now = datetime.now(timezone.utc)
        thirty_days_ago = (now - timedelta(days=30)).isoformat()

        # --- Collection Counts ---
        collections = [
            "users", "workspaces", "workspace_members", "meetings",
            "ai_conversations", "ai_messages", "form_templates",
            "form_submissions", "shifts", "time_clock",
            "time_off_requests", "shift_swap_requests", "push_subscriptions",
            "manager_notifications", "support_tickets", "messages",
        ]
        collection_stats = {}
        for col_name in collections:
            try:
                count = await db[col_name].count_documents({})
                collection_stats[col_name] = count
            except Exception:
                collection_stats[col_name] = 0

        total_documents = sum(collection_stats.values())

        # --- Orphaned workspace_members ---
        all_members = await db.workspace_members.find(
            {}, {"_id": 0, "workspace_id": 1, "user_id": 1}
        ).to_list(10000)

        orphaned_members = 0
        if all_members:
            ws_ids = list({m["workspace_id"] for m in all_members if m.get("workspace_id")})
            user_ids = list({m["user_id"] for m in all_members if m.get("user_id")})

            existing_ws = set()
            if ws_ids:
                async for doc in db.workspaces.find({"id": {"$in": ws_ids}}, {"id": 1}):
                    existing_ws.add(doc["id"])

            existing_users = set()
            if user_ids:
                async for doc in db.users.find({"id": {"$in": user_ids}}, {"id": 1}):
                    existing_users.add(doc["id"])

            for m in all_members:
                ws_missing = m.get("workspace_id") and m["workspace_id"] not in existing_ws
                user_missing = m.get("user_id") and m["user_id"] not in existing_users
                if ws_missing or user_missing:
                    orphaned_members += 1

        # --- Unused Accounts ---
        total_users = collection_stats.get("users", 0)

        # Never logged in (no last_login field or null)
        never_logged_in = await db.users.count_documents({
            "$or": [
                {"last_login": {"$exists": False}},
                {"last_login": None}
            ]
        })

        # Inactive 30+ days
        inactive_users = await db.users.count_documents({
            "last_login": {"$exists": True, "$ne": None, "$lt": thirty_days_ago}
        })

        # Active in last 30 days
        active_users = await db.users.count_documents({
            "last_login": {"$exists": True, "$ne": None, "$gte": thirty_days_ago}
        })

        # --- Empty Workspaces ---
        all_workspaces = await db.workspaces.find({}, {"_id": 0, "id": 1}).to_list(5000)
        empty_workspaces = 0
        for ws in all_workspaces:
            member_count = await db.workspace_members.count_documents({"workspace_id": ws["id"]})
            if member_count == 0:
                empty_workspaces += 1

        # --- Stale Data ---
        stale_conversations = await db.ai_conversations.count_documents({
            "updated_at": {"$lt": thirty_days_ago}
        })

        pending_time_off = await db.time_off_requests.count_documents({"status": "pending"})
        pending_swaps = await db.shift_swap_requests.count_documents({"status": "pending"})

        return {
            "timestamp": now.isoformat(),
            "overview": {
                "total_documents": total_documents,
                "total_users": total_users,
                "total_workspaces": len(all_workspaces),
                "total_collections": len(collections),
            },
            "collection_stats": collection_stats,
            "orphaned_records": {
                "workspace_members": orphaned_members,
            },
            "user_health": {
                "total": total_users,
                "active_last_30d": active_users,
                "inactive_30d_plus": inactive_users,
                "never_logged_in": never_logged_in,
            },
            "workspace_health": {
                "total": len(all_workspaces),
                "empty_workspaces": empty_workspaces,
            },
            "pending_actions": {
                "pending_time_off_requests": pending_time_off,
                "pending_swap_requests": pending_swaps,
            },
            "stale_data": {
                "old_conversations_30d": stale_conversations,
            },
        }
    except Exception as e:
        logger.error(f"Error getting data health stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup/orphaned-members")
async def cleanup_orphaned_members():
    """Remove workspace_members referencing deleted workspaces or users"""
    try:
        all_members = await db.workspace_members.find(
            {}, {"_id": 0, "workspace_id": 1, "user_id": 1}
        ).to_list(10000)

        if not all_members:
            return {"deleted": 0, "details": []}

        ws_ids = list({m["workspace_id"] for m in all_members if m.get("workspace_id")})
        user_ids = list({m["user_id"] for m in all_members if m.get("user_id")})

        existing_ws = set()
        if ws_ids:
            async for doc in db.workspaces.find({"id": {"$in": ws_ids}}, {"id": 1}):
                existing_ws.add(doc["id"])

        existing_users = set()
        if user_ids:
            async for doc in db.users.find({"id": {"$in": user_ids}}, {"id": 1}):
                existing_users.add(doc["id"])

        orphaned = []
        for m in all_members:
            ws_missing = m.get("workspace_id") and m["workspace_id"] not in existing_ws
            user_missing = m.get("user_id") and m["user_id"] not in existing_users
            if ws_missing or user_missing:
                orphaned.append(m)

        deleted = 0
        for o in orphaned:
            result = await db.workspace_members.delete_one({
                "workspace_id": o["workspace_id"], "user_id": o["user_id"]
            })
            deleted += result.deleted_count

        return {"deleted": deleted, "details": orphaned[:50]}
    except Exception as e:
        logger.error(f"Cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/cleanup/stale-conversations")
async def cleanup_stale_conversations(days: int = 90):
    """Remove AI conversations older than N days with no messages"""
    try:
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        old_convos = await db.ai_conversations.find(
            {"updated_at": {"$lt": cutoff}}, {"_id": 0, "id": 1}
        ).to_list(1000)

        deleted = 0
        for convo in old_convos:
            msg_count = await db.ai_messages.count_documents({"conversation_id": convo["id"]})
            if msg_count == 0:
                await db.ai_conversations.delete_one({"id": convo["id"]})
                deleted += 1

        return {"deleted": deleted, "scanned": len(old_convos)}
    except Exception as e:
        logger.error(f"Stale cleanup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
