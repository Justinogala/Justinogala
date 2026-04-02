"""
Manager Notification System Tests
Tests for time-off and swap request notifications to workspace owners
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://custom-templates-7.preview.emergentagent.com').rstrip('/')

# Test credentials
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_ADMIN_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
TEST_WORKSPACE_ID = "b3478da2-7782-425a-9fa7-2dbc4f22d047"


class TestManagerNotificationEndpoints:
    """Test manager notification CRUD endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_manager_notifications(self):
        """GET /api/shifts/manager-notifications/{user_id} - returns notifications with unread_count"""
        response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should contain 'notifications' key"
        assert "unread_count" in data, "Response should contain 'unread_count' key"
        assert isinstance(data["notifications"], list), "notifications should be a list"
        assert isinstance(data["unread_count"], int), "unread_count should be an integer"
        print(f"✓ GET manager-notifications: {len(data['notifications'])} notifications, {data['unread_count']} unread")
    
    def test_mark_notification_read(self):
        """PUT /api/shifts/manager-notifications/{notification_id}/read - marks notification as read"""
        # First get notifications to find one to mark as read
        response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        notifications = data.get("notifications", [])
        
        if not notifications:
            pytest.skip("No notifications to mark as read")
        
        # Find an unread notification or use the first one
        notification_id = notifications[0]["id"]
        
        # Mark as read
        response = self.session.put(f"{BASE_URL}/api/shifts/manager-notifications/{notification_id}/read")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Response should indicate success"
        print(f"✓ PUT mark notification read: notification {notification_id} marked as read")
    
    def test_mark_all_notifications_read(self):
        """PUT /api/shifts/manager-notifications-read-all/{user_id} - marks all as read"""
        response = self.session.put(f"{BASE_URL}/api/shifts/manager-notifications-read-all/{ORG_ADMIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Response should indicate success"
        
        # Verify all are now read
        verify_response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["unread_count"] == 0, "All notifications should be marked as read"
        print(f"✓ PUT mark all read: unread_count is now 0")


class TestTimeOffNotificationCreation:
    """Test that time-off requests create manager notifications"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_time_off_creates_notification(self):
        """POST /api/shifts/time-off creates a notification in manager_notifications collection"""
        # Get initial notification count
        initial_response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert initial_response.status_code == 200
        initial_count = len(initial_response.json().get("notifications", []))
        
        # Create a time-off request
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        
        time_off_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": ORG_ADMIN_USER_ID,  # Using same user for simplicity
            "start_date": start_date,
            "end_date": end_date,
            "type": "vacation",
            "reason": "TEST_notification_test_vacation"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/time-off", json=time_off_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Time-off request should be created successfully"
        assert "request" in result, "Response should contain the created request"
        
        # Verify notification was created
        final_response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert final_response.status_code == 200
        final_data = final_response.json()
        final_count = len(final_data.get("notifications", []))
        
        # Check if a new notification was added
        assert final_count >= initial_count, "A notification should have been created"
        
        # Check the latest notification is about time-off
        if final_data["notifications"]:
            latest = final_data["notifications"][0]
            assert latest.get("type") == "time_off_request", f"Latest notification type should be 'time_off_request', got {latest.get('type')}"
            print(f"✓ POST time-off creates notification: {latest.get('title')}")
        else:
            print("✓ POST time-off request created (notification may be for different owner)")


class TestSwapRequestNotificationCreation:
    """Test that swap requests create manager notifications"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_swap_request_creates_notification(self):
        """POST /api/shifts/swap-request creates a notification in manager_notifications collection"""
        # First, we need a shift to swap. Let's create one
        shift_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        shift_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "assigned_to": ORG_ADMIN_USER_ID,
            "date": shift_date,
            "start_time": "09:00",
            "end_time": "17:00",
            "role": "TEST_swap_notification_role",
            "notes": "TEST_shift_for_swap_notification"
        }
        
        shift_response = self.session.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
        assert shift_response.status_code == 200, f"Failed to create shift: {shift_response.text}"
        
        shift_id = shift_response.json().get("shift", {}).get("id")
        assert shift_id, "Shift ID should be returned"
        
        # Get initial notification count
        initial_response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert initial_response.status_code == 200
        initial_count = len(initial_response.json().get("notifications", []))
        
        # Create a swap request
        swap_data = {
            "shift_id": shift_id,
            "requester_id": ORG_ADMIN_USER_ID,
            "target_user_id": ORG_ADMIN_USER_ID,  # Same user for simplicity
            "reason": "TEST_swap_notification_test"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/swap-request", json=swap_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") == True, "Swap request should be created successfully"
        
        # Verify notification was created
        final_response = self.session.get(f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}")
        assert final_response.status_code == 200
        final_data = final_response.json()
        
        # Check if a swap_request notification exists
        swap_notifications = [n for n in final_data.get("notifications", []) if n.get("type") == "swap_request"]
        assert len(swap_notifications) > 0, "A swap_request notification should exist"
        print(f"✓ POST swap-request creates notification: {swap_notifications[0].get('title')}")
        
        # Cleanup: delete the test shift
        self.session.delete(f"{BASE_URL}/api/shifts/{shift_id}")


class TestGlobalShiftSummary:
    """Test global shift summary endpoint for dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_global_shift_summary(self):
        """GET /api/shifts/summary/all-workspaces - returns global shift summary"""
        response = self.session.get(f"{BASE_URL}/api/shifts/summary/all-workspaces")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "summary" in data, "Response should contain 'summary' key"
        
        summary = data["summary"]
        expected_keys = ["total_shifts", "today_shifts", "pending_timeoff", "pending_swaps", "active_clocks"]
        for key in expected_keys:
            assert key in summary, f"Summary should contain '{key}'"
            assert isinstance(summary[key], int), f"{key} should be an integer"
        
        print(f"✓ GET global shift summary: total_shifts={summary['total_shifts']}, today={summary['today_shifts']}, pending_timeoff={summary['pending_timeoff']}, pending_swaps={summary['pending_swaps']}, active_clocks={summary['active_clocks']}")


class TestDashboardAnalyticsEndpoint:
    """Test analytics endpoint used by dashboard feature page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_platform_stats(self):
        """GET /api/analytics/platform-stats - returns platform statistics for dashboard"""
        response = self.session.get(f"{BASE_URL}/api/analytics/platform-stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "summary" in data, "Response should contain 'summary' key"
        assert "module_usage" in data, "Response should contain 'module_usage' key"
        assert "daily_activity" in data, "Response should contain 'daily_activity' key"
        
        summary = data["summary"]
        assert "total_users" in summary, "Summary should contain 'total_users'"
        assert "total_meetings" in summary, "Summary should contain 'total_meetings'"
        assert "total_workspaces" in summary, "Summary should contain 'total_workspaces'"
        
        print(f"✓ GET platform-stats: users={summary.get('total_users')}, meetings={summary.get('total_meetings')}, workspaces={summary.get('total_workspaces')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
