"""
Cloud storage service - supports AWS S3, Google Cloud Storage, Cloudflare R2.
Provides unified interface for file upload/download with provider switching.
"""
from typing import Optional, BinaryIO, Dict, Any, List
from datetime import datetime, timezone
import os
import base64
import logging
import asyncio

from config import db, fs_recordings, fs_chat_files

logger = logging.getLogger(__name__)


# Storage provider types
STORAGE_PROVIDERS = {
    "gridfs": {
        "name": "MongoDB GridFS",
        "description": "Default storage using MongoDB GridFS (no external credentials needed)",
        "fields": []
    },
    "aws_s3": {
        "name": "AWS S3",
        "description": "Amazon Web Services S3 bucket storage",
        "fields": [
            {"key": "access_key_id", "label": "Access Key ID", "type": "text", "required": True},
            {"key": "secret_access_key", "label": "Secret Access Key", "type": "password", "required": True},
            {"key": "bucket_name", "label": "Bucket Name", "type": "text", "required": True},
            {"key": "region", "label": "Region", "type": "text", "required": True, "default": "us-east-1"},
            {"key": "endpoint_url", "label": "Custom Endpoint URL (optional)", "type": "text", "required": False}
        ]
    },
    "google_cloud": {
        "name": "Google Cloud Storage",
        "description": "Google Cloud Platform storage bucket",
        "fields": [
            {"key": "project_id", "label": "Project ID", "type": "text", "required": True},
            {"key": "bucket_name", "label": "Bucket Name", "type": "text", "required": True},
            {"key": "credentials_json", "label": "Service Account JSON", "type": "textarea", "required": True}
        ]
    },
    "cloudflare_r2": {
        "name": "Cloudflare R2",
        "description": "Cloudflare R2 object storage (S3-compatible)",
        "fields": [
            {"key": "account_id", "label": "Account ID", "type": "text", "required": True},
            {"key": "access_key_id", "label": "Access Key ID", "type": "text", "required": True},
            {"key": "secret_access_key", "label": "Secret Access Key", "type": "password", "required": True},
            {"key": "bucket_name", "label": "Bucket Name", "type": "text", "required": True}
        ]
    },
    "backblaze_b2": {
        "name": "Backblaze B2",
        "description": "Backblaze B2 cloud storage (S3-compatible)",
        "fields": [
            {"key": "application_key_id", "label": "Application Key ID", "type": "text", "required": True},
            {"key": "application_key", "label": "Application Key", "type": "password", "required": True},
            {"key": "bucket_name", "label": "Bucket Name", "type": "text", "required": True},
            {"key": "endpoint_url", "label": "Endpoint URL", "type": "text", "required": True}
        ]
    }
}


class CloudStorageService:
    """Unified cloud storage service with multiple provider support"""
    
    def __init__(self):
        self.provider = "gridfs"  # Default
        self.config = {}
        self.client = None
    
    async def load_config(self):
        """Load storage configuration from database"""
        settings = await db.admin_settings.find_one({"category": "cloud_storage"})
        if settings:
            self.provider = settings.get("settings", {}).get("provider", "gridfs")
            self.config = settings.get("settings", {}).get("config", {})
        return self.provider, self.config
    
    async def save_config(self, provider: str, config: Dict[str, Any]):
        """Save storage configuration to database"""
        # Validate provider
        if provider not in STORAGE_PROVIDERS:
            raise ValueError(f"Invalid provider: {provider}")
        
        # Don't store in plain text - in production, use encryption
        settings = {
            "provider": provider,
            "config": config,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.admin_settings.update_one(
            {"category": "cloud_storage"},
            {"$set": {"category": "cloud_storage", "settings": settings}},
            upsert=True
        )
        
        self.provider = provider
        self.config = config
        
        return True
    
    async def test_connection(self, provider: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Test connection to storage provider"""
        try:
            if provider == "gridfs":
                # GridFS is always available
                return {"success": True, "message": "GridFS is ready"}
            
            elif provider == "aws_s3":
                import boto3
                from botocore.exceptions import ClientError
                
                client = boto3.client(
                    's3',
                    aws_access_key_id=config.get('access_key_id'),
                    aws_secret_access_key=config.get('secret_access_key'),
                    region_name=config.get('region', 'us-east-1'),
                    endpoint_url=config.get('endpoint_url') or None
                )
                
                # Try to list objects (limited)
                client.list_objects_v2(Bucket=config.get('bucket_name'), MaxKeys=1)
                return {"success": True, "message": "AWS S3 connection successful"}
            
            elif provider == "cloudflare_r2":
                import boto3
                
                endpoint = f"https://{config.get('account_id')}.r2.cloudflarestorage.com"
                client = boto3.client(
                    's3',
                    aws_access_key_id=config.get('access_key_id'),
                    aws_secret_access_key=config.get('secret_access_key'),
                    endpoint_url=endpoint
                )
                
                client.list_objects_v2(Bucket=config.get('bucket_name'), MaxKeys=1)
                return {"success": True, "message": "Cloudflare R2 connection successful"}
            
            elif provider == "google_cloud":
                from google.cloud import storage
                import json
                
                creds_dict = json.loads(config.get('credentials_json'))
                client = storage.Client.from_service_account_info(creds_dict)
                bucket = client.bucket(config.get('bucket_name'))
                bucket.exists()
                return {"success": True, "message": "Google Cloud Storage connection successful"}
            
            elif provider == "backblaze_b2":
                import boto3
                
                client = boto3.client(
                    's3',
                    aws_access_key_id=config.get('application_key_id'),
                    aws_secret_access_key=config.get('application_key'),
                    endpoint_url=config.get('endpoint_url')
                )
                
                client.list_objects_v2(Bucket=config.get('bucket_name'), MaxKeys=1)
                return {"success": True, "message": "Backblaze B2 connection successful"}
            
            else:
                return {"success": False, "message": f"Unknown provider: {provider}"}
                
        except ImportError as e:
            return {"success": False, "message": f"Missing dependency: {str(e)}. Please install required packages."}
        except Exception as e:
            logger.error(f"Storage connection test failed: {e}")
            return {"success": False, "message": str(e)}
    
    async def upload_file(self, file_data: bytes, filename: str, content_type: str, metadata: Dict = None) -> Dict[str, Any]:
        """Upload file to configured storage provider"""
        await self.load_config()
        
        if self.provider == "gridfs":
            # Use existing GridFS logic
            return {"provider": "gridfs", "requires_gridfs": True}
        
        try:
            if self.provider == "aws_s3":
                return await self._upload_s3(file_data, filename, content_type, metadata)
            elif self.provider == "cloudflare_r2":
                return await self._upload_r2(file_data, filename, content_type, metadata)
            elif self.provider == "google_cloud":
                return await self._upload_gcs(file_data, filename, content_type, metadata)
            elif self.provider == "backblaze_b2":
                return await self._upload_b2(file_data, filename, content_type, metadata)
            else:
                return {"provider": "gridfs", "requires_gridfs": True}
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            # Fallback to GridFS
            return {"provider": "gridfs", "requires_gridfs": True, "error": str(e)}
    
    async def _upload_s3(self, file_data: bytes, filename: str, content_type: str, metadata: Dict) -> Dict:
        """Upload to AWS S3"""
        import boto3
        from io import BytesIO
        
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('access_key_id'),
            aws_secret_access_key=self.config.get('secret_access_key'),
            region_name=self.config.get('region', 'us-east-1'),
            endpoint_url=self.config.get('endpoint_url') or None
        )
        
        bucket = self.config.get('bucket_name')
        key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            key,
            ExtraArgs={
                'ContentType': content_type,
                'Metadata': metadata or {}
            }
        )
        
        # Generate URL
        url = f"https://{bucket}.s3.{self.config.get('region')}.amazonaws.com/{key}"
        
        return {
            "provider": "aws_s3",
            "key": key,
            "url": url,
            "bucket": bucket
        }
    
    async def _upload_r2(self, file_data: bytes, filename: str, content_type: str, metadata: Dict) -> Dict:
        """Upload to Cloudflare R2"""
        import boto3
        from io import BytesIO
        
        endpoint = f"https://{self.config.get('account_id')}.r2.cloudflarestorage.com"
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('access_key_id'),
            aws_secret_access_key=self.config.get('secret_access_key'),
            endpoint_url=endpoint
        )
        
        bucket = self.config.get('bucket_name')
        key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            key,
            ExtraArgs={'ContentType': content_type}
        )
        
        return {
            "provider": "cloudflare_r2",
            "key": key,
            "bucket": bucket
        }
    
    async def _upload_gcs(self, file_data: bytes, filename: str, content_type: str, metadata: Dict) -> Dict:
        """Upload to Google Cloud Storage"""
        from google.cloud import storage
        import json
        
        creds_dict = json.loads(self.config.get('credentials_json'))
        client = storage.Client.from_service_account_info(creds_dict)
        
        bucket = client.bucket(self.config.get('bucket_name'))
        key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
        
        blob = bucket.blob(key)
        blob.upload_from_string(file_data, content_type=content_type)
        
        return {
            "provider": "google_cloud",
            "key": key,
            "url": blob.public_url,
            "bucket": self.config.get('bucket_name')
        }
    
    async def _upload_b2(self, file_data: bytes, filename: str, content_type: str, metadata: Dict) -> Dict:
        """Upload to Backblaze B2"""
        import boto3
        from io import BytesIO
        
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('application_key_id'),
            aws_secret_access_key=self.config.get('application_key'),
            endpoint_url=self.config.get('endpoint_url')
        )
        
        bucket = self.config.get('bucket_name')
        key = f"uploads/{datetime.now().strftime('%Y/%m/%d')}/{filename}"
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            key,
            ExtraArgs={'ContentType': content_type}
        )
        
        return {
            "provider": "backblaze_b2",
            "key": key,
            "bucket": bucket
        }
    
    async def get_migration_status(self) -> Dict[str, Any]:
        """Get current migration status"""
        status = await db.admin_settings.find_one({"category": "storage_migration"})
        if status:
            return status.get("settings", {})
        return {
            "status": "not_started",
            "total_files": 0,
            "migrated_files": 0,
            "failed_files": 0
        }
    
    async def start_migration(self, target_provider: str) -> Dict[str, Any]:
        """Start migration to new storage provider"""
        # Count files to migrate (those still in GridFS)
        recordings_count = await db.recordings.count_documents({
            "$or": [
                {"storage_provider": {"$exists": False}},
                {"storage_provider": None},
                {"storage_provider": "gridfs"}
            ]
        })
        chat_files_count = await db.chat_files.count_documents({
            "$or": [
                {"storage_provider": {"$exists": False}},
                {"storage_provider": None},
                {"storage_provider": "gridfs"}
            ]
        })
        
        total = recordings_count + chat_files_count
        
        migration_status = {
            "status": "in_progress",
            "target_provider": target_provider,
            "total_files": total,
            "migrated_files": 0,
            "failed_files": 0,
            "current_file": None,
            "errors": [],
            "started_at": datetime.now(timezone.utc).isoformat(),
            "completed_at": None
        }
        
        await db.admin_settings.update_one(
            {"category": "storage_migration"},
            {"$set": {"category": "storage_migration", "settings": migration_status}},
            upsert=True
        )
        
        # Start migration in background
        asyncio.create_task(self._run_migration(target_provider))
        
        return migration_status
    
    async def _run_migration(self, target_provider: str):
        """Background task to migrate files from GridFS to cloud storage"""
        from bson import ObjectId
        
        migrated = 0
        failed = 0
        errors = []
        
        try:
            # Load the target provider config
            await self.load_config()
            
            # Migrate recordings
            recordings = await db.recordings.find({
                "$or": [
                    {"storage_provider": {"$exists": False}},
                    {"storage_provider": None},
                    {"storage_provider": "gridfs"}
                ]
            }).to_list(10000)
            
            for recording in recordings:
                try:
                    await self._update_migration_status(
                        migrated, failed, len(recordings) + await db.chat_files.count_documents({}),
                        f"Migrating recording: {recording.get('title', recording.get('id'))}"
                    )
                    
                    grid_id = recording.get("grid_id")
                    if not grid_id:
                        failed += 1
                        errors.append(f"Recording {recording.get('id')} has no grid_id")
                        continue
                    
                    # Read file from GridFS
                    try:
                        grid_out = await fs_recordings.open_download_stream(ObjectId(grid_id))
                        file_data = await grid_out.read()
                    except Exception as e:
                        failed += 1
                        errors.append(f"Failed to read recording {recording.get('id')} from GridFS: {str(e)}")
                        continue
                    
                    # Upload to cloud storage
                    filename = f"recordings/{recording.get('user_id')}/{recording.get('id')}.webm"
                    content_type = recording.get("mime_type", "video/webm")
                    
                    result = await self._upload_to_provider(
                        target_provider, file_data, filename, content_type
                    )
                    
                    if result.get("success"):
                        # Update database record
                        await db.recordings.update_one(
                            {"id": recording.get("id")},
                            {"$set": {
                                "storage_provider": target_provider,
                                "cloud_key": result.get("key"),
                                "cloud_url": result.get("url"),
                                "cloud_bucket": result.get("bucket"),
                                "migrated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        migrated += 1
                        logger.info(f"Migrated recording {recording.get('id')} to {target_provider}")
                    else:
                        failed += 1
                        errors.append(f"Failed to upload recording {recording.get('id')}: {result.get('error')}")
                        
                except Exception as e:
                    failed += 1
                    errors.append(f"Error migrating recording {recording.get('id')}: {str(e)}")
                    logger.error(f"Migration error for recording: {e}")
            
            # Migrate chat files
            chat_files = await db.chat_files.find({
                "$or": [
                    {"storage_provider": {"$exists": False}},
                    {"storage_provider": None},
                    {"storage_provider": "gridfs"}
                ]
            }).to_list(10000)
            
            for chat_file in chat_files:
                try:
                    await self._update_migration_status(
                        migrated, failed, len(recordings) + len(chat_files),
                        f"Migrating chat file: {chat_file.get('file_name', chat_file.get('id'))}"
                    )
                    
                    grid_id = chat_file.get("grid_id")
                    if not grid_id:
                        failed += 1
                        errors.append(f"Chat file {chat_file.get('id')} has no grid_id")
                        continue
                    
                    # Read file from GridFS
                    try:
                        grid_out = await fs_chat_files.open_download_stream(ObjectId(grid_id))
                        file_data = await grid_out.read()
                    except Exception as e:
                        failed += 1
                        errors.append(f"Failed to read chat file {chat_file.get('id')} from GridFS: {str(e)}")
                        continue
                    
                    # Upload to cloud storage
                    filename = f"chat_files/{chat_file.get('user_id')}/{chat_file.get('id')}/{chat_file.get('file_name')}"
                    content_type = chat_file.get("content_type", "application/octet-stream")
                    
                    result = await self._upload_to_provider(
                        target_provider, file_data, filename, content_type
                    )
                    
                    if result.get("success"):
                        # Update database record
                        await db.chat_files.update_one(
                            {"id": chat_file.get("id")},
                            {"$set": {
                                "storage_provider": target_provider,
                                "cloud_key": result.get("key"),
                                "cloud_url": result.get("url"),
                                "cloud_bucket": result.get("bucket"),
                                "migrated_at": datetime.now(timezone.utc).isoformat()
                            }}
                        )
                        migrated += 1
                        logger.info(f"Migrated chat file {chat_file.get('id')} to {target_provider}")
                    else:
                        failed += 1
                        errors.append(f"Failed to upload chat file {chat_file.get('id')}: {result.get('error')}")
                        
                except Exception as e:
                    failed += 1
                    errors.append(f"Error migrating chat file {chat_file.get('id')}: {str(e)}")
                    logger.error(f"Migration error for chat file: {e}")
            
            # Mark migration as complete
            final_status = {
                "status": "completed" if failed == 0 else "completed_with_errors",
                "target_provider": target_provider,
                "total_files": len(recordings) + len(chat_files),
                "migrated_files": migrated,
                "failed_files": failed,
                "errors": errors[-50:] if errors else [],  # Keep last 50 errors
                "started_at": (await self.get_migration_status()).get("started_at"),
                "completed_at": datetime.now(timezone.utc).isoformat()
            }
            
            await db.admin_settings.update_one(
                {"category": "storage_migration"},
                {"$set": {"settings": final_status}}
            )
            
            logger.info(f"Migration completed: {migrated} migrated, {failed} failed")
            
        except Exception as e:
            logger.error(f"Migration failed with exception: {e}")
            await db.admin_settings.update_one(
                {"category": "storage_migration"},
                {"$set": {"settings": {
                    "status": "failed",
                    "error": str(e),
                    "migrated_files": migrated,
                    "failed_files": failed,
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }}}
            )
    
    async def _update_migration_status(self, migrated: int, failed: int, total: int, current_file: str):
        """Update migration progress in database"""
        await db.admin_settings.update_one(
            {"category": "storage_migration"},
            {"$set": {
                "settings.migrated_files": migrated,
                "settings.failed_files": failed,
                "settings.total_files": total,
                "settings.current_file": current_file
            }}
        )
    
    async def _upload_to_provider(self, provider: str, file_data: bytes, filename: str, content_type: str) -> Dict[str, Any]:
        """Upload file to specific cloud provider"""
        try:
            if provider == "aws_s3":
                return await self._upload_s3_migration(file_data, filename, content_type)
            elif provider == "cloudflare_r2":
                return await self._upload_r2_migration(file_data, filename, content_type)
            elif provider == "google_cloud":
                return await self._upload_gcs_migration(file_data, filename, content_type)
            elif provider == "backblaze_b2":
                return await self._upload_b2_migration(file_data, filename, content_type)
            else:
                return {"success": False, "error": f"Unknown provider: {provider}"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    async def _upload_s3_migration(self, file_data: bytes, filename: str, content_type: str) -> Dict:
        """Upload to AWS S3 for migration"""
        import boto3
        from io import BytesIO
        
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('access_key_id'),
            aws_secret_access_key=self.config.get('secret_access_key'),
            region_name=self.config.get('region', 'us-east-1'),
            endpoint_url=self.config.get('endpoint_url') or None
        )
        
        bucket = self.config.get('bucket_name')
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            filename,
            ExtraArgs={'ContentType': content_type}
        )
        
        url = f"https://{bucket}.s3.{self.config.get('region')}.amazonaws.com/{filename}"
        
        return {
            "success": True,
            "key": filename,
            "url": url,
            "bucket": bucket
        }
    
    async def _upload_r2_migration(self, file_data: bytes, filename: str, content_type: str) -> Dict:
        """Upload to Cloudflare R2 for migration"""
        import boto3
        from io import BytesIO
        
        endpoint = f"https://{self.config.get('account_id')}.r2.cloudflarestorage.com"
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('access_key_id'),
            aws_secret_access_key=self.config.get('secret_access_key'),
            endpoint_url=endpoint
        )
        
        bucket = self.config.get('bucket_name')
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            filename,
            ExtraArgs={'ContentType': content_type}
        )
        
        return {
            "success": True,
            "key": filename,
            "bucket": bucket
        }
    
    async def _upload_gcs_migration(self, file_data: bytes, filename: str, content_type: str) -> Dict:
        """Upload to Google Cloud Storage for migration"""
        from google.cloud import storage
        import json
        
        creds_dict = json.loads(self.config.get('credentials_json'))
        client = storage.Client.from_service_account_info(creds_dict)
        
        bucket = client.bucket(self.config.get('bucket_name'))
        blob = bucket.blob(filename)
        blob.upload_from_string(file_data, content_type=content_type)
        
        return {
            "success": True,
            "key": filename,
            "url": blob.public_url,
            "bucket": self.config.get('bucket_name')
        }
    
    async def _upload_b2_migration(self, file_data: bytes, filename: str, content_type: str) -> Dict:
        """Upload to Backblaze B2 for migration"""
        import boto3
        from io import BytesIO
        
        client = boto3.client(
            's3',
            aws_access_key_id=self.config.get('application_key_id'),
            aws_secret_access_key=self.config.get('application_key'),
            endpoint_url=self.config.get('endpoint_url')
        )
        
        bucket = self.config.get('bucket_name')
        
        client.upload_fileobj(
            BytesIO(file_data),
            bucket,
            filename,
            ExtraArgs={'ContentType': content_type}
        )
        
        return {
            "success": True,
            "key": filename,
            "bucket": bucket
        }
    
    async def get_file_url(self, file_record: Dict) -> Optional[str]:
        """Get download URL for a file based on its storage provider"""
        provider = file_record.get("storage_provider")
        
        if not provider or provider == "gridfs":
            return None  # Use GridFS streaming
        
        cloud_url = file_record.get("cloud_url")
        if cloud_url:
            return cloud_url
        
        # Generate presigned URL for private files
        cloud_key = file_record.get("cloud_key")
        if not cloud_key:
            return None
        
        try:
            await self.load_config()
            
            if provider == "aws_s3":
                import boto3
                client = boto3.client(
                    's3',
                    aws_access_key_id=self.config.get('access_key_id'),
                    aws_secret_access_key=self.config.get('secret_access_key'),
                    region_name=self.config.get('region', 'us-east-1')
                )
                url = client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': file_record.get('cloud_bucket'), 'Key': cloud_key},
                    ExpiresIn=3600  # 1 hour
                )
                return url
            
            elif provider == "cloudflare_r2":
                import boto3
                endpoint = f"https://{self.config.get('account_id')}.r2.cloudflarestorage.com"
                client = boto3.client(
                    's3',
                    aws_access_key_id=self.config.get('access_key_id'),
                    aws_secret_access_key=self.config.get('secret_access_key'),
                    endpoint_url=endpoint
                )
                url = client.generate_presigned_url(
                    'get_object',
                    Params={'Bucket': file_record.get('cloud_bucket'), 'Key': cloud_key},
                    ExpiresIn=3600
                )
                return url
            
        except Exception as e:
            logger.error(f"Error generating presigned URL: {e}")
        
        return None


# Global instance
storage_service = CloudStorageService()
