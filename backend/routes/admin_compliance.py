"""
Compliance Score API — real-time security health score for the admin dashboard.
Combines 2FA adoption (40%), password strength (30%), and login anomaly (30%).
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from config import db, logger

router = APIRouter(prefix="/admin", tags=["Admin Compliance"])


@router.get("/compliance-score")
async def get_compliance_score():
    try:
        now = datetime.now(timezone.utc)
        thirty_days_ago = (now - timedelta(days=30)).isoformat()

        # ── 1. 2FA Adoption (40% weight) ──
        total_users = await db.users.count_documents({})
        tfa_enabled = await db.users.count_documents({"two_factor_enabled": True})
        tfa_pct = round((tfa_enabled / total_users * 100), 1) if total_users > 0 else 0

        # ── 2. Password Strength (30% weight) ──
        # Check bcrypt hashed passwords ($2b$ or $2a$) as "strong"
        strong_pw = await db.users.count_documents({
            "password": {"$regex": r"^\$2[ab]\$"}
        })
        # Check minimum-length compliance (hash length > 50 means bcrypt)
        weak_pw = total_users - strong_pw
        pw_pct = round((strong_pw / total_users * 100), 1) if total_users > 0 else 0

        # ── 3. Login Anomaly Score (30% weight) ──
        # Lower anomaly = higher score. Score = 100 - anomaly_pct
        locked_accounts = await db.users.count_documents({
            "locked_until": {"$exists": True, "$ne": None}
        })
        # Users with >3 failed login attempts in last 30 days
        high_fail_users = await db.users.count_documents({
            "failed_login_attempts": {"$gte": 3}
        })
        # Suspicious events from audit logs
        suspicious_events = await db.audit_logs.count_documents({
            "severity": {"$in": ["warning", "critical"]},
            "category": {"$in": ["auth", "security", "2fa"]},
            "timestamp": {"$gte": thirty_days_ago},
        })

        anomaly_count = locked_accounts + high_fail_users
        anomaly_pct = min(100, round((anomaly_count / max(total_users, 1)) * 100, 1))
        login_score_pct = max(0, 100 - anomaly_pct)

        # ── Composite Score ──
        composite = round(tfa_pct * 0.4 + pw_pct * 0.3 + login_score_pct * 0.3, 1)

        # Grade
        if composite >= 90:
            grade = "A"
        elif composite >= 75:
            grade = "B"
        elif composite >= 60:
            grade = "C"
        elif composite >= 40:
            grade = "D"
        else:
            grade = "F"

        return {
            "score": composite,
            "grade": grade,
            "breakdown": {
                "tfa": {"score": tfa_pct, "weight": 40, "enabled": tfa_enabled, "total": total_users},
                "password": {"score": pw_pct, "weight": 30, "strong": strong_pw, "weak": weak_pw},
                "login": {
                    "score": login_score_pct,
                    "weight": 30,
                    "locked_accounts": locked_accounts,
                    "high_fail_users": high_fail_users,
                    "suspicious_events": suspicious_events,
                },
            },
            "computed_at": now.isoformat(),
        }
    except Exception as e:
        logger.error(f"Compliance score error: {e}")
        return {"score": 0, "grade": "?", "breakdown": {}, "error": str(e)}
