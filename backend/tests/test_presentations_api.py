"""
Presentations API Tests
Tests for CRUD operations, AI generation, and PPTX export for presentations feature.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_EMAIL = f"prestest_{uuid.uuid4().hex[:8]}@test.com"
TEST_PASSWORD = "TestPass@1234"


class TestPresentationsAPI:
    """Presentations CRUD and feature tests"""
    
    token = None
    user_id = None
    created_pres_id = None
    
    @pytest.fixture(autouse=True, scope="class")
    def setup_auth(self, request):
        """Register and login test user"""
        # Register
        reg_res = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD,
            "name": "Presentations Test User"
        })
        if reg_res.status_code not in [200, 201, 409]:
            pytest.skip(f"Registration failed: {reg_res.status_code}")
        
        # Login
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_res.status_code != 200:
            pytest.skip(f"Login failed: {login_res.status_code}")
        
        data = login_res.json()
        request.cls.token = data.get("token")
        request.cls.user_id = data.get("user", {}).get("id")
        
        yield
        
        # Cleanup - delete test presentations
        if request.cls.token:
            headers = {"Authorization": f"Bearer {request.cls.token}"}
            try:
                pres_list = requests.get(f"{BASE_URL}/api/presentations", headers=headers)
                if pres_list.status_code == 200:
                    for pres in pres_list.json():
                        requests.delete(f"{BASE_URL}/api/presentations/{pres['id']}", headers=headers)
            except:
                pass
    
    def get_headers(self):
        return {"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"}
    
    # Test 1: GET /api/presentations returns empty list for new user
    def test_01_list_presentations_empty(self):
        """GET /api/presentations returns empty list for new user (200)"""
        res = requests.get(f"{BASE_URL}/api/presentations", headers=self.get_headers())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/presentations returns empty list: {len(data)} items")
    
    # Test 2: POST /api/presentations creates a new presentation
    def test_02_create_presentation(self):
        """POST /api/presentations creates a new presentation with default slides"""
        res = requests.post(f"{BASE_URL}/api/presentations", 
            headers=self.get_headers(),
            json={"title": "TEST_Presentation_1"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        # Validate response structure
        assert "id" in data, "Response should have id"
        assert data["title"] == "TEST_Presentation_1", "Title should match"
        assert "slides" in data, "Response should have slides"
        assert len(data["slides"]) >= 1, "Should have at least 1 default slide"
        assert data["slides"][0]["layout"] == "title", "First slide should be title layout"
        
        TestPresentationsAPI.created_pres_id = data["id"]
        print(f"✓ Created presentation: {data['id']} with {len(data['slides'])} slides")
    
    # Test 3: GET /api/presentations/{id} returns the presentation
    def test_03_get_presentation(self):
        """GET /api/presentations/{id} returns the presentation with slides"""
        pres_id = TestPresentationsAPI.created_pres_id
        assert pres_id, "No presentation ID from previous test"
        
        res = requests.get(f"{BASE_URL}/api/presentations/{pres_id}", headers=self.get_headers())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        
        assert data["id"] == pres_id, "ID should match"
        assert data["title"] == "TEST_Presentation_1", "Title should match"
        assert "slides" in data, "Should have slides"
        assert len(data["slides"]) >= 1, "Should have slides"
        print(f"✓ GET presentation {pres_id}: {data['title']} with {len(data['slides'])} slides")
    
    # Test 4: PUT /api/presentations/{id} updates title and slides
    def test_04_update_presentation(self):
        """PUT /api/presentations/{id} updates title and slides"""
        pres_id = TestPresentationsAPI.created_pres_id
        assert pres_id, "No presentation ID from previous test"
        
        new_slides = [
            {"id": "slide-1", "layout": "title", "title": "Updated Title", "subtitle": "New Subtitle", "notes": ""},
            {"id": "slide-2", "layout": "content", "title": "Content Slide", "body": "Bullet 1\nBullet 2", "notes": ""}
        ]
        
        res = requests.put(f"{BASE_URL}/api/presentations/{pres_id}",
            headers=self.get_headers(),
            json={"title": "TEST_Updated_Presentation", "slides": new_slides}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert data["title"] == "TEST_Updated_Presentation", "Title should be updated"
        assert len(data["slides"]) == 2, "Should have 2 slides"
        assert data["slide_count"] == 2, "Slide count should be 2"
        
        # Verify persistence with GET
        get_res = requests.get(f"{BASE_URL}/api/presentations/{pres_id}", headers=self.get_headers())
        get_data = get_res.json()
        assert get_data["title"] == "TEST_Updated_Presentation", "Title should persist"
        assert len(get_data["slides"]) == 2, "Slides should persist"
        print(f"✓ Updated presentation: {data['title']} with {data['slide_count']} slides")
    
    # Test 5: POST /api/presentations/{id}/duplicate creates a copy
    def test_05_duplicate_presentation(self):
        """POST /api/presentations/{id}/duplicate creates a copy"""
        pres_id = TestPresentationsAPI.created_pres_id
        assert pres_id, "No presentation ID from previous test"
        
        res = requests.post(f"{BASE_URL}/api/presentations/{pres_id}/duplicate", headers=self.get_headers())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert data["id"] != pres_id, "Duplicate should have new ID"
        assert "(Copy)" in data["title"], "Duplicate title should contain (Copy)"
        assert len(data["slides"]) == 2, "Duplicate should have same slides"
        print(f"✓ Duplicated presentation: {data['id']} - {data['title']}")
    
    # Test 6: DELETE /api/presentations/{id} soft-deletes
    def test_06_delete_presentation(self):
        """DELETE /api/presentations/{id} soft-deletes (returns success)"""
        # Create a new presentation to delete
        create_res = requests.post(f"{BASE_URL}/api/presentations",
            headers=self.get_headers(),
            json={"title": "TEST_To_Delete"}
        )
        assert create_res.status_code == 200
        delete_id = create_res.json()["id"]
        
        # Delete it
        res = requests.delete(f"{BASE_URL}/api/presentations/{delete_id}", headers=self.get_headers())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data.get("success") == True, "Should return success: true"
        
        # Verify it's not in list anymore
        list_res = requests.get(f"{BASE_URL}/api/presentations", headers=self.get_headers())
        pres_ids = [p["id"] for p in list_res.json()]
        assert delete_id not in pres_ids, "Deleted presentation should not appear in list"
        print(f"✓ Deleted presentation: {delete_id}")
    
    # Test 7: POST /api/presentations/ai-generate creates AI presentation
    def test_07_ai_generate_presentation(self):
        """POST /api/presentations/ai-generate creates a multi-slide presentation from prompt"""
        res = requests.post(f"{BASE_URL}/api/presentations/ai-generate",
            headers=self.get_headers(),
            json={"prompt": "A brief overview of cloud computing benefits"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        
        assert "id" in data, "Should have id"
        assert "slides" in data, "Should have slides"
        assert len(data["slides"]) >= 3, f"AI should generate at least 3 slides, got {len(data['slides'])}"
        assert data.get("template") == "ai-generated", "Template should be ai-generated"
        print(f"✓ AI generated presentation: {data['id']} with {len(data['slides'])} slides")
    
    # Test 8: GET /api/presentations/{id}/export/pptx returns PPTX file
    def test_08_export_pptx(self):
        """GET /api/presentations/{id}/export/pptx returns valid PPTX file"""
        pres_id = TestPresentationsAPI.created_pres_id
        assert pres_id, "No presentation ID from previous test"
        
        res = requests.get(f"{BASE_URL}/api/presentations/{pres_id}/export/pptx", headers=self.get_headers())
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        
        # Check content type
        content_type = res.headers.get("content-type", "")
        assert "presentationml" in content_type or "application/vnd" in content_type, f"Should be PPTX content type, got {content_type}"
        
        # Check content disposition
        content_disp = res.headers.get("content-disposition", "")
        assert "attachment" in content_disp, "Should be attachment"
        assert ".pptx" in content_disp, "Should have .pptx extension"
        
        # Check file size (should be > 0)
        assert len(res.content) > 1000, f"PPTX file should be > 1KB, got {len(res.content)} bytes"
        print(f"✓ Exported PPTX: {len(res.content)} bytes")
    
    # Test 9: API returns 401 without auth token
    def test_09_unauthorized_access(self):
        """API returns 401 without auth token"""
        res = requests.get(f"{BASE_URL}/api/presentations")
        assert res.status_code == 401, f"Expected 401, got {res.status_code}"
        print("✓ Unauthorized access returns 401")
    
    # Test 10: GET /api/presentations/{id} returns 404 for non-existent
    def test_10_not_found(self):
        """GET /api/presentations/{id} returns 404 for non-existent presentation"""
        fake_id = str(uuid.uuid4())
        res = requests.get(f"{BASE_URL}/api/presentations/{fake_id}", headers=self.get_headers())
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print("✓ Non-existent presentation returns 404")
    
    # Test 11: AI generate requires prompt
    def test_11_ai_generate_requires_prompt(self):
        """POST /api/presentations/ai-generate returns 400 without prompt"""
        res = requests.post(f"{BASE_URL}/api/presentations/ai-generate",
            headers=self.get_headers(),
            json={"prompt": ""}
        )
        assert res.status_code == 400, f"Expected 400, got {res.status_code}"
        print("✓ AI generate without prompt returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
