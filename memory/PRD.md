# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, and SharePoint-style Workspace Hubs with templates.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Approvals Module (Complete)
- Phase 1: Dashboard, Template Store (23 templates), Workflow Engine, CRUD, CSV Export
- P1: Admin Template CRUD, In-App Notifications, Meetings/Files/Chat Integration
- Phase 2: Analytics (4 charts), AI Insights, Bottleneck Detection, Duplicate Request
- Weekly Digest: Resend email, APScheduler cron (Monday 9AM), user preferences

### SharePoint-Style Workspace Hub (Complete)
- Hero Banner with scope badge, Quick Access grid, Activity feed, Announcements CRUD
- Dynamic Stats from DB, Tab navigation (Home/News/Members/Activity/Settings)

### Workspace Templates (Complete - Mar 2026)
- **6 Pre-built Blueprints**: Project Team, HR Department, Finance, Engineering, Marketing, General
- **Auto-seeding on creation**: Welcome announcements (pinned), department-specific approval templates, custom quick links
- **Template Selection Step**: Step 0 in Create Workspace modal with card grid, "Start from Scratch" option

### Workspace Dashboard Widget (Complete - Mar 2026)
- **Backend**: `GET /api/workspaces/dashboard/summary?user_id=xxx` aggregates workspace data with pending approvals, announcements, member counts
- **Frontend**: `WorkspaceDashboardWidget` component in right sidebar of UserDashboard
- **Features**: Color-coded workspace icons, scope indicators (globe/lock), pending approval badges, "ALL CLEAR" status, max 4 items with "View all" link, navigation to workspace detail on click
- **Tested**: 100% pass rate (12/12 backend, all frontend verified)

### Other Features (Complete)
- User/Admin auth (JWT + refresh tokens), Workspace management
- Full file manager, AI messaging, Text-to-Video (Sora 2), Text-to-Audio
- IR/SOR system, Admin reports, eSignature with PDF signing
- Security hardening, Real-time notifications (SSE), Password complexity, Audit logging

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals (assign pending requests to a substitute)
### P2
- Approvals Module Phase 2: Further AI insights, advanced analytics, bottleneck detection
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
- Scheduled rotation for external API keys

## Key API Endpoints
### Workspace Dashboard
- `GET /api/workspaces/dashboard/summary?user_id=xxx` - Aggregated workspace summary with pending actions

### Workspace Templates
- `GET /api/workspaces/templates` - List 6 templates (summary)
- `GET /api/workspaces/templates/{id}` - Full template with announcements & approval templates
- `POST /api/workspaces` - Create workspace (with template_id for auto-seeding)

### Workspaces
- `GET/PUT/DELETE /api/workspaces/{id}`
- `GET /api/workspaces/{id}/stats`, `GET /api/workspaces/{id}/activity`
- `GET/POST/PUT/DELETE /api/workspaces/{id}/announcements`

### Approvals
- Templates, CRUD, Actions, Comments, Stats, Export, Analytics, Duplicate, Notifications, Digest

## DB Collections
- `workspaces` (with settings.quick_links, settings.template_id)
- `workspace_members`, `workspace_announcements`
- `approvals`, `approval_templates`, `approval_comments`, `approval_audit`, `approval_notifications`, `approval_digest_prefs`

## Key Files
- `/app/src/components/user/WorkspaceDashboardWidget.jsx` (NEW)
- `/app/src/pages/user/UserDashboard.jsx` (MODIFIED - added widget)
- `/app/backend/routes/workspaces.py` (MODIFIED - added dashboard/summary endpoint)
