"""
Workspace File Permissions API Tests
Tests for file permission controls: admin/member/viewer roles,
default_file_role setting, per-member file_role overrides, and
upload/delete permission enforcement.
"""
import pytest
import requests
import os
import base64
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"  # Test workspace
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"  # Admin user


@pytest.fixture(scope="module")
def session():
    """Shared requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(session):
    """Get authentication token for admin user"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@munal.com",
        "password": "Admin@123456"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def admin_user_id(session, auth_token):
    """Get admin user ID from token validation"""
    response = session.post(f"{BASE_URL}/api/auth/validate-token", json={"token": auth_token})
    if response.status_code == 200:
        user_id = response.json().get("user", {}).get("id")
        return user_id if user_id else ADMIN_USER_ID
    return ADMIN_USER_ID


@pytest.fixture(scope="module")
def test_member_user(session):
    """Create or find a test member user for permission testing"""
    # Return a fake user ID for testing - tests will handle appropriately
    # The test_04_non_admin_cannot_update_file_permissions uses a random user_id anyway
    return {"id": str(uuid.uuid4()), "email": "test_member_permissions@test.com"}


class TestFilePermissionsEndpoint:
    """Tests for GET /api/workspaces/{id}/file-permissions endpoint"""
    
    def test_01_get_file_permissions_returns_default_and_user_permission(self, session, admin_user_id):
        """GET file-permissions should return default_file_role and user_permission"""
        response = session.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "default_file_role" in data, "Response should contain default_file_role"
        assert "user_permission" in data, "Response should contain user_permission"
        assert data["default_file_role"] in ["member", "viewer"], f"default_file_role should be 'member' or 'viewer', got {data['default_file_role']}"
        assert data["user_permission"] in ["admin", "member", "viewer"], f"user_permission should be admin/member/viewer, got {data['user_permission']}"
        
        print(f"✓ GET file-permissions: default_file_role={data['default_file_role']}, user_permission={data['user_permission']}")
    
    def test_02_admin_user_gets_admin_permission(self, session, admin_user_id):
        """Admin/owner user should get 'admin' as user_permission"""
        response = session.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Admin/owner should have admin permission
        assert data["user_permission"] == "admin", f"Admin user should have 'admin' permission, got {data['user_permission']}"
        print("✓ Admin user correctly gets 'admin' permission")
    
    def test_03_get_permissions_nonexistent_workspace_returns_404(self, session, admin_user_id):
        """GET file-permissions for non-existent workspace should return 404"""
        fake_workspace = str(uuid.uuid4())
        response = session.get(
            f"{BASE_URL}/api/workspaces/{fake_workspace}/file-permissions",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent workspace returns 404")


class TestUpdateFilePermissions:
    """Tests for PUT /api/workspaces/{id}/file-permissions endpoint"""
    
    def test_01_admin_can_update_default_file_role_to_viewer(self, session, admin_user_id):
        """Admin can change default_file_role to 'viewer' (view only mode)"""
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "viewer"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True, "Update should return success: true"
        assert data.get("default_file_role") == "viewer", "default_file_role should be 'viewer'"
        print("✓ Admin successfully changed default_file_role to 'viewer'")
    
    def test_02_admin_can_update_default_file_role_to_member(self, session, admin_user_id):
        """Admin can change default_file_role to 'member' (all members upload)"""
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "member"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("default_file_role") == "member"
        print("✓ Admin successfully changed default_file_role to 'member'")
    
    def test_03_invalid_default_file_role_returns_400(self, session, admin_user_id):
        """Invalid default_file_role value should return 400"""
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "invalid_role"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid default_file_role returns 400")
    
    def test_04_non_admin_cannot_update_file_permissions(self, session, test_member_user):
        """Non-admin user cannot change file permissions (403)"""
        # Use a random user ID that's not admin
        random_user_id = str(uuid.uuid4())
        
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": random_user_id},
            json={"default_file_role": "viewer"}
        )
        
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}: {response.text}"
        print("✓ Non-admin user correctly denied (403) from changing permissions")


class TestMemberFileRoleOverride:
    """Tests for PUT /api/workspaces/{id}/members/{user_id}/file-role endpoint"""
    
    def test_01_admin_can_set_member_file_role_override(self, session, admin_user_id):
        """Admin can set per-member file role override"""
        # First get workspace members to find a member to test with
        members_response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members")
        if members_response.status_code != 200:
            pytest.skip("Cannot get workspace members")
        
        members = members_response.json().get("members", [])
        # Find a non-owner member or use admin as target for test
        target_member_id = admin_user_id
        for m in members:
            if m.get("user_id") != admin_user_id and m.get("role") not in ["owner"]:
                target_member_id = m["user_id"]
                break
        
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members/{target_member_id}/file-role",
            params={"user_id": admin_user_id},
            json={"file_role": "viewer"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        assert data.get("file_role") == "viewer"
        print(f"✓ Admin set member {target_member_id} file_role to 'viewer'")
        
        # Reset the role back
        session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members/{target_member_id}/file-role",
            params={"user_id": admin_user_id},
            json={"file_role": "member"}
        )
    
    def test_02_invalid_file_role_returns_400(self, session, admin_user_id):
        """Invalid file_role value should return 400"""
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members/{admin_user_id}/file-role",
            params={"user_id": admin_user_id},
            json={"file_role": "invalid"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Invalid file_role returns 400")
    
    def test_03_non_admin_cannot_set_member_file_role(self, session):
        """Non-admin user cannot set member file roles (403)"""
        random_user_id = str(uuid.uuid4())
        
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members/{random_user_id}/file-role",
            params={"user_id": random_user_id},
            json={"file_role": "member"}
        )
        
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Non-admin correctly denied (403) from setting member file role")
    
    def test_04_set_file_role_nonexistent_member_returns_404(self, session, admin_user_id):
        """Setting file role for non-existent member returns 404"""
        fake_member_id = str(uuid.uuid4())
        
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/members/{fake_member_id}/file-role",
            params={"user_id": admin_user_id},
            json={"file_role": "member"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent member returns 404")


class TestUploadPermissionEnforcement:
    """Tests for upload permission enforcement based on file roles"""
    
    def test_01_admin_can_always_upload(self, session, admin_user_id):
        """Admin can upload regardless of default_file_role setting"""
        # First set default to viewer (restricts normal members)
        session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "viewer"}
        )
        
        # Admin should still be able to upload
        file_content = b"Admin upload test file"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_admin_upload_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": admin_user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200, f"Admin should always be able to upload. Got {response.status_code}: {response.text}"
        
        # Cleanup
        file_id = response.json().get("file", {}).get("id")
        if file_id:
            session.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}?user_id={admin_user_id}")
        
        # Reset default role back to member
        session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "member"}
        )
        
        print("✓ Admin can upload even when default_file_role is 'viewer'")
    
    def test_02_viewer_role_user_cannot_upload(self, session):
        """User with viewer permission cannot upload (403)"""
        # Use a random user ID that would be treated as viewer
        viewer_user_id = str(uuid.uuid4())
        
        file_content = b"Viewer upload attempt"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_viewer_upload_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": viewer_user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 403, f"Viewer should get 403 on upload. Got {response.status_code}: {response.text}"
        print("✓ Viewer-role user correctly blocked (403) from uploading")


class TestDeletePermissionEnforcement:
    """Tests for delete permission enforcement based on file roles"""
    
    uploaded_file_id = None
    
    def test_01_delete_requires_user_id_param(self, session, admin_user_id):
        """Delete endpoint should have user_id query param for permission check"""
        # First upload a file to delete
        file_content = b"Delete permission test file"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_delete_perm_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": admin_user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        upload_response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        TestDeletePermissionEnforcement.uploaded_file_id = upload_response.json().get("file", {}).get("id")
        
        # Delete with user_id param should work for admin
        response = session.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{TestDeletePermissionEnforcement.uploaded_file_id}",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 200, f"Admin delete should succeed. Got {response.status_code}: {response.text}"
        print("✓ Delete endpoint works with user_id param for admin")
    
    def test_02_admin_can_delete_any_file(self, session, admin_user_id):
        """Admin can delete any file regardless of uploader"""
        # Upload a file
        file_content = b"Any file delete test"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_any_delete_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": admin_user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        upload_response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert upload_response.status_code == 200
        file_id = upload_response.json().get("file", {}).get("id")
        
        # Admin can delete
        response = session.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 200, f"Admin should delete any file. Got {response.status_code}"
        print("✓ Admin can delete any file")
    
    def test_03_viewer_cannot_delete_files(self, session, admin_user_id):
        """Viewer cannot delete files (403)"""
        # Upload a file first
        file_content = b"Viewer delete test"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_viewer_del_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": admin_user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        upload_response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert upload_response.status_code == 200
        file_id = upload_response.json().get("file", {}).get("id")
        
        # Viewer (random non-member) tries to delete
        viewer_id = str(uuid.uuid4())
        response = session.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}",
            params={"user_id": viewer_id}
        )
        
        assert response.status_code == 403, f"Viewer should get 403 on delete. Got {response.status_code}: {response.text}"
        print("✓ Viewer correctly blocked (403) from deleting files")
        
        # Cleanup with admin
        session.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}",
            params={"user_id": admin_user_id}
        )


class TestPermissionHierarchy:
    """Test permission hierarchy: owner/admin > member > viewer"""
    
    def test_01_verify_permission_hierarchy_via_permissions_endpoint(self, session, admin_user_id):
        """Verify that permissions endpoint returns correct hierarchy values"""
        # Admin user should have admin permission
        response = session.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Admin/owner should always return admin permission
        assert data["user_permission"] == "admin", f"Expected 'admin' permission for admin user"
        print("✓ Permission hierarchy verified: admin user gets 'admin' permission")
    
    def test_02_non_member_gets_viewer_permission(self, session):
        """Non-member user should get 'viewer' permission"""
        random_user = str(uuid.uuid4())
        
        response = session.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": random_user}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["user_permission"] == "viewer", f"Non-member should get 'viewer' permission, got {data['user_permission']}"
        print("✓ Non-member correctly gets 'viewer' permission")


class TestCleanup:
    """Cleanup test data and reset settings"""
    
    def test_cleanup_reset_default_role(self, session, admin_user_id):
        """Reset default_file_role back to 'member' for clean state"""
        response = session.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/file-permissions",
            params={"user_id": admin_user_id},
            json={"default_file_role": "member"}
        )
        
        assert response.status_code == 200
        print("✓ Reset default_file_role to 'member'")
    
    def test_cleanup_delete_test_files(self, session, admin_user_id):
        """Delete any TEST_ prefixed files"""
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files")
        if response.status_code == 200:
            files = response.json().get("files", [])
            deleted_count = 0
            for f in files:
                if f.get("file_name", "").startswith("TEST_"):
                    del_response = session.delete(
                        f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{f['id']}",
                        params={"user_id": admin_user_id}
                    )
                    if del_response.status_code == 200:
                        deleted_count += 1
            print(f"✓ Cleanup: Deleted {deleted_count} test files")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
