"""
Platform analytics endpoint — public stats for the Analytics feature page.
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from config import db

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/platform-stats")
async def get_platform_stats():
    """Return aggregated platform statistics for the analytics feature page."""
    now = datetime.now(timezone.utc)
    seven_days_ago = (now - timedelta(days=7)).isoformat()

    # Core counts
    total_users = await db.users.count_documents({})
    total_meetings = await db.calendar_events.count_documents({})
    total_ai_chats = await db.ai_conversations.count_documents({})
    total_messages = await db.ai_messages.count_documents({})
    total_forms = await db.form_submissions.count_documents({})
    total_approvals = await db.approvals.count_documents({})
    total_esigns = await db.esignature_documents.count_documents({})
    total_workspaces = await db.workspaces.count_documents({})
    total_orgs = await db.organizations.count_documents({})
    total_shifts = await db.shifts.count_documents({})
    total_incidents = await db.incident_reports.count_documents({})
    total_audit_logs = await db.audit_logs.count_documents({})

    # Recent activity (last 7 days)
    recent_sessions = await db.user_sessions.count_documents(
        {"created_at": {"$gte": seven_days_ago}}
    )
    recent_messages = await db.ai_messages.count_documents(
        {"created_at": {"$gte": seven_days_ago}}
    )
    recent_approvals = await db.approvals.count_documents(
        {"created_at": {"$gte": seven_days_ago}}
    )

    # Activity by day (last 7 days) for sparkline chart
    daily_activity = []
    for i in range(6, -1, -1):
        day_start = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        count = await db.user_activity.count_documents({
            "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
        })
        # Supplement with sessions if activity is sparse
        if count == 0:
            count = await db.user_sessions.count_documents({
                "created_at": {"$gte": day_start.isoformat(), "$lt": day_end.isoformat()}
            })
        daily_activity.append({
            "day": day_start.strftime("%a"),
            "count": count
        })

    # Module usage breakdown
    modules = [
        {"name": "Meetings", "value": total_meetings},
        {"name": "AI Chat", "value": total_ai_chats},
        {"name": "Approvals", "value": total_approvals},
        {"name": "eSigns", "value": total_esigns},
        {"name": "Forms", "value": total_forms},
        {"name": "Shifts", "value": total_shifts},
        {"name": "Incidents", "value": total_incidents},
    ]

    return {
        "summary": {
            "total_users": total_users,
            "total_meetings": total_meetings,
            "total_ai_chats": total_ai_chats,
            "total_messages": total_messages,
            "total_approvals": total_approvals,
            "total_esigns": total_esigns,
            "total_forms": total_forms,
            "total_workspaces": total_workspaces,
            "total_orgs": total_orgs,
            "total_audit_logs": total_audit_logs,
        },
        "recent": {
            "sessions_7d": recent_sessions,
            "messages_7d": recent_messages,
            "approvals_7d": recent_approvals,
        },
        "daily_activity": daily_activity,
        "module_usage": modules,
    }
