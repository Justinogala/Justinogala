"""
Shared configuration and database connections for the application.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection — CUSTOM_MONGO_URL takes priority (for user's Atlas DB)
mongo_url = os.environ.get('CUSTOM_MONGO_URL') or os.environ.get('MONGO_URL', '')
db_name = os.environ.get('CUSTOM_DB_NAME') or os.environ.get('DB_NAME', 'munal_db')
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000, connectTimeoutMS=5000)
db = client[db_name]

# GridFS buckets for file storage
fs_recordings = AsyncIOMotorGridFSBucket(db, bucket_name="recordings")
fs_chat_files = AsyncIOMotorGridFSBucket(db, bucket_name="chat_files")
fs_workspace_files = AsyncIOMotorGridFSBucket(db, bucket_name="workspace_files")

# JWT Configuration
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'default-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Resend Configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
