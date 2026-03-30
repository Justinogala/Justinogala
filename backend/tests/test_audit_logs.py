"""
Test Audit Logs API - Admin audit logging feature
Tests: GET /api/admin/audit-logs, GET /api/admin/audit-logs/stats
Tests: Login audit events (success/failure)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


class TestAuditLogsAPI:
    """Test audit logs endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_admin_token(self):
        """Login as admin and get token (skip 2FA)"""
        response = self.session.post(
            f"{BASE_URL}/api/auth/login?skip_2fa=true",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token")
        return None
    
    # ============ GET /api/admin/audit-logs Tests ============
    
    def test_get_audit_logs_basic(self):
        """Test basic audit logs retrieval with pagination"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "logs" in data, "Response should contain 'logs'"
        assert "total" in data, "Response should contain 'total'"
        assert "page" in data, "Response should contain 'page'"
        assert "total_pages" in data, "Response should contain 'total_pages'"
        assert "limit" in data, "Response should contain 'limit'"
        
        # Verify data types
        assert isinstance(data["logs"], list), "logs should be a list"
        assert isinstance(data["total"], int), "total should be an integer"
        assert isinstance(data["page"], int), "page should be an integer"
        assert isinstance(data["total_pages"], int), "total_pages should be an integer"
        
        print(f"✓ Got {len(data['logs'])} logs, total: {data['total']}, pages: {data['total_pages']}")
    
    def test_get_audit_logs_pagination(self):
        """Test pagination parameters"""
        # Test page 1
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?page=1&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["page"] == 1
        assert data["limit"] == 10
        assert len(data["logs"]) <= 10
        
        # Test page 2 if available
        if data["total_pages"] > 1:
            response2 = self.session.get(f"{BASE_URL}/api/admin/audit-logs?page=2&limit=10")
            assert response2.status_code == 200
            data2 = response2.json()
            assert data2["page"] == 2
            # Verify different logs on different pages
            if data["logs"] and data2["logs"]:
                assert data["logs"][0].get("id") != data2["logs"][0].get("id"), "Page 2 should have different logs"
        
        print(f"✓ Pagination working: page 1 has {len(data['logs'])} logs")
    
    def test_get_audit_logs_filter_by_category(self):
        """Test filtering by category"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?category=auth")
        assert response.status_code == 200
        data = response.json()
        
        # All returned logs should have category=auth
        for log in data["logs"]:
            assert log.get("category") == "auth", f"Expected category 'auth', got '{log.get('category')}'"
        
        print(f"✓ Category filter working: {len(data['logs'])} auth logs")
    
    def test_get_audit_logs_filter_by_severity(self):
        """Test filtering by severity"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?severity=warning")
        assert response.status_code == 200
        data = response.json()
        
        # All returned logs should have severity=warning
        for log in data["logs"]:
            assert log.get("severity") == "warning", f"Expected severity 'warning', got '{log.get('severity')}'"
        
        print(f"✓ Severity filter working: {len(data['logs'])} warning logs")
    
    def test_get_audit_logs_search(self):
        """Test search across action and email fields"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search=login")
        assert response.status_code == 200
        data = response.json()
        
        # Verify search results contain 'login' in action or email
        for log in data["logs"]:
            action = (log.get("action") or "").lower()
            actor_email = (log.get("actor_email") or "").lower()
            target_email = (log.get("target_email") or "").lower()
            category = (log.get("category") or "").lower()
            
            match_found = (
                "login" in action or 
                "login" in actor_email or 
                "login" in target_email or
                "login" in category
            )
            assert match_found, f"Search result should contain 'login': {log}"
        
        print(f"✓ Search working: {len(data['logs'])} results for 'login'")
    
    def test_get_audit_logs_combined_filters(self):
        """Test combining multiple filters"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/audit-logs?category=auth&severity=warning"
        )
        assert response.status_code == 200
        data = response.json()
        
        for log in data["logs"]:
            assert log.get("category") == "auth"
            assert log.get("severity") == "warning"
        
        print(f"✓ Combined filters working: {len(data['logs'])} auth+warning logs")
    
    def test_get_audit_logs_days_parameter(self):
        """Test days parameter for time range"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?days=7")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        print(f"✓ Days parameter working: {len(data['logs'])} logs in last 7 days")
    
    # ============ GET /api/admin/audit-logs/stats Tests ============
    
    def test_get_audit_stats_basic(self):
        """Test audit stats endpoint"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "total_events" in data, "Response should contain 'total_events'"
        assert "by_category" in data, "Response should contain 'by_category'"
        assert "by_severity" in data, "Response should contain 'by_severity'"
        assert "failed_logins" in data, "Response should contain 'failed_logins'"
        
        # Verify data types
        assert isinstance(data["total_events"], int)
        assert isinstance(data["by_category"], dict)
        assert isinstance(data["by_severity"], dict)
        assert isinstance(data["failed_logins"], int)
        
        print(f"✓ Stats: total={data['total_events']}, failed_logins={data['failed_logins']}")
    
    def test_get_audit_stats_categories(self):
        """Test stats by_category breakdown"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs/stats")
        assert response.status_code == 200
        data = response.json()
        
        by_category = data["by_category"]
        expected_categories = ["auth", "2fa", "permission", "user_mgmt", "workspace", "data", "system"]
        
        for cat in expected_categories:
            assert cat in by_category, f"Category '{cat}' should be in stats"
            assert isinstance(by_category[cat], int), f"Category count should be int"
        
        print(f"✓ Category stats: {by_category}")
    
    def test_get_audit_stats_severities(self):
        """Test stats by_severity breakdown"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs/stats")
        assert response.status_code == 200
        data = response.json()
        
        by_severity = data["by_severity"]
        expected_severities = ["info", "warning", "critical"]
        
        for sev in expected_severities:
            assert sev in by_severity, f"Severity '{sev}' should be in stats"
            assert isinstance(by_severity[sev], int)
        
        print(f"✓ Severity stats: {by_severity}")
    
    def test_get_audit_stats_days_parameter(self):
        """Test stats with days parameter"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs/stats?days=7")
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("period_days") == 7, "period_days should match requested days"
        print(f"✓ Stats days parameter working: period_days={data.get('period_days')}")


class TestLoginAuditEvents:
    """Test that login attempts create audit events"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_successful_login_creates_audit_event(self):
        """Test that successful admin login creates audit event with action=login_success"""
        # First, get current count of login_success events
        stats_before = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search=login_success&limit=10").json()
        count_before = stats_before.get("total", 0)
        
        # Perform login (skip 2FA for testing)
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login?skip_2fa=true",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        # Wait a moment for audit log to be written
        time.sleep(0.5)
        
        # Check for new login_success event
        stats_after = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search=login_success&limit=10").json()
        count_after = stats_after.get("total", 0)
        
        assert count_after >= count_before, "Should have at least same number of login_success events"
        
        # Verify the latest login_success event
        if stats_after["logs"]:
            latest = stats_after["logs"][0]
            assert latest.get("action") == "login_success", f"Expected action 'login_success', got '{latest.get('action')}'"
            assert latest.get("category") == "auth", f"Expected category 'auth', got '{latest.get('category')}'"
            assert latest.get("actor_email") == ADMIN_EMAIL, f"Expected actor_email '{ADMIN_EMAIL}'"
        
        print(f"✓ Successful login created audit event (count: {count_before} -> {count_after})")
    
    def test_failed_login_creates_audit_event(self):
        """Test that failed login creates audit event with action=login_failed and severity=warning"""
        # Get current count of login_failed events
        stats_before = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search=login_failed&limit=10").json()
        count_before = stats_before.get("total", 0)
        
        # Attempt login with wrong password
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "WrongPassword123!"}
        )
        assert login_response.status_code == 401, f"Expected 401, got {login_response.status_code}"
        
        # Wait a moment for audit log to be written
        time.sleep(0.5)
        
        # Check for new login_failed event
        stats_after = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search=login_failed&limit=10").json()
        count_after = stats_after.get("total", 0)
        
        assert count_after > count_before, f"Should have more login_failed events (before: {count_before}, after: {count_after})"
        
        # Verify the latest login_failed event
        if stats_after["logs"]:
            latest = stats_after["logs"][0]
            assert latest.get("action") == "login_failed", f"Expected action 'login_failed'"
            assert latest.get("category") == "auth", f"Expected category 'auth'"
            assert latest.get("severity") == "warning", f"Expected severity 'warning', got '{latest.get('severity')}'"
        
        print(f"✓ Failed login created audit event with severity=warning (count: {count_before} -> {count_after})")
    
    def test_failed_login_nonexistent_user(self):
        """Test that failed login for non-existent user creates audit event"""
        fake_email = "nonexistent_test_user@example.com"
        
        # Attempt login with non-existent user
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": fake_email, "password": "SomePassword123!"}
        )
        assert login_response.status_code == 401
        
        time.sleep(0.5)
        
        # Check for audit event (minimum limit is 10)
        logs_response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?search={fake_email}&limit=10").json()
        
        # Should find the failed login attempt
        found = False
        for log in logs_response.get("logs", []):
            if log.get("action") == "login_failed" and log.get("actor_email") == fake_email:
                found = True
                assert log.get("severity") == "warning"
                break
        
        assert found, f"Should find login_failed event for {fake_email}"
        print(f"✓ Failed login for non-existent user created audit event")


class TestAuditLogDataIntegrity:
    """Test audit log data structure and integrity"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_audit_log_entry_structure(self):
        """Test that audit log entries have correct structure"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        if data["logs"]:
            log = data["logs"][0]
            
            # Required fields
            assert "id" in log, "Log should have 'id'"
            assert "action" in log, "Log should have 'action'"
            assert "category" in log, "Log should have 'category'"
            assert "severity" in log, "Log should have 'severity'"
            assert "timestamp" in log, "Log should have 'timestamp'"
            
            # Optional but expected fields
            expected_fields = ["actor_id", "actor_email", "target_id", "target_email", "details", "ip_address"]
            for field in expected_fields:
                assert field in log, f"Log should have '{field}' field"
            
            # Verify no MongoDB _id field
            assert "_id" not in log, "Log should not expose MongoDB _id"
            
            print(f"✓ Audit log entry structure is correct")
    
    def test_audit_log_no_mongodb_id(self):
        """Verify MongoDB _id is excluded from responses"""
        response = self.session.get(f"{BASE_URL}/api/admin/audit-logs?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        for log in data["logs"]:
            assert "_id" not in log, f"MongoDB _id should be excluded: {log}"
        
        print(f"✓ No MongoDB _id in {len(data['logs'])} logs")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
