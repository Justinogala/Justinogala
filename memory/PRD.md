# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, and SharePoint-style Workspace Hubs.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Approvals Module (Complete)
- Phase 1: Dashboard, Template Store (23 templates), Workflow Engine, CRUD, CSV Export
- P1: Admin Template CRUD, In-App Notifications, Meetings/Files/Chat Integration
- Phase 2: Analytics Dashboard (4 charts), AI Insights, Bottleneck Detection, Duplicate Request
- Weekly Digest: Resend email, APScheduler cron (Monday 9AM), user preferences toggle

### SharePoint-Style Workspace Hub (Complete - Mar 2026)
- **Hero Banner**: Workspace icon, name, scope badge (Org/Team), description, quick actions (Shifts, Chat)
- **Dynamic Stats**: Real member count, file count, pending approvals, announcement count, weekly activity — all from DB
- **Quick Access Grid**: Chat, Files, Approvals, Calendar cards with gradient icons
- **Announcements (News)**: Full CRUD — create, pin to top, delete. Shown in Home + News tabs
- **Activity Feed**: Real activities from DB — member joins, approvals created, announcements posted
- **Workspace Scope**: Organisation-wide vs Team-specific during creation. Scope badge on cards & hub
- **Tab Navigation**: Home, News, Members, Activity, Settings — each fully functional
- **Settings Tab**: Edit name/description, scope display, danger zone with workspace delete

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
### Workspaces
- `POST /api/workspaces` (with scope: team|org)
- `GET/PUT/DELETE /api/workspaces/{id}`
- `GET /api/workspaces/{id}/stats` - Real-time stats
- `GET /api/workspaces/{id}/activity` - Activity feed
- `GET/POST/PUT/DELETE /api/workspaces/{id}/announcements` - Announcements CRUD

### Approvals
- Templates: `GET/POST/PUT/DELETE /api/approvals/templates[/{id}]`
- CRUD: `POST create`, `GET list`, `GET detail/{id}`, `POST action/{id}`, `POST comments/{id}`
- Analytics: `GET analytics`, `POST duplicate/{id}`, `GET stats`, `GET export`
- Notifications: `GET/POST notifications`, Digest: `GET preview`, `POST trigger`, `GET/POST preferences`

## DB Collections
- `workspaces`, `workspace_members`, `workspace_announcements`
- `approvals`, `approval_templates`, `approval_comments`, `approval_audit`, `approval_notifications`, `approval_digest_prefs`
- `users`, `messages`, `files`, `meetings`, `conversion_history`
