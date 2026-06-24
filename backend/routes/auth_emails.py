"""
Authentication email templates - verification, welcome, password reset.
"""
import asyncio
import os
import resend

from config import SENDER_EMAIL, logger


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


async def send_welcome_email(email: str, user_name: str):
    """Send welcome email with 2FA activation reminder to new users"""
    logo_url = os.environ.get("FRONTEND_URL", "https://munal.ai").rstrip("/") + "/api/static/munal-logo.png"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; padding: 30px 0 20px;">
            <img src="{logo_url}" alt="Munal AI" style="height: 56px; width: auto; margin-bottom: 8px;" />
            <p style="color: #6b7280; font-size: 14px; margin-top: 4px;">Workforce Management Platform</p>
        </div>

        <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 12px; padding: 32px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin-top: 0; font-size: 22px;">Welcome aboard, {user_name or "there"}!</h2>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                We're thrilled to have you on <strong>Munal AI</strong> &mdash; your all-in-one AI-powered workspace for meetings, collaboration, and productivity.
            </p>

            <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">Here's what you can do right away:</p>
            <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; padding-left: 20px;">
                <li>Schedule and auto-transcribe meetings with AI insights</li>
                <li>Collaborate in real-time with Smart Spreadsheets</li>
                <li>Use the AI Hub for smart search, summaries &amp; agendas</li>
            </ul>

            <div style="background-color: #ffffff; border-left: 4px solid #7c3aed; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #7c3aed; margin-top: 0; font-size: 16px;">Activate Two-Factor Authentication (2FA)</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
                    For your security, we strongly recommend enabling <strong>2FA</strong> on your next login. Head to
                    <strong>Settings &rarr; Security</strong> to set it up in under a minute. It adds a powerful extra layer of protection to your account.
                </p>
            </div>
        </div>

        <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px;">&copy; 2026 Munal AI. All rights reserved.</p>
        </div>
    </div>
    """

    params = {
        "from": f"Munal AI <{SENDER_EMAIL}>",
        "to": [email],
        "subject": "Welcome to Munal AI! Activate 2FA for Better Security",
        "html": html_content,
        "reply_to": SENDER_EMAIL
    }

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Welcome email sent to {email}, result: {result}")
        return result
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {e}")


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
