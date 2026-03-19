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
- **Auto-fill**: Selecting template pre-fills name, description, color, icon, scope
- **Template Badge**: Shows "Using: {name} template" in Step 1 with "Change" link
- **Custom Quick Links**: Template-specific links stored in workspace.settings and rendered in hub
- **Approval Templates**: Seeded as is_custom=true with team_id=workspace_id
  - HR: Leave Request, New Hire Onboarding, Performance Review
  - Finance: Expense Report, Budget Request, Invoice Approval
  - Engineering: Deployment Request, Incident Report
  - Marketing: Campaign Proposal, Content Review
  - Project Team: Sprint Sign-off, Change Request

### Other Features (Complete)
- User/Admin auth (JWT + refresh tokens), Workspace management
- Full file manager, AI messaging, Text-to-Video (Sora 2), Text-to-Audio
- IR/SOR system, Admin reports, eSignature with PDF signing
- Security hardening, Real-time notifications (SSE), Password complexity, Audit logging

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Prioritized Backlog
### P2
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
- Scheduled rotation for external API keys

## Key API Endpoints
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
