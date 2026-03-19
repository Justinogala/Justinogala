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
11. Approvals & Workflow Management Module (Phase 1 + P1 enhancements)

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

### Approvals Module - P1 Enhancements (Complete - Mar 2026)
- **Admin Template Management**: Full CRUD page at /admin/approval-templates
  - 23 default templates (read-only, locked with badge)
  - Create/Edit/Delete custom templates with fields builder
  - Search and category filter
  - Preview template fields dialog
  - Scope setting (org-wide or team-specific)
- **In-App Notifications**:
  - Backend `approval_notifications` collection
  - Notifications on: create (to approvers), approve/reject/cancel (to sender), comment (to all participants)
  - Notification bell icon on Approvals dashboard with unread count badge
  - Notification panel dropdown with message list
  - Mark as read functionality
  - In-app notification via NotificationContext on approval creation
- **Integration with Meetings/Files/Chat**:
  - "Link Meeting" button with meeting picker dialog in Create form
  - "Attach File" button with file picker dialog in Create form
  - linked_meeting and linked_files stored in approval document
  - Linked items shown in Approval Detail view

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
- Approvals Phase 2: AI insights, analytics dashboard, bottleneck detection
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Scheduled rotation for external API keys

## Key Architecture Files
- Backend: `/app/backend/server.py`, `/app/backend/routes/approvals.py`
- Frontend: `/app/src/pages/ApprovalsPage.jsx`, `/app/src/pages/admin/AdminApprovalTemplatesPage.jsx`
- Sidebar: `/app/src/components/UserSidebar.jsx`, `/app/src/components/AdminSidebar.jsx`
- Routes: `/app/src/App.jsx`
- Tests: `/app/backend/tests/test_approvals_api.py`, `/app/backend/tests/test_approvals_p1_features.py`

## Key API Endpoints (Approvals)
- `GET /api/approvals/templates` - List all templates
- `GET /api/approvals/templates/{id}` - Get specific template
- `POST /api/approvals/templates` - Create custom template
- `PUT /api/approvals/templates/{id}` - Update custom template
- `DELETE /api/approvals/templates/{id}` - Delete custom template
- `POST /api/approvals/create` - Create approval (with linked_meeting, linked_files)
- `GET /api/approvals/list` - List approvals (filtered)
- `GET /api/approvals/detail/{id}` - Full detail with comments and audit
- `POST /api/approvals/action/{id}` - Approve/reject/cancel/reassign
- `POST /api/approvals/comments/{id}` - Add comment
- `GET /api/approvals/stats` - Dashboard statistics
- `GET /api/approvals/export` - CSV export
- `GET /api/approvals/notifications` - Get user notifications
- `POST /api/approvals/notifications/read` - Mark all read
- `POST /api/approvals/notifications/{id}/read` - Mark single read

## DB Collections (Approvals)
- `approvals` - Main approval requests (with linked_meeting, linked_files, linked_chat_message)
- `approval_templates` - Custom templates (is_custom=true)
- `approval_comments` - Comments on approvals
- `approval_audit` - Immutable audit trail
- `approval_notifications` - Per-user notification records
