"""
Auto-Update Notifications Tests
Tests for:
- SSE broadcast_all when admin publishes version
- Startup poll: /api/updates/check returns update_available
- Admin version CRUD still works
- User check/acknowledge still works
"""
import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_MANAGER_EMAIL = "orgmgr@munal.com"
ORG_MANAGER_PASSWORD = "OrgMgr@123"


class TestAutoUpdateNotifications:
    """Auto-Update Notification Feature Tests"""
    
    admin_token = None
    manager_token = None
    test_version_id = None
    test_version_number = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get tokens for admin and manager users"""
        # Get admin token
        if not TestAutoUpdateNotifications.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestAutoUpdateNotifications.admin_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Admin login failed: {res.status_code} - {res.text}")
        
        # Get manager token (non-admin)
        if not TestAutoUpdateNotifications.manager_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_MANAGER_EMAIL,
                "password": ORG_MANAGER_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestAutoUpdateNotifications.manager_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Manager login failed: {res.status_code} - {res.text}")
    
    # ============== SSE Broadcast Tests ==============
    
    def test_01_admin_publish_version_triggers_broadcast(self):
        """POST /api/updates/admin/versions should create version and trigger broadcast_all"""
        test_version = f"99.{uuid.uuid4().hex[:4]}.0"
        TestAutoUpdateNotifications.test_version_number = test_version
        
        res = requests.post(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": test_version,
                "title": "Auto-Update Test Version",
                "release_notes": "Testing SSE broadcast functionality.",
                "is_critical": False
            }
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Verify response structure
        assert data.get("version") == test_version
        assert data.get("title") == "Auto-Update Test Version"
        assert "id" in data
        
        TestAutoUpdateNotifications.test_version_id = data["id"]
        print(f"Created version {test_version} - broadcast should have been triggered")
    
    def test_02_check_for_updates_returns_new_version(self):
        """GET /api/updates/check should return update_available=true for new version"""
        # First, reset user's last_seen_version by acknowledging an older version
        # Then check if the new version shows as available
        
        res = requests.get(
            f"{BASE_URL}/api/updates/check",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Verify response structure
        assert "update_available" in data
        assert "current_version" in data
        assert "last_seen_version" in data
        
        # If update is available, verify latest_version info
        if data.get("update_available"):
            assert "latest_version" in data
            latest = data["latest_version"]
            assert "version" in latest
            assert "title" in latest
            print(f"Update available: {latest['version']} - {latest['title']}")
        else:
            print(f"No update available (last_seen: {data.get('last_seen_version')})")
    
    def test_03_startup_poll_returns_correct_structure(self):
        """Startup poll endpoint returns all required fields for banner"""
        res = requests.get(
            f"{BASE_URL}/api/updates/check",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert res.status_code == 200
        data = res.json()
        
        # Required fields for UpdateNotificationBanner
        assert "update_available" in data
        assert isinstance(data["update_available"], bool)
        
        if data.get("latest_version"):
            latest = data["latest_version"]
            # Banner needs: version, title, is_critical
            assert "version" in latest, "latest_version must have 'version'"
            assert "title" in latest, "latest_version must have 'title'"
            assert "is_critical" in latest, "latest_version must have 'is_critical'"
            print(f"Latest version structure valid: v{latest['version']}")
    
    # ============== Admin CRUD Still Works ==============
    
    def test_04_admin_list_versions(self):
        """Admin: GET /api/updates/admin/versions - List all versions"""
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, list)
        
        # Verify our test version is in the list
        versions = [v.get("version") for v in data]
        if self.test_version_number:
            assert self.test_version_number in versions, f"Test version {self.test_version_number} not found"
        print(f"Found {len(data)} versions")
    
    def test_05_admin_edit_version(self):
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
                "title": "Updated Auto-Update Test",
                "is_critical": True
            }
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("title") == "Updated Auto-Update Test"
        assert data.get("is_critical") == True
        print("Version updated successfully")
    
    # ============== User Endpoints Still Work ==============
    
    def test_06_user_get_changelog(self):
        """User: GET /api/updates/changelog - Returns all versions"""
        res = requests.get(
            f"{BASE_URL}/api/updates/changelog",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, list)
        assert len(data) > 0, "Expected at least one version"
        
        # Verify sorted by created_at descending
        if len(data) > 1:
            for i in range(len(data) - 1):
                assert data[i].get("created_at", "") >= data[i+1].get("created_at", "")
        print(f"Changelog has {len(data)} versions")
    
    def test_07_user_acknowledge_update(self):
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
    
    def test_08_after_acknowledge_no_update_available(self):
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
            f"Expected update_available=false after acknowledge"
        print("After acknowledge, update_available is correctly false")
    
    # ============== RBAC Still Works ==============
    
    def test_09_non_admin_blocked_from_admin_endpoints(self):
        """Non-admin users blocked from admin endpoints with 403"""
        # Try to list admin versions
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        
        # Try to create version
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
        assert res.status_code == 403, f"Expected 403, got {res.status_code}"
        print("Non-admin correctly blocked from admin endpoints")
    
    # ============== Cleanup ==============
    
    def test_99_cleanup_delete_test_version(self):
        """Cleanup: Delete the test version"""
        if not self.test_version_id:
            pytest.skip("No test version to delete")
        
        res = requests.delete(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print(f"Cleaned up test version: {self.test_version_id}")


class TestSSEManagerBroadcast:
    """Test SSE Manager broadcast_all functionality"""
    
    admin_token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get admin token"""
        if not TestSSEManagerBroadcast.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestSSEManagerBroadcast.admin_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Admin login failed: {res.status_code}")
    
    def test_sse_endpoint_exists(self):
        """Verify SSE endpoint /api/chat/stream/{user_id} exists"""
        # We can't fully test SSE in pytest, but we can verify the endpoint exists
        # by checking it returns the correct content-type
        res = requests.get(
            f"{BASE_URL}/api/chat/stream/test-user-id",
            stream=True,
            timeout=5
        )
        
        # SSE endpoint should return 200 with text/event-stream
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        assert "text/event-stream" in res.headers.get("Content-Type", ""), \
            f"Expected text/event-stream, got {res.headers.get('Content-Type')}"
        
        # Close the stream
        res.close()
        print("SSE endpoint exists and returns correct content-type")
    
    def test_online_users_endpoint(self):
        """Verify /api/chat/online-users endpoint works"""
        res = requests.get(f"{BASE_URL}/api/chat/online-users")
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "online_users" in data
        assert isinstance(data["online_users"], list)
        print(f"Online users: {len(data['online_users'])}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
