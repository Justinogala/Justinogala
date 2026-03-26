# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Core Features (Implemented)
- User authentication (admin/regular users)
- Workspace management (create, join, manage members)
- Admin Dashboard with analytics
- ICT Support Request module with Excel data
- Org-wide Forms module with 8 Healthcare templates
- Resend email delivery for form submissions
- Real-time Chat messaging via SSE
- Video generation (Sora 2 Pro)
- Voice Chat, Text-to-Audio, Calendar, Meetings, Transcriptions
- eSignature, Approvals, IR/SOR Reports
- Role-Based Access Control (RBAC) with module-level permissions

## Recent Changes (March 2026)

### RBAC Module Permissions - COMPLETED (March 26, 2026)
- Fixed critical security flaw: Admin users no longer have Superadmin access
- Migrated admin@munal.com from "Admin" to "Super_Admin" role
- Backend: `/api/admin/module-permissions/` API with templates, user overrides, and module listing
- Login route now returns `module_permissions` in user object for admin/super_admin/manager roles
- Frontend: `AdminAuthContext` stores module_permissions with `isSuperAdmin()` and `hasModuleAccess()` helpers
- Frontend: `PermissionContext` builds action-level permissions from server-provided module permissions
- Frontend: `AdminSidebar` filters links based on module-level RBAC (not hardcoded defaults)
- Frontend: New "Module Permissions" page at `/admin/module-permissions` for Super Admins
- Permission matrix UI with Admin/Manager columns, grouped by section (Primary, Management, Billing, Configuration, Super Admin)
- Templates stored in MongoDB `module_permission_templates` collection
- Per-user overrides supported via `module_permission_overrides` collection
- 27 modules across 5 groups, default: Super Admin (27/27), Admin (12/27), Manager (9/27)
- 45 tests passed (14 backend + 31 frontend, iteration_70.json)

### Landing Page "How It Works" Upgrade - COMPLETED (March 24, 2026)
- Expanded from 4 basic meeting steps to 5 comprehensive platform steps
- 25 frontend tests passed (iteration_69.json)

### Real-Time Dashboard Activity Updates - COMPLETED (March 24, 2026)
- SSE endpoint `/api/dashboard/activity/stream`, live graphs and feeds
- 34 tests passed (iteration_68.json)

### User Dashboard Redesign - COMPLETED (March 24, 2026)
- Dynamic stats, 8 quick actions, workspace cards with real data

### Other Recent Completions
- Quick Action Link Fixes (eSignature, AI Assistant)
- Activity Graph & Feed
- Chat Module Enhancements (SSE stability, file attachments, presence)
- Call & Voice Fixes
- Mobile-Friendly Optimization
- Admin Workspace Deletion Fix
- Global Search API + UI
- Landing page speed optimization (<0.5s), 3-slide hero carousel
- Auth pages pastel gradient redesign
- Cookie Consent banner
- Resend email delivery fix for password resets

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── module_permissions.py  # RBAC: templates, user overrides, module listing
│   │   ├── auth.py               # Login returns module_permissions
│   │   ├── chat.py               # SSE, messages, file upload, presence APIs
│   │   ├── dashboard.py          # Activity API + SSE stream endpoint
│   │   ├── forms.py              # Org-wide template CRUD & submissions
│   │   ├── workspaces.py         # Workspace management, dashboard summary
│   │   ├── admin.py              # Admin routes
│   │   ├── search.py             # Global search endpoint
│   │   ├── calls.py              # WebRTC calls with offline validation
│   │   └── admin_workspaces.py   # Admin workspace deletion
│   └── server.py                 # Super_Admin seed, all routers registered
└── frontend/src/
    ├── context/
    │   └── AdminAuthContext.jsx   # isSuperAdmin(), hasModuleAccess(), refreshPermissions()
    ├── contexts/
    │   └── PermissionContext.jsx  # Builds action permissions from module permissions
    ├── layouts/
    │   └── AdminLayout.jsx       # Passes actual role (no more super_admin→Admin mapping)
    ├── components/
    │   ├── AdminSidebar.jsx      # Module-key based filtering, Super Admin section
    │   └── user/
    │       └── DashboardActivity.jsx
    ├── pages/
    │   ├── admin/
    │   │   └── AdminModulePermissionsPage.jsx  # Permission matrix UI
    │   └── user/UserDashboard.jsx
    └── hooks/useWebSocketChat.js
```

## Key API Endpoints
- `GET /api/admin/module-permissions/modules` - All modules with labels and groups
- `GET /api/admin/module-permissions/templates` - Role templates (super_admin, admin, manager)
- `PUT /api/admin/module-permissions/templates/{role}` - Update role template
- `GET /api/admin/module-permissions/user/{user_id}` - Effective permissions for a user
- `PUT /api/admin/module-permissions/user/{user_id}` - Set per-user override
- `DELETE /api/admin/module-permissions/user/{user_id}` - Reset to role template
- `POST /api/auth/login` - Returns module_permissions in user object
- `GET /api/dashboard/activity` - Activity graph + feed data
- `GET /api/dashboard/activity/stream` - SSE real-time stream
- `GET /api/workspaces/dashboard/summary` - Dashboard summary
- `GET /api/search` - Global cross-entity search

## 3rd Party Integrations
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Resend (Email Delivery) — RESEND_API_KEY
- Emergent Object Storage — EMERGENT_LLM_KEY

## Backlog

### P2
- Demo video shows "Numbus" instead of "Munal" (needs new Sora 2 generation or user asset)
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned data from workspace_members table

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Credentials
- Super Admin: admin@munal.com / Admin@123456 (role: Super_Admin)
