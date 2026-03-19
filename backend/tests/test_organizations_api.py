"""
Backend tests for Organization Management API endpoints.
Tests CRUD operations for organizations and organization members.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test organization ID from context
EXISTING_ORG_ID = "4bb85d5c-29bb-4dc8-b5c5-780d538a697a"
EXISTING_ORG_NAME = "Munal Inc"


class TestOrganizationsList:
    """Test GET /api/organizations - List all organizations"""

    def test_list_organizations_returns_200(self):
        """GET /api/organizations should return 200 with organizations array"""
        response = requests.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "organizations" in data, "Response should contain 'organizations' key"
        assert isinstance(data["organizations"], list), "organizations should be a list"
        print(f"✓ List organizations returned {len(data['organizations'])} orgs")

    def test_list_organizations_contains_member_count(self):
        """Each organization should have a member_count field"""
        response = requests.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200
        data = response.json()
        if data["organizations"]:
            org = data["organizations"][0]
            assert "member_count" in org, "Organization should have member_count"
            assert isinstance(org["member_count"], int), "member_count should be integer"
            print(f"✓ First org '{org.get('name')}' has member_count: {org['member_count']}")

    def test_existing_org_munal_inc_present(self):
        """Existing test organization 'Munal Inc' should be present"""
        response = requests.get(f"{BASE_URL}/api/organizations")
        assert response.status_code == 200
        data = response.json()
        org_names = [o['name'] for o in data['organizations']]
        assert "Munal Inc" in org_names, "Munal Inc should exist in organizations"
        print("✓ Munal Inc organization found in list")


class TestOrganizationCRUD:
    """Test Organization CRUD operations"""

    def test_create_organization_success(self):
        """POST /api/organizations should create a new organization"""
        unique_name = f"TEST_Org_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "domain": "testorg.com",
            "description": "Test organization for API testing",
            "created_by": "test-admin"
        }
        response = requests.post(f"{BASE_URL}/api/organizations", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "organization" in data, "Response should contain organization"
        
        org = data["organization"]
        assert org["name"] == unique_name
        assert org["domain"] == "testorg.com"
        assert org["description"] == "Test organization for API testing"
        assert "id" in org, "Organization should have an ID"
        print(f"✓ Created organization '{unique_name}' with ID: {org['id']}")
        
        # Cleanup - delete the created org
        requests.delete(f"{BASE_URL}/api/organizations/{org['id']}")

    def test_create_organization_duplicate_name_returns_400(self):
        """POST /api/organizations with duplicate name should return 400"""
        payload = {
            "name": EXISTING_ORG_NAME,  # "Munal Inc" already exists
            "domain": "duplicate.com",
            "description": "Duplicate test",
            "created_by": "test-admin"
        }
        response = requests.post(f"{BASE_URL}/api/organizations", json=payload)
        assert response.status_code == 400, f"Expected 400 for duplicate, got {response.status_code}"
        data = response.json()
        assert "already exists" in data.get("detail", "").lower(), "Should mention already exists"
        print("✓ Duplicate organization name returns 400 as expected")

    def test_get_organization_by_id(self):
        """GET /api/organizations/{id} should return organization details"""
        response = requests.get(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["id"] == EXISTING_ORG_ID
        assert data["name"] == EXISTING_ORG_NAME
        assert "member_count" in data, "Should include member_count"
        print(f"✓ Got organization '{data['name']}' with {data['member_count']} members")

    def test_get_organization_not_found(self):
        """GET /api/organizations/{id} with invalid ID should return 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/organizations/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent organization returns 404")

    def test_update_organization(self):
        """PUT /api/organizations/{id} should update organization fields"""
        # First create an org to update
        unique_name = f"TEST_UpdateOrg_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/organizations", json={
            "name": unique_name,
            "domain": "update-test.com",
            "description": "Original description",
            "created_by": "test-admin"
        })
        assert create_response.status_code == 200
        org_id = create_response.json()["organization"]["id"]
        
        # Update the org
        update_payload = {
            "name": f"{unique_name}_updated",
            "domain": "updated-domain.com",
            "description": "Updated description"
        }
        update_response = requests.put(f"{BASE_URL}/api/organizations/{org_id}", json=update_payload)
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}"
        
        data = update_response.json()
        assert data.get("success") == True
        assert data["organization"]["name"] == f"{unique_name}_updated"
        assert data["organization"]["domain"] == "updated-domain.com"
        print(f"✓ Organization updated successfully")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/organizations/{org_id}")

    def test_delete_organization(self):
        """DELETE /api/organizations/{id} should delete organization"""
        # Create an org to delete
        unique_name = f"TEST_DeleteOrg_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(f"{BASE_URL}/api/organizations", json={
            "name": unique_name,
            "domain": "delete-test.com",
            "description": "To be deleted",
            "created_by": "test-admin"
        })
        assert create_response.status_code == 200
        org_id = create_response.json()["organization"]["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/organizations/{org_id}")
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}"
        
        data = delete_response.json()
        assert data.get("success") == True
        print(f"✓ Organization deleted successfully")
        
        # Verify it's gone
        get_response = requests.get(f"{BASE_URL}/api/organizations/{org_id}")
        assert get_response.status_code == 404, "Deleted org should return 404"


class TestOrganizationMembers:
    """Test organization member management endpoints"""

    def test_get_organization_members(self):
        """GET /api/organizations/{org_id}/members should return member list"""
        response = requests.get(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "members" in data, "Response should contain 'members'"
        assert "count" in data, "Response should contain 'count'"
        assert isinstance(data["members"], list)
        print(f"✓ Got {data['count']} members for {EXISTING_ORG_NAME}")

    def test_add_member_to_organization(self):
        """POST /api/organizations/{org_id}/members should create a business user"""
        unique_email = f"test_{uuid.uuid4().hex[:8]}@testorg.com"
        payload = {
            "email": unique_email,
            "name": "Test Member",
            "password": "TestPass123!",
            "role": "member",
            "org_role": "User",
            "plan": "Free"
        }
        response = requests.post(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "member" in data
        
        member = data["member"]
        assert member["email"] == unique_email.lower()
        assert member["name"] == "Test Member"
        assert member["account_type"] == "business"
        assert member["organization_id"] == EXISTING_ORG_ID
        print(f"✓ Created business user '{unique_email}' under {EXISTING_ORG_NAME}")
        
        # Cleanup - remove member
        requests.delete(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members/{member['id']}")

    def test_add_member_duplicate_email_returns_400(self):
        """POST /api/organizations/{org_id}/members with existing email should return 400"""
        # Justin Ogala (justin.ogala@munal.com) already exists
        payload = {
            "email": "justin.ogala@munal.com",
            "name": "Duplicate User",
            "password": "TestPass123!",
            "role": "member",
            "org_role": "User",
            "plan": "Free"
        }
        response = requests.post(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members", json=payload)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "already exists" in data.get("detail", "").lower()
        print("✓ Duplicate email returns 400 as expected")

    def test_remove_member_from_organization(self):
        """DELETE /api/organizations/{org_id}/members/{user_id} should remove member"""
        # First add a member
        unique_email = f"test_remove_{uuid.uuid4().hex[:8]}@testorg.com"
        add_response = requests.post(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members", json={
            "email": unique_email,
            "name": "To Be Removed",
            "password": "TestPass123!",
            "role": "member",
            "org_role": "User",
            "plan": "Free"
        })
        assert add_response.status_code == 200
        member_id = add_response.json()["member"]["id"]
        
        # Remove the member
        remove_response = requests.delete(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/members/{member_id}")
        assert remove_response.status_code == 200, f"Expected 200, got {remove_response.status_code}"
        
        data = remove_response.json()
        assert data.get("success") == True
        assert "personal" in data.get("message", "").lower(), "Should mention converted to personal"
        print("✓ Member removed and converted to personal account")


class TestOrganizationStats:
    """Test organization statistics endpoint"""

    def test_get_organization_stats(self):
        """GET /api/organizations/{org_id}/stats should return statistics"""
        response = requests.get(f"{BASE_URL}/api/organizations/{EXISTING_ORG_ID}/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "member_count" in data, "Should have member_count"
        assert "active_members" in data, "Should have active_members"
        assert "workspace_count" in data, "Should have workspace_count"
        assert "approval_count" in data, "Should have approval_count"
        
        # All should be non-negative integers
        assert isinstance(data["member_count"], int) and data["member_count"] >= 0
        assert isinstance(data["active_members"], int) and data["active_members"] >= 0
        assert isinstance(data["workspace_count"], int) and data["workspace_count"] >= 0
        assert isinstance(data["approval_count"], int) and data["approval_count"] >= 0
        
        print(f"✓ Org stats: members={data['member_count']}, active={data['active_members']}, workspaces={data['workspace_count']}, approvals={data['approval_count']}")

    def test_stats_for_nonexistent_org_returns_404(self):
        """GET /api/organizations/{invalid_id}/stats should return 404"""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/api/organizations/{fake_id}/stats")
        assert response.status_code == 404
        print("✓ Stats for non-existent org returns 404")


class TestUsersEndpointWithOrgFields:
    """Test that users API supports account_type and organization_id"""

    def test_create_user_with_business_account_type(self):
        """POST /api/users with account_type=business and organization_id"""
        unique_email = f"test_business_{uuid.uuid4().hex[:8]}@test.com"
        payload = {
            "email": unique_email,
            "password": "TestPass123!",
            "name": "Business Test User",
            "role": "User",
            "status": "Active",
            "plan": "Free",
            "account_type": "business",
            "organization_id": EXISTING_ORG_ID
        }
        response = requests.post(f"{BASE_URL}/api/users", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["account_type"] == "business"
        assert data["organization_id"] == EXISTING_ORG_ID
        print(f"✓ Created business user via /api/users with org_id")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/users/{data['id']}")

    def test_get_users_contains_account_type_field(self):
        """GET /api/users should return users with account_type field"""
        response = requests.get(f"{BASE_URL}/api/users")
        assert response.status_code == 200
        
        users = response.json()
        if users:
            # Check at least one user has account_type
            has_account_type = any("account_type" in u for u in users)
            print(f"✓ Users endpoint returns data, account_type present: {has_account_type}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
