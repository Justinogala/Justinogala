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

### Real-Time Dashboard Activity Updates - COMPLETED (March 24, 2026)
- Created SSE endpoint `/api/dashboard/activity/stream` that pushes data every 20 seconds
- Frontend `useDashboardStream` hook connects via EventSource for live updates
- Green pulsing "LIVE" indicators on both Weekly Activity chart and Recent Activity feed
- `AnimatedNumber` component with eased transitions for smooth stat counter changes
- `effectiveStats` pattern: SSE live stats merged with initial data for seamless updates
- Slide-in animations for new activity feed items (framer-motion AnimatePresence)
- "Updated Just now" timestamp on the activity graph
- 34 tests passed (9 backend + 25 frontend, iteration_68.json)

### Quick Action Link Fixes - COMPLETED (March 24, 2026)
- Fixed eSignature link: `/e-signature` (404) → `/esignature` (working)
- Fixed AI Assistant link: `/ai-chat` (404) → `/messages` (working)

### Activity Graph & Feed - COMPLETED (March 24, 2026)
- Weekly Activity bar chart (recharts) showing Messages, Approvals, Meetings, Logins over 7 days
- Recent Activity feed showing 10 most recent items across all types
- Backend endpoint `/api/dashboard/activity` aggregates data from multiple collections

### User Dashboard Redesign - COMPLETED (March 24, 2026)
- Dynamic stats from API (Workspaces, Team Members, Pending Approvals, Announcements)
- 8 quick action buttons with gradient icons
- Workspace cards showing real data with member counts and scope badges
- Dark hero banner, animated entrance transitions (framer-motion)

### Chat Module Enhancements - COMPLETED
1. SSE Connection Stability Fix - Fixed status flickering
2. File Attachments with Object Storage - Chat file uploads via Emergent Object Storage
3. Rich Presence Status System - Teams/Slack-style user presence (6 status types)

### Call & Voice Fixes - COMPLETED
- Backend checks if target user is online before initiating call
- Voice recordings upload to object storage
- 30-second call timeout, TURN servers for NAT traversal

### Mobile-Friendly Optimization - COMPLETED
- Global CSS: prevented horizontal overflow, touch-friendly tap targets, iOS zoom prevention
- WorkspaceChatPage: Full-width sidebar on mobile with show/hide panels

### Other Completions
- Quick Links Fix (Submit Ticket, My Tickets buttons)
- Admin Workspace Deletion (Fixed 500 error)
- Global Search API + UI (/api/search endpoint)

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── chat.py              # SSE, messages, file upload, presence APIs
│   │   ├── dashboard.py         # Activity API + SSE stream endpoint
│   │   ├── forms.py             # Org-wide template CRUD & submissions
│   │   ├── workspaces.py        # Workspace management, dashboard summary
│   │   ├── admin.py             # Admin routes
│   │   ├── search.py            # Global search endpoint
│   │   ├── calls.py             # WebRTC calls with offline validation
│   │   └── admin_workspaces.py  # Admin workspace deletion
│   └── server.py
└── frontend/src/
    ├── components/
    │   ├── user/
    │   │   ├── DashboardActivity.jsx    # ActivityGraph, RecentActivityFeed, useDashboardStream, AnimatedNumber, LiveDot
    │   │   ├── WorkspaceDashboardWidget.jsx
    │   │   ├── MeetingListSection.jsx
    │   │   └── RecentFilesSection.jsx
    │   ├── chat/
    │   │   ├── UserPresenceStatus.jsx
    │   │   └── VoiceMessageRecorder.jsx
    │   └── search/
    │       ├── MobileSearchOverlay.jsx
    │       └── SearchResultsDropdown.jsx
    ├── pages/
    │   ├── user/UserDashboard.jsx   # Real-time dashboard with SSE
    │   ├── WorkspaceChatPage.jsx
    │   └── WorkspaceDetailPage.jsx
    └── hooks/useWebSocketChat.js    # Chat SSE hook
```

## Key API Endpoints
- `GET /api/dashboard/activity` - Activity graph + feed data
- `GET /api/dashboard/activity/stream` - SSE real-time stream (sends init, update, ping events)
- `GET /api/workspaces/dashboard/summary` - Dashboard summary with workspace counts
- `POST /api/chat/messages` - Send message
- `GET /api/chat/stream/{user_id}` - Chat SSE stream
- `GET /api/search` - Global cross-entity search

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
