"""
Module Permissions API - role-based templates and per-user overrides.
Super admin can control which admin modules each role can access.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from config import db, logger
from datetime import datetime, timezone

router = APIRouter(prefix="/admin/module-permissions", tags=["module-permissions"])

# All available admin modules (mapped to sidebar sections)
ALL_MODULES = [
    # Primary
    "dashboard",
    # Management
    "users", "organizations", "workspaces", "reports",
    "ir_sor_templates", "chat_moderation", "shifts", "support_tickets",
    "messages", "broadcasts", "approval_templates", "forms",
    # Billing
    "billing",
    # Configuration
    "monitoring", "security_policies", "meeting_analytics", "cloud_storage",
    "video_settings", "stripe_settings", "video_history", "api_settings",
    "transcription_settings", "integrations", "audit_logs", "general_settings",
    "pdf_editor",
    # Super admin only
    "module_permissions"
]

MODULE_LABELS = {
    "dashboard": "Dashboard",
    "users": "Users",
    "organizations": "Organizations",
    "workspaces": "Workspaces",
    "reports": "IR / SOR Reports",
    "ir_sor_templates": "IR/SOR Templates",
    "chat_moderation": "Chat Moderation",
    "shifts": "Shifts",
    "support_tickets": "Support Tickets",
    "messages": "Messages",
    "broadcasts": "Broadcasts",
    "approval_templates": "Approval Templates",
    "forms": "Forms",
    "billing": "Billing & Payments",
    "monitoring": "Monitoring",
    "security_policies": "Security Policies",
    "meeting_analytics": "Meeting Analytics",
    "cloud_storage": "Cloud Storage",
    "video_settings": "Video Settings",
    "stripe_settings": "Stripe Settings",
    "video_history": "Video History",
    "api_settings": "API Settings",
    "transcription_settings": "Transcription Settings",
    "integrations": "Integrations",
    "audit_logs": "Audit Logs",
    "general_settings": "General Settings",
    "pdf_editor": "PDF Editor",
    "module_permissions": "Module Permissions",
}

MODULE_GROUPS = {
    "Primary": ["dashboard"],
    "Management": ["users", "organizations", "workspaces", "reports", "ir_sor_templates",
                    "chat_moderation", "shifts", "support_tickets", "messages",
                    "broadcasts", "approval_templates", "forms"],
    "Billing": ["billing"],
    "Configuration": ["monitoring", "security_policies", "meeting_analytics", "cloud_storage",
                       "video_settings", "stripe_settings", "video_history", "api_settings",
                       "transcription_settings", "integrations", "audit_logs", "general_settings"],
    "Tools": ["pdf_editor"],
    "Super Admin": ["module_permissions"],
}

# Default role templates
DEFAULT_TEMPLATES = {
    "super_admin": {m: True for m in ALL_MODULES},
    "admin": {
        "dashboard": True,
        "users": True, "organizations": True, "workspaces": True,
        "reports": True, "ir_sor_templates": True,
        "chat_moderation": True, "shifts": True,
        "support_tickets": True, "messages": True, "broadcasts": False,
        "approval_templates": False, "forms": True,
        "billing": False,
        "monitoring": False, "security_policies": False,
        "meeting_analytics": True, "cloud_storage": False,
        "video_settings": False, "stripe_settings": False,
        "video_history": False, "api_settings": False,
        "transcription_settings": False, "integrations": False,
        "audit_logs": False, "general_settings": False,
        "pdf_editor": True,
        "module_permissions": False,
    },
    "manager": {
        "dashboard": True,
        "users": False, "organizations": False, "workspaces": True,
        "reports": True, "ir_sor_templates": False,
        "chat_moderation": True, "shifts": True,
        "support_tickets": True, "messages": True, "broadcasts": False,
        "approval_templates": False, "forms": True,
        "billing": False,
        "monitoring": False, "security_policies": False,
        "meeting_analytics": True, "cloud_storage": False,
        "video_settings": False, "stripe_settings": False,
        "video_history": False, "api_settings": False,
        "transcription_settings": False, "integrations": False,
        "audit_logs": False, "general_settings": False,
        "pdf_editor": True,
        "module_permissions": False,
    },
    "user": {
        "dashboard": True,
        "users": False, "organizations": False, "workspaces": True,
        "reports": False, "ir_sor_templates": False,
        "chat_moderation": False, "shifts": True,
        "support_tickets": True, "messages": True, "broadcasts": False,
        "approval_templates": False, "forms": True,
        "billing": False,
        "monitoring": False, "security_policies": False,
        "meeting_analytics": False, "cloud_storage": False,
        "video_settings": False, "stripe_settings": False,
        "video_history": False, "api_settings": False,
        "transcription_settings": False, "integrations": False,
        "audit_logs": False, "general_settings": False,
        "pdf_editor": False,
        "module_permissions": False,
    },
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


async def get_effective_permissions(user_id: str, role: str) -> dict:
    """Get effective module permissions for a user. Used by login route."""
    role_key = role.lower().replace(" ", "_")

    # Super admin always gets everything
    if role_key == "super_admin":
        return {m: True for m in ALL_MODULES}

    # Check per-user override first
    override = await db["module_permission_overrides"].find_one(
        {"user_id": user_id}, {"_id": 0}
    )
    if override and override.get("permissions"):
        return override["permissions"]

    # Fall back to role template from DB
    await _ensure_templates()
    template = await db["module_permission_templates"].find_one(
        {"role": role_key}, {"_id": 0}
    )
    if template and template.get("permissions"):
        return template["permissions"]

    # Final fallback — default template
    return DEFAULT_TEMPLATES.get(role_key, DEFAULT_TEMPLATES.get("admin", {}))


@router.get("/modules")
async def get_all_modules():
    """Get list of all modules with labels and groups."""
    return {
        "modules": [{"key": k, "label": MODULE_LABELS.get(k, k)} for k in ALL_MODULES],
        "groups": MODULE_GROUPS,
    }


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
    if role == "super_admin":
        raise HTTPException(status_code=403, detail="Cannot modify super_admin template")

    valid_roles = [r for r in DEFAULT_TEMPLATES if r != "super_admin"]
    if role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role: {role}")

    for key in body.permissions:
        if key not in ALL_MODULES:
            raise HTTPException(status_code=400, detail=f"Invalid module: {key}")

    await _ensure_templates()

    # Get old permissions for diff
    old_template = await db["module_permission_templates"].find_one({"role": role}, {"_id": 0})
    old_perms = old_template.get("permissions", {}) if old_template else {}

    await db["module_permission_templates"].update_one(
        {"role": role},
        {"$set": {"permissions": body.permissions, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )

    # Build change diff
    changes = []
    for mod_key in ALL_MODULES:
        old_val = old_perms.get(mod_key, False)
        new_val = body.permissions.get(mod_key, False)
        if old_val != new_val:
            changes.append({
                "module": mod_key,
                "label": MODULE_LABELS.get(mod_key, mod_key),
                "from": old_val,
                "to": new_val,
            })

    # Log the change
    if changes:
        await db["permission_audit_log"].insert_one({
            "action": "template_update",
            "role": role,
            "changes": changes,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    return {"message": f"Template for '{role}' updated", "permissions": body.permissions}


@router.get("/user/{user_id}")
async def get_user_permissions(user_id: str):
    """Get effective permissions for a user (override > template > default)."""
    user = await db["users"].find_one(
        {"id": user_id}, {"_id": 0, "id": 1, "role": 1, "name": 1, "email": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = (user.get("role") or "User").lower().replace(" ", "_")
    perms = await get_effective_permissions(user_id, user.get("role", "User"))

    # Check per-user override
    override = await db["module_permission_overrides"].find_one(
        {"user_id": user_id}, {"_id": 0}
    )
    source = "override" if (override and override.get("permissions")) else "template"

    return {
        "user_id": user_id,
        "role": role,
        "source": source,
        "permissions": perms
    }


class UserPermissionUpdate(BaseModel):
    permissions: dict


@router.put("/user/{user_id}")
async def set_user_permissions(user_id: str, body: UserPermissionUpdate):
    """Set per-user permission override."""
    user = await db["users"].find_one({"id": user_id}, {"_id": 0, "id": 1, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    for key in body.permissions:
        if key not in ALL_MODULES:
            raise HTTPException(status_code=400, detail=f"Invalid module: {key}")

    # Get old override for diff
    old_override = await db["module_permission_overrides"].find_one({"user_id": user_id}, {"_id": 0})
    old_perms = old_override.get("permissions", {}) if old_override else {}

    await db["module_permission_overrides"].update_one(
        {"user_id": user_id},
        {"$set": {
            "user_id": user_id,
            "permissions": body.permissions,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )

    # Log the change
    changes = []
    for mod_key in ALL_MODULES:
        old_val = old_perms.get(mod_key, None)
        new_val = body.permissions.get(mod_key, None)
        if old_val != new_val and new_val is not None:
            changes.append({
                "module": mod_key,
                "label": MODULE_LABELS.get(mod_key, mod_key),
                "from": old_val,
                "to": new_val,
            })

    if changes:
        await db["permission_audit_log"].insert_one({
            "action": "user_override",
            "user_id": user_id,
            "user_email": user.get("email", ""),
            "changes": changes,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    return {"message": "User permissions updated", "user_id": user_id, "permissions": body.permissions}


@router.delete("/user/{user_id}")
async def reset_user_permissions(user_id: str):
    """Remove per-user override so user falls back to role template."""
    await db["module_permission_overrides"].delete_one({"user_id": user_id})

    # Log the reset
    await db["permission_audit_log"].insert_one({
        "action": "user_override_reset",
        "user_id": user_id,
        "changes": [],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })

    return {"message": "User permissions reset to role template"}


@router.get("/audit-log")
async def get_permission_audit_log(
    limit: int = 50,
    skip: int = 0
):
    """Get the permission change audit log."""
    logs = await db["permission_audit_log"].find(
        {}, {"_id": 0}
    ).sort("timestamp", -1).skip(skip).limit(limit).to_list(limit)

    total = await db["permission_audit_log"].count_documents({})

    return {"logs": logs, "total": total}
