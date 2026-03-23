"""
Admin Workspace Management Routes
Provides admin oversight and control over all workspaces
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, timezone
from config import db, logger
from middleware.permissions import require_permission, require_any_permission, Permissions
import uuid

router = APIRouter(prefix="/admin/workspaces", tags=["Admin Workspaces"])


# ============== Models ==============

class WorkspaceAction(BaseModel):
    action: str  # suspend, unsuspend, archive, delete, transfer_ownership
    reason: Optional[str] = None
    new_owner_id: Optional[str] = None  # For transfer_ownership


class WorkspaceNote(BaseModel):
    note: str


# ============== Helper Functions ==============

async def log_admin_action(action: str, workspace_id: str, admin_id: str, details: Dict = None):
    """Log admin actions on workspaces for audit trail - logs to both collections"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "action": action,
        "workspace_id": workspace_id,
        "admin_id": admin_id,
        "details": details or {},
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    # Log to workspace-specific collection
    await db.admin_workspace_logs.insert_one(log_entry)
    
    # Also log to central audit_logs for real-time monitoring
    audit_entry = {
        "action": f"workspace_{action}",
        "category": "workspace",
        "admin_id": admin_id,
        "admin_email": admin_id,
        "details": {
            "workspace_id": workspace_id,
            **(details or {})
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.audit_logs.insert_one(audit_entry)
    
    return log_entry


# ============== API Routes ==============

@router.get("")
async def get_all_workspaces(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,  # active, suspended, archived
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    """Get all workspaces with pagination and filters"""
    try:
        # Build query
        query = {}
        if search:
            query["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        if status:
            query["status"] = status
        
        # Get total count
        total = await db.workspaces.count_documents(query)
        
        # Get workspaces with pagination
        sort_direction = -1 if sort_order == "desc" else 1
        skip = (page - 1) * limit
        
        workspaces_cursor = db.workspaces.find(query, {"_id": 0}).sort(
            sort_by, sort_direction
        ).skip(skip).limit(limit)
        
        workspaces = await workspaces_cursor.to_list(limit)
        
        # Enrich with stats
        enriched_workspaces = []
        for ws in workspaces:
            # Get member count
            member_count = len(ws.get("members", []))
            
            # Get message count
            message_count = await db.workspace_messages.count_documents(
                {"workspace_id": ws.get("id")}
            )
            
            # Get shift count
            shift_count = await db.shifts.count_documents(
                {"workspace_id": ws.get("id")}
            )
            
            # Get owner info
            owner = await db.users.find_one(
                {"id": ws.get("owner_id")},
                {"_id": 0, "id": 1, "name": 1, "email": 1}
            )
            
            enriched_workspaces.append({
                **ws,
                "member_count": member_count,
                "message_count": message_count,
                "shift_count": shift_count,
                "owner": owner,
                "status": ws.get("status", "active")
            })
        
        return {
            "success": True,
            "workspaces": enriched_workspaces,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": (total + limit - 1) // limit
        }
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_workspace_stats():
    """Get overall workspace statistics"""
    try:
        total_workspaces = await db.workspaces.count_documents({})
        active_workspaces = await db.workspaces.count_documents({"status": {"$ne": "suspended"}})
        suspended_workspaces = await db.workspaces.count_documents({"status": "suspended"})
        archived_workspaces = await db.workspaces.count_documents({"status": "archived"})
        
        # Get workspaces created this month
        month_start = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        new_this_month = await db.workspaces.count_documents({
            "created_at": {"$gte": month_start.isoformat()}
        })
        
        # Get total members across all workspaces
        pipeline = [
            {"$project": {"member_count": {"$size": {"$ifNull": ["$members", []]}}}},
            {"$group": {"_id": None, "total": {"$sum": "$member_count"}}}
        ]
        result = await db.workspaces.aggregate(pipeline).to_list(1)
        total_members = result[0]["total"] if result else 0
        
        # Get total messages
        total_messages = await db.workspace_messages.count_documents({})
        
        # Get total shifts
        total_shifts = await db.shifts.count_documents({})
        
        return {
            "success": True,
            "stats": {
                "total_workspaces": total_workspaces,
                "active_workspaces": active_workspaces,
                "suspended_workspaces": suspended_workspaces,
                "archived_workspaces": archived_workspaces,
                "new_this_month": new_this_month,
                "total_members": total_members,
                "total_messages": total_messages,
                "total_shifts": total_shifts
            }
        }
    except Exception as e:
        logger.error(f"Error fetching workspace stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}")
async def get_workspace_details(
    workspace_id: str,
):
    """Get detailed information about a specific workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        # Get owner details
        owner = await db.users.find_one(
            {"id": workspace.get("owner_id")},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1}
        )
        
        # Get all members with details
        member_ids = [m.get("user_id") for m in workspace.get("members", [])]
        members = await db.users.find(
            {"id": {"$in": member_ids}},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "avatar": 1}
        ).to_list(100)
        
        # Create member lookup
        member_lookup = {m["id"]: m for m in members}
        enriched_members = []
        for m in workspace.get("members", []):
            user_info = member_lookup.get(m.get("user_id"), {})
            enriched_members.append({
                **m,
                "name": user_info.get("name"),
                "email": user_info.get("email"),
                "avatar": user_info.get("avatar")
            })
        
        # Get recent messages count
        recent_messages = await db.workspace_messages.count_documents({
            "workspace_id": workspace_id,
            "created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()}
        })
        
        # Get shifts this month
        month_start = datetime.now(timezone.utc).replace(day=1)
        shifts_this_month = await db.shifts.count_documents({
            "workspace_id": workspace_id,
            "date": {"$gte": month_start.strftime("%Y-%m-%d")}
        })
        
        # Get admin notes
        notes = await db.admin_workspace_notes.find(
            {"workspace_id": workspace_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        # Get action history
        action_history = await db.admin_workspace_logs.find(
            {"workspace_id": workspace_id},
            {"_id": 0}
        ).sort("timestamp", -1).limit(20).to_list(20)
        
        return {
            "success": True,
            "workspace": {
                **workspace,
                "owner": owner,
                "members": enriched_members,
                "stats": {
                    "member_count": len(enriched_members),
                    "recent_messages": recent_messages,
                    "shifts_this_month": shifts_this_month
                },
                "admin_notes": notes,
                "action_history": action_history
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace details: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workspace_id}/action")
async def perform_workspace_action(
    workspace_id: str, 
    action: WorkspaceAction,
    admin_id: str = "admin",
):
    """Perform administrative action on a workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        
        if action.action == "suspend":
            update_data["status"] = "suspended"
            update_data["suspended_at"] = datetime.now(timezone.utc).isoformat()
            update_data["suspension_reason"] = action.reason
            message = "Workspace suspended"
            
        elif action.action == "unsuspend":
            update_data["status"] = "active"
            update_data["suspended_at"] = None
            update_data["suspension_reason"] = None
            message = "Workspace unsuspended"
            
        elif action.action == "archive":
            update_data["status"] = "archived"
            update_data["archived_at"] = datetime.now(timezone.utc).isoformat()
            message = "Workspace archived"
            
        elif action.action == "transfer_ownership":
            if not action.new_owner_id:
                raise HTTPException(status_code=400, detail="New owner ID required")
            
            # Verify new owner exists and is a member
            new_owner = await db.users.find_one({"id": action.new_owner_id})
            if not new_owner:
                raise HTTPException(status_code=404, detail="New owner not found")
            
            update_data["owner_id"] = action.new_owner_id
            message = f"Ownership transferred to {new_owner.get('name', action.new_owner_id)}"
            
        elif action.action == "delete":
            # Soft delete - mark as deleted
            update_data["status"] = "deleted"
            update_data["deleted_at"] = datetime.now(timezone.utc).isoformat()
            message = "Workspace deleted"
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid action: {action.action}")
        
        # Update workspace
        await db.workspaces.update_one({"id": workspace_id}, {"$set": update_data})
        
        # Log the action
        await log_admin_action(
            action=action.action,
            workspace_id=workspace_id,
            admin_id=admin_id,
            details={
                "reason": action.reason,
                "new_owner_id": action.new_owner_id
            }
        )
        
        return {"success": True, "message": message}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error performing workspace action: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workspace_id}/notes")
async def add_admin_note(workspace_id: str, note: WorkspaceNote, admin_id: str = "admin"):
    """Add an admin note to a workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        note_doc = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "admin_id": admin_id,
            "note": note.note,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.admin_workspace_notes.insert_one(note_doc)
        
        return {"success": True, "note": {k: v for k, v in note_doc.items() if k != "_id"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding admin note: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}/members")
async def get_workspace_members(workspace_id: str):
    """Get all members of a workspace with detailed info"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        member_ids = [m.get("user_id") for m in workspace.get("members", [])]
        members = await db.users.find(
            {"id": {"$in": member_ids}},
            {"_id": 0, "password": 0}
        ).to_list(100)
        
        # Get member roles from workspace
        role_lookup = {m.get("user_id"): m.get("role", "member") for m in workspace.get("members", [])}
        
        enriched_members = []
        for member in members:
            # Get member's shift count in this workspace
            shift_count = await db.shifts.count_documents({
                "workspace_id": workspace_id,
                "assigned_to": member.get("id")
            })
            
            # Get member's message count
            message_count = await db.workspace_messages.count_documents({
                "workspace_id": workspace_id,
                "sender_id": member.get("id")
            })
            
            enriched_members.append({
                **member,
                "workspace_role": role_lookup.get(member.get("id"), "member"),
                "shift_count": shift_count,
                "message_count": message_count,
                "is_owner": member.get("id") == workspace.get("owner_id")
            })
        
        return {"success": True, "members": enriched_members}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace members: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_member_from_workspace(workspace_id: str, user_id: str, admin_id: str = "admin"):
    """Remove a member from a workspace (admin action)"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        if workspace.get("owner_id") == user_id:
            raise HTTPException(status_code=400, detail="Cannot remove workspace owner")
        
        # Remove member
        members = [m for m in workspace.get("members", []) if m.get("user_id") != user_id]
        
        await db.workspaces.update_one(
            {"id": workspace_id},
            {"$set": {"members": members, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        
        # Log action
        await log_admin_action(
            action="remove_member",
            workspace_id=workspace_id,
            admin_id=admin_id,
            details={"removed_user_id": user_id}
        )
        
        return {"success": True, "message": "Member removed from workspace"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Import timedelta for recent messages query
from datetime import timedelta
