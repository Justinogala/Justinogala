"""
User Two-Factor Authentication Routes
Allows any authenticated user to manage their own 2FA settings.
Reuses the same core logic from the admin 2FA module.
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from config import db, logger
from routes.two_factor import (
    generate_recovery_codes, hash_code, generate_email_otp,
    send_2fa_email, Setup2FARequest, Verify2FASetupRequest,
    Verify2FALoginRequest, Disable2FARequest
)
from services.audit import log_audit_event
from datetime import datetime, timezone, timedelta
import pyotp
import qrcode
import qrcode.constants
import io
import base64

router = APIRouter(prefix="/user/2fa", tags=["User 2FA"])


# ── Admin Enforcement ──

class Enforce2FARequest(BaseModel):
    enforce: bool


@router.get("/enforcement")
async def get_2fa_enforcement():
    """Check if 2FA is enforced org-wide"""
    settings = await db.admin_settings.find_one({"key": "2fa_enforcement"}, {"_id": 0})
    return {"enforced": settings.get("enforced", False) if settings else False}


# ── User 2FA Routes ──

@router.get("/status/{user_id}")
async def get_user_2fa_status(user_id: str):
    """Get 2FA status for a user"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "id": 1, "two_factor_enabled": 1, "two_factor_method": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also check enforcement
    settings = await db.admin_settings.find_one({"key": "2fa_enforcement"}, {"_id": 0})
    enforced = settings.get("enforced", False) if settings else False
    
    return {
        "enabled": user.get("two_factor_enabled", False),
        "method": user.get("two_factor_method"),
        "enforced": enforced,
    }


@router.post("/setup")
async def setup_user_2fa(req: Setup2FARequest):
    """Initialize 2FA setup for a regular user"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "email": 1, "name": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.method not in ("totp", "email", "both"):
        raise HTTPException(status_code=400, detail="Method must be 'totp', 'email', or 'both'")

    result = {"method": req.method}

    if req.method in ("totp", "both"):
        totp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(totp_secret)
        provisioning_uri = totp.provisioning_uri(
            name=user["email"],
            issuer_name="Munal"
        )
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=8, border=2)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        await db.users.update_one(
            {"id": req.user_id},
            {"$set": {
                "totp_secret_pending": totp_secret,
                "two_factor_setup_method": req.method,
            }}
        )
        result["qr_code"] = f"data:image/png;base64,{qr_base64}"
        result["totp_secret"] = totp_secret

    if req.method in ("email", "both"):
        otp = generate_email_otp()
        await db.users.update_one(
            {"id": req.user_id},
            {"$set": {
                "email_otp_pending": otp,
                "email_otp_expires": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
                "two_factor_setup_method": req.method,
            }}
        )
        await send_2fa_email(user["email"], otp)
        result["email_sent"] = True

    return result


@router.post("/verify-setup")
async def verify_user_2fa_setup(req: Verify2FASetupRequest):
    """Verify the 2FA code during initial setup"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret_pending": 1, "email_otp_pending": 1,
         "email_otp_expires": 1, "two_factor_setup_method": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    valid = False
    if req.method == "totp":
        secret = user.get("totp_secret_pending")
        if not secret:
            raise HTTPException(status_code=400, detail="No TOTP setup in progress")
        totp = pyotp.TOTP(secret)
        valid = totp.verify(req.code, valid_window=1)
    elif req.method == "email":
        stored_otp = user.get("email_otp_pending")
        expires = user.get("email_otp_expires")
        if not stored_otp:
            raise HTTPException(status_code=400, detail="No email OTP pending")
        if expires and datetime.now(timezone.utc).isoformat() > expires:
            raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")
        valid = req.code == stored_otp

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    recovery_codes = generate_recovery_codes()
    hashed_codes = [hash_code(c) for c in recovery_codes]
    setup_method = user.get("two_factor_setup_method", req.method)

    update_fields = {
        "two_factor_enabled": True,
        "two_factor_method": setup_method,
        "recovery_codes": hashed_codes,
        "two_factor_setup_at": datetime.now(timezone.utc).isoformat(),
    }
    if user.get("totp_secret_pending"):
        update_fields["totp_secret"] = user["totp_secret_pending"]

    await db.users.update_one(
        {"id": req.user_id},
        {
            "$set": update_fields,
            "$unset": {"totp_secret_pending": "", "email_otp_pending": "", "email_otp_expires": "", "two_factor_setup_method": ""}
        }
    )

    logger.info(f"2FA enabled for user {req.user_id} with method: {setup_method}")
    await log_audit_event(
        action="2fa_enabled", category="2fa", severity="info",
        actor_id=req.user_id, details={"method": setup_method},
    )
    return {"success": True, "method": setup_method, "recovery_codes": recovery_codes}


@router.post("/verify")
async def verify_user_2fa_login(req: Verify2FALoginRequest):
    """Verify 2FA code during user login"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret": 1, "email_otp_login": 1,
         "email_otp_login_expires": 1, "two_factor_method": 1,
         "two_factor_enabled": 1, "recovery_codes": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled")

    valid = False
    method_used = None

    if user.get("totp_secret") and user.get("two_factor_method") in ("totp", "both"):
        totp = pyotp.TOTP(user["totp_secret"])
        if totp.verify(req.code, valid_window=1):
            valid = True
            method_used = "totp"

    if not valid and user.get("two_factor_method") in ("email", "both"):
        stored_otp = user.get("email_otp_login")
        expires = user.get("email_otp_login_expires")
        if stored_otp and req.code == stored_otp:
            if not expires or datetime.now(timezone.utc).isoformat() <= expires:
                valid = True
                method_used = "email"
                await db.users.update_one(
                    {"id": req.user_id},
                    {"$unset": {"email_otp_login": "", "email_otp_login_expires": ""}}
                )

    if not valid:
        code_hash = hash_code(req.code)
        if code_hash in (user.get("recovery_codes") or []):
            valid = True
            method_used = "recovery"
            await db.users.update_one(
                {"id": req.user_id},
                {"$pull": {"recovery_codes": code_hash}}
            )

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    logger.info(f"2FA verified for user {req.user_id} via {method_used}")
    return {"success": True, "method_used": method_used}


@router.post("/send-email-otp")
async def send_user_email_otp(user_id: str):
    """Send a fresh email OTP for login verification"""
    user = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "id": 1, "email": 1, "two_factor_enabled": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled")

    otp = generate_email_otp()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "email_otp_login": otp,
            "email_otp_login_expires": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        }}
    )
    await send_2fa_email(user["email"], otp)
    return {"success": True, "email_sent": True}


@router.post("/disable")
async def disable_user_2fa(req: Disable2FARequest):
    """Disable 2FA for a user (requires verification)"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret": 1, "two_factor_enabled": 1,
         "two_factor_method": 1, "recovery_codes": 1}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check enforcement
    settings = await db.admin_settings.find_one({"key": "2fa_enforcement"}, {"_id": 0})
    if settings and settings.get("enforced"):
        raise HTTPException(status_code=403, detail="2FA is enforced by your organization. You cannot disable it.")

    valid = False
    if user.get("totp_secret"):
        totp = pyotp.TOTP(user["totp_secret"])
        if totp.verify(req.code, valid_window=1):
            valid = True
    if not valid:
        code_hash = hash_code(req.code)
        if code_hash in (user.get("recovery_codes") or []):
            valid = True

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid code. Enter your authenticator or recovery code.")

    await db.users.update_one(
        {"id": req.user_id},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {
                "totp_secret": "", "totp_secret_pending": "",
                "two_factor_method": "", "recovery_codes": "",
                "email_otp_login": "", "email_otp_login_expires": "",
                "two_factor_setup_at": "",
            }
        }
    )

    logger.info(f"2FA disabled for user {req.user_id}")
    await log_audit_event(
        action="2fa_disabled", category="2fa", severity="warning",
        actor_id=req.user_id, details={"action": "disabled_by_user"},
    )
    return {"success": True}
