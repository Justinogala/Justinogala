# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based with bcrypt password hashing
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration
- **Email**: Resend (noreply@munal.ai)

## Core Features (Implemented)
- User authentication (JWT + bcrypt)
- Admin authentication + auto-seeding
- AI Chat with file attachments
- Internal messaging with file attachments (GridFS)
- File Manager with downloads
- **IR/SOR Incident Reporting System** (5-step form, role-based access, investigation workflow, audit trail, attachments)
- Professional multi-step workspace creation
- Screen/camera recording & transcription
- Shift/Workspace management (with worker type: full-time, part-time, casual)
- 4-tier Stripe subscription system
- Admin Portal with RBAC
- Calendar, Meetings, Voice Chat

## IR/SOR System Details
- **Backend**: `/app/backend/routes/reports.py` — full CRUD with `incident_reports` MongoDB collection
- **Frontend**: `/app/src/pages/ReportsPage.jsx` — multi-step form, list view, detail view, investigation panel
- **Sections**: A (Incident Details), B (Persons Involved), C (Description + 911), D (Severity), E (Attachments), F (Follow-up/Investigation)
- **Incident Types**: Injury, Medication Error, Property Damage, Behavioural, Safeguarding, Near Miss, Other
- **Severity**: Minor, Moderate, Major, Critical, Serious Occurrence (auto-triggers SOR)
- **Status**: Open → Under Review → Closed
- **Access**: Staff = submit + view own; Manager/Admin = view all + edit investigation
- **Features**: Audit trail, file attachments (GridFS), stats dashboard, filters

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Key API Endpoints
- `POST /api/reports` - Create report
- `GET /api/reports` - List reports (role-filtered)
- `GET /api/reports/stats` - Dashboard stats
- `GET /api/reports/export/excel` - Export filtered reports to Excel
- `GET /api/reports/{id}` - Get report detail
- `PUT /api/reports/{id}` - Update report/investigation
- `POST /api/reports/{id}/attachments` - Upload attachment
- `GET /api/reports/{id}/attachments/{att_id}` - Download attachment
- `GET /api/reports/{id}/export/pdf` - Export individual report to PDF

## Completed (March 16, 2026)
- **PDF Export**: Individual report export to professionally formatted PDF via `/api/reports/{id}/export/pdf`
- **Excel Export**: Bulk report export with severity color-coding and filters via `/api/reports/export/excel`
- **Email Notifications**: Critical/SOR incidents auto-notify all admins/managers via Resend (noreply@munal.ai)
- **Escalation Workflow**: APScheduler runs hourly; reports open >24h are auto-escalated with admin email alerts
- **Real-Time SSE Notification Bell**: Critical/SOR incidents push a `critical_incident` SSE event to all online admin/manager users; frontend shows toast popup + adds to notification bell with red pulse indicator
- **Incident Analytics Dashboard**: Dedicated analytics view with severity trend (stacked bar chart), incident type breakdown (donut chart), response time metrics (horizontal bars by severity), and monthly summary cards. Admin/Manager only.
- **Admin Role Management**: Added "Change Role" dropdown in admin user management — Set as Admin/Manager/User with toast confirmation. Updated justinoo2001@gmail.com to Admin.
- **Admin IR/SOR Report Generation**: Added "IR / SOR Reports" as a real report type in admin Generate Report modal — downloads actual PDF/Excel files from backend with date range filters. Other report types remain mocked.
- **Bulk PDF Export**: New `/api/reports/export/pdf` endpoint generates a multi-page PDF with cover page, severity summary table, and individual report details.
- **Frontend**: "Export Excel" button on report list, "Export PDF" button on report detail view

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned data from workspace_members
- **P3**: Consolidate AuthContext and AdminAuthContext
