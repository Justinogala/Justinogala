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
- Organization-scoped admin access (broadcasts, user visibility)

## Organization Model
- Organizations have three roles: **admin**, **manager**, **member**
- Org roles map to platform roles: `admin→Admin`, `manager→Manager`, `member→User`
- `Super_Admin` is platform-level only (not org-specific)
- Admin/Manager users are org-scoped: they see only their org's members
- Broadcasts/Scheduled Exports from org Admin go to their org only
- Super Admin broadcasts go to all users platform-wide

## Recent Changes (March 2026)

### Organization-Scoped Admin Access - COMPLETED (March 26, 2026)
- Backend: Broadcasts POST/GET now check caller auth token and scope to org
- Backend: Scheduled Exports POST/GET similarly scoped to caller's org
- Backend: `GET /api/users` → Admin with org_id sees only org members; Super Admin sees all
- Backend: `POST /api/organizations/{org_id}/members` maps org roles to platform roles
- Backend: Login returns `organization_id` and `org_name` for org users
- Frontend: Broadcast page shows "Send to [OrgName]" for org admins, "Send to All Users" for Super Admin
- Frontend: AdminAuthContext stores `organization_id`, `org_name`, `org_role`
- 15 backend + 9 frontend tests passed (iteration_72.json)

### Permission Change Audit Log - COMPLETED (March 26, 2026)
- `permission_audit_log` collection tracks template updates, user overrides, resets
- `GET /api/admin/module-permissions/audit-log` endpoint
- Activity Log section on Module Permissions page with change pills and timestamps

### RBAC Module Permissions - COMPLETED (March 26, 2026)
- Fixed critical security flaw: Admin users no longer have Superadmin access
- 27 admin modules across 5 groups with role-based templates
- Module Permissions management page at `/admin/module-permissions`
- 14 backend + 31 frontend tests (iteration_70.json)

### Admin User Visibility Restriction - COMPLETED (March 26, 2026)
- Admin with org sees org members; without org sees only admin/manager/super_admin
- Super Admin sees all users
- 9 backend + 16 frontend tests (iteration_71.json)

## Architecture
```
/app/
├── backend/routes/
│   ├── admin.py              # Broadcasts + Scheduled Exports (org-scoped via _get_caller)
│   ├── auth.py               # Login returns module_permissions, organization_id, org_name
│   ├── users.py              # Role+org-based user visibility filtering
│   ├── organizations.py      # Org CRUD, member management (admin/manager/member roles)
│   ├── module_permissions.py # RBAC templates, user overrides, audit log
│   └── server.py             # Super_Admin seed, all routers registered
└── frontend/src/
    ├── context/AdminAuthContext.jsx       # isSuperAdmin(), hasModuleAccess(), org info
    ├── contexts/PermissionContext.jsx     # Module→action permission builder
    ├── pages/admin/
    │   ├── AdminBroadcastsPage.jsx       # Org-scoped text and auth headers
    │   ├── AdminModulePermissionsPage.jsx # Permission matrix + audit log
    │   ├── AdminOrganizationsPage.jsx     # Org management with admin/manager/member roles
    │   └── AdminUserManagementPage.jsx    # Org-filtered user list
    ├── components/AdminSidebar.jsx        # Module-key based filtering
    └── services/adminUserDataService.js   # Sends auth token for user filtering
```

## Key API Endpoints
- `GET /api/users` - Role+org-filtered user list
- `POST/GET /api/admin/broadcasts` - Org-scoped broadcasts
- `POST/GET /api/admin/scheduled-exports` - Org-scoped exports
- `POST /api/organizations/{org_id}/members` - Create org member (admin/manager/member)
- `GET /api/admin/module-permissions/templates` - Role templates
- `GET /api/admin/module-permissions/audit-log` - Permission change history
- `POST /api/auth/login` - Returns module_permissions, organization_id, org_name

## 3rd Party Integrations
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Resend (Email Delivery) — RESEND_API_KEY
- Emergent Object Storage — EMERGENT_LLM_KEY

## Backlog

### P2
- Demo video shows "Numbus" instead of "Munal"
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456 (role: Super_Admin, no org)
- Org Admin: orgadmin@munal.com / OrgAdmin@123 (role: Admin, org: Munal Healthcare)
- Org Manager: orgmgr@munal.com / OrgMgr@123 (role: Manager, org: Munal Healthcare)
- Org Member: orgmember@munal.com / OrgMem@123 (role: User, org: Munal Healthcare)
