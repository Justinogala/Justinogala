"""
Email Verification Feature Tests
Tests for signup verification flow, verify-email, resend-verification, and login behavior
"""
import pytest
import requests
import os
import random
import string
from datetime import datetime
from pymongo import MongoClient

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://access-matrix-3.preview.emergentagent.com').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', "mongodb+srv://justinoo2001_db_user:T8H0xkIcmK2Qorae@cluster0.t5u88mk.mongodb.net/?retryWrites=true&w=majority")
DB_NAME = "munal_db"

def generate_test_email():
    """Generate a unique test email"""
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"TEST_verification_{suffix}@test.local"


class TestEmailVerificationBackend:
    """Test email verification backend API endpoints"""
    
    @pytest.fixture(scope="class")
    def mongo_client(self):
        """MongoDB client for direct DB access to get verification codes"""
        client = MongoClient(MONGO_URL)
        yield client
        client.close()
    
    @pytest.fixture(scope="class")
    def api_client(self):
        """Shared requests session"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        return session
    
    @pytest.fixture(scope="class")
    def test_user_data(self):
        """Generate test user data"""
        return {
            "email": generate_test_email(),
            "password": "TestPass123!",
            "name": "Test Verification User"
        }
    
    def test_api_health(self, api_client):
        """Verify API is accessible"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"API health: {data}")
    
    def test_register_creates_unverified_user(self, api_client, test_user_data, mongo_client):
        """POST /api/auth/register creates user with email_verified=false and requires_verification=true"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json=test_user_data)
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Check response has required fields
        assert "user" in data, "Response missing 'user' field"
        assert "token" in data, "Response missing 'token' field"
        assert "requires_verification" in data, "Response missing 'requires_verification' field"
        
        # Verify requires_verification is True for new signups
        assert data["requires_verification"] == True, f"Expected requires_verification=True, got {data['requires_verification']}"
        
        # Verify user has email_verified=false
        user = data["user"]
        assert user.get("email_verified") == False, f"Expected email_verified=false, got {user.get('email_verified')}"
        
        print(f"Registration successful: user={user['email']}, requires_verification={data['requires_verification']}")
        
        # Small delay to allow DB write to complete
        import time
        time.sleep(0.5)
        
        # Verify in MongoDB that verification code was created
        db = mongo_client[DB_NAME]
        # Email is lowercased in the backend
        db_user = db.users.find_one({"email": test_user_data["email"].lower()})
        assert db_user is not None, "User not found in database"
        assert "verification_code" in db_user, "Verification code not created in database"
        assert len(db_user["verification_code"]) == 6, "Verification code should be 6 digits"
        
        print(f"Verification code in DB: {db_user['verification_code']}")
        
    def test_verify_email_with_correct_code(self, api_client, test_user_data, mongo_client):
        """POST /api/auth/verify-email with correct code returns verified=true and JWT token"""
        import time
        time.sleep(0.5)
        db = mongo_client[DB_NAME]
        db_user = db.users.find_one({"email": test_user_data["email"].lower()})
        
        if not db_user:
            pytest.skip("Test user not found - run registration test first")
        
        verification_code = db_user.get("verification_code")
        assert verification_code, "No verification code found in database"
        
        response = api_client.post(f"{BASE_URL}/api/auth/verify-email", json={
            "email": test_user_data["email"],
            "code": verification_code
        })
        
        assert response.status_code == 200, f"Verification failed: {response.text}"
        data = response.json()
        
        assert data["verified"] == True, f"Expected verified=true, got {data.get('verified')}"
        assert "token" in data, "Response should include JWT token after verification"
        assert "user" in data, "Response should include user data after verification"
        
        user = data["user"]
        assert user["email_verified"] == True, "User should be marked as email_verified=true"
        
        print(f"Email verification successful for {test_user_data['email']}")
    
    def test_verify_email_with_wrong_code(self, api_client, test_user_data, mongo_client):
        """POST /api/auth/verify-email with wrong code returns 400 error"""
        # First, re-register user to get a fresh verification code
        test_email = generate_test_email()
        
        register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Wrong Code Test User"
        })
        assert register_response.status_code == 200
        
        # Try with wrong code
        response = api_client.post(f"{BASE_URL}/api/auth/verify-email", json={
            "email": test_email,
            "code": "000000"  # Wrong code
        })
        
        assert response.status_code == 400, f"Expected 400 for wrong code, got {response.status_code}"
        data = response.json()
        assert "detail" in data or "error" in data or "message" in data
        
        print(f"Wrong code correctly rejected: {data}")
        
        # Cleanup
        db = mongo_client[DB_NAME]
        db.users.delete_one({"email": test_email})
    
    def test_resend_verification_sends_new_code(self, api_client, mongo_client):
        """POST /api/auth/resend-verification sends new code"""
        # Create a fresh unverified user
        test_email = generate_test_email()
        
        register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123!",
            "name": "Resend Test User"
        })
        assert register_response.status_code == 200
        
        # Small delay to allow DB write to complete
        import time
        time.sleep(0.5)
        
        # Get original code
        db = mongo_client[DB_NAME]
        original_user = db.users.find_one({"email": test_email.lower()})
        original_code = original_user.get("verification_code")
        
        # Request resend
        response = api_client.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": test_email
        })
        
        assert response.status_code == 200, f"Resend failed: {response.text}"
        data = response.json()
        assert "message" in data
        
        # Verify new code was generated (may be same or different)
        time.sleep(0.5)
        updated_user = db.users.find_one({"email": test_email.lower()})
        new_code = updated_user.get("verification_code")
        assert new_code is not None, "New verification code should exist"
        assert len(new_code) == 6, "Verification code should be 6 digits"
        
        print(f"Resend verification successful. Original: {original_code}, New: {new_code}")
        
        # Cleanup
        db.users.delete_one({"email": test_email})
    
    def test_login_unverified_user_returns_requires_verification(self, api_client, mongo_client):
        """POST /api/auth/login for unverified user returns requires_verification=true"""
        # Create unverified user
        test_email = generate_test_email()
        password = "TestPass123!"
        
        register_response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": password,
            "name": "Unverified Login Test User"
        })
        assert register_response.status_code == 200
        
        # Try to login without verifying
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": test_email,
            "password": password
        })
        
        assert response.status_code == 200, f"Login request failed: {response.text}"
        data = response.json()
        
        assert "requires_verification" in data, "Response should include requires_verification flag"
        assert data["requires_verification"] == True, f"Expected requires_verification=True, got {data['requires_verification']}"
        assert "token" in data, "Response should include token for verification redirect"
        assert "user" in data, "Response should include user info"
        
        print(f"Unverified user login correctly returns requires_verification=true")
        
        # Cleanup
        db = mongo_client[DB_NAME]
        db.users.delete_one({"email": test_email})
    
    def test_login_verified_user_no_requires_verification(self, api_client):
        """POST /api/auth/login for verified user (admin@munal.com) does NOT return requires_verification"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@munal.com",
            "password": "Admin@123456"
        })
        
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        
        # For verified users, requires_verification should NOT be present or should be False/None
        requires_verification = data.get("requires_verification")
        assert requires_verification is None or requires_verification == False, \
            f"Verified user should not have requires_verification=True, got {requires_verification}"
        
        assert "user" in data, "Response should include user data"
        assert "token" in data, "Response should include JWT token"
        
        user = data["user"]
        assert user["email"] == "admin@munal.com"
        print(f"Admin login successful without requires_verification flag")


class TestCleanup:
    """Cleanup test data after all tests"""
    
    def test_cleanup_test_users(self):
        """Remove all test users created during testing"""
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Delete all test users (those with TEST_ prefix in email)
        result = db.users.delete_many({"email": {"$regex": "^TEST_"}})
        print(f"Cleaned up {result.deleted_count} test users")
        
        client.close()
