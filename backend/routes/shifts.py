"""
Shift Management Routes
Workspace-specific employee scheduling and shift management
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid
import logging
import asyncio

from config import db, SENDER_EMAIL

router = APIRouter(prefix="/shifts", tags=["shifts"])
logger = logging.getLogger(__name__)

# Try to import resend for email notifications
try:
    import resend
except ImportError:
    resend = None


# ============== Models ==============

class ShiftCreate(BaseModel):
    workspace_id: str
    assigned_to: Optional[str] = None  # User ID
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    role: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None  # full-time, part-time, casual
    notes: Optional[str] = None
    is_recurring: bool = False
    recurrence_pattern: Optional[str] = None  # daily, weekly, custom
    recurrence_end_date: Optional[str] = None
    color: Optional[str] = None


class ShiftUpdate(BaseModel):
    assigned_to: Optional[str] = None
    date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    employment_type: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    color: Optional[str] = None


class ShiftSwapRequest(BaseModel):
    shift_id: str
    requester_id: str
    target_user_id: str
    reason: Optional[str] = None


class TimeOffRequest(BaseModel):
    workspace_id: str
    user_id: str
    start_date: str
    end_date: str
    reason: Optional[str] = None
    type: str = "vacation"  # vacation, sick, personal, other


class ClockAction(BaseModel):
    shift_id: str
    user_id: str
    action: str  # "in" or "out"
    location: Optional[str] = None
    notes: Optional[str] = None


class TimeOffBalanceUpdate(BaseModel):
    workspace_id: str
    user_id: str
    vacation_total: Optional[float] = None
    sick_total: Optional[float] = None
    personal_total: Optional[float] = None


# ============== Helper Functions ==============

def calculate_hours(start_time: str, end_time: str) -> float:
    """Calculate hours between two time strings"""
    try:
        start = datetime.strptime(start_time, "%H:%M")
        end = datetime.strptime(end_time, "%H:%M")
        if end < start:
            end += timedelta(days=1)
        diff = end - start
        return diff.total_seconds() / 3600
    except Exception:
        return 0


async def send_shift_notification(user_email: str, user_name: str, subject: str, message: str):
    """Send email notification for shift updates"""
    if not resend or not SENDER_EMAIL:
        return
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [user_email],
            "subject": f"[Munal Shifts] {subject}",
            "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Munal AI</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Shift Management</p>
                </div>
                <div style="padding: 30px; background: #f9fafb;">
                    <p style="color: #4b5563;">Hi {user_name},</p>
                    <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
                        {message}
                    </div>
                    <a href="https://munal.ai/workspace/shifts" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Shifts</a>
                </div>
            </div>
            """
        }
        await asyncio.to_thread(resend.Emails.send, params)
    except Exception as e:
        logger.error(f"Failed to send shift notification: {e}")


async def notify_workspace_owner(workspace_id: str, title: str, message: str, notif_type: str, background_tasks: BackgroundTasks):
    """Send in-app + email + push notification to the workspace owner when a request is submitted."""
    try:
        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "owner_id": 1, "name": 1})
        if not ws:
            return
        owner = await db.users.find_one({"id": ws["owner_id"]}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        if not owner:
            return

        notif_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        notif = {
            "id": notif_id,
            "user_id": owner["id"],
            "workspace_id": workspace_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "read": False,
            "created_at": now,
        }
        await db.manager_notifications.insert_one(notif)
        notif.pop("_id", None)

        if owner.get("email"):
            background_tasks.add_task(
                send_shift_notification,
                owner["email"],
                owner.get("name", "Manager"),
                title,
                f"<p>{message}</p><p style='margin-top:16px;'><a href='#' style='background:#6366f1;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;'>Review in Munal</a></p>",
            )

        # Send browser push notification
        from routes.push_notifications import send_push_to_user
        background_tasks.add_task(
            send_push_to_user,
            owner["id"],
            title,
            message,
            f"/workspace/{workspace_id}/shifts",
        )

        # Send Telegram notification
        from routes.sms_notifications import send_notification_to_user
        background_tasks.add_task(send_notification_to_user, owner["id"], f"📋 <b>{title}</b>\n\n{message}")
    except Exception as e:
        logger.error(f"Error notifying workspace owner: {e}")


# ============== Shift CRUD ==============

@router.post("/create")
async def create_shift(request: ShiftCreate, background_tasks: BackgroundTasks):
    """Create a new shift"""
    try:
        shift_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Get assigned user info
        assigned_user = None
        if request.assigned_to:
            assigned_user = await db.users.find_one({"id": request.assigned_to}, {"_id": 0, "id": 1, "name": 1, "email": 1})
        
        shift = {
            "id": shift_id,
            "workspace_id": request.workspace_id,
            "assigned_to": request.assigned_to,
            "assigned_to_name": assigned_user.get("name") if assigned_user else None,
            "date": request.date,
            "start_time": request.start_time,
            "end_time": request.end_time,
            "hours": calculate_hours(request.start_time, request.end_time),
            "role": request.role,
            "department": request.department,
            "employment_type": request.employment_type,
            "notes": request.notes,
            "is_recurring": request.is_recurring,
            "recurrence_pattern": request.recurrence_pattern,
            "recurrence_end_date": request.recurrence_end_date,
            "color": request.color or "#667eea",
            "status": "scheduled",  # scheduled, completed, cancelled
            "created_at": now,
            "updated_at": now
        }
        
        await db.shifts.insert_one(shift)
        shift.pop("_id", None)
        
        # Create recurring shifts if needed
        if request.is_recurring and request.recurrence_pattern and request.recurrence_end_date:
            await create_recurring_shifts(shift, request.recurrence_pattern, request.recurrence_end_date)
        
        # Send notification to assigned user
        if assigned_user and assigned_user.get("email"):
            background_tasks.add_task(
                send_shift_notification,
                assigned_user["email"],
                assigned_user.get("name", "Team Member"),
                "New Shift Assigned",
                f"<p>You have been assigned a new shift:</p><p><strong>Date:</strong> {request.date}<br><strong>Time:</strong> {request.start_time} - {request.end_time}<br><strong>Role:</strong> {request.role or 'Not specified'}</p>"
            )
        
        return {"success": True, "shift": shift}
    except Exception as e:
        logger.error(f"Error creating shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def create_recurring_shifts(base_shift: dict, pattern: str, end_date: str):
    """Create recurring shifts based on pattern"""
    try:
        current_date = datetime.strptime(base_shift["date"], "%Y-%m-%d")
        end = datetime.strptime(end_date, "%Y-%m-%d")
        
        shifts_to_create = []
        
        while current_date <= end:
            if pattern == "daily":
                current_date += timedelta(days=1)
            elif pattern == "weekly":
                current_date += timedelta(weeks=1)
            else:
                break
            
            if current_date > end:
                break
            
            new_shift = base_shift.copy()
            new_shift["id"] = str(uuid.uuid4())
            new_shift["date"] = current_date.strftime("%Y-%m-%d")
            new_shift["parent_shift_id"] = base_shift["id"]
            new_shift["created_at"] = datetime.now(timezone.utc).isoformat()
            new_shift["updated_at"] = datetime.now(timezone.utc).isoformat()
            shifts_to_create.append(new_shift)
        
        if shifts_to_create:
            await db.shifts.insert_many(shifts_to_create)
    except Exception as e:
        logger.error(f"Error creating recurring shifts: {e}")


@router.get("/workspace/{workspace_id}")
async def get_workspace_shifts(
    workspace_id: str,
    start_date: str = None,
    end_date: str = None,
    user_id: str = None,
    status: str = None,
    limit: int = 500
):
    """Get all shifts for a workspace"""
    try:
        query = {"workspace_id": workspace_id, "deleted": {"$ne": True}}
        
        if start_date and end_date:
            query["date"] = {"$gte": start_date, "$lte": end_date}
        elif start_date:
            query["date"] = {"$gte": start_date}
        elif end_date:
            query["date"] = {"$lte": end_date}
        
        if user_id:
            query["assigned_to"] = user_id
        
        if status:
            query["status"] = status
        
        shifts = await db.shifts.find(query, {"_id": 0}).sort("date", 1).limit(limit).to_list(limit)
        
        # Get unique user IDs
        user_ids = list(set(s.get("assigned_to") for s in shifts if s.get("assigned_to")))
        users = {}
        for uid in user_ids:
            user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1})
            if user:
                users[uid] = user
        
        return {
            "success": True,
            "shifts": shifts,
            "users": users,
            "total": len(shifts)
        }
    except Exception as e:
        logger.error(f"Error fetching shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# NOTE: This PUT route must be defined BEFORE /{shift_id} to avoid route conflicts
@router.put("/time-off-balance")
async def update_time_off_balance(data: TimeOffBalanceUpdate):
    """Admin updates total allocated days for a user."""
    try:
        update_fields = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if data.vacation_total is not None:
            update_fields["vacation_total"] = data.vacation_total
        if data.sick_total is not None:
            update_fields["sick_total"] = data.sick_total
        if data.personal_total is not None:
            update_fields["personal_total"] = data.personal_total

        result = await db.time_off_balances.update_one(
            {"workspace_id": data.workspace_id, "user_id": data.user_id},
            {"$set": update_fields, "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        return {"success": True, "modified": result.modified_count, "upserted": result.upserted_id is not None}
    except Exception as e:
        logger.error(f"Error updating time-off balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{shift_id}")
async def get_shift(shift_id: str):
    """Get a single shift"""
    try:
        shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        return {"success": True, "shift": shift}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{shift_id}")
async def update_shift(shift_id: str, request: ShiftUpdate, background_tasks: BackgroundTasks):
    """Update a shift"""
    try:
        shift = await db.shifts.find_one({"id": shift_id})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if request.assigned_to is not None:
            update_data["assigned_to"] = request.assigned_to
            if request.assigned_to:
                user = await db.users.find_one({"id": request.assigned_to}, {"_id": 0, "name": 1})
                update_data["assigned_to_name"] = user.get("name") if user else None
        
        if request.date:
            update_data["date"] = request.date
        if request.start_time:
            update_data["start_time"] = request.start_time
        if request.end_time:
            update_data["end_time"] = request.end_time
        if request.start_time or request.end_time:
            start = request.start_time or shift.get("start_time")
            end = request.end_time or shift.get("end_time")
            update_data["hours"] = calculate_hours(start, end)
        if request.role is not None:
            update_data["role"] = request.role
        if request.department is not None:
            update_data["department"] = request.department
        if request.notes is not None:
            update_data["notes"] = request.notes
        if request.status:
            update_data["status"] = request.status
        if request.color:
            update_data["color"] = request.color
        
        await db.shifts.update_one({"id": shift_id}, {"$set": update_data})
        
        # Send notification if assignment changed
        if request.assigned_to and request.assigned_to != shift.get("assigned_to"):
            user = await db.users.find_one({"id": request.assigned_to}, {"_id": 0, "name": 1, "email": 1})
            if user and user.get("email"):
                background_tasks.add_task(
                    send_shift_notification,
                    user["email"],
                    user.get("name", "Team Member"),
                    "Shift Assignment Update",
                    f"<p>You have been assigned to a shift:</p><p><strong>Date:</strong> {request.date or shift.get('date')}<br><strong>Time:</strong> {request.start_time or shift.get('start_time')} - {request.end_time or shift.get('end_time')}</p>"
                )
            # Telegram notification for assignment
            from routes.sms_notifications import send_notification_to_user
            shift_date = request.date or shift.get('date', '')
            shift_start = request.start_time or shift.get('start_time', '')
            shift_end = request.end_time or shift.get('end_time', '')
            background_tasks.add_task(
                send_notification_to_user, request.assigned_to,
                f"📋 <b>Shift Assigned</b>\n\nYou've been assigned a shift:\n📅 {shift_date}\n⏰ {shift_start} - {shift_end}"
            )
        
        updated_shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
        return {"success": True, "shift": updated_shift}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{shift_id}")
async def delete_shift(shift_id: str, delete_recurring: bool = False):
    """Soft-delete a shift (moves to trash)."""
    try:
        shift = await db.shifts.find_one({"id": shift_id, "deleted": {"$ne": True}})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        from routes.admin_trash import soft_delete_item
        await soft_delete_item("shifts", {"id": shift_id})
        
        deleted_count = 1
        if delete_recurring and shift.get("is_recurring"):
            now = __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()
            result = await db.shifts.update_many(
                {"parent_shift_id": shift_id, "deleted": {"$ne": True}},
                {"$set": {"deleted": True, "deleted_at": now}}
            )
            deleted_count += result.modified_count
        
        return {"success": True, "deleted_count": deleted_count}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{shift_id}/duplicate")
async def duplicate_shift(shift_id: str, new_date: str):
    """Duplicate a shift to a new date"""
    try:
        shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        new_shift = shift.copy()
        new_shift["id"] = str(uuid.uuid4())
        new_shift["date"] = new_date
        new_shift["is_recurring"] = False
        new_shift["parent_shift_id"] = None
        new_shift["created_at"] = datetime.now(timezone.utc).isoformat()
        new_shift["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        await db.shifts.insert_one(new_shift)
        new_shift.pop("_id", None)
        
        return {"success": True, "shift": new_shift}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error duplicating shift: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== User Hours Summary ==============

@router.get("/hours/{workspace_id}/{user_id}")
async def get_user_hours(
    workspace_id: str,
    user_id: str,
    period: str = "week"  # week, month, custom
):
    """Get total hours for a user"""
    try:
        now = datetime.now(timezone.utc)
        
        if period == "week":
            start_date = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
            end_date = (now + timedelta(days=6-now.weekday())).strftime("%Y-%m-%d")
        elif period == "month":
            start_date = now.replace(day=1).strftime("%Y-%m-%d")
            next_month = now.replace(day=28) + timedelta(days=4)
            end_date = (next_month - timedelta(days=next_month.day)).strftime("%Y-%m-%d")
        else:
            start_date = now.strftime("%Y-%m-%d")
            end_date = (now + timedelta(days=30)).strftime("%Y-%m-%d")
        
        shifts = await db.shifts.find({
            "workspace_id": workspace_id,
            "assigned_to": user_id,
            "date": {"$gte": start_date, "$lte": end_date},
            "status": {"$ne": "cancelled"}
        }, {"_id": 0}).to_list(500)
        
        total_hours = sum(s.get("hours", 0) for s in shifts)
        shift_count = len(shifts)
        
        return {
            "success": True,
            "user_id": user_id,
            "period": period,
            "start_date": start_date,
            "end_date": end_date,
            "total_hours": round(total_hours, 2),
            "shift_count": shift_count,
            "shifts": shifts
        }
    except Exception as e:
        logger.error(f"Error getting user hours: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/all-workspaces")
async def get_global_shift_summary():
    """Get shift summary across all workspaces (for dashboard feature page)."""
    try:
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        total_shifts = await db.shifts.count_documents({"status": {"$ne": "cancelled"}})
        today_shifts = await db.shifts.count_documents({"date": today, "status": {"$ne": "cancelled"}})
        pending_timeoff = await db.time_off_requests.count_documents({"status": "pending"})
        pending_swaps = await db.shift_swap_requests.count_documents({"status": "pending"})
        active_clocks = await db.time_clock.count_documents({"clock_out": None})
        return {
            "success": True,
            "summary": {
                "total_shifts": total_shifts,
                "today_shifts": today_shifts,
                "pending_timeoff": pending_timeoff,
                "pending_swaps": pending_swaps,
                "active_clocks": active_clocks,
            }
        }
    except Exception as e:
        logger.error(f"Error getting global shift summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{workspace_id}")
async def get_workspace_summary(workspace_id: str):
    """Get shift summary for workspace dashboard"""
    try:
        now = datetime.now(timezone.utc)
        today = now.strftime("%Y-%m-%d")
        week_start = (now - timedelta(days=now.weekday())).strftime("%Y-%m-%d")
        week_end = (now + timedelta(days=6-now.weekday())).strftime("%Y-%m-%d")
        
        # Today's shifts
        today_shifts = await db.shifts.count_documents({
            "workspace_id": workspace_id,
            "date": today,
            "status": {"$ne": "cancelled"}
        })
        
        # This week's total hours
        week_shifts = await db.shifts.find({
            "workspace_id": workspace_id,
            "date": {"$gte": week_start, "$lte": week_end},
            "status": {"$ne": "cancelled"}
        }, {"_id": 0, "hours": 1, "assigned_to": 1}).to_list(1000)
        
        total_week_hours = sum(s.get("hours", 0) for s in week_shifts)
        active_users = len(set(s.get("assigned_to") for s in week_shifts if s.get("assigned_to")))
        
        # Upcoming shifts (next 7 days)
        upcoming_end = (now + timedelta(days=7)).strftime("%Y-%m-%d")
        upcoming_shifts = await db.shifts.find({
            "workspace_id": workspace_id,
            "date": {"$gte": today, "$lte": upcoming_end},
            "status": "scheduled"
        }, {"_id": 0}).sort("date", 1).limit(10).to_list(10)
        
        # Pending requests
        pending_swaps = await db.shift_swap_requests.count_documents({
            "workspace_id": workspace_id,
            "status": "pending"
        })
        
        pending_timeoff = await db.time_off_requests.count_documents({
            "workspace_id": workspace_id,
            "status": "pending"
        })
        
        return {
            "success": True,
            "summary": {
                "today_shifts": today_shifts,
                "week_total_hours": round(total_week_hours, 2),
                "active_users": active_users,
                "upcoming_shifts": upcoming_shifts,
                "pending_swap_requests": pending_swaps,
                "pending_timeoff_requests": pending_timeoff
            }
        }
    except Exception as e:
        logger.error(f"Error getting workspace summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Shift Swap Requests ==============

@router.post("/swap-request")
async def create_swap_request(request: ShiftSwapRequest, background_tasks: BackgroundTasks):
    """Create a shift swap request"""
    try:
        # Get the shift
        shift = await db.shifts.find_one({"id": request.shift_id}, {"_id": 0})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        # Verify requester is assigned to this shift
        if shift.get("assigned_to") != request.requester_id:
            raise HTTPException(status_code=403, detail="You are not assigned to this shift")
        
        # Get users info
        requester = await db.users.find_one({"id": request.requester_id}, {"_id": 0, "name": 1, "email": 1})
        target = await db.users.find_one({"id": request.target_user_id}, {"_id": 0, "name": 1, "email": 1})
        
        swap_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        swap_request = {
            "id": swap_id,
            "workspace_id": shift.get("workspace_id"),
            "shift_id": request.shift_id,
            "shift_date": shift.get("date"),
            "shift_time": f"{shift.get('start_time')} - {shift.get('end_time')}",
            "requester_id": request.requester_id,
            "requester_name": requester.get("name") if requester else "Unknown",
            "target_user_id": request.target_user_id,
            "target_user_name": target.get("name") if target else "Unknown",
            "reason": request.reason,
            "status": "pending",  # pending, approved, rejected
            "created_at": now,
            "updated_at": now
        }
        
        await db.shift_swap_requests.insert_one(swap_request)
        swap_request.pop("_id", None)
        
        # Notify target user
        if target and target.get("email"):
            background_tasks.add_task(
                send_shift_notification,
                target["email"],
                target.get("name", "Team Member"),
                "Shift Swap Request",
                f"<p>{requester.get('name', 'A team member')} has requested to swap shifts with you:</p><p><strong>Date:</strong> {shift.get('date')}<br><strong>Time:</strong> {shift.get('start_time')} - {shift.get('end_time')}<br><strong>Reason:</strong> {request.reason or 'Not specified'}</p>"
            )

        # Notify workspace owner (manager)
        requester_name = requester.get("name") if requester else "Unknown"
        await notify_workspace_owner(
            shift.get("workspace_id"),
            f"New Swap Request from {requester_name}",
            f"{requester_name} wants to swap shift on {shift.get('date')} ({shift.get('start_time')}-{shift.get('end_time')}) with {target.get('name') if target else 'another member'}.",
            "swap_request",
            background_tasks,
        )
        
        return {"success": True, "request": swap_request}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating swap request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/swap-requests/{workspace_id}")
async def get_swap_requests(workspace_id: str, status: str = None):
    """Get all swap requests for a workspace"""
    try:
        query = {"workspace_id": workspace_id}
        if status:
            query["status"] = status
        
        requests = await db.shift_swap_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"success": True, "requests": requests}
    except Exception as e:
        logger.error(f"Error fetching swap requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/swap-request/{request_id}/approve")
async def approve_swap_request(request_id: str, background_tasks: BackgroundTasks):
    """Approve a shift swap request"""
    try:
        swap = await db.shift_swap_requests.find_one({"id": request_id})
        if not swap:
            raise HTTPException(status_code=404, detail="Swap request not found")
        
        # Update the shift assignment
        await db.shifts.update_one(
            {"id": swap["shift_id"]},
            {"$set": {
                "assigned_to": swap["target_user_id"],
                "assigned_to_name": swap["target_user_name"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        # Update swap request status
        await db.shift_swap_requests.update_one(
            {"id": request_id},
            {"$set": {"status": "approved", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Notify requester
        requester = await db.users.find_one({"id": swap["requester_id"]}, {"_id": 0, "name": 1, "email": 1})
        
        if requester and requester.get("email"):
            background_tasks.add_task(
                send_shift_notification,
                requester["email"],
                requester.get("name", "Team Member"),
                "Shift Swap Approved",
                f"<p>Your shift swap request has been approved. The shift on {swap['shift_date']} has been reassigned.</p>"
            )
        
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving swap request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/swap-request/{request_id}/reject")
async def reject_swap_request(request_id: str):
    """Reject a shift swap request"""
    try:
        result = await db.shift_swap_requests.update_one(
            {"id": request_id},
            {"$set": {"status": "rejected", "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Swap request not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting swap request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Manager Notifications ==============

@router.get("/manager-notifications/{user_id}")
async def get_manager_notifications(user_id: str, limit: int = 50):
    """Get in-app notifications for a manager/owner."""
    try:
        notifs = await db.manager_notifications.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).limit(limit).to_list(limit)
        unread = sum(1 for n in notifs if not n.get("read"))
        return {"notifications": notifs, "unread_count": unread}
    except Exception as e:
        logger.error(f"Error fetching manager notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/manager-notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark a single notification as read."""
    try:
        await db.manager_notifications.update_one(
            {"id": notification_id}, {"$set": {"read": True}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/manager-notifications-read-all/{user_id}")
async def mark_all_notifications_read(user_id: str):
    """Mark all notifications as read for a user."""
    try:
        await db.manager_notifications.update_many(
            {"user_id": user_id, "read": False}, {"$set": {"read": True}}
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== Time Off Requests ==============

@router.post("/time-off")
async def create_time_off_request(request: TimeOffRequest, background_tasks: BackgroundTasks):
    """Create a time off request"""
    try:
        # Get user info
        user = await db.users.find_one({"id": request.user_id}, {"_id": 0, "name": 1, "email": 1})
        
        request_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        time_off = {
            "id": request_id,
            "workspace_id": request.workspace_id,
            "user_id": request.user_id,
            "user_name": user.get("name") if user else "Unknown",
            "start_date": request.start_date,
            "end_date": request.end_date,
            "type": request.type,
            "reason": request.reason,
            "status": "pending",  # pending, approved, rejected
            "created_at": now,
            "updated_at": now
        }
        
        await db.time_off_requests.insert_one(time_off)
        time_off.pop("_id", None)

        # Notify workspace owner
        user_name = user.get("name") if user else "Unknown"
        await notify_workspace_owner(
            request.workspace_id,
            f"New Time-Off Request from {user_name}",
            f"{user_name} requested {request.type} leave from {request.start_date} to {request.end_date}." + (f" Reason: {request.reason}" if request.reason else ""),
            "time_off_request",
            background_tasks,
        )
        
        return {"success": True, "request": time_off}
    except Exception as e:
        logger.error(f"Error creating time off request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/time-off/{workspace_id}")
async def get_time_off_requests(workspace_id: str, status: str = None, user_id: str = None):
    """Get all time off requests for a workspace"""
    try:
        query = {"workspace_id": workspace_id}
        if status:
            query["status"] = status
        if user_id:
            query["user_id"] = user_id
        
        requests = await db.time_off_requests.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
        return {"success": True, "requests": requests}
    except Exception as e:
        logger.error(f"Error fetching time off requests: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/time-off/{request_id}/{action}")
async def handle_time_off_request(request_id: str, action: str):
    """Approve or reject a time off request"""
    try:
        if action not in ["approve", "reject"]:
            raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'")
        
        status = "approved" if action == "approve" else "rejected"
        result = await db.time_off_requests.update_one(
            {"id": request_id},
            {"$set": {"status": status, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Time off request not found")
        
        return {"success": True, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error handling time off request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Export ==============

@router.get("/export/{workspace_id}")
async def export_shifts(
    workspace_id: str,
    format: str = "csv",
    start_date: str = None,
    end_date: str = None
):
    """Export shifts as CSV or JSON"""
    try:
        query = {"workspace_id": workspace_id}
        if start_date:
            query["date"] = {"$gte": start_date}
        if end_date:
            if "date" in query:
                query["date"]["$lte"] = end_date
            else:
                query["date"] = {"$lte": end_date}
        
        shifts = await db.shifts.find(query, {"_id": 0}).sort("date", 1).to_list(10000)
        
        if format == "csv":
            import csv
            import io
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Date", "Start Time", "End Time", "Hours", "Assigned To", "Role", "Department", "Status", "Notes"])
            
            for shift in shifts:
                writer.writerow([
                    shift.get("date", ""),
                    shift.get("start_time", ""),
                    shift.get("end_time", ""),
                    shift.get("hours", 0),
                    shift.get("assigned_to_name", "Unassigned"),
                    shift.get("role", ""),
                    shift.get("department", ""),
                    shift.get("status", ""),
                    shift.get("notes", "")
                ])
            
            from fastapi.responses import Response
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=shifts_export_{datetime.now().strftime('%Y%m%d')}.csv"}
            )
        else:
            import json
            from fastapi.responses import Response
            return Response(
                content=json.dumps({"shifts": shifts, "export_date": datetime.now(timezone.utc).isoformat()}, default=str),
                media_type="application/json",
                headers={"Content-Disposition": f"attachment; filename=shifts_export_{datetime.now().strftime('%Y%m%d')}.json"}
            )
    except Exception as e:
        logger.error(f"Error exporting shifts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Roles & Departments ==============

@router.get("/roles/{workspace_id}")
async def get_workspace_roles(workspace_id: str):
    """Get all unique roles used in workspace shifts"""
    try:
        pipeline = [
            {"$match": {"workspace_id": workspace_id, "role": {"$nin": [None, ""]}}},
            {"$group": {"_id": "$role"}},
            {"$sort": {"_id": 1}}
        ]
        
        roles = await db.shifts.aggregate(pipeline).to_list(100)
        return {"success": True, "roles": [r["_id"] for r in roles]}
    except Exception as e:
        logger.error(f"Error fetching roles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/departments/{workspace_id}")
async def get_workspace_departments(workspace_id: str):
    """Get all unique departments used in workspace shifts"""
    try:
        pipeline = [
            {"$match": {"workspace_id": workspace_id, "department": {"$nin": [None, ""]}}},
            {"$group": {"_id": "$department"}},
            {"$sort": {"_id": 1}}
        ]
        
        departments = await db.shifts.aggregate(pipeline).to_list(100)
        return {"success": True, "departments": [d["_id"] for d in departments]}
    except Exception as e:
        logger.error(f"Error fetching departments: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Clock In/Out Time Tracking ==============

@router.post("/clock")
async def clock_in_out(clock_data: ClockAction):
    """Clock in or out of a shift"""
    try:
        # Get the shift
        shift = await db.shifts.find_one({"id": clock_data.shift_id}, {"_id": 0})
        if not shift:
            raise HTTPException(status_code=404, detail="Shift not found")
        
        # Verify user is assigned to this shift
        if shift.get("assigned_to") != clock_data.user_id:
            raise HTTPException(status_code=403, detail="You are not assigned to this shift")
        
        now = datetime.now(timezone.utc)
        
        if clock_data.action == "in":
            # Check if already clocked in
            existing = await db.time_entries.find_one({
                "shift_id": clock_data.shift_id,
                "user_id": clock_data.user_id,
                "clock_out": None
            })
            
            if existing:
                raise HTTPException(status_code=400, detail="Already clocked in to this shift")
            
            # Create time entry
            entry_id = str(uuid.uuid4())
            time_entry = {
                "id": entry_id,
                "shift_id": clock_data.shift_id,
                "workspace_id": shift.get("workspace_id"),
                "user_id": clock_data.user_id,
                "clock_in": now.isoformat(),
                "clock_out": None,
                "clock_in_location": clock_data.location,
                "clock_in_notes": clock_data.notes,
                "duration_minutes": 0,
                "status": "active",
                "created_at": now.isoformat()
            }
            
            await db.time_entries.insert_one(time_entry)
            
            # Update shift status
            await db.shifts.update_one(
                {"id": clock_data.shift_id},
                {"$set": {"clock_status": "clocked_in", "current_entry_id": entry_id}}
            )
            
            time_entry.pop("_id", None)
            return {
                "success": True,
                "action": "clock_in",
                "entry": time_entry,
                "message": "Clocked in successfully"
            }
        
        elif clock_data.action == "out":
            # Find active time entry
            entry = await db.time_entries.find_one({
                "shift_id": clock_data.shift_id,
                "user_id": clock_data.user_id,
                "clock_out": None
            })
            
            if not entry:
                raise HTTPException(status_code=400, detail="Not clocked in to this shift")
            
            # Calculate duration
            clock_in_time = datetime.fromisoformat(entry["clock_in"].replace('Z', '+00:00'))
            duration = (now - clock_in_time).total_seconds() / 60  # minutes
            
            # Update time entry
            await db.time_entries.update_one(
                {"id": entry["id"]},
                {"$set": {
                    "clock_out": now.isoformat(),
                    "clock_out_location": clock_data.location,
                    "clock_out_notes": clock_data.notes,
                    "duration_minutes": round(duration, 2),
                    "status": "completed"
                }}
            )
            
            # Update shift status
            await db.shifts.update_one(
                {"id": clock_data.shift_id},
                {"$set": {"clock_status": "clocked_out", "current_entry_id": None}}
            )
            
            return {
                "success": True,
                "action": "clock_out",
                "duration_minutes": round(duration, 2),
                "duration_hours": round(duration / 60, 2),
                "message": f"Clocked out successfully. Worked {round(duration / 60, 2)} hours"
            }
        
        else:
            raise HTTPException(status_code=400, detail="Invalid action. Use 'in' or 'out'")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Clock in/out error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clock/status/{shift_id}/{user_id}")
async def get_clock_status(shift_id: str, user_id: str):
    """Get current clock status for a shift"""
    try:
        # Check for active time entry
        active_entry = await db.time_entries.find_one({
            "shift_id": shift_id,
            "user_id": user_id,
            "clock_out": None
        }, {"_id": 0})
        
        if active_entry:
            # Calculate current duration
            clock_in_time = datetime.fromisoformat(active_entry["clock_in"].replace('Z', '+00:00'))
            now = datetime.now(timezone.utc)
            current_duration = (now - clock_in_time).total_seconds() / 60
            
            return {
                "success": True,
                "clocked_in": True,
                "entry": active_entry,
                "current_duration_minutes": round(current_duration, 2),
                "current_duration_hours": round(current_duration / 60, 2)
            }
        
        return {
            "success": True,
            "clocked_in": False,
            "entry": None
        }
    except Exception as e:
        logger.error(f"Get clock status error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/time-entries/{shift_id}")
async def get_shift_time_entries(shift_id: str):
    """Get all time entries for a shift"""
    try:
        entries = await db.time_entries.find(
            {"shift_id": shift_id},
            {"_id": 0}
        ).sort("clock_in", -1).to_list(100)
        
        total_minutes = sum(e.get("duration_minutes", 0) for e in entries if e.get("status") == "completed")
        
        return {
            "success": True,
            "entries": entries,
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_minutes / 60, 2)
        }
    except Exception as e:
        logger.error(f"Get time entries error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/time-entries/user/{workspace_id}/{user_id}")
async def get_user_time_entries(workspace_id: str, user_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get all time entries for a user in a workspace"""
    try:
        query = {
            "workspace_id": workspace_id,
            "user_id": user_id
        }
        
        if start_date:
            query["clock_in"] = {"$gte": start_date}
        if end_date:
            if "clock_in" in query:
                query["clock_in"]["$lte"] = end_date + "T23:59:59"
            else:
                query["clock_in"] = {"$lte": end_date + "T23:59:59"}
        
        entries = await db.time_entries.find(query, {"_id": 0}).sort("clock_in", -1).to_list(500)
        
        # Calculate totals
        total_minutes = sum(e.get("duration_minutes", 0) for e in entries if e.get("status") == "completed")
        
        # Group by date
        by_date = {}
        for entry in entries:
            if entry.get("clock_in"):
                date = entry["clock_in"][:10]
                if date not in by_date:
                    by_date[date] = {"entries": [], "total_minutes": 0}
                by_date[date]["entries"].append(entry)
                if entry.get("status") == "completed":
                    by_date[date]["total_minutes"] += entry.get("duration_minutes", 0)
        
        return {
            "success": True,
            "entries": entries,
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_minutes / 60, 2),
            "by_date": by_date,
            "entry_count": len(entries)
        }
    except Exception as e:
        logger.error(f"Get user time entries error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/timesheet/{workspace_id}")
async def get_workspace_timesheet(workspace_id: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get timesheet summary for all users in a workspace"""
    try:
        # Default to current week if no dates provided
        if not start_date:
            today = datetime.now(timezone.utc)
            start_of_week = today - timedelta(days=today.weekday())
            start_date = start_of_week.strftime("%Y-%m-%d")
        if not end_date:
            end_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
        # Get all time entries for the period
        entries = await db.time_entries.find({
            "workspace_id": workspace_id,
            "clock_in": {"$gte": start_date, "$lte": end_date + "T23:59:59"},
            "status": "completed"
        }, {"_id": 0}).to_list(1000)
        
        # Group by user
        by_user = {}
        for entry in entries:
            user_id = entry.get("user_id")
            if user_id not in by_user:
                by_user[user_id] = {
                    "user_id": user_id,
                    "total_minutes": 0,
                    "entry_count": 0,
                    "entries": []
                }
            by_user[user_id]["total_minutes"] += entry.get("duration_minutes", 0)
            by_user[user_id]["entry_count"] += 1
            by_user[user_id]["entries"].append(entry)
        
        # Enrich with user data
        for user_id in by_user:
            user = await db.users.find_one({"id": user_id}, {"_id": 0, "name": 1, "email": 1})
            if user:
                by_user[user_id]["user_name"] = user.get("name", user.get("email", "Unknown"))
                by_user[user_id]["user_email"] = user.get("email")
            by_user[user_id]["total_hours"] = round(by_user[user_id]["total_minutes"] / 60, 2)
        
        # Calculate totals
        total_minutes = sum(u["total_minutes"] for u in by_user.values())
        
        return {
            "success": True,
            "period": {"start": start_date, "end": end_date},
            "users": list(by_user.values()),
            "total_minutes": round(total_minutes, 2),
            "total_hours": round(total_minutes / 60, 2),
            "user_count": len(by_user)
        }
    except Exception as e:
        logger.error(f"Get timesheet error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/time-entries/{entry_id}")
async def delete_time_entry(entry_id: str, user_id: str):
    """Delete a time entry (admin only or own entry)"""
    try:
        entry = await db.time_entries.find_one({"id": entry_id})
        if not entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        # Only allow deletion of own entries or if admin
        if entry.get("user_id") != user_id:
            # Check if user is admin of workspace
            workspace = await db.workspaces.find_one({"id": entry.get("workspace_id")})
            if not workspace or workspace.get("owner_id") != user_id:
                raise HTTPException(status_code=403, detail="Not authorized to delete this entry")
        
        await db.time_entries.delete_one({"id": entry_id})
        
        return {"success": True, "message": "Time entry deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete time entry error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Custom Shift Presets ==============

class ShiftPresetCreate(BaseModel):
    workspace_id: str
    name: str
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    color: str = "#6366f1"
    icon: str = "⏰"


@router.get("/presets/{workspace_id}")
async def get_shift_presets(workspace_id: str):
    """Get custom shift presets for a workspace"""
    try:
        presets = await db.shift_presets.find(
            {"workspace_id": workspace_id},
            {"_id": 0}
        ).sort("name", 1).to_list(50)
        
        # If no custom presets, return default presets
        if not presets:
            presets = [
                {"id": "default-morning", "name": "Morning", "start_time": "06:00", "end_time": "14:00", "color": "#f59e0b", "icon": "🌅", "is_default": True},
                {"id": "default-afternoon", "name": "Afternoon", "start_time": "14:00", "end_time": "22:00", "color": "#3b82f6", "icon": "☀️", "is_default": True},
                {"id": "default-evening", "name": "Evening", "start_time": "22:00", "end_time": "06:00", "color": "#6366f1", "icon": "🌙", "is_default": True},
            ]
        
        return {"success": True, "presets": presets}
    except Exception as e:
        logger.error(f"Error fetching shift presets: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/presets")
async def create_shift_preset(preset: ShiftPresetCreate):
    """Create a custom shift preset"""
    try:
        preset_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        preset_doc = {
            "id": preset_id,
            "workspace_id": preset.workspace_id,
            "name": preset.name,
            "start_time": preset.start_time,
            "end_time": preset.end_time,
            "color": preset.color,
            "icon": preset.icon,
            "is_default": False,
            "created_at": now,
            "updated_at": now
        }
        
        await db.shift_presets.insert_one(preset_doc)
        preset_doc.pop("_id", None)
        
        return {"success": True, "preset": preset_doc}
    except Exception as e:
        logger.error(f"Error creating shift preset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/presets/{preset_id}")
async def update_shift_preset(preset_id: str, preset: ShiftPresetCreate):
    """Update a custom shift preset"""
    try:
        existing = await db.shift_presets.find_one({"id": preset_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        update_data = {
            "name": preset.name,
            "start_time": preset.start_time,
            "end_time": preset.end_time,
            "color": preset.color,
            "icon": preset.icon,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.shift_presets.update_one({"id": preset_id}, {"$set": update_data})
        
        updated = await db.shift_presets.find_one({"id": preset_id}, {"_id": 0})
        return {"success": True, "preset": updated}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shift preset: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== Time-Off Balance Tracking ==============

@router.get("/time-off-balance/{workspace_id}/{user_id}")
async def get_time_off_balance(workspace_id: str, user_id: str):
    """Get time-off balance for a user: allocated days minus approved days used."""
    try:
        balance = await db.time_off_balances.find_one(
            {"workspace_id": workspace_id, "user_id": user_id},
            {"_id": 0},
        )
        if not balance:
            balance = {
                "workspace_id": workspace_id,
                "user_id": user_id,
                "vacation_total": 15,
                "sick_total": 10,
                "personal_total": 5,
            }
            balance["id"] = str(uuid.uuid4())
            balance["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.time_off_balances.insert_one({**balance})

        approved = await db.time_off_requests.find(
            {"workspace_id": workspace_id, "user_id": user_id, "status": "approved"},
            {"_id": 0, "type": 1, "start_date": 1, "end_date": 1},
        ).to_list(500)

        used = {"vacation": 0, "sick": 0, "personal": 0, "other": 0}
        for req in approved:
            try:
                s = datetime.strptime(req["start_date"], "%Y-%m-%d")
                e = datetime.strptime(req["end_date"], "%Y-%m-%d")
                days = (e - s).days + 1
            except Exception:
                days = 1
            t = req.get("type", "other")
            if t in used:
                used[t] += days
            else:
                used["other"] += days

        return {
            "success": True,
            "balance": {
                "vacation": {"total": balance.get("vacation_total", 15), "used": used["vacation"], "remaining": balance.get("vacation_total", 15) - used["vacation"]},
                "sick": {"total": balance.get("sick_total", 10), "used": used["sick"], "remaining": balance.get("sick_total", 10) - used["sick"]},
                "personal": {"total": balance.get("personal_total", 5), "used": used["personal"], "remaining": balance.get("personal_total", 5) - used["personal"]},
            },
        }
    except Exception as e:
        logger.error(f"Error fetching time-off balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== PDF Export ==============

@router.get("/export-pdf/{workspace_id}")
async def export_shifts_pdf(workspace_id: str, start_date: str = None, end_date: str = None):
    """Export shifts as a downloadable PDF (HTML-rendered)."""
    try:
        query = {"workspace_id": workspace_id}
        if start_date:
            query["date"] = {"$gte": start_date}
        if end_date:
            if "date" in query:
                query["date"]["$lte"] = end_date
            else:
                query["date"] = {"$lte": end_date}

        shifts = await db.shifts.find(query, {"_id": 0}).sort("date", 1).to_list(10000)

        ws = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0, "name": 1})
        ws_name = ws.get("name", "Workspace") if ws else "Workspace"

        rows = ""
        for s in shifts:
            rows += f"""<tr>
                <td>{s.get('date','')}</td>
                <td>{s.get('start_time','')}</td>
                <td>{s.get('end_time','')}</td>
                <td>{s.get('hours',0)}h</td>
                <td>{s.get('assigned_to_name','Unassigned')}</td>
                <td>{s.get('role','')}</td>
                <td>{s.get('department','')}</td>
                <td>{s.get('status','')}</td>
            </tr>"""

        html = f"""<!DOCTYPE html><html><head><meta charset='utf-8'>
        <title>Shift Report - {ws_name}</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; }}
            h1 {{ color: #6366f1; font-size: 24px; margin-bottom: 4px; }}
            .meta {{ color: #666; font-size: 13px; margin-bottom: 20px; }}
            table {{ border-collapse: collapse; width: 100%; font-size: 13px; }}
            th {{ background: #6366f1; color: white; padding: 10px 12px; text-align: left; }}
            td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }}
            tr:nth-child(even) {{ background: #f9fafb; }}
            .footer {{ margin-top: 30px; font-size: 11px; color: #999; }}
        </style></head><body>
        <h1>Shift Report - {ws_name}</h1>
        <p class="meta">Period: {start_date or 'All'} to {end_date or 'All'} &bull; Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} &bull; Total shifts: {len(shifts)}</p>
        <table><thead><tr>
            <th>Date</th><th>Start</th><th>End</th><th>Hours</th><th>Assigned To</th><th>Role</th><th>Department</th><th>Status</th>
        </tr></thead><tbody>{rows}</tbody></table>
        <p class="footer">Munal Shift Management &mdash; Confidential</p>
        </body></html>"""

        from fastapi.responses import Response
        return Response(
            content=html,
            media_type="text/html",
            headers={"Content-Disposition": f"attachment; filename=shifts_report_{datetime.now().strftime('%Y%m%d')}.html"}
        )
    except Exception as e:
        logger.error(f"Error exporting PDF: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/presets/{preset_id}")
async def delete_shift_preset(preset_id: str):
    """Delete a custom shift preset"""
    try:
        result = await db.shift_presets.delete_one({"id": preset_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Preset not found")
        
        return {"success": True, "message": "Preset deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shift preset: {e}")
        raise HTTPException(status_code=500, detail=str(e))

