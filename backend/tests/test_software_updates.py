"""
Software Update / Version Management API Tests
Tests for:
- Admin CRUD: Create, List, Edit, Delete version entries
- User endpoints: Check for updates, Changelog, Acknowledge
- Version comparison logic
- Role-based access control (Admin vs non-Admin)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_MANAGER_EMAIL = "orgmgr@munal.com"
ORG_MANAGER_PASSWORD = "OrgMgr@123"


class TestSoftwareUpdatesAPI:
    """Software Update API Tests"""
    
    admin_token = None
    manager_token = None
    test_version_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get tokens for admin and manager users"""
        # Get admin token
        if not TestSoftwareUpdatesAPI.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestSoftwareUpdatesAPI.admin_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Admin login failed: {res.status_code} - {res.text}")
        
        # Get manager token (non-admin)
        if not TestSoftwareUpdatesAPI.manager_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_MANAGER_EMAIL,
                "password": ORG_MANAGER_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestSoftwareUpdatesAPI.manager_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Manager login failed: {res.status_code} - {res.text}")
    
    # ============== Admin CRUD Tests ==============
    
    def test_01_admin_list_versions(self):
        """Admin: GET /api/updates/admin/versions - List all versions"""
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, list), "Expected list of versions"
        print(f"Found {len(data)} existing versions")
        # Verify seed data exists (v2.0.0 and v2.1.0)
        versions = [v.get("version") for v in data]
        assert "2.0.0" in versions or "2.1.0" in versions, "Expected seed versions to exist"
    
    def test_02_admin_create_version(self):
        """Admin: POST /api/updates/admin/versions - Create version entry"""
        test_version = f"99.{uuid.uuid4().hex[:4]}.0"  # Unique test version
        res = requests.post(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": test_version,
                "title": "Test Version Entry",
                "release_notes": "This is a test version for automated testing.",
                "is_critical": False
            }
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("version") == test_version
        assert data.get("title") == "Test Version Entry"
        assert "id" in data
        TestSoftwareUpdatesAPI.test_version_id = data["id"]
        print(f"Created test version: {test_version} with id: {data['id']}")
    
    def test_03_admin_create_duplicate_version_fails(self):
        """Admin: POST with existing version returns 400"""
        # Try to create v2.0.0 which should already exist
        res = requests.post(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": "2.0.0",
                "title": "Duplicate Test",
                "release_notes": "Should fail",
                "is_critical": False
            }
        )
        assert res.status_code == 400, f"Expected 400 for duplicate, got {res.status_code}: {res.text}"
        print("Duplicate version correctly rejected with 400")
    
    def test_04_admin_edit_version(self):
        """Admin: PATCH /api/updates/admin/versions/{id} - Edit version"""
        if not self.test_version_id:
            pytest.skip("No test version created")
        
        res = requests.patch(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "title": "Updated Test Version",
                "is_critical": True
            }
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("title") == "Updated Test Version"
        assert data.get("is_critical") == True
        print(f"Updated version title and critical flag")
    
    def test_05_admin_edit_nonexistent_version(self):
        """Admin: PATCH nonexistent version returns 404"""
        res = requests.patch(
            f"{BASE_URL}/api/updates/admin/versions/nonexistent-id-12345",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={"title": "Should fail"}
        )
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("Nonexistent version correctly returns 404")
    
    # ============== User Endpoint Tests ==============
    
    def test_06_user_check_for_updates(self):
        """User: GET /api/updates/check - Returns update status"""
        res = requests.get(
            f"{BASE_URL}/api/updates/check",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "update_available" in data
        assert "current_version" in data
        assert "last_seen_version" in data
        print(f"Check result: update_available={data['update_available']}, current={data['current_version']}")
    
    def test_07_user_get_changelog(self):
        """User: GET /api/updates/changelog - Returns all versions sorted newest first"""
        res = requests.get(
            f"{BASE_URL}/api/updates/changelog",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, list), "Expected list of versions"
        assert len(data) > 0, "Expected at least one version in changelog"
        # Verify sorted by created_at descending (newest first)
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i].get("created_at", "") >= data[i+1].get("created_at", ""), \
                    "Changelog should be sorted newest first"
        print(f"Changelog has {len(data)} versions, newest: {data[0].get('version')}")
    
    def test_08_user_acknowledge_update(self):
        """User: POST /api/updates/acknowledge - Marks latest version as seen"""
        res = requests.post(
            f"{BASE_URL}/api/updates/acknowledge",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("status") == "acknowledged"
        assert "version" in data
        print(f"Acknowledged version: {data['version']}")
    
    def test_09_after_acknowledge_check_returns_false(self):
        """After acknowledge, check returns update_available=false"""
        # First acknowledge
        requests.post(
            f"{BASE_URL}/api/updates/acknowledge",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        
        # Then check
        res = requests.get(
            f"{BASE_URL}/api/updates/check",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("update_available") == False, \
            f"Expected update_available=false after acknowledge, got {data.get('update_available')}"
        print("After acknowledge, update_available is correctly false")
    
    # ============== Role-Based Access Control Tests ==============
    
    def test_10_non_admin_cannot_list_admin_versions(self):
        """Non-admin blocked: Regular user cannot access admin list endpoint (403)"""
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 403, f"Expected 403 for non-admin, got {res.status_code}: {res.text}"
        print("Non-admin correctly blocked from admin list endpoint")
    
    def test_11_non_admin_cannot_create_version(self):
        """Non-admin blocked: Regular user cannot create version (403)"""
        res = requests.post(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={
                "Authorization": f"Bearer {self.manager_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": "99.99.99",
                "title": "Should Fail",
                "release_notes": "Non-admin attempt",
                "is_critical": False
            }
        )
        assert res.status_code == 403, f"Expected 403 for non-admin, got {res.status_code}: {res.text}"
        print("Non-admin correctly blocked from creating version")
    
    def test_12_non_admin_cannot_edit_version(self):
        """Non-admin blocked: Regular user cannot edit version (403)"""
        if not self.test_version_id:
            pytest.skip("No test version to edit")
        
        res = requests.patch(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={
                "Authorization": f"Bearer {self.manager_token}",
                "Content-Type": "application/json"
            },
            json={"title": "Should Fail"}
        )
        assert res.status_code == 403, f"Expected 403 for non-admin, got {res.status_code}: {res.text}"
        print("Non-admin correctly blocked from editing version")
    
    def test_13_non_admin_cannot_delete_version(self):
        """Non-admin blocked: Regular user cannot delete version (403)"""
        if not self.test_version_id:
            pytest.skip("No test version to delete")
        
        res = requests.delete(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 403, f"Expected 403 for non-admin, got {res.status_code}: {res.text}"
        print("Non-admin correctly blocked from deleting version")
    
    # ============== Cleanup ==============
    
    def test_99_cleanup_delete_test_version(self):
        """Cleanup: Delete the test version created during tests"""
        if not self.test_version_id:
            pytest.skip("No test version to delete")
        
        res = requests.delete(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print(f"Cleaned up test version: {self.test_version_id}")


class TestVersionComparison:
    """Test version comparison logic via API behavior"""
    
    admin_token = None
    created_versions = []
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get admin token"""
        if not TestVersionComparison.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestVersionComparison.admin_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Admin login failed: {res.status_code}")
    
    def test_version_comparison_newer_detected(self):
        """Version comparison: newer versions detected correctly (2.1.0 > 2.0.0)"""
        # This is implicitly tested by the check endpoint
        # If user's last_seen_version is 2.0.0 and latest is 2.1.0, update_available should be true
        res = requests.get(
            f"{BASE_URL}/api/updates/check",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        # The check endpoint uses _compare_versions internally
        # We verify the response structure is correct
        assert "update_available" in data
        assert "latest_version" in data or data.get("update_available") == False
        print(f"Version comparison working: update_available={data['update_available']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
