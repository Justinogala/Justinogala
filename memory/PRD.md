# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based with email verification (Resend)
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration
- **Email**: Resend (noreply@munal.ai)

## Core Features (Implemented)
- User authentication (JWT against MongoDB)
- Email verification on signup (Resend) - 6-digit code, 15min expiry, retry logic
- Admin authentication (JWT against MongoDB, role-checked)
- Admin user auto-seeding on startup
- AI Chat with file attachments
- Screen/camera recording & transcription
- Shift management, Workspace management
- Internal messaging system
- File Manager with GridFS storage
- 4-tier Stripe subscription system
- Admin Portal with RBAC (granular permissions)
- Real-time audit logging
- Calendar, Meetings, Voice Chat

## Key Architecture Notes
- Frontend source: `/app/src/` (NOT `/app/frontend/src/`)
- Vite config: `/app/vite.config.js`
- API URL: Uses `window.location.origin` via `/app/src/lib/api.js`
- Vite proxy forwards `/api` to backend port 8001
- Passwords stored as plain text (no hashing)
- Admin user seeded in `server.py` startup event

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Resend API Key**: Configured in backend/.env
- **Sender**: noreply@munal.ai

## Key API Endpoints
- `POST /api/auth/login` - User/Admin login (returns `email_sent` flag for unverified users)
- `POST /api/auth/register` - User signup with email verification (returns `email_sent` flag)
- `POST /api/auth/verify-email` - Verify email with 6-digit code
- `POST /api/auth/resend-verification` - Resend verification code (with retry)
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/health` - Health check

## Recent Changes (March 14, 2026)
- Added retry logic (3 attempts with backoff) for Resend rate limits in `send_verification_email`
- Backend now returns `email_sent: true/false` on register and login for unverified users
- Frontend shows appropriate toast messages based on email delivery status
- Fixed silent `except Exception: pass` in login flow for unverified users

## Validated (March 14, 2026)
- Admin login flow (UI + API) ✅
- User signup flow with email verification redirect ✅
- Email verification sending with retry logic ✅
- Unverified user login redirects to verification ✅
- Admin dashboard shows real MongoDB data ✅
- Admin user seeding on startup ✅

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx (partially redundant)
- **P2**: Clean up orphaned workspace_members data
- **P3**: Consolidate AuthContext and AdminAuthContext for maintainability
- **P3**: Add password hashing (bcrypt) for security
