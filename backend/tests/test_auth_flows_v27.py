"""
Authentication Flow Tests - Iteration 27
Tests: Admin login, User signup with email verification, User login, Resend verification
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"
TEST_USER_PREFIX = "TEST_iter27_"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="module")
def test_email():
    """Generate unique test email"""
    return f"{TEST_USER_PREFIX}{uuid.uuid4().hex[:8]}@example.com"

# ============== Health Check Tests ==============
class TestHealthCheck:
    """API health check tests"""
    
    def test_api_health(self, api_client):
        """Test GET /api/health returns status=healthy"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "healthy"
        print(f"✓ Health check passed: {data}")

# ============== Admin Login Tests ==============
class TestAdminLogin:
    """Admin login tests - POST /api/auth/login"""
    
    def test_admin_login_returns_token_and_user(self, api_client):
        """Admin login with admin@munal.com / Admin@123456 should return token and user with role=Admin"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify token present
        assert "token" in data, "Response missing 'token'"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 50  # JWT tokens are long
        
        # Verify user object
        assert "user" in data, "Response missing 'user'"
        user = data["user"]
        assert user["email"] == ADMIN_EMAIL
        assert user["role"] == "Admin", f"Expected role='Admin', got '{user.get('role')}'"
        assert user["name"] == "Admin User"
        
        # Admin should NOT require verification
        assert data.get("requires_verification") != True, "Admin should not require verification"
        
        print(f"✓ Admin login successful: {user['email']} with role={user['role']}")

    def test_admin_login_invalid_password(self, api_client):
        """Admin login with wrong password should return 401"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data or "error" in data
        print("✓ Invalid password correctly rejected with 401")

# ============== User Signup Tests ==============
class TestUserSignup:
    """User signup tests - POST /api/auth/register"""
    
    def test_user_signup_creates_unverified_user(self, api_client, test_email):
        """POST /api/auth/register should create unverified user and return requires_verification=true"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": test_email,
            "password": "TestPass123456",
            "name": "Test User 27"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify requires_verification flag
        assert data.get("requires_verification") == True, "Expected requires_verification=true"
        
        # Verify token present
        assert "token" in data, "Response missing token"
        
        # Verify user created with email_verified=false
        user = data["user"]
        assert user["email"] == test_email.lower()
        assert user["email_verified"] == False
        
        print(f"✓ User signup successful: {test_email} with requires_verification=true")
        return test_email

    def test_duplicate_signup_rejected(self, api_client):
        """POST /api/auth/register with existing verified email should return 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,  # Admin is already verified
            "password": "TestPass123",
            "name": "Duplicate Test"
        })
        assert response.status_code == 400
        data = response.json()
        assert "already registered" in data.get("detail", "").lower()
        print("✓ Duplicate email correctly rejected with 400")

# ============== Email Verification Tests ==============
class TestEmailVerification:
    """Email verification tests"""
    
    def test_verify_email_wrong_code_rejected(self, api_client, test_email):
        """POST /api/auth/verify-email with wrong code should return 400"""
        response = api_client.post(f"{BASE_URL}/api/auth/verify-email", json={
            "email": test_email,
            "code": "000000"  # Wrong code
        })
        # Should return 400 or 404 depending on if user exists
        assert response.status_code in [400, 404]
        print("✓ Wrong verification code correctly rejected")

    def test_resend_verification(self, api_client, test_email):
        """POST /api/auth/resend-verification should send new code"""
        # First create a test user
        email = f"{TEST_USER_PREFIX}resend_{uuid.uuid4().hex[:6]}@example.com"
        api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": "TestPass123",
            "name": "Resend Test"
        })
        
        # Now test resend
        response = api_client.post(f"{BASE_URL}/api/auth/resend-verification", json={
            "email": email
        })
        assert response.status_code == 200
        data = response.json()
        assert "sent" in data.get("message", "").lower() or "verification" in data.get("message", "").lower()
        print(f"✓ Resend verification successful for {email}")

# ============== User Login Tests ==============
class TestUserLogin:
    """User login tests for verified and unverified users"""
    
    def test_unverified_user_login_returns_requires_verification(self, api_client):
        """POST /api/auth/login for unverified user should return requires_verification=true"""
        # Create new unverified user
        email = f"{TEST_USER_PREFIX}unverified_{uuid.uuid4().hex[:6]}@example.com"
        password = "TestPass123456"
        
        api_client.post(f"{BASE_URL}/api/auth/register", json={
            "email": email,
            "password": password,
            "name": "Unverified Test"
        })
        
        # Try to login
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should require verification
        assert data.get("requires_verification") == True, "Expected requires_verification=true for unverified user"
        print(f"✓ Unverified user login correctly returns requires_verification=true")

    def test_verified_user_login_no_verification_required(self, api_client):
        """POST /api/auth/login for verified user (admin) should NOT return requires_verification"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should NOT have requires_verification (or it should be false)
        assert data.get("requires_verification") != True, "Verified user should not require verification"
        print("✓ Verified user login does not require verification")

# ============== Cleanup Tests ==============
class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_users(self, api_client):
        """Clean up test users created during testing"""
        # Get all users
        response = api_client.get(f"{BASE_URL}/api/users")
        if response.status_code == 200:
            users = response.json()
            deleted_count = 0
            for user in users:
                if user.get("email", "").startswith(TEST_USER_PREFIX.lower()):
                    delete_resp = api_client.delete(f"{BASE_URL}/api/users/{user['id']}")
                    if delete_resp.status_code in [200, 204]:
                        deleted_count += 1
            print(f"✓ Cleaned up {deleted_count} test users")
        else:
            print("⚠ Could not retrieve users for cleanup")
