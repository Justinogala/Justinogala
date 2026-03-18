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

## eSignature Feature (Implemented - March 18, 2026)
- **Upload**: PDF, DOC, DOCX files (DOC/DOCX auto-converted to PDF via LibreOffice headless)
- **Create Signature**: Draw on canvas or type with font selection
- **Place Signature**: Click on PDF pages to position signature overlays, draggable
- **Add Fields**: Date field placement
- **Sign**: Apply signatures to PDF using PyMuPDF, generates signed PDF
- **Download**: Download signed PDF
- **File Manager Integration**: Signed PDFs auto-saved to GridFS file manager
- **History**: View all previously signed documents with re-download
- **Saved Signatures**: Save signatures for reuse across documents
- **Backend**: `/app/backend/routes/esignature.py`
- **Frontend**: `/app/src/pages/ESignaturePage.jsx`

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
- `POST /api/esignature/upload` - Upload PDF/DOC/DOCX for signing
- `POST /api/esignature/sign` - Apply signatures to document
- `GET /api/esignature/documents/{doc_id}/pdf` - Get original PDF
- `GET /api/esignature/documents/{doc_id}/signed` - Download signed PDF
- `GET /api/esignature/history` - Get signing history
- `POST /api/esignature/signatures` - Save signature for reuse
- `GET /api/esignature/signatures` - List saved signatures
- `DELETE /api/esignature/signatures/{sig_id}` - Delete saved signature

## Completed
- **March 18, 2026**: eSignature feature with DOC/DOCX-to-PDF conversion, draw/type signatures, PDF placement, signing, download, history, saved signatures. All 16 backend + all frontend tests passed.
- **March 16, 2026**: PDF/Excel Export, Email Notifications, Escalation Workflow, SSE Notification Bell, Incident Analytics Dashboard, Admin Role Management, All Admin Reports Real Data, Bulk PDF Export, Meeting History Activation.

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned data from workspace_members
- **P3**: Consolidate AuthContext and AdminAuthContext
