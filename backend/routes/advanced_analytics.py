"""
Advanced Analytics API — comprehensive analytics for admin and user dashboards.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Advanced Analytics"])


@router.get("/admin/overview")
async def admin_analytics_overview(days: int = Query(30, ge=1, le=365), user: dict = Depends(get_current_user)):
    """Admin: Comprehensive platform analytics overview."""
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role not in ["super_admin", "admin"]:
        raise HTTPException(403, "Admin access required")

    now = datetime.now(timezone.utc)
    since = (now - timedelta(days=days)).isoformat()
    prev_since = (now - timedelta(days=days * 2)).isoformat()

    # ── User Analytics ──
    total_users = await db.users.count_documents({"deleted": {"$ne": True}})
    active_users = await db.users.count_documents({"deleted": {"$ne": True}, "status": "Active"})
    new_users_period = await db.users.count_documents({"created_at": {"$gte": since}, "deleted": {"$ne": True}})
    new_users_prev = await db.users.count_documents({
        "created_at": {"$gte": prev_since, "$lt": since}, "deleted": {"$ne": True}
    })
    suspended_users = await db.users.count_documents({"status": "Suspended", "deleted": {"$ne": True}})

    # Signups over time (daily)
    signups_daily = []
    for i in range(min(days, 30) - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.users.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()},
            "deleted": {"$ne": True}
        })
        signups_daily.append({"date": day_start.strftime("%b %d"), "count": count})

    # ── Meeting Analytics ──
    total_meetings = await db.calendar_events.count_documents({})
    meetings_period = await db.calendar_events.count_documents({"created_at": {"$gte": since}})
    total_transcripts = await db.meeting_transcripts.count_documents({"status": "completed"})

    # Meetings by day
    meetings_daily = []
    for i in range(min(days, 30) - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.calendar_events.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        meetings_daily.append({"date": day_start.strftime("%b %d"), "count": count})

    # Peak meeting hours
    from collections import defaultdict
    peak_hours = defaultdict(int)
    meeting_docs = await db.calendar_events.find(
        {"start_time": {"$exists": True}}, {"_id": 0, "start_time": 1}
    ).limit(5000).to_list(5000)
    for m in meeting_docs:
        try:
            st = datetime.fromisoformat(str(m["start_time"]).replace("Z", "+00:00"))
            peak_hours[st.hour] += 1
        except Exception:
            pass
    peak_hours_list = [{"hour": f"{h}:00", "count": c} for h, c in sorted(peak_hours.items())]

    # ── Workspace Analytics ──
    total_workspaces = await db.workspaces.count_documents({})
    total_docs = await db.documents.count_documents({"deleted": {"$ne": True}})
    total_sheets = await db.sheets.count_documents({})
    total_presentations = await db.presentations.count_documents({"deleted": {"$ne": True}})
    docs_period = await db.documents.count_documents({"created_at": {"$gte": since}, "deleted": {"$ne": True}})
    sheets_period = await db.sheets.count_documents({"created_at": {"$gte": since}})
    pres_period = await db.presentations.count_documents({"created_at": {"$gte": since}, "deleted": {"$ne": True}})

    # ── AI Usage ──
    total_ai_chats = await db.ai_conversations.count_documents({})
    total_ai_messages = await db.ai_messages.count_documents({})
    ai_chats_period = await db.ai_conversations.count_documents({"created_at": {"$gte": since}})

    # ── AI File Generation Stats ──
    total_generated = await db.ai_generated_files.count_documents({})
    gen_period = await db.ai_generated_files.count_documents({"created_at": {"$gte": since}})
    gen_images = await db.ai_generated_files.count_documents({"type": "image"})
    gen_pdfs = await db.ai_generated_files.count_documents({"type": "pdf"})
    gen_docx = await db.ai_generated_files.count_documents({"type": "docx"})
    gen_xlsx = await db.ai_generated_files.count_documents({"type": "xlsx"})
    gen_images_period = await db.ai_generated_files.count_documents({"type": "image", "created_at": {"$gte": since}})
    gen_pdfs_period = await db.ai_generated_files.count_documents({"type": "pdf", "created_at": {"$gte": since}})
    gen_docx_period = await db.ai_generated_files.count_documents({"type": "docx", "created_at": {"$gte": since}})
    gen_xlsx_period = await db.ai_generated_files.count_documents({"type": "xlsx", "created_at": {"$gte": since}})

    # Top generators
    pipeline = [
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_generators = []
    async for doc in db.ai_generated_files.aggregate(pipeline):
        user_doc = await db.users.find_one({"id": doc["_id"]}, {"_id": 0, "name": 1, "email": 1})
        top_generators.append({
            "user": (user_doc or {}).get("name") or (user_doc or {}).get("email", "Unknown"),
            "count": doc["count"]
        })

    # Generation daily trend
    gen_daily = []
    for i in range(min(days, 30) - 1, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.ai_generated_files.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        gen_daily.append({"date": day_start.strftime("%b %d"), "count": count})

    return {
        "period_days": days,
        "users": {
            "total": total_users,
            "active": active_users,
            "suspended": suspended_users,
            "new_this_period": new_users_period,
            "new_prev_period": new_users_prev,
            "growth_pct": round(((new_users_period - new_users_prev) / max(new_users_prev, 1)) * 100, 1),
            "signups_daily": signups_daily,
        },
        "meetings": {
            "total": total_meetings,
            "this_period": meetings_period,
            "transcripts": total_transcripts,
            "daily": meetings_daily,
            "peak_hours": peak_hours_list,
        },
        "workspace": {
            "total_workspaces": total_workspaces,
            "documents": total_docs,
            "sheets": total_sheets,
            "presentations": total_presentations,
            "new_docs_period": docs_period,
            "new_sheets_period": sheets_period,
            "new_pres_period": pres_period,
        },
        "ai_usage": {
            "total_conversations": total_ai_chats,
            "total_messages": total_ai_messages,
            "conversations_this_period": ai_chats_period,
        },
        "file_generation": {
            "total": total_generated,
            "this_period": gen_period,
            "by_type": {
                "images": {"total": gen_images, "period": gen_images_period},
                "pdfs": {"total": gen_pdfs, "period": gen_pdfs_period},
                "docx": {"total": gen_docx, "period": gen_docx_period},
                "xlsx": {"total": gen_xlsx, "period": gen_xlsx_period},
            },
            "top_generators": top_generators,
            "daily": gen_daily,
        },
    }


@router.get("/user/my-stats")
async def user_my_stats(user: dict = Depends(get_current_user)):
    """User: Personal analytics and activity stats."""
    user_id = user["id"]

    # My meetings
    my_meetings = await db.calendar_events.count_documents({
        "$or": [{"user_id": user_id}, {"created_by": user_id}, {"organizer_id": user_id}]
    })
    my_transcripts = await db.meeting_transcripts.count_documents({"user_id": user_id, "status": "completed"})

    # My documents
    my_docs = await db.documents.count_documents({"user_id": user_id, "deleted": {"$ne": True}})
    my_sheets = await db.sheets.count_documents({"created_by": user_id})
    my_presentations = await db.presentations.count_documents({"user_id": user_id, "deleted": {"$ne": True}})

    # My AI usage
    my_ai_chats = await db.ai_conversations.count_documents({"user_id": user_id})

    # My activity over last 7 days
    now = datetime.now(timezone.utc)
    activity_7d = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        meetings = await db.calendar_events.count_documents({
            "$or": [{"user_id": user_id}, {"created_by": user_id}],
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        docs = await db.documents.count_documents({
            "user_id": user_id,
            "updated_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        activity_7d.append({
            "day": day_start.strftime("%a"),
            "meetings": meetings,
            "documents": docs,
        })

    return {
        "meetings": {"total": my_meetings, "transcripts": my_transcripts},
        "content": {"documents": my_docs, "sheets": my_sheets, "presentations": my_presentations},
        "ai_usage": {"conversations": my_ai_chats},
        "activity_7d": activity_7d,
    }
