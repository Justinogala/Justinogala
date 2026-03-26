"""
Module Permissions API Tests - RBAC feature testing
Tests for:
- GET /api/admin/module-permissions/modules - returns all modules with labels and groups
- GET /api/admin/module-permissions/templates - returns templates for super_admin, admin, manager
- PUT /api/admin/module-permissions/templates/{role} - updates role template (rejects super_admin)
- GET /api/admin/module-permissions/user/{user_id} - returns effective permissions for user
- POST /api/auth/login - returns module_permissions in user object for admin roles
- admin@munal.com should have role Super_Admin after migration
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestModulePermissionsAPI:
    """Test module permissions RBAC API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.admin_email = "admin@munal.com"
        self.admin_password = "Admin@123456"
        self.token = None
        self.user_id = None
        
    def get_auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("token")
        self.user_id = data.get("user", {}).get("id")
        return data
    
    def get_headers(self):
        """Get auth headers"""
        if not self.token:
            self.get_auth_token()
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
    
    # ============== Login Tests ==============
    
    def test_admin_login_returns_super_admin_role(self):
        """Test that admin@munal.com has Super_Admin role after migration"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        user = data.get("user", {})
        
        # Verify role is Super_Admin
        assert user.get("role") == "Super_Admin", f"Expected Super_Admin role, got: {user.get('role')}"
        print(f"✓ admin@munal.com has role: {user.get('role')}")
    
    def test_login_returns_module_permissions_for_super_admin(self):
        """Test that login returns module_permissions in user object for super_admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        
        # Verify module_permissions is present
        assert "module_permissions" in user, "module_permissions not in user object"
        perms = user.get("module_permissions", {})
        
        # Super admin should have all permissions true
        assert perms.get("dashboard") == True, "Super admin should have dashboard access"
        assert perms.get("users") == True, "Super admin should have users access"
        assert perms.get("module_permissions") == True, "Super admin should have module_permissions access"
        print(f"✓ Login returns module_permissions with {len(perms)} modules")
    
    # ============== GET /modules Tests ==============
    
    def test_get_all_modules(self):
        """Test GET /api/admin/module-permissions/modules returns all modules"""
        headers = self.get_headers()
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/modules", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify modules list
        assert "modules" in data, "Response should have 'modules' key"
        modules = data.get("modules", [])
        assert len(modules) > 0, "Should have at least one module"
        
        # Verify module structure
        first_module = modules[0]
        assert "key" in first_module, "Module should have 'key'"
        assert "label" in first_module, "Module should have 'label'"
        
        # Verify groups
        assert "groups" in data, "Response should have 'groups' key"
        groups = data.get("groups", {})
        assert "Primary" in groups, "Should have Primary group"
        assert "Management" in groups, "Should have Management group"
        assert "Configuration" in groups, "Should have Configuration group"
        assert "Super Admin" in groups, "Should have Super Admin group"
        
        print(f"✓ GET /modules returns {len(modules)} modules in {len(groups)} groups")
    
    def test_modules_have_expected_keys(self):
        """Test that expected module keys are present"""
        headers = self.get_headers()
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/modules", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        modules = data.get("modules", [])
        module_keys = [m.get("key") for m in modules]
        
        # Check expected modules exist
        expected_modules = ["dashboard", "users", "organizations", "workspaces", "billing", 
                          "module_permissions", "audit_logs", "general_settings"]
        for expected in expected_modules:
            assert expected in module_keys, f"Missing expected module: {expected}"
        
        print(f"✓ All expected module keys present")
    
    # ============== GET /templates Tests ==============
    
    def test_get_role_templates(self):
        """Test GET /api/admin/module-permissions/templates returns all role templates"""
        headers = self.get_headers()
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify templates list
        assert "templates" in data, "Response should have 'templates' key"
        templates = data.get("templates", [])
        assert len(templates) >= 3, f"Should have at least 3 templates (super_admin, admin, manager), got {len(templates)}"
        
        # Get roles from templates
        roles = [t.get("role") for t in templates]
        assert "super_admin" in roles, "Should have super_admin template"
        assert "admin" in roles, "Should have admin template"
        assert "manager" in roles, "Should have manager template"
        
        print(f"✓ GET /templates returns {len(templates)} role templates: {roles}")
    
    def test_super_admin_template_has_all_permissions(self):
        """Test that super_admin template has all permissions set to true"""
        headers = self.get_headers()
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        templates = data.get("templates", [])
        
        super_admin_template = next((t for t in templates if t.get("role") == "super_admin"), None)
        assert super_admin_template is not None, "super_admin template not found"
        
        perms = super_admin_template.get("permissions", {})
        # All permissions should be True for super_admin
        for key, value in perms.items():
            assert value == True, f"super_admin should have {key}=True, got {value}"
        
        print(f"✓ super_admin template has all {len(perms)} permissions set to True")
    
    def test_admin_template_has_restricted_permissions(self):
        """Test that admin template has some permissions disabled"""
        headers = self.get_headers()
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        templates = data.get("templates", [])
        
        admin_template = next((t for t in templates if t.get("role") == "admin"), None)
        assert admin_template is not None, "admin template not found"
        
        perms = admin_template.get("permissions", {})
        
        # Admin should NOT have module_permissions access
        assert perms.get("module_permissions") == False, "admin should not have module_permissions access"
        
        # Admin should have dashboard access
        assert perms.get("dashboard") == True, "admin should have dashboard access"
        
        # Count enabled permissions
        enabled_count = sum(1 for v in perms.values() if v == True)
        print(f"✓ admin template has {enabled_count}/{len(perms)} permissions enabled")
    
    # ============== PUT /templates/{role} Tests ==============
    
    def test_update_admin_template_succeeds(self):
        """Test that updating admin template works"""
        headers = self.get_headers()
        
        # First get current template
        response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        assert response.status_code == 200
        templates = response.json().get("templates", [])
        admin_template = next((t for t in templates if t.get("role") == "admin"), None)
        original_perms = admin_template.get("permissions", {}).copy()
        
        # Toggle a permission
        new_perms = original_perms.copy()
        new_perms["broadcasts"] = not original_perms.get("broadcasts", False)
        
        # Update template
        response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/admin",
            headers=headers,
            json={"permissions": new_perms}
        )
        assert response.status_code == 200, f"Update failed: {response.text}"
        
        # Verify update
        data = response.json()
        assert "permissions" in data, "Response should have permissions"
        assert data["permissions"]["broadcasts"] == new_perms["broadcasts"]
        
        # Restore original
        requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/admin",
            headers=headers,
            json={"permissions": original_perms}
        )
        
        print(f"✓ PUT /templates/admin successfully updates permissions")
    
    def test_update_super_admin_template_rejected(self):
        """Test that updating super_admin template is rejected with 403"""
        headers = self.get_headers()
        
        response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/super_admin",
            headers=headers,
            json={"permissions": {"dashboard": True}}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}: {response.text}"
        data = response.json()
        assert "Cannot modify super_admin" in data.get("detail", ""), "Should mention cannot modify super_admin"
        
        print(f"✓ PUT /templates/super_admin correctly rejected with 403")
    
    def test_update_invalid_role_rejected(self):
        """Test that updating invalid role is rejected with 400"""
        headers = self.get_headers()
        
        response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/invalid_role",
            headers=headers,
            json={"permissions": {"dashboard": True}}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✓ PUT /templates/invalid_role correctly rejected with 400")
    
    def test_update_with_invalid_module_rejected(self):
        """Test that updating with invalid module key is rejected"""
        headers = self.get_headers()
        
        response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/admin",
            headers=headers,
            json={"permissions": {"invalid_module_xyz": True}}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        print(f"✓ Invalid module key correctly rejected with 400")
    
    # ============== GET /user/{user_id} Tests ==============
    
    def test_get_user_permissions(self):
        """Test GET /api/admin/module-permissions/user/{user_id} returns effective permissions"""
        login_data = self.get_auth_token()
        headers = self.get_headers()
        user_id = login_data.get("user", {}).get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/admin/module-permissions/user/{user_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "user_id" in data, "Response should have user_id"
        assert "role" in data, "Response should have role"
        assert "source" in data, "Response should have source (template or override)"
        assert "permissions" in data, "Response should have permissions"
        
        # For super_admin, all permissions should be True
        perms = data.get("permissions", {})
        assert perms.get("dashboard") == True
        assert perms.get("module_permissions") == True
        
        print(f"✓ GET /user/{user_id} returns permissions with source: {data.get('source')}")
    
    def test_get_nonexistent_user_returns_404(self):
        """Test that getting permissions for non-existent user returns 404"""
        headers = self.get_headers()
        
        response = requests.get(
            f"{BASE_URL}/api/admin/module-permissions/user/nonexistent-user-id-12345",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✓ GET /user/nonexistent correctly returns 404")


class TestModulePermissionsIntegration:
    """Integration tests for module permissions with auth flow"""
    
    def test_full_rbac_flow(self):
        """Test complete RBAC flow: login -> get templates -> update -> verify"""
        # 1. Login as super admin
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@munal.com",
            "password": "Admin@123456"
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        user = login_response.json().get("user", {})
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        
        # Verify super admin role
        assert user.get("role") == "Super_Admin"
        assert user.get("module_permissions", {}).get("module_permissions") == True
        
        # 2. Get all modules
        modules_response = requests.get(f"{BASE_URL}/api/admin/module-permissions/modules", headers=headers)
        assert modules_response.status_code == 200
        modules = modules_response.json().get("modules", [])
        assert len(modules) > 20  # Should have 27+ modules
        
        # 3. Get templates
        templates_response = requests.get(f"{BASE_URL}/api/admin/module-permissions/templates", headers=headers)
        assert templates_response.status_code == 200
        templates = templates_response.json().get("templates", [])
        assert len(templates) >= 3
        
        # 4. Verify super_admin cannot be modified
        update_response = requests.put(
            f"{BASE_URL}/api/admin/module-permissions/templates/super_admin",
            headers=headers,
            json={"permissions": {"dashboard": True}}
        )
        assert update_response.status_code == 403
        
        # 5. Get user permissions
        user_perms_response = requests.get(
            f"{BASE_URL}/api/admin/module-permissions/user/{user.get('id')}",
            headers=headers
        )
        assert user_perms_response.status_code == 200
        
        print("✓ Full RBAC flow completed successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
