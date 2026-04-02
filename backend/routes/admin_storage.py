"""
Admin Cloud Storage Routes — provider config, migration, testing.
Split from admin.py for maintainability.
"""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel
from config import db, logger
from services.storage import storage_service, STORAGE_PROVIDERS
import uuid

router = APIRouter(prefix="/admin", tags=["Admin Storage"])


def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.headers.get("x-real-ip") or (request.client.host if request.client else "unknown")

def get_user_agent(request: Request) -> str:
    return request.headers.get("user-agent", "unknown")

async def _audit(action, category="storage", ip=None, ua=None, details=None):
    doc = {
        "id": str(uuid.uuid4()), "action": action, "category": category, "severity": "info",
        "details": details or {}, "ip_address": ip, "user_agent": ua,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await db.audit_logs.insert_one(doc)


class CloudStorageConfig(BaseModel):
    provider: str
    config: Dict[str, str]

class MigrationRequest(BaseModel):
    target_provider: str


@router.get("/storage/providers")
async def get_storage_providers():
    return {"providers": STORAGE_PROVIDERS, "provider_list": list(STORAGE_PROVIDERS.keys())}


@router.get("/storage/config")
async def get_storage_config():
    provider, config = await storage_service.load_config()
    masked_config = {}
    if config:
        for key, value in config.items():
            if key in ['secret_access_key', 'application_key', 'credentials_json']:
                masked_config[key] = '********' if value else ''
            else:
                masked_config[key] = value
    return {
        "current_provider": provider,
        "config": masked_config,
        "provider_info": STORAGE_PROVIDERS.get(provider, {}),
    }


@router.post("/storage/config")
async def save_storage_config(config_data: CloudStorageConfig, request: Request):
    try:
        if config_data.provider not in STORAGE_PROVIDERS:
            raise HTTPException(status_code=400, detail=f"Invalid provider: {config_data.provider}")
        provider_info = STORAGE_PROVIDERS[config_data.provider]
        for field in provider_info.get("fields", []):
            if field["required"] and not config_data.config.get(field["key"]):
                raise HTTPException(status_code=400, detail=f"Missing required field: {field['label']}")
        await storage_service.save_config(config_data.provider, config_data.config)
        await _audit(f"Updated cloud storage config to {config_data.provider}", ip=get_client_ip(request), ua=get_user_agent(request))
        return {"success": True, "message": f"Storage configured for {config_data.provider}"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error saving storage config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/storage/test")
async def test_storage_connection(config_data: CloudStorageConfig):
    try:
        return await storage_service.test_connection(config_data.provider, config_data.config)
    except Exception as e:
        logger.error(f"Storage test failed: {e}")
        return {"success": False, "message": str(e)}


@router.get("/storage/migration/status")
async def get_migration_status():
    status = await storage_service.get_migration_status()
    recordings_count = await db.recordings.count_documents({})
    chat_files_count = await db.chat_files.count_documents({})
    recordings_gridfs = await db.recordings.count_documents({"storage_provider": {"$in": [None, "gridfs"]}})
    chat_files_gridfs = await db.chat_files.count_documents({"storage_provider": {"$in": [None, "gridfs"]}})
    return {
        "migration": status,
        "storage_stats": {
            "total_recordings": recordings_count,
            "total_chat_files": chat_files_count,
            "recordings_in_gridfs": recordings_gridfs,
            "chat_files_in_gridfs": chat_files_gridfs,
        },
    }


@router.post("/storage/migration/start")
async def start_storage_migration(migration: MigrationRequest, request: Request):
    try:
        provider, config = await storage_service.load_config()
        if migration.target_provider != provider:
            raise HTTPException(status_code=400, detail=f"Target provider '{migration.target_provider}' is not configured.")
        if migration.target_provider == "gridfs":
            raise HTTPException(status_code=400, detail="Cannot migrate to GridFS.")
        test_result = await storage_service.test_connection(provider, config)
        if not test_result.get("success"):
            raise HTTPException(status_code=400, detail=f"Connection test failed: {test_result.get('message')}")
        status = await storage_service.start_migration(migration.target_provider)
        await _audit(f"Started storage migration to {migration.target_provider}", ip=get_client_ip(request), ua=get_user_agent(request), details={"total_files": status.get("total_files")})
        return {"success": True, "message": f"Migration started to {migration.target_provider}", "status": status}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting migration: {e}")
        raise HTTPException(status_code=500, detail=str(e))
