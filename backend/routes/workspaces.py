"""
Workspace routes - workspace CRUD, members, announcements, stats, activity.
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone, timedelta
from typing import Optional, List
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
    scope: str = "team"  # "org" or "team"

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
            "scope": workspace.scope or "team",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "icon_url": None,
            "settings": {"allow_member_invites": True, "public": workspace.scope == "org"}
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


# ============ Announcements ============

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    pinned: bool = False
    author_id: str
    author_name: str = ""


@router.get("/{workspace_id}/announcements")
async def get_announcements(workspace_id: str):
    """Get workspace announcements, pinned first."""
    announcements = await db.workspace_announcements.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort([("pinned", -1), ("created_at", -1)]).to_list(50)
    return {"announcements": announcements}


@router.post("/{workspace_id}/announcements")
async def create_announcement(workspace_id: str, req: AnnouncementCreate):
    """Create a workspace announcement."""
    doc = {
        "id": str(uuid.uuid4()),
        "workspace_id": workspace_id,
        "title": req.title,
        "content": req.content,
        "pinned": req.pinned,
        "author_id": req.author_id,
        "author_name": req.author_name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.workspace_announcements.insert_one(doc)
    return {"success": True, "announcement": {k: v for k, v in doc.items() if k != "_id"}}


@router.put("/{workspace_id}/announcements/{announcement_id}")
async def update_announcement(workspace_id: str, announcement_id: str, req: AnnouncementCreate):
    """Update an announcement."""
    update = {
        "title": req.title, "content": req.content, "pinned": req.pinned,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.workspace_announcements.update_one(
        {"id": announcement_id, "workspace_id": workspace_id}, {"$set": update}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"success": True}


@router.delete("/{workspace_id}/announcements/{announcement_id}")
async def delete_announcement(workspace_id: str, announcement_id: str):
    """Delete an announcement."""
    result = await db.workspace_announcements.delete_one(
        {"id": announcement_id, "workspace_id": workspace_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"success": True}


# ============ Stats ============

@router.get("/{workspace_id}/stats")
async def get_workspace_stats(workspace_id: str):
    """Get real-time workspace stats."""
    now = datetime.now(timezone.utc)
    week_ago = (now - timedelta(days=7)).isoformat()

    member_count = await db.workspace_members.count_documents({"workspace_id": workspace_id})
    file_count = await db.files.count_documents({"workspace_id": workspace_id})
    announcement_count = await db.workspace_announcements.count_documents({"workspace_id": workspace_id})

    # Gather member user_ids
    members = await db.workspace_members.find({"workspace_id": workspace_id}, {"user_id": 1}).to_list(200)
    member_ids = [m["user_id"] for m in members]

    # Approval count for workspace members
    approval_count = await db.approvals.count_documents({
        "$or": [{"sender_id": {"$in": member_ids}}, {"steps.approver_id": {"$in": member_ids}}],
        "status": "pending",
    })

    # Recent activity count (messages, files, approvals created in last 7 days)
    recent_messages = await db.messages.count_documents({
        "sender_id": {"$in": member_ids}, "created_at": {"$gte": week_ago}
    })
    recent_files = await db.files.count_documents({
        "workspace_id": workspace_id, "uploaded_at": {"$gte": week_ago}
    })
    recent_approvals = await db.approvals.count_documents({
        "sender_id": {"$in": member_ids}, "created_at": {"$gte": week_ago}
    })
    recent_activity = recent_messages + recent_files + recent_approvals

    return {
        "member_count": member_count,
        "file_count": file_count,
        "announcement_count": announcement_count,
        "pending_approvals": approval_count,
        "recent_activity": recent_activity,
        "recent_messages": recent_messages,
        "recent_files": recent_files,
        "recent_approvals": recent_approvals,
    }


# ============ Activity Feed ============

@router.get("/{workspace_id}/activity")
async def get_workspace_activity(workspace_id: str, limit: int = Query(30, le=100)):
    """Get recent activity feed for a workspace."""
    members = await db.workspace_members.find({"workspace_id": workspace_id}, {"user_id": 1, "role": 1}).to_list(200)
    member_ids = [m["user_id"] for m in members]
    users = await db.users.find({"id": {"$in": member_ids}}, {"_id": 0, "id": 1, "name": 1, "email": 1}).to_list(200)
    user_map = {u["id"]: u.get("name", u.get("email", "User")) for u in users}

    activities = []

    # Member joins
    for m in members:
        joined = m.get("joined_at")
        if joined:
            uid = m.get("user_id", "")
            activities.append({
                "type": "member_joined",
                "icon": "user-plus",
                "message": f"{user_map.get(uid, 'Someone')} joined the workspace",
                "user_id": uid,
                "timestamp": joined,
            })

    # Recent approvals
    recent_approvals = await db.approvals.find(
        {"sender_id": {"$in": member_ids}}, {"_id": 0, "id": 1, "title": 1, "sender_id": 1, "sender_name": 1, "status": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(limit)
    for a in recent_approvals:
        activities.append({
            "type": "approval_created",
            "icon": "file-check-2",
            "message": f"{a.get('sender_name', 'Someone')} created approval: {a.get('title', '')}",
            "user_id": a.get("sender_id"),
            "ref_id": a.get("id"),
            "status": a.get("status"),
            "timestamp": a.get("created_at", ""),
        })

    # Recent announcements
    recent_announcements = await db.workspace_announcements.find(
        {"workspace_id": workspace_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(limit)
    for ann in recent_announcements:
        activities.append({
            "type": "announcement",
            "icon": "megaphone",
            "message": f"{ann.get('author_name', 'Admin')} posted: {ann.get('title', '')}",
            "user_id": ann.get("author_id"),
            "ref_id": ann.get("id"),
            "timestamp": ann.get("created_at", ""),
        })

    # Sort all by timestamp desc
    activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

    return {"activities": activities[:limit]}
