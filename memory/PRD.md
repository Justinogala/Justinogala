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
- Role-Based Access Control (RBAC) with module-level permissions
- Permission audit logging
- Organization-scoped admin access

## Recent Changes

### Manager Notification System + Dashboard Feature Page (March 28, 2026)
- **In-app notifications**: When a time-off or swap request is submitted, a notification is created in MongoDB (`manager_notifications`) for the workspace owner
- **Email notifications**: Background Resend email sent to workspace owner (if RESEND_API_KEY configured)
- **ManagerNotificationBell component**: Bell icon in Shift Management header with unread count, notification panel, mark read/mark all read
- **Notifications poll every 30s** for real-time updates
- **Dashboard Feature Page** (`/features/dashboard`): Public marketing page with live data widget showing Team Members, Active Meetings, Hours Tracked, Documents, Weekly Activity chart, Notifications panel, Module Usage bars
- Backend: 3 notification endpoints + 1 global summary endpoint
- 100% test pass rate (iteration_87)

### Shift Management Phase 2 (March 28, 2026)
- Time-Off Request Dialog, Shift Swap Dialog, Balance tracking cards, PDF export
- 100% test pass rate (iteration_86)

### Shift Management Phase 1 (March 28, 2026)
- Workspace-level punch in/out with live timer
- 100% test pass rate (iteration_85)

## Architecture
```
/app/
├── backend/routes/
│   ├── time_clock.py          # Workspace time clock
│   ├── shifts.py              # Shifts, time-off, swap, balance, notifications, PDF export
│   ├── ai_chat.py             # AI Chat with GPT-5.2
│   ├── analytics.py           # Live platform stats
│   └── ...
└── frontend/src/
    ├── components/shifts/
    │   └── ManagerNotificationBell.jsx  # Bell + notification panel
    ├── pages/
    │   ├── features/FeatureDashboardPage.jsx  # Dashboard feature page
    │   ├── ShiftManagementPage.jsx            # Full shift mgmt
    │   └── WorkspaceDetailPage.jsx            # Time clock widget
    └── services/
        └── shiftService.js
```

## Key DB Collections
- `manager_notifications` — In-app notifications for workspace owners
- `time_clock` — Workspace time clock entries
- `time_off_requests`, `time_off_balances` — Time-off system
- `shift_swap_requests` — Swap requests
- `shifts`, `shift_presets` — Shift scheduling

## 3rd Party Integrations
- OpenAI GPT-5.2, Whisper (Emergent LLM Key)
- Emergent Object Storage
- Resend (Email, requires RESEND_API_KEY)

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
