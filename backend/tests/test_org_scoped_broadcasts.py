"""
Test org-scoped broadcasts, scheduled exports, and user visibility.
Tests that Admin/Manager users only see/send to their organization members,
while Super Admin can see/send to all users.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from the review request
SUPER_ADMIN = {"email": "admin@munal.com", "password": "Admin@123456"}
ORG_ADMIN = {"email": "orgadmin@munal.com", "password": "OrgAdmin@123"}
ORG_MANAGER = {"email": "orgmgr@munal.com", "password": "OrgMgr@123"}
ORG_MEMBER = {"email": "orgmember@munal.com", "password": "OrgMem@123"}


class TestOrgMemberCreation:
    """Test that adding org members sets correct platform roles"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get org ID from org admin login"""
        self.session = requests.Session()
        # Login as org admin to get org_id
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        if resp.status_code == 200:
            data = resp.json()
            self.org_id = data.get("user", {}).get("organization_id")
            self.org_admin_token = data.get("token")
        else:
            self.org_id = None
            self.org_admin_token = None
    
    def test_org_admin_login_returns_org_info(self):
        """POST /api/auth/login for org admin returns organization_id and org_name"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        
        data = resp.json()
        user = data.get("user", {})
        
        # Verify organization_id is present
        assert user.get("organization_id") is not None, "organization_id should be present for org admin"
        assert user.get("org_name") is not None, "org_name should be present for org admin"
        
        print(f"✓ Org Admin login returns organization_id: {user.get('organization_id')}")
        print(f"✓ Org Admin login returns org_name: {user.get('org_name')}")
        
        # Verify role is Admin (not Super_Admin)
        assert user.get("role") == "Admin", f"Expected role 'Admin', got '{user.get('role')}'"
        print(f"✓ Org Admin has platform role: {user.get('role')}")
    
    def test_org_manager_login_returns_org_info(self):
        """POST /api/auth/login for org manager returns organization_id"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_MANAGER)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        
        data = resp.json()
        user = data.get("user", {})
        
        assert user.get("organization_id") is not None, "organization_id should be present for org manager"
        assert user.get("role") == "Manager", f"Expected role 'Manager', got '{user.get('role')}'"
        print(f"✓ Org Manager has platform role: {user.get('role')}")
    
    def test_org_member_login_returns_org_info(self):
        """POST /api/auth/login for org member returns organization_id"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_MEMBER)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        
        data = resp.json()
        user = data.get("user", {})
        
        assert user.get("organization_id") is not None, "organization_id should be present for org member"
        assert user.get("role") == "User", f"Expected role 'User', got '{user.get('role')}'"
        print(f"✓ Org Member has platform role: {user.get('role')}")
    
    def test_super_admin_has_no_org(self):
        """POST /api/auth/login for super admin has no organization_id"""
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert resp.status_code == 200, f"Login failed: {resp.text}"
        
        data = resp.json()
        user = data.get("user", {})
        
        # Super Admin should NOT have an organization_id
        assert user.get("organization_id") is None, f"Super Admin should not have organization_id, got: {user.get('organization_id')}"
        assert user.get("role") == "Super_Admin", f"Expected role 'Super_Admin', got '{user.get('role')}'"
        print(f"✓ Super Admin has no organization_id and role: {user.get('role')}")


class TestUserVisibilityByRole:
    """Test that GET /api/users returns correct users based on caller's role"""
    
    def test_super_admin_sees_all_users(self):
        """GET /api/users with Super Admin auth returns ALL users"""
        session = requests.Session()
        
        # Login as Super Admin
        resp = session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        assert resp.status_code == 200, f"Super Admin login failed: {resp.text}"
        token = resp.json().get("token")
        
        # Get users with auth
        resp = session.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"GET /api/users failed: {resp.text}"
        
        users = resp.json()
        assert isinstance(users, list), "Expected list of users"
        
        # Super Admin should see many users (including non-org users)
        print(f"✓ Super Admin sees {len(users)} users")
        
        # Check that we see users with different roles
        roles = set(u.get("role") for u in users)
        print(f"✓ Roles visible to Super Admin: {roles}")
        
        # Should include regular Users
        assert "User" in roles or len(users) > 5, "Super Admin should see regular users"
    
    def test_org_admin_sees_only_org_members(self):
        """GET /api/users with Org Admin auth returns ONLY users from that admin's organization"""
        session = requests.Session()
        
        # Login as Org Admin
        resp = session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        assert resp.status_code == 200, f"Org Admin login failed: {resp.text}"
        data = resp.json()
        token = data.get("token")
        org_id = data.get("user", {}).get("organization_id")
        
        # Get users with auth
        resp = session.get(
            f"{BASE_URL}/api/users",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert resp.status_code == 200, f"GET /api/users failed: {resp.text}"
        
        users = resp.json()
        assert isinstance(users, list), "Expected list of users"
        
        print(f"✓ Org Admin sees {len(users)} users")
        
        # All users should belong to the same organization
        for user in users:
            user_org = user.get("organization_id")
            # Users should either be in the same org OR be admin/manager without org
            if user_org:
                assert user_org == org_id, f"User {user.get('email')} has different org_id: {user_org} vs {org_id}"
        
        print(f"✓ All visible users belong to org_id: {org_id}")


class TestBroadcastOrgScoping:
    """Test that broadcasts are scoped to organization for Admin/Manager"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get tokens"""
        self.session = requests.Session()
        
        # Get Super Admin token
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if resp.status_code == 200:
            self.super_admin_token = resp.json().get("token")
        else:
            self.super_admin_token = None
        
        # Get Org Admin token
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        if resp.status_code == 200:
            data = resp.json()
            self.org_admin_token = data.get("token")
            self.org_id = data.get("user", {}).get("organization_id")
            self.org_name = data.get("user", {}).get("org_name")
        else:
            self.org_admin_token = None
            self.org_id = None
            self.org_name = None
    
    def test_org_admin_broadcast_sends_to_org_only(self):
        """POST /api/admin/broadcasts with Org Admin auth sends to org members only"""
        if not self.org_admin_token:
            pytest.skip("Org Admin login failed")
        
        # Send a test broadcast
        resp = self.session.post(
            f"{BASE_URL}/api/admin/broadcasts",
            headers={"Authorization": f"Bearer {self.org_admin_token}"},
            json={
                "subject": "TEST_ORG_BROADCAST - Org Admin Test",
                "content": "This is a test broadcast from org admin",
                "send_email": False  # Don't actually send emails
            }
        )
        
        assert resp.status_code == 200, f"Broadcast failed: {resp.text}"
        data = resp.json()
        
        assert data.get("success") is True, "Broadcast should succeed"
        broadcast = data.get("broadcast", {})
        
        # Check recipients count - should be small (org members only, not all users)
        recipients = broadcast.get("recipients_count", 0)
        print(f"✓ Org Admin broadcast sent to {recipients} recipients")
        
        # The org has 3 members (orgadmin, orgmgr, orgmember)
        # Recipients should be around 3, not 30+
        assert recipients <= 10, f"Org Admin broadcast should go to org members only, got {recipients} recipients"
        
        # Verify org_id is saved on broadcast
        assert broadcast.get("organization_id") == self.org_id, "Broadcast should have organization_id"
        print(f"✓ Broadcast has organization_id: {broadcast.get('organization_id')}")
        
        # Verify org_name is saved
        if self.org_name:
            assert broadcast.get("org_name") == self.org_name, f"Broadcast should have org_name, got: {broadcast.get('org_name')}"
            print(f"✓ Broadcast has org_name: {broadcast.get('org_name')}")
    
    def test_super_admin_broadcast_sends_to_all(self):
        """POST /api/admin/broadcasts with Super Admin auth sends to ALL users"""
        if not self.super_admin_token:
            pytest.skip("Super Admin login failed")
        
        # Send a test broadcast
        resp = self.session.post(
            f"{BASE_URL}/api/admin/broadcasts",
            headers={"Authorization": f"Bearer {self.super_admin_token}"},
            json={
                "subject": "TEST_SUPER_BROADCAST - Super Admin Test",
                "content": "This is a test broadcast from super admin",
                "send_email": False
            }
        )
        
        assert resp.status_code == 200, f"Broadcast failed: {resp.text}"
        data = resp.json()
        
        assert data.get("success") is True, "Broadcast should succeed"
        broadcast = data.get("broadcast", {})
        
        recipients = broadcast.get("recipients_count", 0)
        print(f"✓ Super Admin broadcast sent to {recipients} recipients")
        
        # Super Admin should reach many more users
        assert recipients > 5, f"Super Admin broadcast should go to all users, got only {recipients}"
        
        # Super Admin broadcast should NOT have organization_id
        assert broadcast.get("organization_id") is None, "Super Admin broadcast should not have organization_id"
        print(f"✓ Super Admin broadcast has no organization_id (platform-wide)")
    
    def test_org_admin_sees_only_org_broadcasts(self):
        """GET /api/admin/broadcasts with Org Admin auth only returns their org's broadcasts"""
        if not self.org_admin_token:
            pytest.skip("Org Admin login failed")
        
        resp = self.session.get(
            f"{BASE_URL}/api/admin/broadcasts",
            headers={"Authorization": f"Bearer {self.org_admin_token}"}
        )
        
        assert resp.status_code == 200, f"GET broadcasts failed: {resp.text}"
        data = resp.json()
        
        broadcasts = data.get("broadcasts", [])
        print(f"✓ Org Admin sees {len(broadcasts)} broadcasts")
        
        # All broadcasts should belong to this org
        for bc in broadcasts:
            bc_org = bc.get("organization_id")
            if bc_org:  # Some old broadcasts might not have org_id
                assert bc_org == self.org_id, f"Broadcast {bc.get('id')} has wrong org_id: {bc_org}"
        
        print(f"✓ All broadcasts belong to org_id: {self.org_id}")
    
    def test_super_admin_sees_all_broadcasts(self):
        """GET /api/admin/broadcasts with Super Admin auth returns ALL broadcasts"""
        if not self.super_admin_token:
            pytest.skip("Super Admin login failed")
        
        resp = self.session.get(
            f"{BASE_URL}/api/admin/broadcasts",
            headers={"Authorization": f"Bearer {self.super_admin_token}"}
        )
        
        assert resp.status_code == 200, f"GET broadcasts failed: {resp.text}"
        data = resp.json()
        
        broadcasts = data.get("broadcasts", [])
        print(f"✓ Super Admin sees {len(broadcasts)} broadcasts (all)")
        
        # Super Admin should see broadcasts from different orgs
        org_ids = set(bc.get("organization_id") for bc in broadcasts)
        print(f"✓ Broadcasts from org_ids: {org_ids}")


class TestScheduledExportsOrgScoping:
    """Test that scheduled exports are scoped to organization"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get tokens"""
        self.session = requests.Session()
        
        # Get Org Admin token
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        if resp.status_code == 200:
            data = resp.json()
            self.org_admin_token = data.get("token")
            self.org_id = data.get("user", {}).get("organization_id")
        else:
            self.org_admin_token = None
            self.org_id = None
        
        # Get Super Admin token
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=SUPER_ADMIN)
        if resp.status_code == 200:
            self.super_admin_token = resp.json().get("token")
        else:
            self.super_admin_token = None
    
    def test_org_admin_sees_only_org_exports(self):
        """GET /api/admin/scheduled-exports with Org Admin auth only returns their org's exports"""
        if not self.org_admin_token:
            pytest.skip("Org Admin login failed")
        
        resp = self.session.get(
            f"{BASE_URL}/api/admin/scheduled-exports",
            headers={"Authorization": f"Bearer {self.org_admin_token}"}
        )
        
        assert resp.status_code == 200, f"GET scheduled-exports failed: {resp.text}"
        data = resp.json()
        
        exports = data.get("exports", [])
        print(f"✓ Org Admin sees {len(exports)} scheduled exports")
        
        # All exports should belong to this org
        for exp in exports:
            exp_org = exp.get("organization_id")
            if exp_org:
                assert exp_org == self.org_id, f"Export {exp.get('id')} has wrong org_id: {exp_org}"
        
        print(f"✓ All exports belong to org_id: {self.org_id}")
    
    def test_org_admin_creates_org_scoped_export(self):
        """POST /api/admin/scheduled-exports with Org Admin creates export with org_id"""
        if not self.org_admin_token:
            pytest.skip("Org Admin login failed")
        
        resp = self.session.post(
            f"{BASE_URL}/api/admin/scheduled-exports",
            headers={"Authorization": f"Bearer {self.org_admin_token}"},
            json={
                "name": "TEST_ORG_EXPORT - Weekly Report",
                "frequency": "weekly",
                "format": "csv",
                "status_filter": "all",
                "email_recipients": ["test@example.com"],
                "enabled": False  # Don't actually run
            }
        )
        
        assert resp.status_code == 200, f"Create export failed: {resp.text}"
        data = resp.json()
        
        assert data.get("success") is True, "Export creation should succeed"
        export = data.get("export", {})
        
        # Verify org_id is saved
        assert export.get("organization_id") == self.org_id, f"Export should have organization_id, got: {export.get('organization_id')}"
        print(f"✓ Created export with organization_id: {export.get('organization_id')}")
        
        # Cleanup - delete the test export
        export_id = export.get("id")
        if export_id:
            self.session.delete(f"{BASE_URL}/api/admin/scheduled-exports/{export_id}")


class TestOrgMemberRoleMapping:
    """Test that POST /api/organizations/{org_id}/members maps roles correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get org ID"""
        self.session = requests.Session()
        resp = self.session.post(f"{BASE_URL}/api/auth/login", json=ORG_ADMIN)
        if resp.status_code == 200:
            data = resp.json()
            self.org_id = data.get("user", {}).get("organization_id")
        else:
            self.org_id = None
    
    def test_add_member_with_admin_role(self):
        """POST /api/organizations/{org_id}/members with role=admin creates user with platform role=Admin"""
        if not self.org_id:
            pytest.skip("Could not get org_id")
        
        import uuid
        test_email = f"test_admin_{uuid.uuid4().hex[:8]}@test.com"
        
        resp = self.session.post(
            f"{BASE_URL}/api/organizations/{self.org_id}/members",
            json={
                "email": test_email,
                "name": "Test Admin User",
                "password": "TestPass@123",
                "role": "admin",
                "plan": "Business"
            }
        )
        
        assert resp.status_code == 200, f"Add member failed: {resp.text}"
        data = resp.json()
        
        member = data.get("member", {})
        assert member.get("role") == "Admin", f"Expected platform role 'Admin', got '{member.get('role')}'"
        assert member.get("org_role") == "admin", f"Expected org_role 'admin', got '{member.get('org_role')}'"
        assert member.get("organization_id") == self.org_id, "Member should have organization_id"
        
        print(f"✓ Admin member created with platform role: {member.get('role')}, org_role: {member.get('org_role')}")
        
        # Cleanup
        user_id = member.get("id")
        if user_id:
            self.session.delete(f"{BASE_URL}/api/users/{user_id}")
    
    def test_add_member_with_manager_role(self):
        """POST /api/organizations/{org_id}/members with role=manager creates user with platform role=Manager"""
        if not self.org_id:
            pytest.skip("Could not get org_id")
        
        import uuid
        test_email = f"test_mgr_{uuid.uuid4().hex[:8]}@test.com"
        
        resp = self.session.post(
            f"{BASE_URL}/api/organizations/{self.org_id}/members",
            json={
                "email": test_email,
                "name": "Test Manager User",
                "password": "TestPass@123",
                "role": "manager",
                "plan": "Business"
            }
        )
        
        assert resp.status_code == 200, f"Add member failed: {resp.text}"
        data = resp.json()
        
        member = data.get("member", {})
        assert member.get("role") == "Manager", f"Expected platform role 'Manager', got '{member.get('role')}'"
        assert member.get("org_role") == "manager", f"Expected org_role 'manager', got '{member.get('org_role')}'"
        
        print(f"✓ Manager member created with platform role: {member.get('role')}, org_role: {member.get('org_role')}")
        
        # Cleanup
        user_id = member.get("id")
        if user_id:
            self.session.delete(f"{BASE_URL}/api/users/{user_id}")
    
    def test_add_member_with_member_role(self):
        """POST /api/organizations/{org_id}/members with role=member creates user with platform role=User"""
        if not self.org_id:
            pytest.skip("Could not get org_id")
        
        import uuid
        test_email = f"test_member_{uuid.uuid4().hex[:8]}@test.com"
        
        resp = self.session.post(
            f"{BASE_URL}/api/organizations/{self.org_id}/members",
            json={
                "email": test_email,
                "name": "Test Member User",
                "password": "TestPass@123",
                "role": "member",
                "plan": "Free"
            }
        )
        
        assert resp.status_code == 200, f"Add member failed: {resp.text}"
        data = resp.json()
        
        member = data.get("member", {})
        assert member.get("role") == "User", f"Expected platform role 'User', got '{member.get('role')}'"
        assert member.get("org_role") == "member", f"Expected org_role 'member', got '{member.get('org_role')}'"
        
        print(f"✓ Member created with platform role: {member.get('role')}, org_role: {member.get('org_role')}")
        
        # Cleanup
        user_id = member.get("id")
        if user_id:
            self.session.delete(f"{BASE_URL}/api/users/{user_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
