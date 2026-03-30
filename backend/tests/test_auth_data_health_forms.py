"""
Test Suite for:
1. AuthContext consolidation - User and Admin login/logout
2. Data Health Dashboard API endpoints
3. Client Behavior Observation Form (9th healthcare template)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"
USER_EMAIL = "orgmember@munal.com"
USER_PASSWORD = "OrgMem@123"
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"


class TestUserAuthentication:
    """Test user login/logout after AuthContext consolidation"""
    
    def test_user_login_success(self):
        """User login should work after AuthContext consolidation"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200, f"User login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token missing from login response"
        assert "user" in data, "User object missing from login response"
        assert data["user"]["email"] == USER_EMAIL
        print(f"User login successful: {data['user']['email']}")
    
    def test_user_login_invalid_credentials(self):
        """User login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
        print("User login with invalid credentials correctly rejected")


class TestAdminAuthentication:
    """Test admin login/logout after AuthContext consolidation"""
    
    def test_admin_login_success(self):
        """Admin login should work after AuthContext consolidation"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data, "Token missing from admin login response"
        assert "user" in data, "User object missing from admin login response"
        user = data["user"]
        assert user["email"] == ADMIN_EMAIL
        # Admin should have Super_Admin role
        role = (user.get("role") or "").lower().replace(" ", "_")
        assert role in ["admin", "super_admin", "manager"], f"Expected admin role, got {user.get('role')}"
        print(f"Admin login successful: {user['email']} with role {user.get('role')}")
    
    def test_admin_login_invalid_credentials(self):
        """Admin login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
        print("Admin login with invalid credentials correctly rejected")
    
    def test_org_admin_login_success(self):
        """Org Admin login should work"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ORG_ADMIN_EMAIL,
            "password": ORG_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Org Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"Org Admin login successful: {data['user']['email']}")


class TestDataHealthAPI:
    """Test Data Health Dashboard API endpoints"""
    
    def test_data_health_stats_endpoint(self):
        """GET /api/admin/data-health/stats should return comprehensive stats"""
        response = requests.get(f"{BASE_URL}/api/admin/data-health/stats")
        assert response.status_code == 200, f"Data health stats failed: {response.text}"
        data = response.json()
        
        # Verify all required keys are present
        required_keys = ["overview", "collection_stats", "orphaned_records", 
                        "user_health", "workspace_health", "pending_actions", "stale_data"]
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
        
        # Verify overview structure
        overview = data["overview"]
        assert "total_documents" in overview
        assert "total_users" in overview
        assert "total_workspaces" in overview
        assert "total_collections" in overview
        
        # Verify user_health structure
        user_health = data["user_health"]
        assert "total" in user_health
        assert "active_last_30d" in user_health
        assert "inactive_30d_plus" in user_health
        assert "never_logged_in" in user_health
        
        # Verify workspace_health structure
        workspace_health = data["workspace_health"]
        assert "total" in workspace_health
        assert "empty_workspaces" in workspace_health
        
        # Verify orphaned_records structure
        orphaned = data["orphaned_records"]
        assert "workspace_members" in orphaned
        
        # Verify pending_actions structure
        pending = data["pending_actions"]
        assert "pending_time_off_requests" in pending
        assert "pending_swap_requests" in pending
        
        # Verify stale_data structure
        stale = data["stale_data"]
        assert "old_conversations_30d" in stale
        
        print(f"Data health stats returned successfully:")
        print(f"  - Total documents: {overview['total_documents']}")
        print(f"  - Total users: {overview['total_users']}")
        print(f"  - Total workspaces: {overview['total_workspaces']}")
        print(f"  - Orphaned members: {orphaned['workspace_members']}")
    
    def test_cleanup_orphaned_members_endpoint(self):
        """POST /api/admin/data-health/cleanup/orphaned-members should work"""
        response = requests.post(f"{BASE_URL}/api/admin/data-health/cleanup/orphaned-members")
        assert response.status_code == 200, f"Cleanup orphaned members failed: {response.text}"
        data = response.json()
        assert "deleted" in data, "Missing 'deleted' count in response"
        assert "details" in data, "Missing 'details' in response"
        print(f"Cleanup orphaned members: {data['deleted']} records deleted")
    
    def test_cleanup_stale_conversations_endpoint(self):
        """POST /api/admin/data-health/cleanup/stale-conversations should work"""
        response = requests.post(f"{BASE_URL}/api/admin/data-health/cleanup/stale-conversations?days=90")
        assert response.status_code == 200, f"Cleanup stale conversations failed: {response.text}"
        data = response.json()
        assert "deleted" in data, "Missing 'deleted' count in response"
        assert "scanned" in data, "Missing 'scanned' count in response"
        print(f"Cleanup stale conversations: {data['deleted']} deleted, {data['scanned']} scanned")


class TestHealthcareFormTemplates:
    """Test that Client Behavior Observation Form (9th template) exists"""
    
    @pytest.fixture
    def user_token_and_workspace(self):
        """Login as user and get a workspace ID"""
        # Login
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        if login_resp.status_code != 200:
            pytest.skip("Could not login as user")
        
        data = login_resp.json()
        user_id = data["user"]["id"]
        token = data["token"]
        
        # Get user's workspaces
        ws_resp = requests.get(f"{BASE_URL}/api/workspaces?user_id={user_id}")
        if ws_resp.status_code != 200 or not ws_resp.json().get("workspaces"):
            pytest.skip("No workspaces available for user")
        
        workspace_id = ws_resp.json()["workspaces"][0]["id"]
        return {"user_id": user_id, "token": token, "workspace_id": workspace_id}
    
    def test_healthcare_form_templates_count(self, user_token_and_workspace):
        """Verify 9 healthcare form templates exist including Client Behavior Observation Form"""
        user_id = user_token_and_workspace["user_id"]
        workspace_id = user_token_and_workspace["workspace_id"]
        
        # Get form templates for workspace
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{workspace_id}/form-templates?user_id={user_id}"
        )
        assert response.status_code == 200, f"Failed to get form templates: {response.text}"
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Filter system templates (healthcare templates)
        system_templates = [t for t in templates if t.get("is_system")]
        
        # Should have at least 9 system templates
        assert len(system_templates) >= 9, f"Expected at least 9 system templates, got {len(system_templates)}"
        
        # Check for Client Behavior Observation Form
        template_names = [t["name"] for t in system_templates]
        assert "Client Behavior Observation Form" in template_names, \
            f"Client Behavior Observation Form not found. Templates: {template_names}"
        
        print(f"Found {len(system_templates)} system templates including Client Behavior Observation Form")
        print(f"Template names: {template_names}")
    
    def test_client_behavior_observation_form_fields(self, user_token_and_workspace):
        """Verify Client Behavior Observation Form has all expected fields"""
        user_id = user_token_and_workspace["user_id"]
        workspace_id = user_token_and_workspace["workspace_id"]
        
        # Get form templates
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{workspace_id}/form-templates?user_id={user_id}"
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        behavior_form = next(
            (t for t in templates if t["name"] == "Client Behavior Observation Form"), 
            None
        )
        
        assert behavior_form is not None, "Client Behavior Observation Form not found"
        
        fields = behavior_form.get("fields", [])
        field_ids = [f["id"] for f in fields]
        
        # Expected fields from forms.py lines 245-280
        expected_fields = [
            "observation_date", "observation_time", "observer_name", "client_initials",
            "observation_setting", "persons_present", "behavior_type", "antecedent",
            "behavior_description", "behavior_intensity", "duration", "frequency",
            "intervention_used", "intervention_details", "client_response",
            "injuries_reported", "injury_details", "follow_up_actions", "supervisor_notified"
        ]
        
        for field_id in expected_fields:
            assert field_id in field_ids, f"Missing field: {field_id}"
        
        print(f"Client Behavior Observation Form has {len(fields)} fields")
        print(f"All expected fields present: {expected_fields}")


class TestAdminFormsAPI:
    """Test admin-level forms API"""
    
    def test_admin_get_all_templates(self):
        """Admin endpoint to get all form templates across workspaces"""
        response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert response.status_code == 200, f"Admin get templates failed: {response.text}"
        data = response.json()
        assert "templates" in data
        print(f"Admin can view {len(data['templates'])} form templates across all workspaces")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
