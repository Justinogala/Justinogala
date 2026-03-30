# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Recent Changes

### Two-Factor Authentication (2FA) — March 30, 2026
- **TOTP + Email OTP + Recovery Codes**: Admin can choose authenticator app, email OTP, or both
- **Setup flow**: Enable from Admin > Security Policies → choose method → scan QR / get email code → verify → receive 8 recovery codes
- **Login flow**: Email/password → 2FA prompt (TOTP/Email/Recovery tabs) → verify → access granted
- **Disable**: Requires valid TOTP or recovery code to disable
- **Backend**: 6 endpoints under `/api/admin/2fa/` (status, setup, verify-setup, verify, send-email-otp, disable)
- **Admin email changed**: `admin@munal.com` → `admin@munal.ai`
- 100% test pass rate (iteration_93)

### AuthContext Consolidation + Data Health Dashboard + 9th Form — March 30, 2026
- Merged AdminAuthContext into AuthContext.jsx (single provider, dual hooks)
- Data Health Dashboard at `/admin/data-health`
- Client Behavior Observation Form (9th healthcare template, 19 fields)
- 100% test pass rate (iteration_92)

### Onboarding + Landing Page Fix + Demo Video — March 30, 2026
- 8-step onboarding walkthrough, hero mobile layout fix, Sora 2 demo video
- 100% test pass rates (iterations 90, 91)

## Architecture
```
/app/backend/routes/
├── two_factor.py          # NEW - 2FA setup/verify/disable (TOTP + Email OTP)
├── data_health.py         # Data health stats + cleanup
├── auth.py                # Login (with 2FA support), register, password reset
├── users.py               # User CRUD + onboarding
├── forms.py               # 9 healthcare templates

/app/frontend/src/
├── components/admin/
│   ├── TwoFactorSetup.jsx    # NEW - 2FA setup UI (QR code, method selection, recovery codes)
│   └── TwoFactorVerify.jsx   # NEW - 2FA login verification (TOTP/Email/Recovery tabs)
├── context/AuthContext.jsx    # Consolidated auth (user + admin)
├── pages/AdminLoginPage.jsx   # Updated with 2FA flow
```

## Key DB Fields (users collection)
`two_factor_enabled`, `two_factor_method` (totp/email/both), `totp_secret`, `recovery_codes` (hashed), `email_otp_login`, `onboarding_completed`

## 3rd Party Integrations
- Resend (Email Delivery + 2FA OTP), OpenAI GPT-5.2, Whisper, Object Storage, Sora 2

## Dependencies Added
- `pyotp` (TOTP generation/verification)
- `qrcode[pil]` (QR code generation for authenticator setup)

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456 (2FA currently DISABLED, can enable from Security Policies)
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123

## Backlog
- Additional form templates as needed
- Advanced analytics/reporting
