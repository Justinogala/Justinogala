"""
Security middleware and utilities for Munal AI.
Rate limiting, input sanitization, password policy, audit logging, and security headers.
"""
import re
import bleach
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from datetime import datetime, timezone

# ============== Rate Limiter ==============

def _get_real_client_ip(request: Request) -> str:
    """Get real client IP behind reverse proxy/K8s ingress."""
    forwarded = request.headers.get("x-forwarded-for", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    real_ip = request.headers.get("x-real-ip", "")
    if real_ip:
        return real_ip
    return request.client.host if request.client else "unknown"

limiter = Limiter(key_func=_get_real_client_ip)


# ============== Password Policy ==============

def validate_password(password: str) -> str | None:
    """
    Enforce password policy on NEW passwords only.
    Returns error message if invalid, None if OK.
    """
    if len(password) < 8:
        return "Password must be at least 8 characters"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one number"
    return None


# ============== Input Sanitization ==============

def sanitize_text(text: str | None) -> str | None:
    """Strip HTML/script tags from user input. Preserves plain text."""
    if text is None:
        return None
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True)
    return cleaned


def validate_name(name: str) -> str | None:
    """Validate a user's display name. Returns error message or None if valid."""
    if not name or len(name.strip()) < 2:
        return "Name must be at least 2 characters"
    if len(name) > 50:
        return "Name must be 50 characters or less"

    # Block URLs and link patterns
    url_patterns = [
        r'https?://', r'www\.', r'bit\.ly', r'goo\.gl', r't\.co/', r'tinyurl',
        r'\.[a-z]{2,6}/', r'\.com\b', r'\.ru\b', r'\.net\b', r'\.org\b', r'\.io\b',
        r'\.xyz\b', r'\.info\b', r'\.ly/', r'\.me/',
    ]
    name_lower = name.lower()
    for pattern in url_patterns:
        if re.search(pattern, name_lower):
            return "Name cannot contain URLs or links"

    # Block HTML entities
    if re.search(r'&[a-z]+;|&#\d+;', name_lower):
        return "Name contains invalid characters"

    # Block promotional/spam keywords
    spam_keywords = [
        'bonus', 'kazanın', 'kazanin', 'casino', 'jackpot', 'promo', 'free money',
        'click here', 'register now', 'sign up now', 'limited offer', 'discount',
        'crypto', 'bitcoin', 'earn money', 'make money', 'investment', 'forex',
        'telegram', 'whatsapp group',
    ]
    for keyword in spam_keywords:
        if keyword in name_lower:
            return "Name contains prohibited content"

    # Only allow letters (any script), spaces, hyphens, apostrophes, periods
    if not re.match(r"^[a-zA-ZÀ-ÿĀ-žА-яÉéÈèÊêÖöÜüÄäÇçÑñ\s'\-\.]+$", name):
        return "Name can only contain letters, spaces, hyphens, and apostrophes"

    # Must contain at least 2 actual letter characters
    letter_count = sum(1 for c in name if c.isalpha())
    if letter_count < 2:
        return "Name must contain at least 2 letters"

    return None


DISPOSABLE_EMAIL_DOMAINS = {
    'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'mailinator.com',
    'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
    'dispostable.com', 'trashmail.com', 'trashmail.net', 'trashmail.org',
    'tempail.com', 'temp-mail.org', 'fakeinbox.com', 'mailnesia.com',
    'maildrop.cc', 'discard.email', 'tmpmail.net', 'tmpmail.org',
    'getnada.com', 'mohmal.com', 'emailondeck.com', 'mintemail.com',
    'harakirimail.com', 'tmail.ws', 'necub.com',
}

SPAM_EMAIL_DOMAINS = {
    'ya.ru',
}


def validate_email_domain(email: str) -> str | None:
    """Check if email uses a disposable or known spam domain. Returns error or None."""
    domain = email.split('@')[-1].lower()
    if domain in DISPOSABLE_EMAIL_DOMAINS or domain in SPAM_EMAIL_DOMAINS:
        return "Registration with this email provider is not allowed. Please use a different email."
    return None


def sanitize_dict(data: dict, fields: list[str] | None = None) -> dict:
    """Sanitize string values in a dict. If fields given, only those keys."""
    out = dict(data)
    for k, v in out.items():
        if isinstance(v, str) and (fields is None or k in fields):
            out[k] = sanitize_text(v)
    return out


# ============== NoSQL Injection Guard ==============

_MONGO_OPERATORS = re.compile(r"^\$")


def guard_mongo_query(value):
    """Reject values that start with $ to prevent NoSQL injection."""
    if isinstance(value, str) and _MONGO_OPERATORS.match(value):
        return ""
    if isinstance(value, dict):
        return {k: guard_mongo_query(v) for k, v in value.items() if not _MONGO_OPERATORS.match(k)}
    return value


# ============== Audit Logging ==============

_audit_db = None


def set_audit_db(database):
    """Set the MongoDB database reference for audit logging."""
    global _audit_db
    _audit_db = database


async def log_audit(action: str, user_id: str = "", user_email: str = "",
                    details: str = "", ip: str = "", success: bool = True):
    """Log a security/audit event to the audit_logs collection. Details encrypted at rest."""
    if _audit_db is None:
        return
    from encryption import encrypt_field
    doc = {
        "action": action,
        "user_id": user_id,
        "user_email": user_email,
        "details": encrypt_field(details) if details else "",
        "ip_address": ip,
        "success": success,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    try:
        await _audit_db.audit_logs.insert_one(doc)
    except Exception:
        pass  # Never let audit logging break the app


# ============== Security Headers Middleware ==============

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; "
            "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; "
            "img-src 'self' data: blob: https:; "
            "connect-src 'self' https: wss:; "
            "frame-ancestors 'none';"
        )
        return response
