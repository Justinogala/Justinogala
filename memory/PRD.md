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

### Security Legal Page — COMPLETED (March 27, 2026)
- Created /legal/security page with 10 sections: Commitment, Encryption, Infrastructure, Access Control, Audit Logging, Incident Response, Compliance, Data Privacy, Vulnerability Management, Security Updates
- Emerald-themed hero, trust badges bar, sidebar navigation, expandable sections
- Footer Legal column "Security" link now resolves correctly

### Manage Cookies & Trademarks Pages — COMPLETED (March 27, 2026)
- Created /legal/cookies page with 4 cookie categories, interactive toggles, save preferences
- Created /legal/trademarks page with 7 sections, Quick Reference card
- Footer Legal column and bottom bar links updated to point to both new pages
- 15/15 frontend tests passed (iteration_82)

### Footer Tweak — Microsoft Color Match (March 27, 2026)
- Updated footer background to #f2f2f2 (Microsoft light gray)
- Removed "Munal Technologies Inc.", replaced with "Munal AI is a division of Jiffix Inc."
- Bottom bar: theme switcher + division label (left), legal links + © Munal AI 2026 (right)
- Added 6th "Developer" column
- Headings: #333, links: #505050, bottom bar text: #767676

### Docs, API Reference & Press Redesign - COMPLETED (March 27, 2026)
- Documentation: modern hero, search, 8 category cards, 6 popular articles, stats bar
- API Reference: hero with terminal code block, search, 10 endpoints, 4 SDK cards, stats bar
- Press: hero with media image, 6 press releases, 4 media coverage cards, brand assets, stats bar

### Resources Index & Footer Overhaul - COMPLETED (March 27, 2026)
- Resources Index page redesigned with modern hero section
- Footer restructured into Microsoft-style clean layout

### Blog Page Redesign - COMPLETED (March 27, 2026)
- Redesigned blog with modern hero, search, 12 ICT stories
- Featured post card, sticky category filter bar, 3-column grid, newsletter CTA

### Careers & Features Overview Redesign - COMPLETED (March 26, 2026)
- Redesigned Careers page with modern hero, stats bar, perks section, 6 job listings
- Redesigned Features Overview with modern hero, stats bar, 24 feature cards

### Use Cases Overview Hero + Testimonials Carousel - COMPLETED (March 26, 2026)
- Enhanced UseCasesIndex hero with image, tagline badge, CTAs, and stats bar
- Auto-sliding carousel with 12 testimonials

### Use Cases Mega-Menu & Industry Pages - COMPLETED (March 26, 2026)
- 5 new industry landing pages + 5 redesigned team pages
- Reusable UseCasePageLayout component

### Assign Users to Organizations - COMPLETED (March 26, 2026)
- Backend + Frontend for org member assignment

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
    │   ├── Footer.jsx                          # Microsoft-style 6-col layout
    │   └── features/
    │       ├── FeaturePageLayout.jsx
    │       └── UseCasePageLayout.jsx
    ├── pages/UseCases/                         # 10 pages + Index
    ├── pages/Resources/                        # Blog, Community, Docs, API, Index
    ├── pages/Company/                          # Careers, Press
    └── pages/features/                         # Feature Overview
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

### P1
- Demo video shows "Numbus" instead of "Munal" (recurring — skipped twice)

### P2
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
