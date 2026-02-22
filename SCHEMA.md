
# Munal Database Schema

This document outlines the complete database schema for the Munal application.

## 1. Database Tables

### users
Stores user profile information, extending the core Supabase `auth.users` functionality.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| email | text | Unique, not null |
| full_name | text | Not null |
| avatar_url | text | Nullable |
| workplace_id | UUID | Foreign key to `workplaces.id`, nullable |
| role | text | Default: 'member'. Check: 'admin', 'member', 'guest' |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### workplaces
Organizations or teams that users belong to.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| name | text | Not null |
| description | text | Nullable |
| owner_id | UUID | Foreign key to `users.id`, not null |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### meetings
Metadata for scheduled or completed meetings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| title | text | Not null |
| description | text | Nullable |
| workplace_id | UUID | Foreign key to `workplaces.id`, not null |
| scheduled_at | timestamp | Not null |
| duration_minutes | integer | Nullable |
| status | text | Default: 'scheduled'. Check: 'scheduled', 'in_progress', 'completed', 'cancelled' |
| created_by | UUID | Foreign key to `users.id`, not null |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### meeting_participants
Junction table linking users to meetings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| meeting_id | UUID | Foreign key to `meetings.id`, not null |
| user_id | UUID | Foreign key to `users.id`, not null |
| joined_at | timestamp | Nullable |
| left_at | timestamp | Nullable |
| created_at | timestamp | Default: `now()` |
| **Constraint** | Unique | `(meeting_id, user_id)` |

### files
Uploaded media or document files associated with meetings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| name | text | Not null |
| file_type | text | Not null. Check: 'audio', 'video', 'document' |
| file_size | integer | Not null |
| file_path | text | Not null |
| meeting_id | UUID | Foreign key to `meetings.id`, nullable |
| uploaded_by | UUID | Foreign key to `users.id`, not null |
| workplace_id | UUID | Foreign key to `workplaces.id`, not null |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### transcripts
Text transcripts generated from audio/video files.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| file_id | UUID | Foreign key to `files.id`, not null, unique |
| meeting_id | UUID | Foreign key to `meetings.id`, nullable |
| transcript_text | text | Not null |
| language | text | Default: 'en' |
| duration_seconds | integer | Nullable |
| status | text | Default: 'pending'. Check: 'pending', 'processing', 'completed', 'failed' |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### summaries
AI-generated summaries derived from transcripts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| transcript_id | UUID | Foreign key to `transcripts.id`, not null, unique |
| meeting_id | UUID | Foreign key to `meetings.id`, nullable |
| summary_text | text | Not null |
| key_points | text[] | Nullable |
| action_items | text[] | Nullable |
| status | text | Default: 'pending'. Check: 'pending', 'processing', 'completed', 'failed' |
| created_at | timestamp | Default: `now()` |
| updated_at | timestamp | Default: `now()` |

### collaboration
Comments, edits, and social interactions within meetings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| meeting_id | UUID | Foreign key to `meetings.id`, not null |
| user_id | UUID | Foreign key to `users.id`, not null |
| action_type | text | Not null. Check: 'comment', 'edit', 'share', 'mention' |
| content | text | Not null |
| created_at | timestamp | Default: `now()` |

### workplace_members
Membership mapping for users within workplaces.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key, default: `gen_random_uuid()` |
| workplace_id | UUID | Foreign key to `workplaces.id`, not null |
| user_id | UUID | Foreign key to `users.id`, not null |
| role | text | Default: 'member'. Check: 'admin', 'member', 'guest' |
| joined_at | timestamp | Default: `now()` |
| created_at | timestamp | Default: `now()` |
| **Constraint** | Unique | `(workplace_id, user_id)` |

---

## 2. Indexes for Performance

| Table | Index Name | Columns |
|-------|------------|---------|
| users | idx_users_email | `email` |
| users | idx_users_workplace_id | `workplace_id` |
| workplaces | idx_workplaces_owner_id | `owner_id` |
| meetings | idx_meetings_workplace_id | `workplace_id` |
| meetings | idx_meetings_status | `status` |
| meetings | idx_meetings_scheduled_at | `scheduled_at` |
| files | idx_files_meeting_id | `meeting_id` |
| files | idx_files_workplace_id | `workplace_id` |
| files | idx_files_file_type | `file_type` |
| transcripts | idx_transcripts_file_id | `file_id` |
| transcripts | idx_transcripts_meeting_id | `meeting_id` |
| transcripts | idx_transcripts_status | `status` |
| summaries | idx_summaries_transcript_id | `transcript_id` |
| summaries | idx_summaries_meeting_id | `meeting_id` |
| summaries | idx_summaries_status | `status` |
| collaboration | idx_collaboration_meeting_id | `meeting_id` |
| collaboration | idx_collaboration_user_id | `user_id` |
| collaboration | idx_collaboration_created_at | `created_at` |
| workplace_members | idx_workplace_members_workplace_id | `workplace_id` |
| workplace_members | idx_workplace_members_user_id | `user_id` |

---

## 3. Row Level Security (RLS) Policies

All tables have RLS enabled.

### Users Table
- **SELECT**: Authenticated users can view their own profile and profiles of users in their shared workplaces (requires a complex join or helper function in production).
- **UPDATE**: `auth.uid() = id` (Users update only their own profile).
- **DELETE**: Restricted to service_role or specific admin logic.

### Workplaces Table
- **SELECT**: `EXISTS (SELECT 1 FROM workplace_members WHERE workplace_id = workplaces.id AND user_id = auth.uid())`
- **INSERT**: Authenticated users.
- **UPDATE**: `owner_id = auth.uid()` or admin role in `workplace_members`.
- **DELETE**: `owner_id = auth.uid()`

### Meetings Table
- **SELECT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid())`
- **INSERT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid())`
- **UPDATE**: `created_by = auth.uid()` OR `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid() AND role = 'admin')`
- **DELETE**: Same as UPDATE.

### Files Table
- **SELECT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid())`
- **INSERT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid())`
- **UPDATE**: `uploaded_by = auth.uid()` OR Workplace Admin.
- **DELETE**: Same as UPDATE.

### Transcripts & Summaries Tables
- **SELECT**: `meeting_id IN (SELECT id FROM meetings WHERE workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid()))`
- **INSERT/UPDATE**: Typically restricted to `service_role` (backend AI process).

### Collaboration Table
- **SELECT**: Access via Meeting ID (checked against user's workplace membership).
- **INSERT**: Authenticated users in the workplace.
- **DELETE**: `user_id = auth.uid()` OR Workplace Admin.

### Workplace Members Table
- **SELECT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid())`
- **INSERT**: `workplace_id IN (SELECT workplace_id FROM workplace_members WHERE user_id = auth.uid() AND role = 'admin')`
- **UPDATE**: Same as INSERT.
- **DELETE**: Same as INSERT.

---

## 4. Storage Buckets

| Bucket Name | Privacy | Max Size | Allowed Types | Path Structure |
|-------------|---------|----------|---------------|----------------|
| **audio-files** | Private | 500MB | audio/* | `{workplace_id}/{meeting_id}/` |
| **video-files** | Private | 2GB | video/* | `{workplace_id}/{meeting_id}/` |
| **documents** | Private | 100MB | pdf, docx, txt, pptx | `{workplace_id}/{user_id}/` |
| **avatars** | Public | 10MB | image/* | `{user_id}/` |

### Storage RLS Policies
Storage policies generally mirror the database RLS policies:
- Users can read/write files if they belong to the `{workplace_id}` or if the folder matches their `{user_id}` (for avatars/personal docs).
- **Avatars** are publicly readable for UI display.

---

## 5. Functions and Triggers

### `update_updated_at_timestamp()`
Updates the `updated_at` column to `now()` on every row update.
- **Applied to:** users, workplaces, meetings, files, transcripts, summaries.

### `add_user_to_workplace()`
Trigger function on `users` table.
- When `users.workplace_id` is set/changed, this function automatically inserts a record into `workplace_members` with role 'member', ensuring data consistency between the user profile and the membership table.
