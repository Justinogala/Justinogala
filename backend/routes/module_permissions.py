"""
Module Permissions API - role-based templates and per-user overrides.
Super admin can control which modules each role/user can access.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from config import db, logger
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/module-permissions", tags=["module-permissions"])

# All available modules
ALL_MODULES = [
    "dashboard", "quick_record", "text_to_audio", "text_to_video",
    "calendar", "meetings", "transcriptions", "voice_chat",
    "workspaces", "chat", "messages", "files",
    "esignature", "approvals", "reports",
    "support_tickets", "admin_panel"
]

# Default role templates
DEFAULT_TEMPLATES = {
    "user": {
        "dashboard": True, "quick_record": False, "text_to_audio": False,
        "text_to_video": False, "calendar": False, "meetings": False,
        "transcriptions": False, "voice_chat": False, "workspaces": True,
        "chat": True, "messages": True, "files": False,
        "esignature": False, "approvals": False, "reports": False,
        "support_tickets": False, "admin_panel": False
    },
    "admin": {
        "dashboard": True, "quick_record": True, "text_to_audio": True,
        "text_to_video": True, "calendar": True, "meetings": True,
        "transcriptions": True, "voice_chat": True, "workspaces": True,
        "chat": True, "messages": True, "files": True,
        "esignature": True, "approvals": True, "reports": True,
        "support_tickets": True, "admin_panel": False
    },
    "manager": {
        "dashboard": True, "quick_record": True, "text_to_audio": True,
        "text_to_video": True, "calendar": True, "meetings": True,
        "transcriptions": True, "voice_chat": True, "workspaces": True,
        "chat": True, "messages": True, "files": True,
        "esignature": True, "approvals": True, "reports": True,
        "support_tickets": True, "admin_panel": False
    },
    "super_admin": {
        "dashboard": True, "quick_record": True, "text_to_audio": True,
        "text_to_video": True, "calendar": True, "meetings": True,
        "transcriptions": True, "voice_chat": True, "workspaces": True,
        "chat": True, "messages": True, "files": True,
        "esignature": True, "approvals": True, "reports": True,
        "support_tickets": True, "admin_panel": True
    },
}

MODULE_LABELS = {
    "dashboard": "Dashboard",
    "quick_record": "Quick Record",
    "text_to_audio": "Text to Audio",
    "text_to_video": "Text to Video",
    "calendar": "Calendar",
    "meetings": "Meetings",
    "transcriptions": "Transcriptions",
    "voice_chat": "Voice Chat",
    "workspaces": "Workspaces",
    "chat": "Chat",
    "messages": "Messages",
    "files": "Files",
    "esignature": "eSignature",
    "approvals": "Approvals",
    "reports": "IR / SOR Reports",
    "support_tickets": "Support Tickets",
    "admin_panel": "Admin Panel",
}


async def _ensure_templates():
    """Seed default role templates if they don't exist."""
    for role, perms in DEFAULT_TEMPLATES.items():
        existing = await db["module_permission_templates"].find_one({"role": role}, {"_id": 0})
        if not existing:
            await db["module_permission_templates"].insert_one({
                "role": role,
                "permissions": perms,
                "updated_at": datetime.now(timezone.utc).isoformat()
            })


@router.get("/modules")
async def get_all_modules():
    """Get list of all modules with labels."""
    return {"modules": [{"key": k, "label": MODULE_LABELS.get(k, k)} for k in ALL_MODULES]}


@router.get("/templates")
async def get_role_templates():
    """Get all role-based permission templates."""
    await _ensure_templates()
    templates = await db["module_permission_templates"].find(
        {}, {"_id": 0}
    ).to_list(10)
    return {"templates": templates}


class TemplateUpdate(BaseModel):
    permissions: dict


@router.put("/templates/{role}")
async def update_role_template(role: str, body: TemplateUpdate):
    """Update a role template. Only super_admin should call this."""
    if role not in DEFAULT_TEMPLATES:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    # Validate all keys are valid modules
    for key in body.permissions:
        if key not in ALL_MODULES:
            raise HTTPException(status_code=400, detail=f"Invalid module: {key}")

    await _ensure_templates()
    await db["module_permission_templates"].update_one(
        {"role": role},
        {"$set": {"permissions": body.permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Also update all users of this role who don't have per-user overrides
    users_of_role = await db["users"].find(
        {"role": {"$regex": f"^{role}$", "$options": "i"}},
        {"_id": 0, "id": 1}
    ).to_list(1000)

    for u in users_of_role:
        override = await db["module_permission_overrides"].find_one({"user_id": u["id"]}, {"_id": 0})
        if not override:
            # No override — they inherit from template, no action needed
            pass

    return {"message": f"Template for '{role}' updated", "permissions": body.permissions}


@router.get("/user/{user_id}")
async def get_user_permissions(user_id: str):
    """Get effective permissions for a user (override > template > default)."""
    user = await db["users"].find_one({"id": user_id}, {"_id": 0, "id": 1, "role": 1, "name": 1, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = (user.get("role") or "User").lower()

    # Check per-user override first
    override = await db["module_permission_overrides"].find_one({"user_id": user_id}, {"_id": 0})
    if override and override.get("permissions"):
        return {
            "user_id": user_id,
            "role": role,
            "source": "override",
            "permissions": override["permissions"]
        }

    # Fall back to role template
    await _ensure_templates()
    template = await db["module_permission_templates"].find_one({"role": role}, {"_id": 0})
    if template:
        return {
            "user_id": user_id,
            "role": role,
            "source": "template",
            "permissions": template["permissions"]
        }

    # Final fallback — default user template
    return {
        "user_id": user_id,
        "role": role,
        "source": "default",
        "permissions": DEFAULT_TEMPLATES.get("user", {})
    }


class UserPermissionUpdate(BaseModel):
    permissions: dict


@router.put("/user/{user_id}")
async def set_user_permissions(user_id: str, body: UserPermissionUpdate):
    """Set per-user permission override."""
    user = await db["users"].find_one({"id": user_id}, {"_id": 0, "id": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key in body.permissions:
        if key not in ALL_MODULES:
            raise HTTPException(status_code=400, detail=f"Invalid module: {key}")

    await db["module_permission_overrides"].update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "permissions": body.permissions,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    return {"message": "User permissions updated", "user_id": user_id, "permissions": body.permissions}


@router.delete("/user/{user_id}")
async def reset_user_permissions(user_id: str):
    """Remove per-user override so user falls back to role template."""
    await db["module_permission_overrides"].delete_one({"user_id": user_id})
    return {"message": "User permissions reset to role template"}
