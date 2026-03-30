"""
Two-Factor Authentication (2FA) API Tests
Tests for TOTP, Email OTP, and recovery code flows
Admin user ID: 3fe4c41c-4f43-4683-98dc-db6de39b842c
"""
import pytest
import requests
import os
import pyotp

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"
OLD_ADMIN_EMAIL = "admin@munal.com"
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"

ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"


class TestAdminLoginCredentials:
    """Test admin login with new and old email"""
    
    def test_admin_login_new_email_success(self):
        """Admin login with new email admin@munal.ai should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # May return requires_2fa or user/token
        if "requires_2fa" in data:
            assert data["requires_2fa"] == True
            assert "user_id" in data
            print(f"Admin login requires 2FA, user_id: {data['user_id']}")
        else:
            assert "user" in data or "token" in data
            print(f"Admin login successful, user: {data.get('user', {}).get('email')}")
    
    def test_admin_login_old_email_fails(self):
        """Admin login with old email admin@munal.com should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": OLD_ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Invalid" in data.get("detail", "") or "invalid" in data.get("detail", "").lower()
        print(f"Old email correctly rejected: {data.get('detail')}")
    
    def test_admin_login_wrong_password_fails(self):
        """Admin login with wrong password should fail"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": "WrongPassword123"
        })
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("Wrong password correctly rejected")


class Test2FAStatusEndpoint:
    """Test GET /api/admin/2fa/status/{user_id}"""
    
    def test_get_2fa_status_valid_user(self):
        """Get 2FA status for admin user"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "enabled" in data
        assert "method" in data
        print(f"2FA Status: enabled={data['enabled']}, method={data['method']}")
    
    def test_get_2fa_status_invalid_user(self):
        """Get 2FA status for non-existent user should return 404"""
        response = requests.get(f"{BASE_URL}/api/admin/2fa/status/invalid-user-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Invalid user correctly returns 404")


class Test2FASetupEndpoint:
    """Test POST /api/admin/2fa/setup"""
    
    def test_setup_2fa_totp_method(self):
        """Setup 2FA with TOTP method returns QR code and secret"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "totp"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["method"] == "totp"
        assert "qr_code" in data
        assert data["qr_code"].startswith("data:image/png;base64,")
        assert "totp_secret" in data
        assert len(data["totp_secret"]) > 10  # Base32 secret
        print(f"TOTP setup successful, secret length: {len(data['totp_secret'])}")
    
    def test_setup_2fa_email_method(self):
        """Setup 2FA with email method sends email OTP"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "email"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["method"] == "email"
        assert data.get("email_sent") == True
        print("Email OTP setup successful, email_sent=True")
    
    def test_setup_2fa_both_method(self):
        """Setup 2FA with both methods returns QR code AND sends email"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "both"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["method"] == "both"
        assert "qr_code" in data
        assert "totp_secret" in data
        assert data.get("email_sent") == True
        print("Both methods setup successful: QR code + email sent")
    
    def test_setup_2fa_invalid_method(self):
        """Setup 2FA with invalid method should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "invalid_method"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Invalid method correctly rejected")
    
    def test_setup_2fa_invalid_user(self):
        """Setup 2FA for non-existent user should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": "invalid-user-id-12345",
            "method": "totp"
        })
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Invalid user correctly returns 404")


class Test2FAVerifySetupEndpoint:
    """Test POST /api/admin/2fa/verify-setup"""
    
    def test_verify_setup_totp_valid_code(self):
        """Verify TOTP setup with valid code returns recovery codes"""
        # First setup TOTP to get the secret
        setup_response = requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "totp"
        })
        assert setup_response.status_code == 200
        totp_secret = setup_response.json()["totp_secret"]
        
        # Generate valid TOTP code
        totp = pyotp.TOTP(totp_secret)
        valid_code = totp.now()
        
        # Verify setup
        response = requests.post(f"{BASE_URL}/api/admin/2fa/verify-setup", json={
            "user_id": ADMIN_USER_ID,
            "code": valid_code,
            "method": "totp"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["success"] == True
        assert "recovery_codes" in data
        assert len(data["recovery_codes"]) == 8  # 8 recovery codes
        print(f"TOTP verification successful, got {len(data['recovery_codes'])} recovery codes")
        
        # Store recovery code for later tests
        return data["recovery_codes"]
    
    def test_verify_setup_invalid_code(self):
        """Verify setup with invalid code should fail"""
        # First setup TOTP
        requests.post(f"{BASE_URL}/api/admin/2fa/setup", json={
            "user_id": ADMIN_USER_ID,
            "method": "totp"
        })
        
        # Try invalid code
        response = requests.post(f"{BASE_URL}/api/admin/2fa/verify-setup", json={
            "user_id": ADMIN_USER_ID,
            "code": "000000",
            "method": "totp"
        })
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("Invalid code correctly rejected")


class Test2FAVerifyLoginEndpoint:
    """Test POST /api/admin/2fa/verify (login verification)"""
    
    def test_verify_login_without_2fa_enabled(self):
        """Verify login when 2FA is not enabled should fail"""
        # First check if 2FA is enabled
        status_response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        status = status_response.json()
        
        if not status.get("enabled"):
            response = requests.post(f"{BASE_URL}/api/admin/2fa/verify", json={
                "user_id": ADMIN_USER_ID,
                "code": "123456"
            })
            assert response.status_code == 400, f"Expected 400, got {response.status_code}"
            print("Verify login correctly fails when 2FA not enabled")
        else:
            pytest.skip("2FA is enabled, skipping this test")


class Test2FADisableEndpoint:
    """Test POST /api/admin/2fa/disable"""
    
    def test_disable_2fa_invalid_code(self):
        """Disable 2FA with invalid code should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/disable", json={
            "user_id": ADMIN_USER_ID,
            "code": "invalid-code"
        })
        # Should fail with 400 if 2FA is enabled, or if code is invalid
        assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        print("Invalid disable code correctly rejected")


class Test2FASendEmailOTPEndpoint:
    """Test POST /api/admin/2fa/send-email-otp"""
    
    def test_send_email_otp_2fa_not_enabled(self):
        """Send email OTP when 2FA not enabled should fail"""
        # Check if 2FA is enabled first
        status_response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        status = status_response.json()
        
        if not status.get("enabled"):
            response = requests.post(f"{BASE_URL}/api/admin/2fa/send-email-otp?user_id={ADMIN_USER_ID}")
            assert response.status_code == 400, f"Expected 400, got {response.status_code}"
            print("Send email OTP correctly fails when 2FA not enabled")
        else:
            pytest.skip("2FA is enabled, skipping this test")
    
    def test_send_email_otp_invalid_user(self):
        """Send email OTP for invalid user should fail"""
        response = requests.post(f"{BASE_URL}/api/admin/2fa/send-email-otp?user_id=invalid-user-id")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("Invalid user correctly returns 404")


class TestLoginWith2FAFlow:
    """Test login flow with 2FA enabled"""
    
    def test_login_returns_requires_2fa_when_enabled(self):
        """Login should return requires_2fa:true when 2FA is enabled"""
        # First check 2FA status
        status_response = requests.get(f"{BASE_URL}/api/admin/2fa/status/{ADMIN_USER_ID}")
        status = status_response.json()
        
        if status.get("enabled"):
            response = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            assert response.status_code == 200
            data = response.json()
            assert data.get("requires_2fa") == True
            assert "user_id" in data
            assert "two_factor_method" in data
            print(f"Login correctly returns requires_2fa=True, method={data['two_factor_method']}")
        else:
            pytest.skip("2FA is not enabled for admin user")
    
    def test_login_with_skip_2fa_bypasses_check(self):
        """Login with skip_2fa=true should bypass 2FA check"""
        response = requests.post(f"{BASE_URL}/api/auth/login?skip_2fa=true", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Should return token directly, not requires_2fa
        assert "token" in data or "user" in data
        assert data.get("requires_2fa") != True
        print("Login with skip_2fa=true bypasses 2FA check successfully")


class TestOrgAdminLogin:
    """Test org admin login (should work without 2FA)"""
    
    def test_org_admin_login_success(self):
        """Org admin login should succeed"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ORG_ADMIN_EMAIL,
            "password": ORG_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        # Org admin may or may not have 2FA
        if "requires_2fa" in data:
            print(f"Org admin has 2FA enabled")
        else:
            assert "token" in data
            assert "user" in data
            print(f"Org admin login successful: {data['user'].get('email')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
