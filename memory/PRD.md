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

### AI Builder — AI Product Manager Platform — June 15, 2026
- **Builder Mode** toggle in AI Chat header — switches between Chat and Builder modes
- **Project CRUD**: Create projects with title, description, and app type (10 types: SaaS, Mobile, Enterprise, CRM, ERP, Healthcare, AI, Internal Tool, E-Commerce, Workflow Automation)
- **10 Section Tabs**: Overview, Requirements, Architecture, Database, Security, APIs, Documentation, Roadmap, Code, Deployment
- **SSE Streaming Generation**: Each section generates via GPT-5.2 with rich, detailed prompts (4000 token max per section)
- **Generate All**: One-click generation of all 10 sections sequentially with live streaming
- **Per-Section Generation**: Generate individual sections on-demand, regenerate as needed
- **8 Project Templates**: SaaS Starter, E-Commerce, Marketplace, CRM, AI Chatbot, PM Tool, Healthcare, Internal Tool
- **AI Clarifying Questions**: AI generates 5-8 questions before generation to improve output quality
- **Export**: Markdown and JSON export with download
- **Share**: Public read-only links with share token (create/revoke)
- **Duplicate**: Clone projects with all content
- **Edit Sections**: Manual editing with save (textarea editor)
- **Search**: Full-text search across all sections (⌘K shortcut)
- **Version History**: Previous versions tracked on regeneration
- **Progress Tracking**: Visual progress bar showing completed sections (X/10)
- **Endpoints**: Full CRUD + SSE streaming + share/duplicate/export/clarify/search/templates
- Backend: `/app/backend/routes/ai_builder.py`
- Frontend: `/app/src/components/ai-builder/BuilderView.jsx`, integrated into `AIChatPage.jsx`
- Testing: 100% backend (16 base + 18 enhancement = 34 pytest) — Iterations 142, 143

### Universal Trash System (Recycle Bin) — June 14, 2026
- **Soft-delete across all entities**: Users, Workspaces, Organizations, Approvals, Approval Templates, IR/SOR Reports, IR/SOR Templates, Shifts, Meetings, Documents, Presentations, Sheets, Form Templates
- **Admin Recycle Bin page** (`/admin/trash`): Category tabs with badge counts, item list with name/extra/deletion date, Restore and Delete Forever actions, search filter, Empty Trash per category
- **Backend**: `/app/backend/routes/admin_trash.py` with RESOURCE_MAP for 13 entity types, route ordering fix (empty/all before {item_id})
- **Sidebar**: "Recycle Bin" link in Super Admin section
- **Endpoints**: `GET /api/admin/trash/summary`, `GET /api/admin/trash/{type}`, `POST /api/admin/trash/{type}/{id}/restore`, `DELETE /api/admin/trash/{type}/{id}`, `DELETE /api/admin/trash/{type}/empty/all`
- Testing: 100% backend + 100% frontend — Iteration 141

### Super Admin 2FA Login Fix — June 25, 2026
- **Bug 1 (P0)**: `admin@munal.com` had empty `role: ""` in DB — fixed to `Super_Admin`. This caused frontend `adminLogin` to reject with "Access denied" after 2FA verification.
- **Bug 2 (P0)**: `admin@munal.ai` had wrong bcrypt password hash — re-hashed with correct password `Munal@AI#2026!X7qP9`.
- **Bug 3 (Security)**: Login response with `skip_2fa=true` leaked sensitive fields (`totp_secret`, `recovery_codes`, `email_otp_login`) — now stripped from response.
- **Bug 4**: `user_two_factor.py` verify endpoint did not set `last_2fa_verified` — fixed, now sets timestamp for 24h grace period.
- **New Endpoint**: `POST /api/admin/2fa/force-reset` — Super Admin can force-reset another user's 2FA (for lost authenticator device).
- Backend: `/app/backend/routes/auth.py` (sensitive field stripping), `/app/backend/routes/two_factor.py` (force-reset endpoint), `/app/backend/routes/user_two_factor.py` (last_2fa_verified fix)
- Testing: 7/7 backend tests passed — Iteration 156

### Admin Events Page Action Buttons Fix — June 25, 2026
- **Bug**: All action buttons (Edit, Duplicate, Export CSV, Generate Certs, Delete, View Applications) on the admin Events Management page were non-functional.
- **Root Cause**: `AdminEventsPage.jsx` used `useAuth()` (user context) to get `token`, but the user context doesn't expose `token` — it was always `undefined`. All API calls sent `Authorization: Bearer undefined`, causing auth failures on admin endpoints.
- **Fix**: Replaced `useAuth()` with `useAdminAuth()` and `localStorage.getItem('admin_token')` — matching the pattern used by all other admin pages.
- Frontend: `/app/src/pages/admin/AdminEventsPage.jsx`
- Testing: Screenshot verified — Edit dialog opens, events load with correct admin token.


### Events Platform Enhancement — Sponsors, Livestream, Content Population — June 25, 2026
- **2 New Events**: "Generative AI Agents: Building Autonomous Systems" (Workshop, Mar 2027) and "MLOps & LLMOps: From Prototype to Production" (Bootcamp, Apr 2027) with full agenda, speakers, FAQs, tags.
- **Sponsor Showcase**: Full CRUD for event sponsors (Platinum/Gold/Silver/Bronze/Community tiers). Sponsors displayed on event detail page grouped by tier with logos, descriptions, and links. Admin manages sponsors via Sponsors tab in Events Management.
  - Backend: `/app/backend/routes/event_sponsors.py` (new), `/app/backend/routes/events.py` (public endpoint)
  - Role-gated (Super_Admin/Admin only), tier validation enforced
- **Livestream Integration**: Events can have `stream_url`, `stream_platform`, and `is_live` fields. Event detail page embeds YouTube/Vimeo streams with auto-parsed embed URLs and a red LIVE badge indicator.
- **Events Page Sections**: 
  - "Featured Programs & Courses" — shows Workshops/Bootcamps/Courses/Certifications
  - "Past Event Highlights" — shows completed events with attendance stats
  - "Category Stats" — 8 clickable category icons for quick filtering
- **Admin Event Form**: Added Event Format selector, Stream URL, Platform, and "Currently Live" toggle
- Testing: 100% backend (17/17 pytest), 100% frontend verified — Iteration 156


### Email Notifications + Hero Image + Rate Limits Fixed — June 25, 2026
- **Email Notifications**: Host proposal triggers async emails to both submitter (confirmation) and admin (notification) via Resend. Event reminders sent hourly via APScheduler for events happening in 24h.
- **Hero Image**: Replaced plain gradient with a conference photo background (`pexels-photo-9275222.jpeg`) with overlay gradient
- **Rate Limits FIXED**: Root cause was slowapi using K8s proxy IP as rate-limit key (varying per request). Fixed with custom `_get_real_client_ip` reading `X-Forwarded-For` header. Now: reviews 10/min, host-proposal 5/min, discussions 20/min, AI 10/min — all enforced correctly with 429 responses.
- Backend: `/app/backend/security.py` (rate limit key fix), `/app/backend/routes/event_notifications.py` (NEW), `/app/backend/routes/events.py` (email triggers)
- Testing: 100% backend + 100% frontend — Iteration 155

### Rate Limiting + Calendar + Networking + AI Matchmaker — June 25, 2026
- **Rate Limiting**: Added slowapi limits to all public write endpoints (apply 10/min, gallery/discussions 20/min, reviews 10/min, AI 10/min, matchmaker 5/min)
- **Pydantic Models**: Added `GalleryItem`, `ReviewCreate`, `DiscussionPost`, `DiscussionReply` with field validation (rating 1-5, content min_length=1)
- **Calendar Integrations**: ICS download for Outlook (`GET /events/{id}/calendar.ics`), Google Calendar link, "My Calendar" endpoint for user's registered events
- **Networking Lounge**: Attendee directory, connect requests between attendees, connection accept/decline
- **AI Event Matchmaker**: Personalized event recommendations via GPT-5.2 based on user interests/industry/experience, with popularity-based fallback. "Recommended for You" section on events page for logged-in users
- Backend: `/app/backend/routes/events_extended.py` (calendar, networking, matchmaker), updated `/app/backend/routes/events.py` (pydantic + rate limits)
- Frontend: AI recommendations section on EventsPage, Outlook/Google/Share buttons on detail page
- Testing: 100% backend (20/20) + 100% frontend — Iteration 152

### Academy & Events Phase 3 — AI + Payments + Community — June 25, 2026
- **Rebranded**: "Events" → "Munal AI Academy & Events" with 15 event formats (Live Events, Workshops, Webinars, Conferences, Bootcamps, Courses, Certifications, Networking, Hackathons, Startup Pitch Days, AI Competitions, Job Fair, Mentor Sessions, Office Hours, Community Meetups)
- **AI Features** (4 endpoints via GPT-5.2):
  - AI Event Summary Generator, Speaker Bio Generator, Agenda Generator, Marketing Copy Generator (Twitter/LinkedIn/Email/Instagram)
- **Stripe Payments**: Checkout session creation for paid events, payment verification, per-event revenue endpoint
- **Gallery**: Photo/video gallery per event (add/list)
- **Reviews & Ratings**: 5-star rating system, duplicate email check, average rating calculation
- **Community Discussion**: Post/reply threading per event
- **Bug Fix**: event_type filter caused MongoDB $or empty array error → fixed
- Backend: `/app/backend/routes/ai_events.py`, `/app/backend/routes/event_payments.py`, `/app/backend/routes/events.py` (gallery/reviews/discussions)
- Frontend: Updated EventsPage hero + format chips, EventDetailPage with Reviews + Discussion sections
- Testing: 100% backend (20/20 pytest) + 100% frontend — Iteration 151

### Events Platform Phase 2 — Admin Management — June 25, 2026
- **Admin Event CRUD**: Create/Edit/Delete/Duplicate events from `/admin/events` dashboard
- **Application Management**: View all applications per event, Approve/Reject/Waitlist with status badges
- **CSV Export**: Download applications as CSV from any event
- **Analytics Dashboard**: Total events, applications, registrations, fill rate, top events, categories
- **QR Check-in**: Generate QR data per event, check in attendees by email
- **Certificate Generation**: Auto-generate attendance certificates for checked-in attendees, public verification endpoint
- **Location Fix**: All 18 events updated to "Online (Jizira, Munal AI)" with event_type="Virtual"
- **Site Header**: Added Header component to both EventsPage and EventDetailPage
- **Admin Sidebar**: Added "Events" link with Calendar icon
- Backend: `/app/backend/routes/admin_events.py` (15 endpoints)
- Frontend: `/app/src/pages/admin/AdminEventsPage.jsx`
- Testing: 100% backend (18/18 pytest) — Iteration 150

### Premium Events Platform (Phase 1) — June 25, 2026
- **Events Page** (`/events`): Hero with animated gradient, tabs (Upcoming/Ongoing/Past), category chips (AI, Cloud, Cybersecurity, DevOps, etc.), event type chips (Virtual/Hybrid/In Person), search box
- **Event Cards**: Premium design with banner images, date/time, type badges, category badges, price badges (Free/$49/$199), speaker avatars, location, registration count, seats left, Apply to Attend CTA
- **Event Detail Page** (`/events/:id`): Full-width banner, key info cards (date, time, location, capacity with progress bar), description, agenda, speakers, FAQs, registration sidebar, Share, Add to Calendar
- **Application Modal**: Full form (first/last name, email, phone, company, position, country, LinkedIn, industry, years experience, why attend, terms acceptance), success state with confirmation
- **Backend**: `GET /api/events` (filters: tab, category, event_type, search, pagination), `GET /api/events/{id}`, `POST /api/events/{id}/apply` with duplicate check
- **Seed Data**: 12 upcoming events (relative dates, always future), 6 past events from 2025
- **Footer**: "Events" link added under Company section
- Backend: `/app/backend/routes/events.py`, `/app/backend/seeds/events_seed.py`
- Frontend: `/app/src/pages/EventsPage.jsx`, `/app/src/pages/EventDetailPage.jsx`
- Testing: 100% backend (11/11 pytest) + 95% frontend — Iteration 149

### Mermaid Diagram Rendering Fix — June 24, 2026
- **Bug**: Mermaid diagrams showed "Diagram syntax error" due to special characters in LLM-generated code (cylinders `[("text")]`, parenthetical participant labels, curly braces in messages)
- **Fix**: Multi-pass sanitizer in `MermaidDiagram.jsx` — converts cylinders to rectangles, strips parenthetical/brace content from sequence messages, replaces slashes in participant labels. Falls back to aggressive sanitization on first failure.
- **Backend prompts updated**: Architecture, Database, APIs, Roadmap prompts now instruct GPT to use quoted labels `["text"]` and avoid special chars
- **Result**: All newly generated diagrams render 100% (verified: E-Commerce Platform 2/2, Mermaid Test App regenerated 2/2)
- Testing: Verified via screenshot + backend API — Iteration 148

### Mermaid Diagram Rendering in AI Builder — June 24, 2026
- **MermaidDiagram component**: Renders mermaid code blocks as interactive SVG diagrams with dark/light theme, toolbar (Copy source, Download SVG, Expand/Collapse), error fallback with raw code display
- **CodeBlock detection**: `BuilderView.jsx` CodeBlock detects `language-mermaid` in ReactMarkdown and renders `MermaidDiagram` instead of syntax highlighting
- **Backend prompts updated**: Architecture (flowchart + sequence diagram), Database (ER diagram), APIs (sequence diagram), Roadmap (Gantt chart) — all with customizable Mermaid templates
- **Lazy loading**: Mermaid library (~1.2MB) loaded via dynamic `import('mermaid')` only when a diagram is encountered
- Backend: `/app/backend/routes/ai_builder.py` (prompts for architecture, database, apis, roadmap)
- Frontend: `/app/src/components/ai-builder/MermaidDiagram.jsx` (NEW), `/app/src/components/ai-builder/BuilderView.jsx` (CodeBlock update)
- Testing: 100% backend (code review + API smoke) + frontend verified loading — Iteration 147

### Auto-Transcription + Pagination Cap + Recording Index — June 24, 2026
- **Auto-Transcription**: When a recording is saved, a background task sends audio to Whisper (via Emergent LLM Key) and stores the transcript text. Status flow: `pending` → `processing` → `completed`/`failed`.
  - `GET /api/recordings/{uid}/{rid}/transcript` — Fetch transcript text + status
  - `POST /api/recordings/{uid}/{rid}/retranscribe` — Re-queue failed/old transcription
  - Frontend: "Transcript" violet badge on completed, "Transcribing..." animated badge on pending, "View Transcript" dropdown item opens `TranscriptDialog` with copy/download/retry
  - Old recordings without transcripts show "Generate Transcript" button
- **Pagination Cap**: `limit` clamped to `[1, 200]` to prevent DoS
- **Compound Index**: `(user_id, pinned, created_at)` index on `recordings` collection created at startup for optimized sort+paginate
- Backend: `/app/backend/routes/recordings.py` (auto-transcription task + endpoints), `/app/backend/server.py` (index)
- Frontend: `/app/src/components/recordings/TranscriptDialog.jsx` (NEW), `/app/src/components/recordings/SavedRecordingsList.jsx` (transcript badges + menu)
- Testing: 100% backend (27/27 pytest) + 100% frontend (9/9 flows) — Iteration 146

### Pin Recording + Pagination + Component Split + Auth Refactor — June 24, 2026
- **Pin Recording**: `PUT /api/recordings/{uid}/{rid}/pin` toggles pin status. Pinned recordings have `expires_at: null` (exempt from 7-day auto-deletion), show "Pinned" badge and "No expiry" in UI. Unpinning restores 7-day expiry.
- **Pagination**: `GET /api/recordings/{uid}` now accepts `limit` (default 50) and `offset` (default 0) query params. Returns `total`, `count`, `limit`, `offset`. Pinned recordings sort first.
- **Auth Refactor**: `auth.py` (761→490 lines) split into `auth_helpers.py` (helpers, JWT, password, dependencies) and `auth_emails.py` (email templates). All external imports preserved via re-exports.
- **QuickRecordPage Split**: `QuickRecordPage.jsx` (1092→250 lines) split into `RecordingControls.jsx`, `SavedRecordingsList.jsx`, `ShareRecordingDialog.jsx`, `EditRecordingDialog.jsx` under `/app/src/components/recordings/`.
- Testing: 100% backend (18/18 pytest) + 100% frontend (7/7 flows) — Iteration 145

### Quick Record Dropdown Menu Actions — June 24, 2026
- **Play**: Stream recordings from GridFS via `/api/recordings/{uid}/{rid}/stream` endpoint — video playback in inline player
- **Download**: Fetch stream and trigger browser file download as `.webm`
- **Edit**: Dialog to update recording title and category via `PUT /api/recordings/{uid}/{rid}`
- **Share**: Dialog with Public Link (generates share token) and Team Members tabs via `POST /api/recordings/{uid}/{rid}/share`
- **Delete**: Permanent deletion via `DELETE /api/recordings/{uid}/{rid}` — removes both GridFS file and metadata
- **Bug Fixes**: Frontend `playSavedRecording` and `downloadSavedRecording` were using metadata endpoint (no file data) — switched to streaming endpoint. Share response parsing fixed to read `share_url` from backend.
- **Backend fix**: Share endpoint now returns `share_url` field in addition to `recording` object
- **data-testid**: Added `recording-menu-{id}`, `recording-play-{id}`, `recording-download-{id}`, `recording-edit-{id}`, `recording-share-{id}`, `recording-delete-{id}`
- Backend: `/app/backend/routes/recordings.py`
- Frontend: `/app/src/pages/QuickRecordPage.jsx`
- Testing: 100% backend (9/9 pytest) + 100% frontend — Iteration 144

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
- **Web Search Toggle**: Globe button in chat input bar — green (ON) or gray (OFF). Users can force disable/enable web search per session. When OFF, LLM answers from knowledge only (faster). When ON, AI searches the web for current events.
  - Backend respects `web_search` flag in message payload; strips leaked tags when disabled
  - **Admin Auth Guard**: `GET/PUT /api/admin/search-api` now requires admin authentication (401 unauthenticated, 403 non-admin)
  - **Cookie Consent Fix**: Banner z-index lowered from z-[100] to z-40 with `pointer-events-none` wrapper — no longer blocks chat input
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
- AI Builder: `POST /api/ai-builder/projects`, `GET /api/ai-builder/projects`, `POST /api/ai-builder/projects/{id}/generate/{section}` (SSE), `POST /api/ai-builder/projects/{id}/generate-all` (SSE)
- AI Chat: `POST /api/ai-chat/conversations/{id}/messages` (streaming), `GET /api/ai-chat/files/{file_id}`
- Admin Trash: `GET /api/admin/trash/summary`, `GET /api/admin/trash/{type}`, `POST /api/admin/trash/{type}/{id}/restore`, `DELETE /api/admin/trash/{type}/{id}`
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
- AI Builder: Mermaid diagram rendering in generated content
- P3: Custom Template option for Sheets
- P3: Real-time collaborative editing

## Refactoring Done
- `ai_chat.py` extracted from 1131→815 lines: Storage + prompts → `ai_chat_config.py` (115 lines), Export (MD/PDF/DOCX) → `ai_chat_export.py` (214 lines)
- `auth.py` extracted from 761→490 lines: Helpers → `auth_helpers.py` (~100 lines), Emails → `auth_emails.py` (~170 lines)
- `QuickRecordPage.jsx` extracted from 1092→250 lines: → `RecordingControls.jsx`, `SavedRecordingsList.jsx`, `ShareRecordingDialog.jsx`, `EditRecordingDialog.jsx`
- Stale `index.html` modulepreload prefetch for raw `.jsx` paths removed (was causing 404 + MIME errors in production builds)
