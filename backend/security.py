"""
Security middleware and utilities for Munal AI.
Rate limiting, input sanitization, and security headers.
"""
import re
import bleach
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# ============== Rate Limiter ==============

limiter = Limiter(key_func=get_remote_address)


# ============== Input Sanitization ==============

def sanitize_text(text: str | None) -> str | None:
    """Strip HTML/script tags from user input. Preserves plain text."""
    if text is None:
        return None
    cleaned = bleach.clean(text, tags=[], attributes={}, strip=True)
    return cleaned


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


# ============== Security Headers Middleware ==============

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response
