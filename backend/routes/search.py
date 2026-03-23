"""
Global search - searches across workspaces, users, forms, chat messages, etc.
"""
from fastapi import APIRouter, Query
from config import db, logger

router = APIRouter(tags=["Search"])


@router.get("/search")
async def global_search(q: str = Query(..., min_length=1), user_id: str = Query(None), limit: int = Query(5)):
    """Search across all collections"""
    query = q.strip().lower()
    results = {
        "workspaces": [],
        "users": [],
        "forms": [],
        "messages": [],
    }

    try:
        # Search workspaces
        ws_cursor = db.workspaces.find(
            {"status": {"$ne": "deleted"}, "$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
            ]},
            {"_id": 0, "id": 1, "name": 1, "description": 1, "scope": 1, "icon": 1}
        ).limit(limit)
        results["workspaces"] = await ws_cursor.to_list(limit)

        # Search users
        users_cursor = db.users.find(
            {"$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"email": {"$regex": query, "$options": "i"}},
                {"role": {"$regex": query, "$options": "i"}},
            ]},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "role": 1, "avatar": 1}
        ).limit(limit)
        results["users"] = await users_cursor.to_list(limit)

        # Search form templates
        forms_cursor = db.form_templates.find(
            {"$or": [
                {"name": {"$regex": query, "$options": "i"}},
                {"description": {"$regex": query, "$options": "i"}},
            ]},
            {"_id": 0, "id": 1, "name": 1, "description": 1, "workspace_id": 1}
        ).limit(limit)
        results["forms"] = await forms_cursor.to_list(limit)

        # Search chat messages (only for current user)
        if user_id:
            msg_cursor = db.chat_messages.find(
                {"content": {"$regex": query, "$options": "i"}, "$or": [
                    {"sender_id": user_id},
                    {"receiver_id": user_id},
                ]},
                {"_id": 0, "id": 1, "content": 1, "sender_id": 1, "receiver_id": 1, "created_at": 1}
            ).sort("created_at", -1).limit(limit)
            results["messages"] = await msg_cursor.to_list(limit)

    except Exception as e:
        logger.error(f"Search error: {e}")

    return results
