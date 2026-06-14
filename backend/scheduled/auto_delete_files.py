"""
Auto-deletion scheduled job for AI-generated files.
Runs daily, deletes files older than the configured retention period.
"""
import logging
from datetime import datetime, timezone, timedelta

from config import db

logger = logging.getLogger(__name__)

DEFAULT_CONFIG = {
    "enabled": False,
    "retention_days": 30,
    "exclude_starred": True,
    "dry_run": False,
}


async def get_auto_delete_config() -> dict:
    config = await db.admin_settings.find_one({"category": "auto_delete_policy"}, {"_id": 0})
    if not config:
        return {**DEFAULT_CONFIG}
    return {
        "enabled": config.get("settings", {}).get("enabled", False),
        "retention_days": config.get("settings", {}).get("retention_days", 30),
        "exclude_starred": config.get("settings", {}).get("exclude_starred", True),
        "dry_run": config.get("settings", {}).get("dry_run", False),
    }


async def run_auto_deletion():
    """Scheduled job: delete AI-generated files older than retention period."""
    try:
        config = await get_auto_delete_config()
        if not config["enabled"]:
            return

        retention_days = config["retention_days"]
        exclude_starred = config["exclude_starred"]
        dry_run = config["dry_run"]

        cutoff = (datetime.now(timezone.utc) - timedelta(days=retention_days)).isoformat()
        logger.info(f"Auto-delete: scanning files older than {retention_days} days (cutoff: {cutoff}, dry_run={dry_run})")

        # Get starred/pinned conversation IDs to exclude
        excluded_conv_ids = set()
        if exclude_starred:
            starred = await db.ai_conversations.find(
                {"pinned": True},
                {"_id": 0, "id": 1}
            ).to_list(10000)
            excluded_conv_ids = {c["id"] for c in starred}

        # Find files older than cutoff
        query = {"created_at": {"$lt": cutoff}}
        if excluded_conv_ids:
            query["conversation_id"] = {"$nin": list(excluded_conv_ids)}

        old_files = await db.ai_generated_files.find(query, {"_id": 0}).to_list(10000)
        if not old_files:
            logger.info("Auto-delete: no files to delete")
            return

        logger.info(f"Auto-delete: found {len(old_files)} files to {'preview' if dry_run else 'delete'}")

        if dry_run:
            # Log what would be deleted without actually deleting
            await db.admin_settings.update_one(
                {"category": "auto_delete_policy"},
                {"$set": {
                    "last_dry_run": datetime.now(timezone.utc).isoformat(),
                    "last_dry_run_count": len(old_files),
                    "last_dry_run_size": sum(f.get("file_size", 0) for f in old_files),
                }},
            )
            return

        # Delete from object storage
        deleted_count = 0
        freed_bytes = 0
        affected_users = set()

        for file_doc in old_files:
            try:
                storage_path = file_doc.get("storage_path", "")
                if storage_path:
                    try:
                        from routes.ai_chat_config import get_object, put_object_sync, STORAGE_URL, _init_storage
                        import requests
                        key = _init_storage()
                        if key:
                            requests.delete(
                                f"{STORAGE_URL}/objects/{storage_path}",
                                headers={"X-Storage-Key": key},
                                timeout=10
                            )
                    except Exception:
                        pass  # storage delete is best-effort

                # Delete metadata
                await db.ai_generated_files.delete_one({"id": file_doc["id"]})
                deleted_count += 1
                freed_bytes += file_doc.get("file_size", 0)
                if file_doc.get("user_id"):
                    affected_users.add(file_doc["user_id"])
            except Exception as e:
                logger.error(f"Auto-delete: failed to delete {file_doc.get('id')}: {e}")

        # Reset quota alerts for affected users
        for user_id in affected_users:
            try:
                from routes.storage_quotas import check_quota
                quota = await check_quota(user_id)
                if quota.get("usage_pct", 0) < 80:
                    await db.quota_alerts.delete_many({"user_id": user_id})
            except Exception:
                pass

        # Log the run
        await db.admin_settings.update_one(
            {"category": "auto_delete_policy"},
            {"$set": {
                "last_run": datetime.now(timezone.utc).isoformat(),
                "last_run_deleted": deleted_count,
                "last_run_freed": freed_bytes,
                "last_run_users_affected": len(affected_users),
            }},
        )

        logger.info(f"Auto-delete complete: {deleted_count} files deleted, {freed_bytes} bytes freed, {len(affected_users)} users affected")

    except Exception as e:
        logger.error(f"Auto-delete job failed: {e}")
