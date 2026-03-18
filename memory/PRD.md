# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI application "Munal/EchoNote AI" — a meeting and collaboration platform with AI-powered features including text-to-audio, text-to-video, transcriptions, messaging, eSignature, IR/SOR system, and admin management.

## Tech Stack
- **Frontend**: Vite/React, Tailwind CSS, Shadcn/UI, Recharts
- **Backend**: FastAPI (Python), MongoDB
- **Integrations**: OpenAI (GPT-4o, Whisper, TTS), Sora 2 (video generation), Stripe, Resend, emergentintegrations

## Core Requirements
1. User/Admin authentication with JWT + refresh tokens
2. Workspace management
3. Full-featured file manager
4. Messaging system with AI features (Smart Replies, AI Draft, Summarize, AI Compose)
5. Text-to-Video generator (Sora 2) with voice selection
6. Text-to-Audio (TTS)
7. Complete IR/SOR system with escalation workflow
8. Functional admin report system
9. eSignature module with PDF signing
10. Security hardening (rate limiting, input sanitization, CORS, CSP, audit logging, field-level encryption)

## What's Been Implemented
- All core features listed above
- Voice selection dropdown for Text-to-Video (6 voices: alloy, echo, fable, onyx, nova, shimmer)
- CC/BCC in messaging
- Word-to-PDF converter
- Meeting history
- Admin role management
- Incident analytics dashboard
- Real-time notifications (SSE)
- Password complexity policies
- Refresh token rotation + auto-logout
- Audit logging for sensitive events
- Field-level data encryption for messages and audit logs

## Credentials
- **Admin**: admin@munal.com / Admin@123456

## Prioritized Backlog

### P2
- End-to-End test cloud storage migration
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned workspace_members data

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Scheduled rotation for external API keys

## Key Architecture Files
- Backend: `/app/backend/server.py`, `/app/backend/routes/ai.py`, `/app/backend/security.py`, `/app/backend/encryption.py`
- Frontend: `/app/src/pages/TextToVideoPage.jsx`, `/app/src/pages/MessagesPage.jsx`, `/app/src/contexts/AuthContext.jsx`
