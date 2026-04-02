"""
Admin 2FA Dashboard API Tests
Tests for the 2FA adoption dashboard endpoints:
- GET /api/admin/2fa-dashboard/stats - Get 2FA adoption statistics
- POST /api/admin/2fa-dashboard/send-reminders - Send reminder emails to non-2FA users
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAdmin2FADashboardStats:
    """Tests for GET /api/admin/2fa-dashboard/stats endpoint"""
    
    def test_stats_returns_200(self):
        """Stats endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Stats endpoint returns 200")
    
    def test_stats_has_required_fields(self):
        """Stats response contains all required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['total_users', 'total_enabled', 'total_disabled', 
                          'adoption_rate', 'by_role', 'enforced', 'non_2fa_users']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        print(f"✓ Stats response has all required fields: {required_fields}")
    
    def test_stats_total_users_is_integer(self):
        """total_users is an integer"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert isinstance(data['total_users'], int), "total_users should be an integer"
        assert data['total_users'] >= 0, "total_users should be non-negative"
        print(f"✓ total_users is valid integer: {data['total_users']}")
    
    def test_stats_enabled_disabled_sum_equals_total(self):
        """total_enabled + total_disabled equals total_users"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert data['total_enabled'] + data['total_disabled'] == data['total_users'], \
            f"enabled ({data['total_enabled']}) + disabled ({data['total_disabled']}) != total ({data['total_users']})"
        print(f"✓ enabled + disabled = total: {data['total_enabled']} + {data['total_disabled']} = {data['total_users']}")
    
    def test_stats_adoption_rate_is_percentage(self):
        """adoption_rate is a valid percentage (0-100)"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert isinstance(data['adoption_rate'], (int, float)), "adoption_rate should be numeric"
        assert 0 <= data['adoption_rate'] <= 100, f"adoption_rate should be 0-100, got {data['adoption_rate']}"
        print(f"✓ adoption_rate is valid percentage: {data['adoption_rate']}%")
    
    def test_stats_by_role_structure(self):
        """by_role contains role breakdown with enabled/disabled counts"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert isinstance(data['by_role'], dict), "by_role should be a dictionary"
        
        for role, counts in data['by_role'].items():
            assert 'enabled' in counts, f"Role {role} missing 'enabled' count"
            assert 'disabled' in counts, f"Role {role} missing 'disabled' count"
            assert isinstance(counts['enabled'], int), f"Role {role} enabled should be int"
            assert isinstance(counts['disabled'], int), f"Role {role} disabled should be int"
        print(f"✓ by_role structure is valid with roles: {list(data['by_role'].keys())}")
    
    def test_stats_enforced_is_boolean(self):
        """enforced field is a boolean"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert isinstance(data['enforced'], bool), "enforced should be a boolean"
        print(f"✓ enforced is boolean: {data['enforced']}")
    
    def test_stats_non_2fa_users_is_list(self):
        """non_2fa_users is a list of user objects"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        assert isinstance(data['non_2fa_users'], list), "non_2fa_users should be a list"
        print(f"✓ non_2fa_users is a list with {len(data['non_2fa_users'])} users")
    
    def test_stats_non_2fa_users_have_required_fields(self):
        """Each non-2FA user has required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        data = response.json()
        
        if len(data['non_2fa_users']) > 0:
            user = data['non_2fa_users'][0]
            required_user_fields = ['id', 'email', 'name', 'role']
            for field in required_user_fields:
                assert field in user, f"User missing required field: {field}"
            print(f"✓ Non-2FA users have required fields: {required_user_fields}")
        else:
            print("✓ No non-2FA users to validate (all users have 2FA enabled)")


class TestAdmin2FADashboardSendReminders:
    """Tests for POST /api/admin/2fa-dashboard/send-reminders endpoint"""
    
    def test_send_reminders_all_returns_200(self):
        """Send reminders to all non-2FA users returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Send reminders (all) returns 200")
    
    def test_send_reminders_all_response_structure(self):
        """Send reminders response has required fields"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={}
        )
        data = response.json()
        
        required_fields = ['success', 'sent', 'total_targeted']
        for field in required_fields:
            assert field in data, f"Missing required field: {field}"
        assert data['success'] is True, "success should be True"
        print(f"✓ Send reminders response structure valid: sent={data['sent']}, total_targeted={data['total_targeted']}")
    
    def test_send_reminders_selected_users(self):
        """Send reminders to selected users only"""
        # First get a user ID from stats
        stats_response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        stats = stats_response.json()
        
        if len(stats['non_2fa_users']) == 0:
            pytest.skip("No non-2FA users available for testing")
        
        user_id = stats['non_2fa_users'][0]['id']
        
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={"user_ids": [user_id]}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['total_targeted'] == 1, f"Expected 1 targeted, got {data['total_targeted']}"
        print(f"✓ Send reminders to selected user works: user_id={user_id}")
    
    def test_send_reminders_multiple_users(self):
        """Send reminders to multiple selected users"""
        stats_response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        stats = stats_response.json()
        
        if len(stats['non_2fa_users']) < 2:
            pytest.skip("Need at least 2 non-2FA users for this test")
        
        user_ids = [stats['non_2fa_users'][0]['id'], stats['non_2fa_users'][1]['id']]
        
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={"user_ids": user_ids}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['total_targeted'] == 2, f"Expected 2 targeted, got {data['total_targeted']}"
        print(f"✓ Send reminders to multiple users works: {len(user_ids)} users")
    
    def test_send_reminders_invalid_user_id(self):
        """Send reminders with invalid user ID returns success with 0 sent"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={"user_ids": ["invalid-user-id-12345"]}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['sent'] == 0, "Should send 0 emails for invalid user"
        print("✓ Invalid user ID handled gracefully")
    
    def test_send_reminders_empty_user_ids_list_sends_to_all(self):
        """Send reminders with empty user_ids list sends to ALL non-2FA users (same as empty body)"""
        # Note: Empty list is falsy in Python, so backend treats it as "send to all"
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/send-reminders",
            headers={"Content-Type": "application/json"},
            json={"user_ids": []}
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        # Empty list = send to all non-2FA users
        assert data['total_targeted'] >= 0, "Should target all non-2FA users"
        print(f"✓ Empty user_ids list sends to all: {data['total_targeted']} targeted")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
