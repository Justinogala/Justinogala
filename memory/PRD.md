# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Architecture
- FastAPI Backend + React Frontend (Vite) + MongoDB Atlas
- Static build server (`frontend/startup.cjs`) for production K8s deployments
- OpenAI GPT-5.2 + Whisper via Emergent LLM Key (`backend/llm_client.py`)
- Resend for transactional emails
- Firebase Cloud Messaging for push notifications

## What's Been Implemented

### Profile Picture Upload — April 15, 2026
- Users can upload profile pictures (JPEG, PNG, WebP, GIF up to 5MB) on the Profile Settings page
- Click avatar in Edit mode to trigger file picker; uploaded to Emergent object storage
- Backend: `POST /api/users/{user_id}/avatar` + `GET /api/users/{user_id}/avatar/image`
- Frontend: Click-to-upload overlay with loading spinner on `UserProfilePage.jsx`
- **Avatar shown app-wide**: Header, sidebar footer, chat messages, user lists, meetings — 10+ components updated
- Components: UserAvatar, UserHeader, UserSidebar, UserInfoHeader, UserListSidebar, MessageItem, RecentChatItem, MessageBubble, ConversationSidebar, WorkspaceChatPage, MemberTable, MeetingCard, MeetingDetailsPanel, AdminSidebar, AdminHeader, UserTableRow
- Testing: 93% backend (Iteration 127), 100% frontend (Iteration 128)

### Welcome Email on Registration — April 15, 2026
- Sends branded "Welcome to Munal AI" email via Resend to every new user on registration
- Includes 2FA activation reminder (Settings → Security)
- Fire-and-forget (non-blocking) — won't break registration if email fails
- Backend: `send_welcome_email()` in `/app/backend/routes/auth.py`
- Testing: Verified via curl — Resend returns success IDs

### AI Features Hub (5 AI Capabilities) — April 8, 2026
1. **AI Smart Search**: Natural language search across meetings, transcripts, documents, sheets, and chats with AI-generated answers
2. **AI Document Summarizer**: Upload any PDF and get instant summary, key points extraction, or Q&A on the document
3. **AI Meeting Summary Emails**: One-click email beautifully formatted meeting summaries (with action items, decisions, follow-ups) to all participants via Resend
4. **AI Auto-Generated Meeting Agenda**: Generates structured meeting agendas based on past meetings, open action items, and pending follow-ups
5. **AI Weekly Digest**: Personalized weekly summary emailed every Monday — meetings attended, action items, decisions, upcoming events. Preview + manual send available.
- Backend: `/app/backend/routes/ai_features.py` (6 endpoints)
- Frontend: `/app/src/pages/AIFeaturesPage.jsx` (5 tabbed sections)
- Route: `/ai-features` with sidebar link + NEW badge
- Scheduler: `run_ai_weekly_digest` runs every Monday 8 AM UTC
- Testing: 100% (20/20 backend + 100% frontend) — Iteration 126

### Meeting Transcripts Widget & Export — April 8, 2026
- TranscriptsWidget in Meetings Dashboard right sidebar (below Quick Stats)
- Search, filter by title/participants/date
- PDF & DOCX export buttons on hover
- Backend: `GET /api/ai/meeting/{id}/export?format=pdf|docx|md`
- Testing: 100% — Iteration 125

### Meeting Auto-Transcription & AI Insights — April 8, 2026
- Web Audio API mixer records all participants' audio
- Auto-transcribe with Whisper + GPT-5.2 insights on meeting end
- Testing: 100% — Iteration 124

### Smart Templates — April 8, 2026
- 6 pre-built spreadsheet templates
- Testing: 100% — Iteration 123

### AI Spreadsheet Phase 3 — April 7, 2026
- AI Insights Panel, Auto Charts, Dashboard
- XLSX download
- Testing: 100% — Iterations 121-122

### Deployment Optimization — April 7-8, 2026
- Static build server replacing Vite dev server
- K8s health check fixes
- Radix UI version conflict resolution

## Key API Endpoints
- AI Features: `POST /api/ai-features/smart-search`, `POST /api/ai-features/document/summarize`, `POST /api/ai-features/meeting/{id}/send-summary`, `POST /api/ai-features/meeting/generate-agenda`, `GET /api/ai-features/weekly-digest/preview/{user_id}`, `POST /api/ai-features/weekly-digest/send/{user_id}`
- Meeting Transcripts: `GET /api/ai/meeting/user/{user_id}`, `GET /api/ai/meeting/{id}/export?format=pdf|docx|md`
- Meeting Processing: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/status`

## Key DB Schema
- `meeting_transcripts`: `{id, meeting_id, user_id, title, status, participants, duration_seconds, transcript, insights, created_at}`
- `pdf_documents`: `{id, name, pdf_data, ...}`
- `sheets`: `{id, workspace_id, title, data (celldata format), created_at}`

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI features, Chat, Sheets, Meeting Insights) — Emergent LLM Key
- OpenAI Whisper (Meeting STT) — Emergent LLM Key
- Resend (Emails: Meeting summaries, Weekly digests, 2FA OTP)
- Firebase Cloud Messaging (FCM Push)

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Standard User: justinogala@outlook.com / 4edfdukD@1

## Upcoming Tasks
- P2: Cross-Workspace Data Linking
- P2: Meeting Summary Integration into Sheets

## Future/Backlog
- P3: Custom Template option for Sheets
- P3: Dedicated full-page view for Meeting Transcripts
- P3: Advanced analytics/reporting
