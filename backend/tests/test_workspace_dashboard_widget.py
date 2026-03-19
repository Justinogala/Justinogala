"""
Backend tests for Workspace Dashboard Widget API
Tests: GET /api/workspaces/dashboard/summary endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user with known workspaces
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"


class TestWorkspaceDashboardSummary:
    """Tests for GET /api/workspaces/dashboard/summary endpoint"""
    
    def test_summary_returns_workspaces_for_existing_user(self):
        """Test that endpoint returns workspaces for user with workspaces"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "workspaces" in data
        assert "total_pending_approvals" in data
        assert "total_announcements" in data
        
        # Verify workspaces exist
        workspaces = data["workspaces"]
        assert isinstance(workspaces, list)
        assert len(workspaces) >= 1, "Admin user should have at least 1 workspace"
        
    def test_summary_workspace_has_required_fields(self):
        """Test each workspace has all required fields"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        workspaces = data["workspaces"]
        
        assert len(workspaces) > 0, "Need at least one workspace for this test"
        
        required_fields = [
            "id", "name", "color", "scope", 
            "member_count", "announcement_count", 
            "recent_announcements", "pending_approvals"
        ]
        
        for ws in workspaces:
            for field in required_fields:
                assert field in ws, f"Workspace missing required field: {field}"
            
            # Validate data types
            assert isinstance(ws["id"], str)
            assert isinstance(ws["name"], str)
            assert isinstance(ws["color"], str)
            assert ws["scope"] in ["team", "org"], f"Invalid scope: {ws['scope']}"
            assert isinstance(ws["member_count"], int)
            assert isinstance(ws["announcement_count"], int)
            assert isinstance(ws["recent_announcements"], int)
            assert isinstance(ws["pending_approvals"], int)
            
    def test_summary_returns_empty_for_nonexistent_user(self):
        """Test that endpoint returns empty array for user with no workspaces"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id=nonexistent-user-xyz")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["workspaces"] == []
        assert data["total_pending_approvals"] == 0
        assert data["total_announcements"] == 0
        
    def test_summary_requires_user_id_parameter(self):
        """Test that endpoint requires user_id query parameter"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary")
        
        # Should return 422 for missing required parameter
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data
        
    def test_summary_counts_are_non_negative(self):
        """Test that all counts are non-negative integers"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        assert data["total_pending_approvals"] >= 0
        assert data["total_announcements"] >= 0
        
        for ws in data["workspaces"]:
            assert ws["member_count"] >= 0
            assert ws["announcement_count"] >= 0
            assert ws["recent_announcements"] >= 0
            assert ws["pending_approvals"] >= 0
            
    def test_summary_includes_icon_field(self):
        """Test that workspace includes icon field (can be null)"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        for ws in data["workspaces"]:
            assert "icon" in ws, "Workspace should have icon field"
            # Icon can be null, string, or emoji
            assert ws["icon"] is None or isinstance(ws["icon"], str)
            
    def test_summary_workspaces_sorted_by_priority(self):
        """Test workspaces are sorted by pending approvals first, then by activity"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        workspaces = data["workspaces"]
        
        if len(workspaces) > 1:
            # Verify sorting: pending approvals desc, then recent announcements desc, then name
            for i in range(len(workspaces) - 1):
                current = workspaces[i]
                next_ws = workspaces[i + 1]
                
                # If current has more pending, it should come first
                if current["pending_approvals"] != next_ws["pending_approvals"]:
                    assert current["pending_approvals"] >= next_ws["pending_approvals"], \
                        "Workspaces with more pending approvals should come first"
                        
    def test_summary_admin_user_has_multiple_workspaces(self):
        """Test that admin user has expected number of workspaces (5 per requirements)"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        workspaces = data["workspaces"]
        
        # Per requirements: admin@munal.com has 5 workspaces
        assert len(workspaces) >= 5, f"Admin user should have at least 5 workspaces, found {len(workspaces)}"
        
    def test_summary_total_announcements_matches_sum(self):
        """Test total_announcements equals sum of workspace announcement_counts"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        sum_announcements = sum(ws["announcement_count"] for ws in data["workspaces"])
        assert data["total_announcements"] == sum_announcements, \
            f"Total announcements ({data['total_announcements']}) should match sum ({sum_announcements})"


class TestWorkspaceDashboardIntegration:
    """Integration tests for workspace dashboard with real data"""
    
    def test_workspace_scope_values(self):
        """Test that scope is either 'org' or 'team'"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        for ws in data["workspaces"]:
            assert ws["scope"] in ["org", "team"], f"Invalid scope: {ws['scope']}"
            
    def test_member_count_is_at_least_one(self):
        """Test that each workspace has at least 1 member (owner)"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        for ws in data["workspaces"]:
            assert ws["member_count"] >= 1, f"Workspace {ws['name']} should have at least 1 member"
            
    def test_color_is_valid_hex(self):
        """Test that workspace color is valid hex code"""
        response = requests.get(f"{BASE_URL}/api/workspaces/dashboard/summary?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        
        for ws in data["workspaces"]:
            color = ws["color"]
            assert color.startswith("#"), f"Color should start with #: {color}"
            assert len(color) == 7, f"Color should be 7 chars (incl #): {color}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
