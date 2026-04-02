# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Architecture
```
/app/backend/routes/
├── admin.py                    # Thin re-export shell (composites all admin_*.py routers)
├── admin_settings.py           # Settings CRUD, SMTP test, 2FA enforcement, security policies
├── admin_users.py              # User listing, activity, account actions, meeting analytics
├── admin_billing.py            # Coupons, tax rates
├── admin_monitoring.py         # Dashboard stats, system health
├── admin_storage.py            # Cloud storage config, migration
├── admin_video.py              # Video history, video API key settings
├── admin_messages.py           # Chat, internal messages, exports, broadcasts
├── admin_compliance.py         # Compliance score endpoint (2FA + password + login anomaly)
├── admin_2fa_dashboard.py      # 2FA adoption stats, reminders, auto-reminder scheduler
├── two_factor.py               # Admin 2FA setup/verify/disable
├── user_two_factor.py          # User 2FA setup/verify/disable + enforcement check
├── data_health.py              # Data health stats + cleanup
├── audit_logs.py               # Admin audit logging
├── auth.py                     # Login (with 2FA for ALL roles), register, password reset

/app/backend/scheduled/
├── data_health_digest.py       # Weekly data health email digest to super admins

/app/src/
├── components/
│   ├── UserTwoFactorSetup.jsx
│   ├── UserTwoFactorVerify.jsx
│   ├── admin/
│   │   ├── TwoFactorSetup.jsx
│   │   └── TwoFactorVerify.jsx
├── context/AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── UserSettingsPage.jsx
│   └── admin/
│       ├── Admin2FADashboardPage.jsx   # 2FA dashboard with auto-reminder toggle
│       ├── ComplianceScoreWidget.jsx   # Security health score on admin dashboard
│       └── AdminSecurityPolicies.jsx
```

## Recent Changes

### Compliance Score Widget — April 2, 2026
- **Backend**: `GET /api/admin/compliance-score` computes real-time security health score (0-100)
  - 2FA Adoption (40% weight), Password Strength (30%), Login Anomaly (30%)
  - Returns grade (A-F), breakdown with sub-scores and detail counts
- **Frontend**: `ComplianceScoreWidget.jsx` with circular SVG score ring, 3 sub-score progress bars, quick links
- **Placement**: Top of admin dashboard (ModernAdminDashboard.jsx), above metrics row
- Testing: 100% (9/9 backend, all frontend verified) — Iteration 99

### Scheduled Auto-Reminders + Admin Refactor + Data Health Digest — April 2, 2026
- **2FA Auto-Reminder**: Added weekly auto-reminder (Mondays 10 AM UTC) that emails all non-2FA users when enabled. Admin toggle in 2FA Dashboard stores setting in `admin_settings` collection.
- **Admin.py Refactor**: Split ~1850-line admin.py into 7 domain-specific files (admin_settings, admin_users, admin_billing, admin_monitoring, admin_storage, admin_video, admin_messages). admin.py is now a thin re-export shell. All endpoints remain identical.
- **Data Health Digest**: New scheduled job (Mondays 9:30 AM UTC) sends comprehensive data health summary email to all super admins via Resend. Covers user activation trends, orphaned records, stale data, collection sizes.
- **APScheduler**: Now runs 4 jobs: escalations (hourly), weekly digest (Mon 9 AM), data health digest (Mon 9:30 AM), 2FA auto-reminders (Mon 10 AM).
- Testing: 100% pass rate (17/17 backend, all frontend verified) — Iteration 98

### 2FA Adoption Dashboard — April 2, 2026
- Built admin dashboard for monitoring 2FA compliance across the organization
- **Backend**: 3 endpoints under `/api/admin/2fa-dashboard/` (stats, send-reminders, auto-reminder)
- **Frontend**: Admin2FADashboardPage.jsx with stat cards, role breakdown, auto-reminder toggle, user table
- Testing: 100% — Iteration 97

### User 2FA for All Roles — April 2, 2026
- Extended 2FA to ALL user roles. Login intercepts when requires_2fa is true.
- Testing: 100% — Iteration 96

### Feature Page Image Replacement — March 31, 2026
- Replaced ALL stock images across 15 feature pages with real app screenshots

### Production Deployment Fix — March 30, 2026
- Fixed .gitignore, Atlas DB connection override, plaintext password migration

## Key DB Schema
- `users`: `two_factor_enabled`, `two_factor_method`, `totp_secret`, `recovery_codes`
- `admin_settings`: `{key: "2fa_enforcement"}`, `{key: "2fa_auto_reminder", enabled, last_run, last_result}`
- `audit_logs`: System event tracking

## Key API Endpoints
- Compliance Score: `GET /api/admin/compliance-score`
- 2FA Dashboard: `GET /api/admin/2fa-dashboard/stats`, `POST /send-reminders`, `POST /auto-reminder`
- User 2FA: `/api/user/2fa/status/{id}`, `/setup`, `/verify-setup`, `/verify`, `/disable`
- Admin Enforcement: `GET/POST /api/admin/2fa-enforcement`
- Login: `POST /api/auth/login` (returns `requires_2fa` when enabled)

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat), Sora 2 (Video Gen), Resend (Emails/2FA OTP) — all via Emergent LLM Key

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Regular User: justinoo2001@gmail.com / Ogala@2023
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Standard User: justinogala@outlook.com / 4edfdukD@1

## Backlog (Prioritized)
- P3: Additional form templates
- P3: Advanced analytics/reporting
