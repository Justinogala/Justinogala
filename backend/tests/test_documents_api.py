"""
Documents API Tests - CRUD operations for rich text documents
Tests: list, create, get, update, delete, duplicate
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"doctest_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "TestPass@1234"


class TestDocumentsAPI:
    """Documents CRUD endpoint tests"""
    
    token = None
    user_id = None
    created_doc_id = None
    
    @classmethod
    def setup_class(cls):
        """Register a test user and get auth token"""
        # Register new user
        register_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Doc Test User"
        })
        
        if register_res.status_code in [200, 201]:
            data = register_res.json()
            cls.token = data.get("token")
            cls.user_id = data.get("user", {}).get("id")
            print(f"Registered test user: {TEST_EMAIL}")
        else:
            # Try login if user exists
            login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if login_res.status_code == 200:
                data = login_res.json()
                cls.token = data.get("token")
                cls.user_id = data.get("user", {}).get("id")
                print(f"Logged in as: {TEST_EMAIL}")
            else:
                pytest.skip(f"Could not authenticate: {login_res.status_code}")
    
    def get_headers(self):
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
    
    # ── Test 1: GET /api/documents returns empty list for new user ──
    def test_01_list_documents_empty(self):
        """GET /api/documents returns empty list for new user (200)"""
        res = requests.get(f"{BASE_URL}/api/documents", headers=self.get_headers())
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"Documents list returned {len(data)} items")
    
    # ── Test 2: POST /api/documents creates a new document ──
    def test_02_create_document(self):
        """POST /api/documents creates a new document with title and content"""
        payload = {
            "title": "TEST_My First Document",
            "content": "<h1>Hello World</h1><p>This is test content.</p>"
        }
        res = requests.post(f"{BASE_URL}/api/documents", json=payload, headers=self.get_headers())
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Validate response structure
        assert "id" in data, "Response should contain 'id'"
        assert data["title"] == payload["title"], f"Title mismatch: {data['title']}"
        assert data["content"] == payload["content"], "Content mismatch"
        assert "created_at" in data, "Should have created_at"
        assert "updated_at" in data, "Should have updated_at"
        assert data.get("deleted") == False, "Should not be deleted"
        
        # Store for later tests
        TestDocumentsAPI.created_doc_id = data["id"]
        print(f"Created document: {data['id']}")
    
    # ── Test 3: GET /api/documents/{id} returns the created document ──
    def test_03_get_document(self):
        """GET /api/documents/{id} returns the created document"""
        assert self.created_doc_id, "No document ID from previous test"
        
        res = requests.get(f"{BASE_URL}/api/documents/{self.created_doc_id}", headers=self.get_headers())
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert data["id"] == self.created_doc_id, "ID mismatch"
        assert data["title"] == "TEST_My First Document", "Title mismatch"
        assert "<h1>Hello World</h1>" in data["content"], "Content mismatch"
        print(f"Retrieved document: {data['title']}")
    
    # ── Test 4: PUT /api/documents/{id} updates title and content ──
    def test_04_update_document(self):
        """PUT /api/documents/{id} updates title and content"""
        assert self.created_doc_id, "No document ID from previous test"
        
        update_payload = {
            "title": "TEST_Updated Document Title",
            "content": "<h1>Updated Content</h1><p>This content was updated.</p>"
        }
        res = requests.put(
            f"{BASE_URL}/api/documents/{self.created_doc_id}",
            json=update_payload,
            headers=self.get_headers()
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert data["title"] == update_payload["title"], f"Title not updated: {data['title']}"
        assert data["content"] == update_payload["content"], "Content not updated"
        print(f"Updated document title to: {data['title']}")
        
        # Verify with GET
        verify_res = requests.get(f"{BASE_URL}/api/documents/{self.created_doc_id}", headers=self.get_headers())
        verify_data = verify_res.json()
        assert verify_data["title"] == update_payload["title"], "Update not persisted"
    
    # ── Test 5: POST /api/documents/{id}/duplicate creates a copy ──
    def test_05_duplicate_document(self):
        """POST /api/documents/{id}/duplicate creates a copy"""
        assert self.created_doc_id, "No document ID from previous test"
        
        res = requests.post(
            f"{BASE_URL}/api/documents/{self.created_doc_id}/duplicate",
            headers=self.get_headers()
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "id" in data, "Duplicate should have new ID"
        assert data["id"] != self.created_doc_id, "Duplicate should have different ID"
        assert "(Copy)" in data["title"], f"Duplicate title should contain '(Copy)': {data['title']}"
        print(f"Duplicated document: {data['id']} - {data['title']}")
        
        # Clean up duplicate
        requests.delete(f"{BASE_URL}/api/documents/{data['id']}", headers=self.get_headers())
    
    # ── Test 6: DELETE /api/documents/{id} soft-deletes ──
    def test_06_delete_document(self):
        """DELETE /api/documents/{id} soft-deletes (returns success)"""
        assert self.created_doc_id, "No document ID from previous test"
        
        res = requests.delete(
            f"{BASE_URL}/api/documents/{self.created_doc_id}",
            headers=self.get_headers()
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("success") == True, "Should return success: true"
        print(f"Deleted document: {self.created_doc_id}")
        
        # Verify document no longer appears in list
        list_res = requests.get(f"{BASE_URL}/api/documents", headers=self.get_headers())
        docs = list_res.json()
        doc_ids = [d["id"] for d in docs]
        assert self.created_doc_id not in doc_ids, "Deleted document should not appear in list"
    
    # ── Test 7: Search functionality ──
    def test_07_search_documents(self):
        """GET /api/documents?search=term filters documents"""
        # Create a document with specific title
        create_res = requests.post(f"{BASE_URL}/api/documents", json={
            "title": "TEST_Searchable Meeting Notes",
            "content": "<p>Important meeting content</p>"
        }, headers=self.get_headers())
        
        assert create_res.status_code == 200
        doc_id = create_res.json()["id"]
        
        # Search for it
        search_res = requests.get(
            f"{BASE_URL}/api/documents?search=Searchable",
            headers=self.get_headers()
        )
        
        assert search_res.status_code == 200
        results = search_res.json()
        assert len(results) >= 1, "Should find at least one document"
        assert any("Searchable" in d["title"] for d in results), "Search should return matching document"
        print(f"Search returned {len(results)} results")
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/documents/{doc_id}", headers=self.get_headers())
    
    # ── Test 8: Unauthorized access ──
    def test_08_unauthorized_access(self):
        """API returns 401 without auth token"""
        res = requests.get(f"{BASE_URL}/api/documents")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("Unauthorized access correctly rejected")
    
    # ── Test 9: 404 for non-existent document ──
    def test_09_get_nonexistent_document(self):
        """GET /api/documents/{id} returns 404 for non-existent document"""
        fake_id = str(uuid.uuid4())
        res = requests.get(f"{BASE_URL}/api/documents/{fake_id}", headers=self.get_headers())
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("Non-existent document correctly returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
