"""
User management routes.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone
from typing import List, Optional
import uuid
import bcrypt

from config import db, logger
from models import UserCreate, UserUpdate, DEFAULT_PERMISSIONS

router = APIRouter(prefix="/users", tags=["Users"])
security = HTTPBearer(auto_error=False)



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
    """Get users. Admin/Manager only see Admin+Manager users. Super_Admin sees all."""
    caller_role = None
    if credentials:
        try:
            from routes.auth import verify_jwt_token
            payload = verify_jwt_token(credentials.credentials)
            caller = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "role": 1})
            if caller:
                caller_role = (caller.get("role") or "").lower().replace(" ", "_")
        except Exception:
            pass

    query_filter = {}
    # Admin and Manager can only see Admin, Manager, and Super_Admin users
    if caller_role in ("admin", "manager"):
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

@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user"""
    result = await db.users.delete_one({"id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

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
