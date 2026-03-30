# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Recent Changes

### Landing Page Mobile Fix + Demo Video Branding — March 30, 2026
- **Hero section mobile layout**: Changed to `flex-col-reverse lg:flex-row` so image appears ON TOP of text on mobile
- **Image sizing**: Set `max-w-[280px]` on mobile for proper width matching
- **Demo video**: Regenerated with Sora 2 showing "Munal" branding (replaced old "Numbus" video)
- 100% test pass rate (iteration_90)

### Time Clock Reports Page — March 28, 2026
- Reports page at `/workspace/{id}/time-clock-reports` with Daily/Weekly/Monthly/Yearly views
- Summary cards: Total Hours, Clock Entries, Team Members, Avg/Person
- Daily Hours chart (bar chart) + Team Breakdown (progress bars per user)
- Detailed Entries table with clock in/out times, duration, status
- Export Report button downloads styled HTML report (Admin only)
- Role-based access: Admin can generate/export, Manager can view only
- 100% test pass rate (iteration_89)

### Push Notifications (Browser/PWA) — March 28, 2026
- Browser push via Web Push (VAPID + pywebpush)
- 3-layer notifications: In-app + Email + Browser Push
- PushNotificationPrompt component, Service Worker push handler
- 100% test pass rate (iteration_88)

### Manager Notifications + Dashboard Feature Page — March 28, 2026
- In-app + email alerts, ManagerNotificationBell, Dashboard at /features/dashboard
- 100% test pass rate (iteration_87)

### Shift Management Phase 1 & 2 — March 28, 2026
- Time clock (Phase 1), Time-off/swap/balance/PDF export (Phase 2)
- 100% test pass rates (iterations 85, 86)

## Architecture
```
/app/backend/routes/
├── time_clock.py          # Time clock + Reports
├── push_notifications.py  # Push subscriptions
├── shifts.py              # Shifts, time-off, swap, balance, manager notifications
├── ai_chat.py, analytics.py, admin.py, auth.py, users.py, organizations.py...

/app/frontend/src/pages/
├── TimeClockReportsPage.jsx   # Reports with daily/weekly/monthly/yearly
├── ShiftManagementPage.jsx    # Full shift management
├── WorkspaceDetailPage.jsx    # Time clock widget
├── LandingPage.jsx            # Hero carousel with mobile-first layout
├── features/FeatureDashboardPage.jsx
```

## Key DB Collections
`time_clock`, `push_subscriptions`, `manager_notifications`, `time_off_requests`, `time_off_balances`, `shift_swap_requests`, `shifts`, `shift_presets`, `ai_conversations`, `ai_messages`

## 3rd Party Integrations
- Resend (Email Delivery)
- OpenAI GPT-5.2 (AI Chat) — Emergent LLM Key
- OpenAI Whisper (Voice Chat) — Emergent LLM Key
- Object Storage (File Uploads) — Emergent LLM Key
- OpenAI Sora 2 (Video Gen) — Emergent LLM Key

## Backlog
### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
- Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
