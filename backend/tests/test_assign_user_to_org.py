"""
Test suite for Assign User to Organization feature.
Tests the POST /api/organizations/{org_id}/members/assign endpoint
and DELETE /api/organizations/{org_id}/members/{user_id} endpoint.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "admin@munal.com"
SUPER_ADMIN_PASSWORD = "Admin@123456"
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
TEST_ORG_ID = "2101eba2-7676-4996-a09b-aefb85af4de8"  # Munal Healthcare


class TestAssignUserToOrg:
    """Tests for assigning existing users to organizations."""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session."""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_user_ids = []
        yield
        # Cleanup: delete test users
        for user_id in self.created_user_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/users/{user_id}")
            except:
                pass
    
    def get_auth_token(self, email, password):
        """Get auth token for a user."""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        return None
    
    def create_test_user(self, email_prefix="TEST_assign"):
        """Create a test user for assignment testing."""
        unique_id = str(uuid.uuid4())[:8]
        email = f"{email_prefix}_{unique_id}@test.com"
        response = self.session.post(f"{BASE_URL}/api/users", json={
            "email": email,
            "name": f"Test User {unique_id}",
            "password": "TestPass@123",
            "role": "User",
            "plan": "Free"
        })
        if response.status_code in [200, 201]:
            data = response.json()
            user = data.get("user", data)
            if user.get("id"):
                self.created_user_ids.append(user["id"])
            return user
        return None
    
    # ============== Assign Endpoint Tests ==============
    
    def test_assign_user_with_admin_role(self):
        """POST /api/organizations/{org_id}/members/assign with org_role=admin sets platform role=Admin."""
        # Create a fresh test user
        user = self.create_test_user("TEST_admin_role")
        assert user is not None, "Failed to create test user"
        user_id = user["id"]
        
        # Assign to org with admin role
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "admin"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("org_role") == "admin"
        assert data.get("platform_role") == "Admin"
        
        # Verify by fetching user
        get_response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        assert get_response.status_code == 200
        user_data = get_response.json()
        assert user_data.get("organization_id") == TEST_ORG_ID
        assert user_data.get("org_role") == "admin"
        assert user_data.get("role") == "Admin"
        assert user_data.get("account_type") == "business"
        print(f"✓ User assigned with admin role, platform role=Admin")
    
    def test_assign_user_with_manager_role(self):
        """POST /api/organizations/{org_id}/members/assign with org_role=manager sets platform role=Manager."""
        user = self.create_test_user("TEST_manager_role")
        assert user is not None, "Failed to create test user"
        user_id = user["id"]
        
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "manager"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("org_role") == "manager"
        assert data.get("platform_role") == "Manager"
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        user_data = get_response.json()
        assert user_data.get("role") == "Manager"
        assert user_data.get("org_role") == "manager"
        print(f"✓ User assigned with manager role, platform role=Manager")
    
    def test_assign_user_with_member_role(self):
        """POST /api/organizations/{org_id}/members/assign with org_role=member sets platform role=User."""
        user = self.create_test_user("TEST_member_role")
        assert user is not None, "Failed to create test user"
        user_id = user["id"]
        
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "member"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("org_role") == "member"
        assert data.get("platform_role") == "User"
        
        # Verify
        get_response = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        user_data = get_response.json()
        assert user_data.get("role") == "User"
        assert user_data.get("org_role") == "member"
        print(f"✓ User assigned with member role, platform role=User")
    
    def test_assign_already_assigned_user_returns_400(self):
        """POST /api/organizations/{org_id}/members/assign rejects already-assigned users with 400."""
        user = self.create_test_user("TEST_already_assigned")
        assert user is not None, "Failed to create test user"
        user_id = user["id"]
        
        # First assignment should succeed
        response1 = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "member"}
        )
        assert response1.status_code == 200, f"First assignment failed: {response1.text}"
        
        # Second assignment should fail with 400
        response2 = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "admin"}
        )
        assert response2.status_code == 400, f"Expected 400, got {response2.status_code}: {response2.text}"
        data = response2.json()
        assert "already assigned" in data.get("detail", "").lower()
        print(f"✓ Already-assigned user correctly rejected with 400")
    
    def test_assign_nonexistent_user_returns_404(self):
        """POST /api/organizations/{org_id}/members/assign with invalid user_id returns 404."""
        fake_user_id = str(uuid.uuid4())
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": fake_user_id, "org_role": "member"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"✓ Nonexistent user correctly returns 404")
    
    def test_assign_to_nonexistent_org_returns_404(self):
        """POST /api/organizations/{org_id}/members/assign with invalid org_id returns 404."""
        user = self.create_test_user("TEST_bad_org")
        assert user is not None
        
        fake_org_id = str(uuid.uuid4())
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{fake_org_id}/members/assign",
            json={"user_id": user["id"], "org_role": "member"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"✓ Nonexistent org correctly returns 404")
    
    def test_assign_with_invalid_role_returns_400(self):
        """POST /api/organizations/{org_id}/members/assign with invalid org_role returns 400."""
        user = self.create_test_user("TEST_bad_role")
        assert user is not None
        
        response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user["id"], "org_role": "superuser"}  # Invalid role
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
        print(f"✓ Invalid role correctly returns 400")
    
    # ============== Remove from Org Tests ==============
    
    def test_remove_user_from_org(self):
        """DELETE /api/organizations/{org_id}/members/{user_id} removes user from org and resets to personal."""
        user = self.create_test_user("TEST_remove")
        assert user is not None
        user_id = user["id"]
        
        # First assign to org
        assign_response = self.session.post(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/assign",
            json={"user_id": user_id, "org_role": "member"}
        )
        assert assign_response.status_code == 200
        
        # Verify assigned
        get_response1 = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        user_data1 = get_response1.json()
        assert user_data1.get("organization_id") == TEST_ORG_ID
        assert user_data1.get("account_type") == "business"
        
        # Remove from org
        remove_response = self.session.delete(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/{user_id}"
        )
        assert remove_response.status_code == 200, f"Expected 200, got {remove_response.status_code}: {remove_response.text}"
        data = remove_response.json()
        assert data.get("success") is True
        
        # Verify removed - user should now be personal
        get_response2 = self.session.get(f"{BASE_URL}/api/users/{user_id}")
        user_data2 = get_response2.json()
        assert user_data2.get("organization_id") is None
        assert user_data2.get("account_type") == "personal"
        assert user_data2.get("org_role") is None
        print(f"✓ User removed from org and reset to personal account")
    
    def test_remove_nonexistent_member_returns_404(self):
        """DELETE /api/organizations/{org_id}/members/{user_id} with non-member returns 404."""
        user = self.create_test_user("TEST_not_member")
        assert user is not None
        
        # Try to remove without assigning first
        response = self.session.delete(
            f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/members/{user['id']}"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print(f"✓ Non-member removal correctly returns 404")
    
    # ============== Organizations List Test ==============
    
    def test_list_organizations(self):
        """GET /api/organizations returns list of organizations."""
        response = self.session.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        orgs = data.get("organizations", data)
        assert isinstance(orgs, list)
        assert len(orgs) >= 1, "Expected at least 1 organization"
        
        # Check Munal Healthcare exists
        munal_healthcare = next((o for o in orgs if o.get("id") == TEST_ORG_ID), None)
        assert munal_healthcare is not None, "Munal Healthcare org not found"
        assert munal_healthcare.get("name") == "Munal Healthcare"
        print(f"✓ Organizations list returned {len(orgs)} orgs including Munal Healthcare")


class TestOrgAdminCannotSeeOrgSection:
    """Test that Org Admin (non-super-admin) cannot see Organization section."""
    
    def test_org_admin_login_returns_org_info(self):
        """Org Admin login returns organization_id and org_name."""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ORG_ADMIN_EMAIL,
            "password": ORG_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        user = data.get("user", {})
        
        # Org Admin should have organization_id
        assert user.get("organization_id") is not None, "Org Admin should have organization_id"
        assert user.get("role") == "Admin", f"Expected role=Admin, got {user.get('role')}"
        # Org Admin is NOT a Super_Admin
        assert user.get("role") != "Super_Admin"
        print(f"✓ Org Admin login returns org_id={user.get('organization_id')}, role={user.get('role')}")
    
    def test_super_admin_login_has_no_org(self):
        """Super Admin login has no organization_id."""
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        user = data.get("user", {})
        
        # Super Admin should NOT have organization_id
        assert user.get("organization_id") is None, f"Super Admin should not have org_id, got {user.get('organization_id')}"
        assert user.get("role") == "Super_Admin", f"Expected role=Super_Admin, got {user.get('role')}"
        print(f"✓ Super Admin login has no org_id, role=Super_Admin")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
