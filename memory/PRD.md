# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Recent Changes

### AuthContext Consolidation + Data Health Dashboard + 9th Form Template — March 30, 2026
- **AuthContext consolidated**: Merged AdminAuthContext into AuthContext.jsx. Single provider, dual hooks (useAuth + useAdminAuth). AdminAuthContext.jsx is now a thin re-export wrapper — zero import changes needed across 13+ components. Removed AdminAuthProvider from App.jsx.
- **Data Health Dashboard**: New admin page at `/admin/data-health` showing total documents, user health (active/inactive/never logged in), orphaned records, collection stats with progress bars, pending actions, and cleanup buttons.
- **Backend**: `GET /api/admin/data-health/stats`, `POST /cleanup/orphaned-members`, `POST /cleanup/stale-conversations`
- **Client Behavior Observation Form**: 9th healthcare template with 19 fields (date, observer, client, setting, behavior type, antecedent, description, intensity, duration, frequency, intervention, response, injuries, follow-up, supervisor notification).
- 100% test pass rate (iteration_92)

### Onboarding Walkthrough — March 30, 2026
- 8-step welcome modal for new users, skip/replay, "Restart Tour" in Settings
- 100% test pass rate (iteration_91)

### Landing Page Mobile Fix + Demo Video — March 30, 2026
- Hero image full-width on mobile, nav controls fixed, Sora 2 demo video with "Munal" branding
- 100% test pass rate (iteration_90)

### Earlier Completed Work
- Shift Management Phase 1 & 2, Push Notifications, Time Clock Reports, Admin Login Redesign, Command Palette, Calendar UI Fix

## Architecture
```
/app/src/context/
├── AuthContext.jsx             # CONSOLIDATED - handles both user + admin auth
├── AdminAuthContext.jsx        # Thin re-export wrapper for backward compatibility

/app/backend/routes/
├── data_health.py             # NEW - Data health stats + cleanup endpoints
├── forms.py                   # 9 healthcare templates (added Client Behavior Observation)
├── users.py                   # User CRUD + onboarding
├── admin_workspaces.py        # Admin workspace mgmt + orphan cleanup

/app/src/pages/admin/
├── AdminDataHealthPage.jsx    # NEW - Data health dashboard
├── AdminStripeSettingsPage.jsx # Refactored
```

## Key DB Collections
`users` (onboarding_completed), `workspace_members`, `workspaces`, `form_templates`, `form_submissions`, `time_clock`, `push_subscriptions`, `shifts`, `ai_conversations`, `ai_messages`

## 3rd Party Integrations
- Resend, OpenAI GPT-5.2, OpenAI Whisper, Object Storage, Sora 2 — all via Emergent LLM Key

## Backlog
### P3
- 2FA for admin accounts
- Additional form templates as needed

## Test Credentials
- Super Admin: admin@munal.com / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Org Manager: orgmgr@munal.com / OrgMgr@123
- Org Member: orgmember@munal.com / OrgMem@123
