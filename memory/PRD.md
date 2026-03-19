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
11. **Approvals & Workflow Management Module** (Phase 1)

## What's Been Implemented
- All core features 1-10 listed above
- **Approvals Module (Phase 1)** - COMPLETED Feb 2026:
  - Sidebar navigation with "Approvals" link and NEW badge
  - Dashboard with stats cards (Pending Received/Sent, Approved, Rejected)
  - Received/Sent tabs with search, status/priority filters
  - Template Store with 23 templates across 6 categories (Activity, Administration, Projects, Attendance, Finance, Order Management)
  - Create Approval form (title, priority, workflow type, description, template fields, approvers)
  - Workflow Engine supporting single-step, sequential, and parallel workflows
  - Approval Detail view with Details/Workflow/Comments/Audit Trail tabs
  - Approve/Reject/Cancel actions with workflow step progression
  - Comments system
  - Immutable audit trail logging
  - CSV export functionality
  - Conditional workflow rules (auto-add approvers based on field values)
- Voice selection dropdown for Text-to-Video
- PDF to Word / Word to PDF converters on eSignature page
- File conversion history panel
- Features mega-menu dropdown
- Reply toolbar with file attachment, drag-and-drop, AI tools
- CC/BCC in messaging, Meeting history, Admin role management
- Incident analytics dashboard, Real-time notifications (SSE)
- Password complexity policies, Refresh token rotation + auto-logout
- Audit logging, Field-level data encryption

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Prioritized Backlog

### P1 - Approvals Phase 1 Continued
- Template Management admin page
- In-app notifications for approval actions
- Integration with existing Meetings/Files/Chat modules

### P2
- Approvals Module Phase 2: AI insights, analytics dashboard, bottleneck detection
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Scheduled rotation for external API keys

## Key Architecture Files
- Backend: `/app/backend/server.py`, `/app/backend/routes/approvals.py`, `/app/backend/routes/ai.py`, `/app/backend/security.py`
- Frontend: `/app/src/pages/ApprovalsPage.jsx`, `/app/src/components/UserSidebar.jsx`, `/app/src/App.jsx`
- Tests: `/app/backend/tests/test_approvals_api.py`

## Key API Endpoints (Approvals)
- `GET /api/approvals/templates` - List templates (23 default + custom)
- `GET /api/approvals/templates/{id}` - Get specific template
- `POST /api/approvals/templates` - Create custom template
- `POST /api/approvals/create` - Create approval request
- `GET /api/approvals/list` - List approvals (filtered by user/tab/status/priority/search)
- `GET /api/approvals/detail/{id}` - Full detail with comments and audit
- `POST /api/approvals/action/{id}` - Approve/reject/cancel/reassign
- `POST /api/approvals/comments/{id}` - Add comment
- `GET /api/approvals/stats` - Dashboard statistics
- `GET /api/approvals/export` - CSV export

## DB Collections (Approvals)
- `approvals` - Main approval requests
- `approval_templates` - Custom templates
- `approval_comments` - Comments on approvals
- `approval_audit` - Immutable audit trail
