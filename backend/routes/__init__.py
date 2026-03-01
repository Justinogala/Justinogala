"""
Routes package initialization.
All route modules are imported and combined into a single API router.
"""
from fastapi import APIRouter

# Create main API router
api_router = APIRouter(prefix="/api")

# Import all route modules
from routes import auth, users, chat, calls, group_calls, recordings, workspaces, calendar, payments, ai, meeting_room, admin

# Include all routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(chat.router)
api_router.include_router(calls.router)
api_router.include_router(group_calls.router)
api_router.include_router(recordings.router)
api_router.include_router(workspaces.router)
api_router.include_router(calendar.router)
api_router.include_router(payments.router)
api_router.include_router(payments.webhook_router)  # Stripe webhooks
api_router.include_router(ai.router)
api_router.include_router(meeting_room.router)
api_router.include_router(admin.router)

# Export SSE manager for use in other modules
from routes.chat import sse_manager

__all__ = ['api_router', 'sse_manager']
