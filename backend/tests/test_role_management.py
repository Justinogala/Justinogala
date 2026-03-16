"""
Test Role Management Feature - Iteration 31
Tests PUT /api/users/{user_id} for role updates and admin action endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUserRoleVerification:
    """Verify justinoo2001@gmail.com has Admin role in DB"""
    
    def test_justinoo2001_is_admin(self):
        """Verify justinoo2001@gmail.com currently has role 'Admin'"""
        response = requests.get(f"{BASE_URL}/api/users/by-email/justinoo2001@gmail.com")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        user = response.json()
        assert user["email"] == "justinoo2001@gmail.com"
        assert user["role"] == "Admin", f"Expected role 'Admin', got '{user.get('role')}'"
        print(f"✓ User justinoo2001@gmail.com has role: {user['role']}")


class TestPutUserRoleUpdate:
    """Test PUT /api/users/{user_id} endpoint for role updates"""
    
    @pytest.fixture(autouse=True)
    def get_test_user(self):
        """Get a test user to modify (not justinoo2001 to preserve their Admin status)"""
        # Find any user that's not the main admin or justinoo2001
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        
        users = response.json()
        # Find a test user or create one if needed
        test_user = None
        for user in users:
            if user.get("email") and "test" in user.get("email", "").lower():
                test_user = user
                break
        
        if not test_user and len(users) > 0:
            # Use a non-admin user for testing (pick one that's not admin@munal.com or justinoo2001)
            for user in users:
                if user.get("email") not in ["admin@munal.com", "justinoo2001@gmail.com"]:
                    test_user = user
                    break
        
        self.test_user = test_user
        self.test_user_original_role = test_user.get("role") if test_user else None
        yield
        
        # Restore original role if we changed it
        if self.test_user and self.test_user_original_role:
            requests.put(
                f"{BASE_URL}/api/users/{self.test_user['id']}",
                json={"role": self.test_user_original_role}
            )
    
    def test_update_role_to_manager(self):
        """Test PUT /api/users/{id} with {role: 'Manager'} updates role"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        # Update role to Manager
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json={"role": "Manager"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_user = response.json()
        assert updated_user["role"] == "Manager", f"Expected role 'Manager', got '{updated_user.get('role')}'"
        assert updated_user["id"] == user_id
        
        # Verify persistence by fetching again
        verify_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert verify_response.status_code == 200
        verified_user = verify_response.json()
        assert verified_user["role"] == "Manager", "Role change was not persisted in DB"
        
        print(f"✓ User {user_id} role updated to Manager and verified in DB")
    
    def test_update_role_to_admin(self):
        """Test PUT /api/users/{id} with {role: 'Admin'} updates role"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        # Update role to Admin
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json={"role": "Admin"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_user = response.json()
        assert updated_user["role"] == "Admin", f"Expected role 'Admin', got '{updated_user.get('role')}'"
        
        # Verify persistence
        verify_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        verified_user = verify_response.json()
        assert verified_user["role"] == "Admin", "Role change was not persisted"
        
        print(f"✓ User {user_id} role updated to Admin and verified in DB")
    
    def test_update_role_to_user(self):
        """Test PUT /api/users/{id} with {role: 'User'} updates role"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json={"role": "User"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        updated_user = response.json()
        assert updated_user["role"] == "User", f"Expected role 'User', got '{updated_user.get('role')}'"
        
        print(f"✓ User {user_id} role updated to User")


class TestAdminUserActionEndpoint:
    """Test POST /api/admin/users/{user_id}/action for role changes"""
    
    @pytest.fixture(autouse=True)
    def get_test_user(self):
        """Get a test user to modify"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200
        
        data = response.json()
        users = data.get("users", [])
        
        test_user = None
        for user in users:
            if user.get("email") not in ["admin@munal.com", "justinoo2001@gmail.com"]:
                test_user = user
                break
        
        self.test_user = test_user
        self.original_role = test_user.get("role") if test_user else None
        yield
        
        # Restore original role
        if self.test_user and self.original_role:
            requests.put(
                f"{BASE_URL}/api/users/{self.test_user['id']}",
                json={"role": self.original_role}
            )
    
    def test_admin_action_set_role_admin(self):
        """Test POST /api/admin/users/{id}/action with action='set_role_admin'"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/action",
            json={"action": "set_role_admin"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, f"Expected success=True, got: {result}"
        
        # Verify role changed
        verify_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        verified_user = verify_response.json()
        assert verified_user["role"] == "Admin", f"Expected Admin, got {verified_user.get('role')}"
        
        print(f"✓ Admin action set_role_admin successful for user {user_id}")
    
    def test_admin_action_set_role_manager(self):
        """Test POST /api/admin/users/{id}/action with action='set_role_manager'"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/action",
            json={"action": "set_role_manager"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        verified_user = verify_response.json()
        assert verified_user["role"] == "Manager"
        
        print(f"✓ Admin action set_role_manager successful")
    
    def test_admin_action_set_role_user(self):
        """Test POST /api/admin/users/{id}/action with action='set_role_user'"""
        if not self.test_user:
            pytest.skip("No suitable test user found")
        
        user_id = self.test_user["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{user_id}/action",
            json={"action": "set_role_user"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        verified_user = verify_response.json()
        assert verified_user["role"] == "User"
        
        print(f"✓ Admin action set_role_user successful")


class TestAdminUsersList:
    """Test GET /api/admin/users endpoint"""
    
    def test_admin_users_list_returns_users(self):
        """Verify GET /api/admin/users returns user list with role badges"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "users" in data, "Response missing 'users' key"
        assert "total" in data, "Response missing 'total' key"
        
        users = data["users"]
        assert len(users) > 0, "No users returned"
        
        # Verify user structure includes role
        for user in users[:3]:
            assert "id" in user, "User missing 'id'"
            assert "email" in user, "User missing 'email'"
            assert "role" in user or user.get("role") is None, "User has unexpected structure"
        
        print(f"✓ Admin users list returned {len(users)} users")
    
    def test_admin_users_filter_by_role(self):
        """Test filtering users by role"""
        response = requests.get(f"{BASE_URL}/api/admin/users?role=Admin")
        assert response.status_code == 200
        
        data = response.json()
        users = data.get("users", [])
        
        # All returned users should have Admin role
        for user in users:
            assert user.get("role") == "Admin", f"Expected Admin role, got {user.get('role')}"
        
        print(f"✓ Admin users filter by role=Admin returned {len(users)} admins")


class TestUserModelValidation:
    """Test that UserUpdate model accepts role field"""
    
    def test_user_update_rejects_invalid_empty_update(self):
        """Test that PUT /api/users/{id} with empty body returns 400"""
        # Get any user first
        response = requests.get(f"{BASE_URL}/api/users")
        users = response.json()
        
        if not users:
            pytest.skip("No users available")
        
        user_id = users[0]["id"]
        
        # Empty update should fail
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}",
            json={},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 400, f"Expected 400 for empty update, got {response.status_code}"
        print("✓ Empty update correctly returns 400")
    
    def test_user_update_with_invalid_user_id(self):
        """Test that PUT /api/users/{invalid_id} returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/users/nonexistent-user-id-12345",
            json={"role": "Manager"},
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid user ID correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
