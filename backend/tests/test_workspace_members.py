"""
Workspace Member Management API Tests

Tests the 'Add Member' feature that allows workspace owners to add members directly by email without requiring approval.
"""

import pytest
import requests
import os
import uuid

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test workspace ID
TEST_WORKSPACE_ID = f"test-workspace-{uuid.uuid4().hex[:8]}"


class TestUserSearchAPI:
    """Test user search endpoint for member lookup"""
    
    def test_search_users_by_query(self):
        """Test /api/users/search?q= returns matching users"""
        response = requests.get(f"{BASE_URL}/api/users/search", params={"q": "admin"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "users" in data, "Response should contain 'users' key"
        assert isinstance(data["users"], list), "Users should be a list"
        
        # If users found, verify structure
        if data["users"]:
            user = data["users"][0]
            assert "id" in user, "User should have 'id'"
            assert "email" in user, "User should have 'email'"
            print(f"✓ Found {len(data['users'])} users matching 'admin'")
    
    def test_search_users_by_email(self):
        """Test /api/users/search?email= returns matching users"""
        response = requests.get(f"{BASE_URL}/api/users/search", params={"email": "munal.com"})
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        print(f"✓ Email search returned {len(data['users'])} users")
    
    def test_search_empty_query(self):
        """Test search with no query returns all users (limited)"""
        response = requests.get(f"{BASE_URL}/api/users/search")
        assert response.status_code == 200
        
        data = response.json()
        assert "users" in data
        print(f"✓ Empty query returned {len(data['users'])} users")


class TestWorkspaceMemberCRUD:
    """Test workspace member CRUD operations - Add/Get/Update/Delete"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Clean up test workspace members before each test"""
        # Get and delete any existing test members
        try:
            response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
            if response.status_code == 200:
                members = response.json().get("members", [])
                for member in members:
                    requests.delete(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/{member['user_id']}")
        except Exception:
            pass
        yield
    
    def test_get_members_empty_workspace(self):
        """GET /api/workspaces/{id}/members - empty workspace returns empty list"""
        response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
        assert response.status_code == 200
        
        data = response.json()
        assert "members" in data
        assert isinstance(data["members"], list)
        assert "total" in data
        print(f"✓ Get members for empty workspace: {data['total']} members")
    
    def test_add_member_success(self):
        """POST /api/workspaces/{id}/members - add member directly with active status"""
        payload = {
            "workspace_id": TEST_WORKSPACE_ID,
            "email": "admin@munal.com",
            "role": "member",
            "added_by": "test-user"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "member" in data, "Response should contain member data"
        
        member = data["member"]
        assert member["status"] == "active", "Member should be 'active' immediately (not pending)"
        assert member["email"] == "admin@munal.com"
        assert member["workspace_id"] == TEST_WORKSPACE_ID
        assert "user_id" in member
        assert "joined_at" in member
        
        print(f"✓ Added member: {member['email']} with status '{member['status']}'")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
        assert get_response.status_code == 200
        members = get_response.json().get("members", [])
        assert len(members) == 1, "Workspace should have 1 member"
        assert members[0]["status"] == "active"
        print(f"✓ Verified member persisted with GET: {members[0]['email']}")
    
    def test_add_member_duplicate_error(self):
        """POST /api/workspaces/{id}/members - duplicate add returns 400"""
        # First add
        payload = {"workspace_id": TEST_WORKSPACE_ID, "email": "admin@munal.com", "role": "member"}
        requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        
        # Try duplicate
        response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert response.status_code == 400, f"Duplicate add should return 400, got {response.status_code}"
        
        data = response.json()
        assert "already a member" in data.get("detail", "").lower()
        print(f"✓ Duplicate add correctly rejected: {data['detail']}")
    
    def test_add_member_nonexistent_user(self):
        """POST /api/workspaces/{id}/members - nonexistent user returns 404"""
        payload = {
            "workspace_id": TEST_WORKSPACE_ID,
            "email": "nonexistent_user_12345@test.com",
            "role": "member"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members",
            json=payload
        )
        assert response.status_code == 404, f"Nonexistent user should return 404, got {response.status_code}"
        
        data = response.json()
        assert "not found" in data.get("detail", "").lower() or "no user found" in data.get("detail", "").lower()
        print(f"✓ Nonexistent user correctly rejected: {data['detail']}")
    
    def test_update_member_role(self):
        """PUT /api/workspaces/{id}/members/{user_id} - update member role"""
        # Add member first
        payload = {"workspace_id": TEST_WORKSPACE_ID, "email": "admin@munal.com", "role": "member"}
        add_response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert add_response.status_code == 200
        user_id = add_response.json()["member"]["user_id"]
        
        # Update role
        update_response = requests.put(
            f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/{user_id}",
            json={"role": "admin"}
        )
        assert update_response.status_code == 200
        assert update_response.json().get("success") == True
        print(f"✓ Updated member role to admin")
        
        # Verify with GET
        get_response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
        members = get_response.json().get("members", [])
        assert len(members) == 1
        assert members[0]["role"] == "admin", f"Role should be 'admin', got '{members[0]['role']}'"
        print(f"✓ Verified role change persisted")
    
    def test_update_nonexistent_member(self):
        """PUT /api/workspaces/{id}/members/{user_id} - nonexistent member returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/nonexistent-user-id",
            json={"role": "admin"}
        )
        assert response.status_code == 404
        print(f"✓ Update nonexistent member correctly returns 404")
    
    def test_remove_member(self):
        """DELETE /api/workspaces/{id}/members/{user_id} - remove member"""
        # Add member first
        payload = {"workspace_id": TEST_WORKSPACE_ID, "email": "admin@munal.com", "role": "member"}
        add_response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert add_response.status_code == 200
        user_id = add_response.json()["member"]["user_id"]
        
        # Remove member
        delete_response = requests.delete(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/{user_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") == True
        print(f"✓ Removed member successfully")
        
        # Verify member is gone
        get_response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
        members = get_response.json().get("members", [])
        assert len(members) == 0, "Member should be removed"
        print(f"✓ Verified member removal persisted")
    
    def test_remove_nonexistent_member(self):
        """DELETE /api/workspaces/{id}/members/{user_id} - nonexistent member returns 404"""
        response = requests.delete(
            f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/nonexistent-user-id"
        )
        assert response.status_code == 404
        print(f"✓ Remove nonexistent member correctly returns 404")


class TestMemberRoles:
    """Test different member role assignments"""
    
    @pytest.fixture(autouse=True)
    def cleanup(self):
        """Clean up test workspace after each test"""
        yield
        try:
            response = requests.get(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members")
            if response.status_code == 200:
                members = response.json().get("members", [])
                for member in members:
                    requests.delete(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members/{member['user_id']}")
        except Exception:
            pass
    
    def test_add_member_with_admin_role(self):
        """Test adding member with admin role"""
        payload = {
            "workspace_id": TEST_WORKSPACE_ID,
            "email": "admin@munal.com",
            "role": "admin"
        }
        response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert response.status_code == 200
        assert response.json()["member"]["role"] == "admin"
        print(f"✓ Added member with admin role")
    
    def test_add_member_with_viewer_role(self):
        """Test adding member with viewer role"""
        payload = {
            "workspace_id": TEST_WORKSPACE_ID,
            "email": "admin@munal.com",
            "role": "viewer"
        }
        response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert response.status_code == 200
        assert response.json()["member"]["role"] == "viewer"
        print(f"✓ Added member with viewer role")
    
    def test_add_member_default_role(self):
        """Test adding member without role defaults to 'member'"""
        payload = {
            "workspace_id": TEST_WORKSPACE_ID,
            "email": "admin@munal.com"
        }
        response = requests.post(f"{BASE_URL}/api/workspaces/{TEST_WORKSPACE_ID}/members", json=payload)
        assert response.status_code == 200
        assert response.json()["member"]["role"] == "member"
        print(f"✓ Default role is 'member'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
