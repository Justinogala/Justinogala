# Backend Refactoring Roadmap

## Current State
- Single `server.py` file with ~5400 lines
- All routes, models, and helpers in one file
- Working but hard to maintain

## Target Architecture
```
/app/backend/
├── server.py              # Main app, CORS, middleware, router includes
├── config.py              # Database, JWT, email config (CREATED)
├── models.py              # All Pydantic models (CREATED - needs population)
├── routes/
│   ├── __init__.py        # Router aggregation (CREATED)
│   ├── auth.py            # Authentication (CREATED)
│   ├── users.py           # User management (CREATED)
│   ├── chat.py            # Chat & messaging
│   ├── calls.py           # 1-on-1 video calls
│   ├── group_calls.py     # Group video calls
│   ├── recordings.py      # Recording management
│   ├── calendar.py        # Calendar events
│   ├── workspaces.py      # Workspace management
│   ├── payments.py        # Stripe payments
│   ├── ai.py              # AI/TTS features
│   └── admin.py           # Admin endpoints
├── services/
│   ├── email.py           # Email sending
│   ├── jwt.py             # JWT helpers
│   └── websocket.py       # WebSocket/SSE managers
└── utils/
    └── helpers.py         # Utility functions
```

## Route Groups (from server.py)
1. **Auth** (lines 2193-2486): register, login, forgot-password, change-password, verify-token
2. **Users** (lines 2491-2659): CRUD, search, by-email
3. **Workspaces** (lines 2660-2978): CRUD, members
4. **Chat** (lines 753-815, 2100-2189, 2980-3198): messages, files, typing, presence
5. **Calls** (lines 815-965): 1-on-1 video calls
6. **Group Calls** (lines 991-1217): multi-participant calls
7. **Admin Settings** (lines 1234-1665): settings, SMTP, audit logs
8. **Coupons** (lines 1688-1874): coupon management
9. **Tax Rates** (lines 1889-2051): tax calculations
10. **Recordings** (lines 3200-3627): recording CRUD, sharing, streaming
11. **AI/TTS** (lines 3628-4201): transcription, TTS, chat
12. **Calendar** (lines 4202-4533): events, upcoming
13. **Meeting Room** (lines 4534-4771): meeting signaling
14. **Admin Monitoring** (lines 4772-5410): analytics, security, users

## Migration Steps
1. ✅ Create config.py with database and settings
2. ✅ Create models.py skeleton
3. ✅ Create routes/__init__.py
4. ✅ Create routes/auth.py and routes/users.py
5. ⬜ Test that modular routes work alongside existing routes
6. ⬜ Gradually migrate each route group
7. ⬜ Remove migrated routes from server.py
8. ⬜ Final cleanup and testing

## Notes
- Keep server.py working throughout the migration
- Test after each route group migration
- Models can be shared via models.py import
- Database connection stays in config.py
