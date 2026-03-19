# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2, Stripe, Resend, emergentintegrations

## What's Been Implemented

### Organization-Managed Accounts (Complete - Mar 2026)
- **Backend**: Full CRUD for organizations (`/api/organizations`), member management, stats, assign/remove members
- **Frontend**: Admin Organizations page (`AdminOrganizationsPage.jsx`) with list/detail views, create org dialog, add member dialog
- **Account Types**: Users are tagged as `personal` (self-registered) or `business` (org-managed)
- **Business badges** displayed on User Management page
- **AddUserModal** updated with Account Type and Organization dropdown
- **Tested**: 100% pass rate (17/17 backend, all frontend verified - iteration_50)

### eSignature Terms of Service (Complete - Mar 2026)
- Full TOS for Munal AI powered by Jiffix Inc
- Accessible via "Terms of Service" button on eSignature page
- Component: `/app/src/components/ESignatureTermsOfService.jsx`

### Workspace Dashboard Widget (Complete - Mar 2026)
- `GET /api/workspaces/dashboard/summary` endpoint
- Widget in dashboard right sidebar with workspace cards, pending action badges
- Tested: 100% (iteration_49)

### Approvals Module (Complete)
- Phase 1 & 2: Dashboard, Template Store, Workflow Engine, Analytics, AI Insights, Notifications, Weekly Digest

### SharePoint-Style Workspace Hub (Complete)
- Dynamic homepages, activity feed, announcements, real-time stats, workspace templates

### Other Features (Complete)
- User/Admin auth (JWT + refresh), Workspace management, File manager, AI messaging
- Text-to-Video (Sora 2), Text-to-Audio, IR/SOR, eSignature, Security, Notifications

## Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Test Business User**: justin.ogala@munal.com / Justin@123456

## Key API Endpoints

### Organizations
- `GET/POST /api/organizations` - List/Create organizations
- `GET/PUT/DELETE /api/organizations/{id}` - Single org CRUD
- `GET/POST /api/organizations/{org_id}/members` - List/Add members
- `DELETE /api/organizations/{org_id}/members/{user_id}` - Remove member
- `POST /api/organizations/{org_id}/members/assign` - Assign existing user
- `GET /api/organizations/{org_id}/stats` - Org statistics

### Workspace Dashboard
- `GET /api/workspaces/dashboard/summary?user_id=xxx`

### Workspaces, Approvals, eSignature - (See previous PRD entries)

## DB Collections
- `organizations` (NEW): id, name, domain, description, created_by
- `users` (UPDATED): added account_type, organization_id, org_role fields
- `workspaces`, `workspace_members`, `workspace_announcements`
- `approvals`, `approval_templates`, `approval_comments`, `approval_audit`, `approval_notifications`

## Key Files
- `/app/backend/routes/organizations.py` (NEW)
- `/app/src/pages/admin/AdminOrganizationsPage.jsx` (NEW)
- `/app/src/components/ESignatureTermsOfService.jsx` (NEW)
- `/app/src/components/user/WorkspaceDashboardWidget.jsx` (NEW)
- `/app/backend/models.py` (MODIFIED - added account_type, organization_id)
- `/app/backend/routes/users.py` (MODIFIED - account_type in user creation)
- `/app/src/components/admin/modals/AddUserModal.jsx` (MODIFIED - org/type selection)
- `/app/src/pages/admin/AdminUserManagementPage.jsx` (MODIFIED - account type badges)
- `/app/src/components/AdminSidebar.jsx` (MODIFIED - Organizations link)
- `/app/src/App.jsx` (MODIFIED - /admin/organizations route)

## Prioritized Backlog
### P1
- Implement "Delegate" feature for approvals (assign pending requests to a substitute)
### P2
- Approvals Module Phase 2: Further AI insights, advanced analytics, bottleneck detection
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
