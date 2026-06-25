"""
Two-Factor Authentication Routes
Supports TOTP (Authenticator App) and Email OTP
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from config import db, logger
import pyotp
import qrcode
import qrcode.constants
import io
import base64
import secrets
import hashlib
from services.audit import log_audit_event

router = APIRouter(prefix="/admin/2fa", tags=["Admin 2FA"])


# ── Models ──

class Setup2FARequest(BaseModel):
    user_id: str
    method: str  # "totp", "email", or "both"

class Verify2FASetupRequest(BaseModel):
    user_id: str
    code: str
    method: str  # "totp" or "email"

class Verify2FALoginRequest(BaseModel):
    user_id: str
    code: str

class Disable2FARequest(BaseModel):
    user_id: str
    code: str  # Must verify before disabling

class UseRecoveryCodeRequest(BaseModel):
    user_id: str
    code: str


# ── Helpers ──

def generate_recovery_codes(count=8):
    """Generate a set of one-time recovery codes"""
    codes = []
    for _ in range(count):
        code = secrets.token_hex(4).upper()  # 8-char hex codes
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes


def hash_code(code: str) -> str:
    """Hash a recovery code for storage"""
    return hashlib.sha256(code.encode()).hexdigest()


def generate_email_otp():
    """Generate a 6-digit OTP for email"""
    return f"{secrets.randbelow(900000) + 100000}"


async def send_2fa_email(email: str, otp: str):
    """Send 2FA OTP via Resend"""
    try:
        import os
        api_key = os.environ.get("RESEND_API_KEY")
        sender = os.environ.get("SENDER_EMAIL", "noreply@munal.ai")
        if not api_key:
            logger.warning("RESEND_API_KEY not set, logging OTP instead")
            logger.info(f"2FA OTP for {email}: {otp}")
            return True

        import httpx
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "from": sender,
                    "to": [email],
                    "subject": "Munal Admin - Your Verification Code",
                    "html": f"""
                    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 30px;">
                        <div style="text-align: center; margin-bottom: 24px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #7C3AED, #6D28D9); border-radius: 12px; padding: 12px; margin-bottom: 12px;">
                                <span style="color: white; font-size: 24px; font-weight: bold;">M</span>
                            </div>
                            <h2 style="margin: 0; color: #1a1a1a;">Verification Code</h2>
                        </div>
                        <p style="color: #666; text-align: center;">Enter this code to complete your sign-in:</p>
                        <div style="background: #f3f0ff; border: 2px solid #7C3AED; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #7C3AED;">{otp}</span>
                        </div>
                        <p style="color: #999; font-size: 13px; text-align: center;">This code expires in 5 minutes. If you didn't request this, ignore this email.</p>
                    </div>
                    """
                }
            )
            return res.status_code == 200
    except Exception as e:
        logger.error(f"Failed to send 2FA email: {e}")
        logger.info(f"2FA OTP for {email}: {otp}")
        return True


# ── Routes ──

@router.get("/status/{user_id}")
async def get_2fa_status(user_id: str):
    """Get 2FA status for a user"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "two_factor_enabled": 1, "two_factor_method": 1})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "enabled": user.get("two_factor_enabled", False),
        "method": user.get("two_factor_method", None),
    }


@router.post("/setup")
async def setup_2fa(req: Setup2FARequest):
    """Initialize 2FA setup — generates TOTP secret and/or prepares email OTP"""
    user = await db.users.find_one({"id": req.user_id}, {"_id": 0, "id": 1, "email": 1, "name": 1})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if req.method not in ("totp", "email", "both"):
        raise HTTPException(status_code=400, detail="Method must be 'totp', 'email', or 'both'")

    result = {"method": req.method}

    # Generate TOTP secret if needed
    if req.method in ("totp", "both"):
        totp_secret = pyotp.random_base32()
        totp = pyotp.TOTP(totp_secret)
        provisioning_uri = totp.provisioning_uri(
            name=user["email"],
            issuer_name="Munal Admin"
        )

        # Generate QR code as base64
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=8, border=2)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        # Store secret temporarily (not yet verified)
        await db.users.update_one(
            {"id": req.user_id},
            {"$set": {
                "totp_secret_pending": totp_secret,
                "two_factor_setup_method": req.method,
            }}
        )

        result["qr_code"] = f"data:image/png;base64,{qr_base64}"
        result["totp_secret"] = totp_secret  # For manual entry

    # Send email OTP if email method
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
async def verify_2fa_setup(req: Verify2FASetupRequest):
    """Verify the 2FA code during initial setup to activate it"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret_pending": 1, "email_otp_pending": 1,
         "email_otp_expires": 1, "two_factor_setup_method": 1}
    )
    if user is None:
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

    # Generate recovery codes
    recovery_codes = generate_recovery_codes()
    hashed_codes = [hash_code(c) for c in recovery_codes]

    setup_method = user.get("two_factor_setup_method", req.method)

    update_fields = {
        "two_factor_enabled": True,
        "two_factor_method": setup_method,
        "recovery_codes": hashed_codes,
        "two_factor_setup_at": datetime.now(timezone.utc).isoformat(),
    }

    # Move pending TOTP secret to active
    if user.get("totp_secret_pending"):
        update_fields["totp_secret"] = user["totp_secret_pending"]

    unset_fields = {
        "totp_secret_pending": "",
        "email_otp_pending": "",
        "email_otp_expires": "",
        "two_factor_setup_method": "",
    }

    await db.users.update_one(
        {"id": req.user_id},
        {"$set": update_fields, "$unset": unset_fields}
    )

    logger.info(f"2FA enabled for user {req.user_id} with method: {setup_method}")
    await log_audit_event(
        action="2fa_enabled", category="2fa", severity="info",
        actor_id=req.user_id, details={"method": setup_method},
    )
    return {
        "success": True,
        "method": setup_method,
        "recovery_codes": recovery_codes,  # Show once, then never again
    }


@router.post("/send-email-otp")
async def send_email_otp(user_id: str):
    """Send a fresh email OTP for login verification"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1, "email": 1, "two_factor_enabled": 1})
    if user is None:
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


@router.post("/verify")
async def verify_2fa_login(req: Verify2FALoginRequest):
    """Verify 2FA code during login"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret": 1, "email_otp_login": 1,
         "email_otp_login_expires": 1, "two_factor_method": 1, "two_factor_enabled": 1,
         "recovery_codes": 1}
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled")

    valid = False
    method_used = None

    # Try TOTP first
    if user.get("totp_secret") and user.get("two_factor_method") in ("totp", "both"):
        totp = pyotp.TOTP(user["totp_secret"])
        if totp.verify(req.code, valid_window=1):
            valid = True
            method_used = "totp"

    # Try email OTP
    if not valid and user.get("two_factor_method") in ("email", "both"):
        stored_otp = user.get("email_otp_login")
        expires = user.get("email_otp_login_expires")
        if stored_otp and req.code == stored_otp:
            if not expires or datetime.now(timezone.utc).isoformat() <= expires:
                valid = True
                method_used = "email"
                # Clear used OTP
                await db.users.update_one(
                    {"id": req.user_id},
                    {"$unset": {"email_otp_login": "", "email_otp_login_expires": ""}}
                )

    # Try recovery code
    if not valid:
        code_hash = hash_code(req.code)
        if code_hash in (user.get("recovery_codes") or []):
            valid = True
            method_used = "recovery"
            # Remove used recovery code
            await db.users.update_one(
                {"id": req.user_id},
                {"$pull": {"recovery_codes": code_hash}}
            )

    if not valid:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    logger.info(f"2FA verified for user {req.user_id} via {method_used}")
    await log_audit_event(
        action="2fa_verified", category="2fa", severity="info",
        actor_id=req.user_id, details={"method_used": method_used},
    )

    # Store 2FA session timestamp (for 24h grace period)
    await db.users.update_one(
        {"id": req.user_id},
        {"$set": {"last_2fa_verified": datetime.now(timezone.utc).isoformat()}}
    )

    return {"success": True, "method_used": method_used}


@router.post("/disable")
async def disable_2fa(req: Disable2FARequest):
    """Disable 2FA (requires verification first)"""
    user = await db.users.find_one(
        {"id": req.user_id},
        {"_id": 0, "id": 1, "totp_secret": 1, "two_factor_enabled": 1,
         "two_factor_method": 1, "email_otp_login": 1, "recovery_codes": 1}
    )
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    # Verify the code before disabling
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
        raise HTTPException(status_code=400, detail="Invalid code. Enter your authenticator or recovery code to disable 2FA.")

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



class ForceReset2FARequest(BaseModel):
    user_id: str
    admin_user_id: str  # The super admin performing the reset


@router.post("/force-reset")
async def force_reset_2fa(req: ForceReset2FARequest):
    """Force-reset 2FA for a user (Super Admin only, no code required).
    This is for cases where the user lost their authenticator device."""
    # Verify the requester is a Super Admin
    admin = await db.users.find_one(
        {"id": req.admin_user_id},
        {"_id": 0, "id": 1, "role": 1}
    )
    if not admin:
        raise HTTPException(status_code=404, detail="Admin user not found")

    admin_role = (admin.get("role") or "").lower().replace(" ", "_")
    if admin_role != "super_admin":
        raise HTTPException(status_code=403, detail="Only Super Admins can force-reset 2FA")

    target = await db.users.find_one({"id": req.user_id}, {"_id": 0, "id": 1, "email": 1})
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")

    await db.users.update_one(
        {"id": req.user_id},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {
                "totp_secret": "", "totp_secret_pending": "",
                "two_factor_method": "", "recovery_codes": "",
                "email_otp_login": "", "email_otp_login_expires": "",
                "two_factor_setup_at": "", "last_2fa_verified": "",
            }
        }
    )

    logger.info(f"2FA force-reset for user {req.user_id} by admin {req.admin_user_id}")
    await log_audit_event(
        action="2fa_force_reset", category="2fa", severity="warning",
        actor_id=req.admin_user_id,
        details={"target_user_id": req.user_id, "target_email": target.get("email")},
    )
    return {"success": True, "message": f"2FA has been reset for {target.get('email')}"}
