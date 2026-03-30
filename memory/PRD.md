# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Recent Changes

### P2 Cleanup Tasks — March 30, 2026
- **AdminStripeSettingsPage refactored**: Extracted 6 sub-components (ApiKeyCard, PriceIdsCard, SetupInstructions, PaymentStatusSidebar, TransactionsTable, StatusBadge), added data-testids, proper useCallback memoization, removed dead imports. 411 → 280 lines main component.
- **Orphaned workspace_members cleanup**: New endpoint `POST /api/admin/workspaces/cleanup/orphaned-members` finds and removes members referencing deleted workspaces/users.
- **Removed unused SettingsPage.jsx**: Route `/settings` uses `UserSettingsPage.jsx`; old file was dead code.

### Onboarding Walkthrough — March 30, 2026
- 8-step welcome modal for new users on first login
- Backend: GET/PUT/DELETE `/api/users/{id}/onboarding` endpoints
- Skip & replay: "Restart Tour" button in Settings > Account tab
- 100% test pass rate (iteration_91)

### Landing Page Mobile Fix + Demo Video — March 30, 2026
- Hero image full-width on mobile, nav controls no longer overlap
- Demo video regenerated via Sora 2 with "Munal" branding
- 100% test pass rate (iteration_90)

### Shift Management, Notifications, Reports — March 28, 2026
- Time Clock, Time-Off/Swap, Push Notifications, Time Clock Reports
- 100% test pass rates (iterations 85-89)

## Architecture
```
/app/backend/routes/
├── users.py               # User CRUD + onboarding
├── admin_workspaces.py    # Admin workspace mgmt + orphan cleanup
├── time_clock.py, push_notifications.py, shifts.py
├── ai_chat.py, analytics.py, admin.py, auth.py, organizations.py...

/app/frontend/src/
├── components/OnboardingWalkthrough.jsx
├── pages/admin/AdminStripeSettingsPage.jsx  # Refactored
├── layouts/UserLayout.jsx
├── pages/LandingPage.jsx
```

## Key DB Collections
`users`, `workspace_members`, `workspaces`, `time_clock`, `push_subscriptions`, `manager_notifications`, `time_off_requests`, `shifts`, `ai_conversations`, `ai_messages`

## 3rd Party Integrations
- Resend, OpenAI GPT-5.2, OpenAI Whisper, Object Storage, Sora 2 — all via Emergent LLM Key

## Backlog
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
- Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
