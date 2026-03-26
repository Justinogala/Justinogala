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
- Super Admin: Assign users to organizations from Users page

## Organization Model
- Organizations have three roles: **admin**, **manager**, **member**
- Org roles map to platform roles: `admin→Admin`, `manager→Manager`, `member→User`
- `Super_Admin` is platform-level only (not org-specific)
- Admin/Manager users are org-scoped: they see only their org's members
- Broadcasts/Scheduled Exports from org Admin go to their org only
- Super Admin broadcasts go to all users platform-wide
- Super Admin can assign any user to an org with a specific role from Users page
- Super Admin can remove users from organizations (reverts to personal account)

## Recent Changes (March 2026)

### Assign Users to Organizations - COMPLETED (March 26, 2026)
- Backend: `POST /api/organizations/{org_id}/members/assign` accepts `{user_id, org_role}` body
- Maps org roles to platform roles (admin→Admin, manager→Manager, member→User)
- Sets organization_id, account_type=business, org_role, and platform role
- Rejects already-assigned users (400) and invalid roles
- `DELETE /api/organizations/{org_id}/members/{user_id}` removes from org → personal
- Frontend: "Assign to Organization" dialog on Users page (Super Admin only)
- Shows org dropdown + role selector (admin/manager/member) with platform role descriptions
- "Remove from Organization" option for users already in an org
- Org Admin does NOT see Organization section in dropdown
- User badges show org_role for business users, "Personal" for non-org users
- 12 backend + 8 frontend tests passed (iteration_73.json)

### Organization-Scoped Admin Access - COMPLETED (March 26, 2026)
- Broadcasts/Exports scoped to caller's org for Admin/Manager
- User visibility scoped to caller's org
- 15 backend + 9 frontend tests passed (iteration_72.json)

### Permission Change Audit Log - COMPLETED (March 26, 2026)
- `permission_audit_log` collection, Activity Log UI on Module Permissions page

### RBAC Module Permissions - COMPLETED (March 26, 2026)
- 27 admin modules, role-based templates, Module Permissions page
- 14 backend + 31 frontend tests (iteration_70.json)

## Architecture
```
/app/
├── backend/routes/
│   ├── admin.py              # Broadcasts + Exports (org-scoped)
│   ├── auth.py               # Login returns module_permissions, org info
│   ├── users.py              # Role+org-based user visibility
│   ├── organizations.py      # Org CRUD, member assign/remove (admin/manager/member)
│   ├── module_permissions.py # RBAC templates, audit log
│   └── server.py             # Super_Admin seed
└── frontend/src/
    ├── context/AdminAuthContext.jsx
    ├── contexts/PermissionContext.jsx
    ├── pages/admin/
    │   ├── AdminUserManagementPage.jsx  # Assign to Org dialog
    │   ├── AdminBroadcastsPage.jsx      # Org-scoped broadcasts
    │   ├── AdminModulePermissionsPage.jsx
    │   └── AdminOrganizationsPage.jsx
    ├── components/AdminSidebar.jsx
    └── services/adminUserDataService.js
```

## Key API Endpoints
- `POST /api/organizations/{org_id}/members/assign` - Assign user to org with role
- `DELETE /api/organizations/{org_id}/members/{user_id}` - Remove from org
- `POST /api/organizations/{org_id}/members` - Create new org member
- `GET /api/users` - Role+org-filtered user list
- `POST/GET /api/admin/broadcasts` - Org-scoped broadcasts
- `GET /api/admin/module-permissions/templates` - RBAC templates
- `GET /api/admin/module-permissions/audit-log` - Permission change history

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
