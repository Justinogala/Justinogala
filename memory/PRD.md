# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React (source at `/app/src/`), Tailwind CSS, Shadcn/UI, Framer Motion
- **Backend**: FastAPI (Python) at `/app/backend/`
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT + bcrypt + refresh tokens + inactivity auto-logout
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI GPT-4o via Emergent LLM Key
- **Email**: Resend (noreply@munal.ai)
- **Security**: slowapi, bleach, CSP headers, audit logging

## Security (Full Implementation - March 18, 2026)

### Option A (High Priority) — Implemented
1. **Rate Limiting**: Login 10/min, Register 5/min, AI 10-20/min, Uploads 10-15/min
2. **Input Sanitization & XSS**: bleach strips HTML/script tags from all user inputs
3. **CORS Hardening**: Restricted to munal.ai + localhost origins
4. **NoSQL Injection Guard**: $-prefixed operator keys rejected
5. **Security Headers**: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy, Permissions-Policy

### Option B (Medium Priority) — Implemented
6. **Password Policy**: Min 8 chars, 1 uppercase, 1 lowercase, 1 digit (on register + change-password only — does NOT affect existing passwords)
7. **Refresh Tokens**: 7-day refresh tokens + auto-refresh before 24h JWT expiry
8. **Inactivity Auto-Logout**: 30 min inactivity timeout (frontend, checked every minute)
9. **Audit Logging**: All login attempts (success/fail), registrations, password changes logged to `audit_logs` collection. Admin viewable at `/api/admin/audit-logs`
10. **Content Security Policy**: Full CSP header with script/style/font/img/connect source restrictions

## Core Features
- User/Admin auth, AI Chat, Internal messaging (CC/BCC), File Manager
- IR/SOR Incident Reporting, eSignature (PDF/DOC/DOCX), Word-to-PDF converter
- AI Messaging (smart replies, draft, summarize, actions, categorize, AI compose)
- Screen/camera recording, Shifts, Stripe subscriptions, Admin RBAC, Calendar, Meetings

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Completed
- **March 18, 2026**: Full security implementation (Option A + B) — rate limiting, XSS, CORS, NoSQL guard, password policy, refresh tokens, inactivity logout, audit logging, CSP headers
- **March 18, 2026**: CC/BCC, AI Compose, AI Messaging, eSignature + Word-to-PDF

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P3**: Two-factor authentication (2FA) for admin accounts
- **P3**: Consolidate AuthContext and AdminAuthContext
- **P3**: Data encryption at rest for sensitive fields
