"""
Admin Audit Logs Routes
View, filter, and export audit trail
"""
from fastapi import APIRouter, Query
from datetime import datetime, timezone, timedelta
from config import db, logger
from typing import Optional

router = APIRouter(prefix="/admin/audit-logs", tags=["Admin Audit Logs"])


@router.get("")
async def get_audit_logs(
    category: Optional[str] = None,
    severity: Optional[str] = None,
    actor_email: Optional[str] = None,
    action: Optional[str] = None,
    search: Optional[str] = None,
    days: int = Query(default=30, ge=1, le=365),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=50, ge=10, le=200),
):
    """Get paginated, filtered audit logs"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    query = {"timestamp": {"$gte": cutoff}}

    if category:
        query["category"] = category
    if severity:
        query["severity"] = severity
    if actor_email:
        query["actor_email"] = {"$regex": actor_email, "$options": "i"}
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    if search:
        query["$or"] = [
            {"action": {"$regex": search, "$options": "i"}},
            {"actor_email": {"$regex": search, "$options": "i"}},
            {"target_email": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}},
        ]

    total = await db.audit_logs.count_documents(query)
    skip = (page - 1) * limit

    logs = await db.audit_logs.find(
        query, {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)

    return {
        "logs": logs,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, (total + limit - 1) // limit),
    }


@router.get("/stats")
async def get_audit_stats(days: int = Query(default=7, ge=1, le=90)):
    """Get summary stats for audit logs"""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    query = {"timestamp": {"$gte": cutoff}}

    total = await db.audit_logs.count_documents(query)

    # Count by category
    categories = {}
    for cat in ["auth", "2fa", "permission", "user_mgmt", "workspace", "data", "system"]:
        categories[cat] = await db.audit_logs.count_documents({**query, "category": cat})

    # Count by severity
    severities = {}
    for sev in ["info", "warning", "critical"]:
        severities[sev] = await db.audit_logs.count_documents({**query, "severity": sev})

    # Recent critical events
    critical = await db.audit_logs.find(
        {**query, "severity": "critical"}, {"_id": 0}
    ).sort("timestamp", -1).limit(5).to_list(5)

    # Failed logins
    failed_logins = await db.audit_logs.count_documents({
        **query, "action": "login_failed"
    })

    return {
        "total_events": total,
        "by_category": categories,
        "by_severity": severities,
        "failed_logins": failed_logins,
        "recent_critical": critical,
        "period_days": days,
    }
