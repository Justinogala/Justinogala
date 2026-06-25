"""
Authentication routes - login, register, password reset, email verification.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
import uuid
import jwt
import asyncio
from services.audit import log_audit_event, get_client_ip

from config import db, JWT_SECRET_KEY, JWT_ALGORITHM, logger
from models import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest
from security import limiter, sanitize_text, guard_mongo_query, validate_password, log_audit, validate_name, validate_email_domain

# Import helpers and emails from extracted modules
from routes.auth_helpers import (
    hash_password, verify_password, generate_temp_password, generate_verification_code,
    create_jwt_token, create_refresh_token, get_client_ip_from_request as _get_client_ip,
    verify_jwt_token, get_current_user, get_optional_user, security,
)
from routes.auth_emails import send_verification_email, send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ============== Routes ==============

@router.post("/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user: UserCreate, invite_token: Optional[str] = Query(None)):
    """Register a new user - no email verification required"""
    # Sanitize inputs
    email = guard_mongo_query(user.email.lower())
    name = sanitize_text(user.name) if user.name else ""

    # Validate name against spam/bots
    name_error = validate_name(name)
    if name_error:
        raise HTTPException(status_code=400, detail=name_error)

    # Block disposable/spam email domains
    email_error = validate_email_domain(email)
    if email_error:
        raise HTTPException(status_code=400, detail=email_error)

    # Enforce password policy on new registrations
    pw_error = validate_password(user.password)
    if pw_error:
        await log_audit("register_failed", user_email=email, details=f"Password policy: {pw_error}",
                        ip=_get_client_ip(request), success=False)
        raise HTTPException(status_code=400, detail=pw_error)

    # Check if password appears in known data breaches
    from utils.breach_check import check_password_breached
    is_breached, breach_count = await check_password_breached(user.password)
    if is_breached:
        await log_audit("register_failed", user_email=email,
                        details=f"Breached password (found {breach_count} times)",
                        ip=_get_client_ip(request), success=False)
        raise HTTPException(
            status_code=400,
            detail=f"This password has appeared in {breach_count:,} known data breaches. Please choose a different password."
        )

    # Check if email already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    
    # Check invite token first, then domain auto-enrollment
    account_type = "personal"
    organization_id = None
    org_role = None

    if invite_token:
        invite = await db.org_invites.find_one({"token": invite_token, "status": "pending"})
        if invite:
            org = await db.organizations.find_one({"id": invite["org_id"]}, {"_id": 0, "id": 1})
            if org:
                account_type = "business"
                organization_id = org["id"]
                org_role = invite.get("role", "member")
                # Mark invite as accepted
                await db.org_invites.update_one({"token": invite_token}, {"$set": {"status": "accepted", "accepted_at": datetime.now(timezone.utc).isoformat()}})

    if account_type == "personal":
        email_domain = email.split("@")[1] if "@" in email else ""
        if email_domain:
            matching_org = await db.organizations.find_one(
                {"domain": {"$regex": f"^{email_domain}$", "$options": "i"}},
                {"_id": 0, "id": 1, "name": 1}
            )
            if matching_org:
                account_type = "business"
                organization_id = matching_org["id"]
                org_role = "member"

    user_doc = {
        "id": user_id,
        "email": email,
        "password": hash_password(user.password),
        "name": name,
        "role": user.role,
        "status": user.status,
        "plan": user.plan,
        "account_type": account_type,
        "organization_id": organization_id,
        "org_role": org_role,
        "avatar": None,
        "phone": user.phone or None,
        "country_code": user.country_code or None,
        "email_verified": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Send welcome email (fire-and-forget — don't block registration)
    asyncio.ensure_future(send_welcome_email(email, name))
    
    # Generate tokens
    token = create_jwt_token(user_id, email, user.role)
    refresh_token, _ = create_refresh_token(user_id)

    await log_audit("register", user_id=user_id, user_email=email,
                    details="New user registered", ip=_get_client_ip(request))
    
    # Return user without password
    user_doc.pop("password")
    user_doc.pop("_id", None)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    user_doc["updated_at"] = user_doc["updated_at"].isoformat()
    
    return {
        "user": user_doc,
        "token": token,
        "refresh_token": refresh_token
    }

@router.post("/verify-email")
async def verify_email(data: dict):
    """Verify email with 6-digit code"""
    email = data.get("email", "").lower()
    code = data.get("code", "")
    
    if not email or not code:
        raise HTTPException(status_code=400, detail="Email and verification code are required")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        return {"verified": True, "message": "Email already verified"}
    
    stored_code = user.get("verification_code")
    expires = user.get("verification_expires")
    
    if not stored_code:
        raise HTTPException(status_code=400, detail="No verification code found. Please request a new one.")
    
    if expires:
        # Handle both naive and aware datetimes
        now = datetime.now(timezone.utc)
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if now > expires:
            raise HTTPException(status_code=400, detail="Verification code has expired. Please request a new one.")
    
    if code != stored_code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Mark as verified
    await db.users.update_one(
        {"email": email},
        {
            "$set": {"email_verified": True, "updated_at": datetime.now(timezone.utc)},
            "$unset": {"verification_code": "", "verification_expires": ""}
        }
    )
    
    # Return token and user
    token = create_jwt_token(user["id"], email, user.get("role", "User"))
    user.pop("password", None)
    user.pop("verification_code", None)
    user.pop("verification_expires", None)
    user["email_verified"] = True
    if "created_at" in user and hasattr(user["created_at"], 'isoformat'):
        user["created_at"] = user["created_at"].isoformat()
    if "updated_at" in user and hasattr(user["updated_at"], 'isoformat'):
        user["updated_at"] = user["updated_at"].isoformat()
    
    return {"verified": True, "user": user, "token": token}

@router.post("/resend-verification")
async def resend_verification(data: dict):
    """Resend verification email"""
    email = data.get("email", "").lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("email_verified"):
        return {"message": "Email already verified"}
    
    code = generate_verification_code()
    await db.users.update_one(
        {"email": email},
        {"$set": {
            "verification_code": code,
            "verification_expires": datetime.now(timezone.utc) + timedelta(minutes=15)
        }}
    )
    
    try:
        await send_verification_email(email, code, user.get("name", "User"))
    except Exception as e:
        logger.error(f"Failed to resend verification email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")
    
    return {"message": "Verification code sent"}

@router.post("/login")
@limiter.limit("10/minute")
async def login_user(request: Request, credentials: UserLogin, skip_2fa: bool = False):
    """Login a user and return JWT token"""
    email = guard_mongo_query(credentials.email.lower())
    user = await db.users.find_one(
        {"email": email},
        {"_id": 0}
    )
    
    if not user:
        await log_audit("login_failed", user_email=email,
                        details="User not found", ip=_get_client_ip(request), success=False)
        await log_audit_event(
            action="login_failed", category="auth", severity="warning",
            actor_email=email, details={"reason": "user_not_found"},
            ip_address=get_client_ip(request),
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check password (supports both bcrypt hashed and legacy plain-text)
    if not verify_password(credentials.password, user["password"]):
        await log_audit("login_failed", user_id=user.get("id", ""), user_email=email,
                        details="Wrong password", ip=_get_client_ip(request), success=False)
        await log_audit_event(
            action="login_failed", category="auth", severity="warning",
            actor_id=user.get("id"), actor_email=email,
            details={"reason": "wrong_password"},
            ip_address=get_client_ip(request),
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Auto-migrate plain-text password to bcrypt on successful login
    stored_pw = user["password"]
    if not (stored_pw.startswith('$2b$') or stored_pw.startswith('$2a$')):
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"password": hash_password(credentials.password)}}
        )

    # Silent breach check — flag user but don't block login
    try:
        from utils.breach_check import check_password_breached
        is_breached, breach_count = await check_password_breached(credentials.password)
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {
                "password_breached": is_breached,
                "password_breach_count": breach_count if is_breached else 0,
                "breach_checked_at": datetime.now(timezone.utc).isoformat(),
            }}
        )
    except Exception:
        pass  # Never block login due to breach check failure
    
    # Check if account is suspended
    if user.get("status") == "Suspended":
        raise HTTPException(status_code=403, detail="Account is suspended")
    
    # Check if user is soft-deleted
    if user.get("deleted"):
        raise HTTPException(status_code=401, detail="This account has been deleted. Contact your administrator.")
    
    # Auto-verify any previously unverified users on login
    if not user.get("email_verified", True):
        await db.users.update_one(
            {"email": credentials.email.lower()},
            {"$set": {"email_verified": True},
             "$unset": {"verification_code": "", "verification_expires": ""}}
        )
    
    # Check if using temporary password
    requires_password_change = user.get("requires_password_change", False)
    
    # Check if 2FA is enabled
    if user.get("two_factor_enabled") and not skip_2fa:
        two_fa_method = user.get("two_factor_method", "totp")
        # For email/both methods, auto-send email OTP
        if two_fa_method in ("email", "both"):
            from routes.two_factor import generate_email_otp, send_2fa_email
            otp = generate_email_otp()
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {
                    "email_otp_login": otp,
                    "email_otp_login_expires": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
                }}
            )
            await send_2fa_email(user["email"], otp)

        # Strip sensitive fields
        user.pop("password", None)
        user.pop("totp_secret", None)
        user.pop("totp_secret_pending", None)
        user.pop("recovery_codes", None)
        user.pop("email_otp_login", None)
        user.pop("email_otp_login_expires", None)

        return {
            "requires_2fa": True,
            "two_factor_method": two_fa_method,
            "user_id": user["id"],
            "user": {"id": user["id"], "email": user["email"], "name": user.get("name", "")},
        }
    
    # Generate tokens
    token = create_jwt_token(user["id"], user["email"], user.get("role", "User"))
    refresh_token, _ = create_refresh_token(user["id"])
    
    # Fetch module permissions for admin/manager/super_admin users
    module_permissions = {}
    user_role = (user.get("role") or "User").lower().replace(" ", "_")
    if user_role in ("admin", "super_admin", "manager"):
        try:
            from routes.module_permissions import get_effective_permissions
            module_permissions = await get_effective_permissions(user["id"], user.get("role", "User"))
        except Exception as e:
            logger.error(f"Failed to fetch module permissions: {e}")
    
    # Update last login
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )

    await log_audit("login", user_id=user["id"], user_email=user["email"],
                    details="Login successful", ip=_get_client_ip(request))
    await log_audit_event(
        action="login_success", category="auth", severity="info",
        actor_id=user["id"], actor_email=user["email"],
        details={"role": user.get("role"), "skip_2fa": skip_2fa},
        ip_address=get_client_ip(request),
    )
    
    # Return user without password and sensitive 2FA fields
    user.pop("password", None)
    user.pop("verification_code", None)
    user.pop("verification_expires", None)
    user.pop("totp_secret", None)
    user.pop("totp_secret_pending", None)
    user.pop("recovery_codes", None)
    user.pop("email_otp_login", None)
    user.pop("email_otp_login_expires", None)
    user.pop("email_otp_pending", None)
    user.pop("email_otp_expires", None)
    if "created_at" in user and hasattr(user["created_at"], 'isoformat'):
        user["created_at"] = user["created_at"].isoformat()
    if "updated_at" in user and hasattr(user["updated_at"], 'isoformat'):
        user["updated_at"] = user["updated_at"].isoformat()
    if "last_login" in user and hasattr(user["last_login"], 'isoformat'):
        user["last_login"] = user["last_login"].isoformat()
    
    # Include module_permissions in user object for frontend
    user["module_permissions"] = module_permissions
    
    # Include organization info for admin users
    org_id = user.get("organization_id")
    if org_id:
        org = await db.organizations.find_one({"id": org_id}, {"_id": 0, "name": 1})
        user["org_name"] = org.get("name") if org else None
    
    return {
        "user": user,
        "token": token,
        "refresh_token": refresh_token,
        "requires_password_change": requires_password_change,
        "password_breached": is_breached if 'is_breached' in dir() else user.get("password_breached", False),
    }


@router.post("/refresh")
@limiter.limit("30/minute")
async def refresh_access_token(request: Request):
    """Exchange a valid refresh token for a new access token."""
    body = await request.json()
    refresh_token = body.get("refresh_token", "")
    if not refresh_token:
        raise HTTPException(status_code=400, detail="Refresh token required")
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload["sub"]
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if user.get("status") == "Suspended":
            raise HTTPException(status_code=403, detail="Account suspended")

        # Enforce 2FA re-verification every 24 hours for non-admin users
        user_role = (user.get("role") or "User").lower().replace(" ", "_")
        if user.get("two_factor_enabled") and user_role not in ("admin", "super_admin"):
            last_verified = user.get("last_2fa_verified")
            if last_verified:
                try:
                    verified_at = datetime.fromisoformat(last_verified)
                    if verified_at.tzinfo is None:
                        verified_at = verified_at.replace(tzinfo=timezone.utc)
                    if datetime.now(timezone.utc) - verified_at > timedelta(hours=24):
                        raise HTTPException(status_code=401, detail="2fa_session_expired")
                except (ValueError, TypeError):
                    raise HTTPException(status_code=401, detail="2fa_session_expired")
            else:
                # No 2FA session recorded — force re-verification
                raise HTTPException(status_code=401, detail="2fa_session_expired")

        new_token = create_jwt_token(user["id"], user["email"], user.get("role", "User"))
        new_refresh, _ = create_refresh_token(user["id"])
        return {"token": new_token, "refresh_token": new_refresh}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired — please log in again")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/forgot-password")
@limiter.limit("5/minute")
async def forgot_password(request: Request, req: ForgotPasswordRequest):
    """Send password reset email"""
    email = guard_mongo_query(req.email.lower())
    user = await db.users.find_one({"email": email})
    
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Generate temporary password
    temp_password = generate_temp_password()
    
    # Update user with temp password (hashed)
    await db.users.update_one(
        {"email": email},
        {
            "$set": {
                "password": hash_password(temp_password),
                "requires_password_change": True,
                "temp_password_expires": datetime.now(timezone.utc) + timedelta(hours=24)
            }
        }
    )
    
    # Send email
    try:
        await send_password_reset_email(req.email, temp_password, user.get("name", "User"))
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")
        raise HTTPException(status_code=500, detail="Failed to send password reset email")
    
    return {"message": "If an account exists with this email, a password reset link has been sent."}

@router.post("/change-password")
async def change_password(request: ResetPasswordRequest):
    """Change password after using temporary password"""
    user = await db.users.find_one({"email": request.email.lower()})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify temp password (supports both hashed and plain-text)
    if not verify_password(request.temp_password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid temporary password")
    
    # Check if temp password expired
    if user.get("temp_password_expires"):
        if datetime.now(timezone.utc) > user["temp_password_expires"]:
            raise HTTPException(status_code=401, detail="Temporary password has expired")

    # Enforce password policy on new password
    pw_error = validate_password(request.new_password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)
    
    # Update password (hashed)
    await db.users.update_one(
        {"email": request.email.lower()},
        {
            "$set": {
                "password": hash_password(request.new_password),
                "requires_password_change": False,
                "updated_at": datetime.now(timezone.utc)
            },
            "$unset": {"temp_password_expires": ""}
        }
    )

    await log_audit("password_change", user_id=user["id"], user_email=user["email"],
                    details="Password changed via temp password")
    
    # Generate new token
    token = create_jwt_token(user["id"], user["email"], user.get("role", "User"))
    
    return {"message": "Password changed successfully", "token": token}

@router.get("/verify-token")
async def verify_token(user: dict = Depends(get_current_user)):
    """Verify JWT token is valid"""
    return {"valid": True, "user": user}
