"""
Admin Monitoring Routes — real-time dashboard stats, system health, audit logs.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone, timedelta
from config import db, logger

router = APIRouter(prefix="/admin", tags=["Admin Monitoring"])


@router.get("/monitoring/dashboard")
async def get_monitoring_dashboard():
    """Comprehensive real-time monitoring data."""
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_iso = today_start.isoformat()
        recent_threshold = (now - timedelta(minutes=15)).isoformat()

        # ─── User Statistics ───
        total_users = await db.users.count_documents({"deleted": {"$ne": True}})
        active_users = await db.users.count_documents({"status": "Active", "deleted": {"$ne": True}})
        suspended_users = await db.users.count_documents({"status": "Suspended", "deleted": {"$ne": True}})
        disabled_users = total_users - active_users

        # ─── Today's Activity (from audit_logs) ───
        logins_today = await db.audit_logs.count_documents({
            "action": {"$in": ["login", "login_success"]},
            "success": True,
            "timestamp": {"$gte": today_iso}
        })

        failed_logins_today = await db.audit_logs.count_documents({
            "action": "login_failed",
            "timestamp": {"$gte": today_iso}
        })

        # New registrations today
        registrations_today = await db.audit_logs.count_documents({
            "action": "register",
            "success": True,
            "timestamp": {"$gte": today_iso}
        })

        # Meetings created today
        meetings_today = await db.calendar_events.count_documents({
            "created_at": {"$gte": today_iso}
        })
        # Fallback: try date string comparison
        if meetings_today == 0:
            meetings_today = await db.calendar_events.count_documents({
                "date": {"$gte": today_start.strftime("%Y-%m-%d")}
            })

        # ─── Real-Time Metrics ───
        # "Online" = users who logged in within the last 15 minutes
        online_users = await db.audit_logs.count_documents({
            "action": {"$in": ["login", "login_success"]},
            "success": True,
            "timestamp": {"$gte": recent_threshold}
        })

        # Active meetings (happening right now — check meetings with today's date)
        active_meetings = await db.calendar_events.count_documents({
            "date": today_start.strftime("%Y-%m-%d"),
        })

        # ─── Documents & Content Stats ───
        total_documents = await db.documents.count_documents({"deleted": {"$ne": True}})
        total_sheets = await db.sheets.count_documents({"deleted": {"$ne": True}})
        total_workspaces = await db.workspaces.count_documents({"deleted": {"$ne": True}})
        total_organizations = await db.organizations.count_documents({"deleted": {"$ne": True}})

        # AI Chat conversations today
        ai_chats_today = 0
        try:
            ai_chats_today = await db.ai_conversations.count_documents({
                "created_at": {"$gte": today_iso}
            })
        except Exception:
            pass

        # ─── Recent Audit Logs ───
        audit_cursor = db.audit_logs.find(
            {}, {"_id": 0, "action": 1, "user_email": 1, "timestamp": 1, "success": 1, "ip_address": 1}
        ).sort("timestamp", -1).limit(20)
        recent_audit_logs = await audit_cursor.to_list(20)

        # ─── Recent User Registrations ───
        recent_users_cursor = db.users.find(
            {"deleted": {"$ne": True}},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1, "status": 1}
        ).sort("created_at", -1).limit(5)
        recent_users = await recent_users_cursor.to_list(5)
        # Convert datetime objects to strings
        for u in recent_users:
            if hasattr(u.get("created_at"), "isoformat"):
                u["created_at"] = u["created_at"].isoformat()

        # ─── Breached passwords ───
        breached_count = await db.users.count_documents({
            "deleted": {"$ne": True},
            "password_breached": True
        })

        return {
            "users": {
                "total": total_users,
                "active": active_users,
                "disabled": disabled_users,
                "suspended": suspended_users,
                "breached_passwords": breached_count,
            },
            "real_time": {
                "online_users": online_users,
                "active_meetings": active_meetings,
            },
            "today": {
                "logins": logins_today,
                "failed_logins": failed_logins_today,
                "meetings": meetings_today,
                "registrations": registrations_today,
                "ai_chats": ai_chats_today,
            },
            "content": {
                "documents": total_documents,
                "sheets": total_sheets,
                "workspaces": total_workspaces,
                "organizations": total_organizations,
            },
            "recent_audit_logs": recent_audit_logs,
            "recent_users": recent_users,
        }
    except Exception as e:
        logger.error(f"Error fetching monitoring dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monitoring/system-health")
async def get_system_health():
    """Database connection status and collection count."""
    try:
        await db.command("ping")
        db_connected = True
    except Exception:
        db_connected = False

    collections_count = 0
    db_name = ""
    try:
        collections = await db.list_collection_names()
        collections_count = len(collections)
        db_name = db.name
    except Exception:
        pass

    # Memory/uptime info
    import os
    uptime_seconds = 0
    try:
        with open("/proc/uptime", "r") as f:
            uptime_seconds = int(float(f.read().split()[0]))
    except Exception:
        pass

    status = "healthy" if db_connected else "degraded"

    return {
        "status": status,
        "database": {
            "connected": db_connected,
            "collections": collections_count,
            "name": db_name,
        },
        "uptime_seconds": uptime_seconds,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }



@router.get("/dashboard/realtime")
async def get_admin_dashboard_realtime():
    """Real-time data for the main admin dashboard — called on auto-refresh."""
    try:
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        today_iso = today_start.isoformat()
        recent_15m = (now - timedelta(minutes=15)).isoformat()

        # ── Core counts ──
        total_users = await db.users.count_documents({"deleted": {"$ne": True}})
        active_users = await db.users.count_documents({"status": "Active", "deleted": {"$ne": True}})
        total_workspaces = await db.workspaces.count_documents({"deleted": {"$ne": True}})
        total_orgs = await db.organizations.count_documents({"deleted": {"$ne": True}})
        total_documents = await db.documents.count_documents({"deleted": {"$ne": True}})
        total_sheets = await db.sheets.count_documents({"deleted": {"$ne": True}})

        # ── Today's activity ──
        logins_today = await db.audit_logs.count_documents({
            "action": {"$in": ["login", "login_success"]},
            "success": True,
            "timestamp": {"$gte": today_iso}
        })
        failed_logins = await db.audit_logs.count_documents({
            "action": "login_failed",
            "timestamp": {"$gte": today_iso}
        })
        registrations_today = await db.audit_logs.count_documents({
            "action": "register", "success": True,
            "timestamp": {"$gte": today_iso}
        })

        # ── Online now (logged in within 15 min) ──
        online_now = await db.audit_logs.count_documents({
            "action": {"$in": ["login", "login_success"]},
            "success": True,
            "timestamp": {"$gte": recent_15m}
        })

        # ── User growth (last 30 days) ──
        growth = []
        for i in range(29, -1, -1):
            day = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            count = await db.users.count_documents({
                "deleted": {"$ne": True},
                "created_at": {"$lte": day.isoformat()}
            })
            # Fallback for datetime objects
            if count == 0:
                count = await db.users.count_documents({
                    "deleted": {"$ne": True},
                    "created_at": {"$lte": day}
                })
            growth.append({
                "date": day.strftime("%b %d"),
                "users": count
            })

        # ── Weekly activity chart (last 7 days) ──
        weekly = []
        for i in range(6, -1, -1):
            day_s = (now - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
            day_e = day_s + timedelta(days=1)
            logins = await db.audit_logs.count_documents({
                "action": {"$in": ["login", "login_success"]}, "success": True,
                "timestamp": {"$gte": day_s.isoformat(), "$lt": day_e.isoformat()}
            })
            signups = await db.audit_logs.count_documents({
                "action": "register", "success": True,
                "timestamp": {"$gte": day_s.isoformat(), "$lt": day_e.isoformat()}
            })
            weekly.append({
                "day": day_s.strftime("%a"),
                "logins": logins,
                "signups": signups,
            })

        # ── Recent audit ──
        audit_cursor = db.audit_logs.find(
            {}, {"_id": 0, "action": 1, "user_email": 1, "timestamp": 1, "success": 1}
        ).sort("timestamp", -1).limit(10)
        recent_audit = await audit_cursor.to_list(10)

        # ── Recent users ──
        recent_users_cursor = db.users.find(
            {"deleted": {"$ne": True}},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "created_at": 1, "status": 1, "plan": 1}
        ).sort("created_at", -1).limit(5)
        recent_users = await recent_users_cursor.to_list(5)
        for u in recent_users:
            if hasattr(u.get("created_at"), "isoformat"):
                u["created_at"] = u["created_at"].isoformat()

        # Breached passwords count
        breached_pw = await db.users.count_documents({"deleted": {"$ne": True}, "password_breached": True})

        return {
            "counts": {
                "total_users": total_users,
                "active_users": active_users,
                "workspaces": total_workspaces,
                "organizations": total_orgs,
                "documents": total_documents,
                "sheets": total_sheets,
                "breached_passwords": breached_pw,
            },
            "today": {
                "logins": logins_today,
                "failed_logins": failed_logins,
                "registrations": registrations_today,
                "online_now": online_now,
            },
            "user_growth": growth,
            "weekly_activity": weekly,
            "recent_audit": recent_audit,
            "recent_users": recent_users,
            "timestamp": now.isoformat(),
        }
    except Exception as e:
        logger.error(f"Admin dashboard realtime error: {e}")
        raise HTTPException(500, str(e))
