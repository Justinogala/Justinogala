# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards and team invitations.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Organization Management (Complete - Mar 2026)

#### Core Org CRUD + Admin Page (iteration_50)
- Full CRUD, member management, org stats, admin Organizations page

#### Domain Auto-Enrollment + Edit Member + Self-Registration (iteration_51)
- Auto-assign on register by email domain, edit member from admin, org signup from registration page

#### Organization Dashboard (iteration_52)
- Full dashboard at `/org-dashboard` with stats, members, workspaces, activity, role distribution
- Sidebar "My Organization" link for business users

#### Team Invites + Direct Create (iteration_53) — NEW
- **Invite by Email**: `POST /api/organizations/{org_id}/invite` — sends styled HTML email via Resend + generates shareable invite link (7-day expiry)
- **Invite Validation**: `POST /api/organizations/invite/validate?token=xxx` — validates token, returns org info
- **Direct Account Creation**: `POST /api/organizations/{org_id}/direct-create` — creates user immediately under org
- **Invite Token in Registration**: `POST /api/auth/register?invite_token=xxx` — auto-assigns to org, marks invite accepted
- **Frontend**: Two buttons on Org Dashboard — "Invite Team" (email + copyable link) and "Create Account" (instant)
- **Signup Page**: Invite banner when `?invite=token` in URL, hides account type toggle
- **Tested**: 100% (12/12 backend, all frontend verified)

### eSignature Terms of Service (Complete)
### Workspace Dashboard Widget (Complete)
### Approvals Module (Complete)
### SharePoint-Style Workspace Hub (Complete)
### Other Features (Auth, Files, AI, Sora 2, TTS, IR/SOR, eSignature, SSE)

## Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Business User**: justin.ogala@munal.com / Justin@123456

## Key API Endpoints

### Organization Invites
- `POST /api/organizations/{org_id}/invite` — Send email invite + get link
- `POST /api/organizations/invite/validate?token=xxx` — Validate invite token
- `GET /api/organizations/{org_id}/invites` — List pending invites
- `POST /api/organizations/{org_id}/direct-create` — Create member account directly
- `POST /api/auth/register?invite_token=xxx` — Register with invite auto-assignment

### Organization Dashboard + CRUD (see previous)

## DB Collections
- `organizations`, `org_invites` (NEW: id, org_id, email, token, status, role, expires_at)
- `users` (account_type, organization_id, org_role)

## Key Files
- `/app/backend/routes/organizations.py` — invite, validate, direct-create, dashboard
- `/app/src/pages/OrgDashboardPage.jsx` — invite + create dialogs
- `/app/src/pages/SignupPage.jsx` — invite banner + token handling
- `/app/src/context/AuthContext.jsx` — signup with invite token

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals
### P2
- Approvals Phase 2: Further AI insights, advanced analytics
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
