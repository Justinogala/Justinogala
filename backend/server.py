"""
Munal AI API Server
Main application entry point with modular route imports.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
from datetime import datetime, timezone
import os
import logging

# ============== Configuration ==============

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== FastAPI App ==============

app = FastAPI(
    title="Munal AI API",
    description="AI-powered meeting and collaboration platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Create base API router
api_router = APIRouter(prefix="/api")


# ============== Health & Status Routes ==============

@api_router.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Hello World"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        await db.command("ping")
        db_status = "healthy"
    except Exception:
        db_status = "unhealthy"
    
    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# ============== Import Modular Routes ==============

from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.chat import router as chat_router, sse_manager
from routes.calls import router as calls_router
from routes.group_calls import router as group_calls_router
from routes.recordings import router as recordings_router
from routes.workspaces import router as workspaces_router
from routes.calendar import router as calendar_router
from routes.payments import router as payments_router, webhook_router
from routes.ai import router as ai_router
from routes.meeting_room import router as meeting_room_router
from routes.admin import router as admin_router
from routes.messages import router as messages_router
from routes.shifts import router as shifts_router
from routes.entitlements import router as entitlements_router


# ============== Include All Routers ==============

# Authentication
api_router.include_router(auth_router)

# User management
api_router.include_router(users_router)

# Chat & messaging
api_router.include_router(chat_router)
api_router.include_router(messages_router)

# Video calls
api_router.include_router(calls_router)
api_router.include_router(group_calls_router)

# Recordings
api_router.include_router(recordings_router)

# Workspaces
api_router.include_router(workspaces_router)

# Calendar
api_router.include_router(calendar_router)

# Payments
api_router.include_router(payments_router)
api_router.include_router(webhook_router)

# AI features
api_router.include_router(ai_router)

# Meeting room
api_router.include_router(meeting_room_router)

# Admin
api_router.include_router(admin_router)

# Shifts
api_router.include_router(shifts_router)

# Entitlements & Usage
api_router.include_router(entitlements_router)


# ============== Include Main Router ==============

app.include_router(api_router)


# ============== CORS Middleware ==============

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Startup & Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("Munal AI API starting up...")
    try:
        await db.command("ping")
        logger.info("Database connection successful")
        
        # Create TTL index for video_history - auto-delete after 7 days
        try:
            await db.video_history.create_index(
                "created_at",
                expireAfterSeconds=7 * 24 * 60 * 60  # 7 days in seconds
            )
            logger.info("Video history TTL index created (7 day expiry)")
        except Exception as idx_err:
            # Index might already exist
            logger.info(f"TTL index status: {idx_err}")
            
    except Exception as e:
        logger.error(f"Database connection failed: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown tasks"""
    logger.info("Munal AI API shutting down...")
    client.close()
    logger.info("Database connection closed")


# ============== Export for ASGI ==============

# The app is the ASGI application that uvicorn will run
