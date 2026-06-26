# Test Credentials

## Super Admin Accounts
- **Email:** admin@munal.com | **Password:** Munal@AI#2026!X7qP9 | **Role:** Super_Admin | **2FA:** Enabled (TOTP + Email)
- **Email:** admin@munal.ai | **Password:** Munal@AI#2026!X7qP9 | **Role:** Super_Admin | **2FA:** Enabled (TOTP + Email)

## Test User (Academy)
- **Email:** testacademy@munal.ai | **Password:** Test@12345 | **Role:** User | **2FA:** Disabled
- Enrolled in course: 05fc09f9-b57f-45b9-8ff1-f718c8a2ce1c (AI Foundations: From Zero to Hero)

## Notes
- Both admin accounts share the same MongoDB Atlas database between preview and production
- TOTP codes can be generated programmatically from DB `totp_secret` field using `pyotp.TOTP(secret).now()`
- If Google Authenticator codes don't work, use the force-reset endpoint `POST /api/admin/2fa/force-reset` to clear 2FA and re-enroll
