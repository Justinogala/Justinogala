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
- **Security**: slowapi (rate limiting), bleach (XSS sanitization), security headers middleware

## Core Features (Implemented)
- User authentication (JWT + bcrypt)
- Admin authentication + auto-seeding
- AI Chat with file attachments
- Internal messaging with file attachments (GridFS), CC/BCC support
- File Manager with downloads
- IR/SOR Incident Reporting System
- eSignature (PDF/DOC/DOCX, draw/type/upload signatures, Word-to-PDF converter)
- AI Messaging (smart replies, draft, summarize, suggest actions, categorize, AI compose)
- Screen/camera recording & transcription
- Shift/Workspace management
- 4-tier Stripe subscription system
- Admin Portal with RBAC
- Calendar, Meetings, Voice Chat

## Security Measures (Implemented - March 18, 2026)
1. **Rate Limiting**: Login (10/min), Register (5/min), Forgot Password (5/min), AI endpoints (10-20/min), File uploads (10-15/min), Signing (10/min)
2. **Input Sanitization & XSS Protection**: All user inputs (messages, subjects) stripped of HTML/script tags via bleach
3. **CORS Hardening**: Restricted to munal.ai, localhost dev origins (falls back to wildcard only if no origins configured)
4. **NoSQL Injection Guard**: Query parameters validated against MongoDB operator injection ($-prefixed keys rejected)
5. **Security Headers**: X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection: 1; mode=block, Referrer-Policy: strict-origin-when-cross-origin, Permissions-Policy: camera/microphone/geolocation denied
- Backend module: `/app/backend/security.py`

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Completed
- **March 18, 2026**: Security hardening — rate limiting, XSS sanitization, CORS, NoSQL injection guard, security headers
- **March 18, 2026**: CC/BCC fields in compose message form
- **March 18, 2026**: AI-powered email compose (prompt → subject + body)
- **March 18, 2026**: AI Messaging features (smart replies, draft, summarize, actions, categorize)
- **March 18, 2026**: eSignature with DOC/DOCX conversion, Upload Signature, Word to PDF converter
- **March 16, 2026**: PDF/Excel Export, Email Notifications, Escalation Workflow, SSE Notification Bell, Incident Analytics, Admin Reports, Meeting History

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P2**: Clean up orphaned data from workspace_members
- **P2**: Session expiry & refresh tokens, audit logging
- **P3**: Two-factor authentication (2FA) for admin accounts
- **P3**: Consolidate AuthContext and AdminAuthContext
