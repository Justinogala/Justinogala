"""
Universal Trash / Recycle Bin for Super Admin.
Provides soft-delete, restore, and permanent delete for all resource types.
"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from config import db, logger
from routes.auth import get_current_user

router = APIRouter(prefix="/admin/trash", tags=["Admin Trash"])

# Resource type → MongoDB collection mapping
RESOURCE_MAP = {
    "users": {"collection": "users", "label": "User", "name_field": "name", "id_field": "id"},
    "workspaces": {"collection": "workspaces", "label": "Workspace", "name_field": "name", "id_field": "id"},
    "organizations": {"collection": "organizations", "label": "Organization", "name_field": "name", "id_field": "id"},
    "approvals": {"collection": "approvals", "label": "Approval", "name_field": "title", "id_field": "id"},
    "approval_templates": {"collection": "approval_templates", "label": "Approval Template", "name_field": "title", "id_field": "id"},
    "incident_reports": {"collection": "incident_reports", "label": "IR/SOR Report", "name_field": "title", "id_field": "id"},
    "ir_sor_templates": {"collection": "ir_sor_templates", "label": "IR/SOR Template", "name_field": "title", "id_field": "id"},
    "shifts": {"collection": "shifts", "label": "Shift", "name_field": "title", "id_field": "id"},
    "meetings": {"collection": "meetings", "label": "Meeting", "name_field": "title", "id_field": "id"},
    "documents": {"collection": "documents", "label": "Document", "name_field": "title", "id_field": "id"},
    "presentations": {"collection": "presentations", "label": "Presentation", "name_field": "title", "id_field": "id"},
    "sheets": {"collection": "sheets", "label": "Spreadsheet", "name_field": "title", "id_field": "id"},
    "form_templates": {"collection": "form_templates", "label": "Form Template", "name_field": "title", "id_field": "id"},
}


def _super_admin_check(user: dict):
    role = (user.get("role") or "").lower().replace(" ", "_")
    if role != "super_admin":
        raise HTTPException(403, "Super Admin access required")


@router.get("/summary")
async def get_trash_summary(user: dict = Depends(get_current_user)):
    """Get count of trashed items per resource type."""
    _super_admin_check(user)
    summary = {}
    for rtype, cfg in RESOURCE_MAP.items():
        try:
            count = await db[cfg["collection"]].count_documents({"deleted": True})
            summary[rtype] = count
        except Exception:
            summary[rtype] = 0
    return {"summary": summary, "total": sum(summary.values())}


@router.get("/{resource_type}")
async def list_trashed_items(resource_type: str, skip: int = 0, limit: int = 50, user: dict = Depends(get_current_user)):
    """List all soft-deleted items of a specific resource type."""
    _super_admin_check(user)
    cfg = RESOURCE_MAP.get(resource_type)
    if not cfg:
        raise HTTPException(400, f"Unknown resource type: {resource_type}")

    items = await db[cfg["collection"]].find(
        {"deleted": True}, {"_id": 0}
    ).sort("deleted_at", -1).skip(skip).limit(limit).to_list(limit)

    total = await db[cfg["collection"]].count_documents({"deleted": True})

    # Normalize items for frontend
    normalized = []
    for item in items:
        normalized.append({
            "id": item.get(cfg["id_field"], ""),
            "name": item.get(cfg["name_field"], item.get("email", item.get("date", "Untitled"))),
            "type": resource_type,
            "type_label": cfg["label"],
            "deleted_at": item.get("deleted_at", ""),
            "deleted_by": item.get("deleted_by", ""),
            "extra": _get_extra_info(item, resource_type),
            "raw": {k: v for k, v in item.items() if k in ["email", "role", "status", "workspace_id", "date", "start_time", "end_time", "created_at"]},
        })

    return {"items": normalized, "total": total}


@router.post("/{resource_type}/{item_id}/restore")
async def restore_item(resource_type: str, item_id: str, user: dict = Depends(get_current_user)):
    """Restore a soft-deleted item."""
    _super_admin_check(user)
    cfg = RESOURCE_MAP.get(resource_type)
    if not cfg:
        raise HTTPException(400, f"Unknown resource type: {resource_type}")

    item = await db[cfg["collection"]].find_one({cfg["id_field"]: item_id, "deleted": True})
    if not item:
        raise HTTPException(404, f"{cfg['label']} not found in trash")

    # Restore: remove deleted flag, restore previous status if applicable
    update = {
        "$unset": {"deleted": "", "deleted_at": "", "deleted_by": ""},
    }
    # For users, restore previous status
    if resource_type == "users" and item.get("pre_delete_status"):
        update["$set"] = {"status": item.get("pre_delete_status", "Active")}
        update["$unset"]["pre_delete_status"] = ""

    await db[cfg["collection"]].update_one({cfg["id_field"]: item_id}, update)

    logger.info(f"Restored {cfg['label']} {item_id} by {user.get('email', user.get('id'))}")
    return {"success": True, "message": f"{cfg['label']} restored successfully"}


@router.delete("/{resource_type}/empty/all")
async def empty_trash_for_type(resource_type: str, user: dict = Depends(get_current_user)):
    """Permanently delete ALL trashed items of a specific type."""
    _super_admin_check(user)
    cfg = RESOURCE_MAP.get(resource_type)
    if not cfg:
        raise HTTPException(400, f"Unknown resource type: {resource_type}")

    result = await db[cfg["collection"]].delete_many({"deleted": True})
    logger.info(f"Emptied trash for {resource_type}: {result.deleted_count} items by {user.get('email', user.get('id'))}")
    return {"success": True, "deleted_count": result.deleted_count}


@router.delete("/{resource_type}/{item_id}")
async def permanent_delete(resource_type: str, item_id: str, user: dict = Depends(get_current_user)):
    """Permanently delete an item from trash. This cannot be undone."""
    _super_admin_check(user)
    cfg = RESOURCE_MAP.get(resource_type)
    if not cfg:
        raise HTTPException(400, f"Unknown resource type: {resource_type}")

    item = await db[cfg["collection"]].find_one({cfg["id_field"]: item_id, "deleted": True})
    if not item:
        raise HTTPException(404, f"{cfg['label']} not found in trash")

    # Permanently delete
    await db[cfg["collection"]].delete_one({cfg["id_field"]: item_id})

    # Cleanup related data for certain types
    await _cleanup_related(resource_type, item_id, item)

    logger.info(f"Permanently deleted {cfg['label']} {item_id} by {user.get('email', user.get('id'))}")
    return {"success": True, "message": f"{cfg['label']} permanently deleted"}


def _get_extra_info(item: dict, rtype: str) -> str:
    """Get human-readable extra info for display."""
    if rtype == "users":
        return item.get("email", "")
    elif rtype == "workspaces":
        return f"{item.get('members_count', 0)} members"
    elif rtype == "shifts":
        return f"{item.get('date', '')} {item.get('start_time', '')} - {item.get('end_time', '')}"
    elif rtype == "organizations":
        return item.get("domain", "")
    elif rtype in ("documents", "presentations", "sheets"):
        return f"Workspace: {item.get('workspace_id', 'N/A')}"
    elif rtype == "meetings":
        return item.get("date", "")
    return ""


async def _cleanup_related(rtype: str, item_id: str, item: dict):
    """Clean up related data when permanently deleting."""
    try:
        if rtype == "users":
            uid = item.get("id")
            await db.ai_conversations.delete_many({"user_id": uid})
            await db.ai_messages.delete_many({"user_id": uid})
            await db.notifications.delete_many({"user_id": uid})
        elif rtype == "workspaces":
            wid = item.get("id")
            await db.workspace_members.delete_many({"workspace_id": wid})
        elif rtype == "meetings":
            mid = item.get("id")
            await db.meeting_transcripts.delete_many({"meeting_id": mid})
    except Exception as e:
        logger.error(f"Cleanup related data error for {rtype}/{item_id}: {e}")


# ── Helper: Soft-delete function (used by other routes) ──

async def soft_delete_item(collection: str, query: dict, deleted_by: str = ""):
    """Generic soft-delete: sets deleted=True, deleted_at, deleted_by."""
    now = datetime.now(timezone.utc).isoformat()
    result = await db[collection].update_one(
        query,
        {"$set": {"deleted": True, "deleted_at": now, "deleted_by": deleted_by}}
    )
    return result.modified_count > 0
