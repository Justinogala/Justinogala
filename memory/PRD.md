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

### AI Chat Chart Performance Fix + Image Generation Enhancement + Web Search — June 12, 2026
- **Chart Fix**: Sync I/O blocking async event loop → `asyncio.to_thread()`, matplotlib pre-import, SSE keepalives
- **Image Gen Fix**: Same sync blocking → async, `AuthenticatedImage` component with blob URLs
- **Image Gen Quick-Action Button**: New `ImagePlus` button in chat input bar opens a prompt dialog for one-click image generation
- **Web Search**: AI Chat can now search the web when users ask about current events, news, prices, etc.
  - LLM outputs `[WEB_SEARCH: query]` → backend intercepts, searches via DuckDuckGo (free), re-queries LLM with results
  - Response includes clickable source link chips (title + URL) rendered below the message
  - Frontend sends `search_start` SSE event to clear streamed tag, then streams clean search-informed response
  - Pluggable provider architecture: DuckDuckGo (default/free), Tavily, Brave Search, Perplexity (configurable in Admin API Settings with API key)
- **Admin Search API Config**: New card in Admin > API Configuration page — select provider + enter API key for premium search
- **Endpoints**: `GET/PUT /api/admin/search-api`
- Backend: `/app/backend/routes/web_search.py` (provider abstraction), `/app/backend/routes/ai_chat.py` (search detection)
- Frontend: `AIChatPage.jsx` (ImageGenDialog, SourceLinks, AuthenticatedImage components)
- Testing: 100% backend + 100% frontend — Iterations 137, 138, 139

### Storage Quota Management — June 12, 2026
- **Plan-based quotas**: Free = 100 MB, Pro = 1 GB, Enterprise = 10 GB (configurable)
- **Admin Quota Management** page (`/admin/storage-quotas`): Lists all users with usage bars, plan badges, custom limit indicators; edit dialog to set custom limits per user or reset to plan default
- **Quota enforcement**: AI Chat file generation checks quota before creating files; blocked with clear "storage quota exceeded" message
- **User quota indicator**: Thin progress bar above chat input showing usage vs limit (color-coded: green → amber → red)
- **File size tracking**: `file_size` field added to `ai_generated_files` metadata for accurate storage calculation
- **Endpoints**: `GET /api/storage/my-quota`, `GET /api/storage/admin/quotas`, `PUT /api/storage/admin/quotas/{user_id}`, `PUT /api/storage/admin/plan-defaults`
- Backend: `/app/backend/routes/storage_quotas.py`
- Frontend: `/app/src/pages/admin/AdminStorageQuotasPage.jsx`

### AI Chat Full File Suite — June 12, 2026
- **File Reading**: Upload images (GPT vision), PDFs (pdfplumber text extraction), Excel/CSV (openpyxl parsing), DOCX (python-docx) — content sent to GPT-5.2 for analysis
- **Image Generation**: AI detects "generate image" intent, creates images via GPT Image 1, displayed inline with download button
- **PDF Generation**: AI responses with [GENERATE_PDF] tag auto-converted to downloadable PDF (reportlab)
- **Word Generation**: AI responses with [GENERATE_DOCX] tag auto-converted to downloadable DOCX (python-docx)
- **Excel Generation**: AI responses with [GENERATE_XLSX] tag auto-converted to downloadable XLSX (openpyxl)
- **Chart Generation**: Pie, Bar, Line, Stacked Bar, Radar charts via matplotlib with dark theme
- **Voice-to-Chat**: Whisper-powered voice input (microphone button in chat)
- **Download endpoint**: Unified GET /api/ai-chat/files/{file_id} handles both uploaded and generated files
- **Frontend**: GeneratedFileDisplay component shows images inline via AuthenticatedImage, docs with download buttons
- **Refactored**: ai_chat.py chart blocks consolidated into single loop, storage_path metadata fix
- Testing: 100% — Iteration 136, 137

### Dedicated Full-Page Meeting Transcript View — June 11, 2026
- New route `/meeting-transcripts/:id` with full transcript text, timestamps/segments, search within transcript
- AI insights sidebar: Summary, Action Items (with assignee/priority), Key Decisions, Topics Discussed, Follow-ups
- Export bar: PDF, DOCX, Send to Sheet (all in sticky header)
- Testing: 100% — Iteration 135

### Advanced Analytics/Reporting — June 11, 2026
- **Admin Advanced Analytics** (`/admin/advanced-analytics`): 8 stat cards, user signups chart, meeting activity chart, peak meeting hours, content breakdown bars, period selector
- **User My Analytics** (`/my-analytics`): 5 stat cards, 7-day activity chart
- Testing: 100% — Iteration 135

### Admin System Updates Fix — June 11, 2026
- Fixed admin user role being empty string in database causing 403 on all admin endpoints
- Published v2.4.0 release notes

### User Trash & Restore — June 11, 2026
- Soft-delete, Trash listing, Restore, Permanent delete
- Testing: 100% — Iteration 134

### Cross-Workspace Data Linking — June 11, 2026
- Sheets, Documents, and Presentations can now be linked/shared across multiple workspaces
- Testing: 100% — Iteration 133

### Meeting Summary Integration into Sheets — June 11, 2026
- Testing: 100% — Iteration 133

### Presentations Tab in DocHub — April 28, 2026
- Testing: 100% — Iteration 132

### Documents Tab in DocHub — April 28, 2026
- Testing: 100% — Iteration 131

### Virtual Backgrounds for Video Calls — April 19, 2026
- Testing: 100% — Iteration 130

### Earlier features (GEO, Profile Pictures, Welcome Email, AI Hub, Transcripts, Smart Templates, AI Spreadsheets) — All tested and complete

## Key API Endpoints
- AI Chat: `POST /api/ai-chat/conversations/{id}/messages` (streaming), `GET /api/ai-chat/files/{file_id}`
- Storage: `GET /api/storage/my-quota`, `GET /api/storage/files`
- Cross-Workspace: `POST /api/{sheets|documents|presentations}/{id}/link-workspace`
- Meeting: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/export`
- Analytics: `GET /api/advanced-analytics/admin/overview`, `GET /api/advanced-analytics/my-stats`

## Key DB Schema
- `ai_conversations`: `{id, user_id, title, pinned, created_at, updated_at}`
- `ai_messages`: `{id, conversation_id, role, content, attachments[], created_at}`
- `ai_generated_files`: `{id, conversation_id, user_id, type, filename, content_type, storage_path, file_size, created_at}`
- `storage_quotas`: `{user_id, used_bytes, limit_bytes}`
- `documents`: `{id, workspace_id, title, content, user_id, linked_workspaces[], created_at}`
- `presentations`: `{id, workspace_id, title, slides, user_id, linked_workspaces[], created_at}`

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI features, Chat, Sheets, Meeting Insights) — Emergent LLM Key
- OpenAI Whisper (Meeting STT) — Emergent LLM Key
- GPT Image 1 (AI Chat image generation) — Emergent LLM Key
- Resend (Emails: Meeting summaries, Weekly digests, 2FA OTP, Quota alerts)
- Firebase Cloud Messaging (FCM Push)

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Standard User: chattest@munal.ai / Test@12345
- Analytics User: analytics@munal.ai / Test@12345

## Upcoming Tasks
- P3: Custom Template option for Sheets
- P3: Real-time collaborative editing
- P3: Auto-deletion policies for generated files

## Refactoring Needed
- `/app/backend/routes/auth.py` is large — extract validation/email utilities
