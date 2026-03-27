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

## Recent Changes

### Footer Restructure - COMPLETED (March 27, 2026)
- Restructured footer into 6 columns: Brand, Product (9 links), Use Cases (8 links), Resources (6 links), Company + Legal (6 links)
- Added missing pages: eSignature, Shift Management, all Use Cases, Documentation, API Reference, Community, Support Center, Press
- Centered contact info bar above copyright

### Blog Page Redesign - COMPLETED (March 27, 2026)
- Redesigned blog with modern hero, search, 12 ICT stories covering AI, Remote Work, Healthcare, Compliance, Workforce, Education, Government, Security, Legal, Finance, HR
- Featured post card, sticky category filter bar (11 categories), 3-column grid, newsletter CTA
- 100% frontend tests passed (iteration_79.json)

### Careers & Features Overview Redesign - COMPLETED (March 26, 2026)
- Redesigned Careers page with modern hero (image, tagline, CTAs), stats bar, perks section, 6 job listings
- Redesigned Features Overview with modern hero, stats bar (24+, 6, 99.9%, SOC2), and 24 feature cards
- Both pages now match the latest design pattern used across use case pages
- 100% frontend tests passed (iteration_78.json)

### Use Cases Overview Hero + Testimonials Carousel - COMPLETED (March 26, 2026)
- Enhanced UseCasesIndex hero with image, tagline badge, CTAs, and stats bar (500+, 10M+, 99.2%, 4.9/5)
- Expanded testimonials from 4 to 12 industry leaders
- Built auto-sliding carousel with 4s interval, hover-pause, arrows, dot navigation
- Responsive: 3 cards desktop, 2 tablet, 1 mobile
- Both /use-cases and landing page use the same carousel
- 24/24 frontend tests passed (iteration_77.json)

### Cookie/PWA Overlap Fix & Social Proof - COMPLETED (March 26, 2026)
- Fixed cookie consent bar overlapping with PWA install prompt (narrowed to max-w-2xl, install prompt elevated to z-[110] and bottom-44 on mobile)
- Added industry-specific social proof text to all 10 use case page stats bars
- 100% frontend tests passed (iteration_76.json)

### Use Cases Mega-Menu & Industry Pages - COMPLETED (March 26, 2026)
- Redesigned "Use Cases" dropdown into mega-menu with 2 columns: "By Team" and "By Industry"
- Created 5 new industry landing pages: Healthcare, Education, Government, Legal & Compliance, Finance
- Redesigned 5 existing "By Team" pages (Sales, Customer Success, Product, Engineering, HR) to use same UseCasePageLayout
- Built reusable `UseCasePageLayout` component with hero, stats bar, challenges, solutions, workflows, testimonial, CTA, and prev/next navigation
- Updated `UseCasesIndex` with organized "By Team" and "By Industry" card sections
- All routes registered in App.jsx with lazy loading
- 43/43 frontend tests passed (iteration_74.json) + 41/41 team page tests (iteration_75.json)

### Assign Users to Organizations - COMPLETED (March 26, 2026)
- Backend: `POST /api/organizations/{org_id}/members/assign` accepts `{user_id, org_role}` body
- Maps org roles to platform roles (admin→Admin, manager→Manager, member→User)
- Frontend: "Assign to Organization" dialog on Users page (Super Admin only)
- 12 backend + 8 frontend tests passed (iteration_73.json)

### Organization-Scoped Admin Access - COMPLETED (March 26, 2026)
- Broadcasts/Exports scoped to caller's org for Admin/Manager
- User visibility scoped to caller's org

### Permission Change Audit Log - COMPLETED (March 26, 2026)
- `permission_audit_log` collection, Activity Log UI on Module Permissions page

### RBAC Module Permissions - COMPLETED (March 26, 2026)
- 27 admin modules, role-based templates, Module Permissions page

## Architecture
```
/app/
├── backend/routes/
│   ├── admin.py              # Broadcasts + Exports (org-scoped)
│   ├── auth.py               # Login returns module_permissions, org info
│   ├── users.py              # Role+org-based user visibility
│   ├── organizations.py      # Org CRUD, member assign/remove
│   ├── module_permissions.py # RBAC templates, audit log
│   └── server.py             # Super_Admin seed
└── frontend/src/
    ├── components/
    │   ├── Header.jsx                          # Mega-menu for Features & Use Cases
    │   └── features/
    │       ├── FeaturePageLayout.jsx           # Reusable feature page layout
    │       └── UseCasePageLayout.jsx           # Reusable use case page layout (NEW)
    ├── pages/UseCases/
    │   ├── UseCasesIndex.jsx                   # Updated index with By Team & By Industry
    │   ├── SalesTeams.jsx
    │   ├── CustomerSuccess.jsx
    │   ├── ProductTeams.jsx
    │   ├── EngineeringTeams.jsx
    │   ├── HRRecruiting.jsx
    │   ├── Healthcare.jsx                      # NEW
    │   ├── Education.jsx                       # NEW
    │   ├── Government.jsx                      # NEW
    │   ├── Legal.jsx                           # NEW
    │   └── Finance.jsx                         # NEW
    ├── context/AdminAuthContext.jsx
    ├── contexts/PermissionContext.jsx
    └── pages/admin/
        ├── AdminUserManagementPage.jsx
        ├── AdminBroadcastsPage.jsx
        ├── AdminModulePermissionsPage.jsx
        └── AdminOrganizationsPage.jsx
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
