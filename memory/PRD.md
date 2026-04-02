# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Architecture
```
/app/backend/routes/
├── two_factor.py          # Admin 2FA setup/verify/disable
├── user_two_factor.py     # User 2FA setup/verify/disable + enforcement check (NEW)
├── data_health.py         # Data health stats + cleanup
├── audit_logs.py          # Admin audit logging
├── auth.py                # Login (with 2FA for ALL roles), register, password reset
├── admin.py               # Admin routes + 2FA enforcement toggle (NEW endpoints)

/app/frontend/src/
├── components/
│   ├── UserTwoFactorSetup.jsx    # NEW - User 2FA setup (Settings > Security)
│   ├── UserTwoFactorVerify.jsx   # NEW - User 2FA login verification
│   ├── admin/
│   │   ├── TwoFactorSetup.jsx    # Admin 2FA setup
│   │   └── TwoFactorVerify.jsx   # Admin 2FA login verification
├── context/AuthContext.jsx        # Updated: loginWithSkip2FA function
├── pages/
│   ├── LoginPage.jsx              # Updated: 2FA verification step
│   ├── UserSettingsPage.jsx       # Updated: Security tab with UserTwoFactorSetup
│   └── admin/AdminSecurityPolicies.jsx  # Updated: org-wide 2FA enforcement toggle
```

## Recent Changes

### User 2FA for All Roles — April 2, 2026
- Extended 2FA (TOTP + Email OTP + Recovery Codes) to ALL user roles (Admin, Manager, Member)
- **Backend**: 7 new endpoints under `/api/user/2fa/` (status, setup, verify-setup, verify, send-email-otp, disable, enforcement)
- **Admin Enforcement**: Toggle in Security Policies to force all users to enable 2FA (stored in `admin_settings` collection)
- **Frontend LoginPage**: Now shows `UserTwoFactorVerify` component when `requires_2fa` returned from login
- **Frontend Settings**: New "Security" tab with `UserTwoFactorSetup` component
- **AuthContext**: Added `loginWithSkip2FA` function for post-2FA login completion
- Testing: 100% pass rate (21/21 backend, all frontend verified) — Iteration 96

### Feature Page Image Replacement — March 31, 2026
- Replaced ALL stock images across 15 feature pages with real app screenshots
- Screenshots served via `/api/static/{filename}` endpoint
- Added static file serving endpoint to server.py

### Production Deployment Fix — March 30, 2026
- Fixed `.gitignore` blocking `.env` files from deployment
- Added `load_dotenv(override=True)` to ensure Atlas MONGO_URL takes priority over platform-injected URLs
- Fixed plaintext passwords in Atlas DB with bcrypt hashing
- Added startup migration to auto-hash plaintext passwords

### Admin Theme Fix — March 30, 2026
- Fixed Coupons, Tax Rates, Cloud Storage pages from dark to bright theme

## Key DB Schema
- `users`: `two_factor_enabled`, `two_factor_method` (totp/email/both), `totp_secret`, `recovery_codes` (hashed)
- `admin_settings`: `{key: "2fa_enforcement", enforced: bool}` — org-wide 2FA enforcement
- `audit_logs`: System event tracking

## Key API Endpoints
- User 2FA: `/api/user/2fa/status/{id}`, `/api/user/2fa/setup`, `/api/user/2fa/verify-setup`, `/api/user/2fa/verify`, `/api/user/2fa/disable`
- Admin Enforcement: `GET/POST /api/admin/2fa-enforcement`
- Login: `POST /api/auth/login` (returns `requires_2fa` when enabled), `POST /api/auth/login?skip_2fa=true`

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat), Sora 2 (Video Gen), Resend (Emails/2FA OTP) — all via Emergent LLM Key

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456 (2FA disabled)
- Regular User: justinoo2001@gmail.com / Ogala@2023 (2FA disabled after testing)
- Org Member: orgmember@munal.com / OrgMem@123

## Backlog (Prioritized)
- P2: Refactor `admin.py` (~1850 lines) into smaller domain-specific route files
- P3: Automated weekly Data Health email digest
- P3: Additional form templates
- P3: Advanced analytics/reporting
