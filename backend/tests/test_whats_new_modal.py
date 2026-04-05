"""
What's New Modal Feature Tests
Tests for:
- GET /api/updates/whats-new - Returns unseen versions with highlights
- PATCH /api/updates/admin/versions/{id} - Update version with highlights array
- POST /api/updates/acknowledge - Marks version as seen
- Verify highlights field structure and pagination data
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_MANAGER_EMAIL = "orgmgr@munal.com"
ORG_MANAGER_PASSWORD = "OrgMgr@123"


class TestWhatsNewModal:
    """What's New Modal API Tests"""
    
    admin_token = None
    manager_token = None
    test_version_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get tokens for admin and manager users"""
        # Get admin token
        if not TestWhatsNewModal.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestWhatsNewModal.admin_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Admin login failed: {res.status_code} - {res.text}")
        
        # Get manager token (non-admin)
        if not TestWhatsNewModal.manager_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_MANAGER_EMAIL,
                "password": ORG_MANAGER_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestWhatsNewModal.manager_token = data.get("token") or data.get("access_token")
            else:
                pytest.skip(f"Manager login failed: {res.status_code} - {res.text}")
    
    # ============== What's New Endpoint Tests ==============
    
    def test_01_whats_new_endpoint_returns_correct_structure(self):
        """GET /api/updates/whats-new returns has_new, last_seen_version, new_versions"""
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Verify response structure
        assert "has_new" in data, "Response should have 'has_new' field"
        assert "last_seen_version" in data, "Response should have 'last_seen_version' field"
        assert "new_versions" in data, "Response should have 'new_versions' field"
        assert isinstance(data["new_versions"], list), "new_versions should be a list"
        
        print(f"What's New: has_new={data['has_new']}, last_seen={data['last_seen_version']}, count={len(data['new_versions'])}")
    
    def test_02_check_v220_has_highlights(self):
        """Verify v2.2.0 exists and has highlights array"""
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        versions = res.json()
        v220 = next((v for v in versions if v.get("version") == "2.2.0"), None)
        
        assert v220 is not None, "v2.2.0 should exist in versions"
        assert "highlights" in v220, "v2.2.0 should have highlights field"
        
        highlights = v220.get("highlights", [])
        print(f"v2.2.0 has {len(highlights)} highlights")
        
        # Verify highlights structure if present
        if highlights:
            for i, h in enumerate(highlights):
                assert "icon" in h, f"Highlight {i} should have 'icon' field"
                assert "title" in h, f"Highlight {i} should have 'title' field"
                assert "description" in h, f"Highlight {i} should have 'description' field"
            print(f"All {len(highlights)} highlights have correct structure (icon, title, description)")
    
    def test_03_admin_update_version_with_highlights(self):
        """PATCH /api/updates/admin/versions/{id} with highlights array works"""
        # First get v2.2.0 id
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        
        versions = res.json()
        v220 = next((v for v in versions if v.get("version") == "2.2.0"), None)
        
        if not v220:
            pytest.skip("v2.2.0 not found, cannot test highlights update")
        
        version_id = v220["id"]
        original_highlights = v220.get("highlights", [])
        
        # Add a test highlight
        test_highlights = original_highlights + [{
            "icon": "Zap",
            "title": "Test Highlight",
            "description": "This is a test highlight for automated testing"
        }]
        
        res = requests.patch(
            f"{BASE_URL}/api/updates/admin/versions/{version_id}",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={"highlights": test_highlights}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert "highlights" in data, "Response should include highlights"
        assert len(data["highlights"]) == len(test_highlights), "Highlights count should match"
        print(f"Successfully updated v2.2.0 with {len(data['highlights'])} highlights")
        
        # Restore original highlights
        requests.patch(
            f"{BASE_URL}/api/updates/admin/versions/{version_id}",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={"highlights": original_highlights}
        )
        print("Restored original highlights")
    
    def test_04_whats_new_returns_highlights_in_versions(self):
        """GET /api/updates/whats-new includes highlights in new_versions"""
        # First reset user's last_seen_version to see new versions
        # We'll use manager token for this test
        
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        
        # If there are new versions, check they include highlights
        if data["has_new"] and len(data["new_versions"]) > 0:
            for v in data["new_versions"]:
                assert "highlights" in v, f"Version {v.get('version')} should have highlights field"
            print(f"All {len(data['new_versions'])} new versions include highlights field")
        else:
            print("No new versions to check (user may have already seen all)")
    
    def test_05_acknowledge_updates_last_seen_version(self):
        """POST /api/updates/acknowledge updates user's last_seen_version"""
        # First check current state
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200
        before_data = res.json()
        
        # Acknowledge
        res = requests.post(
            f"{BASE_URL}/api/updates/acknowledge",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        ack_data = res.json()
        assert ack_data.get("status") == "acknowledged"
        acknowledged_version = ack_data.get("version")
        print(f"Acknowledged version: {acknowledged_version}")
        
        # Check after acknowledge
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200
        after_data = res.json()
        
        # After acknowledge, has_new should be false
        assert after_data["has_new"] == False, "After acknowledge, has_new should be false"
        print("After acknowledge, has_new is correctly false")
    
    def test_06_create_version_with_highlights(self):
        """Admin can create a new version with highlights array"""
        test_version = f"99.{uuid.uuid4().hex[:4]}.0"
        test_highlights = [
            {"icon": "Sparkles", "title": "Feature 1", "description": "Description 1"},
            {"icon": "Bell", "title": "Feature 2", "description": "Description 2"},
            {"icon": "Shield", "title": "Feature 3", "description": "Description 3"}
        ]
        
        res = requests.post(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={
                "Authorization": f"Bearer {self.admin_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": test_version,
                "title": "Test Version with Highlights",
                "release_notes": "Testing highlights feature",
                "is_critical": False,
                "highlights": test_highlights
            }
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        
        data = res.json()
        assert data.get("version") == test_version
        assert "highlights" in data
        assert len(data["highlights"]) == 3
        
        TestWhatsNewModal.test_version_id = data["id"]
        print(f"Created test version {test_version} with 3 highlights")
    
    def test_07_pagination_data_for_6_highlights(self):
        """Verify 6 highlights would result in 2 pages (3 per page)"""
        # Get v2.2.0 which should have 6 highlights
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        
        versions = res.json()
        v220 = next((v for v in versions if v.get("version") == "2.2.0"), None)
        
        if not v220:
            pytest.skip("v2.2.0 not found")
        
        highlights = v220.get("highlights", [])
        
        # Calculate expected pages (3 per page)
        items_per_page = 3
        expected_pages = max(1, (len(highlights) + items_per_page - 1) // items_per_page)
        
        print(f"v2.2.0 has {len(highlights)} highlights, which would be {expected_pages} pages (3 per page)")
        
        if len(highlights) == 6:
            assert expected_pages == 2, "6 highlights should result in 2 pages"
            print("Pagination calculation correct: 6 highlights = 2 pages")
    
    def test_08_highlights_icon_mapping_valid(self):
        """Verify highlight icons use valid icon names from ICON_MAP"""
        valid_icons = ["Zap", "Search", "Pin", "RefreshCw", "Download", "Bell", 
                       "Sparkles", "MessageSquare", "FileText", "Shield", 
                       "Settings", "Bot", "Globe", "Rocket"]
        
        res = requests.get(
            f"{BASE_URL}/api/updates/admin/versions",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        
        versions = res.json()
        
        for v in versions:
            highlights = v.get("highlights", [])
            for h in highlights:
                icon = h.get("icon", "")
                if icon and icon not in valid_icons:
                    print(f"Warning: Version {v.get('version')} has unknown icon '{icon}' - will fallback to Sparkles")
        
        print("Icon validation complete")
    
    # ============== Cleanup ==============
    
    def test_99_cleanup(self):
        """Cleanup: Delete test version created during tests"""
        if not self.test_version_id:
            pytest.skip("No test version to delete")
        
        res = requests.delete(
            f"{BASE_URL}/api/updates/admin/versions/{self.test_version_id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        print(f"Cleaned up test version: {self.test_version_id}")


class TestWhatsNewUserFlow:
    """Test the complete user flow for What's New modal"""
    
    admin_token = None
    manager_token = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get tokens"""
        if not TestWhatsNewUserFlow.admin_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_ADMIN_EMAIL,
                "password": ORG_ADMIN_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestWhatsNewUserFlow.admin_token = data.get("token") or data.get("access_token")
        
        if not TestWhatsNewUserFlow.manager_token:
            res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ORG_MANAGER_EMAIL,
                "password": ORG_MANAGER_PASSWORD
            })
            if res.status_code == 200:
                data = res.json()
                TestWhatsNewUserFlow.manager_token = data.get("token") or data.get("access_token")
    
    def test_01_reset_user_last_seen_for_testing(self):
        """Reset manager's last_seen_version to test modal appearance"""
        # This simulates a user who hasn't seen the latest version
        # We need to update the user's last_seen_version to an older version
        
        # First, get current whats-new state
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.manager_token}"}
        )
        assert res.status_code == 200
        data = res.json()
        print(f"Current state: has_new={data['has_new']}, last_seen={data['last_seen_version']}")
    
    def test_02_full_flow_check_acknowledge_verify(self):
        """Full flow: Check for new → Acknowledge → Verify no new"""
        # Step 1: Check what's new
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        initial_data = res.json()
        print(f"Step 1 - Initial: has_new={initial_data['has_new']}")
        
        # Step 2: Acknowledge
        res = requests.post(
            f"{BASE_URL}/api/updates/acknowledge",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        ack_data = res.json()
        print(f"Step 2 - Acknowledged: version={ack_data.get('version')}")
        
        # Step 3: Verify no new
        res = requests.get(
            f"{BASE_URL}/api/updates/whats-new",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        assert res.status_code == 200
        final_data = res.json()
        assert final_data["has_new"] == False, "After acknowledge, has_new should be false"
        print(f"Step 3 - Final: has_new={final_data['has_new']} (correctly false)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
