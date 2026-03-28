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

## Organization Model
- Organizations have three roles: **admin**, **manager**, **member**
- Org roles map to platform roles: `admin→Admin`, `manager→Manager`, `member→User`
- `Super_Admin` is platform-level only (not org-specific)
- Admin/Manager users are org-scoped: they see only their org's members
- Broadcasts/Scheduled Exports from org Admin go to their org only
- Super Admin broadcasts go to all users platform-wide
- Super Admin can assign any user to an org with a specific role from Users page
- Super Admin can remove users from organizations (reverts to personal account)

## Recent Changes

### Shift Management — Phase 1: Time Clock (March 28, 2026)
- Created workspace-level punch in/out system (independent of scheduled shifts)
- New backend: `/app/backend/routes/time_clock.py` with 5 endpoints:
  - POST /api/time-clock/clock-in (with double-clock prevention)
  - POST /api/time-clock/clock-out (calculates duration)
  - GET /api/time-clock/status/{workspace_id}/{user_id} (elapsed seconds)
  - GET /api/time-clock/history/{workspace_id}/{user_id} (recent entries)
  - GET /api/time-clock/today/{workspace_id} (workspace-wide daily view)
- Frontend: TimeClockWidget in workspace hero (green Clock In / red Clock Out button)
- Frontend: Live timer (HH:MM:SS) with pulsing green dot when clocked in
- Frontend: TimeClockHistoryCard in Home tab sidebar showing recent entries & total hours
- MongoDB collection: `time_clock`
- 100% test pass rate (backend 7/7, frontend all UI elements)

### Analytics Page — Live Dashboard (March 28, 2026)
- Replaced stock image on /features/analytics with live analytics widget
- New endpoint: GET /api/analytics/platform-stats (real MongoDB stats)
- Shows: stat cards, module usage bar chart, donut breakdown, 7-day activity sparkline
- Added heroComponent prop to FeaturePageLayout for reusable custom hero content

### AI Chat (ChatGPT-style) — COMPLETED (March 27, 2026)
- Full-screen AI chat page at /ai-chat powered by GPT-5.2 (Emergent LLM Key)
- Sidebar with conversation history, auto-titling, rename/delete
- SSE streaming responses with markdown + code syntax highlighting
- File upload (Emergent Object Storage), voice input (Whisper STT)
- 6 suggested prompts, stop generation, responsive design
- Navigation: AI Chat in UserSidebar + Header button (authenticated)
- Backend: /api/ai-chat/ routes, MongoDB collections: ai_conversations, ai_messages, ai_chat_files
- 17/17 backend tests passed, frontend bugs fixed (process.env, auth race condition)

### Security Legal Page — COMPLETED (March 27, 2026)
- Created /legal/security page with 10 sections
- Footer Legal column "Security" link now resolves correctly

### Manage Cookies & Trademarks Pages — COMPLETED (March 27, 2026)
- Created /legal/cookies and /legal/trademarks pages
- 15/15 frontend tests passed (iteration_82)

## Architecture
```
/app/
├── backend/routes/
│   ├── time_clock.py          # NEW - Workspace time clock (punch in/out)
│   ├── shifts.py              # Shift scheduling & management
│   ├── ai_chat.py             # AI Chat with GPT-5.2
│   ├── analytics.py           # Live platform stats
│   ├── admin.py               # Broadcasts + Exports (org-scoped)
│   ├── auth.py                # Login returns module_permissions, org info
│   ├── users.py               # Role+org-based user visibility
│   ├── organizations.py       # Org CRUD, member assign/remove
│   ├── module_permissions.py  # RBAC templates, audit log
│   └── server.py              # Super_Admin seed
└── frontend/src/
    ├── components/
    │   ├── Header.jsx
    │   ├── Footer.jsx
    │   └── features/
    ├── pages/
    │   ├── WorkspaceDetailPage.jsx  # Contains TimeClockWidget + TimeClockHistoryCard
    │   ├── AIChatPage.jsx
    │   └── Legal/
    └── lib/
        └── api.js
```

## Key API Endpoints
- `POST /api/time-clock/clock-in` - Punch in to workspace
- `POST /api/time-clock/clock-out` - Punch out of workspace
- `GET /api/time-clock/status/{ws_id}/{user_id}` - Current clock status
- `GET /api/time-clock/history/{ws_id}/{user_id}` - User clock history
- `GET /api/time-clock/today/{ws_id}` - Today's entries
- `POST /api/organizations/{org_id}/members/assign` - Assign user to org
- `GET /api/analytics/platform-stats` - Live platform stats
- `POST /api/ai-chat/conversations` - AI Chat conversations

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat) — Emergent LLM Key
- OpenAI Whisper (Voice Chat) — Emergent LLM Key
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Emergent Object Storage — EMERGENT_LLM_KEY
- Resend (Email Delivery) — RESEND_API_KEY

## Backlog

### P1
- Demo video shows "Numbus" instead of "Munal" (recurring — skipped 3 times, needs Sora 2 regeneration)
- Phase 2 Shift Management: Time-off requests/approvals, shift scheduling, swap/offer, balance tracking, CSV/PDF reports

### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456 (role: Super_Admin, no org)
- Org Admin: orgadmin@munal.com / OrgAdmin@123 (role: Admin, org: Munal Healthcare)
- Org Manager: orgmgr@munal.com / OrgMgr@123 (role: Manager, org: Munal Healthcare)
- Org Member: orgmember@munal.com / OrgMem@123 (role: User, org: Munal Healthcare)
