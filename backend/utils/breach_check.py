"""
Password breach detection using HaveIBeenPwned API (k-Anonymity model).
Only sends first 5 chars of SHA-1 hash — never the actual password.
"""
import hashlib
import httpx
from config import logger

HIBP_API_URL = "https://api.pwnedpasswords.com/range/"


async def check_password_breached(password: str) -> tuple[bool, int]:
    """
    Check if a password appears in known data breaches.
    Uses k-Anonymity: sends only the first 5 characters of the SHA-1 hash.
    
    Returns: (is_breached: bool, breach_count: int)
    """
    try:
        sha1 = hashlib.sha1(password.encode("utf-8")).hexdigest().upper()
        prefix = sha1[:5]
        suffix = sha1[5:]

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{HIBP_API_URL}{prefix}")

        if response.status_code != 200:
            logger.warning(f"HIBP API returned status {response.status_code}")
            return False, 0

        # Parse response — each line is "SUFFIX:COUNT"
        for line in response.text.splitlines():
            parts = line.strip().split(":")
            if len(parts) == 2 and parts[0] == suffix:
                count = int(parts[1])
                return True, count

        return False, 0

    except Exception as e:
        logger.error(f"HIBP breach check error: {e}")
        # Fail open — don't block users if the API is down
        return False, 0
