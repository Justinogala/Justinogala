"""
Time Clock Routes
Workspace-level punch in/out for daily work tracking.
Independent of scheduled shifts — any workspace member can clock in/out.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import logging

from config import db

router = APIRouter(prefix="/time-clock", tags=["time-clock"])
logger = logging.getLogger(__name__)


class ClockInRequest(BaseModel):
    workspace_id: str
    user_id: str
    notes: Optional[str] = None


class ClockOutRequest(BaseModel):
    workspace_id: str
    user_id: str
    notes: Optional[str] = None


@router.post("/clock-in")
async def clock_in(req: ClockInRequest):
    """Punch in to a workspace. Only one active session per user per workspace."""
    active = await db.time_clock.find_one({
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "clock_out": None,
    })
    if active:
        raise HTTPException(status_code=400, detail="Already clocked in")

    user = await db.users.find_one({"id": req.user_id}, {"_id": 0, "name": 1, "email": 1})

    entry_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    entry = {
        "id": entry_id,
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "user_name": user.get("name") if user else "Unknown",
        "clock_in": now,
        "clock_out": None,
        "duration_minutes": 0,
        "notes_in": req.notes,
        "notes_out": None,
        "status": "active",
        "created_at": now,
    }

    await db.time_clock.insert_one(entry)
    entry.pop("_id", None)

    return {"success": True, "entry": entry}


@router.post("/clock-out")
async def clock_out(req: ClockOutRequest):
    """Punch out of the active session for this workspace."""
    active = await db.time_clock.find_one({
        "workspace_id": req.workspace_id,
        "user_id": req.user_id,
        "clock_out": None,
    })
    if not active:
        raise HTTPException(status_code=400, detail="Not clocked in")

    now = datetime.now(timezone.utc)
    clock_in_time = datetime.fromisoformat(active["clock_in"].replace("Z", "+00:00"))
    duration = (now - clock_in_time).total_seconds() / 60

    await db.time_clock.update_one(
        {"id": active["id"]},
        {"$set": {
            "clock_out": now.isoformat(),
            "duration_minutes": round(duration, 2),
            "notes_out": req.notes,
            "status": "completed",
        }},
    )

    return {
        "success": True,
        "entry_id": active["id"],
        "duration_minutes": round(duration, 2),
        "duration_hours": round(duration / 60, 2),
    }


@router.get("/status/{workspace_id}/{user_id}")
async def get_clock_status(workspace_id: str, user_id: str):
    """Check if user is currently clocked in to this workspace."""
    active = await db.time_clock.find_one(
        {"workspace_id": workspace_id, "user_id": user_id, "clock_out": None},
        {"_id": 0},
    )
    if active:
        clock_in_time = datetime.fromisoformat(active["clock_in"].replace("Z", "+00:00"))
        elapsed = (datetime.now(timezone.utc) - clock_in_time).total_seconds()
        return {
            "clocked_in": True,
            "entry": active,
            "elapsed_seconds": round(elapsed),
        }
    return {"clocked_in": False, "entry": None, "elapsed_seconds": 0}


@router.get("/history/{workspace_id}/{user_id}")
async def get_clock_history(workspace_id: str, user_id: str, limit: int = 30):
    """Get recent time clock entries for a user in a workspace."""
    entries = await db.time_clock.find(
        {"workspace_id": workspace_id, "user_id": user_id},
        {"_id": 0},
    ).sort("created_at", -1).limit(limit).to_list(limit)

    total_minutes = sum(e.get("duration_minutes", 0) for e in entries if e.get("status") == "completed")

    return {
        "entries": entries,
        "total_minutes": round(total_minutes, 2),
        "total_hours": round(total_minutes / 60, 2),
        "count": len(entries),
    }


@router.get("/today/{workspace_id}")
async def get_today_clocks(workspace_id: str):
    """Get all clock entries for today (for the whole workspace)."""
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
    entries = await db.time_clock.find(
        {"workspace_id": workspace_id, "clock_in": {"$gte": today_start}},
        {"_id": 0},
    ).sort("clock_in", -1).to_list(200)
    return {"entries": entries, "count": len(entries)}


# ============== Time Clock Reports (Admin Generate, Manager View) ==============

@router.get("/reports/{workspace_id}")
async def get_time_clock_report(
    workspace_id: str,
    period: str = "daily",
    date: str = None,
    user_id: str = None,
):
    """
    Get time clock reports. period: daily | weekly | monthly | yearly.
    date: reference date (YYYY-MM-DD). Defaults to today.
    """
    try:
        ref = datetime.strptime(date, "%Y-%m-%d") if date else datetime.now(timezone.utc)
        ref = ref.replace(tzinfo=timezone.utc)

        if period == "daily":
            start = ref.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period == "weekly":
            start = (ref - timedelta(days=ref.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=7)
        elif period == "monthly":
            start = ref.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            next_month = start.month + 1 if start.month < 12 else 1
            next_year = start.year if start.month < 12 else start.year + 1
            end = start.replace(year=next_year, month=next_month)
        elif period == "yearly":
            start = ref.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
            end = start.replace(year=start.year + 1)
        else:
            raise HTTPException(status_code=400, detail="Invalid period. Use daily, weekly, monthly, yearly.")

        query = {
            "workspace_id": workspace_id,
            "clock_in": {"$gte": start.isoformat(), "$lt": end.isoformat()},
        }
        if user_id:
            query["user_id"] = user_id

        entries = await db.time_clock.find(query, {"_id": 0}).sort("clock_in", 1).to_list(10000)

        # Group by user
        user_summary = {}
        for e in entries:
            uid = e.get("user_id", "unknown")
            if uid not in user_summary:
                user_summary[uid] = {
                    "user_id": uid,
                    "user_name": e.get("user_name", "Unknown"),
                    "total_minutes": 0,
                    "total_entries": 0,
                    "active_entries": 0,
                    "entries": [],
                }
            user_summary[uid]["entries"].append(e)
            user_summary[uid]["total_entries"] += 1
            if e.get("status") == "completed":
                user_summary[uid]["total_minutes"] += e.get("duration_minutes", 0)
            elif e.get("status") == "active":
                user_summary[uid]["active_entries"] += 1

        for uid in user_summary:
            user_summary[uid]["total_hours"] = round(user_summary[uid]["total_minutes"] / 60, 2)

        # Group by date for chart data
        daily_totals = {}
        for e in entries:
            if e.get("status") != "completed":
                continue
            day = e["clock_in"][:10]
            daily_totals[day] = daily_totals.get(day, 0) + e.get("duration_minutes", 0)

        daily_chart = [{"date": k, "minutes": round(v, 1), "hours": round(v / 60, 2)} for k, v in sorted(daily_totals.items())]

        total_minutes = sum(u["total_minutes"] for u in user_summary.values())

        return {
            "success": True,
            "period": period,
            "start_date": start.strftime("%Y-%m-%d"),
            "end_date": (end - timedelta(days=1)).strftime("%Y-%m-%d"),
            "total_entries": len(entries),
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_minutes / 60, 2),
            "user_summary": list(user_summary.values()),
            "daily_chart": daily_chart,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating time clock report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/reports/{workspace_id}/export")
async def export_time_clock_report(
    workspace_id: str,
    period: str = "monthly",
    date: str = None,
):
    """Export time clock report as HTML/PDF. Admin only."""
    try:
        from fastapi.responses import Response

        report = await get_time_clock_report(workspace_id, period, date)
        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "name": 1})
        ws_name = ws.get("name", "Workspace") if ws else "Workspace"

        user_rows = ""
        for u in report["user_summary"]:
            user_rows += f"""<tr>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;">{u['user_name']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">{u['total_entries']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:center;">{u['active_entries']}</td>
                <td style="padding:10px 14px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">{u['total_hours']}h</td>
            </tr>"""

        entry_rows = ""
        for u in report["user_summary"]:
            for e in u["entries"]:
                ci = e.get("clock_in", "")[:16].replace("T", " ")
                co = e.get("clock_out", "")[:16].replace("T", " ") if e.get("clock_out") else "Active"
                dur = f"{e.get('duration_minutes', 0):.0f}m" if e.get("status") == "completed" else "In progress"
                entry_rows += f"""<tr>
                    <td style="padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;">{u['user_name']}</td>
                    <td style="padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;">{ci}</td>
                    <td style="padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;">{co}</td>
                    <td style="padding:8px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;">{dur}</td>
                </tr>"""

        html = f"""<!DOCTYPE html><html><head><meta charset='utf-8'>
        <title>Time Clock Report - {ws_name}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; max-width: 900px; margin: 0 auto; }}
            h1 {{ color: #6366f1; font-size: 22px; margin-bottom: 4px; }}
            h2 {{ color: #374151; font-size: 16px; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }}
            .meta {{ color: #6b7280; font-size: 13px; margin-bottom: 24px; }}
            .stat {{ display: inline-block; background: #f3f4f6; padding: 12px 20px; border-radius: 10px; margin-right: 10px; margin-bottom: 8px; }}
            .stat-val {{ font-size: 22px; font-weight: 700; color: #1f2937; }}
            .stat-lbl {{ font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; }}
            table {{ border-collapse: collapse; width: 100%; }}
            th {{ background: #6366f1; color: white; padding: 10px 14px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
            th:last-child {{ text-align: right; }}
            .footer {{ margin-top: 40px; font-size: 11px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 16px; }}
        </style></head><body>
        <h1>Time Clock Report</h1>
        <p class="meta">{ws_name} &bull; {report['period'].title()} &bull; {report['start_date']} to {report['end_date']} &bull; Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>

        <div>
            <div class="stat"><div class="stat-val">{report['total_hours']}h</div><div class="stat-lbl">Total Hours</div></div>
            <div class="stat"><div class="stat-val">{report['total_entries']}</div><div class="stat-lbl">Clock Entries</div></div>
            <div class="stat"><div class="stat-val">{len(report['user_summary'])}</div><div class="stat-lbl">Team Members</div></div>
        </div>

        <h2>Summary by Team Member</h2>
        <table><thead><tr><th>Name</th><th style="text-align:center">Entries</th><th style="text-align:center">Active</th><th style="text-align:right">Hours</th></tr></thead>
        <tbody>{user_rows}</tbody></table>

        <h2>Detailed Entries</h2>
        <table><thead><tr><th>Name</th><th>Clock In</th><th>Clock Out</th><th style="text-align:right">Duration</th></tr></thead>
        <tbody>{entry_rows}</tbody></table>

        <p class="footer">Munal AI &mdash; Time Clock Report &mdash; Confidential</p>
        </body></html>"""

        return Response(
            content=html,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=timeclock_report_{period}_{datetime.now().strftime('%Y%m%d')}.html"}
        )
    except Exception as e:
        logger.error(f"Error exporting time clock report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

