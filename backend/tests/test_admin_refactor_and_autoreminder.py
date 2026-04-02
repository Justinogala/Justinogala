"""
Test Suite for Admin Refactoring and 2FA Auto-Reminder Feature
Tests:
1. 2FA Dashboard auto-reminder toggle (POST /api/admin/2fa-dashboard/auto-reminder)
2. 2FA Dashboard stats with auto_reminder object (GET /api/admin/2fa-dashboard/stats)
3. Refactored admin endpoints still work after splitting admin.py into 7 files
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAutoReminderFeature:
    """Tests for the 2FA auto-reminder toggle feature"""
    
    def test_2fa_stats_returns_auto_reminder_object(self):
        """GET /api/admin/2fa-dashboard/stats should return auto_reminder with enabled, last_run, last_result"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify auto_reminder object exists
        assert "auto_reminder" in data, "Response should contain auto_reminder object"
        
        auto_reminder = data["auto_reminder"]
        assert "enabled" in auto_reminder, "auto_reminder should have 'enabled' field"
        assert "last_run" in auto_reminder, "auto_reminder should have 'last_run' field"
        assert "last_result" in auto_reminder, "auto_reminder should have 'last_result' field"
        
        # Verify enabled is boolean
        assert isinstance(auto_reminder["enabled"], bool), "enabled should be boolean"
        print(f"Auto-reminder status: enabled={auto_reminder['enabled']}, last_run={auto_reminder['last_run']}")
    
    def test_toggle_auto_reminder_on(self):
        """POST /api/admin/2fa-dashboard/auto-reminder should enable auto-reminder"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/auto-reminder",
            json={"enabled": True},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("enabled") == True, "Response should confirm enabled=True"
        print("Auto-reminder enabled successfully")
    
    def test_verify_auto_reminder_persisted_on(self):
        """Verify auto-reminder ON state persisted in stats"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["auto_reminder"]["enabled"] == True, "Auto-reminder should be enabled after toggle"
        print("Auto-reminder ON state verified in stats")
    
    def test_toggle_auto_reminder_off(self):
        """POST /api/admin/2fa-dashboard/auto-reminder should disable auto-reminder"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa-dashboard/auto-reminder",
            json={"enabled": False},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("enabled") == False, "Response should confirm enabled=False"
        print("Auto-reminder disabled successfully")
    
    def test_verify_auto_reminder_persisted_off(self):
        """Verify auto-reminder OFF state persisted in stats"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["auto_reminder"]["enabled"] == False, "Auto-reminder should be disabled after toggle"
        print("Auto-reminder OFF state verified in stats")


class TestRefactoredAdminEndpoints:
    """Tests for refactored admin endpoints (split from admin.py into 7 domain files)"""
    
    # admin_settings.py endpoints
    def test_get_admin_settings(self):
        """GET /api/admin/settings should return settings"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert isinstance(data, dict), "Response should be a dict"
        print(f"Admin settings: {list(data.keys())}")
    
    def test_get_2fa_enforcement(self):
        """GET /api/admin/2fa-enforcement should return enforcement status"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-enforcement")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "enforced" in data, "Response should contain 'enforced' field"
        print(f"2FA enforcement: {data['enforced']}")
    
    def test_get_security_policies(self):
        """GET /api/admin/security/policies should return security policies"""
        response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Should have standard security policy fields
        assert "max_login_attempts" in data or "settings" in data, "Response should contain security policy fields"
        print(f"Security policies retrieved successfully")
    
    # admin_users.py endpoints
    def test_get_admin_users(self):
        """GET /api/admin/users should return user list"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "users" in data, "Response should contain 'users' field"
        assert "total" in data, "Response should contain 'total' field"
        print(f"Admin users: total={data['total']}")
    
    # admin_billing.py endpoints
    def test_get_coupons(self):
        """GET /api/admin/coupons should return coupon list"""
        response = requests.get(f"{BASE_URL}/api/admin/coupons")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "coupons" in data, "Response should contain 'coupons' field"
        print(f"Coupons: count={data.get('count', len(data.get('coupons', [])))}")
    
    def test_get_tax_rates(self):
        """GET /api/admin/tax-rates should return tax rate list"""
        response = requests.get(f"{BASE_URL}/api/admin/tax-rates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "tax_rates" in data, "Response should contain 'tax_rates' field"
        print(f"Tax rates: count={data.get('count', len(data.get('tax_rates', [])))}")
    
    # admin_monitoring.py endpoints
    def test_get_system_health(self):
        """GET /api/admin/monitoring/system-health should return health status"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/system-health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "status" in data, "Response should contain 'status' field"
        assert "database" in data, "Response should contain 'database' field"
        print(f"System health: status={data['status']}, database={data['database']}")
    
    # admin_storage.py endpoints
    def test_get_storage_providers(self):
        """GET /api/admin/storage/providers should return provider list"""
        response = requests.get(f"{BASE_URL}/api/admin/storage/providers")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "providers" in data or "provider_list" in data, "Response should contain providers"
        print(f"Storage providers retrieved successfully")
    
    # admin_video.py endpoints
    def test_get_video_history_stats(self):
        """GET /api/admin/video-history/stats should return video stats"""
        response = requests.get(f"{BASE_URL}/api/admin/video-history/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "total_videos" in data, "Response should contain 'total_videos' field"
        print(f"Video stats: total_videos={data['total_videos']}")
    
    # admin_messages.py endpoints
    def test_get_broadcasts(self):
        """GET /api/admin/broadcasts should return broadcast list"""
        response = requests.get(f"{BASE_URL}/api/admin/broadcasts")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "broadcasts" in data or "success" in data, "Response should contain broadcasts or success"
        print(f"Broadcasts retrieved successfully")
    
    def test_get_internal_messages(self):
        """GET /api/admin/internal-messages should return message list"""
        response = requests.get(f"{BASE_URL}/api/admin/internal-messages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "messages" in data or "success" in data, "Response should contain messages or success"
        print(f"Internal messages retrieved successfully")


class Test2FADashboardStats:
    """Additional tests for 2FA Dashboard stats endpoint"""
    
    def test_stats_contains_all_required_fields(self):
        """GET /api/admin/2fa-dashboard/stats should return all required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa-dashboard/stats")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["total_users", "total_enabled", "total_disabled", "adoption_rate", "by_role", "enforced", "non_2fa_users", "auto_reminder"]
        
        for field in required_fields:
            assert field in data, f"Response should contain '{field}' field"
        
        # Verify data types
        assert isinstance(data["total_users"], int), "total_users should be int"
        assert isinstance(data["total_enabled"], int), "total_enabled should be int"
        assert isinstance(data["total_disabled"], int), "total_disabled should be int"
        assert isinstance(data["adoption_rate"], (int, float)), "adoption_rate should be numeric"
        assert isinstance(data["by_role"], dict), "by_role should be dict"
        assert isinstance(data["enforced"], bool), "enforced should be bool"
        assert isinstance(data["non_2fa_users"], list), "non_2fa_users should be list"
        assert isinstance(data["auto_reminder"], dict), "auto_reminder should be dict"
        
        print(f"Stats: total={data['total_users']}, enabled={data['total_enabled']}, disabled={data['total_disabled']}, rate={data['adoption_rate']}%")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
