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

## Recent Changes (March 2026)

### User Dashboard Redesign - COMPLETED (March 24, 2026)
- Replaced hardcoded stats with dynamic data from `/api/workspaces/dashboard/summary` API
- Stats now show real Workspaces count, Team Members, Pending Approvals, Announcements
- Added 8 quick action buttons (New Meeting, Record, Transcribe, Chat, Workspaces, eSignature, AI Assistant, Reports)
- Added workspace cards showing real workspace data with member counts and scope badges
- Dark hero banner with gradient, animated entrance transitions (framer-motion)
- Mobile responsive (375px, 768px, 1920px tested)
- All 34 frontend tests passed (iteration_66.json)

### Chat Module Enhancements - COMPLETED
1. **SSE Connection Stability Fix** - Fixed status flickering
2. **File Attachments with Object Storage** - Chat file uploads via Emergent Object Storage
3. **Rich Presence Status System** - Teams/Slack-style user presence (6 status types)

### Call & Voice Fixes - COMPLETED
- Backend checks if target user is online before initiating call
- Voice recordings upload to object storage
- 30-second call timeout on frontend, TURN servers for NAT traversal

### Mobile-Friendly Optimization - COMPLETED
- Global CSS: prevented horizontal overflow, touch-friendly tap targets, iOS zoom prevention
- WorkspaceChatPage: Full-width sidebar on mobile with show/hide panels
- Dashboard, WorkspaceDetailPage, WorkspacesPage, AdminFormsPage, ICT Support all responsive

### Other Completions
- Quick Links Fix (Submit Ticket, My Tickets buttons)
- Admin Workspace Deletion (Fixed 500 error)
- Global Search API + UI (/api/search endpoint)

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── chat.py          # SSE, messages, file upload (object storage), presence APIs
│   │   ├── forms.py         # Org-wide template CRUD & submissions
│   │   ├── workspaces.py    # Workspace management, dashboard summary API
│   │   ├── admin.py         # Admin routes
│   │   ├── search.py        # Global search endpoint
│   │   ├── calls.py         # WebRTC calls with offline user validation
│   │   └── admin_workspaces.py # Admin workspace deletion
│   ├── services/storage.py  # Cloud storage service
│   ├── config.py            # DB, logging config
│   └── server.py            # FastAPI app, router registration
└── frontend/src/
    ├── components/
    │   ├── chat/
    │   │   ├── UserPresenceStatus.jsx  # Rich presence dropdown
    │   │   ├── EnhancedMessageInput.jsx # Chat input with attachments
    │   │   └── VoiceMessageRecorder.jsx # Voice recording
    │   ├── user/
    │   │   ├── WorkspaceDashboardWidget.jsx
    │   │   ├── MeetingListSection.jsx
    │   │   └── RecentFilesSection.jsx
    │   ├── search/
    │   │   ├── MobileSearchOverlay.jsx
    │   │   └── SearchResultsDropdown.jsx
    │   ├── UsageDashboard.jsx
    │   └── TranscriptionWidget.jsx
    ├── hooks/useWebSocketChat.js    # SSE connection (ref-based, stable)
    ├── pages/
    │   ├── user/UserDashboard.jsx   # REDESIGNED: Dynamic data, 8 quick actions
    │   ├── WorkspaceChatPage.jsx    # Core chat UI
    │   └── WorkspaceDetailPage.jsx  # Fixed quick links, mobile tabs
    └── services/
        ├── fileService.js
        ├── entitlementsService.js
        └── webrtcService.js
```

## Key API Endpoints
- `POST /api/chat/messages` - Send message
- `POST /api/chat/files/upload` - Upload file
- `GET /api/chat/files/{id}/download` - Download file
- `PUT /api/chat/presence/status` - Set user status
- `GET /api/chat/presence/status/{user_id}` - Get user status
- `GET /api/chat/stream/{user_id}` - SSE event stream
- `GET /api/workspaces/dashboard/summary?user_id=` - Dashboard summary data
- `GET /api/search` - Global cross-entity search
- `DELETE /api/admin/workspaces/{workspace_id}` - Admin workspace deletion

## 3rd Party Integrations
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Resend (Email Delivery) — RESEND_API_KEY
- Emergent Object Storage — EMERGENT_LLM_KEY

## Backlog

### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned data from workspace_members table

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Credentials
- Admin: admin@munal.com / Admin@123456
