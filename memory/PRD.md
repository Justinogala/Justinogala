# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Architecture
```
/app/backend/routes/
├── admin.py                    # Thin re-export shell (composites all admin_*.py routers)
├── admin_settings.py           # Settings CRUD, SMTP test, 2FA enforcement, security policies
├── admin_users.py              # User listing, activity, account actions, meeting analytics
├── admin_billing.py            # Coupons, tax rates
├── admin_monitoring.py         # Dashboard stats, system health
├── admin_storage.py            # Cloud storage config, migration
├── admin_video.py              # Video history, video API key settings
├── admin_messages.py           # Chat, internal messages, exports, broadcasts
├── pdf_editor.py               # PDF Editor CRUD (upload, annotate, save, download)
├── admin_compliance.py         # Compliance score endpoint (2FA + password + login anomaly)
├── admin_2fa_dashboard.py      # 2FA adoption stats, reminders, auto-reminder scheduler
├── two_factor.py               # Admin 2FA setup/verify/disable
├── user_two_factor.py          # User 2FA setup/verify/disable + enforcement check
├── data_health.py              # Data health stats + cleanup
├── audit_logs.py               # Admin audit logging
├── auth.py                     # Login (with 2FA for ALL roles), register, password reset
├── ai.py                       # AI routes, Meeting transcript export (PDF/DOCX/MD)

/app/src/
├── components/
│   ├── meetings/
│   │   ├── ModernMeetingsDashboard.jsx  # TranscriptsWidget inline + dashboard
│   │   └── MeetingsList.jsx
│   ├── UserTwoFactorSetup.jsx
│   ├── UserTwoFactorVerify.jsx
│   ├── admin/
│   │   ├── TwoFactorSetup.jsx
│   │   └── TwoFactorVerify.jsx
├── context/AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── MeetingsPage.jsx           # Renders ModernMeetingsDashboard
│   ├── MeetingProcessingPage.jsx  # Post-meeting transcript details
│   ├── UserSettingsPage.jsx
│   └── admin/
│       ├── Admin2FADashboardPage.jsx
│       ├── ComplianceScoreWidget.jsx
│       └── AdminSecurityPolicies.jsx
```

## Recent Changes

### Meeting Transcripts Widget & Export — April 8, 2026
- **TranscriptsWidget** added to Meetings Dashboard right sidebar, below Quick Stats
- Shows user's past meeting transcripts with title, date, duration, participant count, and AI summary preview
- Search bar filters transcripts by title, participant name, or date (visible when >2 transcripts)
- Hover on transcript reveals **PDF** and **DOC** export buttons
- Click navigates to `/meeting/{id}/processing` for full transcript details
- Backend: `GET /api/ai/meeting/{meeting_id}/export?format=pdf|docx|md` for exports
- Backend: `GET /api/ai/meeting/user/{user_id}` for listing user transcripts
- Installed `lxml` dependency for DOCX generation
- Testing: 100% (22/22 backend + 100% frontend verified) — Iteration 125

### Meeting Auto-Transcription & AI Insights — April 8, 2026
- Auto-records all participants' audio during video calls using Web Audio API (AudioContext mixer)
- When meeting ends: automatically uploads audio, transcribes with OpenAI Whisper, generates insights with GPT-5.2
- Backend: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/status`, `GET /api/ai/meeting/user/{id}`
- Frontend: MeetingProcessingPage with 3-step progress indicator
- Insights include: Summary, Key Decisions, Action Items, Topics Discussed, Follow-ups, Full Transcript
- Applied to both InstantMeetingRoom and GroupMeetingRoom
- MongoDB collection: `meeting_transcripts`
- Testing: 100% — Iteration 124

### Smart Templates — April 8, 2026
- 6 pre-built templates: Budget Planner, Project Tracker, Invoice, Sales Pipeline, Employee Directory, Weekly Schedule
- Testing: 100% — Iteration 123

### Sheet Save Bug Fix — April 8, 2026
- Fixed Fortune-Sheet onChange init overwrite and 2D/celldata format loading conflicts
- Testing: 100% — Iteration 122

### Deployment Fixes — April 7-8, 2026
- Replaced Vite dev server with static file server (startup.cjs) for K8s health checks
- Added root-level /health and /ready endpoints
- Fixed Radix UI version conflicts

## Key DB Schema
- `users`: `two_factor_enabled`, `two_factor_method`, `totp_secret`, `recovery_codes`
- `meeting_transcripts`: `{id, meeting_id, user_id, title, status, participants, duration_seconds, transcript, insights, created_at}`
- `compliance_snapshots`: Weekly security score snapshots
- `custom_pdf_templates`: Admin-uploaded branded PDF templates
- `sheets`: `{id, workspace_id, title, data (celldata format), created_at}`

## Key API Endpoints
- Meeting Transcripts: `GET /api/ai/meeting/user/{user_id}`, `GET /api/ai/meeting/{id}/export?format=pdf|docx|md`
- Meeting Processing: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/status`
- PDF Editor: `POST /api/pdf-editor/upload`, `GET /documents`, etc.
- Compliance Score: `GET /api/admin/compliance-score`, history, snapshot
- Sheets: `GET/POST/PUT/DELETE /api/sheets/*`, `GET /api/sheets/{id}/download`

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat / Sheets / Meeting Insights) — Emergent LLM Key
- OpenAI Whisper (Meeting STT) — Emergent LLM Key
- Firebase Cloud Messaging (FCM Push) — requires User API Key
- Resend (Emails/2FA OTP) — requires User API Key

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Regular User: justinoo2001@gmail.com / Ogala@2023
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Standard User: justinogala@outlook.com / 4edfdukD@1

## Upcoming Tasks
- P2: Cross-Workspace Data Linking
- P2: Meeting Summary Integration into Sheets

## Future/Backlog
- P3: Custom Template option for Sheets (save user sheets as templates)
- P3: Dedicated full-page view for Meeting Transcripts (beyond sidebar widget)
- P3: Additional form templates
- P3: Advanced analytics/reporting
