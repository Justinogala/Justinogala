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
- Permission audit logging

## Recent Changes (March 2026)

### Admin User Visibility Restriction - COMPLETED (March 26, 2026)
- Backend: `GET /api/users` now checks caller role via auth token
- Super_Admin: sees ALL users (30 users including regular app users)
- Admin/Manager: only see Admin, Manager, Super_Admin users (3 users)
- No auth: backward compatible, returns all users
- Frontend: `adminUserDataService.js` now sends `admin_token` header
- 9 backend + 16 frontend tests passed (iteration_71.json)

### Permission Change Audit Log - COMPLETED (March 26, 2026)
- Backend: `permission_audit_log` MongoDB collection tracks all permission changes
- Logs template updates with role, changes diff (module label, from→to)
- Logs user overrides and resets
- `GET /api/admin/module-permissions/audit-log` endpoint with pagination
- Frontend: Activity Log section at bottom of Module Permissions page
- Shows Template/User Override/Reset badges, role names, change pills, relative timestamps
- Auto-refreshes after saving a template change

### RBAC Module Permissions - COMPLETED (March 26, 2026)
- Fixed critical security flaw: Admin users no longer have Superadmin access
- Migrated admin@munal.com from "Admin" to "Super_Admin" role
- Backend: `/api/admin/module-permissions/` API with templates, user overrides, module listing
- Login route returns `module_permissions` in user object
- Frontend: `AdminAuthContext` stores module_permissions with `isSuperAdmin()` and `hasModuleAccess()`
- Frontend: `PermissionContext` builds action-level permissions from server-provided module permissions
- Frontend: `AdminSidebar` filters links based on module-level RBAC
- Frontend: Module Permissions management page at `/admin/module-permissions`
- 27 modules across 5 groups: Super Admin (27/27), Admin (12/27), Manager (9/27)
- 14 backend + 31 frontend tests passed (iteration_70.json)

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── module_permissions.py  # RBAC templates, user overrides, audit log
│   │   ├── auth.py               # Login returns module_permissions
│   │   ├── users.py              # Role-based user visibility filtering
│   │   ├── chat.py, dashboard.py, forms.py, workspaces.py, etc.
│   └── server.py                 # Super_Admin seed, all routers registered
└── frontend/src/
    ├── context/AdminAuthContext.jsx   # isSuperAdmin(), hasModuleAccess()
    ├── contexts/PermissionContext.jsx # Module→action permission builder
    ├── layouts/AdminLayout.jsx
    ├── components/AdminSidebar.jsx    # Module-key based filtering
    ├── services/adminUserDataService.js  # Sends auth token for user filtering
    ├── pages/admin/
    │   ├── AdminModulePermissionsPage.jsx  # Permission matrix + audit log
    │   └── AdminUserManagementPage.jsx
    └── hooks/useUserManagement.js
```

## Key API Endpoints
- `GET /api/users` - Role-filtered user list (Admin sees org users only)
- `GET /api/admin/module-permissions/modules` - All modules with labels/groups
- `GET /api/admin/module-permissions/templates` - Role templates
- `PUT /api/admin/module-permissions/templates/{role}` - Update template (creates audit log)
- `GET /api/admin/module-permissions/audit-log` - Permission change history
- `GET /api/admin/module-permissions/user/{user_id}` - Effective user permissions
- `POST /api/auth/login` - Returns module_permissions in user object

## 3rd Party Integrations
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Resend (Email Delivery) — RESEND_API_KEY
- Emergent Object Storage — EMERGENT_LLM_KEY

## Backlog

### P2
- Demo video shows "Numbus" instead of "Munal" (needs new Sora 2 gen or user asset)
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned data from workspace_members table

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Credentials
- Super Admin: admin@munal.com / Admin@123456 (role: Super_Admin)
- Test Admin: testadmin@munal.com / TestAdmin@123 (role: Admin)
