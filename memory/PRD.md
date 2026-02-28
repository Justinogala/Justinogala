# Munal - AI Meeting Companion PRD

## Original Problem Statement
User uploaded a Vite + React application (Munal/EchoNote AI) that needed to be extracted, set up, fixed, and displayed. Then requested to add modern chat features, real-time WebSocket messaging, Quick Record feature, and comprehensive payment management pages.

## Architecture
- **Frontend**: React 18 + Vite + Tailwind CSS + Radix UI components + Shadcn/UI
- **Backend**: FastAPI (Python) with MongoDB + SSE support
- **Database**: MongoDB (with GridFS for file storage)
- **Auth**: Custom JWT-based authentication (localStorage)
- **Real-time**: Server-Sent Events (SSE) with REST API fallback
- **Storage**: MongoDB GridFS (7-day TTL for recordings)

## User Personas
1. **Meeting Organizers** - Schedule, manage and transcribe meetings
2. **Team Members** - Access shared transcriptions and summaries
3. **Admin Users** - Platform administration and user management

## Core Requirements
- AI-powered meeting transcription
- Meeting scheduling and calendar integration
- Real-time collaboration features
- Video conferencing capabilities
- File management system
- Team workspaces
- Analytics dashboard
- **Modern chat features**
- **Real-time messaging**

## What's Been Implemented (Jan-Feb 2026)

### Initial Setup
- [x] App extracted and configured to run with Vite
- [x] Fixed JSX parsing issues in vite.config.js
- [x] Fixed ToastContextProvider missing error
- [x] Landing page displaying correctly
- [x] Navigation and routing working
- [x] Backend API responding

### Chat Features Added (Session 2)
- [x] **Emoji Picker** - Full emoji keyboard with categories and recent emojis
- [x] **GIF Picker** - Search and select GIFs (with Sparkles icon)
- [x] **File Upload** - Attach files to messages
- [x] **Image Upload** - Share images in chat
- [x] **Voice Messages** - Record and send voice messages
- [x] **Location Sharing** - Share current location
- [x] **Poll Creator** - Create polls with multiple options, expiration, anonymous voting
- [x] **Contact Sharing** - Share contact information with teammates
- [x] **Schedule Messages** - Schedule messages for later delivery
- [x] **Enhanced Message Input** - Modern chat UI with all features integrated
- [x] Fixed MessageList.jsx users undefined error
- [x] Fixed App.jsx parsing error with ToastContextProvider

### Real-time Messaging (Session 3)
- [x] **WebSocket Backend** - FastAPI WebSocket endpoint at `/ws/chat/{user_id}`
- [x] **Connection Manager** - Manages active connections, presence, typing indicators
- [x] **Chat REST API** - `/api/chat/messages` for CRUD operations
- [x] **Online Users API** - `/api/chat/online-users` endpoint
- [x] **User Status API** - `/api/chat/user-status/{user_id}` endpoint
- [x] **WebSocket Client Hook** - `useWebSocketChat.js` for real-time connectivity
- [x] **WebSocket Context** - `WebSocketChatContext.jsx` for global state management
- [x] **Polling Fallback** - Automatic fallback to REST API when WebSocket unavailable
- [x] **Typing Indicators** - Real-time typing status
- [x] **Read Receipts** - Message read status tracking
- [x] **Presence System** - Online/offline status for users
- [x] **Connection Status UI** - Banner showing connection state with reconnect option

### Critical Bug Fixes (Feb 22, 2026)
- [x] **Fixed App.jsx JSX Syntax Error** - Corrected React Context Provider nesting order that was causing the entire app to crash with "refused to connect" error
- [x] **Verified Chat Feature Stability** - REST API polling fallback is working correctly for real-time chat when WebSocket is unavailable

### Quick Record Feature (Feb 23, 2026)
- [x] **Quick Record Page** - New page at `/quick-record` for video recording
- [x] **Screen Recording** - Share and record screen with MediaRecorder API
- [x] **Camera Recording** - Record using webcam with getUserMedia API
- [x] **Microphone Audio** - Optional audio capture during recording
- [x] **Live Preview** - Real-time preview while recording
- [x] **Recording Controls** - Pause/Resume and Stop functionality
- [x] **Post-Recording Actions** - Download, Record Again, Discard options
- [x] **30-minute Limit** - Maximum recording time enforced
- [x] **Sidebar Menu Item** - Quick Record added to user sidebar with highlight
- [x] **7-Day Auto-Delete** - Recordings auto-expire after 7 days
- [x] **Recording Categories** - Organize recordings into folders (Meetings, Tutorials, Presentations, Bug Reports, Personal)
- [x] **Share Recordings** - Generate public share links for recordings
- [x] **Edit Recordings** - Update title and category of saved recordings
- [x] **Category Filtering** - Filter recordings by category in sidebar

### Chat Improvements (Feb 23, 2026)
- [x] **Real GIPHY Integration** - Live GIF search using GIPHY API with trending, categories, and search
- [x] **Improved WebSocket Hook** - Better fallback mechanism with reconnection logic
- [x] **REST Polling Fallback** - Automatic fallback when WebSocket unavailable
- [x] **Server-Sent Events (SSE)** - Real-time chat via `/api/chat/stream/{user_id}` endpoint
- [x] **SSE Message Delivery** - Messages sent via REST, received in real-time via SSE
- [x] **SSE Presence System** - Online/offline status broadcast to all connected users
- [x] **SSE Typing Indicators** - Real-time typing status via SSE
- [x] **Auto-reconnect Logic** - Exponential backoff reconnection on connection loss
- [x] **Keep-alive Pings** - 30-second keep-alive to maintain connection

## Components Created
1. `/app/src/components/chat/GifPicker.jsx`
2. `/app/src/components/chat/PollCreator.jsx`
3. `/app/src/components/chat/ContactSharePicker.jsx`
4. `/app/src/components/chat/ScheduleMessagePicker.jsx`
5. `/app/src/components/chat/EnhancedMessageInput.jsx`
6. `/app/src/hooks/useWebSocketChat.js`
7. `/app/src/context/WebSocketChatContext.jsx`
8. `/app/src/pages/QuickRecordPage.jsx`

## Backend Endpoints
- `GET /api/` - Health check
- `GET /api/chat/messages/{user_id}/{partner_id}` - Get conversation messages
- `POST /api/chat/messages` - Create new message
- `PUT /api/chat/messages/read` - Mark messages as read
- `GET /api/chat/online-users` - Get online users list
- `GET /api/chat/user-status/{user_id}` - Get user online status
- `WS /ws/chat/{user_id}` - WebSocket connection for real-time messaging

## Prioritized Backlog

### P0 (Critical)
- None currently - app is functional

### P1 (High Priority)
- None currently - core features complete

### P2 (Medium Priority)
- Add push notifications for new messages
- Implement message search functionality
- Add group chat support
- Cloud storage migration for production

### Chat File Upload & AI Features (Feb 25, 2026)
- [x] **File Upload to GridFS** - `POST /api/chat/files/upload` with JSON base64 encoding
- [x] **File Download/Stream** - `GET /api/chat/files/{file_id}` from GridFS
- [x] **File Delete** - `DELETE /api/chat/files/{file_id}`
- [x] **AI Chat Endpoint** - `POST /api/ai/chat` using Emergent LLM Key with GPT-4o
- [x] **AI Assistant Widget** - Works for all users without API key configuration
- [x] **Transcript Analysis** - `POST /api/transcripts/analyze` with AI-powered insights
- [x] **Insights Service** - Frontend service calls backend for transcript analysis

### Text to Audio Feature (Feb 25, 2026)
- [x] **Backend TTS Endpoints** - `/api/tts/voices`, `/api/tts/generate`, `/api/tts/generate-base64`
- [x] **OpenAI TTS Integration** - Using emergentintegrations library with EMERGENT_LLM_KEY
- [x] **9 Voice Options** - Male (Ash, Echo, Onyx), Female (Coral, Nova, Sage, Shimmer), Neutral (Alloy, Fable)
- [x] **Quality Options** - Standard (tts-1) and HD (tts-1-hd) models
- [x] **Speed Control** - Adjustable 0.25x to 4x speed
- [x] **Audio Player** - Play/pause controls with download option
- [x] **User Sidebar Menu** - "Text to Audio" menu item with Volume2 icon

### Stripe Payment Integration (Feb 25, 2026)
- [x] **Backend Payment Endpoints** - `/api/payments/packages`, `/api/payments/checkout`, `/api/payments/status/{session_id}`, `/api/payments/transactions`, `/api/payments/transactions/all`, `/api/webhook/stripe`
- [x] **Subscription Packages** - Free, Pro Monthly ($29), Pro Annual ($290), Enterprise Monthly ($99), Enterprise Annual ($990)
- [x] **Stripe Checkout Integration** - Real Stripe checkout sessions via emergentintegrations library
- [x] **Transaction Recording** - MongoDB `payment_transactions` collection stores all payment attempts
- [x] **Payment Status Polling** - Frontend polls Stripe for payment confirmation after checkout
- [x] **User Plans Page** - Connected to real Stripe checkout with loading states and redirects
- [x] **Checkout Status Page** - Handles success/cancelled/failed states with retry logic
- [x] **Transaction History** - User and Admin views fetching real data from backend

### Manage Payments Feature (Feb 24, 2026)
- [x] **User Plans & Billing Page** - `/user/plans` with plan comparison, usage stats, and billing toggle
- [x] **User Coupons Page** - `/user/coupons` with active/expired coupons, copy codes, redeem functionality
- [x] **User Transaction History** - `/user/transactions` with search, filters, export, and receipt views
- [x] **User Payment Methods** - `/user/payment-methods` already existed with add/remove card functionality
- [x] **Admin Plans Management** - `/admin/plans` with plan CRUD, pricing, and feature management
- [x] **Admin Coupon Management** - `/admin/coupons` with create, toggle, delete coupons
- [x] **Admin Tax Rates** - `/admin/tax-rates` with regional tax configuration
- [x] **Admin Transactions View** - `/admin/transactions` with full transaction history, refund capability
- [x] **User Sidebar Menu** - Collapsible "Manage Payments" menu with 4 submenu items
- [x] **Admin Sidebar Menu** - Collapsible "Manage Payments" menu with 5 submenu items

## Components Created
1. `/app/src/components/chat/GifPicker.jsx`
2. `/app/src/components/chat/PollCreator.jsx`
3. `/app/src/components/chat/ContactSharePicker.jsx`
4. `/app/src/components/chat/ScheduleMessagePicker.jsx`
5. `/app/src/components/chat/EnhancedMessageInput.jsx`
6. `/app/src/hooks/useWebSocketChat.js`
7. `/app/src/context/WebSocketChatContext.jsx`
8. `/app/src/pages/QuickRecordPage.jsx`
9. `/app/src/pages/user/UserPlansPage.jsx` - User plans & billing
10. `/app/src/pages/user/UserCouponsPage.jsx` - User coupons management
11. `/app/src/pages/user/UserTransactionsPage.jsx` - User transaction history
12. `/app/src/pages/admin/AdminPlansPage.jsx` - Admin plan management
13. `/app/src/pages/admin/AdminCouponsPage.jsx` - Admin coupon management
14. `/app/src/pages/admin/AdminTaxRatesPage.jsx` - Admin tax rate configuration
15. `/app/src/pages/admin/AdminTransactionsPage.jsx` - Admin transaction overview

### Files Page Fix (Feb 26, 2026)
- [x] **File List Endpoint** - `GET /api/chat/files/user/{user_id}` returns all files for a user with optional category filter
- [x] **fileService.listFiles()** - Frontend service method to fetch user's files from backend
- [x] **uploadFileService.getRecentFiles()** - Updated to use backend API via fileService.listFiles()
- [x] **uploadFileService.getStorageStats()** - Calculates storage stats from actual file data
- [x] **Progress Component Fix** - Added `indicatorClassName` prop support to shadcn Progress component
- [x] **File Manager Page** - Now loads correctly with file upload sections and file list

### Recording Sharing Feature (Feb 26, 2026)
- [x] **Enhanced Share Dialog** - Tabbed UI with "Public Link" and "Team Members" options
- [x] **Team Member Selection** - Search and select team members to share recordings with
- [x] **Shared With Me Section** - Toggle between "My Recordings" and "Shared" tabs in sidebar
- [x] **teamService.getAllUsers()** - Get all registered users except current user
- [x] **teamService.getUserById()** - Get user info by ID for display
- [x] **SharedRecordingPage** - New page at `/shared/recording/:shareToken` for viewing shared recordings
- [x] **Stream Shared Recording** - `GET /api/recordings/shared/{share_token}/stream` endpoint for video playback
- [x] **Share Badges** - Shows "Public" or "X members" badge on shared recordings

### MongoDB User Authentication (Feb 26, 2026)
- [x] **User Registration API** - `POST /api/auth/register` stores users in MongoDB
- [x] **User Login API** - `POST /api/auth/login` authenticates against MongoDB
- [x] **Get All Users API** - `GET /api/users` returns all users from MongoDB
- [x] **Update User API** - `PUT /api/users/{user_id}` updates user in MongoDB
- [x] **Delete User API** - `DELETE /api/users/{user_id}` removes user from MongoDB
- [x] **AuthContext Integration** - Frontend signup/login calls backend API instead of localStorage
- [x] **Admin User Service** - `adminUserDataService.js` fetches users from MongoDB API
- [x] **Team Service** - `teamService.js` fetches and caches users from MongoDB
- [x] **UserTableRow Fix** - Handles missing/null name fields gracefully with fallbacks

### JWT Token & Password Reset (Feb 26, 2026)
- [x] **JWT Token Generation** - Login/register returns JWT tokens with 24-hour expiration
- [x] **JWT Token Verification** - `GET /api/auth/verify-token` validates tokens
- [x] **JWT Helper Functions** - `create_jwt_token()`, `verify_jwt_token()`, `get_current_user()` dependency
- [x] **Forgot Password API** - `POST /api/auth/forgot-password` generates temp password and sends email
- [x] **Change Password API** - `POST /api/auth/change-password` for setting new password after reset
- [x] **Resend Email Integration** - Professional HTML email template for password reset
- [x] **ForgotPasswordPage** - User-friendly page at `/forgot-password` to request password reset
- [x] **ChangePasswordModal** - Modal that appears when user logs in with `must_change_password: true`
- [x] **Temp Password Login** - Backend accepts both regular and temporary passwords
- [x] **24-hour Temp Password Expiry** - Temporary passwords expire after 24 hours

### Admin User Management Redesign (Feb 26, 2026)
- [x] **Modern Stats Cards** - Total Users, Active, Suspended, Pro/Enterprise with gradient icons
- [x] **Glass-morphism Design** - Semi-transparent cards with backdrop blur matching dashboard
- [x] **Improved Search & Filters** - Clean search bar with role, status, plan dropdowns
- [x] **User Card Layout** - Modern card design replacing table view
- [x] **Gradient Avatars** - User initials with violet-purple gradient
- [x] **Role Badges** - Color-coded badges for Admin, Manager, User
- [x] **Plan Badges** - Special gradient badges for Pro/Enterprise plans
- [x] **Status Badges** - Emerald for Active, Red for Suspended
- [x] **Hover Actions** - Action menu appears on hover (Edit, Suspend, Delete)
- [x] **useMemo Optimization** - Filters using useMemo instead of useEffect for performance

### User Sidebar & Dashboard Redesign (Feb 26, 2026)
- [x] **New Sidebar Design**:
  - Gradient Munal logo with "AI Workspace" tagline
  - Search bar with ⌘K keyboard shortcut hint
  - Navigation items with gradient icon backgrounds on hover/active
  - "NEW" badge on Quick Record
  - Active indicator bar animation
  - Collapsible payments section with smooth animations
  - User profile footer with plan badge and online indicator
- [x] **New Dashboard Design**:
  - Dynamic greeting with gradient user name
  - Date badge and plan badge in header
  - 4 stat cards with unique gradients and hover effects
  - Quick Actions grid with gradient icons and descriptions
  - "NEW" badge on Record action
  - Ambient background gradient effects
  - Glass-morphism styling throughout
- [x] **Consistent Design Language** - Matches admin panel styling

### Chat Dashboard Enhancements (Feb 26, 2026)
- [x] **GIF Functionality Removed** - Removed Sparkles/GIF button from message input
- [x] **3-Dot Menu Actions** - All dropdown items functional (Location, Contact, Poll, Schedule Message)
- [x] **Location Sharing Dialog** - Uses OpenStreetMap embed for map preview
- [x] **Poll Creator Dialog** - Full-featured with question, options, multiple answers, anonymous voting, expiry
- [x] **Contact Share Dialog** - Share contact info with teammates
- [x] **Schedule Message Dialog** - Schedule messages for later delivery
- [x] **Attachment Display** - Messages show images, files, locations, polls, contacts properly
- [x] **Downloadable Attachments** - Both sender and receiver can view/download images and files

### Admin User Messages Feature (Feb 26, 2026)
- [x] **View Messages API** - `GET /api/admin/chat/messages/{user_id}` returns all messages for a user
- [x] **UserMessagesModal** - Beautiful modal showing user's chat conversations
- [x] **Message History Display** - Shows sent/received messages with partner info
- [x] **Admin Action Menu** - Added "View Messages" option to user actions dropdown
- [x] **Always Visible Actions** - Made 3-dot menu always visible instead of hover-only

### Admin Sidebar & Header Redesign (Feb 26, 2026)
- [x] **Modern Glassmorphism Sidebar** - Frosted glass effect with gradient backgrounds
- [x] **Gradient Icon Backgrounds** - Each navigation item has unique gradient colors on hover/active
- [x] **Shield Logo Header** - Admin branding with "Control Center" tagline and animated online indicator
- [x] **Search Bar with Shortcut** - Search admin functionality with ⌘K keyboard hint
- [x] **Section Labels** - Clear categories: Navigation, Management, Billing, Configuration
- [x] **Collapsible Payments** - Smooth animated expansion for payment sub-items with amber gradient
- [x] **Left Border Indicator** - Amber border on payment sub-items for visual hierarchy
- [x] **Active Indicator Animation** - Violet gradient bar animates between active nav items
- [x] **Admin Profile Footer** - Avatar with online status, Super badge, and logout button
- [x] **Updated Header** - Glassmorphism header with gradient branding and sparkle icon
- [x] **Consistent Design Language** - Matches user sidebar aesthetic with admin color scheme (indigo/violet)

### Persistent Admin Settings (Feb 26, 2026)
- [x] **MongoDB Backend API** - New endpoints for settings CRUD:
  - `GET /api/admin/settings` - Fetch all settings
  - `GET /api/admin/settings/{category}` - Fetch specific category
  - `PUT /api/admin/settings/{category}` - Save settings (upsert)
  - `DELETE /api/admin/settings/{category}` - Delete settings
  - `POST /api/admin/settings/reset-defaults` - Reset all settings
- [x] **Frontend Service Updates** - Both `adminSettingsService.js` and `adminSettingsPersistenceService.js` now use MongoDB API
- [x] **Persistent Storage** - Settings saved to `admin_settings` collection in MongoDB
- [x] **Survive Deployments** - SMTP, security, notifications, and system settings now persist across deployments
- [x] **Caching** - 30-60 second cache to reduce API calls while keeping data fresh
- [x] **Toast Notifications** - Clear feedback when settings are saved to database

### SMTP Test & Audit Logging (Feb 26, 2026)
- [x] **Real SMTP Test Email** - Sends actual test email via configured SMTP settings
  - Beautiful HTML + plain text email template
  - Shows SMTP configuration details in email body
  - Error handling for auth failures, connection issues
- [x] **Audit Logging System** - Tracks all admin actions in MongoDB
  - `audit_logs` collection stores all events
  - Logs settings updates, deletes, resets
  - Logs SMTP test attempts (success/failure)
  - Captures previous vs new values for settings changes
- [x] **Audit Logs API**:
  - `GET /api/admin/audit-logs` - Fetch logs with filtering
  - `GET /api/admin/audit-logs/summary` - Get action counts
- [x] **Audit Logs Admin Page** (`/admin/audit-logs`)
  - Summary cards showing action counts
  - Searchable, filterable log list
  - Expandable details for each entry
  - Pagination support
- [x] **Sidebar Link** - Added Audit Logs to admin sidebar under Configuration

### Admin Panel Enhancements (Feb 26, 2026)
- [x] **IP Address & User Agent Tracking** - All audit log entries capture client IP and browser info
  - `get_client_ip()` extracts IP from X-Forwarded-For or request.client
  - `get_user_agent()` extracts browser user agent from headers
  - Displayed in audit logs with Globe and Monitor icons
- [x] **Audit Log Export** - Export audit logs to CSV or JSON formats
  - Export dropdown button in Audit Logs page header
  - `GET /api/admin/audit-logs/export?format=csv|json` endpoint
  - CSV includes all fields: timestamp, action, category, admin, IP, user agent, details
  - JSON export with exported_at timestamp and count
- [x] **Admin Coupons Management** (`/admin/coupons`)
  - Full CRUD: Create, Read, Update, Delete coupons
  - Stats cards: Total Coupons, Active, Total Uses
  - Search and status filtering
  - Coupon code auto-uppercase
  - Support for percentage and fixed discount types
  - Max uses, uses per user, min order amount settings
  - Valid until date with calendar picker
  - Copy coupon code to clipboard
  - Toggle active/inactive status
- [x] **Admin Tax Rates Management** (`/admin/tax-rates`)
  - Full CRUD: Create, Read, Update, Delete tax rates
  - Stats cards: Total Rates, Active, Countries
  - Country dropdown with 10 major countries
  - State/province optional field
  - Tax inclusive/exclusive toggle
  - Rate percentage input with precision
  - Country filter dropdown
  - Location display with country name and state badge

### Calendar-Meetings Integration (Feb 27, 2026)
- [x] **Meetings Page Connected to MongoDB** - `/meetings` page now fetches from `/api/calendar/events` instead of localStorage
- [x] **Data Transformation** - Calendar events transformed to MeetingCard format (date, time, participants, meetingUrl, etc.)
- [x] **Delete from Meetings Page** - Delete button calls backend DELETE API
- [x] **Join Meeting Button** - Opens video call link or navigates to meeting room
- [x] **Open Calendar Button** - Quick navigation to Calendar page
- [x] **Quick Schedule Button** - Creates events via calendar API
- [x] **Stats Widget** - Shows total meetings and upcoming count
- [x] **Next Up Widget** - Displays upcoming meetings with video indicator
- [x] **Removed localStorage Dependency** - `localMeetingsStorageService` no longer used in meetings dashboard

### Instant Meeting Feature (Feb 28, 2026)
- [x] **Instant Meeting Dashboard Section** - Quick meeting start from Meetings page
  - "Instant Meeting" label with video icon
  - "Start" button to launch instant meeting
  - "Copy link" button to share meeting link
  - "Enter Meeting ID" input to join by ID
  - "JOIN" button
- [x] **Instant Meeting Room** - Full video meeting interface
  - Pre-join screen with camera preview
  - "Enable Camera" button with error handling
  - "Instant" badge for quick meetings
- [x] **In-Meeting Controls** (Jizira-style with labels):
  - Mute/Unmute, Stop/Start Video, Share Screen
  - Raise Hand, Leave Meeting, Participants, Chat, More
- [x] **Meeting URLs** - Navigate to `/workspace/meeting/{id}` format

### Admin Monitoring & Security (Feb 28, 2026)
- [x] **1. User Activity Monitoring** - Login/logout tracking, failed attempts, IP logging
- [x] **2. Meeting Analytics** (`/admin/meeting-analytics`) - Stats, peak hours, trends
- [x] **3. User Account Controls** - Enable/disable, force reset, session management, account lock
- [x] **4. Security Policies** (`/admin/security-policies`) - Password rules, session timeout, lockout
- [x] **5. Audit Logs Enhancement** - Meeting events, calendar changes
- [x] **6. User Management Dashboard** - Search, filter, export users
- [x] **7. Real-time Monitoring** (`/admin/monitoring`) - Online users, active meetings, health
- [x] **Login Security** - Account locking, lockout duration, IP tracking

## Next Tasks
1. GIPHY Integration - Implement client-side logic for GIF button in chat
2. Cloud storage migration (GridFS → AWS S3 for production)
3. Refactor server.py into modular route files
4. Push notifications for messages and meetings
5. Group video calls (multi-participant WebRTC)

### Calendar Feature (Feb 27, 2026)
- [x] **Full Calendar UI** - Microsoft Calendar-like interface
  - Month/Week/Day view switcher
  - Today button and navigation arrows
  - Click on any day to create event
  - Color-coded events by category
- [x] **Event Management**
  - Create/Edit/Delete events
  - Title, description, location fields
  - Start/end time with datetime picker
  - All-day event option
- [x] **Meeting Features**
  - Invite workspace members
  - Email notifications via Resend (from notifications@munal.ai)
  - Video call link auto-generation
  - Attendee response tracking (pending/accepted/declined)
- [x] **Categories & Colors**
  - Meeting, Reminder, Task, Personal categories
  - 6 color options: blue, green, red, purple, orange, pink
- [x] **Recurring Meetings**
  - Daily, Weekly, Monthly recurrence
  - Recurrence end date
- [x] **Backend APIs**:
  - `GET /api/calendar/events` - List events for user
  - `POST /api/calendar/events` - Create event with invitations
  - `GET /api/calendar/events/{id}` - Get single event
  - `PUT /api/calendar/events/{id}` - Update event
  - `DELETE /api/calendar/events/{id}` - Delete event
  - `POST /api/calendar/events/{id}/respond` - RSVP to invitation
  - `GET /api/calendar/upcoming` - Dashboard widget
- [x] **MongoDB Collection**: `calendar_events`
- [x] **Sidebar Integration**: Calendar added to user sidebar menu

### WebRTC Audio/Video Calls (Feb 27, 2026)
- [x] **WebRTC Signaling Server** - Backend REST API + SSE for peer-to-peer calls
  - Supports call_initiate, call_accept, call_reject, call_end
  - Supports webrtc_offer, webrtc_answer, webrtc_ice_candidate exchange
  - Call events sent via SSE to recipients
- [x] **WebRTC Service** - Frontend WebRTC implementation
  - `/app/src/services/webrtcService.js` - Peer connection management
  - STUN servers configured (Google STUN servers)
  - Audio/video stream management
- [x] **Call Hook** - React hook for call management
  - `/app/src/hooks/useWebRTCCall.js` - Call state, initiate, accept, reject, end
  - Uses REST API for signaling instead of WebSocket
- [x] **Call UI Components**
  - `/app/src/components/chat/CallInterface.jsx` - Active call interface with mute/video toggle
  - `/app/src/components/chat/IncomingCallModal.jsx` - Incoming call modal with accept/reject
- [x] **Chat Page Integration**
  - Phone button (audio call) with data-testid='audio-call-btn'
  - Video button (video call) with data-testid='video-call-btn'
  - Buttons disabled when user is offline with tooltip

### Workspace Member Management (Feb 27, 2026)
- [x] **Add Member Feature** - Direct member addition without approval workflow
  - Changed "Send Invite" to "Add Member"
  - Members are added instantly with status='active'
  - Search users by email or name as you type
  - Click search result to add immediately
- [x] **Backend APIs**:
  - `GET /api/users/search?q={query}` - Search users by email or name
  - `GET /api/users/by-email/{email}` - Get user by exact email
  - `GET /api/workspaces/{id}/members` - List workspace members
  - `POST /api/workspaces/{id}/members` - Add member directly
  - `PUT /api/workspaces/{id}/members/{user_id}` - Update member role
  - `DELETE /api/workspaces/{id}/members/{user_id}` - Remove member
- [x] **MongoDB Collection**: `workspace_members` stores member relationships
- [x] **Frontend Component**: `/app/src/components/WorkspaceMemberManagement.jsx`

### Group Video Calls (Feb 28, 2026)
- [x] **Multi-Participant WebRTC** - Support for up to 16 participants in a meeting
  - Each participant creates peer connections to all other participants
  - ICE candidate buffering for stable connection establishment
  - Automatic offer/answer negotiation when new participant joins
- [x] **Backend APIs**:
  - `POST /api/group-call/join` - Join a group call room
  - `POST /api/group-call/leave` - Leave a group call room
  - `POST /api/group-call/signal` - Send WebRTC signaling (offer/answer/ice)
  - `GET /api/group-call/room/{room_id}` - Get room state and participants
  - `POST /api/group-call/update-participant` - Update video/audio/hand status
  - `GET /api/group-call/participants/{room_id}` - Get participants list
- [x] **Grid View Layout** - Dynamic grid adapts to participant count
  - 1 participant: 1x1 grid
  - 2 participants: 1x2 grid
  - 3-4 participants: 2x2 grid
  - 5-6 participants: 2x3 grid
  - 7-9 participants: 3x3 grid
  - 10-12 participants: 3x4 grid
  - 13-16 participants: 4x4 grid
- [x] **Participant Tiles**:
  - Display participant names
  - Muted microphone indicator
  - Video off indicator
  - Hand raised indicator
- [x] **Speaker Spotlight**:
  - Active speaker highlighted with green ring
  - "Speaking" badge on active speaker tile
  - Active speaker shown in participants list
- [x] **Meeting Controls**:
  - Mute/Unmute microphone
  - Enable/Disable video
  - Share screen
  - Raise/Lower hand
  - View participants list
  - In-meeting chat
  - Grid view reset button
  - Leave meeting
- [x] **Pre-Join Screen**:
  - Camera/mic preview
  - Toggle controls before joining
  - Meeting info display (title, time, participants)
  - Copy meeting link button
- [x] **Frontend Components**:
  - `/app/src/hooks/useGroupWebRTC.js` - Custom hook for multi-peer WebRTC management
  - `/app/src/pages/GroupMeetingRoomPage.jsx` - Main group meeting room component
  - `ParticipantTile` - Individual video tile with participant info
  - `VideoGrid` - Adaptive grid layout component

### Audio Level Detection & Speaker Spotlight (Feb 28, 2026)
- [x] **useAudioLevelDetection Hook** - Web Audio API-based audio level detection
  - Uses AnalyserNode for frequency data analysis
  - RMS (Root Mean Square) calculation for accurate volume levels
  - Configurable threshold for speaking detection
  - Debounced speaker detection to prevent rapid switching
- [x] **AudioLevelIndicator Component** - Visual audio level bars
  - 5-bar visualization with dynamic heights
  - Green color when user is actively speaking
  - Smooth transition animations
- [x] **Automatic Speaker Spotlight**:
  - Automatically detects who is speaking based on audio levels
  - Highlights active speaker with green ring and badge
  - Shows audio level indicator on participant tile
- [x] **Frontend Component**: `/app/src/hooks/useAudioLevelDetection.js`

### Mobile App Optimization (Feb 28, 2026)
- [x] **Responsive Video Grid**:
  - Mobile: 2 columns (grid-cols-2)
  - Tablet: 3 columns (sm:grid-cols-3)
  - Desktop: 4 columns (lg:grid-cols-4)
  - Smaller participant tiles on mobile (min-h-[120px])
- [x] **Touch-Friendly Controls**:
  - 44x44px minimum tap targets on mobile
  - Control buttons: h-11 w-11 on mobile, h-14 w-14 on desktop
  - Screen share and Grid buttons hidden on mobile
- [x] **Mobile Sidebar Overlay**:
  - Slide-in panel from right (85% width, max-w-sm)
  - Framer Motion animation
  - Backdrop overlay with tap-to-dismiss
- [x] **Responsive Header**:
  - Truncated title on mobile (max-w-[120px])
  - Smaller badges and icons
  - Compact participant count display
- [x] **Safe Area Support**:
  - pb-safe class for bottom controls
  - Works with iPhone notch and home indicator

## Prioritized Backlog

### P0 (Critical)
- [ ] Fix recurring camera bug (camera fails to start in meeting rooms)

### P1 (High Priority)
- [ ] Admin Panel UI - Build frontend for AdminMonitoringDashboard, AdminSecurityPolicies, AdminMeetingAnalytics

### P2 (Medium Priority)
- [ ] PWA chunk loading fix for deployments
- [ ] GIPHY integration (client-side)
- [ ] Refactor server.py into modular routes
- [ ] Cloud storage migration for recordings

