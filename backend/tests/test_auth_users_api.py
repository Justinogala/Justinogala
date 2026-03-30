"""
Auth and Users API Tests - Testing authentication, user CRUD operations
This test validates the auth system is properly connected to MongoDB
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-dashboard-1081.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"


class TestHealthCheck:
    """Basic health and connectivity tests"""
    
    def test_api_accessible(self):
        """Test that API is accessible"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200, f"API not accessible: {response.status_code}"
        print("✓ API is accessible")


class TestUserLogin:
    """Login endpoint tests - validates MongoDB auth integration"""
    
    def test_admin_login_success(self):
        """Test admin login with correct credentials - should authenticate against MongoDB"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        
        user = data["user"]
        assert user["email"] == ADMIN_EMAIL, f"Email mismatch: {user.get('email')}"
        assert user["role"] == "Admin", f"Role should be Admin, got: {user.get('role')}"
        assert user["name"] == "Admin User", f"Name should be 'Admin User', got: {user.get('name')}"
        
        print(f"✓ Admin login successful - User: {user['name']}, Role: {user['role']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@email.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401, f"Expected 401, got: {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_login_response_has_required_fields(self):
        """Test login response contains all required user fields"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        
        assert response.status_code == 200
        data = response.json()
        user = data["user"]
        
        # Required fields for frontend auth context
        required_fields = ["id", "email", "name", "role", "status"]
        for field in required_fields:
            assert field in user, f"Missing required field: {field}"
        
        print(f"✓ Login response has all required fields: {required_fields}")


class TestUserRegistration:
    """Registration endpoint tests"""
    
    def test_register_new_user(self):
        """Test creating a new user via registration endpoint"""
        unique_email = f"TEST_register_{uuid.uuid4().hex[:8]}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "TestPass123!",
            "name": "TEST Registration User"
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        
        data = response.json()
        assert "token" in data, "No token in registration response"
        assert "user" in data, "No user in registration response"
        
        user = data["user"]
        assert user["email"] == unique_email.lower(), f"Email mismatch: {user.get('email')}"
        assert user["role"] == "User", f"Default role should be User, got: {user.get('role')}"
        
        # Verify user was persisted - try to login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": unique_email,
            "password": "TestPass123!"
        })
        assert login_response.status_code == 200, "Could not login with newly registered user"
        
        print(f"✓ User registration successful - {unique_email}")
        
        # Cleanup - delete test user
        requests.delete(f"{BASE_URL}/api/users/{user['id']}")
    
    def test_register_duplicate_email_rejected(self):
        """Test that duplicate email registration is rejected"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": ADMIN_EMAIL,
            "password": "SomePass123!",
            "name": "Duplicate Test"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate, got: {response.status_code}"
        print("✓ Duplicate email correctly rejected with 400")


class TestGetUsers:
    """GET /api/users tests - validates real MongoDB data"""
    
    def test_get_all_users_returns_real_data(self):
        """Test GET /api/users returns REAL MongoDB users, NOT mock data"""
        response = requests.get(f"{BASE_URL}/api/users")
        
        assert response.status_code == 200
        users = response.json()
        
        assert isinstance(users, list), "Response should be a list"
        assert len(users) >= 10, f"Expected at least 10 users, got: {len(users)}"
        
        # Check for known real users
        emails = [u.get('email', '') for u in users]
        assert "admin@munal.com" in emails, "Admin user not found in users list"
        assert "justinoo2001@gmail.com" in emails, "Justin Ogala not found in users list"
        
        # Verify NO fake mock data
        names = [u.get('name', '') for u in users]
        assert "User 1" not in names, "MOCK DATA DETECTED: 'User 1' found - should be real users only"
        assert "User 2" not in names, "MOCK DATA DETECTED: 'User 2' found - should be real users only"
        assert "User 3" not in names, "MOCK DATA DETECTED: 'User 3' found - should be real users only"
        
        print(f"✓ GET /api/users returns {len(users)} REAL MongoDB users")
        print(f"  Sample users: {emails[:3]}")
    
    def test_get_user_by_id(self):
        """Test getting a specific user by ID"""
        # First get all users to get a valid ID
        response = requests.get(f"{BASE_URL}/api/users")
        users = response.json()
        
        admin_user = next((u for u in users if u.get('email') == ADMIN_EMAIL), None)
        assert admin_user is not None, "Admin user not found"
        
        # Get user by ID
        user_id = admin_user["id"]
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        
        assert response.status_code == 200
        user = response.json()
        
        assert user["email"] == ADMIN_EMAIL
        assert user["name"] == "Admin User"
        
        print(f"✓ GET /api/users/{user_id} returns correct user")
    
    def test_get_nonexistent_user(self):
        """Test getting a non-existent user returns 404"""
        fake_id = "nonexistent-user-id-12345"
        response = requests.get(f"{BASE_URL}/api/users/{fake_id}")
        
        assert response.status_code == 404
        print("✓ Non-existent user correctly returns 404")


class TestUserCRUD:
    """User CRUD operations - Create, Update, Delete"""
    
    def test_create_user_and_verify_persistence(self):
        """Test creating a user and verifying it persists in MongoDB"""
        unique_email = f"TEST_crud_{uuid.uuid4().hex[:8]}@test.com"
        
        # CREATE
        create_response = requests.post(f"{BASE_URL}/api/users", json={
            "email": unique_email,
            "password": "CrudTest123!",
            "name": "TEST CRUD User",
            "role": "User",
            "status": "Active",
            "plan": "Free"
        })
        
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        created_user = create_response.json()
        user_id = created_user["id"]
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert get_response.status_code == 200
        
        fetched_user = get_response.json()
        assert fetched_user["email"] == unique_email.lower()
        assert fetched_user["name"] == "TEST CRUD User"
        
        print(f"✓ User created and persisted: {unique_email}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user_id}")
    
    def test_update_user_and_verify_persistence(self):
        """Test updating a user and verifying changes persist"""
        # Create a test user first
        unique_email = f"TEST_update_{uuid.uuid4().hex[:8]}@test.com"
        
        create_response = requests.post(f"{BASE_URL}/api/users", json={
            "email": unique_email,
            "password": "UpdateTest123!",
            "name": "TEST Original Name",
            "role": "User",
            "status": "Active",
            "plan": "Free"
        })
        
        user_id = create_response.json()["id"]
        
        # UPDATE
        update_response = requests.put(f"{BASE_URL}/api/users/{user_id}", json={
            "name": "TEST Updated Name",
            "plan": "Pro"
        })
        
        assert update_response.status_code == 200
        
        # GET to verify update persisted
        get_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        updated_user = get_response.json()
        
        assert updated_user["name"] == "TEST Updated Name", f"Name not updated: {updated_user.get('name')}"
        assert updated_user["plan"] == "Pro", f"Plan not updated: {updated_user.get('plan')}"
        
        print("✓ User update persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user_id}")
    
    def test_delete_user_and_verify_removal(self):
        """Test deleting a user and verifying removal"""
        # Create a test user
        unique_email = f"TEST_delete_{uuid.uuid4().hex[:8]}@test.com"
        
        create_response = requests.post(f"{BASE_URL}/api/users", json={
            "email": unique_email,
            "password": "DeleteTest123!",
            "name": "TEST To Delete",
            "role": "User",
            "status": "Active",
            "plan": "Free"
        })
        
        user_id = create_response.json()["id"]
        
        # DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/users/{user_id}")
        assert delete_response.status_code == 200
        
        # GET to verify removal
        get_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert get_response.status_code == 404, "User should be deleted"
        
        print("✓ User deleted and removed from database")


class TestAdminRoleCheck:
    """Test that admin role check works correctly"""
    
    def test_admin_user_has_correct_role(self):
        """Verify admin user in database has 'Admin' role"""
        response = requests.get(f"{BASE_URL}/api/users")
        users = response.json()
        
        admin_user = next((u for u in users if u.get('email') == ADMIN_EMAIL), None)
        assert admin_user is not None, "Admin user not found"
        assert admin_user["role"] == "Admin", f"Admin role incorrect: {admin_user.get('role')}"
        
        print(f"✓ Admin user has correct role: {admin_user['role']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
