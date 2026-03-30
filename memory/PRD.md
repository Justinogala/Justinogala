# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Recent Changes

### Onboarding Walkthrough — March 30, 2026
- **8-step welcome modal** for new users on first login: Welcome, Dashboard, AI Chat, Workspaces, Calendar, Messaging, Shift Management, Completion
- **Backend persistence**: GET/PUT/DELETE `/api/users/{id}/onboarding` endpoints
- **Skip & replay**: Users can skip anytime; "Restart Tour" button in Settings > Account tab
- **localStorage + API sync**: Dual-layer state for instant UX
- 100% test pass rate (iteration_91)

### Landing Page Mobile Fix + Demo Video Branding — March 30, 2026
- **Hero section mobile layout**: `flex-col-reverse lg:flex-row` so image appears ON TOP of text on mobile
- **Full-width image**: `max-w-full` on mobile, proper sizing on all viewports
- **Nav controls fix**: Changed from absolute to relative positioning on mobile to prevent overlapping
- **Demo video**: Regenerated with Sora 2 showing "Munal" branding
- 100% test pass rate (iteration_90)

### Time Clock Reports Page — March 28, 2026
- Reports page at `/workspace/{id}/time-clock-reports` with Daily/Weekly/Monthly/Yearly views
- Role-based access: Admin can generate/export, Manager can view only
- 100% test pass rate (iteration_89)

### Push Notifications (Browser/PWA) — March 28, 2026
- Browser push via Web Push (VAPID + pywebpush), 3-layer notifications
- 100% test pass rate (iteration_88)

### Manager Notifications + Dashboard Feature Page — March 28, 2026
- In-app + email alerts, ManagerNotificationBell, Dashboard at /features/dashboard
- 100% test pass rate (iteration_87)

### Shift Management Phase 1 & 2 — March 28, 2026
- Time clock, time-off/swap/balance/PDF export
- 100% test pass rates (iterations 85, 86)

## Architecture
```
/app/backend/routes/
├── users.py               # User CRUD + onboarding endpoints
├── time_clock.py          # Time clock + Reports
├── push_notifications.py  # Push subscriptions
├── shifts.py              # Shifts, time-off, swap, balance
├── ai_chat.py, analytics.py, admin.py, auth.py, organizations.py...

/app/frontend/src/
├── components/
│   ├── OnboardingWalkthrough.jsx    # 8-step welcome modal
│   ├── settings/AccountSettingsSection.jsx  # Restart Tour button
│   └── ...
├── layouts/UserLayout.jsx           # Renders onboarding
├── pages/LandingPage.jsx            # Hero carousel with mobile-first layout
```

## Key DB Collections
`users` (includes `onboarding_completed`), `time_clock`, `push_subscriptions`, `manager_notifications`, `time_off_requests`, `time_off_balances`, `shift_swap_requests`, `shifts`, `shift_presets`, `ai_conversations`, `ai_messages`

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
- Remove unused SettingsPage.jsx (route uses UserSettingsPage.jsx)
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
- Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
