# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, and Approvals & Workflow Management.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2 (video generation), Stripe, Resend, emergentintegrations

## Core Requirements
1. User/Admin authentication with JWT + refresh tokens
2. Workspace management
3. Full-featured file manager
4. Messaging system with AI features (Smart Replies, AI Draft, Summarize, AI Compose)
5. Text-to-Video generator (Sora 2) with voice selection
6. Text-to-Audio (TTS)
7. Complete IR/SOR system with escalation workflow
8. Functional admin report system
9. eSignature module with PDF signing
10. Security hardening (rate limiting, input sanitization, CORS, CSP, audit logging, field-level encryption)
11. Approvals & Workflow Management Module (Phase 1 + P1 + Phase 2)

## What's Been Implemented

### Approvals Module - Phase 1 (Complete)
- Sidebar navigation with "Approvals" link and NEW badge
- Dashboard with stats cards (Pending Received/Sent, Approved, Rejected)
- Received/Sent tabs with search, status/priority filters
- Template Store with 23 templates across 6 categories
- Create Approval form (title, priority, workflow type, description, template fields, approvers)
- Workflow Engine supporting single-step, sequential, and parallel workflows
- Approval Detail view with Details/Workflow/Comments/Audit Trail tabs
- Approve/Reject/Cancel actions with workflow step progression
- Comments system, Immutable audit trail, CSV export

### Approvals Module - P1 Enhancements (Complete)
- Admin Template Management at /admin/approval-templates (full CRUD)
- In-App Notifications (create, approve, reject, cancel, comment triggers)
- Bell icon with unread badge, notification panel
- Integration with Meetings/Files/Chat (Link Meeting, Attach File pickers)

### Approvals Module - Phase 2 (Complete - Mar 2026)
- **Analytics Dashboard**: 
  - Summary cards (Total Requests, Approval Rate %, Avg Resolution Time, Most Active Category)
  - Request Volume area chart (30 days, created vs resolved)
  - Status Distribution donut chart
  - Requests by Category bar chart
  - Avg Resolution Time by Category bar chart
- **AI Insights** (data-driven, no LLM cost):
  - Trend detection (volume increase/decrease week-over-week)
  - High rejection rate alerts by category
  - Approval rate health check
  - Peak activity patterns (busiest day of week)
  - Bottleneck alert summaries
- **Bottleneck Detection**:
  - Slow approvers (avg response > 24h, severity: medium/high)
  - Stuck requests (pending > 3 days, severity escalation)
  - Actionable messages with severity badges
- **Duplicate Request**:
  - "Duplicate" button in approval detail view
  - One-click cloning preserving form_data, approvers, priority, category, description
  - New approval created with "(Copy)" suffix, status: pending, source: "Duplicated"
  - Notifications sent to approvers on duplicate

### Other Features (Complete)
- Voice selection for Text-to-Video, PDF/Word converters, File conversion history
- Features mega-menu, Reply toolbar with attachments, CC/BCC in messaging
- Meeting history, Admin role management, Incident analytics
- Real-time notifications (SSE), Password complexity policies
- Refresh token rotation, Audit logging, Field-level encryption

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Prioritized Backlog

### P2
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Scheduled rotation for external API keys

## Key API Endpoints (Approvals)
- `GET /api/approvals/templates` - List all templates
- `POST/PUT/DELETE /api/approvals/templates/{id}` - Template CRUD
- `POST /api/approvals/create` - Create approval (with linked items)
- `GET /api/approvals/list` - List approvals (filtered)
- `GET /api/approvals/detail/{id}` - Full detail
- `POST /api/approvals/action/{id}` - Approve/reject/cancel
- `POST /api/approvals/comments/{id}` - Add comment
- `GET /api/approvals/stats` - Dashboard statistics
- `GET /api/approvals/export` - CSV export
- `GET /api/approvals/notifications` - User notifications
- `POST /api/approvals/notifications/read` - Mark read
- `GET /api/approvals/analytics` - Full analytics (charts, insights, bottlenecks)
- `POST /api/approvals/duplicate/{id}` - Clone existing approval

## DB Collections (Approvals)
- `approvals` - Main requests (with linked_meeting, linked_files, linked_chat_message)
- `approval_templates` - Custom templates
- `approval_comments` - Comments
- `approval_audit` - Immutable audit trail
- `approval_notifications` - Per-user notifications
