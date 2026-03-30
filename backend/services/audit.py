"""
Audit Logging Service
Centralized utility for recording admin/security events
"""
from datetime import datetime, timezone
from config import db, logger
import uuid


async def log_audit_event(
    action: str,
    category: str,
    actor_id: str = None,
    actor_email: str = None,
    target_id: str = None,
    target_email: str = None,
    severity: str = "info",
    details: dict = None,
    ip_address: str = None,
):
    """
    Record an audit event.
    
    Categories: auth, 2fa, permission, user_mgmt, workspace, data, system
    Severity: info, warning, critical
    """
    event = {
        "id": str(uuid.uuid4()),
        "action": action,
        "category": category,
        "severity": severity,
        "actor_id": actor_id,
        "actor_email": actor_email,
        "target_id": target_id,
        "target_email": target_email,
        "details": details or {},
        "ip_address": ip_address,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await db.audit_logs.insert_one(event)
    except Exception as e:
        logger.error(f"Failed to write audit log: {e}")


def get_client_ip(request) -> str:
    """Extract client IP from request"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
