/**
 * Munal AI Documentation Content
 * Complete documentation data for the Documentation Center
 */

export const DOC_SECTIONS = [
  {
    id: 'overview',
    title: 'Product Overview',
    icon: 'Rocket',
    articles: [
      {
        id: 'what-is-munal',
        title: 'What is Munal AI?',
        readTime: '3 min',
        content: `
## What is Munal AI?

Munal AI is an enterprise-grade, AI-powered workforce platform designed to transform how teams communicate, collaborate, and manage their daily operations. Built by **Jiffix Inc.**, Munal combines real-time meeting intelligence, smart scheduling, document management, and an advanced AI assistant into a single, unified platform.

### The Problem We Solve

Modern teams are drowning in fragmented tools — one for video calls, another for notes, another for task management, and yet another for document sharing. Critical information gets lost between these silos. Meeting insights go unrecorded. Action items fall through the cracks.

**Munal AI eliminates this fragmentation.** Every meeting, conversation, document, and decision lives in one intelligent workspace that learns and adapts to your team's workflow.

### Platform Highlights

- **AI-Powered Meeting Intelligence** — Automatic transcription, speaker identification, action item extraction, and smart summaries powered by GPT-5.5
- **Unified Workspace** — Documents, presentations, spreadsheets, chat, video calls, and scheduling in one platform
- **Advanced AI Chat Assistant** — Generate images, search the web, create charts, analyze documents, and produce downloadable files
- **Enterprise Security** — Role-based access control, 2FA enforcement, audit logging, and encrypted data storage
- **Cross-Platform** — Progressive Web App (PWA) with offline support, plus native Android app via Capacitor
- **Scalable Architecture** — Built on FastAPI, React, and MongoDB Atlas for high performance at any scale
        `
      },
      {
        id: 'who-is-it-for',
        title: 'Who is Munal AI For?',
        readTime: '2 min',
        content: `
## Who is Munal AI For?

Munal AI is designed for organizations of all sizes that value productivity, security, and intelligent automation.

### Primary Users

| Segment | Use Case |
|---------|----------|
| **Remote & Hybrid Teams** | Centralize communication, automate meeting notes, and keep everyone aligned across time zones |
| **Healthcare Organizations** | SOAP note generation, clinical documentation, HIPAA-ready security controls |
| **Legal & Compliance Teams** | Audit trails, secure document management, meeting transcription for case files |
| **Sales & Customer Success** | Call intelligence, CRM-ready summaries, action item tracking |
| **Engineering Teams** | Sprint retrospective summaries, technical documentation, code review notes |
| **Educational Institutions** | Lecture transcription, student collaboration workspaces, assignment management |
| **Government & Public Sector** | Secure communications, compliance-ready audit logging, policy document management |

### Team Roles

- **Executives** — Dashboard analytics, organization-wide insights, strategic decision support
- **Managers** — Team scheduling, shift management, performance analytics, approval workflows
- **Individual Contributors** — AI-assisted writing, meeting notes, task tracking, file generation
- **IT Administrators** — Module permissions, security policies, integration management, user provisioning
        `
      },
      {
        id: 'key-benefits',
        title: 'Key Benefits',
        readTime: '3 min',
        content: `
## Key Benefits

### Save 10+ Hours Per Week
Munal AI automates the most time-consuming parts of teamwork — meeting notes, follow-up emails, document formatting, and status updates. Teams report saving an average of 10+ hours per week after adoption.

### Never Miss an Action Item
Every meeting is automatically transcribed and analyzed. Action items are extracted with assignees, deadlines, and priority levels. Nothing falls through the cracks.

### One Platform, Zero Context Switching
Documents, spreadsheets, presentations, chat, video calls, scheduling, and AI assistance — all in one place. No more toggling between 8 different tabs.

### Enterprise-Grade Security
- **256-bit encryption** for data at rest and in transit
- **Role-based access control** with granular module permissions
- **Two-factor authentication** enforcement across the organization
- **Complete audit trail** for every action taken on the platform
- **Data residency** controls for compliance requirements

### AI That Actually Works
Munal's AI is powered by GPT-5.5 and purpose-built for workplace productivity:
- Summarize hour-long meetings in 30 seconds
- Generate professional documents from a simple prompt
- Search the web for real-time information with source citations
- Create charts and visualizations from your data
- Analyze uploaded files (PDFs, spreadsheets, images)

### Scales With Your Organization
From a 5-person startup to a 5,000-person enterprise, Munal's architecture handles it all. MongoDB Atlas provides automatic scaling, and our microservices backend ensures consistent performance.
        `
      },
      {
        id: 'use-cases',
        title: 'Main Use Cases',
        readTime: '4 min',
        content: `
## Main Use Cases

### 1. Automated Meeting Intelligence
Record any meeting — video call, in-person (via mobile), or phone — and Munal automatically generates a complete transcript, identifies speakers, extracts action items, and produces an executive summary. Export to PDF, Word, or push directly to a spreadsheet.

### 2. AI-Powered Document Creation
Use the AI Chat to generate professional documents instantly:
- **Reports** — "Create a quarterly sales report for Q2 2026" → downloadable PDF
- **Proposals** — "Draft a project proposal for the new CRM migration" → Word document
- **Data Analysis** — "Create a pie chart of our department budget allocation" → PNG chart
- **Images** — "Generate a professional header image for our blog post about AI" → HD image

### 3. Team Workspace Management
Create dedicated workspaces for projects, departments, or clients. Each workspace includes:
- Shared documents and presentations
- Team chat with file sharing
- Meeting scheduling and reminders
- Cross-workspace data linking

### 4. Shift & Schedule Management
For organizations with shift workers, Munal provides complete shift management:
- Drag-and-drop shift scheduling
- Automated reminders (email, push, and Telegram)
- Swap requests and approval workflows
- Attendance tracking and analytics

### 5. Secure Internal Communications
End-to-end encrypted messaging with:
- Direct messages and group channels
- File sharing with storage quota management
- Read receipts and delivery confirmations
- Admin chat moderation tools

### 6. Compliance & Audit
Every action on the platform is logged and auditable:
- User login/logout tracking
- Document access history
- Settings change audit trail
- Exportable compliance reports
        `
      }
    ]
  },
  {
    id: 'features',
    title: 'Core Features',
    icon: 'Zap',
    articles: [
      {
        id: 'ai-meeting-insights',
        title: 'AI Meeting Insights',
        readTime: '5 min',
        content: `
## AI Meeting Insights

Munal's meeting intelligence engine transforms every conversation into structured, actionable data.

### How It Works

1. **Record** — Start a meeting via Munal's built-in video calling, or upload an audio/video file
2. **Transcribe** — OpenAI Whisper converts speech to text with 98%+ accuracy
3. **Analyze** — GPT-5.5 processes the transcript to extract insights
4. **Deliver** — Results are available in real-time as the meeting progresses

### What You Get

| Feature | Description |
|---------|-------------|
| **Full Transcript** | Word-for-word transcript with timestamps and speaker labels |
| **Executive Summary** | 2-3 paragraph overview of the meeting |
| **Action Items** | Extracted tasks with assignees, priorities, and deadlines |
| **Key Decisions** | Important decisions made during the meeting |
| **Topics Discussed** | Automatic topic categorization and tagging |
| **Follow-Up Items** | Suggested next steps and follow-up actions |
| **Sentiment Analysis** | Overall meeting tone and participant engagement |

### Export Options
- **PDF** — Professional formatted document with branding
- **Word (DOCX)** — Editable document for further customization
- **Spreadsheet** — Push action items and decisions to Smart Sheets
- **Markdown** — For integration with other tools

### Dedicated Transcript View
Each meeting has a full-page transcript view (\`/meeting-transcripts/:id\`) with:
- Searchable transcript text
- AI insights sidebar
- One-click export bar
- Timestamp navigation
        `
      },
      {
        id: 'ai-chat-assistant',
        title: 'AI Chat Assistant',
        readTime: '6 min',
        content: `
## AI Chat Assistant

Munal's AI Chat is a full-featured AI assistant powered by GPT-5.5, capable of text generation, file analysis, image creation, web search, and data visualization.

### Capabilities

#### Text Generation
Ask any question — coding, writing, math, science, business strategy — and get expert-level responses with markdown formatting.

#### Web Search
When you need current information, the AI automatically searches the web and provides answers with source citations. Toggle web search on/off with the globe button in the input bar.

**Supported providers:** DuckDuckGo (free, default), Tavily, Brave Search, Perplexity (configurable by admin)

#### Image Generation
Generate any image from a text description using GPT Image 1:
- "Generate a logo for a tech startup" → HD PNG
- "Draw a landscape painting of mountains at sunset" → Artistic image
- Use the **Generate Image** button (sparkle icon) for quick access

#### Document Generation
- **PDF** — Professional documents with formatting
- **Word (DOCX)** — Editable documents
- **Excel (XLSX)** — Spreadsheets with structured data

#### Chart Generation
Create data visualizations from your data:
- **Pie Charts** — Proportional data display
- **Bar Charts** — Category comparisons
- **Line Charts** — Trends over time
- **Stacked Bar Charts** — Multi-series comparisons
- **Radar Charts** — Multi-metric analysis

#### File Analysis
Upload files for AI analysis:
- **PDFs** — Extract and summarize content
- **Images** — Visual analysis and description
- **Excel/CSV** — Data analysis and insights
- **Word documents** — Content review and summarization

#### Voice Input
Click the microphone button to speak your message — powered by OpenAI Whisper for accurate speech-to-text.

### Input Bar Actions
| Button | Function |
|--------|----------|
| Paperclip | Upload files for analysis |
| Microphone | Voice-to-text input |
| Sparkle | Quick image generation dialog |
| Globe | Toggle web search on/off |
        `
      },
      {
        id: 'smart-scheduling',
        title: 'Smart Scheduling & Calendar',
        readTime: '3 min',
        content: `
## Smart Scheduling & Calendar

Munal's calendar system provides intelligent scheduling with automated reminders across multiple channels.

### Features
- **Meeting Scheduling** — Create meetings with title, description, participants, and video call link
- **Recurring Events** — Daily, weekly, monthly, and custom recurrence patterns
- **Multi-Channel Reminders** — Email, push notification, in-app, and Telegram reminders at configurable intervals (5, 10, 15, 30, 60 minutes before)
- **Calendar Views** — Day, week, and month views with drag-and-drop rescheduling
- **Meeting Links** — Auto-generated video call links for virtual meetings

### Integration with Meeting Intelligence
When a scheduled meeting starts, Munal automatically begins recording and transcription. After the meeting ends, insights are attached to the calendar event for easy reference.
        `
      },
      {
        id: 'document-management',
        title: 'Document Management (DocHub)',
        readTime: '4 min',
        content: `
## Document Management — DocHub

DocHub is Munal's integrated document management system supporting three content types: Documents, Presentations, and Smart Spreadsheets.

### Documents
- Rich text editor powered by **TipTap**
- AI-assisted writing and editing
- Version history and auto-save
- Export to PDF, DOCX, and Markdown
- Cross-workspace linking

### Presentations
- Slide-based editor with themes
- AI slide generation from prompts
- Export to PDF and PPTX
- Collaborative editing
- Cross-workspace sharing

### Smart Spreadsheets
- Formula support and calculations
- AI data analysis and insights
- Import from CSV and Excel
- Template library (budgets, trackers, planners)
- Cross-workspace data linking
- Meeting summary to spreadsheet integration

### Cross-Workspace Data Linking
Any document, presentation, or spreadsheet can be linked across multiple workspaces, ensuring teams always have access to the latest version without duplication.
        `
      },
      {
        id: 'notifications',
        title: 'Notifications & Alerts',
        readTime: '3 min',
        content: `
## Notifications & Alerts

Munal delivers notifications through multiple channels to ensure you never miss important updates.

### Channels
| Channel | Setup | Cost |
|---------|-------|------|
| **In-App** | Automatic | Free |
| **Email** | Configured via Resend | Included |
| **Push (Browser)** | One-click enable | Free |
| **Telegram** | Link Chat ID in Settings | Free |

### Notification Types
- Meeting reminders (configurable timing)
- Shift assignments and changes
- Action item deadlines
- Storage quota warnings (80% and 100%)
- System alerts and maintenance notices
- Chat message notifications

### Telegram Integration
Users can link their Telegram account in **Settings → Notifications** to receive instant notifications on their phone. Setup:
1. Search for your organization's Munal bot on Telegram
2. Send any message to the bot
3. Get your Chat ID from @userinfobot
4. Enter the Chat ID in Settings → Notifications → Telegram
        `
      },
      {
        id: 'admin-dashboard',
        title: 'Admin Dashboard & Analytics',
        readTime: '4 min',
        content: `
## Admin Dashboard & Analytics

The Admin Control Center provides comprehensive oversight of your entire Munal deployment.

### Dashboard Widgets
- Active users (real-time)
- Meeting activity trends
- Storage utilization
- AI file generation statistics
- System health indicators

### Advanced Analytics
Access detailed analytics at \`/admin/advanced-analytics\`:
- **User Signups** — Registration trends over time
- **Meeting Activity** — Meeting volume, duration, and peak hours
- **Content Breakdown** — Documents, presentations, and spreadsheets created
- **AI Usage** — Chat conversations, file generations, and search queries
- **Storage Metrics** — Per-user and organization-wide storage consumption

### User Analytics
Individual users can view their own analytics at \`/my-analytics\`:
- Personal activity chart (7-day view)
- Meeting participation stats
- Document creation metrics
- AI usage summary
        `
      },
      {
        id: 'video-calling',
        title: 'Video Calling',
        readTime: '3 min',
        content: `
## Video Calling

Munal includes built-in video conferencing with virtual backgrounds and real-time transcription.

### Features
- HD video and audio calling
- **Virtual Backgrounds** — Blur, custom images, powered by TensorFlow BodyPix
- Screen sharing
- In-call chat
- Meeting recording with automatic transcription
- Up to 100 participants per call

### Integration
Video calls are fully integrated with Munal's meeting intelligence:
- Automatic recording when "Record" is enabled
- Real-time transcription during the call
- Post-meeting summary generation
- Calendar event linking
        `
      }
    ]
  },
  {
    id: 'security',
    title: 'Security & Privacy',
    icon: 'Shield',
    articles: [
      {
        id: 'authentication',
        title: 'User Authentication',
        readTime: '4 min',
        content: `
## User Authentication

Munal implements multi-layered authentication to protect user accounts and organizational data.

### Authentication Methods
- **Email & Password** — Secure registration with password strength requirements
- **Two-Factor Authentication (2FA)** — TOTP-based (authenticator app) and email-based OTP
- **2FA Enforcement** — Admins can mandate 2FA for all users organization-wide

### Password Security
- Passwords are hashed using **bcrypt** with a cost factor of 12
- Minimum 8 characters with complexity requirements
- Password reset via secure email link with time-limited tokens
- Brute force protection with rate limiting (5 attempts per 15 minutes)

### Session Management
- JWT-based authentication with configurable expiration
- 1-hour inactivity timeout for admin sessions
- Secure token storage with HTTP-only cookie option
- Session invalidation on password change
        `
      },
      {
        id: 'rbac',
        title: 'Role-Based Access Control',
        readTime: '4 min',
        content: `
## Role-Based Access Control (RBAC)

Munal provides granular, module-level access control through a role-based permission system.

### Default Roles

| Role | Description | Default Modules |
|------|-------------|-----------------|
| **Super Admin** | Full platform access | All 27 modules |
| **Admin** | Organization management | 15 modules (no billing, security config, module permissions) |
| **Manager** | Team-level management | 11 modules (workspaces, shifts, reports, messages, forms) |
| **User** | Standard access | 6 modules (dashboard, workspaces, shifts, support tickets, messages, forms) |

### Module Permissions
Admins can customize permissions for each role via **Admin → Module Permissions**:
- Toggle individual modules on/off per role
- Changes take effect immediately
- Audit log tracks all permission changes
- Reset to defaults available

### Per-User Overrides
Beyond role-based templates, individual users can have custom permission overrides for special cases (e.g., a user who needs access to reports but isn't a manager).
        `
      },
      {
        id: 'data-encryption',
        title: 'Data Encryption & Storage',
        readTime: '3 min',
        content: `
## Data Encryption & Storage Security

### Encryption
- **In Transit** — All data transmitted over TLS 1.3 (HTTPS enforced)
- **At Rest** — MongoDB Atlas encryption with AES-256
- **File Storage** — Encrypted object storage for all uploaded and generated files
- **Secrets** — API keys and tokens stored as environment variables, never in code

### Secure File Storage
- All AI-generated files (images, PDFs, documents, charts) stored in encrypted object storage
- Unique file IDs prevent enumeration attacks
- Authenticated download endpoints — files require valid Bearer token
- Auto-deletion policies to limit data retention (configurable: 7-180 days)

### Storage Quotas
- Per-user storage limits based on plan (Free: 100MB, Pro: 1GB, Enterprise: 10GB)
- Real-time usage tracking
- Email and in-app alerts at 80% and 100% thresholds
- Admin override capability for individual users
        `
      },
      {
        id: 'audit-logging',
        title: 'Audit Logging',
        readTime: '3 min',
        content: `
## Audit Logging

Every significant action on the Munal platform is logged for security, compliance, and accountability.

### What's Logged
- User authentication events (login, logout, failed attempts, 2FA challenges)
- Settings changes (admin configuration, user preferences)
- Data access events (document views, file downloads)
- Permission changes (role assignments, module permission toggles)
- Content operations (create, update, delete for documents, meetings, workspaces)
- Administrative actions (user management, organization changes)

### Audit Log Access
- **Admin → Audit Logs** — Full searchable log with filters
- Export to CSV for external analysis
- Retention: configurable (default: 90 days)

### Module Permission Audit
The Module Permissions page maintains its own dedicated audit trail showing who changed what permission, when, and for which role.
        `
      },
      {
        id: 'compliance',
        title: 'Compliance Readiness',
        readTime: '3 min',
        content: `
## Compliance Readiness

Munal is built with compliance in mind, providing the tools and controls organizations need to meet regulatory requirements.

### Compliance Features
- **Audit Trail** — Complete, immutable log of all platform activities
- **Data Retention Policies** — Configurable auto-deletion (7-180 days)
- **Access Controls** — Granular RBAC with per-module permissions
- **2FA Enforcement** — Organization-wide mandatory two-factor authentication
- **Data Export** — Full data export capabilities for compliance reporting
- **Compliance Snapshots** — Weekly automated compliance status reports

### Data Protection
- User data isolation between organizations
- Soft-delete with trash/restore for user accounts
- Encrypted backups via MongoDB Atlas
- Right to erasure support (GDPR-aligned)

### Security Policies
Configurable via **Admin → Security Policies**:
- Password complexity requirements
- Session timeout settings
- IP allowlisting (enterprise)
- Login attempt limits
        `
      }
    ]
  },
  {
    id: 'database',
    title: 'Database & Storage',
    icon: 'Database',
    articles: [
      {
        id: 'database-architecture',
        title: 'Database Architecture',
        readTime: '4 min',
        content: `
## Database Architecture

Munal uses **MongoDB Atlas** as its primary database, providing a secure, scalable, and globally distributed data layer.

### Why MongoDB Atlas?
- **Automatic Scaling** — Handles traffic spikes without manual intervention
- **Global Distribution** — Multi-region replication for low-latency access worldwide
- **Built-in Encryption** — AES-256 encryption at rest, TLS in transit
- **Automated Backups** — Continuous backup with point-in-time recovery
- **99.995% SLA** — Enterprise-grade uptime guarantee

### Data Model Overview
Munal uses a document-oriented data model optimized for the platform's collaborative features:

| Collection | Purpose |
|------------|---------|
| \`users\` | User accounts, profiles, preferences, Telegram Chat IDs |
| \`workspaces\` | Team workspaces with membership and settings |
| \`ai_conversations\` | AI Chat conversation metadata |
| \`ai_messages\` | Individual chat messages with attachments and sources |
| \`ai_generated_files\` | File generation metadata (type, size, storage path) |
| \`documents\` | Rich text documents with version history |
| \`presentations\` | Slide-based presentation data |
| \`sheets\` | Smart spreadsheet data and formulas |
| \`meetings\` | Meeting records, transcripts, and AI insights |
| \`notifications\` | User notification queue |
| \`admin_settings\` | Platform configuration (key-value store) |

### Data Isolation
Each document is tagged with \`user_id\` and/or \`workspace_id\`, ensuring strict data separation between users and organizations. API endpoints validate ownership before returning any data.
        `
      },
      {
        id: 'file-storage',
        title: 'File Storage Architecture',
        readTime: '3 min',
        content: `
## File Storage Architecture

### Object Storage
All user-uploaded and AI-generated files are stored in encrypted object storage, separate from the database.

**Storage Types:**
- **User Uploads** — Profile pictures, chat attachments, meeting recordings
- **AI-Generated Files** — Images, PDFs, DOCX, XLSX, charts
- **Static Assets** — Feature images, documentation assets

### Storage Quotas
Each user has a storage quota based on their plan:
| Plan | Quota |
|------|-------|
| Free | 100 MB |
| Pro | 1 GB |
| Enterprise | 10 GB |

Admins can set custom quotas per user via the Storage Quotas admin page.

### Auto-Deletion Policies
Configurable via **Admin → Settings → System**:
- Retention period: 7, 14, 30, 60, 90, or 180 days
- Exclude pinned conversations from deletion
- Dry-run mode to preview before enabling
- Daily execution at 3 AM UTC
- Freed storage is automatically reflected in user quotas

### Backup & Recovery
- MongoDB Atlas: Continuous backup with point-in-time recovery (35-day window)
- Object storage: Redundant storage across availability zones
- Disaster recovery: RTO < 4 hours, RPO < 1 hour
        `
      }
    ]
  },
  {
    id: 'policies',
    title: 'Policies',
    icon: 'FileText',
    articles: [
      {
        id: 'privacy-policy',
        title: 'Privacy Policy',
        readTime: '6 min',
        content: `
## Privacy Policy

**Last updated:** June 2026

### 1. Information We Collect
Munal AI collects information necessary to provide our services:
- **Account Information** — Name, email address, profile picture
- **Usage Data** — Feature usage, meeting participation, document activity
- **Content Data** — Meeting transcripts, documents, messages (owned by you)
- **Technical Data** — Browser type, device information, IP address, session data

### 2. How We Use Your Information
- Provide and improve Munal AI services
- Generate AI-powered insights and summaries
- Send notifications and service communications
- Maintain platform security and prevent abuse
- Comply with legal obligations

### 3. Data Sharing
We do **not** sell your personal data. We share data only:
- With AI service providers (OpenAI) for processing — data is not used for model training
- With email service providers (Resend) for transactional emails
- When required by law or to protect our rights

### 4. Data Retention
- Active account data: Retained while account is active
- Generated files: Subject to auto-deletion policy (configurable by admin)
- Deleted accounts: Data purged within 30 days of permanent deletion
- Audit logs: Retained for 90 days (configurable)

### 5. Your Rights
- **Access** — Request a copy of your data
- **Correction** — Update inaccurate information
- **Deletion** — Request account and data deletion
- **Portability** — Export your data in standard formats
- **Objection** — Opt out of non-essential data processing

### 6. Contact
For privacy inquiries: **privacy@munal.ai**
        `
      },
      {
        id: 'terms-of-use',
        title: 'Terms of Use',
        readTime: '5 min',
        content: `
## Terms of Use

**Last updated:** June 2026

### 1. Acceptance of Terms
By accessing or using Munal AI, you agree to these Terms of Use. If you do not agree, do not use the platform.

### 2. Account Responsibilities
- You must provide accurate registration information
- You are responsible for maintaining account security
- You must not share account credentials
- You must be at least 16 years old to use the platform

### 3. Acceptable Use
You agree not to:
- Use the platform for illegal activities
- Attempt to gain unauthorized access to other accounts
- Upload malicious files or content
- Abuse AI features to generate harmful content
- Circumvent security measures or rate limits
- Resell or redistribute platform access

### 4. Intellectual Property
- **Your Content** — You retain ownership of all content you create
- **AI-Generated Content** — Content generated by Munal's AI is owned by you
- **Platform IP** — Munal AI's software, design, and branding are owned by Jiffix Inc.

### 5. Service Availability
We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance windows are communicated in advance.

### 6. Limitation of Liability
Munal AI is provided "as is." We are not liable for indirect, incidental, or consequential damages arising from your use of the platform.

### 7. Termination
We reserve the right to suspend or terminate accounts that violate these terms, with notice where possible.
        `
      },
      {
        id: 'acceptable-use',
        title: 'Acceptable Use Policy',
        readTime: '3 min',
        content: `
## Acceptable Use Policy

This policy defines acceptable behavior on the Munal AI platform.

### Permitted Uses
- Business communication and collaboration
- Meeting recording and transcription (with participant consent)
- AI-assisted content creation for legitimate business purposes
- Document management and sharing within your organization
- Team scheduling and shift management

### Prohibited Uses
- **Illegal Activity** — Using the platform for any unlawful purpose
- **Harassment** — Sending abusive, threatening, or discriminatory content
- **Data Scraping** — Automated extraction of platform data
- **Malicious Content** — Uploading viruses, malware, or harmful files
- **Impersonation** — Misrepresenting your identity or affiliation
- **AI Abuse** — Generating content that violates OpenAI's usage policies
- **Spam** — Sending unsolicited bulk messages
- **Circumvention** — Bypassing security controls, rate limits, or access restrictions

### Enforcement
Violations may result in:
1. Warning notification
2. Temporary account suspension
3. Permanent account termination
4. Reporting to law enforcement (for illegal activities)
        `
      },
      {
        id: 'data-protection',
        title: 'Data Protection Policy',
        readTime: '4 min',
        content: `
## Data Protection Policy

### Our Commitment
Munal AI is committed to protecting the personal data of our users in accordance with applicable data protection regulations.

### Data Processing Principles
- **Lawfulness** — We process data only with valid legal basis
- **Purpose Limitation** — Data is collected for specified, legitimate purposes
- **Data Minimization** — We collect only what is necessary
- **Accuracy** — We maintain accurate and up-to-date records
- **Storage Limitation** — Data is retained only as long as necessary
- **Security** — Appropriate technical and organizational measures protect your data

### Technical Measures
- AES-256 encryption at rest
- TLS 1.3 encryption in transit
- Regular security audits and penetration testing
- Access logging and monitoring
- Automated vulnerability scanning

### Organizational Measures
- Employee security training
- Data access on a need-to-know basis
- Incident response procedures
- Regular policy reviews and updates

### Data Breach Response
In the event of a data breach:
1. Immediate containment and assessment (< 1 hour)
2. Notification to affected users (< 72 hours)
3. Notification to regulatory authorities (as required)
4. Full incident report and remediation plan (< 7 days)
        `
      },
      {
        id: 'cookie-policy',
        title: 'Cookie Policy',
        readTime: '2 min',
        content: `
## Cookie Policy

### What Cookies We Use

| Cookie | Purpose | Duration |
|--------|---------|----------|
| \`munal_sessions\` | Authentication session token | Session |
| \`munal_cookie_consent\` | Cookie preference storage | 1 year |
| \`theme_preference\` | Dark/light mode selection | Persistent |

### Essential Cookies
These cookies are required for the platform to function and cannot be disabled:
- Authentication tokens
- Session management
- CSRF protection

### Optional Cookies
- Theme preferences (dark/light mode)
- UI state persistence
- Analytics (if enabled by admin)

### Managing Cookies
You can manage cookie preferences through the cookie consent banner that appears on your first visit, or through your browser settings. Note that disabling essential cookies will prevent you from using the platform.
        `
      }
    ]
  },
  {
    id: 'admin-guide',
    title: 'Admin Guide',
    icon: 'Settings',
    isAdmin: true,
    articles: [
      {
        id: 'admin-overview',
        title: 'Admin Dashboard Overview',
        readTime: '4 min',
        content: `
## Admin Dashboard Overview

The Admin Control Center is your command center for managing the entire Munal AI deployment. Access it at \`/admin\`.

### Navigation
The admin sidebar provides access to all management modules:

| Section | Modules |
|---------|---------|
| **Billing** | Manage Payments, Stripe Settings |
| **Configuration** | Monitoring, Data Health, Security Policies, 2FA Dashboard, PDF Templates, Meeting Analytics, Advanced Analytics, Storage Quotas, Cloud Storage, Video Settings |
| **Communication** | Video History, API Settings, Transcription Settings, Integrations, Audit Logs, System Updates |
| **Settings** | General, Security, Email, Notifications, System tabs |
| **Super Admin** | Module Permissions (Super Admin only) |
        `
      },
      {
        id: 'admin-settings',
        title: 'Admin Settings Configuration',
        readTime: '5 min',
        content: `
## Admin Settings Configuration

Access via **Admin → Settings**. Five configuration tabs:

### General Tab
- **Application Name** — Displayed in browser tab and headers
- **Support Email** — Contact email shown to users
- **Support Phone** — Support phone number

### Security Tab
- Password policies and complexity requirements
- Session timeout configuration
- IP restriction settings
- Login attempt limits

### Email Tab
- SMTP configuration (powered by Resend)
- Email template customization
- Test email functionality
- Sender email configuration

### Notifications Tab
- Notification channel toggles (email, push, in-app)
- SMS & Messaging provider configuration:
  - **Telegram** (free) — Bot token and bot name
  - **Twilio** (paid) — Account SID, auth token, phone number
  - **Vonage** (paid) — API key, secret, from number
  - **MSG91** (paid) — Auth key, sender ID, template ID
- Test notification functionality

### System Tab
- Max upload size (MB)
- API rate limit (requests/minute)
- **Auto-Deletion Policy** — Configure automatic cleanup of generated files:
  - Retention period (7/14/30/60/90/180 days)
  - Exclude pinned conversations
  - Dry-run preview mode
  - Manual run trigger
- Maintenance mode toggle
        `
      },
      {
        id: 'user-management',
        title: 'User Management',
        readTime: '4 min',
        content: `
## User Management

### User Lifecycle
1. **Registration** — Users register via email or are invited by admin
2. **Email Verification** — Confirmation email sent automatically
3. **2FA Setup** — Optional or mandatory (admin-configurable)
4. **Active Use** — Full platform access per role permissions
5. **Soft Delete** — Admin can move users to Trash (recoverable)
6. **Permanent Delete** — Irreversible deletion after confirmation

### Soft Delete (Trash & Restore)
- Move users to trash without permanent deletion
- Users in trash cannot log in
- Restore users to active status at any time
- Permanent delete with double confirmation
- Access via **Admin → User Management → Trash tab**

### Role Assignment
Assign roles to control module access:
- **Super Admin** — Full access to all features and settings
- **Admin** — Organization management (no super admin features)
- **Manager** — Team management and reporting
- **User** — Standard access to core features

### Bulk Operations
- Export user list to CSV
- Bulk role changes
- Bulk status updates (active/suspended)
        `
      },
      {
        id: 'ai-search-config',
        title: 'AI & Search Configuration',
        readTime: '3 min',
        content: `
## AI & Search Configuration

### AI Web Search (Admin → API Settings)
Configure the search provider used by the AI Chat:

| Provider | Type | Setup |
|----------|------|-------|
| **DuckDuckGo** | Free | No API key required — works out of the box |
| **Tavily** | Paid | API key from tavily.com |
| **Brave Search** | Paid | API key from brave.com/search/api |
| **Perplexity** | Paid | API key from perplexity.ai |

To change providers:
1. Go to **Admin → API Settings**
2. Scroll to "AI Web Search" card
3. Select provider and enter API key (if required)
4. Click "Save Search Config"

### Storage Quotas (Admin → Storage Quotas)
- View all users' storage usage with visual bars
- Set custom limits per user
- Reset to plan defaults
- Monitor approaching-quota users
        `
      },
      {
        id: 'module-permissions',
        title: 'Module Permissions',
        readTime: '3 min',
        content: `
## Module Permissions

**Super Admin only.** Access via **Admin → Module Permissions**.

### Permission Matrix
The permissions page displays a matrix of all modules vs. all roles. Toggle individual modules on/off for each role.

### 28 Controllable Modules
Organized into groups:
- **Primary**: Dashboard
- **Management**: Users, Organizations, Workspaces, Reports, IR/SOR Templates, Chat Moderation, Shifts, Support Tickets, Messages, Broadcasts, Approval Templates, Forms
- **Billing**: Billing & Payments
- **Configuration**: Monitoring, Security Policies, Meeting Analytics, Cloud Storage, Video Settings, Stripe Settings, Video History, API Settings, Transcription Settings, Integrations, Audit Logs, General Settings, PDF Editor
- **Super Admin**: Module Permissions

### Saving Changes
- Click the toggle to change a permission
- Unsaved changes are highlighted
- Save per role or reset to defaults
- All changes are logged in the audit trail
        `
      }
    ]
  },
  {
    id: 'user-guide',
    title: 'User Guide',
    icon: 'Users',
    articles: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        readTime: '5 min',
        content: `
## Getting Started with Munal AI

Welcome to Munal AI! This guide will help you set up your account and start using the platform in under 5 minutes.

### Step 1: Create Your Account
1. Visit **munal.ai** and click "Get Started"
2. Enter your name, email, and a strong password
3. Check your email for the verification link
4. Click the link to activate your account

### Step 2: Set Up Two-Factor Authentication
For enhanced security, we recommend enabling 2FA:
1. Go to **Settings → Security**
2. Click "Enable 2FA"
3. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
4. Enter the 6-digit code to confirm

### Step 3: Explore the Dashboard
After logging in, you'll see your dashboard with:
- Quick access to AI Chat
- Recent meetings and documents
- Workspace overview
- Notification center

### Step 4: Join or Create a Workspace
- Click "Workspaces" in the sidebar
- Join an existing workspace (if invited) or create a new one
- Invite team members via email

### Step 5: Try the AI Chat
- Click "AI Chat" in the sidebar
- Ask anything: "Help me draft a meeting agenda for our weekly standup"
- Try generating an image: "Generate a team collaboration illustration"
- Try web search: "What are the latest trends in remote work?"
        `
      },
      {
        id: 'using-ai-features',
        title: 'Using AI Features',
        readTime: '5 min',
        content: `
## Using AI Features

### AI Chat
The AI Chat is your personal AI assistant. Access it from the sidebar or via the keyboard shortcut.

**Quick Actions:**
- Type naturally — the AI understands context
- Use the **paperclip** to upload files for analysis
- Use the **microphone** for voice input
- Use the **sparkle** button to generate images
- Use the **globe** toggle for web search

**Tips for Best Results:**
- Be specific: "Create a bar chart of Q2 sales by region" works better than "make a chart"
- For documents: "Generate a project proposal in PDF format" auto-creates a downloadable PDF
- For current info: "What's the latest news about [topic]?" triggers web search with source citations

### Meeting Intelligence
1. Schedule a meeting in the Calendar
2. Start the video call from the meeting link
3. Click "Record" to begin transcription
4. After the meeting, view the full transcript with AI insights
5. Export as PDF, Word, or push to a spreadsheet

### Smart Spreadsheets
1. Open DocHub → Spreadsheets
2. Create from scratch or use a template
3. Use the AI assistant to analyze data: "Summarize this data and identify trends"
4. Export or share across workspaces
        `
      },
      {
        id: 'scheduling-meetings',
        title: 'Scheduling Meetings',
        readTime: '3 min',
        content: `
## Scheduling Meetings

### Create a Meeting
1. Go to **Calendar** from the sidebar
2. Click "New Meeting" or click on a time slot
3. Fill in:
   - Meeting title
   - Description and agenda
   - Date and time
   - Participants (select from your workspace members)
   - Reminder settings (5, 10, 15, 30, or 60 minutes before)
4. Click "Create Meeting"

### Reminders
You'll receive reminders via:
- In-app notification
- Email
- Push notification (if enabled)
- Telegram (if linked)

### During the Meeting
- Click the meeting link to join the video call
- Enable recording for automatic transcription
- Use the chat panel for in-call messaging
- Share your screen for presentations

### After the Meeting
- View the full transcript at the meeting's transcript page
- Review AI-extracted action items and key decisions
- Export the meeting summary to PDF or Word
- Push action items to a Smart Spreadsheet
        `
      },
      {
        id: 'managing-teams',
        title: 'Managing Teams & Workspaces',
        readTime: '3 min',
        content: `
## Managing Teams & Workspaces

### Creating a Workspace
1. Go to **Workspaces** from the sidebar
2. Click "Create Workspace"
3. Enter a name and description
4. Invite members by email
5. Set workspace-specific settings

### Workspace Features
Each workspace includes:
- **Documents** — Shared rich-text documents
- **Presentations** — Collaborative slides
- **Spreadsheets** — Shared data and analysis
- **Chat** — Team messaging channel
- **Calendar** — Shared meeting schedule
- **Shifts** — Team shift management

### Inviting Members
1. Open the workspace
2. Click "Members" or "Invite"
3. Enter email addresses
4. Select role (Admin, Manager, User)
5. Click "Send Invitations"

### Cross-Workspace Sharing
Link documents, presentations, or spreadsheets across workspaces:
1. Open the item
2. Click "Link to Workspace"
3. Select target workspace(s)
4. The item appears in both workspaces automatically
        `
      },
      {
        id: 'getting-support',
        title: 'Getting Support',
        readTime: '2 min',
        content: `
## Getting Support

### Self-Service
- **Documentation** — You're here! Browse by category or search
- **In-App Help** — Click the help icon in the sidebar
- **AI Assistant** — Ask the AI Chat for how-to guidance

### Contact Support
- **Email**: support@munal.ai
- **In-App**: Submit a support ticket via the Support Tickets module
- **Response Time**: Within 24 hours for standard issues, 4 hours for critical issues

### Reporting Bugs
When reporting a bug, please include:
1. What you were trying to do
2. What happened instead
3. Your browser and device information
4. Screenshots if possible
5. Steps to reproduce the issue

### Feature Requests
We love hearing from users! Submit feature requests via:
- Support ticket with "Feature Request" tag
- Email to feedback@munal.ai
        `
      }
    ]
  }
];

export const ALL_ARTICLES = DOC_SECTIONS.flatMap(section =>
  section.articles.map(article => ({
    ...article,
    sectionId: section.id,
    sectionTitle: section.title,
    isAdmin: section.isAdmin || false,
  }))
);
