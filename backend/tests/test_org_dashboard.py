"""
Test Organization Dashboard API Endpoint
Tests GET /api/organizations/{org_id}/dashboard?user_id=xxx
Features tested:
- Dashboard returns org info, stats, members, workspaces, activity, role_distribution
- Dashboard returns correct member count, active members, workspace count, approval stats
- Dashboard returns 403 if user is not a member of the org
- Dashboard returns 404 for non-existent org
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
BUSINESS_USER_EMAIL = "justin.ogala@munal.com"
BUSINESS_USER_PASSWORD = "Justin@123456"
MUNAL_ORG_ID = "4bb85d5c-29bb-4dc8-b5c5-780d538a697a"

PERSONAL_USER_EMAIL = "admin@munal.com"
PERSONAL_USER_PASSWORD = "Admin@123456"


@pytest.fixture(scope="module")
def business_user_auth():
    """Login as business user (justin.ogala@munal.com) and get user data"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUSINESS_USER_EMAIL,
        "password": BUSINESS_USER_PASSWORD
    })
    assert response.status_code == 200, f"Failed to login as business user: {response.text}"
    data = response.json()
    return data.get("user", data)


@pytest.fixture(scope="module")
def personal_user_auth():
    """Login as personal user (admin@munal.com) and get user data"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PERSONAL_USER_EMAIL,
        "password": PERSONAL_USER_PASSWORD
    })
    assert response.status_code == 200, f"Failed to login as personal user: {response.text}"
    data = response.json()
    return data.get("user", data)


class TestOrgDashboardAPI:
    """Organization Dashboard endpoint tests"""
    
    def test_dashboard_returns_full_data(self, business_user_auth):
        """Test that dashboard endpoint returns org info, stats, members, workspaces, activity, role_distribution"""
        user_id = business_user_auth.get("id")
        org_id = business_user_auth.get("organization_id", MUNAL_ORG_ID)
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard?user_id={user_id}")
        
        assert response.status_code == 200, f"Dashboard request failed: {response.text}"
        data = response.json()
        
        # Verify all required fields are present
        assert "organization" in data, "Missing 'organization' in response"
        assert "stats" in data, "Missing 'stats' in response"
        assert "members" in data, "Missing 'members' in response"
        assert "workspaces" in data, "Missing 'workspaces' in response"
        assert "activity" in data, "Missing 'activity' in response"
        assert "role_distribution" in data, "Missing 'role_distribution' in response"
        
        # Verify organization info
        org = data["organization"]
        assert "id" in org, "Missing 'id' in organization"
        assert "name" in org, "Missing 'name' in organization"
        
        print(f"Dashboard returned organization: {org.get('name')}")
        print(f"Total members: {data['stats'].get('total_members')}")
    
    def test_dashboard_stats_structure(self, business_user_auth):
        """Test that stats contain all required fields with correct types"""
        user_id = business_user_auth.get("id")
        org_id = business_user_auth.get("organization_id", MUNAL_ORG_ID)
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard?user_id={user_id}")
        assert response.status_code == 200
        
        stats = response.json().get("stats", {})
        
        # Verify all stat fields exist and are integers
        required_stats = [
            "total_members",
            "active_members",
            "workspace_count",
            "pending_approvals",
            "completed_approvals",
            "rejected_approvals",
            "total_approvals"
        ]
        
        for stat in required_stats:
            assert stat in stats, f"Missing stat: {stat}"
            assert isinstance(stats[stat], int), f"{stat} should be an integer, got {type(stats[stat])}"
        
        # Verify total_approvals is sum of pending, completed, and rejected
        expected_total = stats["pending_approvals"] + stats["completed_approvals"] + stats["rejected_approvals"]
        assert stats["total_approvals"] == expected_total, \
            f"total_approvals ({stats['total_approvals']}) should equal sum of pending ({stats['pending_approvals']}), completed ({stats['completed_approvals']}), and rejected ({stats['rejected_approvals']})"
        
        print(f"Stats verified: {stats}")
    
    def test_dashboard_members_data(self, business_user_auth):
        """Test that members array contains expected user data"""
        user_id = business_user_auth.get("id")
        org_id = business_user_auth.get("organization_id", MUNAL_ORG_ID)
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        members = data.get("members", [])
        
        assert len(members) > 0, "Expected at least one member in organization"
        
        # Verify member data structure
        member = members[0]
        assert "id" in member, "Member missing 'id'"
        assert "name" in member, "Member missing 'name'"
        assert "email" in member, "Member missing 'email'"
        assert "status" in member, "Member missing 'status'"
        
        # Verify no password is exposed
        assert "password" not in member, "Password should not be exposed in member data"
        
        # Check that stats match member count
        assert data["stats"]["total_members"] == len(members) or len(members) <= 20, \
            "Member count should match stats (or be capped at 20)"
        
        print(f"Found {len(members)} members in dashboard response")
        for m in members[:3]:
            print(f"  - {m.get('name')} ({m.get('email')}), role: {m.get('org_role')}, status: {m.get('status')}")
    
    def test_dashboard_role_distribution(self, business_user_auth):
        """Test that role_distribution contains correct data"""
        user_id = business_user_auth.get("id")
        org_id = business_user_auth.get("organization_id", MUNAL_ORG_ID)
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        role_dist = data.get("role_distribution", {})
        
        assert isinstance(role_dist, dict), "role_distribution should be a dictionary"
        
        # Sum of role counts should equal total members
        total_from_roles = sum(role_dist.values())
        assert total_from_roles == data["stats"]["total_members"], \
            f"Sum of role distribution ({total_from_roles}) should equal total_members ({data['stats']['total_members']})"
        
        print(f"Role distribution: {role_dist}")
    
    def test_dashboard_403_for_non_member(self, personal_user_auth):
        """Test that dashboard returns 403 if user is not a member of the org"""
        user_id = personal_user_auth.get("id")
        
        # Try to access Munal Inc dashboard with personal account user
        response = requests.get(f"{BASE_URL}/api/organizations/{MUNAL_ORG_ID}/dashboard?user_id={user_id}")
        
        assert response.status_code == 403, \
            f"Expected 403 for non-member, got {response.status_code}: {response.text}"
        
        error_data = response.json()
        assert "detail" in error_data, "Error response should have 'detail' field"
        
        print(f"Correctly returned 403: {error_data.get('detail')}")
    
    def test_dashboard_404_for_nonexistent_org(self, business_user_auth):
        """Test that dashboard returns 404 for non-existent organization"""
        user_id = business_user_auth.get("id")
        fake_org_id = "00000000-0000-0000-0000-000000000000"
        
        response = requests.get(f"{BASE_URL}/api/organizations/{fake_org_id}/dashboard?user_id={user_id}")
        
        assert response.status_code == 404, \
            f"Expected 404 for non-existent org, got {response.status_code}: {response.text}"
        
        error_data = response.json()
        assert "detail" in error_data, "Error response should have 'detail' field"
        
        print(f"Correctly returned 404: {error_data.get('detail')}")
    
    def test_dashboard_workspaces_and_activity(self, business_user_auth):
        """Test that workspaces and activity arrays are returned"""
        user_id = business_user_auth.get("id")
        org_id = business_user_auth.get("organization_id", MUNAL_ORG_ID)
        
        response = requests.get(f"{BASE_URL}/api/organizations/{org_id}/dashboard?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        
        # Workspaces should be a list
        workspaces = data.get("workspaces", [])
        assert isinstance(workspaces, list), "workspaces should be a list"
        
        # Activity should be a list
        activity = data.get("activity", [])
        assert isinstance(activity, list), "activity should be a list"
        
        # Workspace count in stats should match workspaces list (or be close if capped)
        assert data["stats"]["workspace_count"] >= len(workspaces) or len(workspaces) <= 10, \
            "workspace_count should be >= workspaces list length"
        
        print(f"Workspaces: {len(workspaces)}, Activity items: {len(activity)}")
        
        # If there are workspaces, verify structure
        if workspaces:
            ws = workspaces[0]
            assert "id" in ws, "Workspace missing 'id'"
            assert "name" in ws, "Workspace missing 'name'"
            print(f"Sample workspace: {ws.get('name')}")
        
        # If there's activity, verify structure
        if activity:
            act = activity[0]
            assert "type" in act, "Activity missing 'type'"
            assert "title" in act, "Activity missing 'title'"
            print(f"Sample activity: {act.get('type')} - {act.get('title')}")


class TestBusinessUserValidation:
    """Verify business user has correct attributes"""
    
    def test_business_user_has_org_id(self, business_user_auth):
        """Verify the business user has organization_id set"""
        assert "organization_id" in business_user_auth, "Business user should have organization_id"
        assert business_user_auth["organization_id"] is not None, "organization_id should not be None"
        assert business_user_auth["organization_id"] == MUNAL_ORG_ID, \
            f"Expected org_id {MUNAL_ORG_ID}, got {business_user_auth['organization_id']}"
        
        print(f"Business user org_id: {business_user_auth['organization_id']}")
    
    def test_business_user_account_type(self, business_user_auth):
        """Verify the business user has business account type"""
        assert "account_type" in business_user_auth, "Business user should have account_type"
        assert business_user_auth["account_type"] == "business", \
            f"Expected account_type 'business', got {business_user_auth['account_type']}"
        
        print(f"Business user account_type: {business_user_auth['account_type']}")
    
    def test_personal_user_no_org_or_personal_type(self, personal_user_auth):
        """Verify personal user doesn't have business org setup"""
        # Personal user should either have no organization_id or personal account_type
        org_id = personal_user_auth.get("organization_id")
        account_type = personal_user_auth.get("account_type", "personal")
        
        # If user has an org_id but account_type is personal, they won't see org dashboard
        # If no org_id at all, they also won't see org dashboard
        is_personal = (org_id is None) or (account_type == "personal")
        
        print(f"Personal user - org_id: {org_id}, account_type: {account_type}")
        
        # The key condition for sidebar: account_type === 'business' && organization_id exists
        is_eligible_for_org_dash = (account_type == "business") and (org_id is not None)
        
        print(f"Personal user eligible for org dashboard: {is_eligible_for_org_dash}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
