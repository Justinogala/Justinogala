# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards and team invitations.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Workspace File Manager (Complete - Mar 2026)
- Independent file manager per workspace (separate from account-level file manager)
- Backend: `POST/GET/DELETE /api/workspaces/{id}/files` with GridFS storage (`workspace_files` bucket)
- Frontend: "Files" tab in WorkspaceDetailPage with drag-and-drop upload, file list, preview, download, delete
- File isolation: files scoped to workspace_id, not visible across workspaces
- Stats integration: workspace file counts in stats endpoint
- Tested: 100% (11/11 backend, all frontend verified) — iteration_54

### eSignature TOS Canadian Law Update (Complete - Mar 2026)
- Updated all legal references to Canadian law (PIPEDA, UECA, provincial E-Commerce Acts)
- Governing law: Province of Ontario + federal laws of Canada
- Dispute resolution: Ontario courts / Federal Court of Canada
- Trade laws: Export and Import Permits Act, Special Economic Measures Act
- Consumer protection: Consumer Protection Act, 2002 (Ontario)
- Dates updated to March 19, 2026

### Organization Management (Complete - Mar 2026)
#### Core Org CRUD + Admin Page (iteration_50)
#### Domain Auto-Enrollment + Edit Member + Self-Registration (iteration_51)
#### Organization Dashboard (iteration_52)
#### Team Invites + Direct Create (iteration_53)

### eSignature Terms of Service (Complete)
### Workspace Dashboard Widget (Complete)
### Approvals Module Phase 1 (Complete)
### SharePoint-Style Workspace Hub (Complete)
### Other Features (Auth, Files, AI, Sora 2, TTS, IR/SOR, eSignature, SSE)

## Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Business User**: justin.ogala@munal.com / Justin@123456

## Key API Endpoints

### Workspace Files (NEW)
- `POST /api/workspaces/{id}/files/upload` — Upload file (FormData: user_id, file_name, file_data, content_type)
- `GET /api/workspaces/{id}/files` — List workspace files
- `GET /api/workspaces/{id}/files/{file_id}` — Download/stream file
- `DELETE /api/workspaces/{id}/files/{file_id}` — Delete file

### Organization Invites
- `POST /api/organizations/{org_id}/invite` — Send email invite + get link
- `POST /api/organizations/invite/validate?token=xxx` — Validate invite token
- `GET /api/organizations/{org_id}/invites` — List pending invites
- `POST /api/organizations/{org_id}/direct-create` — Create member account directly
- `POST /api/auth/register?invite_token=xxx` — Register with invite auto-assignment

## DB Collections
- `workspace_files` (NEW: id, grid_id, workspace_id, user_id, file_name, content_type, size, uploaded_at)
- `organizations`, `org_invites`
- `users` (account_type, organization_id, org_role)

## Key Files
- `/app/backend/routes/workspaces.py` — workspace CRUD, members, files, stats
- `/app/backend/config.py` — fs_workspace_files GridFS bucket
- `/app/src/pages/WorkspaceDetailPage.jsx` — WorkspaceFileManager component + Files tab
- `/app/src/components/ESignatureTermsOfService.jsx` — Canadian law TOS
- `/app/backend/routes/organizations.py` — invite, validate, direct-create, dashboard
- `/app/src/pages/OrgDashboardPage.jsx` — invite + create dialogs

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals
### P2
- Approvals Phase 2: AI insights, advanced analytics
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
