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
- Organization-scoped admin access (broadcasts, user visibility)
- Super Admin: Assign users to organizations from Users page

## Recent Changes

### Shift Management — Phase 2: Time-Off, Swap, Balance, PDF (March 28, 2026)
- **Time-Off Request Dialog**: Users can submit time-off requests with type (vacation/sick/personal/other), date range, and reason
- **Shift Swap Dialog**: Users can request to swap one of their shifts with another team member
- **Time-Off Balance Tracking**: Balance cards showing vacation (15d), sick (10d), personal (5d) with progress bars. Admin can update allocations via PUT endpoint
- **PDF Export**: Added "Export as PDF Report" option to export dropdown — generates styled HTML report with shift data
- **Quick Access**: "Shifts" button already present in workspace hero; Shift Management page fully accessible
- Backend: New endpoints `/api/shifts/time-off-balance/{ws}/{user}` (GET), `/api/shifts/time-off-balance` (PUT), `/api/shifts/export-pdf/{ws}` (GET)
- Fixed route ordering bug: `PUT /time-off-balance` moved before `/{shift_id}` catch-all
- 100% test pass rate (backend 14/14, frontend all features verified — iteration_86)

### Shift Management — Phase 1: Time Clock (March 28, 2026)
- Workspace-level punch in/out system (independent of scheduled shifts)
- 5 endpoints in `/api/time-clock/` with double-clock prevention
- Frontend: Clock In/Out button in workspace hero + live HH:MM:SS timer
- Time Clock history card in Home tab sidebar
- 100% test pass rate (iteration_85)

### AI Chat, Legal Pages, Analytics (March 27, 2026)
- ChatGPT-style AI chat at /ai-chat powered by GPT-5.2
- Security, Cookies, Trademarks legal pages
- Live analytics dashboard on features page

## Architecture
```
/app/
├── backend/routes/
│   ├── time_clock.py          # Workspace time clock (Phase 1)
│   ├── shifts.py              # Shift scheduling, time-off, swap, balance, export (Phase 1+2)
│   ├── ai_chat.py             # AI Chat with GPT-5.2
│   ├── analytics.py           # Live platform stats
│   ├── admin.py               # Broadcasts + Exports (org-scoped)
│   ├── auth.py                # Login, JWT
│   ├── users.py               # User management
│   ├── organizations.py       # Org CRUD
│   └── module_permissions.py  # RBAC
└── frontend/src/
    ├── pages/
    │   ├── ShiftManagementPage.jsx  # Full shift mgmt (calendar, time-off, swap, balance, export)
    │   ├── WorkspaceDetailPage.jsx  # Time Clock widget + shift access
    │   ├── AIChatPage.jsx           # AI chat
    │   └── Legal/                   # Cookies, Trademarks, Security
    └── services/
        └── shiftService.js          # All shift API functions
```

## Key DB Collections
- `shifts`, `time_entries`, `shift_presets` — Shift scheduling
- `time_clock` — Workspace time clock (Phase 1)
- `time_off_requests` — Time-off requests
- `time_off_balances` — Allocated time-off days
- `shift_swap_requests` — Swap requests
- `ai_conversations`, `ai_messages`, `ai_chat_files` — AI Chat

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat) — Emergent LLM Key
- OpenAI Whisper (Voice Chat) — Emergent LLM Key
- Emergent Object Storage — EMERGENT_LLM_KEY
- Resend (Email) — RESEND_API_KEY

## Backlog

### P1
- Demo video shows "Numbus" instead of "Munal" (recurring — needs Sora 2 regeneration)

### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
