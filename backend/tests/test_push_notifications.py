"""
Push Notification API Tests
Tests for browser push subscription CRUD and notification sending.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_ADMIN_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
TEST_WORKSPACE_ID = "b3478da2-7782-425a-9fa7-2dbc4f22d047"


class TestPushNotificationEndpoints:
    """Tests for push notification API endpoints"""

    def test_get_vapid_key(self):
        """GET /api/push/vapid-key — returns VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert isinstance(data["public_key"], str), "public_key should be a string"
        assert len(data["public_key"]) > 0, "public_key should not be empty"
        print(f"✓ VAPID key returned: {data['public_key'][:30]}...")

    def test_subscribe_push(self):
        """POST /api/push/subscribe — stores push subscription for user_id"""
        test_user_id = f"TEST_push_user_{uuid.uuid4().hex[:8]}"
        test_subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/test_{uuid.uuid4().hex}",
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "user_id": test_user_id,
                "subscription": test_subscription
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "id" in data or "message" in data, "Response should contain 'id' or 'message'"
        print(f"✓ Push subscription created for user: {test_user_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")

    def test_duplicate_subscription_prevention(self):
        """POST /api/push/subscribe with same endpoint returns 'Already subscribed'"""
        test_user_id = f"TEST_dup_user_{uuid.uuid4().hex[:8]}"
        test_endpoint = f"https://fcm.googleapis.com/fcm/send/dup_test_{uuid.uuid4().hex}"
        test_subscription = {
            "endpoint": test_endpoint,
            "keys": {
                "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                "auth": "tBHItJI5svbpez7KI4CCXg"
            }
        }
        
        # First subscription
        response1 = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"user_id": test_user_id, "subscription": test_subscription}
        )
        assert response1.status_code == 200
        
        # Second subscription with same endpoint
        response2 = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"user_id": test_user_id, "subscription": test_subscription}
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("message") == "Already subscribed", f"Expected 'Already subscribed', got: {data2}"
        print("✓ Duplicate subscription correctly detected")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")

    def test_get_push_status(self):
        """GET /api/push/status/{user_id} — returns subscribed boolean and count"""
        test_user_id = f"TEST_status_user_{uuid.uuid4().hex[:8]}"
        
        # Check status before subscription (should be not subscribed)
        response1 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}")
        assert response1.status_code == 200
        data1 = response1.json()
        assert "subscribed" in data1, "Response should contain 'subscribed'"
        assert "count" in data1, "Response should contain 'count'"
        assert data1["subscribed"] == False, "User should not be subscribed initially"
        assert data1["count"] == 0, "Count should be 0 initially"
        print(f"✓ Status before subscription: subscribed={data1['subscribed']}, count={data1['count']}")
        
        # Subscribe
        test_subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/status_test_{uuid.uuid4().hex}",
            "keys": {"p256dh": "test", "auth": "test"}
        }
        requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"user_id": test_user_id, "subscription": test_subscription}
        )
        
        # Check status after subscription
        response2 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}")
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["subscribed"] == True, "User should be subscribed after subscribing"
        assert data2["count"] >= 1, "Count should be at least 1 after subscribing"
        print(f"✓ Status after subscription: subscribed={data2['subscribed']}, count={data2['count']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")

    def test_unsubscribe_push(self):
        """DELETE /api/push/unsubscribe/{user_id} — removes push subscriptions"""
        test_user_id = f"TEST_unsub_user_{uuid.uuid4().hex[:8]}"
        
        # First subscribe
        test_subscription = {
            "endpoint": f"https://fcm.googleapis.com/fcm/send/unsub_test_{uuid.uuid4().hex}",
            "keys": {"p256dh": "test", "auth": "test"}
        }
        requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={"user_id": test_user_id, "subscription": test_subscription}
        )
        
        # Verify subscribed
        status1 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}").json()
        assert status1["subscribed"] == True
        
        # Unsubscribe
        response = requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "deleted" in data, "Response should contain 'deleted' count"
        print(f"✓ Unsubscribed user, deleted {data['deleted']} subscription(s)")
        
        # Verify unsubscribed
        status2 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}").json()
        assert status2["subscribed"] == False, "User should not be subscribed after unsubscribing"


class TestPushNotificationIntegration:
    """Tests for push notification integration with shifts"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token for org admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ORG_ADMIN_EMAIL, "password": ORG_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")

    def test_time_off_triggers_push_notification(self, auth_token):
        """POST /api/shifts/time-off triggers push notification via notify_workspace_owner"""
        test_user_id = f"TEST_timeoff_user_{uuid.uuid4().hex[:8]}"
        
        # Create time-off request
        response = requests.post(
            f"{BASE_URL}/api/shifts/time-off",
            json={
                "workspace_id": TEST_WORKSPACE_ID,
                "user_id": test_user_id,
                "start_date": "2026-02-01",
                "end_date": "2026-02-03",
                "reason": "Test time-off for push notification testing",
                "type": "vacation"
            },
            headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Time-off request should succeed"
        assert "request" in data, "Response should contain 'request'"
        print(f"✓ Time-off request created: {data['request'].get('id')}")
        print("  (Push notification triggered in background - check backend logs)")

    def test_swap_request_triggers_push_notification(self, auth_token):
        """POST /api/shifts/swap-request triggers push notification via notify_workspace_owner"""
        # First, we need a shift to swap
        # Create a test shift
        shift_response = requests.post(
            f"{BASE_URL}/api/shifts/create",
            json={
                "workspace_id": TEST_WORKSPACE_ID,
                "assigned_to": ORG_ADMIN_USER_ID,
                "date": "2026-02-15",
                "start_time": "09:00",
                "end_time": "17:00",
                "role": "Test Role",
                "notes": "Test shift for swap request"
            },
            headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {}
        )
        
        if shift_response.status_code != 200:
            pytest.skip(f"Could not create test shift: {shift_response.text}")
        
        shift_data = shift_response.json()
        shift_id = shift_data.get("shift", {}).get("id")
        
        if not shift_id:
            pytest.skip("No shift ID returned")
        
        # Create swap request
        target_user_id = f"TEST_target_user_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/shifts/swap-request",
            json={
                "shift_id": shift_id,
                "requester_id": ORG_ADMIN_USER_ID,
                "target_user_id": target_user_id,
                "reason": "Test swap request for push notification testing"
            },
            headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Swap request should succeed"
        assert "request" in data, "Response should contain 'request'"
        print(f"✓ Swap request created: {data['request'].get('id')}")
        print("  (Push notification triggered in background - check backend logs)")
        
        # Cleanup - delete the test shift
        requests.delete(f"{BASE_URL}/api/shifts/{shift_id}")


class TestRegressionManagerNotifications:
    """Regression tests for manager notification bell"""

    @pytest.fixture
    def auth_token(self):
        """Get authentication token for org admin"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ORG_ADMIN_EMAIL, "password": ORG_ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip(f"Authentication failed: {response.status_code}")

    def test_manager_notifications_endpoint(self, auth_token):
        """GET /api/shifts/manager-notifications/{user_id} still works"""
        response = requests.get(
            f"{BASE_URL}/api/shifts/manager-notifications/{ORG_ADMIN_USER_ID}",
            headers={"Authorization": f"Bearer {auth_token}"} if auth_token else {}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "notifications" in data, "Response should contain 'notifications'"
        assert "unread_count" in data, "Response should contain 'unread_count'"
        print(f"✓ Manager notifications: {len(data['notifications'])} total, {data['unread_count']} unread")


class TestRegressionDashboard:
    """Regression tests for dashboard feature page"""

    def test_dashboard_summary_endpoint(self):
        """GET /api/shifts/summary/all-workspaces still returns live data"""
        response = requests.get(f"{BASE_URL}/api/shifts/summary/all-workspaces")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "summary" in data, "Response should contain 'summary'"
        
        summary = data["summary"]
        expected_fields = ["total_shifts", "today_shifts", "pending_timeoff", "pending_swaps", "active_clocks"]
        for field in expected_fields:
            assert field in summary, f"Summary should contain '{field}'"
        
        print(f"✓ Dashboard summary: {summary}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
