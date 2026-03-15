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
- `GET /api/reports/{id}` - Get report detail
- `PUT /api/reports/{id}` - Update report/investigation
- `POST /api/reports/{id}/attachments` - Upload attachment
- `GET /api/reports/{id}/attachments/{att_id}` - Download attachment

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Automated notifications for critical incidents (email manager)
- **P2**: Export reports to PDF/Excel
- **P3**: Escalation workflow if not reviewed in 24h
