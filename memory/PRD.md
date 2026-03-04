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

### Virtual Backgrounds & Background Blur (Feb 28, 2026)
- [x] **TensorFlow.js BodyPix Integration**:
  - MobileNetV1 architecture for real-time performance
  - WebGL backend with CPU fallback
  - On-demand model loading (lazy load)
- [x] **Background Blur Effects**:
  - Light blur (5px)
  - Medium blur (10px)
  - Heavy blur (20px)
  - Pixel-level person/background compositing
- [x] **Virtual Backgrounds**:
  - 8 preset backgrounds: Office, Nature, Beach, Space, Purple Gradient, Blue Gradient, Dark Gray, Navy
  - Custom image upload support (FileReader API)
  - Background thumbnails with selection indicator
- [x] **VirtualBackgroundSelector Modal**:
  - Two tabs: Blur and Backgrounds
  - "No Effect" option to disable
  - AI model loading status indicator
  - FPS counter during processing
  - Performance warning note
  - Disabled when video is off
- [x] **Processing Pipeline**:
  - Canvas-based frame processing
  - Output stream via captureStream(30) at 30fps
  - Audio tracks preserved from original stream
- [x] **Frontend Components**:
  - `/app/src/hooks/useVirtualBackground.js` - TensorFlow.js BodyPix hook
  - `/app/src/components/meetings/VirtualBackgroundSelector.jsx` - UI modal
- [x] **Meeting Integration**:
  - Effects button (Sparkles icon) in meeting controls
  - Purple highlight when effect is active
  - Green pulse indicator when processing
  - displayStream switches between raw and processed video

## Prioritized Backlog

### Backend Refactoring (Feb 28, 2026) - COMPLETE ✅
- [x] **server.py reduced from 5420 → 165 lines** (97% reduction)
- [x] **All 14 route groups migrated to modular files** (3104 total lines):
  - `/app/backend/routes/auth.py` - Authentication (5 routes)
  - `/app/backend/routes/users.py` - User management (6 routes)
  - `/app/backend/routes/chat.py` - Chat & SSE (10 routes)
  - `/app/backend/routes/calls.py` - 1-on-1 calls (7 routes)
  - `/app/backend/routes/group_calls.py` - Group calls (6 routes)
  - `/app/backend/routes/recordings.py` - Recordings (12 routes)
  - `/app/backend/routes/workspaces.py` - Workspaces (8 routes)
  - `/app/backend/routes/calendar.py` - Calendar (6 routes)
  - `/app/backend/routes/payments.py` - Payments (6 routes)
  - `/app/backend/routes/ai.py` - AI/TTS (5 routes)
  - `/app/backend/routes/meeting_room.py` - Meeting room (5 routes)
  - `/app/backend/routes/admin.py` - Admin (18 routes)
- [x] **All 12 endpoint categories tested and passing**
- [x] **Frontend verified working after refactor**
- [x] Original backup preserved at `/app/backend/server.py.backup`

### Recording Feature (Feb 28, 2026)
- [x] **Record Meeting Button**: Added to meeting controls
  - Red circle icon to start recording
  - Square icon to stop recording (while recording)
  - Download icon while saving
  - Pulsing animation during active recording
- [x] **Recording Indicator**: Shows "REC" badge in header with duration when recording is active
- [x] **Auto-download**: When recording stops, file automatically downloads to user's device
- [x] **Cloud Save**: Recording is also saved to File Manager (backend GridFS)
- [x] **7-day Auto-delete**: Backend automatically deletes recordings after 7 days
- [x] **Multi-stream Recording**: Captures both local audio/video and remote participant audio
- [x] **Files Modified**:
  - `/app/src/pages/GroupMeetingRoomPage.jsx` - Added recording state, functions, and UI

### Camera Bug Fix - Multiple Iterations (Feb 28, 2026)
- [x] **Root Cause Analysis (Final)**: When track.enabled changes on a MediaStream, the stream reference doesn't change, so React's shallow comparison doesn't detect the update
- [x] **Fix Applied (Iteration 2 - Radical Simplification)**:
  - **streamKey Mechanism**: Counter that increments on any video toggle to force React re-evaluation
    - Line 267: streamKey state initialized to 0
    - Lines 691, 743: toggleVideo increments streamKey when toggling tracks
    - Line 389: displayStream memo includes streamKey in dependencies
  - **updateLocalStream Helper**: Custom setter updates both localStream AND streamKey
  - **joinMeeting Track Sync**: Syncs track.enabled state with isVideoEnabled/isAudioEnabled at join time
    - Handles case: user toggles video OFF in preview, then joins meeting
  - **ParticipantTile Simplification**: 
    - Removed complex state management (videoVisible state)
    - Directly attaches stream to video element
    - useEffect deps include video_enabled for proper re-render
    - hasVideoTrack checks: track.enabled && track.readyState === 'live'
  - **VideoGrid Key**: Uses key={`video-grid-${streamKey}`} for forced re-mount
- [x] **Edge Cases Handled**:
  - User toggles video OFF before joining → track.enabled synced at join time
  - User toggles camera ON/OFF multiple times → streamKey increments each time
  - Virtual background enabled/disabled → displayStream properly switches
- [x] **Created New Hook**: `/app/src/hooks/useCamera.js` - Dedicated camera management hook (available for future use)
- [x] **Files Modified**:
  - `/app/src/pages/GroupMeetingRoomPage.jsx` - ParticipantTile, toggleVideo, joinMeeting, displayStream
- [x] **Testing**: Code review verified all critical paths covered. UI testing confirms pre-join screen functional.

### Admin Panel UI Verification (Feb 28, 2026)
- [x] **AdminMonitoringDashboard** - Already fully implemented with:
  - Real-time stats: Online Users, Active Meetings, Logins Today, Failed Logins
  - System Health: Database status, Collections count
  - User Statistics: Total, Active, Disabled users
  - Today's Activity: Meetings Created, User Logins, Failed Attempts
- [x] **AdminSecurityPolicies** - Already fully implemented with:
  - Password Requirements: Min length, uppercase, numbers, special chars toggles
  - Session Settings: Session timeout
  - Account Lockout: Max failed attempts
  - Meeting Settings: Enable Instant Meetings
  - Save Changes functionality via PUT API
- [x] **AdminMeetingAnalytics** - Already fully implemented with:
  - Total Meetings, Active Users, Avg per Day
  - Top Meeting Creators list
  - Peak Meeting Hours chart
  - Daily Meeting Trend
  - Date range selector (7, 14, 30, 90 days)

## Prioritized Backlog

### P0 (Critical)
- [x] ~~Fix recurring camera bug (camera fails to start in meeting rooms)~~ - **FIXED (Iteration 2 - Feb 28)**
  - Root cause: MediaStream reference doesn't change when track.enabled changes
  - Solution: streamKey counter forces React re-evaluation

### P1 (High Priority)
- [x] ~~Admin Panel UI~~ - **ALREADY COMPLETE** (was marked as placeholder but fully functional)

### P2 (Medium Priority)
- [x] ~~PWA chunk loading fix for deployments~~ - **FIXED**
- [ ] GIPHY integration (client-side)
- [ ] Refactor server.py into modular routes
- [ ] Cloud storage migration for recordings

### Mobile & SEO Optimization (Mar 1, 2026)
- [x] **Enhanced Mobile Meta Tags**:
  - Added `viewport-fit=cover` for modern mobile browsers
  - Added `mobile-web-app-capable` and `HandheldFriendly` meta tags
  - Added `format-detection` to disable telephone number detection
- [x] **Comprehensive SEO Meta Tags**:
  - Added optimized title and description with keywords
  - Added `robots` and `googlebot` meta tags for indexing
  - Added author and application name meta tags
- [x] **Open Graph (Facebook) Tags**:
  - `og:type`, `og:url`, `og:title`, `og:description`
  - `og:image` with dimensions and alt text
  - `og:site_name` and `og:locale`
- [x] **Twitter Card Tags**:
  - Summary large image card format
  - Twitter-specific title, description, and image
  - `twitter:site` and `twitter:creator` tags
- [x] **JSON-LD Structured Data**:
  - SoftwareApplication schema with features, ratings, and offers
  - Organization schema with logo and social links
  - WebSite schema with search action
- [x] **Performance Optimizations**:
  - Added `preconnect` and `dns-prefetch` for Google Fonts
  - Added canonical URL for SEO
- [x] **robots.txt Updated**:
  - Proper allow/disallow rules for public and private pages
  - Sitemap reference for search engines
- [x] **browserconfig.xml Created**:
  - Microsoft browser tile configuration
- [x] **Files Modified**:
  - `/app/index.html` - Full SEO and mobile optimization
  - `/app/public/robots.txt` - Enhanced crawler rules
  - `/app/public/browserconfig.xml` - New file for Microsoft browsers

### PWA Chunk Loading Fix (Feb 28, 2026)
- [x] **Problem**: When new code is deployed, browser cache has old `index.html` referencing old JavaScript chunk filenames that no longer exist
- [x] **ErrorBoundary Enhancement**:
  - Added `isChunkLoadError()` helper to detect chunk loading failures
  - Auto-reload on chunk errors with 30-second cooldown to prevent infinite loops
  - Clear caches before reload using Cache API
  - Special "Update Available" UI for chunk errors vs generic error UI
- [x] **Global Unhandled Rejection Handler**:
  - Added to App.jsx to catch lazy import promise rejections
  - Auto-reload with cache clear on chunk failures
- [x] **lazyWithRetry Utility**:
  - Created `/app/src/utils/lazyWithRetry.js`
  - Automatic retry (3 attempts) for chunk loading
  - Cache clear on final retry failure
- [x] **Legacy Route Support**:
  - Added `/transcription/history` as alias for `/transcriptions`
  - Ensures backward compatibility for bookmarked URLs

### Meeting Room Enhancements (Mar 1, 2026)
- [x] **Recording Feature** - Record meetings for later viewing
  - `startRecording()` - Uses MediaRecorder API with canvas compositing
  - `stopRecording()` - Stops recording and triggers auto-download
  - `toggleRecording()` - Toggle between recording states
  - Recording indicator in header with "REC" badge and duration
  - Auto-downloads WebM file when stopped
  - Supports vp9/opus or vp8/opus codecs with fallback
- [x] **Cloud Save for Recordings** - Save recordings to File Manager
  - Recording options modal after stopping
  - "Download to Device" - Save locally to downloads folder
  - "Save to Cloud + Transcribe" - Upload with auto-transcription
  - "Download & Save + Transcribe" - Both options combined
  - "Discard Recording" - Delete without saving
  - Loading state with spinner during cloud upload
  - Toast notifications for success/failure
- [x] **Auto-Transcription for Recordings** - Whisper-powered transcription
  - `POST /api/ai/transcribe/recording` - Transcribe stored recording from GridFS
  - `GET /api/ai/transcribe/recording/{file_id}` - Get transcript for a recording
  - `GET /api/ai/transcripts/user/{user_id}` - Get all user transcripts
  - `DELETE /api/ai/transcripts/{transcript_id}` - Delete a transcript
  - Transcripts stored in `recording_transcripts` collection
  - Files marked with `has_transcript: true` when transcribed
- [x] **Large File Support (>25MB)** - FFmpeg audio extraction
  - Automatically extracts audio from video files >25MB
  - Compresses to 64kbps mono MP3 at 16kHz for optimal speech transcription
  - Handles up to ~2 hour recordings after compression
- [x] **Transcript Viewer UI** - View transcripts in File Manager
  - Search across transcript text with highlighted matches
  - Clickable timestamps with Play icon
  - Copy full transcript to clipboard
  - Download transcript as .txt file
  - Expandable/collapsible segments view
  - Word count and language detection
  - Files with transcripts show "Transcript" badge in file list
- [x] **Files Modified**:
  - `/app/src/pages/InstantMeetingRoom.jsx` - Added recording, cloud save, transcription
  - `/app/backend/routes/ai.py` - Added recording transcription endpoints with ffmpeg support
  - `/app/src/components/RecordingTranscriptViewer.jsx` - NEW: Transcript viewer modal
  - `/app/src/components/FileList.jsx` - Added transcript badge and view button
  - `/app/src/pages/FileManagementPage.jsx` - Integrated transcript viewer

### Pricing Layout Fix (Mar 1, 2026)
- [x] **4-Tier Pricing on Landing Page** - Verified correct horizontal display
  - Free ($0), Pro ($19), Business ($39), Enterprise ($79)
  - Grid layout: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
  - "Most Popular" badge on Business plan
  - All features listed for each tier
- [x] **Files Modified**:
  - `/app/src/components/landing/PricingSection.jsx` - Layout confirmed working
  - `/app/src/pages/PricingPage.jsx` - Fixed duplicate code causing syntax error

### Text-to-Video Admin API Key Management (Mar 2, 2026)
- [x] **Removed user-facing API key option** - Users no longer need to provide their own key
- [x] **Admin Video Settings Page** - New admin page at `/admin/video-settings`
  - Configure OpenAI API key for all users
  - Status indicator (Configured/Not Configured)
  - Masked key preview after saving
  - Test connection functionality
  - Remove key option
  - Instructions for obtaining API key
  - Service status sidebar
- [x] **Backend API Endpoints**:
  - `GET /api/admin/settings/video-api` - Get video API settings (masked)
  - `POST /api/admin/settings/video-api` - Save video API key
  - `DELETE /api/admin/settings/video-api` - Remove video API key
  - `POST /api/admin/settings/video-api/test` - Test API key
- [x] **API key priority**: Admin-configured key > Environment variables (EMERGENT_LLM_KEY/OPENAI_API_KEY)
- [x] **Files Modified**:
  - `/app/src/pages/TextToVideoPage.jsx` - Removed user API key input
  - `/app/backend/routes/ai.py` - Updated to use admin-configured key
  - `/app/backend/routes/admin.py` - Added video API settings endpoints
  - `/app/src/pages/admin/AdminVideoSettingsPage.jsx` - NEW: Admin UI for video settings
  - `/app/src/components/AdminSidebar.jsx` - Added "Video Settings" link
  - `/app/src/App.jsx` - Added route for video settings page

### 4-Tier Subscription & Stripe Integration (Mar 2, 2026)
- [x] **4-Tier Pricing Structure** - Complete pricing system
  - Free ($0/month) - 5 meetings, 30 min transcription, 1GB storage
  - Pro ($19/month) - 50 meetings, 300 min transcription, 5GB storage
  - Business ($39/month) - 150 meetings, 1000 min transcription, 25GB storage
  - Enterprise ($79/month) - Unlimited meetings & transcription, 100GB storage
- [x] **Backend Plans API**:
  - `GET /api/payments/plans` - Returns all 4 plans with features and limits
  - `GET /api/payments/user/{user_id}/subscription` - Returns user subscription and usage
  - `POST /api/payments/checkout` - Creates Stripe checkout session (subscription mode)
  - `GET /api/payments/status/{session_id}` - Gets payment status and activates subscription
  - `POST /api/webhook/stripe` - Handles Stripe webhook events for automatic activation
- [x] **Stripe Integration Complete**:
  - Live API key configured
  - Price IDs for Pro, Business, Enterprise configured
  - Subscription mode checkout (not one-time payment)
  - Webhook handler for automatic subscription activation
  - Support for checkout.session.completed, subscription.updated, invoice events
- [x] **Admin Stripe Settings Page** - `/admin/stripe-settings`
  - Stripe API Key configuration
  - Price IDs for Pro, Business, Enterprise plans
  - Payment status sidebar showing configuration state
  - Transactions tab for viewing payment history
  - Step-by-step setup instructions
- [x] **User Plans Page** - `/user/plans`
  - Overview tab: Current plan, usage metrics, features included
  - Plans tab: All 4 tiers with Monthly/Annual toggle (Save 17%)
  - Usage tab: Meetings, transcription, storage, workspaces tracking
  - "Most Popular" badge on Pro plan
  - "Current" badge on user's active plan
- [x] **Public Pricing Page** - `/pricing`
  - 4-column grid layout for all tiers
  - Feature comparison table
  - FAQ section
  - CTA for free trial
- [x] **Payment Success Page** - `/payment/success`
  - Polls payment status until confirmed
  - Shows success animation and amount paid
  - Redirects to dashboard
- [x] **Files Modified**:
  - `/app/backend/routes/payments.py` - Direct Stripe SDK, subscription mode, webhook handler
  - `/app/src/config/subscriptionPlans.js` - Updated to 4-tier structure
  - `/app/src/pages/user/UserPlansPage.jsx` - 4-column grid, Monthly/Annual toggle
  - `/app/src/pages/PricingPage.jsx` - Public pricing page with all 4 tiers
  - `/app/src/components/billing/PlanComparisonTable.jsx` - Updated for 4 plans
  - `/app/src/pages/admin/AdminStripeSettingsPage.jsx` - Admin Stripe config UI
  - `/app/src/pages/PaymentSuccessPage.jsx` - Payment confirmation page
- [x] **Stripe Configuration**:
  - Pro Price ID: `price_1T6aPeFPnWw02b49P8QHsNMv`
  - Business Price ID: `price_1T6aSHFPnWw02b49IiRVQMyw`
  - Enterprise Price ID: `price_1T6aUKFPnWw02b49vnpWbMfa`
- [x] **Test Results**: All 3 paid plans create checkout sessions successfully

## Prioritized Backlog

### Scheduled Exports & Admin Broadcasts (Mar 4, 2026)
- [x] **Scheduled Message Exports** (`/app/backend/routes/admin.py`):
  - `GET /api/admin/scheduled-exports` - List all scheduled exports
  - `POST /api/admin/scheduled-exports` - Create new schedule
  - `PUT /api/admin/scheduled-exports/{id}` - Update schedule
  - `DELETE /api/admin/scheduled-exports/{id}` - Delete schedule
  - `POST /api/admin/scheduled-exports/{id}/run` - Run export now
  - Supports: daily/weekly/monthly frequency, CSV/JSON format, email delivery
- [x] **Admin Broadcast Messages**:
  - `GET /api/admin/broadcasts` - List all broadcasts
  - `POST /api/admin/broadcasts` - Send broadcast to all users
  - `GET /api/admin/broadcasts/{id}` - Get broadcast with delivery stats
  - `DELETE /api/admin/broadcasts/{id}` - Delete broadcast and messages
  - Creates individual messages for each user + optional email notification
- [x] **Admin UI** (`/app/src/pages/admin/AdminBroadcastsPage.jsx`):
  - Two-tab interface: Broadcasts / Scheduled Exports
  - New Broadcast modal with subject, content, email toggle
  - Scheduled Export modal with frequency, format, recipients configuration
  - Run Now button for manual export triggers

### Admin Internal Messages Monitoring (Mar 4, 2026)
- [x] **Backend API** (`/app/backend/routes/admin.py`):
  - `GET /api/admin/internal-messages` - Get all internal messages with filtering
  - `GET /api/admin/internal-messages/{message_id}` - Get message detail with thread
  - `POST /api/admin/internal-messages/{message_id}/reply` - Admin reply to message
  - `DELETE /api/admin/internal-messages/{message_id}` - Admin delete
  - `GET /api/admin/internal-messages/export/csv` - Export messages as CSV
  - `GET /api/admin/internal-messages/export/json` - Export messages as JSON
- [x] **Admin Messages Page** - Real MongoDB data, Export button, Reply functionality
- [x] **Admin Reply Feature** - Admin can reply to any user message
- [x] **Compliance Export** - CSV and JSON export with date filtering

### Legacy Code Cleanup (Mar 4, 2026)
- [x] **Removed GroupMeetingRoomPage.jsx** (~72KB) - Legacy meeting room component
- [x] **Removed useGroupWebRTC.js** (~15KB) - Hook only used by legacy component
- [x] **Cleaned up App.jsx** - Removed unused import
- [x] **Total**: ~87KB of dead code removed
- [x] **Verified**: Meetings functionality still works with InstantMeetingRoom.jsx

### Internal Messaging System (Mar 4, 2026)
- [x] **Backend API Endpoints** (`/app/backend/routes/messages.py`):
  - `GET /api/messages/inbox/{user_id}` - Get user's inbox messages
  - `GET /api/messages/sent/{user_id}` - Get sent messages
  - `GET /api/messages/drafts/{user_id}` - Get draft messages
  - `GET /api/messages/junk/{user_id}` - Get junk/spam messages
  - `GET /api/messages/trash/{user_id}` - Get trashed messages
  - `GET /api/messages/thread/{message_id}` - Get message thread
  - `POST /api/messages/send/{sender_id}` - Send new message (with email notification)
  - `POST /api/messages/draft/{sender_id}` - Save/update draft
  - `POST /api/messages/draft/{draft_id}/send/{sender_id}` - Send draft
  - `POST /api/messages/reply/{message_id}/{sender_id}` - Reply to message
  - `PUT /api/messages/read/{message_id}` - Mark as read
  - `PUT /api/messages/star/{message_id}` - Toggle star
  - `PUT /api/messages/junk/{message_id}` - Toggle junk status
  - `PUT /api/messages/trash/{message_id}` - Move to trash
  - `PUT /api/messages/restore/{message_id}` - Restore from trash
  - `DELETE /api/messages/{message_id}/{user_id}` - Permanently delete
  - `DELETE /api/messages/trash/empty/{user_id}` - Empty trash
  - `GET /api/messages/users/search` - Search users to message
  - `GET /api/messages/counts/{user_id}` - Get all folder counts
- [x] **Frontend UI** (`/app/src/pages/MessagesPage.jsx`):
  - 5 folder tabs: Inbox, Sent, Drafts, Junk, Trash
  - Compose modal with user search and "Save Draft" button
  - Message thread view with replies
  - Star, mark as junk, move to trash actions
  - Restore from trash, empty trash functionality
  - Email notifications via Resend for new messages
  - Unread count badges on folders

### SEO Fixes (Mar 3, 2026)
- [x] **Meta Description Optimization**:
  - Reduced from 247 characters to 133 characters (optimal range: 120-160)
  - New description: "Munal AI transforms meetings with real-time transcription, automatic summaries, action items, and team collaboration. Try free today."
- [x] **H1 Tag Verification**:
  - Verified H1 tags present on all key pages (Homepage, Pricing, About, Terms, Privacy, Downloads)
  - PageHero component includes H1 by default
- [x] **Image Alt Attributes**:
  - Verified all images in codebase have proper alt attributes
  - Dynamic alt attributes use meaningful fallbacks

### P0 (Critical)
- [x] ~~SEO Issues from Bing~~ - **FIXED (Mar 3)**
- [ ] End-to-end Cloud Storage Migration test (carried over)

### Shift Management Feature (Mar 4, 2026) - COMPLETE ✅
- [x] **Backend API** (`/app/backend/routes/shifts.py`):
  - `POST /api/shifts/create` - Create new shift with auto-notification
  - `GET /api/shifts/workspace/{workspace_id}` - Get all shifts with filters
  - `GET /api/shifts/{shift_id}` - Get single shift
  - `PUT /api/shifts/{shift_id}` - Update shift
  - `DELETE /api/shifts/{shift_id}` - Delete shift (with optional recurring delete)
  - `POST /api/shifts/{shift_id}/duplicate` - Duplicate shift to new date
  - `GET /api/shifts/summary/{workspace_id}` - Dashboard summary data
  - `GET /api/shifts/hours/{workspace_id}/{user_id}` - User hours for period
  - `POST /api/shifts/swap-request` - Create swap request
  - `GET /api/shifts/swap-requests/{workspace_id}` - List swap requests
  - `PUT /api/shifts/swap-request/{id}/approve` - Approve swap
  - `PUT /api/shifts/swap-request/{id}/reject` - Reject swap
  - `POST /api/shifts/time-off` - Create time-off request
  - `GET /api/shifts/time-off/{workspace_id}` - List time-off requests
  - `PUT /api/shifts/time-off/{id}/approve|reject` - Handle time-off
  - `GET /api/shifts/export/{workspace_id}` - Export CSV/JSON
  - `GET /api/shifts/roles/{workspace_id}` - List unique roles
  - `GET /api/shifts/departments/{workspace_id}` - List unique departments
  - `GET/POST/PUT/DELETE /api/shifts/presets` - Custom shift presets management
- [x] **Frontend Service** (`/app/src/services/shiftService.js`):
  - Full API client for all shift operations
  - VITE_API_URL/REACT_APP_BACKEND_URL support
- [x] **Shift Management Page** (`/app/src/pages/ShiftManagementPage.jsx`):
  - Calendar view (monthly) with day cells showing shifts
  - List view alternative with shift cards
  - **Drag-and-drop scheduling**: Drag shifts to move, Alt+Drag to duplicate
  - Summary cards: Today's Shifts, Week Total Hours, Active Team, Pending Requests
  - Create Shift dialog with: Date, Time, Assign To, Role, Department, Color, Notes
  - **Preset shift types**: Morning, Afternoon, Evening (customizable)
  - **Custom presets management**: Admins can create/delete custom presets
  - Recurring shift support (daily/weekly patterns)
  - Edit and Delete shift functionality
  - Requests tab for swap/time-off approvals
  - Export button (CSV/JSON)
  - Color picker with 8 color options
- [x] **Workspace Integration**:
  - "Shifts" button added to WorkspaceDetailPage header
  - "Shift Management" card in workspace overview
  - Route: `/workspace/:workspaceId/shifts`
- [x] **Role-Based Structure** (Shift Admin, Shift Manager, Shift Member)
- [x] **Notifications** (In-app + Email ready)
- [x] **Testing**: 18/18 backend tests passed, 100% frontend UI verified

### User Subscription Entitlements (Mar 4, 2026) - COMPLETE ✅
- [x] **Backend Entitlements Service** (`/app/backend/routes/entitlements.py`):
  - Plan limits configuration (Free, Pro, Business, Enterprise)
  - Usage tracking in MongoDB `usage_records` collection
  - Entitlement checking with percentage-based warnings
  - API Endpoints:
    - `GET /api/entitlements/check/{feature}` - Check if user can use feature
    - `GET /api/entitlements/usage/{user_id}` - Get all usage data
    - `POST /api/entitlements/record` - Record feature usage
    - `GET /api/entitlements/limits/{plan_id}` - Get plan limits
    - `GET /api/entitlements/summary/{user_id}` - Quick usage summary for UI
- [x] **Frontend Service** (`/app/src/services/entitlementsService.js`):
  - `checkEntitlement()`, `recordUsage()`, `getUsageSummary()`
  - Helper functions for formatting and status colors
- [x] **Usage Dashboard Component** (`/app/src/components/UsageDashboard.jsx`):
  - Visual display of usage across all features
  - Progress bars with color-coded status (green/amber/red)
  - "Approaching Limits" warning badge
  - Upgrade button linking to pricing page
  - Compact mode for sidebar integration
- [x] **useEntitlements Hook** (`/app/src/hooks/useEntitlements.js`):
  - Easy-to-use hook for checking/recording usage
  - Convenience methods: `canStartMeeting()`, `canSendAIMessage()`, etc.
- [x] **Enforcement Integration**:
  - AI Chat (`/api/ai/chat`) - Checks and records usage
  - Workspace creation (`/api/workspaces`) - Checks workspace limit
- [x] **Dashboard Integration**: Usage panel added to UserDashboard
- [x] **Plan Limits**:
  - **Free**: 5 meetings, 30 min transcription, 1GB storage, 50 AI messages, 1 workspace
  - **Pro**: 50 meetings, 300 min transcription, 5GB storage, 500 AI messages, 3 workspaces
  - **Business**: 150 meetings, 1000 min transcription, 25GB storage, 2000 AI messages, 10 workspaces
  - **Enterprise**: Unlimited (most features)

### P1 (High)
- [ ] User subscription entitlements enforcement (limit meetings, transcription based on plan)
- [ ] Stripe webhook handling for payment events
- [ ] User plan upgrade/downgrade flow testing
- [ ] End-to-end Cloud Storage Migration test (carried over from P0)

### P2 (Medium)
- [ ] Payment history view for users
- [ ] Invoice generation and download
- [ ] SendGrid email integration for shift notifications (requires SENDGRID_API_KEY)
- [ ] Google/Outlook Calendar sync for shifts

### Shift Management P1 Features Verification (Mar 4, 2026) - COMPLETE ✅

### Mobile-Friendly Notification Optimization (Mar 4, 2026) - COMPLETE ✅
- [x] **NotificationPanel.jsx** - Full-screen on mobile, dropdown on desktop
  - Added backdrop blur and full-screen view for mobile devices
  - Sticky header with close button (X) and action buttons
  - Larger touch targets (h-10 w-10 buttons vs h-8 w-8)
  - Scrollable notification list with overscroll containment
  - Settings button integrated in header and footer
  - Safe area insets support for devices with notches
- [x] **NotificationItem.jsx** - Touch-friendly notification items
  - Larger icons (w-5 h-5 vs w-4 h-4)
  - Larger action buttons (h-9 w-9)
  - Action buttons always visible on mobile (hover-only on desktop)
  - Added chevron indicator for actionable notifications
  - Touch feedback with active states
- [x] **NotificationSettings.jsx** - Mobile-optimized form
  - Extracted ToggleItem as standalone component (fixes React lint warnings)
  - Large touch-friendly toggle rows with full-row clickable area
  - Added Email and SMS notification toggles
  - Colored icons for each notification type (blue, green, orange, purple)
  - Better spacing and visual hierarchy
  - Fixed synchronous setState warning in useEffect
- [x] **UserNavigation.jsx** - Integrated NotificationBell component
  - Replaced inline Bell icon with NotificationBell component
  - Now shows proper notification panel with unread count
- [x] **notifications.css** - Mobile-specific styles
  - Safe area inset support (.safe-area-top, .safe-area-bottom)
  - Mobile touch feedback animations
  - Smooth scrolling with -webkit-overflow-scrolling
  - Bell pulse animation for unread notifications
- [x] **Clock-in/out UI**:
  - Clock In button (green) appears for users assigned to shifts on today's date
  - Clock Out button (red) appears after clocking in with "Active" badge
  - Backend API: POST /api/shifts/clock (action='in'/'out')
  - Double clock-in prevention and unauthorized clock-in prevention working
- [x] **Admin UI for Custom Shift Presets**:
  - "Presets" button in Shift Management header opens dialog
  - "Manage Shift Presets" dialog shows existing presets with delete button
  - "Create New Preset" form with Name, Icon picker (12 emojis), Start/End Time, Color picker (8 colors)
  - Backend API: GET/POST/PUT/DELETE /api/shifts/presets
- [x] **Drag-and-Drop Scheduling**:
  - Shift cards have draggable='true' HTML5 attribute
  - GripVertical icon indicates draggability
  - Drag to move shift to new date, Alt+drag to duplicate
- [x] **Presets in Create Shift Dialog**:
  - "Quick Select Shift Type" section shows custom presets
  - Clicking preset auto-fills Start Time and End Time
- [x] **Timesheet Tab**:
  - Shows Time Tracking with period dates
  - User entries with hours worked
- [x] **Testing**: Backend 100% (31/31), Frontend 100% (All 14 features verified)

### Message Settings Feature (Mar 4, 2026) - COMPLETE ✅
- [x] **Frontend UI** (`/app/src/pages/MessageSettingsPage.jsx`):
  - 7-tab settings interface with sidebar navigation
  - **Account Tab**: Email Notifications toggle, Notification Sound toggle, Auto-Reply with message field
  - **Signature Tab**: Signature textarea with live preview
  - **Email Alias Tab**: Display name/alias input
  - **Filters Tab**: Create/Edit/Delete message filters with conditions (field, operator, value) and actions (move to folder, mark read, star, delete)
  - **AI Personalization Tab**: AI toggle, Writing Tone dropdown (Professional/Casual/Friendly/Formal), Auto-Categorize toggle, Smart Replies toggle
  - **Contacts Tab**: Add/Edit/Delete contacts with name, email, nickname, notes, group
  - **Assistant Tab**: AI Assistant toggle, Auto-Draft Replies, Summarize Threads, Suggest Actions, Writing Style dropdown
- [x] **Backend API** (`/app/backend/routes/messages.py`):
  - `GET /api/messages/settings/{user_id}` - Get message settings (with defaults)
  - `PUT /api/messages/settings/{user_id}` - Update message settings
  - `GET/POST/PUT/DELETE /api/messages/filters/{user_id}` - Full CRUD for filters
  - `GET/POST/PUT/DELETE /api/messages/contacts/{user_id}` - Full CRUD for contacts
  - `GET/PUT /api/messages/assistant/{user_id}` - Assistant settings
- [x] **Navigation**: Settings button added to Messages page sidebar
- [x] **Route**: `/messages/settings` added to App.jsx
- [x] **MongoDB Collections**: message_settings, message_filters, message_contacts, message_assistant_settings
- [x] **Testing**: Backend 88% (15/17), Frontend 100% - all tabs verified working

### Future
- [ ] Annual billing discount implementation
- [ ] Team billing for workspaces
- [ ] Usage alerts when approaching limits

### Billing & Subscription Features (Mar 4, 2026) - COMPLETE ✅
- [x] **Annual Billing Discount Banner** (`/app/src/pages/user/UserPlansPage.jsx`):
  - Green gradient banner "Save 17% with annual billing"
  - "Switch to Annual" button when monthly is selected
  - Per-plan annual savings displayed (e.g., "Save $XX/year")
  - Enhanced billing toggle with animated "Save 17%" badge
- [x] **Team Billing for Workspaces** (`/app/backend/routes/team_billing.py`):
  - Three team plans: Team Starter ($8/seat), Team Professional ($15/seat), Team Enterprise ($25/seat)
  - Per-seat pricing with annual discount
  - Workspace billing integration via `TeamBillingCard` component
  - Backend API: GET /api/team-billing/plans, POST /api/team-billing/checkout
  - Stripe checkout session creation for team subscriptions
- [x] **Usage Alerts System** (`/app/backend/routes/usage_alerts.py`):
  - Automatic alerts at 80%, 90%, and 100% usage thresholds
  - Creates in-app notifications + database alerts
  - Per-feature tracking (AI chat, meetings, storage, workspaces)
  - Alert preferences API for email/push/SMS notifications
  - UsageAlertsWidget component for dashboard display
- [x] **Shift Reminders** (`/app/backend/routes/shift_reminders.py`):
  - Configurable reminder times (5, 15, 30, 60 min, 1 day before)
  - Multi-channel notifications (push, email, SMS)
  - ShiftReminderSettings component for user preferences
  - Auto-scheduling reminders when shifts are created
  - Backend API: GET/PUT /api/shift-reminders/user/{id}/preferences

### Refactored Shift Management Components
- [x] **ShiftSummaryCards.jsx** - Extracted summary stats cards
- [x] **ShiftListView.jsx** - Extracted list view component with clock-in/out
- [x] **ShiftPresetsDialog.jsx** - Extracted preset management dialog
- [x] **ShiftReminderSettings.jsx** - New reminder preferences component


### Admin Portal Enhancements (Mar 4, 2026) - COMPLETE ✅
- [x] **Admin Workspace Management** (`/admin/workspaces`):
  - View all workspaces with stats (members count, messages, shifts)
  - Stats cards: Total Workspaces, Active, Suspended, New This Month
  - Search and status filter functionality
  - Workspace list with owner, members, messages, shifts, status columns
  - Action dropdown: View Details, Suspend, Archive, Delete
  - Backend API: GET /api/admin/workspaces, GET /api/admin/workspaces/stats
  - Files: `/app/src/pages/admin/AdminWorkspacesPage.jsx`, `/app/backend/routes/admin_workspaces.py`
- [x] **Admin Workspace Detail** (`/admin/workspaces/:id`):
  - Detailed workspace view with owner info and settings
  - Stats cards: Members, Messages (7d), Shifts (Month), Created date
  - Tabs: Overview, Members, Activity Log, Admin Notes
  - Admin Actions: Suspend/Unsuspend, Transfer Ownership, Delete
  - Member management with remove capability
  - Backend API: GET /api/admin/workspaces/{id}, GET /api/admin/workspaces/{id}/members
  - File: `/app/src/pages/admin/AdminWorkspaceDetailPage.jsx`
- [x] **Admin Chat Moderation** (`/admin/chat-moderation`):
  - Monitor and moderate workspace conversations
  - Stats cards: Total Messages, Flagged, Today, Active Workspaces
  - Tabs: All Messages, Flagged, Analytics
  - Message actions: Flag/Unflag, Delete, View Details
  - Top Workspaces and Top Users analytics
  - Backend API: GET /api/admin/chat-moderation/stats, messages, flagged, analytics
  - Files: `/app/src/pages/admin/AdminChatModerationPage.jsx`, `/app/backend/routes/admin_chat_moderation.py`
- [x] **Admin Shifts Management** (`/admin/shifts`):
  - Cross-workspace shift oversight and analytics
  - Primary stats: Total Shifts, Today's Shifts, Active Now, Hours This Month
  - Secondary stats: Unassigned, Cancelled, This Week, Total Clock-ins
  - Tabs: Today's Overview, All Shifts, Timesheets, Analytics
  - Export functionality (CSV/JSON with date filters)
  - Shift actions: Cancel, Delete with reason
  - Analytics: Top Workspaces by Hours, Top Workers, Status Distribution
  - Backend API: GET /api/admin/shifts/stats, today, timesheets, analytics, export
  - Files: `/app/src/pages/admin/AdminShiftsPage.jsx`, `/app/backend/routes/admin_shifts.py`
- [x] **Admin Sidebar Navigation Updated**:
  - Added Workspaces, Chat Moderation, Shifts links under Management section
  - File: `/app/src/components/AdminSidebar.jsx`
- [x] **Testing**: Backend 100% (19/19 tests), Frontend 100% verified

### Real-Time Audit Log (Mar 4, 2026) - COMPLETE ✅
- [x] **Centralized Audit Logging**:
  - All admin actions (workspace, chat, shift) now log to central `audit_logs` collection
  - Updated `admin_workspaces.py`, `admin_chat_moderation.py`, `admin_shifts.py` with dual logging
  - New categories: workspace, chat_moderation, shift_management
- [x] **Real-Time UI Updates** (`/admin/audit-logs`):
  - Auto-refresh with configurable intervals (3s, 5s, 10s, 30s, 1min)
  - Live indicator with green pulsing dot
  - Pause/Resume toggle for auto-refresh
  - "New activity" badge with count notification
  - Last updated timestamp display
- [x] **Enhanced Action Types**:
  - Workspace: suspend, unsuspend, delete, archive, transfer_ownership, member_removed
  - Chat: flag, unflag, delete, bulk_action
  - Shift: cancel, delete, reassign
- [x] **New Filter Options**:
  - Action filter: workspace_suspend, chat_flag, shift_cancel, etc.
  - Category filter: workspace, chat_moderation, shift_management
- [x] **Files Modified**:
  - `/app/src/pages/admin/AdminAuditLogsPage.jsx` - Real-time polling UI

### Role-Based Privileges System (Mar 4, 2026) - COMPLETE ✅
- [x] **Backend: Permissions Model**:
  - Added `UserPermissions` model with 9 categories (dashboard, users, workspaces, chat_moderation, shifts, billing, settings, support, messages)
  - Added `DEFAULT_PERMISSIONS` dict with preset permissions for Admin, Manager, User roles
  - Updated `UserCreate` model to include optional `permissions` field
  - Updated user creation endpoint to store permissions in database
  - Added `/api/users/permissions/defaults` and `/api/users/permissions/{role}` endpoints
  - Files: `/app/backend/models.py`, `/app/backend/routes/users.py`
- [x] **Frontend: Add User Modal**:
  - Shows "Admin Privileges" section when Admin or Manager role is selected
  - Collapsible permission categories with individual toggle switches
  - "Select All" / "Deselect All" buttons for bulk toggling
  - Per-category "All" / "None" quick toggle buttons
  - Badge showing enabled/total count (e.g., "2/2", "4/4")
  - File: `/app/src/components/admin/modals/AddUserModal.jsx`
- [x] **Frontend: Edit User Modal**:
  - Same permissions UI as Add User modal
  - Pre-populates with existing user permissions
  - Updates permissions when role changes
  - File: `/app/src/components/EditUserModal.jsx`
- [x] **Permission Categories**:
  - Dashboard: View, View Analytics
  - User Management: View, Create, Edit, Delete
  - Workspace Management: View, Manage, Suspend, Delete
  - Chat Moderation: View, Flag, Delete, Export
  - Shift Management: View, Manage, Override, Export
  - Billing: View, Manage, Refunds
  - Settings: View, Modify, Security
  - Support: View, Respond
  - Messages: View, Send, Broadcast
- [x] **Dependencies Added**: @radix-ui/react-collapsible, /app/src/components/ui/collapsible.jsx

  - `/app/backend/routes/admin_workspaces.py` - Dual logging
  - `/app/backend/routes/admin_chat_moderation.py` - Dual logging
  - `/app/backend/routes/admin_shifts.py` - Dual logging + helper function




