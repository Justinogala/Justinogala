# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI
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
- Internal messaging with file attachments (upload/download/delete via GridFS)
- File Manager with downloads
- Screen/camera recording & transcription
- Shift/Workspace management
- 4-tier Stripe subscription system
- Admin Portal with RBAC
- Calendar, Meetings, Voice Chat

## Key Architecture Notes
- Frontend source: `/app/src/`
- Vite config: `/app/vite.config.js`
- API URL: `window.location.origin` via `/app/src/lib/api.js`
- Passwords: bcrypt hashed, auto-migration on login

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Recent Changes (March 15, 2026)
- **Message attachments fixed**: Fixed GridFS bucket init (`db.delegate` → `db`), fixed route conflict (attachment routes moved before catch-all `/{message_id}/{user_id}`)
- **Password hashing (bcrypt)**: All passwords now hashed
- **File Manager downloads**: Wired up download buttons
- **Removed email verification on signup**

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned workspace_members data
- **P3**: Re-enable email verification once Resend domain DNS is configured
