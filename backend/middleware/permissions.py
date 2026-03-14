"""
Permission middleware for role-based access control.
Provides decorators and dependencies for checking user permissions.
"""
from functools import wraps
from typing import List, Optional, Callable
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import db
from models import DEFAULT_PERMISSIONS

security = HTTPBearer(auto_error=False)


# ============== Permission Checking Functions ==============

def has_permission(user_permissions: dict, category: str, action: str) -> bool:
    """Check if user has a specific permission"""
    if not user_permissions:
        return False
    
    category_perms = user_permissions.get(category, {})
    return category_perms.get(action, False)


def has_any_permission(user_permissions: dict, category: str, actions: List[str]) -> bool:
    """Check if user has any of the specified permissions in a category"""
    if not user_permissions:
        return False
    
    category_perms = user_permissions.get(category, {})
    return any(category_perms.get(action, False) for action in actions)


def has_all_permissions(user_permissions: dict, category: str, actions: List[str]) -> bool:
    """Check if user has all of the specified permissions in a category"""
    if not user_permissions:
        return False
    
    category_perms = user_permissions.get(category, {})
    return all(category_perms.get(action, False) for action in actions)


def is_admin_or_has_permission(user: dict, category: str, action: str) -> bool:
    """Check if user is admin or has specific permission"""
    if user.get("role") == "Admin":
        # Check if admin has the specific permission (they can have custom restrictions)
        permissions = user.get("permissions", DEFAULT_PERMISSIONS.get("Admin", {}))
        return has_permission(permissions, category, action)
    
    permissions = user.get("permissions", {})
    return has_permission(permissions, category, action)


# ============== FastAPI Dependencies ==============

async def get_user_with_permissions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user with their permissions loaded"""
    import jwt
    from config import JWT_SECRET_KEY, JWT_ALGORITHM
    
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    # If user doesn't have permissions set, use defaults based on role
    if not user.get("permissions"):
        user["permissions"] = DEFAULT_PERMISSIONS.get(user.get("role", "User"), DEFAULT_PERMISSIONS["User"])
    
    return user


def require_permission(category: str, action: str):
    """
    Dependency factory that requires a specific permission.
    
    Usage:
        @router.get("/users")
        async def list_users(user: dict = Depends(require_permission("users", "view"))):
            ...
    """
    async def permission_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        user = await get_user_with_permissions(credentials)
        
        if not is_admin_or_has_permission(user, category, action):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: requires {category}.{action}"
            )
        
        return user
    
    return permission_checker


def require_any_permission(category: str, actions: List[str]):
    """
    Dependency factory that requires any of the specified permissions.
    
    Usage:
        @router.get("/users")
        async def manage_users(user: dict = Depends(require_any_permission("users", ["view", "edit"]))):
            ...
    """
    async def permission_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        user = await get_user_with_permissions(credentials)
        permissions = user.get("permissions", {})
        
        if not has_any_permission(permissions, category, actions):
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: requires one of {category}.{actions}"
            )
        
        return user
    
    return permission_checker


def require_role(roles: List[str]):
    """
    Dependency factory that requires user to have one of the specified roles.
    
    Usage:
        @router.delete("/users/{id}")
        async def delete_user(user: dict = Depends(require_role(["Admin"]))):
            ...
    """
    async def role_checker(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        user = await get_user_with_permissions(credentials)
        
        if user.get("role") not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Permission denied: requires role {roles}"
            )
        
        return user
    
    return role_checker


def require_admin():
    """Shorthand dependency for requiring Admin role"""
    return require_role(["Admin"])


def require_manager_or_admin():
    """Shorthand dependency for requiring Manager or Admin role"""
    return require_role(["Admin", "Manager"])


# ============== Permission Categories ==============

class Permissions:
    """Permission constants for easy reference"""
    
    # Dashboard
    DASHBOARD_VIEW = ("dashboard", "view")
    DASHBOARD_ANALYTICS = ("dashboard", "analytics")
    
    # Users
    USERS_VIEW = ("users", "view")
    USERS_CREATE = ("users", "create")
    USERS_EDIT = ("users", "edit")
    USERS_DELETE = ("users", "delete")
    
    # Workspaces
    WORKSPACES_VIEW = ("workspaces", "view")
    WORKSPACES_MANAGE = ("workspaces", "manage")
    WORKSPACES_SUSPEND = ("workspaces", "suspend")
    WORKSPACES_DELETE = ("workspaces", "delete")
    
    # Chat Moderation
    CHAT_VIEW = ("chat_moderation", "view")
    CHAT_FLAG = ("chat_moderation", "flag")
    CHAT_DELETE = ("chat_moderation", "delete")
    CHAT_EXPORT = ("chat_moderation", "export")
    
    # Shifts
    SHIFTS_VIEW = ("shifts", "view")
    SHIFTS_MANAGE = ("shifts", "manage")
    SHIFTS_OVERRIDE = ("shifts", "override")
    SHIFTS_EXPORT = ("shifts", "export")
    
    # Billing
    BILLING_VIEW = ("billing", "view")
    BILLING_MANAGE = ("billing", "manage")
    BILLING_REFUNDS = ("billing", "refunds")
    
    # Settings
    SETTINGS_VIEW = ("settings", "view")
    SETTINGS_MODIFY = ("settings", "modify")
    SETTINGS_SECURITY = ("settings", "security")
    
    # Support
    SUPPORT_VIEW = ("support", "view")
    SUPPORT_RESPOND = ("support", "respond")
    
    # Messages
    MESSAGES_VIEW = ("messages", "view")
    MESSAGES_SEND = ("messages", "send")
    MESSAGES_BROADCAST = ("messages", "broadcast")
