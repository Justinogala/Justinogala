# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration

## Core Features (Implemented)
- User authentication (JWT)
- AI Chat with file attachments
- Screen/camera recording & transcription
- Shift management
- Workspace management
- Internal messaging system
- File Manager with GridFS storage
- 4-tier Stripe subscription system
- Admin Portal with RBAC (granular permissions)
- Real-time audit logging
- Calendar, Meetings, Voice Chat

## What's Been Completed
- Full RBAC system (backend middleware + frontend context/hooks)
- Real-time admin audit log with polling
- Landing page content rework for workforce management
- File upload bug fix (FormData, error handling, field mapping)
- Orphaned workspace_members cleanup (2 records deleted)
- Admin sidebar dynamic rendering based on permissions

## Key Credentials
- **Admin**: admin@munal.com / Admin@123456
- **API URL**: From REACT_APP_BACKEND_URL in frontend/.env

## Backlog
- **P2**: End-to-End test cloud storage migration
- **P2**: Refactor AdminStripeSettingsPage.jsx (partially redundant)
- **P3**: Consolidate AuthContext and AdminAuthContext

## Architecture
```
/app/src/          - Frontend (Vite + React)
/app/backend/      - Backend (FastAPI)
  /routes/         - API route modules
  /middleware/      - Permission checking
  /services/       - Business logic
  /models/         - Pydantic models
```
