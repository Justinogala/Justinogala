# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based (no email verification on signup)
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration
- **Email**: Resend (noreply@munal.ai) — available for password reset

## Core Features (Implemented)
- User authentication (JWT against MongoDB) — signup goes straight to dashboard
- Admin authentication (JWT against MongoDB, role-checked)
- Admin user auto-seeding on startup
- AI Chat with file attachments
- Screen/camera recording & transcription
- Shift management, Workspace management
- Internal messaging system
- File Manager with GridFS storage + file download
- 4-tier Stripe subscription system
- Admin Portal with RBAC (granular permissions)
- Real-time audit logging
- Calendar, Meetings, Voice Chat

## Key Architecture Notes
- Frontend source: `/app/src/` (NOT `/app/frontend/src/`)
- Vite config: `/app/vite.config.js`
- API URL: Uses `window.location.origin` via `/app/src/lib/api.js`
- Vite proxy forwards `/api` to backend port 8001

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Key API Endpoints
- `POST /api/auth/login` - User/Admin login
- `POST /api/auth/register` - User signup (immediate, no verification)
- `GET /api/chat/files/{file_id}` - Download file from GridFS
- `POST /api/chat/files/upload` - Upload file to GridFS
- `GET /api/health` - Health check

## Recent Changes (March 14, 2026)
- **File download**: Wired up download buttons in FileList component to actually download files via `fileService.downloadFile` + blob URL trigger
- **Removed email verification on signup** — users go straight to dashboard
- Login auto-verifies any previously unverified users

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx (partially redundant)
- **P2**: Clean up orphaned workspace_members data
- **P3**: Consolidate AuthContext and AdminAuthContext for maintainability
- **P3**: Add password hashing (bcrypt) for security
- **P3**: Re-enable email verification once Resend domain DNS is configured
