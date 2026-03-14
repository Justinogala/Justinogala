# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a full-stack AI-powered workforce management platform called "Munal/EchoNote AI" with modern chat interface, screen/camera recording, AI-driven analysis, Stripe payments, and a comprehensive admin panel with RBAC.

## Tech Stack
- **Frontend**: Vite + React, Tailwind CSS, Shadcn/UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB (Atlas) with GridFS for file storage
- **Auth**: JWT-based (real MongoDB auth)
- **Payments**: Stripe (4-tier subscription)
- **AI**: OpenAI integration

## Core Features (Implemented)
- User authentication (JWT against MongoDB)
- Admin authentication (JWT against MongoDB, role-checked)
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

## Recent Critical Fixes (March 14, 2026)
### Auth System Overhaul
- **AuthContext**: Added `safeParseJSON` to handle non-JSON server responses gracefully
- **AdminAuthContext**: Completely rewrote from hardcoded mock credentials to real MongoDB API auth via `/api/auth/login`
- **PermissionContext**: Fixed empty permissions `{}` truthiness bug — now checks `Object.keys().length > 0`
- **AdminSidebar**: Changed from `useAuth()` to `useAdminAuth()`, footer shows real admin data
- **adminUserDataService**: Removed localStorage fallback — only fetches from `/api/users`
- **adminBillingDataService**: Removed `initializeMockData()` — connected to real API

### File Upload Bug Fix
- Fixed `fileService.js`: Changed from JSON to FormData (backend expects Form params)
- Fixed error extraction: Handles array/object/string `detail` from FastAPI 422 errors
- Fixed field name mapping in `listFiles` (`file_name`/`size`/`uploaded_at`)
- Fixed backend `_id` exclusion in upload response

### Data Cleanup
- Deleted 8 test/fake users from MongoDB (kept 11 real users)
- Deleted 2 orphaned `workspace_members` records

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
