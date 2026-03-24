"""
Dashboard activity API - provides activity graph data and recent activity feed.
"""
from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
from config import db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/activity")
async def get_dashboard_activity(user_id: str = Query(...)):
    """Get activity graph data (last 7 days) and recent activity feed."""
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # Build daily activity counts from multiple collections
    days = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_label = day_start.strftime("%a")

        messages_count = await db["chat_messages"].count_documents({
            "timestamp": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        meetings_count = await db["calendar_events"].count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        approvals_count = await db["approvals"].count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        logins_count = await db["user_activity"].count_documents({
            "action": "login",
            "timestamp": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })

        days.append({
            "day": day_label,
            "messages": messages_count,
            "meetings": meetings_count,
            "approvals": approvals_count,
            "logins": logins_count,
            "total": messages_count + meetings_count + approvals_count + logins_count,
        })

    # Recent activity feed from multiple sources
    activities = []

    # Recent chat messages
    recent_messages = await db["chat_messages"].find(
        {}, {"_id": 0, "sender_name": 1, "content": 1, "timestamp": 1, "workspace_name": 1}
    ).sort("timestamp", -1).limit(5).to_list(5)
    for msg in recent_messages:
        activities.append({
            "type": "message",
            "title": f"{msg.get('sender_name', 'Someone')} sent a message",
            "description": (msg.get("content", "")[:60] + "...") if len(msg.get("content", "")) > 60 else msg.get("content", ""),
            "timestamp": msg.get("timestamp", ""),
            "icon": "message",
        })

    # Recent approvals
    recent_approvals = await db["approvals"].find(
        {}, {"_id": 0, "title": 1, "status": 1, "created_at": 1, "requester_name": 1}
    ).sort("created_at", -1).limit(5).to_list(5)
    for appr in recent_approvals:
        activities.append({
            "type": "approval",
            "title": f"Approval: {appr.get('title', 'Untitled')[:40]}",
            "description": f"Status: {appr.get('status', 'pending')} - by {appr.get('requester_name', 'Unknown')}",
            "timestamp": appr.get("created_at", ""),
            "icon": "approval",
        })

    # Recent user logins
    recent_logins = await db["user_activity"].find(
        {"action": "login"}, {"_id": 0, "user_id": 1, "action": 1, "timestamp": 1}
    ).sort("timestamp", -1).limit(5).to_list(5)
    user_ids = list(set(l.get("user_id") for l in recent_logins if l.get("user_id")))
    user_names = {}
    if user_ids:
        users = await db["users"].find(
            {"id": {"$in": user_ids}}, {"_id": 0, "id": 1, "name": 1}
        ).to_list(100)
        user_names = {u["id"]: u.get("name", "User") for u in users}
    for login in recent_logins:
        name = user_names.get(login.get("user_id"), "A user")
        activities.append({
            "type": "login",
            "title": f"{name} logged in",
            "description": "",
            "timestamp": login.get("timestamp", ""),
            "icon": "login",
        })

    # Recent eSignatures
    recent_esigns = await db["esignature_documents"].find(
        {}, {"_id": 0, "title": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).limit(3).to_list(3)
    for doc in recent_esigns:
        activities.append({
            "type": "esignature",
            "title": f"Document: {doc.get('title', 'Untitled')[:40]}",
            "description": f"Status: {doc.get('status', 'draft')}",
            "timestamp": doc.get("created_at", ""),
            "icon": "document",
        })

    # Sort all by timestamp descending, take top 10
    def parse_ts(a):
        ts = a.get("timestamp", "")
        if not ts:
            return datetime.min.replace(tzinfo=timezone.utc)
        try:
            if isinstance(ts, datetime):
                return ts if ts.tzinfo else ts.replace(tzinfo=timezone.utc)
            return datetime.fromisoformat(str(ts).replace("Z", "+00:00"))
        except Exception:
            return datetime.min.replace(tzinfo=timezone.utc)

    activities.sort(key=parse_ts, reverse=True)
    activities = activities[:10]

    return {
        "graph": days,
        "activities": activities,
    }
