"""
Test User Visibility Filtering and Permission Audit Log Features

Feature 1: User visibility filtering by role on GET /api/users
- Super_Admin sees ALL users including role=User
- Admin/Manager only see Admin/Manager/Super_Admin users (no role=User)
- Unauthenticated requests see all users (backward compatibility)

Feature 2: Permission change audit logging
- PUT /api/admin/module-permissions/templates/{role} creates audit log entry
- GET /api/admin/module-permissions/audit-log returns audit entries
- Audit entries contain action, role, changes (module, label, from, to), timestamp
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
SUPER_ADMIN_EMAIL = "admin@munal.com"
SUPER_ADMIN_PASSWORD = "Admin@123456"
TEST_ADMIN_EMAIL = "testadmin@munal.com"
TEST_ADMIN_PASSWORD = "TestAdmin@123"


class TestUserVisibilityFiltering:
    """Test user visibility filtering based on caller role"""
    
    @pytest.fixture(scope="class")
    def super_admin_token(self):
        """Get Super Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_ADMIN_EMAIL,
            "password": TEST_ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Test Admin login failed: {response.text}")
        data = response.json()
        return data.get("token")
    
    def test_super_admin_sees_all_users(self, super_admin_token):
        """Super Admin should see ALL users including role=User"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        
        assert response.status_code == 200, f"GET /api/users failed: {response.text}"
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        
        # Check that we have users with different roles
        roles = set(u.get("role", "").lower().replace(" ", "_") for u in users)
        print(f"Roles found by Super Admin: {roles}")
        print(f"Total users: {len(users)}")
        
        # Super Admin should see users with role=User (regular app users)
        user_role_users = [u for u in users if u.get("role", "").lower() == "user"]
        print(f"Users with role=User: {len(user_role_users)}")
        
        # Verify we have admin-type users
        admin_users = [u for u in users if u.get("role", "").lower().replace(" ", "_") in ("admin", "manager", "super_admin")]
        print(f"Admin-type users: {len(admin_users)}")
        assert len(admin_users) > 0, "Should have at least one admin-type user"
    
    def test_admin_sees_only_org_users(self, admin_token):
        """Admin should only see Admin/Manager/Super_Admin users, NOT role=User"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/users", headers=headers)
        
        assert response.status_code == 200, f"GET /api/users failed: {response.text}"
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        
        # Check roles of returned users
        roles = set(u.get("role", "").lower().replace(" ", "_") for u in users)
        print(f"Roles found by Admin: {roles}")
        print(f"Total users visible to Admin: {len(users)}")
        
        # Admin should NOT see users with role=User
        user_role_users = [u for u in users if u.get("role", "").lower() == "user"]
        print(f"Users with role=User visible to Admin: {len(user_role_users)}")
        
        # All users should be Admin, Manager, or Super_Admin
        allowed_roles = {"admin", "manager", "super_admin"}
        for user in users:
            role = user.get("role", "").lower().replace(" ", "_")
            assert role in allowed_roles, f"Admin should not see user with role={user.get('role')}"
    
    def test_unauthenticated_sees_all_users(self):
        """Unauthenticated request should see all users (backward compatibility)"""
        response = requests.get(f"{BASE_URL}/api/users")
        
        assert response.status_code == 200, f"GET /api/users failed: {response.text}"
        users = response.json()
        assert isinstance(users, list), "Response should be a list"
        
        # Check roles
        roles = set(u.get("role", "").lower().replace(" ", "_") for u in users)
        print(f"Roles found without auth: {roles}")
        print(f"Total users without auth: {len(users)}")
    
    def test_admin_vs_super_admin_user_count(self, super_admin_token, admin_token):
        """Compare user counts between Super Admin and Admin"""
        # Super Admin request
        sa_headers = {"Authorization": f"Bearer {super_admin_token}"}
        sa_response = requests.get(f"{BASE_URL}/api/users", headers=sa_headers)
        sa_users = sa_response.json()
        
        # Admin request
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        admin_response = requests.get(f"{BASE_URL}/api/users", headers=admin_headers)
        admin_users = admin_response.json()
        
        print(f"Super Admin sees: {len(sa_users)} users")
        print(f"Admin sees: {len(admin_users)} users")
        
        # Super Admin should see >= Admin (since Admin is filtered)
        # If there are any role=User users, Super Admin should see more
        sa_user_role_count = len([u for u in sa_users if u.get("role", "").lower() == "user"])
        if sa_user_role_count > 0:
            assert len(sa_users) > len(admin_users), \
                f"Super Admin ({len(sa_users)}) should see more users than Admin ({len(admin_users)}) when role=User users exist"


class TestPermissionAuditLog:
    """Test permission change audit logging"""
    
    @pytest.fixture(scope="class")
    def super_admin_token(self):
        """Get Super Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Super Admin login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    def test_audit_log_endpoint_exists(self, super_admin_token):
        """GET /api/admin/module-permissions/audit-log should return audit entries"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/audit-log", headers=headers)
        
        assert response.status_code == 200, f"GET audit-log failed: {response.text}"
        data = response.json()
        
        assert "logs" in data, "Response should contain 'logs' key"
        assert "total" in data, "Response should contain 'total' key"
        assert isinstance(data["logs"], list), "logs should be a list"
        print(f"Total audit log entries: {data['total']}")
        print(f"Returned entries: {len(data['logs'])}")
    
    def test_audit_log_entry_structure(self, super_admin_token):
        """Audit log entries should have correct structure"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/audit-log?limit=5", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        logs = data.get("logs", [])
        
        if len(logs) > 0:
            log = logs[0]
            print(f"Sample audit log entry: {log}")
            
            # Check required fields
            assert "action" in log, "Log entry should have 'action' field"
            assert "timestamp" in log, "Log entry should have 'timestamp' field"
            
            # Check action type
            valid_actions = ["template_update", "user_override", "user_override_reset"]
            assert log["action"] in valid_actions, f"Invalid action: {log['action']}"
            
            # For template_update, should have role
            if log["action"] == "template_update":
                assert "role" in log, "template_update should have 'role' field"
                assert "changes" in log, "template_update should have 'changes' field"
        else:
            print("No audit log entries found - will create one")
    
    def test_template_update_creates_audit_log(self, super_admin_token):
        """PUT /api/admin/module-permissions/templates/{role} should create audit log entry"""
        headers = {"Authorization": f"Bearer {super_admin_token}", "Content-Type": "application/json"}
        
        # First, get current template for admin
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        assert response.status_code == 200
        templates = response.json().get("templates", [])
        admin_template = next((t for t in templates if t["role"] == "admin"), None)
        assert admin_template is not None, "Admin template not found"
        
        current_perms = admin_template.get("permissions", {})
        
        # Toggle a permission (broadcasts)
        new_perms = current_perms.copy()
        current_broadcasts = new_perms.get("broadcasts", False)
        new_perms["broadcasts"] = not current_broadcasts
        
        # Update template
        update_response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/admin",
            headers=headers,
            json={"permissions": new_perms}
        )
        assert update_response.status_code == 200, f"Template update failed: {update_response.text}"
        
        # Check audit log for new entry
        audit_response = requests.get(f"{BASE_URL}/api/admin/module-permissions/audit-log?limit=5", headers=headers)
        assert audit_response.status_code == 200
        logs = audit_response.json().get("logs", [])
        
        # Find the most recent template_update for admin
        recent_log = None
        for log in logs:
            if log.get("action") == "template_update" and log.get("role") == "admin":
                recent_log = log
                break
        
        assert recent_log is not None, "No audit log entry found for template update"
        print(f"Audit log entry: {recent_log}")
        
        # Verify changes structure
        changes = recent_log.get("changes", [])
        assert len(changes) > 0, "Changes should not be empty"
        
        # Find broadcasts change
        broadcasts_change = next((c for c in changes if c.get("module") == "broadcasts"), None)
        assert broadcasts_change is not None, "Broadcasts change not found in audit log"
        
        # Verify change structure
        assert "label" in broadcasts_change, "Change should have 'label'"
        assert "from" in broadcasts_change, "Change should have 'from'"
        assert "to" in broadcasts_change, "Change should have 'to'"
        assert broadcasts_change["from"] == current_broadcasts, f"'from' should be {current_broadcasts}"
        assert broadcasts_change["to"] == (not current_broadcasts), f"'to' should be {not current_broadcasts}"
        
        print(f"Change verified: {broadcasts_change['label']}: {broadcasts_change['from']} → {broadcasts_change['to']}")
        
        # Revert the change
        revert_response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/admin",
            headers=headers,
            json={"permissions": current_perms}
        )
        assert revert_response.status_code == 200, "Failed to revert template"
    
    def test_audit_log_pagination(self, super_admin_token):
        """Audit log should support pagination"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # Get with limit
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/audit-log?limit=2&skip=0", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "logs" in data
        assert "total" in data
        assert len(data["logs"]) <= 2, "Should respect limit parameter"
        
        print(f"Pagination test - limit=2, returned={len(data['logs'])}, total={data['total']}")


class TestAuditLogChangesFormat:
    """Test that audit log changes have correct format with module labels"""
    
    @pytest.fixture(scope="class")
    def super_admin_token(self):
        """Get Super Admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": SUPER_ADMIN_EMAIL,
            "password": SUPER_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json().get("token")
    
    def test_changes_have_module_labels(self, super_admin_token):
        """Audit log changes should include human-readable module labels"""
        headers = {"Authorization": f"Bearer {super_admin_token}"}
        
        # Get audit logs
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/audit-log?limit=10", headers=headers)
        assert response.status_code == 200
        logs = response.json().get("logs", [])
        
        # Find a log with changes
        log_with_changes = None
        for log in logs:
            if log.get("changes") and len(log.get("changes", [])) > 0:
                log_with_changes = log
                break
        
        if log_with_changes:
            changes = log_with_changes.get("changes", [])
            for change in changes:
                print(f"Change: {change}")
                assert "module" in change, "Change should have 'module' key"
                assert "label" in change, "Change should have 'label' key (human-readable)"
                assert "from" in change, "Change should have 'from' value"
                assert "to" in change, "Change should have 'to' value"
                
                # Label should be different from module key (human readable)
                # e.g., "broadcasts" -> "Broadcasts", "ir_sor_templates" -> "IR/SOR Templates"
                assert change["label"] != "", "Label should not be empty"
        else:
            print("No audit logs with changes found - skipping label verification")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
