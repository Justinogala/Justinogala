"""
Two-Factor Authentication (2FA) API Tests
Tests TOTP, Email OTP, and Recovery Code flows
"""
import pytest
import requests
import os
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


class Test2FAStatus:
    """Test GET /api/admin/2fa/status/{user_id}"""
    
    def test_get_2fa_status_success(self):
        """Should return 2FA status for valid user"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "enabled" in data
        assert "method" in data
        assert isinstance(data["enabled"], bool)
        print(f"2FA Status: enabled={data['enabled']}, method={data['method']}")
    
    def test_get_2fa_status_invalid_user(self):
        """Should return 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa/status/invalid-user-id-12345")
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()


class Test2FASetup:
    """Test POST /api/admin/2fa/setup"""
    
    def test_setup_totp_method(self):
        """Should return QR code and TOTP secret for TOTP method"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "totp"
        assert "qr_code" in data
        assert "totp_secret" in data
        assert data["qr_code"].startswith("data:image/png;base64,")
        assert len(data["totp_secret"]) == 32  # Base32 encoded secret
        print(f"TOTP setup successful, secret length: {len(data['totp_secret'])}")
    
    def test_setup_email_method(self):
        """Should send email OTP for email method"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "email"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "email"
        assert data.get("email_sent") == True
        print("Email OTP setup successful")
    
    def test_setup_both_methods(self):
        """Should return QR code and send email for 'both' method"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "both"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["method"] == "both"
        assert "qr_code" in data
        assert "totp_secret" in data
        assert data.get("email_sent") == True
        print("Both methods setup successful")
    
    def test_setup_invalid_method(self):
        """Should return 400 for invalid method"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "invalid"}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
    
    def test_setup_invalid_user(self):
        """Should return 404 for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": "invalid-user-id", "method": "totp"}
        )
        assert response.status_code == 404


class Test2FAVerifySetup:
    """Test POST /api/admin/2fa/verify-setup - Full enable flow"""
    
    def test_verify_setup_totp_success(self):
        """Should enable 2FA with valid TOTP code and return recovery codes"""
        # Step 1: Setup TOTP
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        assert setup_response.status_code == 200
        totp_secret = setup_response.json()["totp_secret"]
        
        # Step 2: Generate valid TOTP code
        totp = pyotp.TOTP(totp_secret)
        code = totp.now()
        
        # Step 3: Verify setup
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": code, "method": "totp"}
        )
        assert verify_response.status_code == 200
        data = verify_response.json()
        assert data["success"] == True
        assert data["method"] == "totp"
        assert "recovery_codes" in data
        assert len(data["recovery_codes"]) == 8
        
        # Verify recovery code format (XXXX-XXXX)
        for rc in data["recovery_codes"]:
            assert len(rc) == 9
            assert rc[4] == "-"
        
        print(f"2FA enabled successfully with {len(data['recovery_codes'])} recovery codes")
        
        # Step 4: Verify status is now enabled
        status_response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        assert status_response.status_code == 200
        assert status_response.json()["enabled"] == True
        
        return data["recovery_codes"], totp_secret
    
    def test_verify_setup_invalid_code(self):
        """Should reject invalid TOTP code"""
        # Setup first
        requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        
        # Try invalid code
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": "000000", "method": "totp"}
        )
        assert verify_response.status_code == 400
        assert "Invalid" in verify_response.json().get("detail", "")


class Test2FAVerifyLogin:
    """Test POST /api/admin/2fa/verify - Login verification"""
    
    @pytest.fixture(autouse=True)
    def setup_2fa(self):
        """Enable 2FA before tests and disable after"""
        # Setup TOTP
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        self.totp_secret = setup_response.json()["totp_secret"]
        
        # Verify setup to enable 2FA
        totp = pyotp.TOTP(self.totp_secret)
        verify_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": totp.now(), "method": "totp"}
        )
        self.recovery_codes = verify_response.json().get("recovery_codes", [])
        
        yield
        
        # Cleanup: Disable 2FA
        totp = pyotp.TOTP(self.totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )
    
    def test_verify_login_with_totp(self):
        """Should verify login with valid TOTP code"""
        totp = pyotp.TOTP(self.totp_secret)
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["method_used"] == "totp"
        print("Login verified with TOTP")
    
    def test_verify_login_with_recovery_code(self):
        """Should verify login with recovery code"""
        if not self.recovery_codes:
            pytest.skip("No recovery codes available")
        
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify",
            json={"user_id": ADMIN_USER_ID, "code": self.recovery_codes[0]}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["method_used"] == "recovery"
        print("Login verified with recovery code")
    
    def test_verify_login_invalid_code(self):
        """Should reject invalid code"""
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/verify",
            json={"user_id": ADMIN_USER_ID, "code": "000000"}
        )
        assert response.status_code == 400
        assert "Invalid" in response.json().get("detail", "")


class Test2FADisable:
    """Test POST /api/admin/2fa/disable"""
    
    def test_disable_2fa_with_totp(self):
        """Should disable 2FA with valid TOTP code"""
        # First enable 2FA
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        totp_secret = setup_response.json()["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": totp.now(), "method": "totp"}
        )
        
        # Verify enabled
        status = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}").json()
        assert status["enabled"] == True
        
        # Disable with TOTP
        totp = pyotp.TOTP(totp_secret)
        disable_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )
        assert disable_response.status_code == 200
        assert disable_response.json()["success"] == True
        
        # Verify disabled
        status = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}").json()
        assert status["enabled"] == False
        print("2FA disabled successfully")
    
    def test_disable_2fa_invalid_code(self):
        """Should reject disable with invalid code"""
        # First enable 2FA
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        totp_secret = setup_response.json()["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": totp.now(), "method": "totp"}
        )
        
        # Try disable with invalid code
        disable_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": "000000"}
        )
        assert disable_response.status_code == 400
        
        # Cleanup: Disable with valid code
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )


class TestLoginWith2FA:
    """Test login flow with 2FA enabled"""
    
    def test_login_requires_2fa_when_enabled(self):
        """Login should return requires_2fa when 2FA is enabled"""
        # Enable 2FA
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        totp_secret = setup_response.json()["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": totp.now(), "method": "totp"}
        )
        
        # Try login without skip_2fa
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert data["requires_2fa"] == True
        assert data["two_factor_method"] == "totp"
        assert data["user_id"] == ADMIN_USER_ID
        print("Login correctly requires 2FA")
        
        # Cleanup
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )
    
    def test_login_with_skip_2fa(self):
        """Login with skip_2fa=true should bypass 2FA"""
        # Enable 2FA
        setup_response = requests.post(
            f"{BASE_URL}/api/admin/2fa/setup",
            json={"user_id": ADMIN_USER_ID, "method": "totp"}
        )
        totp_secret = setup_response.json()["totp_secret"]
        
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/verify-setup",
            json={"user_id": ADMIN_USER_ID, "code": totp.now(), "method": "totp"}
        )
        
        # Login with skip_2fa
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login?skip_2fa=true",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert login_response.status_code == 200
        data = login_response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["id"] == ADMIN_USER_ID
        print("Login with skip_2fa successful")
        
        # Cleanup
        totp = pyotp.TOTP(totp_secret)
        requests.post(
            f"{BASE_URL}/api/admin/2fa/disable",
            json={"user_id": ADMIN_USER_ID, "code": totp.now()}
        )


class TestSendEmailOTP:
    """Test POST /api/admin/2fa/send-email-otp"""
    
    def test_send_email_otp_requires_2fa_enabled(self):
        """Should fail if 2FA is not enabled"""
        # Make sure 2FA is disabled
        status = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}").json()
        if status["enabled"]:
            pytest.skip("2FA is enabled, skipping this test")
        
        response = requests.post(
            f"{BASE_URL}/api/admin/2fa/send-email-otp?user_id={ADMIN_USER_ID}"
        )
        assert response.status_code == 400
        assert "not enabled" in response.json().get("detail", "").lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
