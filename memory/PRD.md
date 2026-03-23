# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Core Features (Implemented)
- User authentication (admin/regular users)
- Workspace management (create, join, manage members)
- Admin Dashboard with analytics
- ICT Support Request module with Excel data
- Org-wide Forms module with 8 Healthcare templates
- Resend email delivery for form submissions
- Real-time Chat messaging via SSE
- Video generation (Sora 2 Pro)
- Voice Chat, Text-to-Audio, Calendar, Meetings, Transcriptions
- eSignature, Approvals, IR/SOR Reports

## Recent Changes (March 2026)

### Chat Module Enhancements - COMPLETED
1. **SSE Connection Stability Fix** - Fixed status flickering (on/off) caused by SSE reconnection loop. Root cause: callback dependencies in `useWebSocketChat.js` caused `connectSSE` to be recreated on every render, closing and reopening the SSE connection. Fix: Used refs for all callbacks so `connectSSE` has zero dependencies. Added 5-second grace period before broadcasting offline to handle reconnection gaps.

2. **File Attachments with Object Storage** - Chat file uploads now use Emergent Object Storage for permanent persistence (with GridFS fallback). Supports both multipart file upload and base64 encoded data. Files downloadable via `/api/chat/files/{id}/download`. Frontend `fileService.js` updated to use multipart upload.

3. **Rich Presence Status System** - Teams/Slack-style user presence:
   - 6 status types: Available, Busy, Do not disturb, Be right back, Away, Appear offline
   - Custom status message (max 200 chars)
   - Clear after duration (30 min, 1 hr, 2 hrs, today, this week)
   - Backend APIs: PUT/GET `/api/chat/presence/status`, GET `/api/chat/presence/bulk`
   - Frontend: `UserPresenceStatus` dropdown component in chat sidebar

### Previous Completions
- ICT Support Request module UI update with Excel data, dropdowns, CSV/Excel exports
- Workspace Creation restricted to Admin roles only
- Admin Forms Portal (`/admin/forms`) for org-wide template management
- 8 Healthcare Form Templates seeded automatically
- Form Submission hooked up to Resend API for email delivery

## Architecture
```
/app/
├── backend/
│   ├── routes/
│   │   ├── chat.py          # SSE, messages, file upload (object storage), presence APIs
│   │   ├── forms.py         # Org-wide template CRUD & submissions
│   │   ├── workspaces.py    # Workspace management (admin-only creation)
│   │   ├── admin.py         # Admin routes
│   │   └── ...
│   ├── services/storage.py  # Cloud storage service
│   ├── config.py            # DB, logging config
│   └── server.py            # FastAPI app, router registration
└── frontend/src/
    ├── components/chat/
    │   ├── UserPresenceStatus.jsx  # Rich presence dropdown
    │   ├── EnhancedMessageInput.jsx # Chat input with attachments
    │   ├── FileUploadHandler.jsx    # File attachment handler
    │   └── ImageUploadHandler.jsx   # Image attachment handler
    ├── hooks/useWebSocketChat.js    # SSE connection (ref-based, stable)
    ├── context/WebSocketChatContext.jsx # Chat state management
    ├── services/fileService.js       # File upload/download (multipart)
    └── pages/WorkspaceChatPage.jsx   # Main chat UI
```

## Key API Endpoints
- `POST /api/chat/messages` - Send message (JSON body)
- `POST /api/chat/files/upload` - Upload file (multipart)
- `GET /api/chat/files/{id}/download` - Download file
- `PUT /api/chat/presence/status` - Set user status
- `GET /api/chat/presence/status/{user_id}` - Get user status
- `GET /api/chat/presence/bulk?user_ids=id1,id2` - Bulk status
- `GET /api/chat/stream/{user_id}` - SSE event stream

## 3rd Party Integrations
- OpenAI Sora 2 Pro (Video Gen) — Emergent LLM Key
- Resend (Email Delivery) — RESEND_API_KEY
- Emergent Object Storage — EMERGENT_LLM_KEY

### Call & Voice Fixes (March 2026)
- **Calls**: Backend now checks if target user is online before initiating call; returns immediate "User is offline" error instead of hanging in "connecting" forever. 30-second call timeout on frontend. Added TURN servers for better NAT traversal.
- **Voice Messages**: Voice recordings now upload to object storage before attaching to messages. Audio player renders inline in chat for voice message playback.

## Backlog
### P2
- Refactor AdminStripeSettingsPage.jsx
- Clean up orphaned data from workspace_members table

### P3
- Consolidate AuthContext and AdminAuthContext
- Implement 2FA for admin accounts
- Add Client Behavior Observation Form (9th template)

## Credentials
- Admin: admin@munal.com / Admin@123456
