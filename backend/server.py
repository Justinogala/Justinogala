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
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
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

# ============== Security Setup ==============
from security import limiter, SecurityHeadersMiddleware

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SecurityHeadersMiddleware)

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
from routes.usage_alerts import router as usage_alerts_router
from routes.team_billing import router as team_billing_router
from routes.shift_reminders import router as shift_reminders_router
from routes.admin_workspaces import router as admin_workspaces_router
from routes.admin_chat_moderation import router as admin_chat_router
from routes.admin_shifts import router as admin_shifts_router
from routes.reports import router as reports_router, check_escalations
from routes.admin_reports import router as admin_reports_router
from routes.esignature import router as esignature_router


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

# Usage Alerts
api_router.include_router(usage_alerts_router)

# Team Billing
api_router.include_router(team_billing_router)

# Shift Reminders
api_router.include_router(shift_reminders_router)

# Admin Portal Extensions
api_router.include_router(admin_workspaces_router)
api_router.include_router(admin_chat_router)
api_router.include_router(admin_shifts_router)
api_router.include_router(reports_router)
api_router.include_router(admin_reports_router)
api_router.include_router(esignature_router)


# ============== Include Main Router ==============

app.include_router(api_router)


# ============== CORS Middleware ==============

ALLOWED_ORIGINS = [
    os.environ.get("FRONTEND_URL", ""),
    "https://munal.ai",
    "https://www.munal.ai",
    "http://localhost:3000",
    "http://localhost:5173",
]
# Also allow the preview URL pattern
ALLOWED_ORIGINS = [o for o in ALLOWED_ORIGINS if o] + [
    f"https://{h}" for h in [os.environ.get("ALLOWED_HOST", "")]
    if h
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=ALLOWED_ORIGINS if any(ALLOWED_ORIGINS) else ["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
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
        
        # Start escalation scheduler (checks every hour for unreviewed reports)
        try:
            from apscheduler.schedulers.asyncio import AsyncIOScheduler
            scheduler = AsyncIOScheduler()
            scheduler.add_job(check_escalations, 'interval', hours=1, id='report_escalation')
            scheduler.start()
            logger.info("Escalation scheduler started (runs every 1 hour)")
        except Exception as sched_err:
            logger.error(f"Escalation scheduler failed to start: {sched_err}")
        
        # Seed admin user if not exists
        try:
            admin = await db.users.find_one({"email": "admin@munal.com"})
            if not admin:
                import uuid
                import bcrypt
                hashed_pw = bcrypt.hashpw("Admin@123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                admin_doc = {
                    "id": str(uuid.uuid4()),
                    "email": "admin@munal.com",
                    "password": hashed_pw,
                    "name": "Admin User",
                    "role": "Admin",
                    "status": "Active",
                    "plan": "Enterprise",
                    "avatar": None,
                    "email_verified": True,
                    "permissions": {},
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                await db.users.insert_one(admin_doc)
                logger.info("Admin user seeded: admin@munal.com")
            else:
                # Auto-migrate admin plain-text password to bcrypt
                stored_pw = admin.get("password", "")
                if not (stored_pw.startswith('$2b$') or stored_pw.startswith('$2a$')):
                    import bcrypt
                    hashed_pw = bcrypt.hashpw(stored_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    await db.users.update_one(
                        {"email": "admin@munal.com"},
                        {"$set": {"password": hashed_pw}}
                    )
                    logger.info("Admin password migrated to bcrypt")
                else:
                    logger.info("Admin user already exists")
        except Exception as seed_err:
            logger.error(f"Admin seed error: {seed_err}")
            
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
