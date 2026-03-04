"""
Admin Shift Management Routes
Provides admin oversight and control over shifts across all workspaces
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone, timedelta
from config import db, logger
import uuid

router = APIRouter(prefix="/admin/shifts", tags=["Admin Shifts"])


# ============== Models ==============

class ShiftAction(BaseModel):
    action: str  # cancel, reassign, delete
    reason: Optional[str] = None
    new_assignee_id: Optional[str] = None


class BulkShiftAction(BaseModel):
    shift_ids: List[str]
    action: str
    reason: Optional[str] = None


# ============== API Routes ==============

@router.get("/stats")
async def get_shift_stats():
    """Get overall shift statistics across all workspaces"""
    try:
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        
        # Total shifts
        total_shifts = await db.shifts.count_documents({})
        
        # Shifts today
        shifts_today = await db.shifts.count_documents({"date": today})
        
        # Active shifts (clocked in)
        active_shifts = await db.shifts.count_documents({"clock_status": "clocked_in"})
        
        # Cancelled shifts
        cancelled_shifts = await db.shifts.count_documents({"status": "cancelled"})
        
        # Unassigned shifts
        unassigned_shifts = await db.shifts.count_documents({
            "$or": [
                {"assigned_to": None},
                {"assigned_to": ""}
            ]
        })
        
        # This week's shifts
        week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        week_end = (now + timedelta(days=6 - now.weekday())).strftime("%Y-%m-%d")
        shifts_this_week = await db.shifts.count_documents({
            "date": {"$gte": week_start, "$lte": week_end}
        })
        
        # Total hours scheduled this month
        month_start = now.replace(day=1).strftime("%Y-%m-%d")
        pipeline = [
            {"$match": {"date": {"$gte": month_start}}},
            {"$group": {"_id": None, "total_hours": {"$sum": {"$ifNull": ["$hours", 0]}}}}
        ]
        hours_result = await db.shifts.aggregate(pipeline).to_list(1)
        total_hours_this_month = hours_result[0]["total_hours"] if hours_result else 0
        
        # Timesheet entries (clock-ins)
        total_clock_ins = await db.timesheet_entries.count_documents({})
        
        return {
            "success": True,
            "stats": {
                "total_shifts": total_shifts,
                "shifts_today": shifts_today,
                "active_shifts": active_shifts,
                "cancelled_shifts": cancelled_shifts,
                "unassigned_shifts": unassigned_shifts,
                "shifts_this_week": shifts_this_week,
                "total_hours_this_month": round(total_hours_this_month, 1),
                "total_clock_ins": total_clock_ins
            }
        }
    except Exception as e:
        logger.error(f"Error fetching shift stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_all_shifts(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    unassigned_only: bool = False
):
    """Get all shifts with filters"""
    try:
        query = {}
        
        if workspace_id:
            query["workspace_id"] = workspace_id
        if user_id:
            query["assigned_to"] = user_id
        if status:
            query["status"] = status
        if date_from:
            query["date"] = {"$gte": date_from}
        if date_to:
            if "date" in query:
                query["date"]["$lte"] = date_to
            else:
                query["date"] = {"$lte": date_to}
        if unassigned_only:
            query["$or"] = [{"assigned_to": None}, {"assigned_to": ""}]
        
        total = await db.shifts.count_documents(query)
        skip = (page - 1) * limit
        
        shifts = await db.shifts.find(
            query, {"_id": 0}
        ).sort("date", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich with workspace and user info
        enriched_shifts = []
        for shift in shifts:
            workspace = await db.workspaces.find_one(
                {"id": shift.get("workspace_id")},
                {"_id": 0, "id": 1, "name": 1}
            )
            
            assignee = None
            if shift.get("assigned_to"):
                assignee = await db.users.find_one(
                    {"id": shift.get("assigned_to")},
                    {"_id": 0, "id": 1, "name": 1, "email": 1}
                )
            
            enriched_shifts.append({
                **shift,
                "workspace": workspace,
                "assignee": assignee
            })
        
        return {
            "success": True,
            "shifts": enriched_shifts,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/today")
async def get_todays_shifts():
    """Get all shifts scheduled for today across all workspaces"""
    try:
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        shifts = await db.shifts.find(
            {"date": today},
            {"_id": 0}
        ).sort("start_time", 1).to_list(1000)
        
        # Enrich shifts
        enriched_shifts = []
        for shift in shifts:
            workspace = await db.workspaces.find_one(
                {"id": shift.get("workspace_id")},
                {"_id": 0, "id": 1, "name": 1}
            )
            assignee = None
            if shift.get("assigned_to"):
                assignee = await db.users.find_one(
                    {"id": shift.get("assigned_to")},
                    {"_id": 0, "id": 1, "name": 1, "avatar": 1}
                )
            
            enriched_shifts.append({
                **shift,
                "workspace": workspace,
                "assignee": assignee
            })
        
        # Group by workspace
        by_workspace = {}
        for shift in enriched_shifts:
            ws_id = shift.get("workspace_id")
            if ws_id not in by_workspace:
                by_workspace[ws_id] = {
                    "workspace": shift.get("workspace"),
                    "shifts": []
                }
            by_workspace[ws_id]["shifts"].append(shift)
        
        return {
            "success": True,
            "date": today,
            "total_shifts": len(shifts),
            "shifts": enriched_shifts,
            "by_workspace": list(by_workspace.values())
        }
    except Exception as e:
        logger.error(f"Error fetching today's shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timesheets")
async def get_all_timesheets(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    workspace_id: Optional[str] = None,
    user_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None
):
    """Get all timesheet entries (clock-in/out records)"""
    try:
        query = {}
        
        if workspace_id:
            query["workspace_id"] = workspace_id
        if user_id:
            query["user_id"] = user_id
        if date_from:
            query["clock_in_time"] = {"$gte": date_from}
        if date_to:
            if "clock_in_time" in query:
                query["clock_in_time"]["$lte"] = date_to
            else:
                query["clock_in_time"] = {"$lte": date_to}
        
        total = await db.timesheet_entries.count_documents(query)
        skip = (page - 1) * limit
        
        entries = await db.timesheet_entries.find(
            query, {"_id": 0}
        ).sort("clock_in_time", -1).skip(skip).limit(limit).to_list(limit)
        
        # Enrich entries
        enriched_entries = []
        for entry in entries:
            user = await db.users.find_one(
                {"id": entry.get("user_id")},
                {"_id": 0, "id": 1, "name": 1, "email": 1}
            )
            workspace = await db.workspaces.find_one(
                {"id": entry.get("workspace_id")},
                {"_id": 0, "id": 1, "name": 1}
            )
            
            enriched_entries.append({
                **entry,
                "user": user,
                "workspace": workspace
            })
        
        return {
            "success": True,
            "entries": enriched_entries,
            "total": total,
            "page": page,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching timesheets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/analytics")
async def get_shift_analytics():
    """Get shift analytics across all workspaces"""
    try:
        now = datetime.now(timezone.utc)
        thirty_days_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Shifts per day for last 30 days
        pipeline = [
            {"$match": {"date": {"$gte": thirty_days_ago}}},
            {"$group": {"_id": "$date", "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        daily_shifts = await db.shifts.aggregate(pipeline).to_list(30)
        
        # Hours per workspace this month
        month_start = now.replace(day=1).strftime("%Y-%m-%d")
        workspace_hours_pipeline = [
            {"$match": {"date": {"$gte": month_start}}},
            {"$group": {
                "_id": "$workspace_id",
                "total_hours": {"$sum": {"$ifNull": ["$hours", 0]}},
                "shift_count": {"$sum": 1}
            }},
            {"$sort": {"total_hours": -1}},
            {"$limit": 10}
        ]
        workspace_hours = await db.shifts.aggregate(workspace_hours_pipeline).to_list(10)
        
        # Enrich with workspace names
        for ws in workspace_hours:
            workspace = await db.workspaces.find_one(
                {"id": ws["_id"]},
                {"_id": 0, "name": 1}
            )
            ws["workspace_name"] = workspace.get("name") if workspace else "Unknown"
        
        # Top workers by hours
        worker_hours_pipeline = [
            {"$match": {"date": {"$gte": month_start}, "assigned_to": {"$ne": None}}},
            {"$group": {
                "_id": "$assigned_to",
                "total_hours": {"$sum": {"$ifNull": ["$hours", 0]}},
                "shift_count": {"$sum": 1}
            }},
            {"$sort": {"total_hours": -1}},
            {"$limit": 10}
        ]
        top_workers = await db.shifts.aggregate(worker_hours_pipeline).to_list(10)
        
        # Enrich with user names
        for worker in top_workers:
            user = await db.users.find_one(
                {"id": worker["_id"]},
                {"_id": 0, "name": 1, "email": 1}
            )
            worker["user_name"] = user.get("name") if user else "Unknown"
        
        # Shift status breakdown
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_breakdown = await db.shifts.aggregate(status_pipeline).to_list(10)
        
        return {
            "success": True,
            "analytics": {
                "daily_shifts": daily_shifts,
                "workspace_hours": workspace_hours,
                "top_workers": top_workers,
                "status_breakdown": status_breakdown
            }
        }
    except Exception as e:
        logger.error(f"Error fetching shift analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{shift_id}/action")
async def perform_shift_action(shift_id: str, action: ShiftAction, admin_id: str = "admin"):
    """Perform administrative action on a shift"""
    try:
        shift = await db.shifts.find_one({"id": shift_id})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if action.action == "cancel":
            update_data["status"] = "cancelled"
            update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
            update_data["cancellation_reason"] = action.reason
            update_data["cancelled_by"] = admin_id
            message = "Shift cancelled"
            
        elif action.action == "reassign":
            if not action.new_assignee_id:
                raise HTTPException(status_code=400, detail="New assignee ID required")
            
            # Verify user exists
            new_assignee = await db.users.find_one({"id": action.new_assignee_id})
            if not new_assignee:
                raise HTTPException(status_code=404, detail="New assignee not found")
            
            update_data["assigned_to"] = action.new_assignee_id
            update_data["assigned_to_name"] = new_assignee.get("name")
            update_data["reassigned_by"] = admin_id
            update_data["reassignment_reason"] = action.reason
            message = f"Shift reassigned to {new_assignee.get('name')}"
            
        elif action.action == "delete":
            await db.shifts.delete_one({"id": shift_id})
            
            # Log the deletion
            await db.admin_shift_logs.insert_one({
                "id": str(uuid.uuid4()),
                "action": "delete",
                "shift_id": shift_id,
                "admin_id": admin_id,
                "details": {"reason": action.reason, "shift_data": {k: v for k, v in shift.items() if k != "_id"}},
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
            return {"success": True, "message": "Shift deleted"}
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action.action}")
        
        await db.shifts.update_one({"id": shift_id}, {"$set": update_data})
        
        # Log the action
        await db.admin_shift_logs.insert_one({
            "id": str(uuid.uuid4()),
            "action": action.action,
            "shift_id": shift_id,
            "admin_id": admin_id,
            "details": {
                "reason": action.reason,
                "new_assignee_id": action.new_assignee_id
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return {"success": True, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing shift action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bulk-action")
async def bulk_shift_action(action: BulkShiftAction, admin_id: str = "admin"):
    """Perform bulk action on multiple shifts"""
    try:
        if not action.shift_ids:
            raise HTTPException(status_code=400, detail="No shift IDs provided")
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if action.action == "cancel":
            update_data["status"] = "cancelled"
            update_data["cancelled_at"] = datetime.now(timezone.utc).isoformat()
            update_data["cancelled_by"] = admin_id
            update_data["cancellation_reason"] = action.reason
        elif action.action == "delete":
            result = await db.shifts.delete_many({"id": {"$in": action.shift_ids}})
            return {"success": True, "message": f"Deleted {result.deleted_count} shifts"}
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action.action}")
        
        result = await db.shifts.update_many(
            {"id": {"$in": action.shift_ids}},
            {"$set": update_data}
        )
        
        return {"success": True, "message": f"Action '{action.action}' applied to {result.modified_count} shifts"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error bulk action on shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/export")
async def export_shifts(
    workspace_id: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    format: str = "json"
):
    """Export shifts data"""
    try:
        query = {}
        if workspace_id:
            query["workspace_id"] = workspace_id
        if date_from:
            query["date"] = {"$gte": date_from}
        if date_to:
            if "date" in query:
                query["date"]["$lte"] = date_to
            else:
                query["date"] = {"$lte": date_to}
        
        shifts = await db.shifts.find(query, {"_id": 0}).to_list(10000)
        
        # Enrich with names
        for shift in shifts:
            if shift.get("workspace_id"):
                workspace = await db.workspaces.find_one(
                    {"id": shift["workspace_id"]},
                    {"_id": 0, "name": 1}
                )
                shift["workspace_name"] = workspace.get("name") if workspace else ""
            
            if shift.get("assigned_to"):
                user = await db.users.find_one(
                    {"id": shift["assigned_to"]},
                    {"_id": 0, "name": 1, "email": 1}
                )
                shift["assignee_name"] = user.get("name") if user else ""
                shift["assignee_email"] = user.get("email") if user else ""
        
        return {
            "success": True,
            "export": {
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "total_records": len(shifts),
                "filters": {
                    "workspace_id": workspace_id,
                    "date_from": date_from,
                    "date_to": date_to
                },
                "data": shifts
            }
        }
    except Exception as e:
        logger.error(f"Error exporting shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))
