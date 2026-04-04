"""
FCM Device Token API Tests
Tests for mobile device token registration (FCM) for Capacitor native apps.
New endpoints added for Phase 2: Push Notification backend with FCM device token registration.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestFCMDeviceTokenEndpoints:
    """Tests for FCM device token CRUD endpoints"""

    def test_register_device_android(self):
        """POST /api/push/register-device — register Android device token"""
        test_user_id = f"TEST_fcm_android_{uuid.uuid4().hex[:8]}"
        test_token = f"fcm_token_android_{uuid.uuid4().hex}"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": test_token,
                "platform": "android",
                "device_name": "Test Android Device"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "id" in data, "Response should contain 'id'"
        print(f"✓ Android device registered: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_register_device_ios(self):
        """POST /api/push/register-device — register iOS device token"""
        test_user_id = f"TEST_fcm_ios_{uuid.uuid4().hex[:8]}"
        test_token = f"fcm_token_ios_{uuid.uuid4().hex}"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": test_token,
                "platform": "ios",
                "device_name": "Test iPhone"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "id" in data, "Response should contain 'id'"
        print(f"✓ iOS device registered: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_register_device_without_device_name(self):
        """POST /api/push/register-device — device_name is optional"""
        test_user_id = f"TEST_fcm_noname_{uuid.uuid4().hex[:8]}"
        test_token = f"fcm_token_noname_{uuid.uuid4().hex}"
        
        response = requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": test_token,
                "platform": "android"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print("✓ Device registered without device_name")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_register_device_upsert(self):
        """POST /api/push/register-device — same token updates existing record"""
        test_user_id = f"TEST_fcm_upsert_{uuid.uuid4().hex[:8]}"
        test_token = f"fcm_token_upsert_{uuid.uuid4().hex}"
        
        # First registration
        response1 = requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": test_token,
                "platform": "android",
                "device_name": "Original Name"
            }
        )
        assert response1.status_code == 200
        data1 = response1.json()
        assert "id" in data1, "First registration should return id"
        
        # Second registration with same token (should update)
        response2 = requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": test_token,
                "platform": "android",
                "device_name": "Updated Name"
            }
        )
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("message") == "Device token updated", f"Expected 'Device token updated', got: {data2}"
        print("✓ Device token upsert works correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_list_user_devices(self):
        """GET /api/push/devices/{user_id} — list registered devices"""
        test_user_id = f"TEST_fcm_list_{uuid.uuid4().hex[:8]}"
        
        # Register two devices
        for i, platform in enumerate(["android", "ios"]):
            requests.post(
                f"{BASE_URL}/api/push/register-device",
                json={
                    "user_id": test_user_id,
                    "token": f"fcm_token_list_{i}_{uuid.uuid4().hex}",
                    "platform": platform,
                    "device_name": f"Test {platform.capitalize()} Device"
                }
            )
        
        # List devices
        response = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "devices" in data, "Response should contain 'devices'"
        assert "count" in data, "Response should contain 'count'"
        assert data["count"] == 2, f"Expected 2 devices, got {data['count']}"
        assert len(data["devices"]) == 2, f"Expected 2 devices in list, got {len(data['devices'])}"
        
        # Verify device structure
        for device in data["devices"]:
            assert "id" in device, "Device should have 'id'"
            assert "user_id" in device, "Device should have 'user_id'"
            assert "token" in device, "Device should have 'token'"
            assert "platform" in device, "Device should have 'platform'"
            assert "created_at" in device, "Device should have 'created_at'"
            assert "_id" not in device, "Device should not expose MongoDB _id"
        
        print(f"✓ Listed {data['count']} devices for user")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_list_devices_empty(self):
        """GET /api/push/devices/{user_id} — returns empty list for new user"""
        test_user_id = f"TEST_fcm_empty_{uuid.uuid4().hex[:8]}"
        
        response = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["devices"] == [], "Devices should be empty list"
        assert data["count"] == 0, "Count should be 0"
        print("✓ Empty device list returned for new user")

    def test_unregister_device_all(self):
        """DELETE /api/push/unregister-device/{user_id} — removes all devices"""
        test_user_id = f"TEST_fcm_unreg_{uuid.uuid4().hex[:8]}"
        
        # Register two devices
        for i in range(2):
            requests.post(
                f"{BASE_URL}/api/push/register-device",
                json={
                    "user_id": test_user_id,
                    "token": f"fcm_token_unreg_{i}_{uuid.uuid4().hex}",
                    "platform": "android"
                }
            )
        
        # Verify registered
        status1 = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}").json()
        assert status1["count"] == 2, "Should have 2 devices before unregister"
        
        # Unregister all
        response = requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert data.get("deleted") == 2, f"Expected 2 deleted, got {data.get('deleted')}"
        print(f"✓ Unregistered {data['deleted']} devices")
        
        # Verify unregistered
        status2 = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}").json()
        assert status2["count"] == 0, "Should have 0 devices after unregister"

    def test_unregister_device_specific_token(self):
        """DELETE /api/push/unregister-device/{user_id}?token=X — removes specific device"""
        test_user_id = f"TEST_fcm_spec_{uuid.uuid4().hex[:8]}"
        token1 = f"fcm_token_spec_1_{uuid.uuid4().hex}"
        token2 = f"fcm_token_spec_2_{uuid.uuid4().hex}"
        
        # Register two devices
        requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={"user_id": test_user_id, "token": token1, "platform": "android"}
        )
        requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={"user_id": test_user_id, "token": token2, "platform": "ios"}
        )
        
        # Verify both registered
        status1 = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}").json()
        assert status1["count"] == 2
        
        # Unregister only token1
        response = requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}?token={token1}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("deleted") == 1, f"Expected 1 deleted, got {data.get('deleted')}"
        print("✓ Unregistered specific device token")
        
        # Verify only token2 remains
        status2 = requests.get(f"{BASE_URL}/api/push/devices/{test_user_id}").json()
        assert status2["count"] == 1, "Should have 1 device remaining"
        assert status2["devices"][0]["token"] == token2, "Remaining device should be token2"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")


class TestPushStatusWithMobile:
    """Tests for combined web+mobile push status"""

    def test_status_includes_mobile_count(self):
        """GET /api/push/status/{user_id} — includes mobile_count"""
        test_user_id = f"TEST_status_mobile_{uuid.uuid4().hex[:8]}"
        
        # Check initial status
        response1 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}")
        assert response1.status_code == 200
        data1 = response1.json()
        assert "web_count" in data1, "Response should contain 'web_count'"
        assert "mobile_count" in data1, "Response should contain 'mobile_count'"
        assert data1["mobile_count"] == 0, "mobile_count should be 0 initially"
        print(f"✓ Initial status: web={data1['web_count']}, mobile={data1['mobile_count']}")
        
        # Register mobile device
        requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": f"fcm_token_status_{uuid.uuid4().hex}",
                "platform": "android"
            }
        )
        
        # Check status after mobile registration
        response2 = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}")
        data2 = response2.json()
        assert data2["mobile_count"] == 1, "mobile_count should be 1 after registration"
        assert data2["subscribed"] == True, "subscribed should be True with mobile device"
        print(f"✓ After mobile registration: web={data2['web_count']}, mobile={data2['mobile_count']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")

    def test_status_combined_web_and_mobile(self):
        """GET /api/push/status/{user_id} — combined web+mobile subscribed status"""
        test_user_id = f"TEST_combined_{uuid.uuid4().hex[:8]}"
        
        # Register web subscription
        requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "user_id": test_user_id,
                "subscription": {
                    "endpoint": f"https://fcm.googleapis.com/fcm/send/combined_{uuid.uuid4().hex}",
                    "keys": {"p256dh": "test", "auth": "test"}
                }
            }
        )
        
        # Register mobile device
        requests.post(
            f"{BASE_URL}/api/push/register-device",
            json={
                "user_id": test_user_id,
                "token": f"fcm_token_combined_{uuid.uuid4().hex}",
                "platform": "ios"
            }
        )
        
        # Check combined status
        response = requests.get(f"{BASE_URL}/api/push/status/{test_user_id}")
        data = response.json()
        assert data["web_count"] == 1, "web_count should be 1"
        assert data["mobile_count"] == 1, "mobile_count should be 1"
        assert data["subscribed"] == True, "subscribed should be True"
        print(f"✓ Combined status: web={data['web_count']}, mobile={data['mobile_count']}, subscribed={data['subscribed']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")
        requests.delete(f"{BASE_URL}/api/push/unregister-device/{test_user_id}")


class TestVAPIDKeyEndpoint:
    """Tests for VAPID public key endpoint"""

    def test_vapid_key_returns_key(self):
        """GET /api/push/vapid-key — returns VAPID public key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-key")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "public_key" in data, "Response should contain 'public_key'"
        assert isinstance(data["public_key"], str), "public_key should be a string"
        assert len(data["public_key"]) > 0, "public_key should not be empty"
        print(f"✓ VAPID key returned: {data['public_key'][:40]}...")


class TestWebPushSubscription:
    """Tests for web push subscription endpoints (regression)"""

    def test_subscribe_web_push(self):
        """POST /api/push/subscribe — stores web push subscription"""
        test_user_id = f"TEST_web_sub_{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            json={
                "user_id": test_user_id,
                "subscription": {
                    "endpoint": f"https://fcm.googleapis.com/fcm/send/web_{uuid.uuid4().hex}",
                    "keys": {
                        "p256dh": "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM",
                        "auth": "tBHItJI5svbpez7KI4CCXg"
                    }
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        print("✓ Web push subscription created")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/push/unsubscribe/{test_user_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
