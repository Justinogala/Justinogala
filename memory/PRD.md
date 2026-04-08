# Munal/EchoNote AI - Product Requirements Document

## Original Problem Statement
Build a comprehensive AI-powered meeting companion platform with workspace management, admin dashboards, ICT support tracking, forms module, and real-time chat messaging.

## Architecture
```
/app/backend/routes/
├── admin.py                    # Thin re-export shell (composites all admin_*.py routers)
├── admin_settings.py           # Settings CRUD, SMTP test, 2FA enforcement, security policies
├── admin_users.py              # User listing, activity, account actions, meeting analytics
├── admin_billing.py            # Coupons, tax rates
├── admin_monitoring.py         # Dashboard stats, system health
├── admin_storage.py            # Cloud storage config, migration
├── admin_video.py              # Video history, video API key settings
├── admin_messages.py           # Chat, internal messages, exports, broadcasts
├── pdf_editor.py               # PDF Editor CRUD (upload, annotate, save, download)
├── admin_compliance.py         # Compliance score endpoint (2FA + password + login anomaly)
├── admin_2fa_dashboard.py      # 2FA adoption stats, reminders, auto-reminder scheduler
├── two_factor.py               # Admin 2FA setup/verify/disable
├── user_two_factor.py          # User 2FA setup/verify/disable + enforcement check
├── data_health.py              # Data health stats + cleanup
├── audit_logs.py               # Admin audit logging
├── auth.py                     # Login (with 2FA for ALL roles), register, password reset

/app/backend/scheduled/
├── data_health_digest.py       # Weekly data health email digest to super admins

/app/src/
├── components/
│   ├── UserTwoFactorSetup.jsx
│   ├── UserTwoFactorVerify.jsx
│   ├── admin/
│   │   ├── TwoFactorSetup.jsx
│   │   └── TwoFactorVerify.jsx
├── context/AuthContext.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── UserSettingsPage.jsx
│   └── admin/
│       ├── Admin2FADashboardPage.jsx   # 2FA dashboard with auto-reminder toggle
│       ├── ComplianceScoreWidget.jsx   # Security health score on admin dashboard
│       └── AdminSecurityPolicies.jsx
```

## Recent Changes

### Conversion History + Login Cleanup — April 3, 2026
- Removed "Sign in with Google" button from login page
- Added conversion history: tracks all conversions per user in MongoDB (conversion_history collection)
- History shows in Converter tab: original filename, conversion type, output size, time ago
- Re-download available for files < 15MB, delete per record, auto-prunes to last 50 per user
- Endpoints: GET /api/converter/history, GET .../history/{id}/download, DELETE .../history/{id}
- Testing: 100% (16/16 backend, all frontend verified) — Iteration 107

### Batch File Conversion — April 3, 2026
- Batch endpoint: POST /api/converter/batch-convert — accepts multiple files
- Image→PDF merge mode: combines all images into a single multi-page PDF
- All other conversions: converts each file individually, returns ZIP archive
- Frontend: multi-file selection, drag & drop, file list with remove, "Merge" badge for image→PDF
- Limits: max 50 files, 100MB total
- Testing: 100% (14/14 backend, all frontend verified) — Iteration 106

### File Converter Expansion — April 3, 2026
- Improved Excel→PDF: proper table grid with cell borders, header background, alternating row colors
- Improved PPTX→PDF: extracts and renders embedded images alongside text  
- New eBook category: EPUB↔MOBI (Calibre CLI), EPUB→PDF (native ebooklib + PyMuPDF, 6x9 book format)
- Total: 14 conversions available
- Added: ebooklib, Calibre CLI (ebook-convert), xvfb, xauth system packages
- Testing: 100% (21/21 backend, all frontend verified) — Iteration 105

### File Converter (DocHub) — April 2, 2026
- Built 11 file format conversions: PDF↔JPG/PNG/Word, Word/Excel/PPTX/Image→PDF, PNG↔JPG
- Backend route `/api/converter/convert` with multipart upload, supports up to 50MB files
- Uses PyMuPDF, Pillow, pdf2docx, python-docx, openpyxl, python-pptx
- Frontend: Converter tab in DocHub with categorized grid, dropzone upload, convert & download flow
- Testing: 100% (12/12 backend, all frontend verified) — Iteration 104

### DocHub Merge — April 2, 2026
- Merged eSignature + PDF Editor into a single "DocHub" page with tabbed interface
- Single sidebar entry replaces two separate items
- Old routes `/esignature` and `/pdf-editor` redirect to `/dochub` with correct tab
- Both tools render embedded within DocHub without double PageTransition wrappers

### Dashboard Footer & Whitespace Fix — April 2, 2026
- Added beautiful page termination footer to User Dashboard (gradient divider, brand tagline, quick nav links)
- Fixed excessive whitespace: grid `items-start` + removed `h-full` from MeetingListSection/RecentFilesSection
- Dashboard now ends clearly with visual boundary

### Custom PDF Templates for Admins — April 2, 2026
- Admins can upload branded PDF templates with defined fillable fields via `/api/admin/pdf-templates` CRUD
- Custom templates appear in user-facing PDF Editor gallery alongside builtin templates (blue gradient, "Custom" badge)
- Users clicking a custom template see a fill-in modal with inputs for each admin-defined field
- Generated PDFs overlay field values on the first page using PyMuPDF
- `AdminPDFTemplatesPage.jsx` for admin management (create/edit/toggle/delete)
- Fill modal in `PDFEditorPage.jsx` with backdrop dismiss, cancel/generate buttons
- Testing: 100% (23/23 backend, all frontend verified) — Iteration 103

### PDF Templates — April 2, 2026
- 6 pre-made document templates: NDA, Employment Contract, Freelance Agreement, Invoice, Service Agreement, Lease Agreement
- Each generates a professional multi-section PDF with PyMuPDF (headers, sections, fields, signature blocks, footers)
- Template gallery on PDF Editor empty state with cards showing name, description, category badge, icon
- Click to generate and open directly in the editor for filling/editing
- `GET /api/pdf-editor/templates` + `POST /api/pdf-editor/templates/{id}/generate`
- Testing: 100% (16/16 backend, all frontend verified) — Iteration 102

### PDF Editor — April 2, 2026
- **Backend**: Full CRUD API at `/api/pdf-editor/*` (upload, list, get, stream PDF, save annotations, save edited PDF, download, delete)
- PDFs stored in MongoDB (base64), supports annotations as JSON, edited PDFs baked with pdf-lib on client export
- **Frontend**: `PDFEditorPage.jsx` with tools (Select, Text, Draw, Highlight, Note, Signature), color picker, zoom, page nav, save/export
- Signature mini-pad for drawing signatures and placing on PDF
- Button on eSignature page + sidebar link for all users
- `pdf_editor` added to module permissions system for super admin role control
- Testing: 94% backend (17/18), 100% frontend — Iteration 101

### Compliance Score Trend Tracking — April 2, 2026
- **Backend**: `compliance_snapshots` collection stores weekly score snapshots
  - `GET /api/admin/compliance-score/history` returns last 12 weeks, trend direction/change
  - `POST /api/admin/compliance-score/snapshot` for manual snapshots
  - APScheduler auto-captures snapshot every Monday 10:30 AM UTC
  - Auto-seeds initial snapshot on first `/compliance-score` call
- **Frontend**: Sparkline SVG chart with area fill, interactive dots with tooltips (score + date), trend badge (up/down/flat), manual Snapshot button
- Testing: 100% (14/14 backend, all frontend verified) — Iteration 100

### Compliance Score Widget — April 2, 2026
- **Backend**: `GET /api/admin/compliance-score` computes real-time security health score (0-100)
  - 2FA Adoption (40% weight), Password Strength (30%), Login Anomaly (30%)
  - Returns grade (A-F), breakdown with sub-scores and detail counts
- **Frontend**: `ComplianceScoreWidget.jsx` with circular SVG score ring, 3 sub-score progress bars, quick links
- **Placement**: Top of admin dashboard (ModernAdminDashboard.jsx), above metrics row
- Testing: 100% (9/9 backend, all frontend verified) — Iteration 99

### Scheduled Auto-Reminders + Admin Refactor + Data Health Digest — April 2, 2026
- **2FA Auto-Reminder**: Added weekly auto-reminder (Mondays 10 AM UTC) that emails all non-2FA users when enabled. Admin toggle in 2FA Dashboard stores setting in `admin_settings` collection.
- **Admin.py Refactor**: Split ~1850-line admin.py into 7 domain-specific files (admin_settings, admin_users, admin_billing, admin_monitoring, admin_storage, admin_video, admin_messages). admin.py is now a thin re-export shell. All endpoints remain identical.
- **Data Health Digest**: New scheduled job (Mondays 9:30 AM UTC) sends comprehensive data health summary email to all super admins via Resend. Covers user activation trends, orphaned records, stale data, collection sizes.
- **APScheduler**: Now runs 4 jobs: escalations (hourly), weekly digest (Mon 9 AM), data health digest (Mon 9:30 AM), 2FA auto-reminders (Mon 10 AM).
- Testing: 100% pass rate (17/17 backend, all frontend verified) — Iteration 98

### 2FA Adoption Dashboard — April 2, 2026
- Built admin dashboard for monitoring 2FA compliance across the organization
- **Backend**: 3 endpoints under `/api/admin/2fa-dashboard/` (stats, send-reminders, auto-reminder)
- **Frontend**: Admin2FADashboardPage.jsx with stat cards, role breakdown, auto-reminder toggle, user table
- Testing: 100% — Iteration 97

### User 2FA for All Roles — April 2, 2026
- Extended 2FA to ALL user roles. Login intercepts when requires_2fa is true.
- Testing: 100% — Iteration 96

### Feature Page Image Replacement — March 31, 2026
- Replaced ALL stock images across 15 feature pages with real app screenshots

### Production Deployment Fix — March 30, 2026
- Fixed .gitignore, Atlas DB connection override, plaintext password migration

## Key DB Schema
- `users`: `two_factor_enabled`, `two_factor_method`, `totp_secret`, `recovery_codes`
- `compliance_snapshots`: Weekly security score snapshots `{score, grade, breakdown, taken_at}`
- `custom_pdf_templates`: `{ id, name, description, category, fields[], pdf_data, page_count, is_active, created_at }`
- `admin_settings`: `{key: "2fa_enforcement"}`, `{key: "2fa_auto_reminder", enabled, last_run, last_result}`
- `audit_logs`: System event tracking

## Key API Endpoints
- Admin PDF Templates: `GET/POST /api/admin/pdf-templates`, `GET/PUT/DELETE /api/admin/pdf-templates/{id}`
- PDF Editor: `POST /api/pdf-editor/upload`, `GET /documents`, `GET/DELETE /documents/{id}`, `GET /documents/{id}/pdf`, `PUT /annotations`, `POST /save-edited`, `GET /download`
- Compliance Score: `GET /api/admin/compliance-score`, `GET /compliance-score/history`, `POST /compliance-score/snapshot`
- 2FA Dashboard: `GET /api/admin/2fa-dashboard/stats`, `POST /send-reminders`, `POST /auto-reminder`
- User 2FA: `/api/user/2fa/status/{id}`, `/setup`, `/verify-setup`, `/verify`, `/disable`
- Admin Enforcement: `GET/POST /api/admin/2fa-enforcement`
- Login: `POST /api/auth/login` (returns `requires_2fa` when enabled)

## 3rd Party Integrations
- OpenAI GPT-5.2 (AI Chat), Sora 2 (Video Gen), Resend (Emails/2FA OTP) — all via Emergent LLM Key

## Test Credentials
- Super Admin: admin@munal.ai / Admin@123456
- Regular User: justinoo2001@gmail.com / Ogala@2023
- Org Admin: orgadmin@munal.com / OrgAdmin@123
- Standard User: justinogala@outlook.com / 4edfdukD@1

### Capacitor Mobile Integration — April 4, 2026
- Wired up `native.js` into `App.jsx` (imported + called `initNativeApp()` in useEffect)
- Installed `@capacitor/core@6.2.1` as a frontend dependency for Vite resolution
- Plugin imports use runtime string construction (`cap()` helper) to prevent Vite static analysis of optional native-only packages
- On web: `isNative` is false, `initNativeApp()` returns immediately (no-op)
- On native: Handles splash screen, status bar, keyboard, back button, push notifications, camera
- Testing: 100% (Iteration 108)

### Mobile-Responsive Optimization — April 4, 2026
- DocHub tabs: horizontally scrollable on mobile with `-mx-4 px-4` overflow pattern
- PDF Editor toolbar: scrollable toolbar with icon-only mode on mobile (`hidden sm:inline` for labels)
- PDF Editor canvas: responsive width via `Math.min(700, window.innerWidth - 32)` 
- PDF Editor: touch events added (onTouchStart/Move/End) for drawing on mobile
- Signature pad: touch events, responsive width, mobile-friendly sizing
- File Converter: compact dropzone, touch-friendly 44px min-height targets
- Conversion history: download/delete buttons always visible on mobile (not hover-only)
- Cookie consent: compact mobile layout (hidden icon, shorter text, inline buttons)
- Login/Signup pages: bottom padding to prevent cookie consent overlap on mobile
- UserLayout: `pt-safe` class for iOS notch
- Footer links: flex-wrap for mobile
- CSS: scrollbar-hide, keyboard-open, Capacitor safe area utilities
- Testing: 100% backend, 100% frontend (Iteration 109 + self-test)

### Push Notification Backend (FCM) — April 4, 2026
- Extended `push_notifications.py` with FCM device token CRUD endpoints
- `POST /api/push/register-device` — register Android/iOS device tokens (upsert)
- `GET /api/push/devices/{user_id}` — list registered devices
- `DELETE /api/push/unregister-device/{user_id}` — remove device tokens
- `GET /api/push/status/{user_id}` — combined web + mobile push status
- Unified `send_push_to_user()` sends to both web (VAPID) and mobile (FCM)
- FCM_SERVER_KEY is placeholder (MOCK) — set in .env when Firebase project is created
- Frontend `registerDeviceWithBackend()` in native.js, called from AuthContext after login
- Testing: 100% (12/12 backend tests passed)

### Native Build Preparation — April 4, 2026
- Created `build-native.sh` — automated build script for web→native
- Created `MOBILE_BUILD_GUIDE.md` — comprehensive guide for APK/IPA builds
- Added npm scripts: `cap:sync`, `cap:android`, `cap:ios`, `cap:build-apk`
- Vite build config: Capacitor plugins externalized in rollupOptions
- Web build + Capacitor sync verified (9 plugins for both Android and iOS)

### App Store Submission Preparation — April 4, 2026
- Generated Munal-branded app icons (15 Android mipmap PNGs + iOS 1024x1024)
- Generated branded splash screens (11 Android portrait/landscape + 3 iOS sizes)
- Android: AndroidManifest with permissions (camera, notifications, audio, storage), deep linking, FCM config, network security config
- Android: build.gradle with release signing config, ProGuard (minify+shrink), ABI splits
- iOS: Info.plist with all privacy descriptions (camera, photo, microphone), ATS, deep linking, background modes
- iOS: App.entitlements with push notifications and associated domains
- Store assets: Play Store icon (512px), App Store icon (1024px), Feature graphic (1024x500)
- Store metadata: Full listing JSON with descriptions, keywords, categories
- Comprehensive submission checklist (STORE_SUBMISSION_CHECKLIST.md) for both Play Store and App Store
- Scripts: generate-app-icons.py, generate-store-screenshots.py
- Testing: 100% (Iteration 110)

### Remaining Store Submission Items — April 4, 2026
- Android signing keystore: generation script (`scripts/generate-keystore.sh`), keystore.properties template, build.gradle auto-reads credentials
- Privacy Policy & Terms rebranded from Jiffix to Munal AI across ALL legal pages (Privacy, Terms, Security, Trademarks, ManageCookies, eSignature Terms, About, Admin Login, Footer)
- Privacy Policy updated with mobile app sections (device tokens, push notifications, camera, 2FA)
- Terms updated with 2FA requirements, mobile app usage terms, document hub ownership
- Store screenshots: 21 placeholders at correct sizes (3 devices x 7 screens) + generation script
- Final validation: 100% test pass rate (Iteration 111)

### System Updates Admin Access Fix — April 6, 2026
- Extracted AdminVersionManager from Settings tab into a dedicated `/admin/system-updates` route
- Added "System Updates" sidebar item under Configuration (visible to all admin roles)
- Fixed auth token retrieval: admin portal uses `admin_token` localStorage key, not `munal_sessions`
- Version list now loads and displays correctly in the admin portal
### AI Spreadsheet Phase 2 — April 7, 2026
- **Chat with Data**: Side-panel AI chat connected to active sheet data via `POST /api/sheets/{id}/ai/chat`
- **AI Formula Generator**: Modal to convert natural language to formulas via `POST /api/sheets/ai/formula`
- **Smart Actions**: Summarize, Sentiment Analysis, Categorize, Translate via `POST /api/sheets/{id}/ai/smart-action`
- **AI Autofill**: Pattern-based column auto-fill via `POST /api/sheets/{id}/ai/autofill`
- Frontend: Chat panel (SheetChatPanel.jsx), Formula modal + Smart Actions modal (SheetAITools.jsx)
- Testing: 16/16 backend + 100% frontend verified

### AI-Powered Spreadsheet Intelligence Module (Phase 1) — April 7, 2026
- Integrated Fortune-Sheet (@fortune-sheet/react v1.0.4) into DocHub as "Sheets" tab (default)
- Full spreadsheet CRUD: create, rename, duplicate, delete, auto-save
- **Prompt-to-Sheet**: "Create with AI" generates structured spreadsheets from natural language using GPT-5.2
- **AI Formula Generator**: `POST /api/sheets/ai/formula` converts natural language to spreadsheet formulas
- Sheet editor: full toolbar (formatting, fonts, borders, colors), formula bar, sheet tabs
- Backend: `/api/sheets/*` endpoints with auth, MongoDB storage
- Replaced emergentintegrations/litellm with lightweight `llm_client.py` (OpenAI SDK + Emergent proxy)
- Testing: 13/13 backend tests passed, frontend 100% verified

### Dashboard Publish Version Shortcut — April 6, 2026
- Added "Publish Version" shortcut button to Admin Dashboard header
- One-click navigation to System Updates page from the main dashboard

### Chat Export — April 6, 2026
- Export any AI Chat conversation as Markdown (.md), PDF (.pdf), or Word (.docx)
- Backend: `GET /api/ai-chat/conversations/{id}/export?format=md|pdf|docx`
- PDF generated with PyMuPDF (A4, word-wrapped, multi-page), DOCX with python-docx (Calibri, styled headings)
- Markdown: clean formatting with role headers and content
- Frontend: Export dropdown button in chat top bar, visible when a conversation with messages is active
- All exports include conversation title, date, and "Exported from Munal AI" footer

### Sheet Save Bug Fix — April 8, 2026
- **Root cause**: Fortune-Sheet's `onChange` fires during initialization with empty/default data, auto-save (2s debounce) was overwriting original content
- **Root cause 2**: Fortune-Sheet converts `celldata` (sparse) to `data` (2D array) internally. Saved 2D format couldn't be re-read by Workbook on reload
- **Fix 1**: Added initialization guard (`isInitializedRef` 3s timeout + skip first 2 onChange calls + empty-data check in saveData)
- **Fix 2**: Backend `_ensure_celldata()` converts 2D array back to sparse `celldata` format on load
- Testing: Backend 100% (8/8), Frontend verified — Iteration 122

### Deployment Fixes — April 7-8, 2026
- Removed `load_dotenv(override=True)`, added `CUSTOM_MONGO_URL` for Atlas DB
- Cleaned `.gitignore` (removed duplicate `*.env` blocks), tracked `.env` files in git
- Added `resolutions` in `package.json` for `@radix-ui/react-slot` version conflict
- Replaced Vite dev server with instant static file server (`startup.cjs`) for production
- Added root-level `/health` and `/ready` endpoints to backend for K8s probes
- Added MongoDB connection timeouts (`serverSelectionTimeoutMS`, `connectTimeoutMS`)
- Added `asyncio.wait_for(timeout=3)` to health check DB ping

- P3: Additional form templates
- `GET /api/sheets/{id}/download` exports Fortune-Sheet JSON to a proper .xlsx file using openpyxl
- Preserves formatting: bold, background colors, font colors, column widths, formulas
- Download button in sheet editor toolbar triggers browser file download
- Testing: 100% (9/9 backend + frontend verified) — Iteration 121

### AI Spreadsheet Phase 3 (Insights & Charts) — April 7, 2026
- **AI Insights Panel**: Side panel with "Analyze Data" button sends sheet data to GPT-5.2
- Returns: summary, key metrics (with trend indicators), auto-generated charts, and actionable insights
- **Auto-Generated Charts**: Uses `recharts` (BarChart, LineChart, PieChart) to render AI-suggested visualizations
- **AI Dashboard View**: Insights panel serves as a per-sheet dashboard with metrics + charts + insights combined
- Backend: `POST /api/sheets/{id}/ai/insights` — AI analyzes sheet data and returns structured insights+charts JSON
- Frontend: `SheetInsightsPanel.jsx` with recharts rendering, trend icons, insight categorization
- Fixed: `_extract_data_summary` now handles both Fortune-Sheet celldata (sparse) and 2D array formats
- Testing: 100% (9/9 backend + frontend verified) — Iteration 121

### Smart Templates — April 8, 2026
- 6 pre-built templates: Budget Planner, Project Tracker, Invoice, Sales Pipeline, Employee Directory, Weekly Schedule
- Templates include headers (bold, blue bg), sample data, formulas (Budget: SUM/subtraction; Invoice: multiplication + tax)
- Backend: `GET /api/sheets/templates/list` and `POST /api/sheets/templates/create`
- Frontend: Template Picker modal with visual cards (icons, colors, descriptions)
- Testing: 100% (11/11 backend + frontend verified) — Iteration 123

### Meeting Auto-Transcription & AI Insights — April 8, 2026
- Auto-records all participants' audio during video calls using Web Audio API (AudioContext mixer)
- When meeting ends: automatically uploads audio, transcribes with OpenAI Whisper, generates insights with GPT-5.2
- Backend: `POST /api/ai/meeting/process`, `GET /api/ai/meeting/{id}/status`, `GET /api/ai/meeting/user/{id}`
- Frontend: MeetingProcessingPage with 3-step progress indicator (Uploading → Transcribing → Generating Insights)
- Insights include: Summary, Key Decisions, Action Items (with priority/assignee), Topics Discussed, Follow-ups, Full Transcript
- Applied to both InstantMeetingRoom and GroupMeetingRoom
- Meetings < 10 seconds skip transcription
- MongoDB collection: `meeting_transcripts`
- Testing: 100% (13/13 backend + frontend verified) — Iteration 124

- P3: Advanced analytics/reporting

### AI Chat Real-Time Streaming — April 5, 2026
- Replaced fake streaming (wait for full response, split into word chunks) with real token-by-token streaming
- Backend now uses `litellm.completion()` with `stream=True` directly, matching emergentintegrations proxy config
- Each SSE chunk contains 1-3 characters (real LLM tokens) instead of 4-word groups
- Frontend already had streaming UI (blinking cursor, thinking dots, stop button) — now properly utilized
- Testing: 100% (8/8 backend tests passed) — Iteration 112

### AI Chat Bug Fix + Regenerate Response — April 5, 2026
- **Bug Fix**: First message in a new conversation didn't show streaming text. Root cause: `useEffect([activeConvId])` fired when `setActiveConvId` was called during first message send, fetching empty conversation from server and overwriting locally-added streaming messages. Fixed with `streamingRef` to skip message loading during streaming.
- **Regenerate Response**: Added "Regenerate" button on the last assistant message. Clicking deletes the last assistant response from DB and streams a fresh LLM response. Also added "Copy response" button on all completed assistant messages.
- Endpoint: `POST /api/ai-chat/conversations/{id}/regenerate`
- Testing: 100% (11/11 backend tests passed) — Iteration 113

### AI Chat Conversation Search — April 5, 2026
- Added search input in sidebar to filter conversations by keyword (debounced 300ms)
- Searches both conversation titles ($regex case-insensitive) and message content
- Backend endpoint: `GET /api/ai-chat/conversations/search?q=<query>` (placed before `{conv_id}` routes to avoid path collision)
- Frontend: searchResults replace conversation list when active; clearing reverts to full list
- Testing: 100% (11/11 backend tests passed) — Iteration 114

### AI Chat Conversation Pinning — April 5, 2026
- Pin/unpin conversations to keep important chats at the top of the sidebar
- Backend: `PATCH /api/ai-chat/conversations/{id}/pin` toggles pinned state
- Pinned conversations sort before unpinned in both list and search results
- Frontend: pin icon indicator on pinned items, pin/unpin button on hover, client-side re-sort after toggle
- Fixed MongoDB projection bug: empty dict returned when querying non-existent fields on older documents
- Testing: 100% (11/11 backend tests passed) — Iteration 115

### Software Update System — April 5, 2026
- Modern system update flow in User Settings > Update tab (like iOS/Android updates)
- Check for updates animation, update available card with version info + release notes, progress bar, cache-clearing reload
- Admin Version Management: CRUD for version entries (version, title, release notes, critical flag) in Admin Settings > Updates tab
- Platform-aware: Web does cache-busting reload, mobile links to Play Store / App Store
- Version comparison logic: newer versions detected correctly
- Backend endpoints: GET/POST /api/updates/admin/versions, PATCH/DELETE /api/updates/admin/versions/{id}, GET /api/updates/check, GET /api/updates/changelog, POST /api/updates/acknowledge
- RBAC: Non-admin users blocked from admin endpoints (403)
- Seed data: v2.0.0 (Munal AI Launch), v2.1.0 (AI Chat Streaming & Search)
- Testing: 100% (15/15 backend tests passed) — Iteration 116

### Auto-Update Notifications — April 5, 2026
- Real-time update notification banner appears across the app when admin publishes a new version
- Backend: SSEManager.broadcast_all() sends `app_update` event to all connected users on version publish
- Frontend: Floating banner at top center with "New Update Available v{X} — {Title}", Update button (navigates to Settings), dismiss button (sessionStorage per-tab)
- Startup poll fallback: Checks /api/updates/check on mount (3s delay) for cases when SSE missed
- SSE listener in useWebSocketChat.js dispatches `munal-app-update` custom event on `app_update` SSE event
- Testing: 100% (12/12 backend, frontend fully verified) — Iteration 117

### What's New Modal — April 5, 2026
- Onboarding modal pops up once after user updates, showing paginated feature highlights with icons
- Backend: `GET /api/updates/whats-new` returns unseen versions + highlights; `highlights` field added to version model (array of {icon, title, description})
- Frontend: `WhatsNewModal.jsx` with purple gradient header, 3 highlights per page, pagination dots/arrows, "Continue"/"Got it, let's go!" button
- Shows only once per version (localStorage `munal_whatsnew_shown`), acknowledges backend on close
- Icon mapping: string icon names (Zap, Search, Pin, etc.) mapped to lucide-react components
- Testing: 100% (11/11 backend, frontend fully verified) — Iteration 118
