"""
Field-level encryption for sensitive data at rest.
Uses Fernet (AES-128-CBC + HMAC-SHA256) via the cryptography library.

Design:
  - encrypt_field / decrypt_field work on individual string values.
  - decrypt_field is backwards-compatible: if the value is not a valid
    Fernet token it is returned as-is, so existing plaintext data keeps working.
  - A short prefix "enc::" marks encrypted values so we never double-encrypt.
"""
import os
import logging
from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)

_KEY = os.environ.get("ENCRYPTION_KEY", "")
_fernet = None


def _get_fernet():
    global _fernet
    if _fernet is None:
        key = os.environ.get("ENCRYPTION_KEY", "")
        if not key:
            # Try loading from .env directly as fallback
            try:
                from dotenv import load_dotenv
                from pathlib import Path
                load_dotenv(Path(__file__).parent / ".env")
                key = os.environ.get("ENCRYPTION_KEY", "")
            except Exception:
                pass
        if key:
            _fernet = Fernet(key.encode())
    return _fernet

ENCRYPTION_PREFIX = "enc::"


def encrypt_field(value: str | None) -> str | None:
    """Encrypt a string value. Returns prefixed ciphertext. Passes through None/empty."""
    f = _get_fernet()
    if not value or not f:
        return value
    if value.startswith(ENCRYPTION_PREFIX):
        return value  # already encrypted
    token = f.encrypt(value.encode()).decode()
    return f"{ENCRYPTION_PREFIX}{token}"


def decrypt_field(value: str | None) -> str | None:
    """Decrypt a value. Backwards-compatible: returns plaintext as-is if not encrypted."""
    f = _get_fernet()
    if not value or not f:
        return value
    if not value.startswith(ENCRYPTION_PREFIX):
        return value  # plaintext legacy data — return as-is
    token = value[len(ENCRYPTION_PREFIX):]
    try:
        return f.decrypt(token.encode()).decode()
    except (InvalidToken, Exception):
        logger.warning("Failed to decrypt field — returning raw value")
        return value


def encrypt_dict(data: dict, fields: list[str]) -> dict:
    """Encrypt specified fields in a dict (in-place safe copy)."""
    out = dict(data)
    for f in fields:
        if f in out and isinstance(out[f], str):
            out[f] = encrypt_field(out[f])
    return out


def decrypt_dict(data: dict, fields: list[str]) -> dict:
    """Decrypt specified fields in a dict (in-place safe copy)."""
    out = dict(data)
    for f in fields:
        if f in out and isinstance(out[f], str):
            out[f] = decrypt_field(out[f])
    return out
