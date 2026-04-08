"""
Backend tests for File Upload/Management API (Fixed FormData approach)
- POST /api/chat/files/upload - Upload file using FormData
- GET /api/chat/files/user/{user_id} - List user's files
- GET /api/chat/files/{file_id} - Download file
- DELETE /api/chat/files/{file_id} - Delete file
"""

import pytest
import requests
import base64
import os

# Get API URL from environment - uses the public preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=')[1].strip().strip('"\'')
                    break
    except:
        pass

if not BASE_URL:
    BASE_URL = "https://transcript-dash.preview.emergentagent.com"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API is reachable"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data}")


class TestFileUploadFormData:
    """Tests for POST /api/chat/files/upload using FormData (fixed approach)"""
    
    uploaded_file_id = None
    
    def test_file_upload_formdata_success(self):
        """Test successful file upload using FormData"""
        content = b"This is a test file content for FormData upload testing."
        base64_content = base64.b64encode(content).decode('utf-8')
        
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            data={
                "user_id": "TEST_formdata_user_123",
                "file_name": "test_formdata_document.txt",
                "file_data": base64_content,
                "content_type": "text/plain",
                "category": "documents"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure (fixed response format)
        assert data.get("success") == True, "Response should have success=True"
        assert "file" in data, "Response should contain file object"
        
        file_info = data["file"]
        assert "id" in file_info, "File should have id"
        assert file_info.get("file_name") == "test_formdata_document.txt"
        assert file_info.get("content_type") == "text/plain"
        assert file_info.get("size") == len(content)
        assert file_info.get("category") == "documents"
        assert "uploaded_at" in file_info, "File should have uploaded_at timestamp"
        
        # Store for later tests
        TestFileUploadFormData.uploaded_file_id = file_info["id"]
        print(f"✓ File uploaded successfully via FormData: {file_info['id']}")
    
    def test_file_upload_json_rejected(self):
        """Test that JSON upload is rejected (expects FormData)"""
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            headers={"Content-Type": "application/json"},
            json={
                "user_id": "TEST_json_user",
                "file_name": "test_json.txt",
                "file_data": "VGVzdA==",
                "content_type": "text/plain",
                "category": "documents"
            }
        )
        
        # Should return 422 because backend expects FormData Form fields
        assert response.status_code == 422, f"Expected 422 for JSON, got {response.status_code}"
        
        # Verify error detail is an array of validation errors
        data = response.json()
        assert "detail" in data, "Error should contain detail"
        assert isinstance(data["detail"], list), "Detail should be an array"
        print("✓ JSON upload correctly rejected with 422")


class TestFileList:
    """Tests for GET /api/chat/files/user/{user_id}"""
    
    def test_list_user_files(self):
        """Test listing files for a user"""
        # First upload a file
        content = b"Test file for listing"
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            data={
                "user_id": "TEST_list_user_456",
                "file_name": "list_test_file.txt",
                "file_data": base64.b64encode(content).decode('utf-8'),
                "content_type": "text/plain",
                "category": "documents"
            }
        )
        assert response.status_code == 200
        
        # Now list files
        list_response = requests.get(f"{BASE_URL}/api/chat/files/user/TEST_list_user_456")
        assert list_response.status_code == 200
        
        data = list_response.json()
        assert "files" in data, "Response should contain files array"
        assert "count" in data, "Response should contain count"
        assert data["count"] >= 1, "Should have at least 1 file"
        
        # Validate file structure - uses file_name, size, uploaded_at (not filename, file_size, created_at)
        files = data["files"]
        assert len(files) >= 1
        
        file_item = files[0]
        assert "id" in file_item
        assert "file_name" in file_item, "Should have file_name (not filename)"
        assert "size" in file_item, "Should have size (not file_size)"
        assert "uploaded_at" in file_item, "Should have uploaded_at (not created_at)"
        assert "content_type" in file_item
        
        print(f"✓ Listed {data['count']} files for user")
    
    def test_list_files_with_category_filter(self):
        """Test listing files with category filter"""
        response = requests.get(
            f"{BASE_URL}/api/chat/files/user/TEST_list_user_456",
            params={"category": "documents"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # All returned files should have matching category
        for file_item in data.get("files", []):
            assert file_item.get("category") == "documents"
        
        print(f"✓ Category filter works, {data['count']} files returned")


class TestFileDownload:
    """Tests for GET /api/chat/files/{file_id}"""
    
    def test_file_download(self):
        """Test file download after upload"""
        content = b"Content for download verification test"
        
        # Upload
        upload_response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            data={
                "user_id": "TEST_download_user_789",
                "file_name": "download_test.txt",
                "file_data": base64.b64encode(content).decode('utf-8'),
                "content_type": "text/plain",
                "category": "documents"
            }
        )
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file"]["id"]
        
        # Download
        download_response = requests.get(f"{BASE_URL}/api/chat/files/{file_id}")
        assert download_response.status_code == 200
        assert download_response.content == content
        
        print(f"✓ File download successful, content matches")
    
    def test_file_not_found(self):
        """Test download of non-existent file"""
        response = requests.get(f"{BASE_URL}/api/chat/files/nonexistent-file-id-xyz")
        assert response.status_code == 404
        print("✓ Non-existent file returns 404")


class TestFileDelete:
    """Tests for DELETE /api/chat/files/{file_id}"""
    
    def test_file_delete_and_verify(self):
        """Test file deletion and verify it's gone"""
        content = b"File to delete"
        
        # Upload
        upload_response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            data={
                "user_id": "TEST_delete_user_000",
                "file_name": "delete_me.txt",
                "file_data": base64.b64encode(content).decode('utf-8'),
                "content_type": "text/plain",
                "category": "documents"
            }
        )
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file"]["id"]
        
        # Delete
        delete_response = requests.delete(f"{BASE_URL}/api/chat/files/{file_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") == True
        
        # Verify deleted
        get_response = requests.get(f"{BASE_URL}/api/chat/files/{file_id}")
        assert get_response.status_code == 404
        
        print(f"✓ File deleted and verified gone")
    
    def test_delete_nonexistent_file(self):
        """Test deleting a file that doesn't exist"""
        response = requests.delete(f"{BASE_URL}/api/chat/files/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Delete of non-existent file returns 404")


class TestErrorHandling:
    """Tests for error message handling (the main bug fix)"""
    
    def test_422_error_has_readable_detail(self):
        """Verify 422 error returns structured detail for proper error message extraction"""
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            headers={"Content-Type": "application/json"},
            json={"invalid": "data"}
        )
        
        assert response.status_code == 422
        data = response.json()
        
        # Frontend now handles this by extracting msg from each detail item
        assert "detail" in data
        assert isinstance(data["detail"], list)
        
        # Each detail item should have 'msg' field that frontend can extract
        for detail_item in data["detail"]:
            assert "msg" in detail_item, "Each detail item should have msg field"
        
        print("✓ 422 error has proper detail structure for frontend error extraction")


# Cleanup function to remove test files
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_files():
    """Cleanup TEST_ prefixed files after all tests"""
    yield
    # Get all test users and clean up their files
    test_users = [
        "TEST_formdata_user_123",
        "TEST_list_user_456",
        "TEST_download_user_789",
        "TEST_delete_user_000"
    ]
    for user_id in test_users:
        try:
            list_response = requests.get(f"{BASE_URL}/api/chat/files/user/{user_id}")
            if list_response.status_code == 200:
                files = list_response.json().get("files", [])
                for file_item in files:
                    requests.delete(f"{BASE_URL}/api/chat/files/{file_item['id']}")
        except:
            pass


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
