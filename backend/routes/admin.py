"""
Admin routes — thin shell that re-exports all domain-specific admin routers.
The actual route logic lives in:
  - admin_settings.py  (settings, SMTP, 2FA enforcement, security policies)
  - admin_users.py     (user listing, activity, account actions, analytics)
  - admin_billing.py   (coupons, tax rates)
  - admin_monitoring.py (dashboard, system health)
  - admin_storage.py   (cloud storage config, migration)
  - admin_video.py     (video history, video API key settings)
  - admin_messages.py  (chat, internal messages, exports, broadcasts)
"""
from fastapi import APIRouter

from routes.admin_settings import router as settings_router
from routes.admin_users import router as users_router
from routes.admin_billing import router as billing_router
from routes.admin_monitoring import router as monitoring_router
from routes.admin_storage import router as storage_router
from routes.admin_video import router as video_router
from routes.admin_messages import router as messages_router

# Composite router — server.py includes this single router
router = APIRouter()

for sub in [settings_router, users_router, billing_router, monitoring_router, storage_router, video_router, messages_router]:
    router.include_router(sub)
