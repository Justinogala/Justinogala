# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Organization Management (Complete - Mar 2026)

#### Core Org CRUD (iteration_50)
- Full CRUD for organizations (`/api/organizations`)
- Member management: create/assign/remove business accounts
- Org stats: member_count, active_members, workspace_count, approval_count
- Admin Organizations page with list/detail views, stats, member table

#### Domain Auto-Enrollment (iteration_51)
- User registration checks email domain against `organizations.domain`
- Matching domain (e.g. `@munal.com`) auto-sets `account_type: "business"` + `organization_id`
- Non-matching domains stay `account_type: "personal"`

#### Edit Org Member Info (iteration_51)
- `PUT /api/organizations/{org_id}/members/{user_id}` — update name, email, org_role, plan, status
- Edit button on each member row in admin detail view
- Dialog with all editable fields + validation (duplicate email check)

#### Organization Self-Registration (iteration_51)
- `POST /api/organizations/signup` — creates org + admin user in one step
- Signup page has Personal/Organization toggle
- Organization tab shows: Org Name, Domain, Description fields + "Your Admin Account" section
- Button changes to "Create Organization" — creates org then logs user in

### eSignature Terms of Service (Complete - Mar 2026)
- Full TOS for Munal AI / Jiffix Inc, accessible from eSignature page

### Workspace Dashboard Widget (Complete - Mar 2026)
- Aggregated workspace summary endpoint + sidebar widget with pending action badges

### Approvals Module (Complete)
- Phase 1 & 2: Dashboard, Templates, Workflows, Analytics, AI Insights, Notifications, Weekly Digest

### SharePoint-Style Workspace Hub (Complete)
- Dynamic homepages, activity feed, announcements, real-time stats, workspace templates

### Other Features (Complete)
- Auth (JWT + refresh), Workspaces, File Manager, AI Messaging, Sora 2, TTS, IR/SOR, eSignature, SSE Notifications

## Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Test Business User**: justin.ogala@munal.com / Justin@123456
- **Test Org Signup**: admin@jiffix.com / Test@12345678

## Key API Endpoints

### Organizations
- `GET/POST /api/organizations` — List/Create
- `POST /api/organizations/signup` — Self-registration (org + admin user)
- `GET/PUT/DELETE /api/organizations/{id}` — Single org CRUD
- `GET/POST /api/organizations/{org_id}/members` — List/Add members
- `PUT /api/organizations/{org_id}/members/{user_id}` — Edit member
- `DELETE /api/organizations/{org_id}/members/{user_id}` — Remove member
- `POST /api/organizations/{org_id}/members/assign` — Assign existing user
- `GET /api/organizations/{org_id}/stats` — Org statistics

### Auth (Updated)
- `POST /api/auth/register` — Now with domain auto-enrollment

## DB Collections
- `organizations`: id, name, domain, description, created_by
- `users` (UPDATED): account_type (personal/business), organization_id, org_role

## Key Files
- `/app/backend/routes/organizations.py` — All org endpoints
- `/app/backend/routes/auth.py` — Updated register with domain check
- `/app/src/pages/SignupPage.jsx` — Personal/Organization toggle
- `/app/src/pages/admin/AdminOrganizationsPage.jsx` — Admin org management + edit member

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals
### P2
- Approvals Phase 2: Further AI insights, advanced analytics
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
