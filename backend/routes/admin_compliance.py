"""
Compliance Score API — real-time security health score for the admin dashboard.
Combines 2FA adoption (40%), password strength (30%), and login anomaly (30%).
Includes weekly snapshot history for trend tracking.
"""
from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
from config import db, logger

router = APIRouter(prefix="/admin", tags=["Admin Compliance"])


async def _compute_score():
    """Core score computation logic shared by live endpoint and snapshot job."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = (now - timedelta(days=30)).isoformat()

    total_users = await db.users.count_documents({})
    tfa_enabled = await db.users.count_documents({"two_factor_enabled": True})
    tfa_pct = round((tfa_enabled / total_users * 100), 1) if total_users > 0 else 0

    strong_pw = await db.users.count_documents({"password": {"$regex": r"^\$2[ab]\$"}})
    weak_pw = total_users - strong_pw
    pw_pct = round((strong_pw / total_users * 100), 1) if total_users > 0 else 0

    locked_accounts = await db.users.count_documents({"locked_until": {"$exists": True, "$ne": None}})
    high_fail_users = await db.users.count_documents({"failed_login_attempts": {"$gte": 3}})
    suspicious_events = await db.audit_logs.count_documents({
        "severity": {"$in": ["warning", "critical"]},
        "category": {"$in": ["auth", "security", "2fa"]},
        "timestamp": {"$gte": thirty_days_ago},
    })

    anomaly_count = locked_accounts + high_fail_users
    anomaly_pct = min(100, round((anomaly_count / max(total_users, 1)) * 100, 1))
    login_score_pct = max(0, 100 - anomaly_pct)

    composite = round(tfa_pct * 0.4 + pw_pct * 0.3 + login_score_pct * 0.3, 1)

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
                "score": login_score_pct, "weight": 30,
                "locked_accounts": locked_accounts,
                "high_fail_users": high_fail_users,
                "suspicious_events": suspicious_events,
            },
        },
        "computed_at": now.isoformat(),
    }


# ── Scheduled snapshot job (called by APScheduler weekly) ──

async def take_compliance_snapshot():
    """Capture and store a weekly compliance score snapshot."""
    logger.info("Taking weekly compliance score snapshot...")
    try:
        result = await _compute_score()
        snapshot = {
            "score": result["score"],
            "grade": result["grade"],
            "breakdown": result["breakdown"],
            "taken_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.compliance_snapshots.insert_one(snapshot)
        logger.info(f"Compliance snapshot saved: score={result['score']}, grade={result['grade']}")
    except Exception as e:
        logger.error(f"Compliance snapshot failed: {e}")


# ── Routes ──

@router.get("/compliance-score")
async def get_compliance_score():
    try:
        result = await _compute_score()

        # Also seed an initial snapshot if none exist yet
        count = await db.compliance_snapshots.count_documents({})
        if count == 0:
            await db.compliance_snapshots.insert_one({
                "score": result["score"],
                "grade": result["grade"],
                "breakdown": result["breakdown"],
                "taken_at": datetime.now(timezone.utc).isoformat(),
            })

        return result
    except Exception as e:
        logger.error(f"Compliance score error: {e}")
        return {"score": 0, "grade": "?", "breakdown": {}, "error": str(e)}


@router.get("/compliance-score/history")
async def get_compliance_history():
    """Return the last 12 weekly snapshots for trend charting."""
    try:
        cursor = db.compliance_snapshots.find(
            {}, {"_id": 0, "score": 1, "grade": 1, "taken_at": 1,
                 "breakdown.tfa.score": 1, "breakdown.password.score": 1, "breakdown.login.score": 1}
        ).sort("taken_at", -1).limit(12)
        snapshots = [doc async for doc in cursor]
        snapshots.reverse()  # oldest first for chart

        # Compute trend (current vs previous)
        trend = None
        if len(snapshots) >= 2:
            diff = snapshots[-1]["score"] - snapshots[-2]["score"]
            trend = {"direction": "up" if diff > 0 else ("down" if diff < 0 else "flat"), "change": round(abs(diff), 1)}

        return {"snapshots": snapshots, "trend": trend, "count": len(snapshots)}
    except Exception as e:
        logger.error(f"Compliance history error: {e}")
        return {"snapshots": [], "trend": None, "error": str(e)}


@router.post("/compliance-score/snapshot")
async def manual_snapshot():
    """Let admins manually trigger a snapshot."""
    try:
        result = await _compute_score()
        snapshot = {
            "score": result["score"],
            "grade": result["grade"],
            "breakdown": result["breakdown"],
            "taken_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.compliance_snapshots.insert_one(snapshot)
        return {"success": True, "snapshot": {k: v for k, v in snapshot.items() if k != "_id"}}
    except Exception as e:
        logger.error(f"Manual snapshot error: {e}")
        return {"success": False, "error": str(e)}
