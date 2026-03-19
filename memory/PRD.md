# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Organization Management (Complete - Mar 2026)

#### Core Org CRUD + Admin Page (iteration_50)
- Full CRUD at `/api/organizations`, member management, org stats
- Admin Organizations page with list/detail views

#### Domain Auto-Enrollment (iteration_51)
- Registration checks email domain → auto-assigns to matching org as business account

#### Edit Org Member Info (iteration_51)
- `PUT /api/organizations/{org_id}/members/{user_id}` — update name, email, role, plan, status
- Edit button on each member row in admin detail view

#### Organization Self-Registration (iteration_51)
- `POST /api/organizations/signup` — creates org + admin user in one step
- Signup page Personal/Organization toggle

#### Organization Dashboard (iteration_52) — NEW
- `GET /api/organizations/{org_id}/dashboard` — aggregated endpoint with stats, members, workspaces, activity, role distribution
- Full dashboard page at `/org-dashboard` with:
  - 6 stat cards (members, active, workspaces, pending/completed/total approvals)
  - Team Members table with roles and status indicators
  - Role Breakdown with progress bars
  - Approval Overview (pending/approved/rejected)
  - Organization Workspaces list with navigation
  - Recent Activity feed (announcements + approvals)
- Sidebar "My Organization" link — only visible to business users with org_id

### eSignature Terms of Service (Complete)
- Full TOS for Munal AI / Jiffix Inc on eSignature page

### Workspace Dashboard Widget (Complete)
- Aggregated workspace summary in user dashboard sidebar

### Approvals Module (Complete)
- Phase 1 & 2: Dashboard, Templates, Workflows, Analytics, AI Insights, Notifications, Weekly Digest

### SharePoint-Style Workspace Hub (Complete)
- Dynamic homepages, activity feed, announcements, workspace templates

### Other Features (Complete)
- Auth, Workspaces, File Manager, AI Messaging, Sora 2, TTS, IR/SOR, eSignature, SSE Notifications

## Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Business User**: justin.ogala@munal.com / Justin@123456 (Munal Inc, org_role: manager)

## Key API Endpoints

### Organization Dashboard
- `GET /api/organizations/{org_id}/dashboard?user_id=xxx` — Full org dashboard

### Organizations
- `GET/POST /api/organizations` — List/Create
- `POST /api/organizations/signup` — Self-registration
- `GET/PUT/DELETE /api/organizations/{id}` — CRUD
- `GET/POST /api/organizations/{org_id}/members` — List/Add
- `PUT /api/organizations/{org_id}/members/{user_id}` — Edit member
- `DELETE /api/organizations/{org_id}/members/{user_id}` — Remove

## Key Files
- `/app/src/pages/OrgDashboardPage.jsx` (NEW)
- `/app/backend/routes/organizations.py` (dashboard endpoint added)
- `/app/src/components/UserSidebar.jsx` (My Organization link)
- `/app/src/App.jsx` (/org-dashboard route)

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals
### P2
- Approvals Phase 2: Further AI insights, advanced analytics
- Refactor AdminStripeSettingsPage.jsx
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
