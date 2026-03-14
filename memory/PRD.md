# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based with bcrypt password hashing (no email verification on signup)
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration
- **Email**: Resend (noreply@munal.ai) — available for password reset

## Core Features (Implemented)
- User authentication (JWT + bcrypt) — signup goes straight to dashboard
- Admin authentication (JWT against MongoDB, role-checked)
- Admin user auto-seeding on startup (with bcrypt hashed password)
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
- Passwords: bcrypt hashed, with auto-migration of legacy plain-text on login

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Key API Endpoints
- `POST /api/auth/login` - Login (auto-migrates plain-text passwords to bcrypt)
- `POST /api/auth/register` - Signup (bcrypt hashed, immediate access)
- `POST /api/auth/forgot-password` - Password reset (temp password hashed)
- `POST /api/auth/change-password` - Change password (new password hashed)
- `GET /api/chat/files/{file_id}` - Download file from GridFS
- `GET /api/health` - Health check

## Recent Changes (March 14, 2026)
- **Password hashing (bcrypt)**: All new passwords hashed with bcrypt. Legacy plain-text passwords auto-migrated on login. Admin seed uses bcrypt. Password reset and change also use bcrypt.
- **File download**: Download buttons in File Manager now functional
- **Removed email verification on signup**

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx (partially redundant)
- **P2**: Clean up orphaned workspace_members data
- **P3**: Re-enable email verification once Resend domain DNS is configured
