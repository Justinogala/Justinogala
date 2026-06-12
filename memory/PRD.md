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

### Storage Quota Management — June 12, 2026
- **Plan-based quotas**: Free = 100 MB, Pro = 1 GB, Enterprise = 10 GB (configurable)
- **Admin Quota Management** page (`/admin/storage-quotas`): Lists all users with usage bars, plan badges, custom limit indicators; edit dialog to set custom limits per user or reset to plan default
- **Quota enforcement**: AI Chat file generation checks quota before creating files; blocked with clear "storage quota exceeded" message
- **User quota indicator**: Thin progress bar above chat input showing usage vs limit (color-coded: green → amber → red)
- **File size tracking**: `file_size` field added to `ai_generated_files` metadata for accurate storage calculation
- **Endpoints**: `GET /api/storage/my-quota`, `GET /api/storage/admin/quotas`, `PUT /api/storage/admin/quotas/{user_id}`, `PUT /api/storage/admin/plan-defaults`
- Backend: `/app/backend/routes/storage_quotas.py`
- Frontend: `/app/src/pages/admin/AdminStorageQuotasPage.jsx`
- Admin sidebar: "Storage Quotas" link added

### AI Chat Full File Suite — June 12, 2026
- **File Reading**: Upload images (GPT vision), PDFs (pdfplumber text extraction), Excel/CSV (openpyxl parsing), DOCX (python-docx) — content sent to GPT-5.2 for analysis
- **Image Generation**: AI detects "generate image" intent, creates images via GPT Image 1, displayed inline with download button
- **PDF Generation**: AI responses with [GENERATE_PDF] tag auto-converted to downloadable PDF (reportlab)
- **Word Generation**: AI responses with [GENERATE_DOCX] tag auto-converted to downloadable DOCX (python-docx)
- **Excel Generation**: AI responses with [GENERATE_XLSX] tag auto-converted to downloadable XLSX (openpyxl)
- **Voice-to-Chat**: Whisper-powered voice input (microphone button in chat) — already existed, verified working
- **Download endpoint**: Unified GET /api/ai-chat/files/{file_id} handles both uploaded and generated files
- **Frontend**: GeneratedFileDisplay component shows images inline, docs with download buttons, status messages during generation
- **Refactored**: ai_chat.py (1038→850 lines) — extracted file utilities to `ai_chat_files.py` (225 lines)
- **File metadata tracking**: Generated files stored in `ai_generated_files` MongoDB collection with user_id, type, conversation_id for cleanup/quota
- Fixed: Route shadowing bug (duplicate /files/{file_id} endpoint) — merged into single auth-protected handler
- Testing: 100% backend (15/15) — Iteration 136

### Dedicated Full-Page Meeting Transcript View — June 11, 2026
- New route `/meeting-transcripts/:id` with full transcript text, timestamps/segments, search within transcript
- AI insights sidebar: Summary, Action Items (with assignee/priority), Key Decisions, Topics Discussed, Follow-ups
- Export bar: PDF, DOCX, Send to Sheet (all in sticky header)
- Copy transcript, participant metadata, sentiment badge
- TranscriptsWidget now links to this full page instead of processing page
- Frontend: `/app/src/pages/MeetingTranscriptPage.jsx`
- Testing: 100% — Iteration 135

### Advanced Analytics/Reporting — June 11, 2026
- **Admin Advanced Analytics** (`/admin/advanced-analytics`): 8 stat cards (users, active, meetings, transcripts, docs, sheets, presentations, AI conversations), user signups chart, meeting activity chart, peak meeting hours, content breakdown bars, period selector (7/30/90 days)
- **User My Analytics** (`/my-analytics`): 5 stat cards (meetings, documents, sheets, presentations, AI chats), 7-day activity chart (meetings + documents)
- Backend: `/app/backend/routes/advanced_analytics.py` (admin overview + user my-stats)
- RBAC: Non-admin users get 403 on admin overview endpoint
- Sidebar links added: "My Analytics" in user sidebar, "Advanced Analytics" in admin sidebar
- Testing: 100% backend (7/7) + 100% frontend (7/7) — Iteration 135

### Admin System Updates Fix — June 11, 2026
- Fixed admin user role being empty string (`""`) in database causing 403 on all admin Version Management endpoints
- Root cause: Admin seed migration only checked for `role == "Admin"` but missed empty/null roles
- Fix: Updated migration to set `Super_Admin` for any non-Super_Admin role (including empty)
- Published v2.4.0 release notes, visible to users in What's New modal and Settings > Software Updates

### User Trash & Restore — June 11, 2026
- Soft-delete: `DELETE /api/users/{id}` moves users to trash instead of permanent deletion
- Trash listing: `GET /api/admin/users/trash` shows all soft-deleted users with deletion timestamps
- Restore: `POST /api/admin/users/{id}/restore` recovers users to their pre-delete status
- Permanent delete: `DELETE /api/admin/users/{id}/permanent` (only works on trashed users)
- Deleted users blocked from login with clear error message
- Admin User Management page: "Users / Trash" toggle tabs with counts, Restore + Delete Forever buttons
- Stats card shows "In Trash" count
- Backend: `/app/backend/routes/admin_users.py` (trash/restore/permanent), `/app/backend/routes/users.py` (soft-delete)
- Frontend: `/app/src/pages/admin/AdminUserManagementPage.jsx` (Trash tab UI)
- Testing: 100% backend (10/10) — Iteration 134
- Testing: Verified end-to-end: admin publish → user sees What's New modal + changelog

### Cross-Workspace Data Linking — June 11, 2026
- Sheets, Documents, and Presentations can now be linked/shared across multiple workspaces
- "Link to Workspace" option in context menus across DocHub Sheets, Documents, Presentations tabs and Workspace detail views
- LinkToWorkspaceDialog component: search workspaces, toggle link/unlink with visual feedback
- Backend: `POST /api/{sheets|documents|presentations}/{id}/link-workspace`, `DELETE /api/{sheets|documents|presentations}/{id}/unlink-workspace/{ws_id}`
- List queries updated with `$or` to include items where `linked_workspaces` contains the workspace_id
- "Linked" badge displayed on cross-workspace items in workspace views
- Testing: 100% backend (10/10) + 100% frontend — Iteration 133

### Meeting Summary Integration into Sheets — June 11, 2026
- Convert completed meeting transcript insights into structured spreadsheets
- "Send to Sheet" button (FileSpreadsheet icon) on transcript items in Meetings Dashboard TranscriptsWidget
- Creates sheet with sections: Meeting Overview, Summary, Key Decisions, Action Items, Topics Discussed, Follow-ups
- Backend: `POST /api/sheets/from-meeting/{meeting_id}`
- Frontend: Button in TranscriptsWidget navigates to DocHub Sheets after creation
- Testing: 100% backend — Iteration 133

### Presentations Tab in DocHub — April 28, 2026
- Full slide presentation editor (like Google Slides/PowerPoint) added as second tab in DocHub
- Slide editor: Thumbnail panel (left) + main editing canvas, add/delete/reorder/duplicate slides
- 5 Slide layouts: Title, Content, Two Column, Section Header, Blank
- 5 Templates: Business Pitch, Project Update, Training Session, Team Retrospective, Sales Report
- Create with AI: Generate multi-slide presentations from prompts (GPT-5.2, 6-10 slides)
- Export as PPTX: Server-side python-pptx conversion with proper slide layouts
- Auto-save (2s debounce), full CRUD (create, edit, rename, duplicate, delete, search)
- Backend: `/app/backend/routes/presentations.py` (8 endpoints + link/unlink)
- Frontend: `/app/src/components/presentations/PresentationsSection.jsx`, `PresentationEditor.jsx`
- Testing: 100% backend (11/11) + 100% frontend — Iteration 132

### Documents Tab in DocHub — April 28, 2026
- Full-featured rich text document editor (TipTap) added as first tab in DocHub
- Features: Bold, italic, underline, strikethrough, highlight, headings (H1-H3), alignment, lists, tables, images, links, code, undo/redo
- 6 Templates: Meeting Notes, Project Proposal, Weekly Report, Business Letter, SOP, Contract
- Create with AI: Generate documents from text prompts
- Auto-save (2s debounce), manual save, export to PDF and HTML
- Backend: `/app/backend/routes/documents.py` (full CRUD + duplicate + link/unlink)
- Testing: 100% — Iteration 131

### Virtual Backgrounds for Video Calls — April 19, 2026
- TensorFlow.js BodyPix segmentation for person detection
- 11 preset backgrounds + custom upload
- Testing: 100% — Iteration 130

### Generative Engine Optimization (GEO) — April 19, 2026
- llms.txt, ai-plugin.json, sitemap.xml, robots.txt, 4 industry solution pages
- Testing: 100% — Iteration 129

### Profile Picture Upload — April 15, 2026
- Users can upload profile pictures, shown app-wide
- Testing: 93% backend, 100% frontend — Iterations 127-128

### Welcome Email on Registration — April 15, 2026
- Branded welcome email via Resend
- Testing: Verified via curl

### AI Features Hub (5 AI Capabilities) — April 8, 2026
1. AI Smart Search 2. AI Document Summarizer 3. AI Meeting Summary Emails 4. AI Auto-Generated Meeting Agenda 5. AI Weekly Digest
- Testing: 100% (20/20) — Iteration 126

### Meeting Transcripts Widget & Export — April 8, 2026
- TranscriptsWidget in Meetings Dashboard, PDF/DOCX export
- Testing: 100% — Iteration 125

### Meeting Auto-Transcription & AI Insights — April 8, 2026
- Whisper + GPT-5.2 insights on meeting end
- Testing: 100% — Iteration 124

### Smart Templates — April 8, 2026
- 6 pre-built spreadsheet templates
- Testing: 100% — Iteration 123

### AI Spreadsheet Phase 3 — April 7, 2026
- AI Insights Panel, Auto Charts, Dashboard, XLSX download
- Testing: 100% — Iterations 121-122

## Key API Endpoints
- Cross-Workspace Linking: `POST /api/{sheets|documents|presentations}/{id}/link-workspace`, `DELETE /api/{sheets|documents|presentations}/{id}/unlink-workspace/{workspace_id}`
- Meeting to Sheet: `POST /api/sheets/from-meeting/{meeting_id}`
- AI Features: `POST /api/ai-features/smart-search`, `POST /api/ai-features/document/summarize`, etc.
- Meeting Transcripts: `GET /api/ai/meeting/user/{user_id}`, `GET /api/ai/meeting/{id}/export`
- Meeting Processing: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/status`

## Key DB Schema
- `meeting_transcripts`: `{id, meeting_id, user_id, title, status, participants, duration_seconds, transcript, insights, created_at}`
- `sheets`: `{id, workspace_id, title, data, created_by, linked_workspaces[], source_meeting_id, created_at, updated_at}`
- `documents`: `{id, workspace_id, title, content, user_id, linked_workspaces[], created_at, updated_at}`
- `presentations`: `{id, workspace_id, title, slides, user_id, linked_workspaces[], created_at, updated_at}`

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI features, Chat, Sheets, Meeting Insights) — Emergent LLM Key
- OpenAI Whisper (Meeting STT) — Emergent LLM Key
- Resend (Emails: Meeting summaries, Weekly digests, 2FA OTP)
- Firebase Cloud Messaging (FCM Push)

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Standard User: test@munal.ai / Test@12345
- Previous User: justinogala@outlook.com / 4edfdukD@1

## Upcoming Tasks
- P3: Custom Template option for Sheets
- P3: Real-time collaborative editing

## Refactoring Needed
- `/app/backend/routes/auth.py` is large — extract validation/email utilities
