# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based with email verification (Resend)
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration
- **Email**: Resend (noreply@munal.ai)

## Core Features (Implemented)
- User authentication (JWT against MongoDB)
- **Email verification on signup (Resend)** — 6-digit code, 15min expiry
- Admin authentication (JWT against MongoDB, role-checked)
- AI Chat with file attachments
- Screen/camera recording & transcription
- Shift management, Workspace management
- Internal messaging system
- File Manager with GridFS storage
- 4-tier Stripe subscription system
- Admin Portal with RBAC (granular permissions)
- Real-time audit logging
- Calendar, Meetings, Voice Chat

## Recent Implementation (March 14, 2026)

### Email Verification (Resend)
- **Backend**: New endpoints: `/api/auth/verify-email`, `/api/auth/resend-verification`
- **Register** now sends 6-digit code via Resend, sets `email_verified: false`
- **Login** checks verification status, redirects unverified users
- **Frontend**: New `VerifyEmailPage.jsx` with 6-digit input, paste support, resend with cooldown
- Existing users auto-marked as verified

### Auth System Fix
- Removed all hardcoded/mock auth — real MongoDB everywhere
- Fixed admin panel mock data (User 1/User 2) → real MongoDB users
- Fixed PermissionContext empty object bug
- Fixed AdminSidebar auth hook

### File Upload Bug Fix
- FormData vs JSON mismatch, error handling, field mapping

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456
- **Resend API Key**: re_E3wVTA67_MRwdQ63A98bvh34PdW3aoVrW
- **Sender**: noreply@munal.ai

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx
- **P3**: Consolidate AuthContext and AdminAuthContext
