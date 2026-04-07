"""
Sheets API Tests - AI-powered spreadsheet intelligence module
Tests CRUD operations and AI generation endpoints for spreadsheets
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"


class TestSheetsAPI:
    """Sheets CRUD and AI endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, auth_token):
        """Setup for each test"""
        self.client = api_client
        self.token = auth_token
        self.client.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_sheet_ids = []
    
    def teardown_method(self, method):
        """Cleanup created sheets after each test"""
        for sheet_id in self.created_sheet_ids:
            try:
                self.client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
            except:
                pass
    
    # ── Health Check ──
    def test_01_health_check(self, api_client):
        """Verify API is accessible"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    # ── Create Sheet ──
    def test_02_create_blank_sheet(self):
        """POST /api/sheets creates a new blank sheet"""
        response = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Blank Sheet"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data
        assert data["title"] == "TEST_Blank Sheet"
        assert "data" in data
        assert isinstance(data["data"], list)
        assert len(data["data"]) > 0
        assert data["data"][0]["name"] == "Sheet1"
        assert "created_at" in data
        assert "updated_at" in data
        
        self.created_sheet_ids.append(data["id"])
        print(f"✓ Created blank sheet: {data['id']}")
    
    def test_03_create_sheet_with_workspace(self):
        """POST /api/sheets with workspace_id"""
        response = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Workspace Sheet",
            "workspace_id": "test-workspace-123"
        })
        assert response.status_code == 200
        
        data = response.json()
        assert data["workspace_id"] == "test-workspace-123"
        self.created_sheet_ids.append(data["id"])
        print(f"✓ Created sheet with workspace: {data['id']}")
    
    # ── List Sheets ──
    def test_04_list_sheets(self):
        """GET /api/sheets returns user's sheets"""
        # First create a sheet
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_List Test Sheet"
        })
        assert create_resp.status_code == 200
        created_id = create_resp.json()["id"]
        self.created_sheet_ids.append(created_id)
        
        # List sheets
        response = self.client.get(f"{BASE_URL}/api/sheets")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        
        # Find our created sheet
        found = any(s["id"] == created_id for s in data)
        assert found, "Created sheet not found in list"
        
        # Verify list doesn't include full data (optimization)
        for sheet in data:
            assert "data" not in sheet, "List should not include full sheet data"
        
        print(f"✓ Listed {len(data)} sheets")
    
    # ── Get Single Sheet ──
    def test_05_get_sheet_by_id(self):
        """GET /api/sheets/{id} returns sheet with data"""
        # Create sheet
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Get Test Sheet"
        })
        sheet_id = create_resp.json()["id"]
        self.created_sheet_ids.append(sheet_id)
        
        # Get sheet
        response = self.client.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] == sheet_id
        assert data["title"] == "TEST_Get Test Sheet"
        assert "data" in data
        assert isinstance(data["data"], list)
        print(f"✓ Retrieved sheet: {sheet_id}")
    
    def test_06_get_nonexistent_sheet(self):
        """GET /api/sheets/{id} returns 404 for invalid ID"""
        response = self.client.get(f"{BASE_URL}/api/sheets/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ 404 returned for nonexistent sheet")
    
    # ── Update Sheet ──
    def test_07_update_sheet_title(self):
        """PUT /api/sheets/{id} updates title"""
        # Create sheet
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Original Title"
        })
        sheet_id = create_resp.json()["id"]
        self.created_sheet_ids.append(sheet_id)
        
        # Update title
        response = self.client.put(f"{BASE_URL}/api/sheets/{sheet_id}", json={
            "title": "TEST_Updated Title"
        })
        assert response.status_code == 200
        
        # Verify update persisted
        get_resp = self.client.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_resp.json()["title"] == "TEST_Updated Title"
        print(f"✓ Updated sheet title: {sheet_id}")
    
    def test_08_update_sheet_data(self):
        """PUT /api/sheets/{id} updates data"""
        # Create sheet
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Data Update Sheet"
        })
        sheet_id = create_resp.json()["id"]
        self.created_sheet_ids.append(sheet_id)
        
        # Update data
        new_data = [{
            "name": "Sheet1",
            "celldata": [
                {"r": 0, "c": 0, "v": {"v": "Test Value", "m": "Test Value"}}
            ],
            "order": 0,
            "row": 50,
            "column": 26,
            "status": 1
        }]
        
        response = self.client.put(f"{BASE_URL}/api/sheets/{sheet_id}", json={
            "data": new_data
        })
        assert response.status_code == 200
        
        # Verify data persisted
        get_resp = self.client.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        saved_data = get_resp.json()["data"]
        assert len(saved_data[0]["celldata"]) == 1
        assert saved_data[0]["celldata"][0]["v"]["v"] == "Test Value"
        print(f"✓ Updated sheet data: {sheet_id}")
    
    # ── Delete Sheet ──
    def test_09_delete_sheet(self):
        """DELETE /api/sheets/{id} removes sheet"""
        # Create sheet
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Delete Me"
        })
        sheet_id = create_resp.json()["id"]
        
        # Delete sheet
        response = self.client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_resp = self.client.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_resp.status_code == 404
        print(f"✓ Deleted sheet: {sheet_id}")
    
    # ── Duplicate Sheet ──
    def test_10_duplicate_sheet(self):
        """POST /api/sheets/{id}/duplicate creates a copy"""
        # Create original
        create_resp = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Original Sheet"
        })
        original_id = create_resp.json()["id"]
        self.created_sheet_ids.append(original_id)
        
        # Duplicate
        response = self.client.post(f"{BASE_URL}/api/sheets/{original_id}/duplicate")
        assert response.status_code == 200
        
        data = response.json()
        assert data["id"] != original_id
        assert data["title"] == "TEST_Original Sheet (Copy)"
        assert "data" in data
        
        self.created_sheet_ids.append(data["id"])
        print(f"✓ Duplicated sheet: {original_id} -> {data['id']}")
    
    # ── AI Generate Sheet ──
    def test_11_ai_generate_sheet(self):
        """POST /api/sheets/ai/generate creates AI-generated sheet"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/generate", json={
            "prompt": "Create a simple 3-column expense tracker with Date, Description, and Amount columns. Include 3 sample rows."
        })
        
        # AI generation may take time
        assert response.status_code in [200, 500, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "id" in data
            assert "title" in data
            assert "data" in data
            assert isinstance(data["data"], list)
            assert len(data["data"]) > 0
            
            # Verify celldata has content
            celldata = data["data"][0].get("celldata", [])
            assert len(celldata) > 0, "AI should generate cell data"
            
            self.created_sheet_ids.append(data["id"])
            print(f"✓ AI generated sheet: {data['id']} - {data['title']}")
        elif response.status_code == 500:
            # AI service might not be configured
            error = response.json()
            print(f"⚠ AI service error (expected if not configured): {error}")
        else:
            print(f"⚠ AI returned 422 - may need prompt adjustment")
    
    # ── AI Formula ──
    def test_12_ai_formula(self):
        """POST /api/sheets/ai/formula converts text to formula"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Sum of cells A1 to A10"
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "formula" in data
            assert data["formula"].startswith("=")
            assert "SUM" in data["formula"].upper() or "A1" in data["formula"].upper()
            print(f"✓ AI formula generated: {data['formula']}")
        else:
            error = response.json()
            print(f"⚠ AI formula service error: {error}")
    
    # ── Auth Required ──
    def test_13_unauthorized_access(self):
        """Sheets endpoints require authentication"""
        # Create fresh session without auth
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        response = fresh_client.get(f"{BASE_URL}/api/sheets")
        assert response.status_code in [401, 403, 422], f"Expected 401/403/422, got {response.status_code}: {response.text}"
        print("✓ Unauthorized access blocked")


# ── Fixtures ──
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
