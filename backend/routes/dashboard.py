"""
Dashboard activity API - provides activity graph data, recent activity feed, and SSE stream.
"""
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from config import db, logger
import asyncio
import json

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


async def _fetch_activity_data():
    """Shared function to fetch dashboard activity data."""
    now = datetime.now(timezone.utc)

    # Build daily activity counts
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

    recent_messages = await db["chat_messages"].find(
        {}, {"_id": 0, "sender_name": 1, "content": 1, "timestamp": 1}
    ).sort("timestamp", -1).limit(5).to_list(5)
    for msg in recent_messages:
        activities.append({
            "type": "message",
            "title": f"{msg.get('sender_name', 'Someone')} sent a message",
            "description": (msg.get("content", "")[:60] + "...") if len(msg.get("content", "")) > 60 else msg.get("content", ""),
            "timestamp": msg.get("timestamp", ""),
            "icon": "message",
        })

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

    return {"graph": days, "activities": activities}


async def _fetch_stats(user_id: str):
    """Fetch live dashboard stats."""
    token_header = None
    try:
        res = await db["workspaces"].find(
            {"status": {"$ne": "deleted"}}, {"_id": 0, "id": 1, "name": 1, "scope": 1}
        ).to_list(100)
        # Find workspaces the user is a member of
        memberships = await db["workspace_members"].find(
            {"user_id": user_id}, {"_id": 0, "workspace_id": 1}
        ).to_list(100)
        member_ws_ids = {m["workspace_id"] for m in memberships}
        user_workspaces = [w for w in res if w.get("id") in member_ws_ids]

        total_members = 0
        for ws in user_workspaces:
            mc = await db["workspace_members"].count_documents({"workspace_id": ws["id"]})
            total_members += mc

        pending_approvals = await db["approvals"].count_documents({"status": "pending"})
        announcements = await db["workspace_announcements"].count_documents({})

        return {
            "workspaceCount": len(user_workspaces),
            "memberCount": total_members,
            "pendingApprovals": pending_approvals,
            "announcements": announcements,
        }
    except Exception as e:
        logger.error(f"Dashboard stats fetch error: {e}")
        return {"workspaceCount": 0, "memberCount": 0, "pendingApprovals": 0, "announcements": 0}


@router.get("/activity")
async def get_dashboard_activity(user_id: str = Query(...)):
    """Get activity graph data (last 7 days) and recent activity feed."""
    return await _fetch_activity_data()


@router.get("/activity/stream")
async def dashboard_activity_stream(user_id: str = Query(...)):
    """SSE endpoint for real-time dashboard updates. Pushes new data every 20 seconds."""

    async def event_generator():
        last_hash = None
        last_stats_hash = None

        # Send initial full payload
        try:
            data = await _fetch_activity_data()
            stats = await _fetch_stats(user_id)
            payload = json.dumps({"graph": data["graph"], "activities": data["activities"], "stats": stats}, default=str)
            last_hash = hash(payload)
            last_stats_hash = hash(json.dumps(stats, default=str))
            yield f"event: init\ndata: {payload}\n\n"
        except Exception as e:
            logger.error(f"Dashboard SSE init error: {e}")
            yield f"event: error\ndata: {json.dumps({'error': str(e)})}\n\n"

        # Poll and push changes
        while True:
            try:
                await asyncio.sleep(20)

                data = await _fetch_activity_data()
                stats = await _fetch_stats(user_id)
                full_payload = json.dumps({"graph": data["graph"], "activities": data["activities"], "stats": stats}, default=str)
                new_hash = hash(full_payload)
                new_stats_hash = hash(json.dumps(stats, default=str))

                if new_hash != last_hash:
                    # Something changed — send update
                    yield f"event: update\ndata: {full_payload}\n\n"
                    last_hash = new_hash
                    last_stats_hash = new_stats_hash
                else:
                    # Heartbeat
                    yield f"event: ping\ndata: {json.dumps({'ts': datetime.now(timezone.utc).isoformat()})}\n\n"

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Dashboard SSE loop error: {e}")
                yield f"event: ping\ndata: {json.dumps({'ts': datetime.now(timezone.utc).isoformat()})}\n\n"
                await asyncio.sleep(20)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
