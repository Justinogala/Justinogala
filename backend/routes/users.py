"""
User management routes.
"""
from fastapi import APIRouter, HTTPException, Query, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import bcrypt
import os
import requests

from config import db, logger
from models import UserCreate, UserUpdate, DEFAULT_PERMISSIONS

router = APIRouter(prefix="/users", tags=["Users"])
security = HTTPBearer(auto_error=False)

# ============== Object Storage for Avatars ==============
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
_avatar_storage_key = None

def _get_storage_key():
    global _avatar_storage_key
    if _avatar_storage_key:
        return _avatar_storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        _avatar_storage_key = resp.json()["storage_key"]
        return _avatar_storage_key
    except Exception as e:
        logger.error(f"Avatar storage init failed: {e}")
        return None

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_AVATAR_SIZE = 5 * 1024 * 1024  # 5 MB



@router.get("/permissions/defaults")
async def get_default_permissions():
    """Get default permissions for each role"""
    return {
        "success": True,
        "permissions": DEFAULT_PERMISSIONS
    }

@router.get("/permissions/{role}")
async def get_role_permissions(role: str):
    """Get default permissions for a specific role"""
    if role not in DEFAULT_PERMISSIONS:
        raise HTTPException(status_code=404, detail=f"Role '{role}' not found")
    return {
        "success": True,
        "role": role,
        "permissions": DEFAULT_PERMISSIONS[role]
    }


@router.get("")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get users. Admin/Manager see only their org members. Super_Admin sees all."""
    caller_role = None
    caller_org_id = None
    if credentials:
        try:
            from routes.auth import verify_jwt_token
            payload = verify_jwt_token(credentials.credentials)
            caller = await db.users.find_one(
                {"id": payload["sub"]},
                {"_id": 0, "role": 1, "organization_id": 1}
            )
            if caller:
                caller_role = (caller.get("role") or "").lower().replace(" ", "_")
                caller_org_id = caller.get("organization_id")
        except Exception:
            pass

    query_filter = {"deleted": {"$ne": True}}
    # Admin/Manager with an org → see only their organization members
    if caller_role in ("admin", "manager"):
        if caller_org_id:
            query_filter["organization_id"] = caller_org_id
        else:
            # Admin without org → see only other admins/managers (no regular users)
            query_filter["role"] = {"$in": ["Admin", "Manager", "Super_Admin", "admin", "manager", "super_admin"]}

    users = await db.users.find(
        query_filter,
        {"_id": 0, "password": 0}
    ).skip(skip).limit(limit).to_list(limit)
    
    return users

@router.get("/search")
async def search_users(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Search users by name or email"""
    query = {
        "deleted": {"$ne": True},
        "$or": [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
    }
    
    users = await db.users.find(
        query,
        {"_id": 0, "password": 0}
    ).limit(limit).to_list(limit)
    
    return users

@router.get("/by-email/{email}")
async def get_user_by_email(email: str):
    """Get user by email"""
    user = await db.users.find_one(
        {"email": email.lower()},
        {"_id": 0, "password": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/{user_id}")
async def get_user(user_id: str):
    """Get a single user by ID"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password": 0}
    )
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.put("/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate):
    """Update a user"""
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = {k: v for k, v in user_update.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    updated_user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "password": 0}
    )
    
    return updated_user


@router.post("/{user_id}/avatar")
async def upload_avatar(user_id: str, file: UploadFile = File(...)):
    """Upload or replace a user's profile picture"""
    existing = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="User not found")

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF images are allowed")

    data = await file.read()
    if len(data) > MAX_AVATAR_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    key = _get_storage_key()
    if not key:
        raise HTTPException(status_code=503, detail="Storage service unavailable")

    ext = file.filename.rsplit(".", 1)[-1] if "." in (file.filename or "") else "png"
    storage_path = f"munal-echonote/avatars/{user_id}.{ext}"

    try:
        resp = requests.put(
            f"{STORAGE_URL}/objects/{storage_path}",
            headers={"X-Storage-Key": key, "Content-Type": file.content_type},
            data=data, timeout=60,
        )
        resp.raise_for_status()
    except Exception as e:
        logger.error(f"Avatar upload failed for {user_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

    avatar_url = f"/api/users/{user_id}/avatar/image"

    await db.users.update_one(
        {"id": user_id},
        {"$set": {"avatar": avatar_url, "avatar_storage_path": storage_path, "updated_at": datetime.now(timezone.utc)}}
    )

    return {"success": True, "avatar_url": avatar_url}


@router.get("/{user_id}/avatar/image")
async def serve_avatar(user_id: str):
    """Serve a user's avatar image from object storage"""
    from fastapi.responses import Response as FastResponse
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0, "avatar_storage_path": 1})
    if not user_doc or not user_doc.get("avatar_storage_path"):
        raise HTTPException(status_code=404, detail="No avatar found")

    key = _get_storage_key()
    if not key:
        raise HTTPException(status_code=503, detail="Storage unavailable")

    try:
        resp = requests.get(
            f"{STORAGE_URL}/objects/{user_doc['avatar_storage_path']}",
            headers={"X-Storage-Key": key}, timeout=30,
        )
        resp.raise_for_status()
    except Exception:
        raise HTTPException(status_code=404, detail="Avatar file not found")

    ct = resp.headers.get("Content-Type", "image/png")
    return FastResponse(content=resp.content, media_type=ct, headers={"Cache-Control": "public, max-age=3600"})


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Soft-delete a user (move to trash)"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "email": 1})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "deleted": True,
            "deleted_at": datetime.now(timezone.utc).isoformat(),
            "pre_delete_status": user.get("status", "Active"),
            "status": "Deleted",
        }}
    )
    return {"message": "User moved to trash"}

@router.post("")
async def create_user(user: UserCreate):
    """Create a new user (admin endpoint)"""
    existing = await db.users.find_one({"email": user.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    # Get default permissions for role if not provided
    permissions = user.permissions if user.permissions else DEFAULT_PERMISSIONS.get(user.role, DEFAULT_PERMISSIONS["User"])
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email.lower(),
        "password": bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8'),
        "name": user.name,
        "role": user.role,
        "status": user.status,
        "plan": user.plan,
        "account_type": user.account_type or "personal",
        "organization_id": user.organization_id,
        "permissions": permissions,
        "avatar": None,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    user_doc.pop("password")
    user_doc.pop("_id", None)
    
    return user_doc



@router.get("/{user_id}/onboarding")
async def get_onboarding_status(user_id: str):
    """Check if user has completed onboarding"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "onboarding_completed": 1})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {"onboarding_completed": user.get("onboarding_completed", False)}


@router.put("/{user_id}/onboarding")
async def update_onboarding_status(user_id: str):
    """Mark onboarding as completed"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"onboarding_completed": True, "onboarding_completed_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "onboarding_completed": True}


@router.delete("/{user_id}/onboarding")
async def reset_onboarding(user_id: str):
    """Reset onboarding so user can replay the tour"""
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"onboarding_completed": False}, "$unset": {"onboarding_completed_at": ""}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "onboarding_completed": False}
