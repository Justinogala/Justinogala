"""
Backend API tests for Admin Panel APIs:
- /api/admin/monitoring/dashboard - Real-time monitoring dashboard
- /api/admin/monitoring/system-health - System health status
- /api/admin/security/policies - Security policies CRUD
- /api/admin/analytics/meetings - Meeting analytics with date range
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAdminMonitoringDashboard:
    """Test Admin Monitoring Dashboard API"""
    
    def test_monitoring_dashboard_returns_200(self):
        """Test that dashboard endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/dashboard")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Dashboard endpoint returns 200")
    
    def test_monitoring_dashboard_structure(self):
        """Test dashboard response has required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Check real_time section
        assert "real_time" in data, "Missing 'real_time' in response"
        assert "online_users" in data["real_time"], "Missing 'online_users' in real_time"
        assert "active_meetings" in data["real_time"], "Missing 'active_meetings' in real_time"
        
        # Check users section
        assert "users" in data, "Missing 'users' in response"
        assert "total" in data["users"], "Missing 'total' in users"
        assert "active" in data["users"], "Missing 'active' in users"
        
        # Check today section
        assert "today" in data, "Missing 'today' in response"
        assert "logins" in data["today"], "Missing 'logins' in today"
        assert "meetings" in data["today"], "Missing 'meetings' in today"
        
        # Check audit logs section
        assert "recent_audit_logs" in data, "Missing 'recent_audit_logs' in response"
        assert isinstance(data["recent_audit_logs"], list), "recent_audit_logs should be a list"
        
        print("✓ Dashboard response structure is correct")
    
    def test_monitoring_dashboard_data_types(self):
        """Test that dashboard data types are correct"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data["real_time"]["online_users"], int), "online_users should be int"
        assert isinstance(data["real_time"]["active_meetings"], int), "active_meetings should be int"
        assert isinstance(data["users"]["total"], int), "total users should be int"
        assert isinstance(data["today"]["logins"], int), "logins should be int"
        
        print("✓ Dashboard data types are correct")


class TestAdminSystemHealth:
    """Test Admin System Health API"""
    
    def test_system_health_returns_200(self):
        """Test that system-health endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/system-health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ System health endpoint returns 200")
    
    def test_system_health_structure(self):
        """Test system health response structure"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/system-health")
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data, "Missing 'status' in response"
        assert "database" in data, "Missing 'database' in response"
        assert "connected" in data["database"], "Missing 'connected' in database"
        assert "collections" in data["database"], "Missing 'collections' in database"
        
        print("✓ System health structure is correct")
    
    def test_system_health_database_connected(self):
        """Test that database is connected"""
        response = requests.get(f"{BASE_URL}/api/admin/monitoring/system-health")
        assert response.status_code == 200
        data = response.json()
        
        assert data["database"]["connected"] == True, "Database should be connected"
        assert data["status"] == "healthy", "System status should be healthy"
        
        print("✓ Database is connected and system is healthy")


class TestAdminSecurityPolicies:
    """Test Admin Security Policies API"""
    
    def test_security_policies_get_returns_200(self):
        """Test that GET security policies returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET security policies returns 200")
    
    def test_security_policies_structure(self):
        """Test security policies response structure"""
        response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        assert response.status_code == 200
        data = response.json()
        
        # Password policies
        assert "password_min_length" in data, "Missing password_min_length"
        assert "password_require_uppercase" in data, "Missing password_require_uppercase"
        assert "password_require_numbers" in data, "Missing password_require_numbers"
        assert "password_require_special" in data, "Missing password_require_special"
        
        # Session policies
        assert "session_timeout_minutes" in data, "Missing session_timeout_minutes"
        
        # Lockout policies
        assert "max_failed_login_attempts" in data, "Missing max_failed_login_attempts"
        assert "lockout_duration_minutes" in data, "Missing lockout_duration_minutes"
        
        # Meeting policies
        assert "instant_meetings_enabled" in data, "Missing instant_meetings_enabled"
        assert "max_meeting_duration_minutes" in data, "Missing max_meeting_duration_minutes"
        
        print("✓ Security policies structure is correct")
    
    def test_security_policies_update(self):
        """Test updating security policies via PUT"""
        # Get current policies
        get_response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        original_data = get_response.json()
        original_min_length = original_data.get("password_min_length", 8)
        
        # Update with new value
        new_min_length = 12
        update_response = requests.put(
            f"{BASE_URL}/api/admin/security/policies",
            json={"password_min_length": new_min_length}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        update_data = update_response.json()
        assert update_data.get("success") == True, "Update should succeed"
        assert update_data.get("updated", {}).get("password_min_length") == new_min_length
        
        # Verify the update persisted
        verify_response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        verify_data = verify_response.json()
        assert verify_data["password_min_length"] == new_min_length, "Update did not persist"
        
        # Reset to original value
        requests.put(
            f"{BASE_URL}/api/admin/security/policies",
            json={"password_min_length": original_min_length}
        )
        
        print("✓ Security policies UPDATE works correctly")
    
    def test_security_policies_data_types(self):
        """Test security policies data types"""
        response = requests.get(f"{BASE_URL}/api/admin/security/policies")
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data["password_min_length"], int), "password_min_length should be int"
        assert isinstance(data["password_require_uppercase"], bool), "password_require_uppercase should be bool"
        assert isinstance(data["session_timeout_minutes"], int), "session_timeout_minutes should be int"
        assert isinstance(data["instant_meetings_enabled"], bool), "instant_meetings_enabled should be bool"
        
        print("✓ Security policies data types are correct")


class TestAdminMeetingAnalytics:
    """Test Admin Meeting Analytics API"""
    
    def test_meeting_analytics_returns_200(self):
        """Test that meeting analytics endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Meeting analytics endpoint returns 200")
    
    def test_meeting_analytics_structure(self):
        """Test meeting analytics response structure"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=30")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_meetings" in data, "Missing total_meetings"
        assert "meetings_per_user" in data, "Missing meetings_per_user"
        assert "peak_hours" in data, "Missing peak_hours"
        assert "daily_meetings" in data, "Missing daily_meetings"
        assert "period_days" in data, "Missing period_days"
        
        assert isinstance(data["meetings_per_user"], list), "meetings_per_user should be a list"
        assert isinstance(data["peak_hours"], list), "peak_hours should be a list"
        assert isinstance(data["daily_meetings"], list), "daily_meetings should be a list"
        
        print("✓ Meeting analytics structure is correct")
    
    def test_meeting_analytics_date_range_7_days(self):
        """Test analytics with 7 days range"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=7")
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 7, "Period should be 7 days"
        print("✓ Meeting analytics 7-day range works")
    
    def test_meeting_analytics_date_range_14_days(self):
        """Test analytics with 14 days range"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=14")
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 14, "Period should be 14 days"
        print("✓ Meeting analytics 14-day range works")
    
    def test_meeting_analytics_date_range_30_days(self):
        """Test analytics with 30 days range"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=30")
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 30, "Period should be 30 days"
        print("✓ Meeting analytics 30-day range works")
    
    def test_meeting_analytics_date_range_90_days(self):
        """Test analytics with 90 days range"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=90")
        assert response.status_code == 200
        data = response.json()
        assert data["period_days"] == 90, "Period should be 90 days"
        print("✓ Meeting analytics 90-day range works")
    
    def test_meeting_analytics_top_creators_structure(self):
        """Test meetings_per_user (top creators) data structure"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=30")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["meetings_per_user"]) > 0:
            creator = data["meetings_per_user"][0]
            assert "meeting_count" in creator, "Missing meeting_count in creator"
            # May have user_name and user_email
            print(f"✓ Top creator: {creator.get('user_name', 'Unknown')} with {creator['meeting_count']} meetings")
        else:
            print("✓ No meeting creators yet (empty list)")
    
    def test_meeting_analytics_peak_hours_structure(self):
        """Test peak_hours data structure"""
        response = requests.get(f"{BASE_URL}/api/admin/analytics/meetings?days=30")
        assert response.status_code == 200
        data = response.json()
        
        if len(data["peak_hours"]) > 0:
            peak = data["peak_hours"][0]
            assert "hour" in peak, "Missing hour in peak_hours"
            assert "count" in peak, "Missing count in peak_hours"
            assert isinstance(peak["hour"], int), "hour should be int"
            assert 0 <= peak["hour"] <= 23, "hour should be 0-23"
            print(f"✓ Peak hours structure correct, first peak at hour {peak['hour']}")
        else:
            print("✓ No peak hours data yet (empty list)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
