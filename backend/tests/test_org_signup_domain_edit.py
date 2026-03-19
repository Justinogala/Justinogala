"""
Tests for new Organization features:
1. Organization Self-Registration (POST /api/organizations/signup)
2. Edit Organization Member (PUT /api/organizations/{org_id}/members/{user_id})
3. Domain Auto-Enrollment (POST /api/auth/register with matching domain)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data identifiers
TEST_ORG_PREFIX = "TEST_ORG_" + datetime.now().strftime("%H%M%S")
TEST_EMAIL_PREFIX = f"test{datetime.now().strftime('%H%M%S')}"


class TestOrgSelfSignup:
    """Test Organization Self-Registration endpoint POST /api/organizations/signup"""

    def test_org_signup_creates_org_and_admin(self):
        """POST /api/organizations/signup should create org + admin user in one step"""
        org_name = f"{TEST_ORG_PREFIX}_SelfSignup"
        admin_email = f"{TEST_EMAIL_PREFIX}_admin@testorg.com"
        
        payload = {
            "org_name": org_name,
            "domain": "testorg.com",
            "description": "Test org via self-signup",
            "admin_name": "Test Admin",
            "admin_email": admin_email,
            "admin_password": "TestPass@123456"
        }
        
        response = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True
        assert "organization" in data
        assert "user" in data
        
        # Verify organization data
        org = data["organization"]
        assert org["name"] == org_name
        assert org["domain"] == "testorg.com"
        assert org["description"] == "Test org via self-signup"
        assert "id" in org
        
        # Verify user data
        user = data["user"]
        assert user["email"] == admin_email.lower()
        assert user["name"] == "Test Admin"
        assert user["account_type"] == "business"
        assert user["org_role"] == "admin"
        assert user["organization_id"] == org["id"]
        
        # Cleanup: delete org and user
        requests.delete(f"{BASE_URL}/api/organizations/{org['id']}")
        requests.delete(f"{BASE_URL}/api/users/{user['id']}")
        
        print("PASSED: Org self-signup creates org + admin user")

    def test_org_signup_duplicate_org_name_returns_400(self):
        """POST /api/organizations/signup with duplicate org name should return 400"""
        # First create an org
        org_name = f"{TEST_ORG_PREFIX}_DuplicateName"
        payload = {
            "org_name": org_name,
            "admin_name": "Test Admin",
            "admin_email": f"{TEST_EMAIL_PREFIX}_dup1@test.com",
            "admin_password": "TestPass@123456"
        }
        
        response1 = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload)
        assert response1.status_code == 200
        org_id = response1.json()["organization"]["id"]
        user_id = response1.json()["user"]["id"]
        
        # Try to create another org with same name
        payload2 = {
            "org_name": org_name,
            "admin_name": "Another Admin",
            "admin_email": f"{TEST_EMAIL_PREFIX}_dup2@test.com",
            "admin_password": "TestPass@123456"
        }
        
        response2 = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload2)
        
        assert response2.status_code == 400, f"Expected 400 for duplicate org name, got {response2.status_code}"
        assert "already exists" in response2.json().get("detail", "").lower()
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/organizations/{org_id}")
        requests.delete(f"{BASE_URL}/api/users/{user_id}")
        
        print("PASSED: Duplicate org name returns 400")

    def test_org_signup_duplicate_email_returns_400(self):
        """POST /api/organizations/signup with duplicate email should return 400"""
        # First create an org
        admin_email = f"{TEST_EMAIL_PREFIX}_dupemail@test.com"
        payload = {
            "org_name": f"{TEST_ORG_PREFIX}_DuplicateEmail1",
            "admin_name": "Test Admin",
            "admin_email": admin_email,
            "admin_password": "TestPass@123456"
        }
        
        response1 = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload)
        assert response1.status_code == 200
        org_id = response1.json()["organization"]["id"]
        user_id = response1.json()["user"]["id"]
        
        # Try to create another org with same email
        payload2 = {
            "org_name": f"{TEST_ORG_PREFIX}_DuplicateEmail2",
            "admin_name": "Another Admin",
            "admin_email": admin_email,  # Same email
            "admin_password": "TestPass@123456"
        }
        
        response2 = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload2)
        
        assert response2.status_code == 400, f"Expected 400 for duplicate email, got {response2.status_code}"
        assert "email" in response2.json().get("detail", "").lower() or "already" in response2.json().get("detail", "").lower()
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/organizations/{org_id}")
        requests.delete(f"{BASE_URL}/api/users/{user_id}")
        
        print("PASSED: Duplicate email returns 400")


class TestEditOrgMember:
    """Test Edit Organization Member endpoint PUT /api/organizations/{org_id}/members/{user_id}"""
    
    @pytest.fixture
    def org_with_member(self):
        """Create an org with a member for testing"""
        # Create org via signup
        org_name = f"{TEST_ORG_PREFIX}_EditMember"
        admin_email = f"{TEST_EMAIL_PREFIX}_editmember_admin@test.com"
        
        payload = {
            "org_name": org_name,
            "domain": "edittest.com",
            "admin_name": "Edit Test Admin",
            "admin_email": admin_email,
            "admin_password": "TestPass@123456"
        }
        
        response = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload)
        assert response.status_code == 200, f"Fixture setup failed: {response.text}"
        
        data = response.json()
        org = data["organization"]
        admin_user = data["user"]
        
        yield {"org": org, "admin_user": admin_user}
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/organizations/{org['id']}")
        requests.delete(f"{BASE_URL}/api/users/{admin_user['id']}")

    def test_edit_member_updates_name_email_role_plan_status(self, org_with_member):
        """PUT /api/organizations/{org_id}/members/{user_id} should update member fields"""
        org = org_with_member["org"]
        user = org_with_member["admin_user"]
        
        new_name = "Updated Name"
        new_email = f"{TEST_EMAIL_PREFIX}_updated@test.com"
        
        payload = {
            "name": new_name,
            "email": new_email,
            "org_role": "manager",
            "plan": "Enterprise",
            "status": "Active"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/organizations/{org['id']}/members/{user['id']}",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        member = data["member"]
        assert member["name"] == new_name
        assert member["email"] == new_email.lower()
        assert member["org_role"] == "manager"
        assert member["plan"] == "Enterprise"
        assert member["status"] == "Active"
        
        print("PASSED: Edit member updates name/email/org_role/plan/status")

    def test_edit_member_duplicate_email_returns_400(self, org_with_member):
        """PUT /api/organizations/{org_id}/members/{user_id} with duplicate email should return 400"""
        org = org_with_member["org"]
        admin_user = org_with_member["admin_user"]
        
        # Create another member in the org
        member_payload = {
            "name": "Second Member",
            "email": f"{TEST_EMAIL_PREFIX}_secondmember@test.com",
            "password": "TestPass@123456",
            "role": "member"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/organizations/{org['id']}/members",
            json=member_payload
        )
        assert create_response.status_code == 200, f"Failed to create second member: {create_response.text}"
        second_member = create_response.json()["member"]
        
        # Try to update second member's email to match admin's email
        payload = {
            "email": admin_user["email"]  # Same as admin
        }
        
        response = requests.put(
            f"{BASE_URL}/api/organizations/{org['id']}/members/{second_member['id']}",
            json=payload
        )
        
        assert response.status_code == 400, f"Expected 400 for duplicate email, got {response.status_code}: {response.text}"
        assert "email" in response.json().get("detail", "").lower() or "in use" in response.json().get("detail", "").lower()
        
        # Cleanup second member
        requests.delete(f"{BASE_URL}/api/users/{second_member['id']}")
        
        print("PASSED: Edit member with duplicate email returns 400")


class TestDomainAutoEnrollment:
    """Test domain-based auto-enrollment during registration"""

    def test_register_with_munal_domain_auto_enrolls(self):
        """POST /api/auth/register with @munal.com email should auto-enroll as business under Munal Inc"""
        # Generate unique email with munal.com domain
        unique_id = uuid.uuid4().hex[:8]
        email = f"testuser_{unique_id}@munal.com"
        
        payload = {
            "email": email,
            "password": "TestPass@123456",
            "name": f"Domain Test User {unique_id}"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        user = data.get("user", {})
        
        # Verify auto-enrollment
        assert user.get("account_type") == "business", f"Expected account_type='business', got '{user.get('account_type')}'"
        assert user.get("organization_id") is not None, "User should have organization_id"
        assert user.get("org_role") == "member", f"Expected org_role='member', got '{user.get('org_role')}'"
        
        # Verify user is under Munal Inc (ID: 4bb85d5c-29bb-4dc8-b5c5-780d538a697a)
        assert user.get("organization_id") == "4bb85d5c-29bb-4dc8-b5c5-780d538a697a", \
            f"User should be under Munal Inc org, got org_id: {user.get('organization_id')}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user['id']}")
        
        print("PASSED: @munal.com email auto-enrolls as business under Munal Inc")

    def test_register_with_gmail_stays_personal(self):
        """POST /api/auth/register with @gmail.com email should stay as personal account"""
        unique_id = uuid.uuid4().hex[:8]
        email = f"testuser_{unique_id}@gmail.com"
        
        payload = {
            "email": email,
            "password": "TestPass@123456",
            "name": f"Gmail Test User {unique_id}"
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        user = data.get("user", {})
        
        # Verify stays as personal
        assert user.get("account_type") == "personal", f"Expected account_type='personal', got '{user.get('account_type')}'"
        assert user.get("organization_id") is None, f"Personal user should have no organization_id, got: {user.get('organization_id')}"
        assert user.get("org_role") is None, f"Personal user should have no org_role, got: {user.get('org_role')}"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{user['id']}")
        
        print("PASSED: @gmail.com email stays as personal account")


class TestOrgSignupCreatedOrgVisible:
    """Test that org created via signup appears in admin organizations list"""

    def test_created_org_appears_in_list(self):
        """Organization created via signup should appear in GET /api/organizations"""
        org_name = f"{TEST_ORG_PREFIX}_VisibleInList_{uuid.uuid4().hex[:6]}"
        
        # Create org via signup
        payload = {
            "org_name": org_name,
            "domain": "visibletest.com",
            "description": "Test visibility in org list",
            "admin_name": "Visible Test Admin",
            "admin_email": f"{TEST_EMAIL_PREFIX}_visible@visibletest.com",
            "admin_password": "TestPass@123456"
        }
        
        signup_response = requests.post(f"{BASE_URL}/api/organizations/signup", json=payload)
        assert signup_response.status_code == 200
        
        org = signup_response.json()["organization"]
        user = signup_response.json()["user"]
        
        # Fetch org list
        list_response = requests.get(f"{BASE_URL}/api/organizations")
        assert list_response.status_code == 200
        
        orgs = list_response.json().get("organizations", [])
        org_names = [o["name"] for o in orgs]
        
        assert org_name in org_names, f"Created org '{org_name}' not found in org list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/organizations/{org['id']}")
        requests.delete(f"{BASE_URL}/api/users/{user['id']}")
        
        print("PASSED: Created org appears in organizations list")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
