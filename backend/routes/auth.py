"""
Authentication routes - login, register, password reset, email verification.
"""
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from typing import Optional
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timezone, timedelta
import uuid
import jwt
import secrets
import string
import asyncio
import resend
import random
import bcrypt

from config import db, JWT_SECRET_KEY, JWT_ALGORITHM, JWT_EXPIRATION_HOURS, SENDER_EMAIL, logger
from models import UserCreate, UserLogin, ForgotPasswordRequest, ResetPasswordRequest
from security import limiter, sanitize_text, guard_mongo_query, validate_password, log_audit

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


# ============== Helper Functions ==============

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, stored: str) -> bool:
    """Verify password against stored hash. Handles both bcrypt and legacy plain-text."""
    if stored.startswith('$2b$') or stored.startswith('$2a$'):
        return bcrypt.checkpw(password.encode('utf-8'), stored.encode('utf-8'))
    # Legacy plain-text comparison for un-migrated passwords
    return password == stored

def generate_temp_password(length=12):
    """Generate a random temporary password"""
    chars = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(chars) for _ in range(length))

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return str(random.randint(100000, 999999))

def create_jwt_token(user_id: str, email: str, role: str = "User") -> str:
    """Create a JWT token for a user"""
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expiration,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> tuple[str, datetime]:
    """Create a long-lived refresh token (7 days). Returns (token, expiry)."""
    expiry = datetime.now(timezone.utc) + timedelta(days=7)
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": expiry,
        "iat": datetime.now(timezone.utc),
        "jti": str(uuid.uuid4()),
    }
    token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token, expiry


def _get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "")

def verify_jwt_token(token: str) -> dict:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to get the current authenticated user"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    payload = verify_jwt_token(credentials.credentials)
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to optionally get the current user"""
    if not credentials:
        return None
    
    try:
        payload = verify_jwt_token(credentials.credentials)
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
        return user
    except Exception:
        return None

async def send_verification_email(email: str, code: str, user_name: str, max_retries: int = 3):
    """Send email verification code with retry logic for rate limits"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 0 20px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">Munal AI</h1>
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Workforce Management Platform</p>
        </div>
        
        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 32px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Verify your email</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Hi {user_name},</p>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Welcome to Munal AI! Use the code below to verify your email address and activate your account:</p>
            
            <div style="background-color: #ffffff; border: 2px solid #7c3aed; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                <p style="font-size: 36px; font-weight: bold; color: #7c3aed; letter-spacing: 8px; margin: 0;">{code}</p>
            </div>
            
            <p style="color: #6b7280; font-size: 13px;">This code expires in <strong>15 minutes</strong>. If you didn't create a Munal AI account, you can safely ignore this email.</p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI. All rights reserved.</p>
        </div>
    </div>
    """
    
    params = {
        "from": f"Munal AI <{SENDER_EMAIL}>",
        "to": [email],
        "subject": "Verify your email - Munal AI",
        "html": html_content,
        "reply_to": SENDER_EMAIL
    }
    
    last_error = None
    for attempt in range(max_retries):
        try:
            result = await asyncio.to_thread(resend.Emails.send, params)
            logger.info(f"Verification email sent to {email} (attempt {attempt + 1})")
            return result
        except Exception as e:
            last_error = e
            error_msg = str(e).lower()
            if "too many requests" in error_msg or "rate limit" in error_msg:
                wait_time = 1.0 * (attempt + 1)
                logger.warning(f"Resend rate limit hit for {email}, retrying in {wait_time}s (attempt {attempt + 1}/{max_retries})")
                await asyncio.sleep(wait_time)
            else:
                logger.error(f"Failed to send verification email to {email}: {e}")
                raise
    
    logger.error(f"Failed to send verification email to {email} after {max_retries} retries: {last_error}")
    raise last_error

async def send_password_reset_email(email: str, temp_password: str, user_name: str):
    """Send password reset email with temporary password"""
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 20px 0;">
            <h1 style="color: #7c3aed; margin: 0;">Munal AI</h1>
            <p style="color: #6b7280; font-size: 14px;">Your AI Meeting Companion</p>
        </div>
        
        <div style="background-color: #f9fafb; border-radius: 8px; padding: 30px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563;">Hi {user_name},</p>
            <p style="color: #4b5563;">We received a request to reset your password. Here is your temporary password:</p>
            
            <div style="background-color: #fff; border: 2px dashed #7c3aed; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <p style="font-size: 24px; font-weight: bold; color: #7c3aed; letter-spacing: 2px; margin: 0;">{temp_password}</p>
            </div>
            
            <p style="color: #4b5563;">Please log in with this temporary password. You will be required to change it on your first login.</p>
            <p style="color: #ef4444; font-size: 14px;"><strong>Important:</strong> This temporary password will expire in 24 hours.</p>
        </div>
        
        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI. All rights reserved.</p>
        </div>
    </div>
    """
    
    params = {
        "from": f"Munal AI <{SENDER_EMAIL}>",
        "to": [email],
        "subject": "Password Reset - Munal AI",
        "html": html_content,
        "reply_to": SENDER_EMAIL
    }
    
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Password reset email sent to {email}, result: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email}: {e}")
        raise


# ============== Routes ==============

@router.post("/register")
@limiter.limit("5/minute")
async def register_user(request: Request, user: UserCreate, invite_token: Optional[str] = Query(None)):
    """Register a new user - no email verification required"""
    # Sanitize inputs
    email = guard_mongo_query(user.email.lower())
    name = sanitize_text(user.name) if user.name else ""

    # Enforce password policy on new registrations
    pw_error = validate_password(user.password)
    if pw_error:
        await log_audit("register_failed", user_email=email, details=f"Password policy: {pw_error}",
                        ip=_get_client_ip(request), success=False)
        raise HTTPException(status_code=400, detail=pw_error)

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
        "email_verified": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
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
async def login_user(request: Request, credentials: UserLogin):
    """Login a user and return JWT token"""
    email = guard_mongo_query(credentials.email.lower())
    user = await db.users.find_one(
        {"email": email},
        {"_id": 0}
    )
    
    if not user:
        await log_audit("login_failed", user_email=email,
                        details="User not found", ip=_get_client_ip(request), success=False)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check password (supports both bcrypt hashed and legacy plain-text)
    if not verify_password(credentials.password, user["password"]):
        await log_audit("login_failed", user_id=user.get("id", ""), user_email=email,
                        details="Wrong password", ip=_get_client_ip(request), success=False)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Auto-migrate plain-text password to bcrypt on successful login
    stored_pw = user["password"]
    if not (stored_pw.startswith('$2b$') or stored_pw.startswith('$2a$')):
        await db.users.update_one(
            {"id": user["id"]},
            {"$set": {"password": hash_password(credentials.password)}}
        )
    
    # Check if account is suspended
    if user.get("status") == "Suspended":
        raise HTTPException(status_code=403, detail="Account is suspended")
    
    # Auto-verify any previously unverified users on login
    if not user.get("email_verified", True):
        await db.users.update_one(
            {"email": credentials.email.lower()},
            {"$set": {"email_verified": True},
             "$unset": {"verification_code": "", "verification_expires": ""}}
        )
    
    # Check if using temporary password
    requires_password_change = user.get("requires_password_change", False)
    
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
    
    # Return user without password
    user.pop("password", None)
    user.pop("verification_code", None)
    user.pop("verification_expires", None)
    if "created_at" in user and hasattr(user["created_at"], 'isoformat'):
        user["created_at"] = user["created_at"].isoformat()
    if "updated_at" in user and hasattr(user["updated_at"], 'isoformat'):
        user["updated_at"] = user["updated_at"].isoformat()
    if "last_login" in user and hasattr(user["last_login"], 'isoformat'):
        user["last_login"] = user["last_login"].isoformat()
    
    # Include module_permissions in user object for frontend
    user["module_permissions"] = module_permissions
    
    return {
        "user": user,
        "token": token,
        "refresh_token": refresh_token,
        "requires_password_change": requires_password_change
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
        # Don't reveal if email exists
        return {"message": "If an account exists with this email, a password reset link has been sent."}
    
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
