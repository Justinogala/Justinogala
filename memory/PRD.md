# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, admin management, Approvals & Workflow Management, SharePoint-style Workspace Hubs, and Organization-Managed Business Accounts with self-service dashboards and team invitations.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts, Framer Motion
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI GPT-5.2 (via emergentintegrations), Sora 2, Stripe, Resend

## What's Been Implemented

### Admin Logout Fix + Hero Floating Orbs (Complete - Mar 2026)
- Fixed P0 admin logout bug: `handleLogout` now calls context `logout()` and navigates to `/admin/login`
- Fixed collapsed sidebar referencing undefined `adminLogout`
- Added Floating Orbs animation to hero section background (`FloatingOrbs.jsx`)
- Tested: Verified via screenshot — login→dashboard→logout→login redirect works correctly

### Hero Modern Interactivity (Complete - Mar 2026)
- Mouse particle trail: Canvas-based violet particle system follows cursor on hero section (`MouseParticleTrail.jsx`)
- Floating theme toggle: Fixed-position pill toggle with animated thumb, sun/moon icons, dark/light labels (`HeroThemeToggle.jsx`)
- Tested: Theme toggle switches between dark/light modes correctly

### Approvals Phase 2: AI Insights & Analytics (Complete - Mar 2026)
- Analytics tab in Approvals page with comprehensive dashboard
- Summary cards: Total Approvals, Approval Rate, Avg Time, Delegation Rate
- Charts: Monthly Trend (BarChart), By Category (PieChart), Priority Distribution (horizontal Bar)
- Delegation Stats card + Bottleneck Detection (approver response times)
- GPT-5.2 AI Insights via emergentintegrations — actionable recommendations
- Backend: Enhanced `/api/approvals/analytics` with delegation stats, monthly trends, priority breakdown
- Backend: `GET /api/approvals/ai-insights` — GPT-5.2 powered analysis
- Tested: 100% (15/15 backend + 12/12 frontend) — iteration_58

### Approval Delegate Feature (Complete - Mar 2026)
- Delegate pending approvals to substitutes; delegates can approve/reject
- Audit trail records delegation events and delegate actions
- Delegated tab + badges in UI
- Tested: 100% — iterations 56, 57

### IR/SOR Template System (Complete - Mar 2026)
- 7 default templates + custom template CRUD for admins
- Admin page: /admin/ir-sor-templates with field builder
- User: Template picker on /reports before form
- Tested: 100% — iteration 57

### Workspace File Manager + Permissions (Complete - Mar 2026)
- Independent file manager per workspace; Permission model: Admin > Member > Viewer
- Tested: 100% — iterations 54, 55

### eSignature TOS Canadian Law + History Delete (Complete - Mar 2026)
### Organization Management (Complete)
### Approvals Module Phase 1 (Complete)
### SharePoint-Style Workspace Hub (Complete)
### Other Features (Auth, Files, AI, Sora 2, TTS, IR/SOR, eSignature, SSE)

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Key API Endpoints
### Analytics & AI (NEW)
- `GET /api/approvals/analytics?user_id=X` — Full analytics dashboard data
- `GET /api/approvals/ai-insights?user_id=X` — GPT-5.2 AI-powered insights

### Delegation
- `POST /api/approvals/delegate/{id}` — Delegate pending step
- `GET /api/approvals/delegated-to-me?user_id=X` — List delegated approvals

### IR/SOR Templates
- `GET/POST/PUT/DELETE /api/reports/templates` — Template CRUD

## Prioritized Backlog
### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned data from workspace_members table
### P3
- Consolidate AuthContext/AdminAuthContext
- 2FA for admin accounts
