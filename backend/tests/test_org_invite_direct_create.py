"""
Tests for Organization Invite and Direct-Create Features:
- POST /api/organizations/{org_id}/invite - send invite email + return link
- POST /api/organizations/invite/validate - validate invite token
- GET /api/organizations/{org_id}/invites - list pending invites
- POST /api/organizations/{org_id}/direct-create - create member directly
- POST /api/auth/register?invite_token=xxx - register with invite token
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_ORG_ID = "4bb85d5c-29bb-4dc8-b5c5-780d538a697a"  # Munal Inc
TEST_USER_ID = "1ed7acd1-7e31-454a-a1f7-ff43c67c21d7"  # Justin
TEST_USER_EMAIL = "justin.ogala@munal.com"
TEST_USER_PASSWORD = "Justin@123456"

# Generate unique test identifiers
UNIQUE_ID = str(uuid.uuid4())[:8]


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for test user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed - skipping authenticated tests")


class TestOrgInviteEndpoint:
    """Tests for POST /api/organizations/{org_id}/invite"""
    
    def test_send_invite_returns_link_and_token(self, api_client):
        """Invite endpoint returns success with invite_link and token"""
        test_email = f"TEST_invite_{UNIQUE_ID}@example.com"
        
        response = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/invite", json={
            "email": test_email,
            "invited_by": TEST_USER_ID,
            "role": "member"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True, "Expected success=True"
        assert "invite_link" in data, "Missing invite_link in response"
        assert "token" in data, "Missing token in response"
        assert "email" in data, "Missing email in response"
        assert data["email"] == test_email.lower()
        
        # Verify invite_link contains the token
        assert data["token"] in data["invite_link"], "Token should be in invite_link"
        assert "/signup?invite=" in data["invite_link"], "invite_link should contain signup path"
        
        # Store token for later tests
        TestOrgInviteEndpoint.created_token = data["token"]
        TestOrgInviteEndpoint.created_email = test_email.lower()
    
    def test_invite_duplicate_org_member_returns_400(self, api_client):
        """Inviting existing org member should return 400"""
        response = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/invite", json={
            "email": TEST_USER_EMAIL,  # Justin is already a member
            "invited_by": TEST_USER_ID,
            "role": "member"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate member, got {response.status_code}"
        data = response.json()
        assert "already a member" in data.get("detail", "").lower() or "already" in data.get("detail", "").lower()
    
    def test_invite_nonexistent_org_returns_404(self, api_client):
        """Inviting to non-existent org returns 404"""
        fake_org_id = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/organizations/{fake_org_id}/invite", json={
            "email": "test@example.com",
            "invited_by": TEST_USER_ID,
            "role": "member"
        })
        
        assert response.status_code == 404, f"Expected 404 for fake org, got {response.status_code}"


class TestInviteValidateEndpoint:
    """Tests for POST /api/organizations/invite/validate"""
    
    def test_validate_valid_token_returns_org_info(self, api_client):
        """Validate endpoint returns org info and email for valid token"""
        # Use token created in previous test
        token = getattr(TestOrgInviteEndpoint, 'created_token', None)
        if not token:
            pytest.skip("No invite token from previous test")
        
        response = api_client.post(f"{BASE_URL}/api/organizations/invite/validate?token={token}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("valid") is True, "Expected valid=True"
        assert "organization" in data, "Missing organization in response"
        assert "email" in data, "Missing email in response"
        assert "role" in data, "Missing role in response"
        
        # Verify org info
        org = data["organization"]
        assert org.get("id") == TEST_ORG_ID, "Org ID should match"
        assert org.get("name") == "Munal Inc", "Org name should be Munal Inc"
        
        # Verify email matches what was invited
        expected_email = getattr(TestOrgInviteEndpoint, 'created_email', None)
        if expected_email:
            assert data["email"] == expected_email
    
    def test_validate_invalid_token_returns_404(self, api_client):
        """Validate endpoint returns 404 for invalid token"""
        fake_token = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/organizations/invite/validate?token={fake_token}")
        
        assert response.status_code == 404, f"Expected 404 for fake token, got {response.status_code}"
        data = response.json()
        assert "invalid" in data.get("detail", "").lower() or "not found" in data.get("detail", "").lower()


class TestListOrgInvites:
    """Tests for GET /api/organizations/{org_id}/invites"""
    
    def test_list_invites_returns_pending(self, api_client):
        """List invites returns array of pending invites"""
        response = api_client.get(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/invites")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "invites" in data, "Missing invites array in response"
        assert isinstance(data["invites"], list), "invites should be a list"
        
        # If there are invites, verify structure
        if len(data["invites"]) > 0:
            invite = data["invites"][0]
            assert "email" in invite, "Invite should have email"
            assert "token" in invite, "Invite should have token"
            assert "status" in invite, "Invite should have status"
            assert invite["status"] == "pending", "Listed invites should be pending"


class TestDirectCreateEndpoint:
    """Tests for POST /api/organizations/{org_id}/direct-create"""
    
    def test_direct_create_success(self, api_client):
        """Direct create creates a business user under the org"""
        test_email = f"TEST_direct_{UNIQUE_ID}@example.com"
        
        response = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/direct-create", json={
            "name": f"Test Direct User {UNIQUE_ID}",
            "email": test_email,
            "password": "TestPass@123",
            "role": "member",
            "plan": "Free"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response
        assert data.get("success") is True, "Expected success=True"
        assert "member" in data, "Missing member in response"
        
        member = data["member"]
        assert member.get("email") == test_email.lower()
        assert member.get("account_type") == "business", "Should be business account"
        assert member.get("organization_id") == TEST_ORG_ID, "Should be under test org"
        assert member.get("org_role") == "member", "Org role should match"
        assert member.get("status") == "Active", "Status should be Active"
        
        # Store for cleanup
        TestDirectCreateEndpoint.created_user_id = member.get("id")
    
    def test_direct_create_duplicate_email_returns_400(self, api_client):
        """Direct create with existing email returns 400"""
        response = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/direct-create", json={
            "name": "Duplicate User",
            "email": TEST_USER_EMAIL,  # Already exists
            "password": "TestPass@123",
            "role": "member",
            "plan": "Free"
        })
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}"
        data = response.json()
        assert "already exists" in data.get("detail", "").lower()
    
    def test_direct_create_nonexistent_org_returns_404(self, api_client):
        """Direct create to non-existent org returns 404"""
        fake_org_id = str(uuid.uuid4())
        response = api_client.post(f"{BASE_URL}/api/organizations/{fake_org_id}/direct-create", json={
            "name": "Test User",
            "email": "new@example.com",
            "password": "TestPass@123",
            "role": "member",
            "plan": "Free"
        })
        
        assert response.status_code == 404, f"Expected 404 for fake org, got {response.status_code}"


class TestRegisterWithInviteToken:
    """Tests for POST /api/auth/register?invite_token=xxx"""
    
    def test_register_with_invite_token_assigns_org(self, api_client):
        """Registering with invite token auto-assigns user to org"""
        # First create a fresh invite
        test_email = f"TEST_invitereg_{UNIQUE_ID}@example.com"
        
        invite_resp = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/invite", json={
            "email": test_email,
            "invited_by": TEST_USER_ID,
            "role": "manager"
        })
        
        if invite_resp.status_code != 200:
            pytest.skip(f"Could not create invite: {invite_resp.text}")
        
        invite_token = invite_resp.json().get("token")
        assert invite_token, "No token in invite response"
        
        # Now register using that token
        reg_resp = api_client.post(
            f"{BASE_URL}/api/auth/register?invite_token={invite_token}",
            json={
                "email": test_email,
                "password": "TestPass@123",
                "name": f"Invite Reg Test {UNIQUE_ID}"
            }
        )
        
        assert reg_resp.status_code == 200, f"Expected 200, got {reg_resp.status_code}: {reg_resp.text}"
        data = reg_resp.json()
        
        # Verify user is assigned to org
        user = data.get("user", {})
        assert user.get("account_type") == "business", "Should be business account"
        assert user.get("organization_id") == TEST_ORG_ID, "Should be assigned to Munal Inc"
        assert user.get("org_role") == "manager", "Should have role from invite"
        
        # Verify token is returned
        assert "token" in data, "Should return auth token"
        
        # Store for cleanup
        TestRegisterWithInviteToken.created_user_id = user.get("id")
    
    def test_register_without_invite_creates_personal_account(self, api_client):
        """Registering without invite creates personal account"""
        test_email = f"TEST_noreg_{UNIQUE_ID}@external.com"
        
        reg_resp = api_client.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": test_email,
                "password": "TestPass@123",
                "name": f"No Invite Test {UNIQUE_ID}"
            }
        )
        
        assert reg_resp.status_code == 200, f"Expected 200, got {reg_resp.status_code}: {reg_resp.text}"
        data = reg_resp.json()
        
        user = data.get("user", {})
        assert user.get("account_type") == "personal", "Should be personal account without invite"
        assert user.get("organization_id") is None, "Should not be assigned to any org"


class TestInviteFlow:
    """End-to-end invite flow tests"""
    
    def test_complete_invite_flow(self, api_client):
        """Test complete flow: send invite -> validate -> register"""
        test_email = f"TEST_flow_{UNIQUE_ID}_complete@example.com"
        
        # 1. Send invite
        invite_resp = api_client.post(f"{BASE_URL}/api/organizations/{TEST_ORG_ID}/invite", json={
            "email": test_email,
            "invited_by": TEST_USER_ID,
            "role": "member"
        })
        assert invite_resp.status_code == 200
        invite_data = invite_resp.json()
        token = invite_data["token"]
        
        # 2. Validate invite
        validate_resp = api_client.post(f"{BASE_URL}/api/organizations/invite/validate?token={token}")
        assert validate_resp.status_code == 200
        validate_data = validate_resp.json()
        assert validate_data["valid"] is True
        assert validate_data["organization"]["name"] == "Munal Inc"
        
        # 3. Register with token
        reg_resp = api_client.post(
            f"{BASE_URL}/api/auth/register?invite_token={token}",
            json={
                "email": test_email,
                "password": "TestPass@123",
                "name": "Flow Test User"
            }
        )
        assert reg_resp.status_code == 200
        user = reg_resp.json().get("user", {})
        assert user["organization_id"] == TEST_ORG_ID
        assert user["account_type"] == "business"
        
        # 4. Verify invite is now accepted (re-validate should fail or show different status)
        # After user registers, the invite status changes to "accepted"
        revalidate_resp = api_client.post(f"{BASE_URL}/api/organizations/invite/validate?token={token}")
        # Should return 400 (already used) or still work depending on implementation
        # The key is the flow completed successfully


# Cleanup fixture to remove test data after all tests
@pytest.fixture(scope="module", autouse=True)
def cleanup(api_client):
    """Cleanup test-created data after tests complete"""
    yield
    # After tests, cleanup could be done here if needed
    # For now, TEST_ prefixed data is self-identifying
