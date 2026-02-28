"""
Routes package initialization.
"""
from fastapi import APIRouter

# Create main API router
api_router = APIRouter(prefix="/api")

# Import route modules
from routes import auth, users

# Include routers
api_router.include_router(auth.router)
api_router.include_router(users.router)
