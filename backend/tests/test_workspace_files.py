"""
Workspace Files API Tests
Tests for workspace-scoped file management: upload, list, download, delete
Verifies file isolation between workspaces
"""
import pytest
import requests
import os
import base64
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"  # Test workspace from context
TEST_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"  # Admin user ID


@pytest.fixture(scope="module")
def session():
    """Shared requests session"""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(session):
    """Get authentication token"""
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@munal.com",
        "password": "Admin@123456"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Authentication failed")


@pytest.fixture(scope="module")
def user_id(session, auth_token):
    """Get user ID from token validation"""
    response = session.post(f"{BASE_URL}/api/auth/validate-token", json={"token": auth_token})
    if response.status_code == 200:
        return response.json().get("user", {}).get("id")
    return TEST_USER_ID


class TestWorkspaceFilesAPI:
    """Tests for workspace file upload, list, download, and delete endpoints"""
    
    uploaded_file_id = None  # Track for cleanup
    
    def test_01_list_workspace_files_empty_or_existing(self, session):
        """Test listing workspace files - should return files array"""
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "files" in data, "Response should contain 'files' key"
        assert isinstance(data["files"], list), "Files should be a list"
        assert "count" in data, "Response should contain 'count' key"
        print(f"✓ List files returned {data['count']} files")
    
    def test_02_upload_file_to_workspace(self, session, user_id):
        """Test uploading a file to workspace via POST with FormData"""
        # Create test file content
        file_content = b"Test file content for workspace file manager - " + str(uuid.uuid4()).encode()
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_workspace_file_{uuid.uuid4().hex[:8]}.txt"
        
        # Upload using form data
        form_data = {
            "user_id": user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True, "Upload should return success: true"
        assert "file" in data, "Response should contain 'file' key"
        
        file_info = data["file"]
        assert file_info["file_name"] == file_name, "File name should match"
        assert file_info["content_type"] == "text/plain", "Content type should match"
        assert file_info["size"] == len(file_content), "File size should match"
        assert "id" in file_info, "File should have ID"
        assert file_info["workspace_id"] == WORKSPACE_ID, "Workspace ID should match"
        
        # Store for later tests
        TestWorkspaceFilesAPI.uploaded_file_id = file_info["id"]
        print(f"✓ Uploaded file {file_name} with ID {file_info['id']}")
    
    def test_03_verify_uploaded_file_in_list(self, session):
        """Verify the uploaded file appears in the workspace file list"""
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files")
        
        assert response.status_code == 200
        data = response.json()
        files = data.get("files", [])
        
        # Find our uploaded file
        file_ids = [f["id"] for f in files]
        assert TestWorkspaceFilesAPI.uploaded_file_id in file_ids, "Uploaded file should appear in list"
        
        # Verify file metadata
        uploaded_file = next((f for f in files if f["id"] == TestWorkspaceFilesAPI.uploaded_file_id), None)
        assert uploaded_file is not None, "Should find uploaded file"
        assert "uploader_name" in uploaded_file, "File should have uploader_name"
        assert "uploaded_at" in uploaded_file, "File should have uploaded_at timestamp"
        print(f"✓ File verified in list with uploader: {uploaded_file.get('uploader_name')}")
    
    def test_04_download_workspace_file(self, session):
        """Test downloading/streaming a workspace file"""
        file_id = TestWorkspaceFilesAPI.uploaded_file_id
        assert file_id is not None, "Need uploaded file ID from previous test"
        
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert len(response.content) > 0, "Downloaded content should not be empty"
        assert b"Test file content for workspace file manager" in response.content, "Content should match uploaded data"
        
        # Check content-disposition header
        content_disp = response.headers.get("content-disposition", "")
        assert "filename" in content_disp, "Should have filename in content-disposition"
        print(f"✓ Downloaded file successfully, size: {len(response.content)} bytes")
    
    def test_05_download_nonexistent_file(self, session):
        """Test downloading a file that doesn't exist returns 404"""
        fake_id = str(uuid.uuid4())
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent file returns 404")
    
    def test_06_delete_workspace_file(self, session):
        """Test deleting a workspace file"""
        file_id = TestWorkspaceFilesAPI.uploaded_file_id
        assert file_id is not None, "Need uploaded file ID from previous test"
        
        response = session.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True, "Delete should return success: true"
        print(f"✓ File {file_id} deleted successfully")
    
    def test_07_verify_file_deleted_from_list(self, session):
        """Verify deleted file no longer appears in list"""
        file_id = TestWorkspaceFilesAPI.uploaded_file_id
        
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files")
        assert response.status_code == 200
        
        data = response.json()
        files = data.get("files", [])
        file_ids = [f["id"] for f in files]
        
        assert file_id not in file_ids, "Deleted file should not appear in list"
        print("✓ Deleted file confirmed removed from list")
    
    def test_08_delete_nonexistent_file(self, session):
        """Test deleting a file that doesn't exist returns 404"""
        fake_id = str(uuid.uuid4())
        response = session.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Deleting non-existent file returns 404")


class TestWorkspaceFileIsolation:
    """Test that files are scoped to their workspace"""
    
    def test_01_file_not_in_different_workspace(self, session, user_id):
        """Files uploaded to one workspace should not appear in another"""
        # Upload a file to the test workspace
        file_content = b"Workspace isolation test file"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_isolation_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": user_id,
            "file_name": file_name,
            "file_data": file_base64,
            "content_type": "text/plain"
        }
        
        response = session.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 200
        file_id = response.json()["file"]["id"]
        
        # Try to access the file from a different workspace ID (fake)
        fake_workspace = str(uuid.uuid4())
        
        # File should not be downloadable from different workspace
        response = session.get(f"{BASE_URL}/api/workspaces/{fake_workspace}/files/{file_id}")
        assert response.status_code == 404, "File should not be accessible from different workspace"
        
        # File should not be deletable from different workspace
        response = session.delete(f"{BASE_URL}/api/workspaces/{fake_workspace}/files/{file_id}")
        assert response.status_code == 404, "File should not be deletable from different workspace"
        
        # Clean up - delete from correct workspace
        session.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}")
        print("✓ File isolation verified - files are workspace-scoped")


class TestWorkspaceStatsFileCount:
    """Test that workspace stats reflect file count correctly"""
    
    def test_01_stats_include_file_count(self, session, user_id):
        """Verify workspace stats endpoint includes file_count"""
        # Get initial stats
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/stats")
        assert response.status_code == 200
        initial_stats = response.json()
        initial_file_count = initial_stats.get("file_count", 0)
        
        # Upload a file
        file_content = b"Stats test file"
        file_base64 = base64.b64encode(file_content).decode('utf-8')
        file_name = f"TEST_stats_{uuid.uuid4().hex[:8]}.txt"
        
        form_data = {
            "user_id": user_id,
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
        file_id = upload_response.json()["file"]["id"]
        
        # Check stats increased
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/stats")
        assert response.status_code == 200
        new_stats = response.json()
        new_file_count = new_stats.get("file_count", 0)
        
        assert new_file_count == initial_file_count + 1, f"File count should increase by 1. Was {initial_file_count}, now {new_file_count}"
        print(f"✓ Stats file_count increased from {initial_file_count} to {new_file_count}")
        
        # Clean up
        session.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/files/{file_id}")
        
        # Verify count decreased
        response = session.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/stats")
        final_stats = response.json()
        final_file_count = final_stats.get("file_count", 0)
        assert final_file_count == initial_file_count, "File count should return to initial after delete"
        print(f"✓ Stats file_count returned to {final_file_count} after delete")


class TestUploadToNonexistentWorkspace:
    """Test error handling for invalid workspace"""
    
    def test_01_upload_to_nonexistent_workspace(self, session, user_id):
        """Upload to non-existent workspace should return 404"""
        fake_workspace = str(uuid.uuid4())
        
        form_data = {
            "user_id": user_id,
            "file_name": "test.txt",
            "file_data": base64.b64encode(b"test").decode('utf-8'),
            "content_type": "text/plain"
        }
        
        response = session.post(
            f"{BASE_URL}/api/workspaces/{fake_workspace}/files/upload",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Upload to non-existent workspace returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
