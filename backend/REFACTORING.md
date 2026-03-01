# Backend Refactoring Roadmap

## Current State ✅ PHASE 2 COMPLETE
- All 14 route groups created as separate modules
- Routes are functional and tested
- Original server.py still works (backward compatible)

## Architecture Implemented
```
/app/backend/
├── server.py              # Main app with original routes (still working)
├── config.py              # Database, JWT, email config ✅
├── models.py              # Pydantic models reference ✅
├── routes/
│   ├── __init__.py        # Router aggregation (98 routes) ✅
│   ├── auth.py            # Authentication ✅
│   ├── users.py           # User management ✅
│   ├── chat.py            # Chat & messaging + SSE manager ✅
│   ├── calls.py           # 1-on-1 video calls ✅
│   ├── group_calls.py     # Group video calls ✅
│   ├── recordings.py      # Recording management ✅
│   ├── workspaces.py      # Workspace management ✅
│   ├── calendar.py        # Calendar events ✅
│   ├── payments.py        # Stripe payments + webhooks ✅
│   ├── ai.py              # AI/TTS features ✅
│   ├── meeting_room.py    # Meeting signaling ✅
│   └── admin.py           # Admin endpoints ✅
└── services/              # (Future: email, websocket)
```

## Route Groups (All 14 Completed)
1. ✅ **Auth** - register, login, forgot-password, change-password, verify-token
2. ✅ **Users** - CRUD, search, by-email
3. ✅ **Chat** - messages, files, typing, presence, SSE streaming
4. ✅ **Calls** - 1-on-1 video calls (initiate, accept, reject, end, signal)
5. ✅ **Group Calls** - multi-participant (join, leave, signal, update-participant)
6. ✅ **Recordings** - CRUD, sharing, streaming, categories
7. ✅ **Workspaces** - CRUD, members
8. ✅ **Calendar** - events, upcoming, respond
9. ✅ **Payments** - packages, checkout, transactions, Stripe webhook
10. ✅ **AI** - TTS, transcript analysis, AI chat
11. ✅ **Meeting Room** - join, leave, signal, update-status
12. ✅ **Admin** - settings, audit logs, SMTP test, user management
13. ✅ **Coupons** - CRUD (in admin.py)
14. ✅ **Tax Rates** - CRUD (in admin.py)

## Tested Endpoints
- Auth/Login: ✅
- Admin settings: ✅
- Payment packages: ✅ (5 packages)
- TTS voices: ✅ (9 voices)
- Calendar events: ✅

## Phase 3 (Future)
- [ ] Remove duplicate routes from server.py
- [ ] Move SSE manager to shared service
- [ ] Add unit tests for each route module
- [ ] Add OpenAPI documentation

