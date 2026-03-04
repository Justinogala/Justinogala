"""
Shift Reminders Routes
Handles push notifications for upcoming shifts
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from config import db, logger
import uuid

router = APIRouter(prefix="/shift-reminders", tags=["Shift Reminders"])


# ============== Models ==============

class ReminderPreferences(BaseModel):
    enabled: bool = True
    reminder_times: List[int] = [15, 60]  # Minutes before shift (15min, 1 hour)
    push_enabled: bool = True
    email_enabled: bool = False
    sms_enabled: bool = False


class ShiftReminder(BaseModel):
    id: str
    user_id: str
    shift_id: str
    workspace_id: str
    shift_date: str
    shift_start_time: str
    shift_end_time: str
    reminder_time_minutes: int
    status: str  # "pending", "sent", "failed"
    sent_at: Optional[str] = None
    created_at: str


class SendReminderRequest(BaseModel):
    user_id: str
    shift_id: str


# ============== Helper Functions ==============

def get_reminder_message(shift: dict, minutes_until: int) -> str:
    """Generate reminder message based on time until shift"""
    start_time = shift.get("start_time", "")
    role = shift.get("role", "your shift")
    
    if minutes_until <= 15:
        return f"Your shift starts in {minutes_until} minutes! ({start_time})"
    elif minutes_until <= 60:
        return f"Reminder: Your {role} shift starts in {minutes_until} minutes at {start_time}"
    else:
        hours = minutes_until // 60
        return f"Upcoming shift: {role} starts in {hours} hour(s) at {start_time}"


async def create_shift_notification(user_id: str, shift: dict, minutes_until: int):
    """Create a notification for the shift reminder"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": "shift_reminder",
        "title": "Shift Reminder",
        "message": get_reminder_message(shift, minutes_until),
        "read": False,
        "actionUrl": f"/workspace/{shift.get('workspace_id')}/shifts",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metadata": {
            "shift_id": shift.get("id"),
            "shift_date": shift.get("date"),
            "start_time": shift.get("start_time"),
            "minutes_until": minutes_until
        }
    }
    
    await db.notifications.insert_one(notification)
    return notification


async def schedule_shift_reminders(shift: dict):
    """Schedule reminders for a new shift"""
    user_id = shift.get("assigned_to")
    if not user_id:
        return []  # Unassigned shift
    
    # Get user's reminder preferences
    prefs = await db.shift_reminder_preferences.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not prefs:
        prefs = ReminderPreferences().dict()
    
    if not prefs.get("enabled", True):
        return []  # Reminders disabled
    
    reminder_times = prefs.get("reminder_times", [15, 60])
    reminders_created = []
    
    for minutes in reminder_times:
        reminder = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "shift_id": shift.get("id"),
            "workspace_id": shift.get("workspace_id"),
            "shift_date": shift.get("date"),
            "shift_start_time": shift.get("start_time"),
            "shift_end_time": shift.get("end_time"),
            "reminder_time_minutes": minutes,
            "status": "pending",
            "sent_at": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.shift_reminders.insert_one(reminder)
        reminders_created.append(reminder)
    
    return reminders_created


async def process_pending_reminders():
    """Process all pending reminders (called by scheduler)"""
    now = datetime.now(timezone.utc)
    reminders_sent = 0
    
    # Get all pending reminders
    pending = await db.shift_reminders.find(
        {"status": "pending"}
    ).to_list(1000)
    
    for reminder in pending:
        try:
            # Parse shift datetime
            shift_date = reminder.get("shift_date")
            shift_time = reminder.get("shift_start_time")
            
            if not shift_date or not shift_time:
                continue
            
            # Combine date and time
            shift_datetime_str = f"{shift_date}T{shift_time}:00"
            shift_datetime = datetime.fromisoformat(shift_datetime_str).replace(tzinfo=timezone.utc)
            
            # Calculate reminder time
            reminder_minutes = reminder.get("reminder_time_minutes", 15)
            reminder_datetime = shift_datetime - timedelta(minutes=reminder_minutes)
            
            # Check if it's time to send
            if now >= reminder_datetime:
                # Get shift details
                shift = await db.shifts.find_one({"id": reminder.get("shift_id")})
                
                if shift and shift.get("status") != "cancelled":
                    # Calculate actual minutes until shift
                    minutes_until = int((shift_datetime - now).total_seconds() / 60)
                    minutes_until = max(0, minutes_until)
                    
                    # Create notification
                    await create_shift_notification(
                        reminder.get("user_id"),
                        shift,
                        minutes_until if minutes_until > 0 else reminder_minutes
                    )
                    
                    reminders_sent += 1
                
                # Mark as sent
                await db.shift_reminders.update_one(
                    {"id": reminder.get("id")},
                    {
                        "$set": {
                            "status": "sent",
                            "sent_at": now.isoformat()
                        }
                    }
                )
        except Exception as e:
            logger.error(f"Error processing reminder {reminder.get('id')}: {e}")
            await db.shift_reminders.update_one(
                {"id": reminder.get("id")},
                {"$set": {"status": "failed"}}
            )
    
    return reminders_sent


# ============== API Routes ==============

@router.get("/user/{user_id}/preferences")
async def get_reminder_preferences(user_id: str):
    """Get user's shift reminder preferences"""
    prefs = await db.shift_reminder_preferences.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    
    if not prefs:
        prefs = ReminderPreferences().dict()
        prefs["user_id"] = user_id
    
    return {"success": True, "preferences": prefs}


@router.put("/user/{user_id}/preferences")
async def update_reminder_preferences(user_id: str, preferences: ReminderPreferences):
    """Update user's shift reminder preferences"""
    prefs_data = preferences.dict()
    prefs_data["user_id"] = user_id
    prefs_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.shift_reminder_preferences.update_one(
        {"user_id": user_id},
        {"$set": prefs_data},
        upsert=True
    )
    
    return {"success": True, "message": "Preferences updated", "preferences": prefs_data}


@router.get("/user/{user_id}/upcoming")
async def get_upcoming_reminders(user_id: str):
    """Get upcoming shift reminders for a user"""
    reminders = await db.shift_reminders.find(
        {"user_id": user_id, "status": "pending"},
        {"_id": 0}
    ).sort("shift_date", 1).limit(20).to_list(20)
    
    return {"success": True, "reminders": reminders}


@router.post("/shift/{shift_id}/schedule")
async def schedule_reminders_for_shift(shift_id: str):
    """Schedule reminders for a specific shift"""
    shift = await db.shifts.find_one({"id": shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    reminders = await schedule_shift_reminders(shift)
    
    return {
        "success": True,
        "message": f"Scheduled {len(reminders)} reminders",
        "reminders": reminders
    }


@router.delete("/shift/{shift_id}")
async def cancel_reminders_for_shift(shift_id: str):
    """Cancel all pending reminders for a shift"""
    result = await db.shift_reminders.delete_many({
        "shift_id": shift_id,
        "status": "pending"
    })
    
    return {
        "success": True,
        "message": f"Cancelled {result.deleted_count} reminders"
    }


@router.post("/process")
async def trigger_reminder_processing(background_tasks: BackgroundTasks):
    """Manually trigger reminder processing (for testing)"""
    background_tasks.add_task(process_pending_reminders)
    return {"success": True, "message": "Reminder processing triggered"}


@router.post("/send-now")
async def send_reminder_now(request: SendReminderRequest):
    """Send an immediate reminder for a shift"""
    shift = await db.shifts.find_one({"id": request.shift_id}, {"_id": 0})
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    
    # Create immediate notification
    notification = await create_shift_notification(
        request.user_id,
        shift,
        0  # Immediate
    )
    
    return {
        "success": True,
        "message": "Reminder sent",
        "notification": notification
    }


@router.get("/history/{user_id}")
async def get_reminder_history(user_id: str, limit: int = 50):
    """Get reminder history for a user"""
    reminders = await db.shift_reminders.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    return {"success": True, "reminders": reminders}
