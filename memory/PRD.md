# Munal AI Platform - Product Requirements Document

## Original Problem Statement
Build the Munal AI Academy platform with course catalog, certificates, and reviews. Seed with 91 professional free courses. Implement Academy Phases A, B, C. Unify pricing with Stripe. Upgrade AI to GPT-5.5. Add AI music generation.

## Core Platform
- Full-stack: FastAPI backend + React frontend + MongoDB
- AI Workspaces, AI Chat (GPT-5.5), AI Builder, Events Platform
- Stripe-based unified pricing for subscriptions and paid events
- `emergentintegrations` for LLM (GPT-5.5) and TTS

## Academy Features (Implemented)
- Course Catalog with 91 seeded courses (real YouTube videos + quizzes)
- Phase A: AI Tutor, Lesson Summaries, Discussions, Resources
- Phase B: Enhanced Progress Dashboard, Badges, Learning Streak Calendar
- Phase C: Practice Labs, Certification Pathways
- Public Learner Profiles, Leaderboard
- Unified Stripe pricing (`/pricing`, `/user/plans`)

## AI Media Features (Implemented)
- Text to Video: Free AI slideshow generator (stock images + TTS narration + auto background music via FFmpeg)
- Munal Music Studio: Full AI music generation via Suno API ($0.11/song) + Sound Effects via ElevenLabs (free tier)
- Text to Audio: TTS via Emergent LLM Key
- AI Chat: GPT-5.5 with image generation, file paste support, thumbs up/down/share

## Removed Features
- Capstone Projects (removed June 28, 2026)
- Text-to-Video Sora 2 (replaced with free slideshow approach)

## 3rd Party Integrations
- Stripe (Payments)
- OpenAI GPT-5.5 via Emergent LLM Key
- Suno API via sunoapi.org (Music generation)
- ElevenLabs (Sound effects, free tier)
- FFmpeg (Video/audio processing, pip-bundled + system)

## Upcoming Tasks
- P1: Enterprise Team Seat Management
- P2: Notification Integrations (email/SMS)

## Future/Backlog
- AI Career Coach / Resume Reviewer
- Munal AI Job Board
- Post-event feedback surveys with analytics
