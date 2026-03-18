# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based with bcrypt password hashing
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Email**: Resend (noreply@munal.ai)

## Core Features (Implemented)
- User authentication (JWT + bcrypt)
- Admin authentication + auto-seeding
- AI Chat with file attachments
- Internal messaging with file attachments (GridFS)
- File Manager with downloads
- IR/SOR Incident Reporting System
- Professional multi-step workspace creation
- Screen/camera recording & transcription
- Shift/Workspace management
- 4-tier Stripe subscription system
- Admin Portal with RBAC
- Calendar, Meetings, Voice Chat

## eSignature Feature (Implemented - March 18, 2026)
- Upload PDF, DOC, DOCX files (auto-converts to PDF via LibreOffice)
- Create signatures: Draw, Type, or Upload image
- Place signatures on PDF pages with drag positioning
- Sign PDFs with PyMuPDF, auto-save to File Manager
- Word to PDF converter page (standalone)
- Signing history and saved signatures for reuse

## AI Messaging Features (Implemented - March 18, 2026)
- **Smart Replies**: Auto-generates 3 clickable reply suggestions when opening a message
- **AI Draft Reply**: Generates a full reply matching user's tone/writing style preferences
- **Summarize Thread**: Condenses long conversations into 3-5 sentence summaries
- **Suggest Actions**: Recommends 2-4 follow-up actions (e.g., "Schedule meeting", "Prepare materials")
- **Auto-Categorize**: Classifies messages into work/personal/urgent/finance/scheduling/support/social
- All features respect user settings in Message Settings → AI Personalization & AI Assistant tabs
- Backend: `/app/backend/routes/messages.py` (AI endpoints)
- Frontend: `/app/src/pages/MessagesPage.jsx` (AI UI integration)

## Key API Endpoints
### eSignature
- `POST /api/esignature/upload` — Upload PDF/DOC/DOCX
- `POST /api/esignature/sign` — Apply signatures
- `GET /api/esignature/documents/{id}/pdf` — Get original PDF
- `GET /api/esignature/documents/{id}/signed` — Download signed
- `POST /api/esignature/convert-to-pdf` — Standalone Word→PDF
- `GET /api/esignature/history` — Signing history
- `POST/GET/DELETE /api/esignature/signatures` — Saved signatures CRUD

### AI Messaging
- `POST /api/messages/ai/smart-replies` — 3 reply suggestions
- `POST /api/messages/ai/summarize-thread` — Thread summary
- `POST /api/messages/ai/suggest-actions` — Follow-up actions
- `POST /api/messages/ai/draft-reply` — Auto-draft reply
- `POST /api/messages/ai/categorize` — Message categorization

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Completed
- **March 18, 2026**: AI Messaging features (smart replies, draft, summarize, actions, categorize). All 5 endpoints tested with real GPT-4o. Frontend integration: auto-loading smart replies, AI Draft button, Actions button, Summarize button.
- **March 18, 2026**: eSignature with DOC/DOCX conversion, Upload Signature option, Word to PDF converter page.
- **March 16, 2026**: PDF/Excel Export, Email Notifications, Escalation Workflow, SSE Notification Bell, Incident Analytics, Admin Reports, Meeting History.

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned data from workspace_members
- **P3**: Consolidate AuthContext and AdminAuthContext
