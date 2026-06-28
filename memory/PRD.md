# Munal AI Platform - Product Requirements Document

## Original Problem Statement
Build the Munal AI Academy platform with course catalog, livestream access control, certificates, and reviews. Seed with 91 professional free courses. Implement Academy Phases A, B, C. Unify pricing with Stripe. Upgrade AI to GPT-5.5.

## Core Platform
- Full-stack: FastAPI backend + React frontend + MongoDB
- AI Workspaces, AI Chat (GPT-5.5), AI Builder, Events Platform
- Stripe-based unified pricing for subscriptions and paid events
- `emergentintegrations` for LLM (GPT-5.5) and Sora-2

## Academy Features (Implemented)
- Course Catalog with 91 seeded courses (real YouTube videos + quizzes)
- Phase A: AI Tutor, Lesson Summaries, Discussions, Resources
- Phase B: Enhanced Progress Dashboard, Badges, Learning Streak Calendar
- Phase C: Practice Labs, Certification Pathways
- Public Learner Profiles, Leaderboard
- Unified Stripe pricing (`/pricing`, `/user/plans`)

## Removed Features
- Capstone Projects (removed June 28, 2026)
- Text-to-Video generation (hidden from nav)
- AI Features page (hidden from nav)

## Known Issues
- P0: Login page spinner hangs after successful auth (frontend issue in LoginPage.jsx / AuthContext.jsx)

## Upcoming Tasks
- P1: Enterprise Team Seat Management
- P2: Notification Integrations (email/SMS for course updates)

## Future/Backlog
- AI Career Coach / Resume Reviewer
- Munal AI Job Board
- Post-event feedback surveys with analytics

## Architecture
- Backend: `/app/backend` (FastAPI)
- Frontend: `/app/src` (React + Vite + Shadcn)
- DB: MongoDB Atlas
- Auth: JWT + 2FA support
- Payments: Stripe (live mode)
- AI: GPT-5.5 via emergentintegrations

## 3rd Party Integrations
- Stripe (Payments)
- OpenAI GPT-5.5 / Sora-2 via Emergent LLM Key
