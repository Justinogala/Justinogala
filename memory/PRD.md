# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Core Features (Implemented)
- User authentication (admin/regular users)
- Workspace management (create, join, manage members)
- Admin Dashboard with analytics
- ICT Support Request module with Excel data
- Org-wide Forms module with 8 Healthcare templates
- Resend email delivery for form submissions
- Real-time Chat messaging via SSE
- Video generation (Sora 2 Pro)
- Voice Chat, Text-to-Audio, Calendar, Meetings, Transcriptions
- eSignature, Approvals, IR/SOR Reports
- RBAC with module-level permissions + audit logging
- Organization-scoped admin access

## Recent Changes

### Push Notifications (Browser/PWA) — March 28, 2026
- **Browser push notifications** via Web Push (VAPID keys + pywebpush)
- When time-off/swap requests are submitted, workspace owners receive 3 types of alerts:
  1. In-app notification (MongoDB `manager_notifications`)
  2. Email notification (Resend)
  3. Browser push notification (Web Push API)
- **PushNotificationPrompt**: Bottom-right banner that asks users to enable push after 3s delay
- **Service Worker**: Updated with JSON payload parsing, action buttons, deep link navigation on click
- **NotificationSettings**: Updated to pass userId when subscribing/unsubscribing
- Backend: 4 push endpoints (`/api/push/vapid-key`, `subscribe`, `unsubscribe`, `status`)
- 100% test pass rate (iteration_88)

### Manager Notification System + Dashboard Feature Page — March 28, 2026
- In-app + email alerts to workspace owners on time-off/swap requests
- ManagerNotificationBell component with unread count, panel, mark read
- Dashboard Feature Page at `/features/dashboard` with live data widget
- 100% test pass rate (iteration_87)

### Shift Management Phase 1 & 2 — March 28, 2026
- Time clock punch in/out with live timer (Phase 1)
- Time-off requests, swap requests, balance tracking, PDF export (Phase 2)
- 100% test pass rates (iterations 85, 86)

## Architecture
```
/app/
├── backend/routes/
│   ├── push_notifications.py  # Push subscription CRUD + send_push_to_user
│   ├── time_clock.py          # Workspace time clock
│   ├── shifts.py              # Shifts, time-off, swap, balance, notifications
│   ├── ai_chat.py             # AI Chat with GPT-5.2
│   ├── analytics.py           # Live platform stats
│   └── ...
└── frontend/src/
    ├── components/
    │   ├── PushNotificationPrompt.jsx  # Enable push banner
    │   ├── shifts/ManagerNotificationBell.jsx
    │   └── pwa/NotificationSettings.jsx  # Push toggle in settings
    ├── services/pushNotificationService.js  # Push subscription management
    ├── pages/features/FeatureDashboardPage.jsx
    └── public/serviceWorker.js  # Push event handler
```

## Key DB Collections
- `push_subscriptions` — Browser push subscription data per user
- `manager_notifications` — In-app notifications for workspace owners
- `time_clock`, `shifts`, `time_off_requests`, `time_off_balances`, `shift_swap_requests`
- `ai_conversations`, `ai_messages`, `ai_chat_files`

## 3rd Party Integrations
- OpenAI GPT-5.2, Whisper (Emergent LLM Key)
- Emergent Object Storage
- Resend (Email, RESEND_API_KEY)
- pywebpush (Web Push Protocol, VAPID keys)

## Backlog

### P1
- Demo video shows "Numbus" instead of "Munal" (recurring, needs Sora 2 regeneration)

### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext / AdminAuthContext
- 2FA for admin accounts
- Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
