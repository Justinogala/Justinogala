"""
Workspace routes - workspace CRUD, members.
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel
import uuid

from config import db, logger

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


# ============== Models ==============

class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    owner_id: str
    plan: str = "free"
    color: Optional[str] = None
    icon: Optional[str] = None

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class WorkspaceMemberAdd(BaseModel):
    workspace_id: str
    email: str
    role: str = "member"
    added_by: Optional[str] = None

class WorkspaceMemberUpdate(BaseModel):
    role: str


# ============== Routes ==============

@router.get("")
async def get_workspaces(user_id: str = None):
    """Get all workspaces for a user"""
    try:
        if user_id:
            owned = await db.workspaces.find({"owner_id": user_id}, {"_id": 0}).to_list(100)
            
            memberships = await db.workspace_members.find({"user_id": user_id}, {"workspace_id": 1}).to_list(100)
            member_workspace_ids = [m["workspace_id"] for m in memberships]
            
            member_workspaces = await db.workspaces.find(
                {"id": {"$in": member_workspace_ids}, "owner_id": {"$ne": user_id}},
                {"_id": 0}
            ).to_list(100)
            
            all_workspaces = owned + member_workspaces
        else:
            all_workspaces = await db.workspaces.find({}, {"_id": 0}).to_list(100)
        
        return {"workspaces": all_workspaces}
    except Exception as e:
        logger.error(f"Error fetching workspaces: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("")
async def create_workspace(workspace: WorkspaceCreate):
    """Create a new workspace"""
    try:
        # Check entitlements
        from routes.entitlements import check_entitlement, record_usage
        check = await check_entitlement(workspace.owner_id, "workspaces", 1)
        if not check.allowed:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": "WORKSPACE_LIMIT_REACHED",
                    "message": check.message,
                    "upgrade_url": "/pricing"
                }
            )
        
        workspace_id = str(uuid.uuid4())
        
        workspace_doc = {
            "id": workspace_id,
            "name": workspace.name,
            "description": workspace.description,
            "plan": workspace.plan,
            "owner_id": workspace.owner_id,
            "color": workspace.color or "#6366f1",
            "icon": workspace.icon or None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "icon_url": None,
            "settings": {"allow_member_invites": True, "public": False}
        }
        
        await db.workspaces.insert_one(workspace_doc)
        
        # Add owner as member
        owner_member = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": workspace.owner_id,
            "role": "owner",
            "status": "active",
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        await db.workspace_members.insert_one(owner_member)
        
        if "_id" in workspace_doc:
            del workspace_doc["_id"]
        
        logger.info(f"Workspace {workspace_id} created by {workspace.owner_id}")
        return {"success": True, "workspace": workspace_doc}
    except Exception as e:
        logger.error(f"Error creating workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}")
async def get_workspace(workspace_id: str):
    """Get a single workspace"""
    try:
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        if not workspace:
            raise HTTPException(status_code=404, detail="Workspace not found")
        return workspace
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{workspace_id}")
async def update_workspace(workspace_id: str, updates: WorkspaceUpdate):
    """Update a workspace"""
    try:
        update_data = {"updated_at": datetime.now(timezone.utc).isoformat()}
        if updates.name is not None:
            update_data["name"] = updates.name
        if updates.description is not None:
            update_data["description"] = updates.description
        if updates.settings is not None:
            update_data["settings"] = updates.settings
        
        result = await db.workspaces.update_one({"id": workspace_id}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        workspace = await db.workspaces.find_one({"id": workspace_id}, {"_id": 0})
        return {"success": True, "workspace": workspace}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}")
async def delete_workspace(workspace_id: str):
    """Delete a workspace and all its members"""
    try:
        result = await db.workspaces.delete_one({"id": workspace_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Workspace not found")
        
        await db.workspace_members.delete_many({"workspace_id": workspace_id})
        
        return {"success": True, "message": "Workspace deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting workspace: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workspace_id}/members")
async def get_workspace_members(workspace_id: str):
    """Get all members of a workspace"""
    try:
        members = await db.workspace_members.find({"workspace_id": workspace_id}, {"_id": 0}).to_list(100)
        
        # Enrich with user data (batch fetch)
        user_ids = [m["user_id"] for m in members]
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "password": 0}).to_list(len(user_ids))
        user_map = {u["id"]: u for u in users}
        for member in members:
            user = user_map.get(member["user_id"])
            if user:
                member["user"] = user
        
        return {"members": members, "count": len(members)}
    except Exception as e:
        logger.error(f"Error fetching members: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{workspace_id}/members")
async def add_workspace_member(workspace_id: str, member: WorkspaceMemberAdd):
    """Add a member to workspace"""
    try:
        # Find user by email
        user = await db.users.find_one({"email": member.email.lower()})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if already a member
        existing = await db.workspace_members.find_one({
            "workspace_id": workspace_id,
            "user_id": user["id"]
        })
        if existing:
            raise HTTPException(status_code=400, detail="User is already a member")
        
        member_doc = {
            "id": str(uuid.uuid4()),
            "workspace_id": workspace_id,
            "user_id": user["id"],
            "role": member.role,
            "status": "active",
            "added_by": member.added_by,
            "joined_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.workspace_members.insert_one(member_doc)
        
        if "_id" in member_doc:
            del member_doc["_id"]
        
        member_doc["user"] = {k: v for k, v in user.items() if k != "password" and k != "_id"}
        
        return {"success": True, "member": member_doc}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{workspace_id}/members/{user_id}")
async def update_workspace_member(workspace_id: str, user_id: str, update: WorkspaceMemberUpdate):
    """Update a member's role"""
    try:
        result = await db.workspace_members.update_one(
            {"workspace_id": workspace_id, "user_id": user_id},
            {"$set": {"role": update.role}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Member not found")
        
        return {"success": True, "message": "Member updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating member: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workspace_id}/members/{user_id}")
async def remove_workspace_member(workspace_id: str, user_id: str):
    """Remove a member from workspace"""
    try:
        result = await db.workspace_members.delete_one({
            "workspace_id": workspace_id,
            "user_id": user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Member not found")
        
        return {"success": True, "message": "Member removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing member: {e}")
        raise HTTPException(status_code=500, detail=str(e))
