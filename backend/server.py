"""
Munal AI API Server
Main application entry point with modular route imports.
"""
from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
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

# MongoDB connection — CUSTOM_MONGO_URL takes priority (for user's Atlas DB)
mongo_url = os.environ.get('CUSTOM_MONGO_URL') or os.environ.get('MONGO_URL', '')
db_name = os.environ.get('CUSTOM_DB_NAME') or os.environ.get('DB_NAME', 'munal_db')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
db = client[db_name]

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
from security import limiter, SecurityHeadersMiddleware, set_audit_db

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SecurityHeadersMiddleware)

# Create base API router
api_router = APIRouter(prefix="/api")


# ============== Root-level health endpoints for K8s probes ==============

@app.get("/health")
async def k8s_health():
    """Root health check for K8s - no /api prefix"""
    return {"status": "healthy", "service": "backend"}

@app.get("/ready")
async def k8s_ready():
    """Readiness probe for K8s"""
    import asyncio
    try:
        await asyncio.wait_for(db.command("ping"), timeout=2)
        return {"status": "ready", "database": "connected"}
    except Exception:
        return {"status": "ready", "database": "connecting"}


@app.get("/.well-known/assetlinks.json")
async def assetlinks():
    """Android App Links verification file for Google Play deep links"""
    import json
    assetlinks_path = ROOT_DIR / "static" / ".well-known" / "assetlinks.json"
    if assetlinks_path.exists():
        data = json.loads(assetlinks_path.read_text())
        return Response(content=json.dumps(data), media_type="application/json")
    return Response(content="[]", media_type="application/json")


@app.get("/.well-known/ai-plugin.json")
async def ai_plugin():
    """AI plugin manifest for ChatGPT, Perplexity and other LLM agents"""
    import json
    path = ROOT_DIR / "static" / "ai-plugin.json"
    if path.exists():
        return Response(content=path.read_text(), media_type="application/json")
    return Response(content="{}", media_type="application/json")


@app.get("/llms.txt")
async def llms_txt():
    """LLMs.txt — structured information file for AI search engines"""
    path = ROOT_DIR / "static" / "llms.txt"
    if path.exists():
        return Response(content=path.read_text(), media_type="text/plain; charset=utf-8")
    return Response(content="", media_type="text/plain")


@app.get("/llms-full.txt")
async def llms_full_txt():
    """Full version of LLMs.txt"""
    path = ROOT_DIR / "static" / "llms.txt"
    if path.exists():
        return Response(content=path.read_text(), media_type="text/plain; charset=utf-8")
    return Response(content="", media_type="text/plain")


@app.get("/robots.txt")
async def robots_txt():
    """Robots.txt with AI crawler permissions"""
    path = ROOT_DIR / "static" / "robots.txt"
    if path.exists():
        return Response(content=path.read_text(), media_type="text/plain; charset=utf-8")
    return Response(content="User-agent: *\nAllow: /\n", media_type="text/plain")


@app.get("/sitemap.xml")
async def sitemap_xml():
    """XML Sitemap for search engines"""
    path = ROOT_DIR / "static" / "sitemap.xml"
    if path.exists():
        return Response(content=path.read_text(), media_type="application/xml; charset=utf-8")
    return Response(content='<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', media_type="application/xml")


# ============== Health & Status Routes ==============

@api_router.get("/")
async def root():
    """API root endpoint"""
    return {"message": "Hello World"}


@api_router.get("/health")
async def health_check():
    """Health check endpoint - responds immediately, DB check is non-blocking"""
    import asyncio
    db_status = "unknown"
    try:
        await asyncio.wait_for(db.command("ping"), timeout=3)
        db_status = "healthy"
    except (asyncio.TimeoutError, Exception):
        db_status = "connecting"
    
    return {
        "status": "healthy",
        "database": db_status,
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@api_router.get("/demo-video")
async def get_demo_video():
    """Serve the pre-generated Sora 2 demo video"""
    video_path = ROOT_DIR / "static" / "demo_video.mp4"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Demo video not available yet")
    return FileResponse(str(video_path), media_type="video/mp4", filename="munal-demo.mp4")


@api_router.get("/static/{filename}")
async def serve_static_file(filename: str):
    """Serve static asset files"""
    file_path = ROOT_DIR / "static" / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    content_types = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4"}
    ext = file_path.suffix.lower()
    return FileResponse(str(file_path), media_type=content_types.get(ext, "application/octet-stream"))


from pydantic import BaseModel as PydanticBaseModel

class ContactFormRequest(PydanticBaseModel):
    name: str
    email: str
    subject: str
    message: str

@api_router.post("/contact")
async def submit_contact_form(request: ContactFormRequest):
    """Save contact form submission as an admin internal message"""
    import uuid
    try:
        message_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        msg = {
            "id": message_id,
            "thread_id": message_id,
            "parent_id": None,
            "sender_id": f"contact_{message_id[:8]}",
            "sender_name": request.name,
            "sender_email": request.email,
            "recipient_id": "admin",
            "recipient_name": "Admin",
            "subject": request.subject,
            "content": request.message,
            "is_read": False,
            "is_starred": False,
            "is_draft": False,
            "is_junk": False,
            "in_trash": False,
            "is_contact_form": True,
            "deleted_by_sender": False,
            "deleted_by_recipient": False,
            "created_at": now,
            "updated_at": now,
        }

        await db.user_messages.insert_one(msg)
        msg.pop("_id", None)

        return {"success": True, "message_id": message_id}
    except Exception as e:
        logger.error(f"Contact form error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


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
from routes.search import router as search_router
from routes.admin_shifts import router as admin_shifts_router
from routes.reports import router as reports_router, check_escalations
from routes.approvals import run_weekly_digest
from routes.admin_reports import router as admin_reports_router
from routes.esignature import router as esignature_router
from routes.pdf_editor import router as pdf_editor_router
from routes.file_converter import router as file_converter_router
from routes.admin_pdf_templates import router as admin_pdf_templates_router
from routes.approvals import router as approvals_router
from routes.organizations import router as organizations_router
from routes.forms import router as forms_router
from routes.forms import admin_router as admin_forms_router
from routes.dashboard import router as dashboard_router
from routes.module_permissions import router as module_permissions_router
from routes.ai_chat import router as ai_chat_router
from routes.analytics import router as analytics_router
from routes.time_clock import router as time_clock_router
from routes.push_notifications import router as push_router
from routes.data_health import router as data_health_router
from routes.two_factor import router as two_factor_router
from routes.user_two_factor import router as user_two_factor_router
from routes.audit_logs import router as audit_logs_router
from routes.admin_2fa_dashboard import router as admin_2fa_dashboard_router, run_2fa_auto_reminders
from routes.admin_compliance import router as admin_compliance_router, take_compliance_snapshot
from routes.updates import router as updates_router
from scheduled.data_health_digest import run_data_health_digest


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
api_router.include_router(forms_router, prefix="/workspaces")

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
api_router.include_router(pdf_editor_router)
api_router.include_router(file_converter_router)
api_router.include_router(admin_pdf_templates_router)
api_router.include_router(approvals_router)
api_router.include_router(organizations_router)
api_router.include_router(admin_forms_router, prefix="/admin")
api_router.include_router(search_router)
api_router.include_router(dashboard_router)
api_router.include_router(module_permissions_router)
api_router.include_router(ai_chat_router)
api_router.include_router(analytics_router)
api_router.include_router(time_clock_router)
api_router.include_router(push_router)
api_router.include_router(data_health_router)
api_router.include_router(two_factor_router)
api_router.include_router(user_two_factor_router)
api_router.include_router(audit_logs_router)
api_router.include_router(admin_2fa_dashboard_router)
api_router.include_router(admin_compliance_router)
api_router.include_router(updates_router)

from routes.sheets import router as sheets_router
api_router.include_router(sheets_router)

from routes.ai_features import router as ai_features_router, run_ai_weekly_digest
api_router.include_router(ai_features_router)

from routes.documents import router as documents_router
api_router.include_router(documents_router)

from routes.presentations import router as presentations_router
api_router.include_router(presentations_router)

from routes.advanced_analytics import router as advanced_analytics_router
api_router.include_router(advanced_analytics_router)

from routes.storage_quotas import router as storage_quotas_router
api_router.include_router(storage_quotas_router)


# ============== Include Main Router ==============

app.include_router(api_router)


# ============== CORS Middleware ==============

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
if CORS_ORIGINS == "*":
    origins_list = ["*"]
else:
    origins_list = [o.strip() for o in CORS_ORIGINS.split(",") if o.strip()]

# Also include any explicitly configured origins
for extra in [os.environ.get("FRONTEND_URL", ""), "https://munal.ai", "https://www.munal.ai"]:
    if extra and extra not in origins_list and origins_list != ["*"]:
        origins_list.append(extra)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True if origins_list != ["*"] else False,
    allow_origins=origins_list,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)


# ============== Startup & Shutdown Events ==============

@app.on_event("startup")
async def startup_event():
    """Application startup tasks"""
    logger.info("Munal AI API starting up...")
    set_audit_db(db)
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
            scheduler.add_job(run_weekly_digest, 'cron', day_of_week='mon', hour=9, minute=0, id='weekly_digest')
            scheduler.add_job(run_2fa_auto_reminders, 'cron', day_of_week='mon', hour=10, minute=0, id='2fa_auto_reminders')
            scheduler.add_job(run_data_health_digest, 'cron', day_of_week='mon', hour=9, minute=30, id='data_health_digest')
            scheduler.add_job(take_compliance_snapshot, 'cron', day_of_week='mon', hour=10, minute=30, id='compliance_snapshot')
            scheduler.add_job(run_ai_weekly_digest, 'cron', day_of_week='mon', hour=8, minute=0, id='ai_weekly_digest')

            # Meeting reminders - check every minute for upcoming meetings
            from routes.calendar import send_meeting_reminders
            scheduler.add_job(send_meeting_reminders, 'interval', minutes=1, id='meeting_reminders')

            scheduler.start()
            logger.info("Escalation scheduler started (runs every 1 hour)")
            logger.info("Weekly digest scheduler started (runs every Monday 9 AM UTC)")
            logger.info("2FA auto-reminder scheduler started (runs every Monday 10 AM UTC)")
            logger.info("Data health digest scheduler started (runs every Monday 9:30 AM UTC)")
            logger.info("Compliance snapshot scheduler started (runs every Monday 10:30 AM UTC)")
        except Exception as sched_err:
            logger.error(f"Escalation scheduler failed to start: {sched_err}")
        
        # Seed admin user if not exists
        try:
            admin = await db.users.find_one({"email": "admin@munal.ai"})
            if not admin:
                import uuid
                import bcrypt
                hashed_pw = bcrypt.hashpw("Admin@123456".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                admin_doc = {
                    "id": str(uuid.uuid4()),
                    "email": "admin@munal.ai",
                    "password": hashed_pw,
                    "name": "Admin User",
                    "role": "Super_Admin",
                    "status": "Active",
                    "plan": "Enterprise",
                    "avatar": None,
                    "email_verified": True,
                    "permissions": {},
                    "created_at": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc)
                }
                await db.users.insert_one(admin_doc)
                logger.info("Super Admin user seeded: admin@munal.ai")
            else:
                # Migrate existing admin to Super_Admin if role is missing or outdated
                current_role = (admin.get("role") or "").strip()
                if current_role not in ["Super_Admin"]:
                    await db.users.update_one(
                        {"email": "admin@munal.ai"},
                        {"$set": {"role": "Super_Admin"}}
                    )
                    logger.info(f"Migrated admin role from '{current_role}' to Super_Admin")
                # Auto-migrate admin plain-text password to bcrypt
                stored_pw = admin.get("password", "")
                if not (stored_pw.startswith('$2b$') or stored_pw.startswith('$2a$')):
                    import bcrypt
                    hashed_pw = bcrypt.hashpw(stored_pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                    await db.users.update_one(
                        {"email": "admin@munal.ai"},
                        {"$set": {"password": hashed_pw}}
                    )
                    logger.info("Admin password migrated to bcrypt")
                else:
                    logger.info("Admin user already exists")
            
            # Migrate ALL users with plaintext passwords to bcrypt
            import bcrypt as _bc
            plaintext_users = []
            async for u in db.users.find({}, {"_id": 0, "email": 1, "password": 1}):
                pw = u.get("password", "")
                if pw and not (pw.startswith("$2b$") or pw.startswith("$2a$")):
                    plaintext_users.append(u["email"])
            if plaintext_users:
                for email in plaintext_users:
                    user_doc = await db.users.find_one({"email": email}, {"_id": 0, "password": 1})
                    raw_pw = user_doc["password"]
                    hashed = _bc.hashpw(raw_pw.encode("utf-8"), _bc.gensalt()).decode("utf-8")
                    await db.users.update_one({"email": email}, {"$set": {"password": hashed}})
                logger.info(f"Migrated {len(plaintext_users)} user passwords to bcrypt")
            
        except Exception as seed_err:
            logger.error(f"Admin seed error: {seed_err}")
        
        # Initialize object storage for chat file uploads
        try:
            from routes.chat import init_storage
            init_storage()
        except Exception as storage_err:
            logger.warning(f"Object storage init (will retry on first upload): {storage_err}")
            
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
