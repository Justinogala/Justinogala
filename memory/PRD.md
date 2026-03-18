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
- **Security**: Fernet AES encryption, slowapi rate limiting, bleach XSS, CSP headers, audit logging

## Security Implementation (Complete)

### Option A — High Priority
1. Rate Limiting (login 10/min, register 5/min, AI 10-20/min, uploads 10-15/min)
2. Input Sanitization & XSS Protection (bleach strips HTML/script tags)
3. CORS Hardening (restricted origins)
4. NoSQL Injection Guard ($-prefix rejection)
5. Security Headers (X-Content-Type, X-Frame, X-XSS, Referrer-Policy, Permissions-Policy)

### Option B — Medium Priority
6. Password Policy (min 8 chars, 1 upper, 1 lower, 1 digit — new passwords only)
7. Refresh Tokens (7-day, auto-refresh before 24h JWT expiry)
8. Inactivity Auto-Logout (30 min, frontend activity tracking)
9. Audit Logging (login/register/password events → `audit_logs` collection)
10. Content Security Policy (full CSP header)

### P3 — Data Encryption at Rest
11. **Field-level encryption** using Fernet (AES-128-CBC + HMAC-SHA256)
    - **Encrypted fields**: Message subject/content, audit log details
    - **Backwards-compatible**: Old plaintext data reads correctly alongside encrypted data
    - `enc::` prefix prevents double-encryption
    - Key stored in `ENCRYPTION_KEY` env var
    - Module: `/app/backend/encryption.py`

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456

## Core Features
- User/Admin auth, AI Chat, Internal messaging (CC/BCC), File Manager
- IR/SOR Incident Reporting, eSignature (PDF/DOC/DOCX), Word-to-PDF converter
- AI Messaging (smart replies, draft, summarize, actions, categorize, AI compose)
- Screen/camera recording, Shifts, Stripe subscriptions, Admin RBAC, Calendar, Meetings

## Completed
- **March 18, 2026**: Data encryption at rest for messages and audit logs (Fernet AES)
- **March 18, 2026**: Full security (Option A + B) — rate limiting, XSS, CORS, password policy, refresh tokens, inactivity logout, audit logging, CSP
- **March 18, 2026**: CC/BCC, AI Compose, AI Messaging, eSignature + Word-to-PDF

## Backlog
- **P2**: Cloud storage migration testing
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P3**: Two-factor authentication (2FA) for admin accounts
- **P3**: Consolidate AuthContext and AdminAuthContext
