# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, and Approvals & Workflow Management.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Approvals Module - Phase 1 (Complete)
- Sidebar navigation, Dashboard with stats, Received/Sent tabs, search/filters
- Template Store (23 templates, 6 categories), Create Approval form
- Workflow Engine (single/sequential/parallel), Detail view, Comments, Audit trail, CSV export

### Approvals Module - P1 Enhancements (Complete)
- Admin Template Management (/admin/approval-templates) - full CRUD
- In-App Notifications (create/approve/reject/cancel/comment triggers)
- Integration with Meetings/Files/Chat (Link Meeting, Attach File pickers)

### Approvals Module - Phase 2 (Complete)
- Analytics Dashboard (4 summary cards + 4 Recharts charts)
- AI Insights (trend detection, rejection rates, approval health, peak patterns, bottleneck alerts)
- Bottleneck Detection (slow approvers >24h, stuck requests >3 days)
- Duplicate Request (one-click clone preserving all data)

### Weekly Digest Email (Complete - Mar 2026)
- **Scheduler**: APScheduler cron job runs every Monday 9 AM UTC
- **Resend Integration**: Real email delivery via noreply@munal.ai
- **HTML Template**: Styled email with stats grid (Sent/Received/Approved/Rejected), "Awaiting Your Action" pending count, trend indicator, bottleneck alerts, "View Dashboard" CTA
- **User Preferences**: Toggle to enable/disable digest per user (default: enabled)
- **Manual Trigger**: Admin API to send digest on-demand for testing
- **Preview**: Endpoint to view email HTML before sending
- **Frontend**: Mail icon in dashboard header opens settings dialog with toggle, send test, preview link

### Other Features (Complete)
- Voice selection for Text-to-Video, PDF/Word converters, File conversion history
- Features mega-menu, Reply toolbar with attachments, CC/BCC in messaging
- Meeting history, Admin role management, Incident analytics
- Real-time notifications (SSE), Password complexity, Refresh tokens, Audit logging, Encryption

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

## Key API Endpoints (Approvals)
- Templates: `GET/POST/PUT/DELETE /api/approvals/templates[/{id}]`
- CRUD: `POST /api/approvals/create`, `GET /api/approvals/list`, `GET /api/approvals/detail/{id}`
- Actions: `POST /api/approvals/action/{id}`, `POST /api/approvals/comments/{id}`
- Stats: `GET /api/approvals/stats`, `GET /api/approvals/export`
- Analytics: `GET /api/approvals/analytics`
- Duplicate: `POST /api/approvals/duplicate/{id}`
- Notifications: `GET /api/approvals/notifications`, `POST /api/approvals/notifications/read`
- Digest: `GET /api/approvals/digest/preview`, `POST /api/approvals/digest/trigger`, `GET/POST /api/approvals/digest/preferences`

## DB Collections (Approvals)
- `approvals`, `approval_templates`, `approval_comments`, `approval_audit`, `approval_notifications`, `approval_digest_prefs`
