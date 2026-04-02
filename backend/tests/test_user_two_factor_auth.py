"""
User Two-Factor Authentication API Tests
Tests the extended 2FA functionality for ALL user roles (Admin, Manager, Member)
Endpoints under /api/user/2fa/
"""
import pytest
import requests
import os
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
REGULAR_USER_EMAIL = "justinoo2001@gmail.com"
REGULAR_USER_PASSWORD = "Ogala@2023"
REGULAR_USER_ID = "7be4b0ec-2a5f-45e8-b5f6-39f9f08d4c74"

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"

ORG_MEMBER_EMAIL = "orgmember@munal.com"
ORG_MEMBER_PASSWORD = "OrgMem@123"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def regular_user_login(api_client):
    """Login as regular user and get user_id"""
    response = api_client.post(f"{BASE_URL}/api/auth/login?skip_2fa=true", json={
        "email": REGULAR_USER_EMAIL,
        "password": REGULAR_USER_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return {
            "user_id": data.get("user", {}).get("id") or data.get("user_id"),
            "token": data.get("token"),
            "user": data.get("user")
        }
    pytest.skip(f"Regular user login failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def admin_login(api_client):
    """Login as admin and get token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login?skip_2fa=true", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return {
            "user_id": data.get("user", {}).get("id") or data.get("user_id"),
            "token": data.get("token"),
            "user": data.get("user")
        }
    pytest.skip(f"Admin login failed: {response.status_code} - {response.text}")


class TestUser2FAStatus:
    """Test GET /api/user/2fa/status/{user_id}"""
    
    def test_get_2fa_status_for_regular_user(self, api_client, regular_user_login):
        """Test 2FA status returns enabled:false for user without 2FA"""
        user_id = regular_user_login["user_id"]
        response = api_client.get(f"{BASE_URL}/api/user/2fa/status/{user_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "enabled" in data, "Response should contain 'enabled' field"
        assert "enforced" in data, "Response should contain 'enforced' field"
        assert isinstance(data["enabled"], bool), "enabled should be boolean"
        assert isinstance(data["enforced"], bool), "enforced should be boolean"
        print(f"2FA Status for user {user_id}: enabled={data['enabled']}, enforced={data['enforced']}")
    
    def test_get_2fa_status_invalid_user(self, api_client):
        """Test 2FA status returns 404 for non-existent user"""
        response = api_client.get(f"{BASE_URL}/api/user/2fa/status/invalid-user-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestUser2FASetup:
    """Test POST /api/user/2fa/setup"""
    
    def test_setup_2fa_totp_method(self, api_client, regular_user_login):
        """Test TOTP setup returns qr_code and totp_secret"""
        user_id = regular_user_login["user_id"]
        response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify TOTP setup response
        assert data.get("method") == "totp", "Method should be 'totp'"
        assert "qr_code" in data, "Response should contain 'qr_code'"
        assert "totp_secret" in data, "Response should contain 'totp_secret'"
        assert data["qr_code"].startswith("data:image/png;base64,"), "QR code should be base64 PNG"
        assert len(data["totp_secret"]) == 32, "TOTP secret should be 32 chars"
        print(f"TOTP setup successful, secret length: {len(data['totp_secret'])}")
    
    def test_setup_2fa_email_method(self, api_client, regular_user_login):
        """Test Email OTP setup sends email"""
        user_id = regular_user_login["user_id"]
        response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "email"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("method") == "email", "Method should be 'email'"
        assert data.get("email_sent") == True, "email_sent should be True"
        print("Email OTP setup successful, email_sent=True")
    
    def test_setup_2fa_both_method(self, api_client, regular_user_login):
        """Test Both methods setup returns QR code and sends email"""
        user_id = regular_user_login["user_id"]
        response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "both"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("method") == "both", "Method should be 'both'"
        assert "qr_code" in data, "Response should contain 'qr_code'"
        assert "totp_secret" in data, "Response should contain 'totp_secret'"
        assert data.get("email_sent") == True, "email_sent should be True"
        print("Both methods setup successful")
    
    def test_setup_2fa_invalid_method(self, api_client, regular_user_login):
        """Test invalid method returns 400"""
        user_id = regular_user_login["user_id"]
        response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "invalid_method"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
    
    def test_setup_2fa_invalid_user(self, api_client):
        """Test setup for non-existent user returns 404"""
        response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": "invalid-user-id-12345",
            "method": "totp"
        })
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestUser2FAVerifySetup:
    """Test POST /api/user/2fa/verify-setup"""
    
    def test_verify_setup_with_valid_totp(self, api_client, regular_user_login):
        """Test verify setup with valid TOTP code enables 2FA and returns recovery codes"""
        user_id = regular_user_login["user_id"]
        
        # First, setup TOTP
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        assert setup_response.status_code == 200
        totp_secret = setup_response.json()["totp_secret"]
        
        # Generate valid TOTP code
        totp = pyotp.TOTP(totp_secret)
        valid_code = totp.now()
        
        # Verify setup
        verify_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": valid_code,
            "method": "totp"
        })
        
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}: {verify_response.text}"
        data = verify_response.json()
        
        assert data.get("success") == True, "success should be True"
        assert "recovery_codes" in data, "Response should contain recovery_codes"
        assert len(data["recovery_codes"]) == 8, "Should return 8 recovery codes"
        print(f"2FA enabled successfully, got {len(data['recovery_codes'])} recovery codes")
        
        # Store recovery code for later tests
        return data["recovery_codes"]
    
    def test_verify_setup_with_invalid_code(self, api_client, regular_user_login):
        """Test verify setup with invalid code returns 400"""
        user_id = regular_user_login["user_id"]
        
        # First, setup TOTP
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        assert setup_response.status_code == 200
        
        # Try to verify with invalid code
        verify_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": "000000",
            "method": "totp"
        })
        
        assert verify_response.status_code == 400, f"Expected 400, got {verify_response.status_code}"


class TestUser2FAVerifyLogin:
    """Test POST /api/user/2fa/verify"""
    
    def test_verify_login_with_valid_totp(self, api_client, regular_user_login):
        """Test verify login with valid TOTP code succeeds"""
        user_id = regular_user_login["user_id"]
        
        # Setup and enable 2FA first
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        assert setup_response.status_code == 200
        totp_secret = setup_response.json()["totp_secret"]
        
        # Verify setup to enable 2FA
        totp = pyotp.TOTP(totp_secret)
        valid_code = totp.now()
        verify_setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": valid_code,
            "method": "totp"
        })
        assert verify_setup_response.status_code == 200
        
        # Now test login verification
        # Generate a new code (might be different if time passed)
        new_code = totp.now()
        verify_login_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify", json={
            "user_id": user_id,
            "code": new_code
        })
        
        assert verify_login_response.status_code == 200, f"Expected 200, got {verify_login_response.status_code}: {verify_login_response.text}"
        data = verify_login_response.json()
        assert data.get("success") == True, "success should be True"
        assert data.get("method_used") == "totp", "method_used should be 'totp'"
        print("Login verification with TOTP successful")
    
    def test_verify_login_with_invalid_code(self, api_client, regular_user_login):
        """Test verify login with invalid code returns 400"""
        user_id = regular_user_login["user_id"]
        
        # Ensure 2FA is enabled first
        status_response = api_client.get(f"{BASE_URL}/api/user/2fa/status/{user_id}")
        if status_response.status_code == 200 and not status_response.json().get("enabled"):
            # Enable 2FA
            setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
                "user_id": user_id,
                "method": "totp"
            })
            totp_secret = setup_response.json()["totp_secret"]
            totp = pyotp.TOTP(totp_secret)
            api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
                "user_id": user_id,
                "code": totp.now(),
                "method": "totp"
            })
        
        # Try to verify with invalid code
        verify_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify", json={
            "user_id": user_id,
            "code": "000000"
        })
        
        assert verify_response.status_code == 400, f"Expected 400, got {verify_response.status_code}"


class TestUser2FADisable:
    """Test POST /api/user/2fa/disable"""
    
    def test_disable_2fa_with_valid_code(self, api_client, regular_user_login):
        """Test disable 2FA with valid code succeeds (when not enforced)"""
        user_id = regular_user_login["user_id"]
        
        # First ensure enforcement is OFF
        api_client.post(f"{BASE_URL}/api/admin/2fa-enforcement", json={"enforce": False})
        
        # Setup and enable 2FA
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        assert setup_response.status_code == 200
        totp_secret = setup_response.json()["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        valid_code = totp.now()
        
        # Verify setup to enable 2FA
        verify_response = api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": valid_code,
            "method": "totp"
        })
        assert verify_response.status_code == 200
        
        # Now disable 2FA
        disable_code = totp.now()
        disable_response = api_client.post(f"{BASE_URL}/api/user/2fa/disable", json={
            "user_id": user_id,
            "code": disable_code
        })
        
        assert disable_response.status_code == 200, f"Expected 200, got {disable_response.status_code}: {disable_response.text}"
        data = disable_response.json()
        assert data.get("success") == True, "success should be True"
        print("2FA disabled successfully")
        
        # Verify 2FA is now disabled
        status_response = api_client.get(f"{BASE_URL}/api/user/2fa/status/{user_id}")
        assert status_response.json().get("enabled") == False, "2FA should be disabled"
    
    def test_disable_2fa_with_invalid_code(self, api_client, regular_user_login):
        """Test disable 2FA with invalid code returns 400"""
        user_id = regular_user_login["user_id"]
        
        # Setup and enable 2FA first
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        totp_secret = setup_response.json()["totp_secret"]
        totp = pyotp.TOTP(totp_secret)
        
        api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": totp.now(),
            "method": "totp"
        })
        
        # Try to disable with invalid code
        disable_response = api_client.post(f"{BASE_URL}/api/user/2fa/disable", json={
            "user_id": user_id,
            "code": "000000"
        })
        
        assert disable_response.status_code == 400, f"Expected 400, got {disable_response.status_code}"


class TestLoginWith2FA:
    """Test login flow with 2FA enabled"""
    
    def test_login_returns_requires_2fa_when_enabled(self, api_client, regular_user_login):
        """Test login returns requires_2fa:true when user has 2FA enabled"""
        user_id = regular_user_login["user_id"]
        
        # Setup and enable 2FA
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        totp_secret = setup_response.json()["totp_secret"]
        totp = pyotp.TOTP(totp_secret)
        
        api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": totp.now(),
            "method": "totp"
        })
        
        # Now login without skip_2fa
        login_response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": REGULAR_USER_EMAIL,
            "password": REGULAR_USER_PASSWORD
        })
        
        assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code}"
        data = login_response.json()
        
        assert data.get("requires_2fa") == True, "requires_2fa should be True"
        assert "user_id" in data, "Response should contain user_id"
        assert "two_factor_method" in data, "Response should contain two_factor_method"
        print(f"Login requires 2FA, method: {data.get('two_factor_method')}")
    
    def test_login_with_skip_2fa_bypasses_check(self, api_client, regular_user_login):
        """Test login with skip_2fa=true bypasses 2FA check"""
        # Login with skip_2fa
        login_response = api_client.post(f"{BASE_URL}/api/auth/login?skip_2fa=true", json={
            "email": REGULAR_USER_EMAIL,
            "password": REGULAR_USER_PASSWORD
        })
        
        assert login_response.status_code == 200, f"Expected 200, got {login_response.status_code}"
        data = login_response.json()
        
        # Should return token directly, not requires_2fa
        assert "token" in data, "Response should contain token when skip_2fa=true"
        assert data.get("requires_2fa") != True, "requires_2fa should not be True when skip_2fa=true"
        print("Login with skip_2fa successful, got token")


class TestAdmin2FAEnforcement:
    """Test admin 2FA enforcement endpoints"""
    
    def test_get_2fa_enforcement(self, api_client):
        """Test GET /api/admin/2fa-enforcement returns enforced status"""
        response = api_client.get(f"{BASE_URL}/api/admin/2fa-enforcement")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "enforced" in data, "Response should contain 'enforced' field"
        assert isinstance(data["enforced"], bool), "enforced should be boolean"
        print(f"2FA enforcement status: {data['enforced']}")
    
    def test_set_2fa_enforcement_on(self, api_client, admin_login):
        """Test POST /api/admin/2fa-enforcement with enforce:true"""
        response = api_client.post(
            f"{BASE_URL}/api/admin/2fa-enforcement",
            json={"enforce": True},
            headers={"Authorization": f"Bearer {admin_login['token']}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "success should be True"
        assert data.get("enforced") == True, "enforced should be True"
        print("2FA enforcement enabled")
    
    def test_set_2fa_enforcement_off(self, api_client, admin_login):
        """Test POST /api/admin/2fa-enforcement with enforce:false"""
        response = api_client.post(
            f"{BASE_URL}/api/admin/2fa-enforcement",
            json={"enforce": False},
            headers={"Authorization": f"Bearer {admin_login['token']}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True, "success should be True"
        assert data.get("enforced") == False, "enforced should be False"
        print("2FA enforcement disabled")
    
    def test_user_cannot_disable_2fa_when_enforced(self, api_client, regular_user_login, admin_login):
        """Test user cannot disable 2FA when enforcement is on"""
        user_id = regular_user_login["user_id"]
        
        # First, enable enforcement
        api_client.post(
            f"{BASE_URL}/api/admin/2fa-enforcement",
            json={"enforce": True},
            headers={"Authorization": f"Bearer {admin_login['token']}"}
        )
        
        # Setup and enable 2FA for user
        setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
            "user_id": user_id,
            "method": "totp"
        })
        totp_secret = setup_response.json()["totp_secret"]
        totp = pyotp.TOTP(totp_secret)
        
        api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
            "user_id": user_id,
            "code": totp.now(),
            "method": "totp"
        })
        
        # Try to disable 2FA - should fail with 403
        disable_response = api_client.post(f"{BASE_URL}/api/user/2fa/disable", json={
            "user_id": user_id,
            "code": totp.now()
        })
        
        assert disable_response.status_code == 403, f"Expected 403, got {disable_response.status_code}: {disable_response.text}"
        print("User correctly blocked from disabling 2FA when enforced")
        
        # Clean up - disable enforcement
        api_client.post(
            f"{BASE_URL}/api/admin/2fa-enforcement",
            json={"enforce": False},
            headers={"Authorization": f"Bearer {admin_login['token']}"}
        )


class TestUser2FAEnforcementEndpoint:
    """Test GET /api/user/2fa/enforcement endpoint"""
    
    def test_get_user_2fa_enforcement(self, api_client):
        """Test user can check enforcement status"""
        response = api_client.get(f"{BASE_URL}/api/user/2fa/enforcement")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "enforced" in data, "Response should contain 'enforced' field"
        print(f"User 2FA enforcement check: {data['enforced']}")


class TestCleanup:
    """Cleanup tests - disable 2FA for test user"""
    
    def test_cleanup_disable_2fa(self, api_client, regular_user_login, admin_login):
        """Cleanup: Disable 2FA for test user"""
        user_id = regular_user_login["user_id"]
        
        # Ensure enforcement is off
        api_client.post(
            f"{BASE_URL}/api/admin/2fa-enforcement",
            json={"enforce": False},
            headers={"Authorization": f"Bearer {admin_login['token']}"}
        )
        
        # Check if 2FA is enabled
        status_response = api_client.get(f"{BASE_URL}/api/user/2fa/status/{user_id}")
        if status_response.status_code == 200 and status_response.json().get("enabled"):
            # Setup new TOTP to get secret
            setup_response = api_client.post(f"{BASE_URL}/api/user/2fa/setup", json={
                "user_id": user_id,
                "method": "totp"
            })
            if setup_response.status_code == 200:
                totp_secret = setup_response.json().get("totp_secret")
                if totp_secret:
                    totp = pyotp.TOTP(totp_secret)
                    # Verify setup first
                    api_client.post(f"{BASE_URL}/api/user/2fa/verify-setup", json={
                        "user_id": user_id,
                        "code": totp.now(),
                        "method": "totp"
                    })
                    # Then disable
                    api_client.post(f"{BASE_URL}/api/user/2fa/disable", json={
                        "user_id": user_id,
                        "code": totp.now()
                    })
        
        print("Cleanup completed")
