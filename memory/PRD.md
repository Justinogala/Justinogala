# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards and team invitations.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Workspace File Sharing Permissions (Complete - Mar 2026)
- Permission model: Owner/Admin > Member > Viewer
- Admin: upload, download, delete any file
- Member: upload, download, delete own files only
- Viewer: download/view files only — no upload or delete
- Backend: `GET/PUT /api/workspaces/{id}/file-permissions`, `PUT /api/workspaces/{id}/members/{uid}/file-role`
- Frontend: File Permissions card (admin-only), toggle between "All members can upload" / "View only"
- Upload drop zone hidden for viewers with "View-only access" notice
- Delete buttons conditionally shown based on ownership + role
- Per-member file role overrides supported
- Tested: 100% (20/20 backend, all frontend verified) — iteration_55

### Workspace File Manager (Complete - Mar 2026)
- Independent file manager per workspace with GridFS storage (`workspace_files` bucket)
- Backend: `POST/GET/DELETE /api/workspaces/{id}/files` endpoints
- Frontend: "Files" tab in WorkspaceDetailPage with drag-and-drop upload, file list, preview, download, delete
- File isolation: files scoped to workspace_id
- Tested: 100% (11/11 backend, all frontend verified) — iteration_54

### eSignature TOS Canadian Law Update (Complete - Mar 2026)
- Updated all legal references to Canadian law (PIPEDA, UECA, provincial E-Commerce Acts)
- Governing law: Province of Ontario + federal laws of Canada
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

### Workspace File Permissions (NEW)
- `GET /api/workspaces/{id}/file-permissions?user_id=X` — Get default role + user's effective permission
- `PUT /api/workspaces/{id}/file-permissions?user_id=X` — Set default_file_role (admin only)
- `PUT /api/workspaces/{id}/members/{uid}/file-role?user_id=X` — Override specific member's file role

### Workspace Files
- `POST /api/workspaces/{id}/files/upload` — Upload file (permission enforced)
- `GET /api/workspaces/{id}/files` — List workspace files
- `GET /api/workspaces/{id}/files/{file_id}` — Download/stream file
- `DELETE /api/workspaces/{id}/files/{file_id}?user_id=X` — Delete file (permission enforced)

### Organization Invites
- `POST /api/organizations/{org_id}/invite` — Send email invite
- `POST /api/organizations/invite/validate?token=xxx` — Validate invite token
- `POST /api/organizations/{org_id}/direct-create` — Create member account directly

## DB Collections
- `workspace_files` (id, grid_id, workspace_id, user_id, file_name, content_type, size, uploaded_at)
- `workspace_members` (+ file_role field for per-member overrides)
- `workspaces` (settings.default_file_role: "member" | "viewer")
- `organizations`, `org_invites`, `users`

## Key Files
- `/app/backend/routes/workspaces.py` — workspace CRUD, members, files, permissions, stats
- `/app/backend/config.py` — fs_workspace_files GridFS bucket
- `/app/src/pages/WorkspaceDetailPage.jsx` — WorkspaceFileManager with permissions UI
- `/app/src/components/ESignatureTermsOfService.jsx` — Canadian law TOS

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals
### P2
- Approvals Phase 2: AI insights, advanced analytics
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
