# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards and team invitations.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Approval Delegate Feature (Complete - Mar 2026)
- Backend: `POST /api/approvals/delegate/{id}` delegates pending step to another user
- Backend: Action endpoint allows delegate to approve/reject with audit trail
- Backend: `GET /api/approvals/delegated-to-me` lists delegated approvals
- Backend: Stats include `delegated_pending` count
- Backend: List endpoint uses `$or` to show delegated approvals in received tab
- Frontend: Delegate button on pending approvals, delegate modal with user search + reason
- Frontend: Delegated tab in approvals dashboard
- Frontend: Delegation badges on table rows and in workflow view
- Frontend: Delegate actions recorded in audit trail (acted_by_delegate flag)
- Tested: 100% — 9/9 backend + 15/15 frontend (iterations 56, 57)

### IR/SOR Template System (Complete - Mar 2026)
- Backend: 7 default templates (Workplace Injury, Medication Error, Property Damage, Behavioural Incident, Safeguarding Concern, Near Miss, Serious Occurrence)
- Backend: CRUD endpoints for custom templates (`GET/POST/PUT/DELETE /api/reports/templates`)
- Backend: Default templates protected from edit/delete
- Backend: Templates define custom fields (text, textarea, number, date, select)
- Frontend (Admin): `/admin/ir-sor-templates` page with template grid, category filters, editor dialog with field builder
- Frontend (User): Template picker on `/reports` when creating new report
- Frontend: Custom fields rendered as extra form step between Description and Severity
- Frontend: Skip to blank form option preserved
- Tested: 100% — 9/9 backend + all frontend verified (iteration 57)

### Workspace File Sharing Permissions (Complete - Mar 2026)
- Permission model: Owner/Admin > Member > Viewer
- Tested: 100% (iteration 55)

### Workspace File Manager (Complete - Mar 2026)
- Independent file manager per workspace with GridFS storage
- Tested: 100% (iteration 54)

### eSignature TOS Canadian Law Update (Complete - Mar 2026)
- PIPEDA, UECA, Ontario courts jurisdiction, provincial E-Commerce Acts
- Dates: March 19, 2026

### Organization Management (Complete)
### Approvals Module Phase 1 (Complete)
### SharePoint-Style Workspace Hub (Complete)
### Other Features (Auth, Files, AI, Sora 2, TTS, IR/SOR, eSignature, SSE)

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Key API Endpoints

### Approval Delegation (NEW)
- `POST /api/approvals/delegate/{id}?user_id=X&user_name=Y` — Delegate pending step
- `GET /api/approvals/delegated-to-me?user_id=X` — List delegated approvals
- `GET /api/approvals/list?tab=delegated&user_id=X` — Delegated tab

### IR/SOR Templates (NEW)
- `GET /api/reports/templates` — List all templates (default + custom)
- `GET /api/reports/templates/{id}` — Get specific template
- `POST /api/reports/templates` — Create custom template
- `PUT /api/reports/templates/{id}` — Update custom template
- `DELETE /api/reports/templates/{id}` — Delete custom template

### Workspace File Permissions
- `GET/PUT /api/workspaces/{id}/file-permissions`
- `PUT /api/workspaces/{id}/members/{uid}/file-role`

## Key Files
- `/app/backend/routes/approvals.py` — Delegate endpoints + models
- `/app/backend/routes/reports.py` — IR/SOR template CRUD + default templates
- `/app/src/pages/ApprovalsPage.jsx` — Delegate modal, Delegated tab, badges
- `/app/src/pages/admin/AdminIRTemplatesPage.jsx` — Admin template management
- `/app/src/pages/ReportsPage.jsx` — TemplatePicker + custom fields step

## Prioritized Backlog
### P2
- Approvals Phase 2: AI insights, advanced analytics, bottleneck detection
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
