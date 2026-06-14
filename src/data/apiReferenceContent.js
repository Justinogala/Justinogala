/**
 * Munal AI — API Reference Data
 * Comprehensive endpoint documentation
 */

export const API_BASE = 'https://api.munal.ai';

export const API_CATEGORIES = [
  {
    id: 'auth',
    title: 'Authentication',
    icon: 'Shield',
    desc: 'User registration, login, 2FA, and session management',
    endpoints: [
      {
        method: 'POST', path: '/v1/auth/register', title: 'Register a new user',
        desc: 'Create a new user account. A verification email is sent automatically.',
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Full name of the user' },
          { name: 'email', type: 'string', required: true, desc: 'Valid email address' },
          { name: 'password', type: 'string', required: true, desc: 'Minimum 8 characters with complexity requirements' },
        ],
        response: `{ "id": "usr_a1b2c3", "email": "user@example.com", "name": "John Doe", "created_at": "2026-06-14T10:00:00Z" }`,
        auth: false,
      },
      {
        method: 'POST', path: '/v1/auth/login', title: 'Authenticate user',
        desc: 'Authenticate with email and password. Returns a JWT token. If 2FA is enabled, returns a challenge instead.',
        params: [
          { name: 'email', type: 'string', required: true, desc: 'Account email' },
          { name: 'password', type: 'string', required: true, desc: 'Account password' },
        ],
        response: `{ "token": "eyJhbG...", "user": { "id": "usr_a1b2c3", "email": "user@example.com", "role": "user" }, "requires_2fa": false }`,
        auth: false,
      },
      {
        method: 'POST', path: '/v1/auth/verify-2fa', title: 'Verify two-factor authentication',
        desc: 'Submit the 6-digit TOTP or email OTP code to complete 2FA challenge.',
        params: [
          { name: 'user_id', type: 'string', required: true, desc: 'User ID from login response' },
          { name: 'code', type: 'string', required: true, desc: '6-digit verification code' },
          { name: 'method', type: 'string', required: false, desc: '"totp" or "email" (default: "totp")' },
        ],
        response: `{ "token": "eyJhbG...", "user": { "id": "usr_a1b2c3", "role": "admin" } }`,
        auth: false,
      },
      {
        method: 'POST', path: '/v1/auth/forgot-password', title: 'Request password reset',
        desc: 'Send a password reset link to the user\'s email address.',
        params: [{ name: 'email', type: 'string', required: true, desc: 'Account email' }],
        response: `{ "message": "Reset link sent to email" }`,
        auth: false,
      },
      {
        method: 'POST', path: '/v1/auth/change-password', title: 'Change password',
        desc: 'Change the authenticated user\'s password.',
        params: [
          { name: 'current_password', type: 'string', required: true, desc: 'Current password' },
          { name: 'new_password', type: 'string', required: true, desc: 'New password (min 8 chars)' },
        ],
        response: `{ "success": true }`,
        auth: true,
      },
    ]
  },
  {
    id: 'ai-chat',
    title: 'AI Chat',
    icon: 'MessageSquare',
    desc: 'AI-powered conversations with file generation, web search, and image creation',
    endpoints: [
      {
        method: 'GET', path: '/v1/ai-chat/conversations', title: 'List conversations',
        desc: 'Retrieve all AI Chat conversations for the authenticated user, sorted by most recent.',
        params: [],
        response: `[{ "id": "conv_x1y2z3", "title": "Brainstorm session", "pinned": false, "created_at": "2026-06-14T09:00:00Z", "updated_at": "2026-06-14T09:30:00Z" }]`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/ai-chat/conversations', title: 'Create conversation',
        desc: 'Start a new AI Chat conversation.',
        params: [],
        response: `{ "id": "conv_new123", "title": "New Chat", "created_at": "2026-06-14T10:00:00Z" }`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/ai-chat/conversations/{id}/messages', title: 'Send message (streaming)',
        desc: 'Send a message and receive a streaming response via Server-Sent Events (SSE). Supports file attachments, web search toggle, and auto-detects generation requests (images, charts, PDFs).',
        params: [
          { name: 'content', type: 'string', required: true, desc: 'Message text' },
          { name: 'attachments', type: 'array', required: false, desc: 'File attachment IDs for analysis' },
          { name: 'web_search', type: 'boolean', required: false, desc: 'Enable/disable web search (default: true)' },
        ],
        response: `SSE stream:\ndata: {"type": "thinking"}\ndata: {"type": "status", "content": "Searching the web..."}\ndata: {"type": "chunk", "content": "Here are the..."}\ndata: {"type": "done", "message_id": "msg_123", "generated_files": [...], "sources": [...]}`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/ai-chat/files/{file_id}', title: 'Download generated file',
        desc: 'Download an AI-generated file (image, PDF, DOCX, XLSX, chart). Requires authentication.',
        params: [],
        response: `Binary file content (image/png, application/pdf, etc.)`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/ai-chat/upload', title: 'Upload file for analysis',
        desc: 'Upload a file (PDF, image, Excel, DOCX) for AI analysis in chat.',
        params: [
          { name: 'file', type: 'file', required: true, desc: 'Multipart file upload' },
          { name: 'conversation_id', type: 'string', required: true, desc: 'Target conversation' },
        ],
        response: `{ "id": "file_abc", "filename": "report.pdf", "content_type": "application/pdf", "size": 245000 }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/ai-chat/conversations/{id}/export', title: 'Export conversation',
        desc: 'Export a conversation to Markdown, PDF, or Word format.',
        params: [{ name: 'format', type: 'string', required: false, desc: '"md", "pdf", or "docx" (default: "md")' }],
        response: `Binary file download`,
        auth: true,
      },
    ]
  },
  {
    id: 'meetings',
    title: 'Meetings & Transcription',
    icon: 'Video',
    desc: 'Meeting management, AI transcription, and insight extraction',
    endpoints: [
      {
        method: 'GET', path: '/v1/meetings', title: 'List meetings',
        desc: 'Retrieve all meetings for the authenticated user with pagination.',
        params: [
          { name: 'page', type: 'integer', required: false, desc: 'Page number (default: 1)' },
          { name: 'limit', type: 'integer', required: false, desc: 'Items per page (default: 20, max: 100)' },
        ],
        response: `{ "meetings": [{ "id": "mtg_123", "title": "Q1 Review", "date": "2026-03-25T14:00:00Z", "status": "transcribed", "participants": 8, "duration_min": 45 }], "total": 142, "page": 1 }`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/meetings', title: 'Create meeting',
        desc: 'Create a new meeting record with optional scheduling and reminders.',
        params: [
          { name: 'title', type: 'string', required: true, desc: 'Meeting title' },
          { name: 'date', type: 'string', required: true, desc: 'ISO 8601 date-time' },
          { name: 'participants', type: 'array', required: false, desc: 'User IDs to invite' },
          { name: 'workspace_id', type: 'string', required: false, desc: 'Associated workspace' },
        ],
        response: `{ "id": "mtg_new456", "title": "Sprint Planning", "date": "2026-06-20T10:00:00Z", "meeting_link": "https://munal.ai/call/mtg_new456" }`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/ai/meeting/process', title: 'Process meeting audio',
        desc: 'Upload audio/video for AI transcription and insight extraction. Returns transcript, summary, action items, and key decisions.',
        params: [
          { name: 'file', type: 'file', required: true, desc: 'Audio/video file (MP3, WAV, MP4, WebM)' },
          { name: 'meeting_id', type: 'string', required: false, desc: 'Link to existing meeting record' },
        ],
        response: `{ "transcript": "...", "summary": "...", "action_items": [{ "task": "...", "assignee": "...", "priority": "high" }], "key_decisions": [...], "topics": [...] }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/meetings/{id}/transcript', title: 'Get full transcript',
        desc: 'Retrieve the complete transcript with timestamps and speaker labels.',
        params: [],
        response: `{ "transcript": "...", "segments": [{ "speaker": "John", "text": "...", "start": 0.5, "end": 4.2 }], "insights": { "summary": "...", "action_items": [...] } }`,
        auth: true,
      },
      {
        method: 'DELETE', path: '/v1/meetings/{id}', title: 'Delete meeting',
        desc: 'Permanently delete a meeting and all associated data (transcript, recordings).',
        params: [],
        response: `{ "deleted": true }`,
        auth: true,
      },
    ]
  },
  {
    id: 'workspaces',
    title: 'Workspaces',
    icon: 'Building',
    desc: 'Team workspace management, members, and settings',
    endpoints: [
      {
        method: 'GET', path: '/v1/workspaces', title: 'List workspaces',
        desc: 'Retrieve all workspaces the authenticated user belongs to.',
        params: [],
        response: `[{ "id": "ws_abc", "name": "Engineering", "members_count": 12, "created_at": "2026-01-15T08:00:00Z" }]`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/workspaces', title: 'Create workspace',
        desc: 'Create a new workspace and become its owner.',
        params: [
          { name: 'name', type: 'string', required: true, desc: 'Workspace name' },
          { name: 'description', type: 'string', required: false, desc: 'Workspace description' },
        ],
        response: `{ "id": "ws_new789", "name": "Marketing", "owner_id": "usr_a1b2c3" }`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/workspaces/{id}/invite', title: 'Invite members',
        desc: 'Invite users to a workspace by email. Sends invitation emails automatically.',
        params: [
          { name: 'emails', type: 'array', required: true, desc: 'Email addresses to invite' },
          { name: 'role', type: 'string', required: false, desc: '"admin", "manager", or "member" (default: "member")' },
        ],
        response: `{ "invited": 3, "already_members": 1, "failed": 0 }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/workspaces/{id}/members', title: 'List workspace members',
        desc: 'Retrieve all members of a workspace with their roles.',
        params: [],
        response: `[{ "user_id": "usr_a1b2c3", "name": "John Doe", "email": "john@example.com", "role": "admin", "joined_at": "2026-01-15T08:00:00Z" }]`,
        auth: true,
      },
    ]
  },
  {
    id: 'documents',
    title: 'Documents & DocHub',
    icon: 'FileText',
    desc: 'Documents, presentations, and smart spreadsheets',
    endpoints: [
      {
        method: 'GET', path: '/v1/documents', title: 'List documents',
        desc: 'Retrieve all documents in a workspace.',
        params: [{ name: 'workspace_id', type: 'string', required: true, desc: 'Filter by workspace' }],
        response: `[{ "id": "doc_123", "title": "Project Brief", "author_id": "usr_a1b2c3", "updated_at": "2026-06-14T10:00:00Z" }]`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/documents', title: 'Create document',
        desc: 'Create a new rich-text document in a workspace.',
        params: [
          { name: 'title', type: 'string', required: true, desc: 'Document title' },
          { name: 'content', type: 'string', required: false, desc: 'Initial HTML content' },
          { name: 'workspace_id', type: 'string', required: true, desc: 'Target workspace' },
        ],
        response: `{ "id": "doc_new456", "title": "Q3 Planning", "created_at": "2026-06-14T10:00:00Z" }`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/documents/{id}/link-workspace', title: 'Link to workspace',
        desc: 'Link a document to an additional workspace for cross-workspace access.',
        params: [{ name: 'workspace_id', type: 'string', required: true, desc: 'Workspace to link to' }],
        response: `{ "success": true, "linked_workspaces": ["ws_abc", "ws_def"] }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/sheets', title: 'List spreadsheets',
        desc: 'Retrieve all smart spreadsheets in a workspace.',
        params: [{ name: 'workspace_id', type: 'string', required: true, desc: 'Filter by workspace' }],
        response: `[{ "id": "sht_123", "title": "Budget Tracker", "rows": 42, "columns": 8, "updated_at": "2026-06-14T10:00:00Z" }]`,
        auth: true,
      },
    ]
  },
  {
    id: 'calendar',
    title: 'Calendar & Scheduling',
    icon: 'Calendar',
    desc: 'Event management, scheduling, and automated reminders',
    endpoints: [
      {
        method: 'GET', path: '/v1/calendar/events', title: 'List events',
        desc: 'Retrieve calendar events within a date range.',
        params: [
          { name: 'start', type: 'string', required: true, desc: 'Start date (ISO 8601)' },
          { name: 'end', type: 'string', required: true, desc: 'End date (ISO 8601)' },
        ],
        response: `[{ "id": "evt_123", "title": "Team Standup", "start": "2026-06-15T09:00:00Z", "end": "2026-06-15T09:15:00Z", "recurring": true }]`,
        auth: true,
      },
      {
        method: 'POST', path: '/v1/calendar/events', title: 'Create event',
        desc: 'Create a calendar event with optional reminders and recurrence.',
        params: [
          { name: 'title', type: 'string', required: true, desc: 'Event title' },
          { name: 'start', type: 'string', required: true, desc: 'Start datetime (ISO 8601)' },
          { name: 'end', type: 'string', required: true, desc: 'End datetime' },
          { name: 'reminders', type: 'array', required: false, desc: 'Reminder minutes before: [5, 10, 30]' },
          { name: 'participants', type: 'array', required: false, desc: 'User IDs' },
        ],
        response: `{ "id": "evt_new789", "title": "Project Kickoff", "meeting_link": "https://munal.ai/call/evt_new789" }`,
        auth: true,
      },
    ]
  },
  {
    id: 'storage',
    title: 'Storage & Quotas',
    icon: 'HardDrive',
    desc: 'File storage management, quota tracking, and auto-deletion policies',
    endpoints: [
      {
        method: 'GET', path: '/v1/storage/my-quota', title: 'Get current quota',
        desc: 'Retrieve the authenticated user\'s storage usage and limits.',
        params: [],
        response: `{ "used_bytes": 52428800, "limit_bytes": 1073741824, "used_pct": 4.9, "plan": "pro", "file_count": 23 }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/storage/files', title: 'List generated files',
        desc: 'Retrieve all AI-generated files for the authenticated user with sorting and filtering.',
        params: [
          { name: 'sort', type: 'string', required: false, desc: '"created_at", "file_size", "type"' },
          { name: 'order', type: 'string', required: false, desc: '"asc" or "desc"' },
          { name: 'type', type: 'string', required: false, desc: 'Filter by type: "image", "pdf", "docx", "xlsx"' },
        ],
        response: `{ "files": [{ "id": "file_123", "filename": "chart_abc.png", "type": "image", "file_size": 45000, "created_at": "2026-06-14T10:00:00Z" }], "total": 23 }`,
        auth: true,
      },
      {
        method: 'DELETE', path: '/v1/storage/files/{file_id}', title: 'Delete generated file',
        desc: 'Permanently delete a generated file and free the storage quota.',
        params: [],
        response: `{ "deleted": true, "freed_bytes": 45000 }`,
        auth: true,
      },
      {
        method: 'GET', path: '/v1/storage/auto-delete-policy', title: 'Get auto-deletion policy',
        desc: 'Retrieve the current auto-deletion policy configuration.',
        params: [],
        response: `{ "enabled": true, "retention_days": 30, "exclude_starred": true, "dry_run": false, "last_run": "2026-06-14T03:00:00Z", "last_run_deleted": 15 }`,
        auth: false,
      },
    ]
  },
  {
    id: 'users',
    title: 'Users & Profiles',
    icon: 'Users',
    desc: 'User profile management, roles, and Telegram integration',
    endpoints: [
      {
        method: 'GET', path: '/v1/users/me', title: 'Get current user',
        desc: 'Retrieve the authenticated user\'s profile information.',
        params: [],
        response: `{ "id": "usr_a1b2c3", "name": "John Doe", "email": "john@example.com", "role": "admin", "plan": "pro", "telegram_chat_id": "123456789" }`,
        auth: true,
      },
      {
        method: 'PUT', path: '/v1/users/{id}/telegram', title: 'Update Telegram Chat ID',
        desc: 'Link a Telegram account for receiving notifications.',
        params: [{ name: 'telegram_chat_id', type: 'string', required: true, desc: 'Telegram Chat ID' }],
        response: `{ "success": true, "telegram_chat_id": "123456789" }`,
        auth: true,
      },
    ]
  },
  {
    id: 'admin',
    title: 'Admin',
    icon: 'Settings',
    desc: 'Platform administration, settings, and analytics (requires admin role)',
    endpoints: [
      {
        method: 'GET', path: '/v1/admin/settings', title: 'Get all admin settings',
        desc: 'Retrieve all platform configuration settings.',
        params: [],
        response: `{ "general": { "appName": "Munal", "supportEmail": "support@munal.ai" }, "security": {...}, "email": {...} }`,
        auth: true, adminOnly: true,
      },
      {
        method: 'PUT', path: '/v1/admin/settings/{category}', title: 'Update settings category',
        desc: 'Update a specific settings category (general, security, email, notifications, system).',
        params: [
          { name: 'category', type: 'string', required: true, desc: 'Settings category name' },
          { name: 'settings', type: 'object', required: true, desc: 'Settings key-value pairs' },
        ],
        response: `{ "success": true }`,
        auth: true, adminOnly: true,
      },
      {
        method: 'GET', path: '/v1/admin/module-permissions/templates', title: 'Get permission templates',
        desc: 'Retrieve role-based module permission templates.',
        params: [],
        response: `{ "templates": [{ "role": "admin", "permissions": { "dashboard": true, "users": true, ... } }] }`,
        auth: true, adminOnly: true,
      },
      {
        method: 'GET', path: '/v1/advanced-analytics/admin/overview', title: 'Admin analytics overview',
        desc: 'Retrieve platform-wide analytics including user signups, meeting activity, and content metrics.',
        params: [{ name: 'period', type: 'string', required: false, desc: '"7d", "30d", "90d", "1y"' }],
        response: `{ "total_users": 1250, "active_users_30d": 890, "meetings_count": 3420, "documents_count": 5600 }`,
        auth: true, adminOnly: true,
      },
    ]
  },
];

export const METHOD_COLORS = {
  GET: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
  POST: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
  PUT: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
  PATCH: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  DELETE: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
};

export const ERROR_CODES = [
  { code: 400, title: 'Bad Request', desc: 'The request body is malformed or missing required fields.' },
  { code: 401, title: 'Unauthorized', desc: 'Authentication token is missing or invalid.' },
  { code: 403, title: 'Forbidden', desc: 'The authenticated user lacks permission for this resource.' },
  { code: 404, title: 'Not Found', desc: 'The requested resource does not exist.' },
  { code: 409, title: 'Conflict', desc: 'The request conflicts with current state (e.g., duplicate email).' },
  { code: 429, title: 'Rate Limited', desc: 'Too many requests. Retry after the Retry-After header value.' },
  { code: 500, title: 'Internal Error', desc: 'An unexpected server error occurred. Contact support if persistent.' },
];

export const RATE_LIMITS = [
  { tier: 'Free', requests: '60 req/min', burst: '10 req/sec', notes: 'Sufficient for personal use' },
  { tier: 'Pro', requests: '300 req/min', burst: '50 req/sec', notes: 'Ideal for team integrations' },
  { tier: 'Enterprise', requests: '1,000 req/min', burst: '200 req/sec', notes: 'Custom limits available' },
];
