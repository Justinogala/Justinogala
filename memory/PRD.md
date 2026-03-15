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
- Professional multi-step workspace creation (icon, color, plan cards, member invites)
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
- Workspace model: now includes `color` and `icon` fields

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Recent Changes (March 15, 2026)
- **Professional workspace creation**: Multi-step modal with icon/color picker, rich plan cards, member invites, success animation
- **Message attachments fixed**: GridFS bucket init + route conflict
- **Password hashing (bcrypt)**: All passwords now hashed
- **File Manager downloads**: Wired up download buttons
- **Removed email verification on signup**

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned workspace_members data
- **P3**: Re-enable email verification once Resend DNS configured
