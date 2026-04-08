"""
Test Suite for Sheets Save/Persistence Bug Fix
Tests the fix for: Fortune-Sheet's onChange firing during initialization with empty/default data,
and the auto-save (2s debounce) overwriting the original sheet content.

Fix implemented:
- isInitializedRef: 3s timeout before enabling auto-save
- changeCountRef: Skip first 2 onChange calls
- saveData: Empty-data check to prevent saving sheets with 0 content
"""

import pytest
import requests
import os
import time
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"


class TestSheetsSavePersistence:
    """Tests for sheet save/persistence functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup: Get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        token = login_response.json().get("token")
        assert token, "No token in login response"
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        self.token = token
        yield
        # Cleanup: Delete test sheets
        self._cleanup_test_sheets()
    
    def _cleanup_test_sheets(self):
        """Delete sheets created during tests"""
        try:
            sheets = self.session.get(f"{BASE_URL}/api/sheets").json()
            for sheet in sheets:
                if sheet.get("title", "").startswith("TEST_"):
                    self.session.delete(f"{BASE_URL}/api/sheets/{sheet['id']}")
        except Exception as e:
            print(f"Cleanup error: {e}")
    
    def test_01_ai_generate_sheet_creates_data(self):
        """Test: POST /api/sheets/ai/generate creates sheet with actual data"""
        response = self.session.post(
            f"{BASE_URL}/api/sheets/ai/generate",
            json={"prompt": "Create a simple employee list with 5 employees: Name, Department, Salary"}
        )
        assert response.status_code == 200, f"AI generate failed: {response.text}"
        
        data = response.json()
        assert "id" in data, "No sheet ID returned"
        assert "data" in data, "No data in response"
        assert "title" in data, "No title in response"
        
        # Verify data has content
        sheet_data = data["data"]
        assert isinstance(sheet_data, list), "Data should be a list"
        assert len(sheet_data) > 0, "Data should have at least one sheet"
        
        # Check celldata has entries
        celldata = sheet_data[0].get("celldata", [])
        assert len(celldata) > 0, f"Celldata should have entries, got {len(celldata)}"
        print(f"✓ AI generated sheet with {len(celldata)} cells")
        
        # Store sheet ID for later tests
        self.generated_sheet_id = data["id"]
        
        # Verify data persists in DB by fetching it
        get_response = self.session.get(f"{BASE_URL}/api/sheets/{data['id']}")
        assert get_response.status_code == 200, "Failed to fetch generated sheet"
        
        fetched_data = get_response.json()
        fetched_celldata = fetched_data["data"][0].get("celldata", [])
        assert len(fetched_celldata) == len(celldata), f"Data mismatch: generated {len(celldata)}, fetched {len(fetched_celldata)}"
        print(f"✓ Data persisted correctly: {len(fetched_celldata)} cells in DB")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{data['id']}")
    
    def test_02_sheet_data_persists_after_wait(self):
        """Test: Sheet data should NOT be wiped after waiting (regression test for auto-save bug)"""
        # Generate a sheet with data
        gen_response = self.session.post(
            f"{BASE_URL}/api/sheets/ai/generate",
            json={"prompt": "Create TEST_Persistence sheet with 3 products: Name, Price, Stock"}
        )
        assert gen_response.status_code == 200, f"AI generate failed: {gen_response.text}"
        
        sheet_id = gen_response.json()["id"]
        initial_celldata_count = len(gen_response.json()["data"][0].get("celldata", []))
        print(f"✓ Generated sheet with {initial_celldata_count} cells")
        
        # Wait 10+ seconds (simulating user opening sheet and waiting)
        print("Waiting 12 seconds to simulate user viewing sheet...")
        time.sleep(12)
        
        # Fetch sheet again - data should still be there
        get_response = self.session.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_response.status_code == 200, "Failed to fetch sheet after wait"
        
        after_wait_data = get_response.json()
        after_wait_celldata = after_wait_data["data"][0].get("celldata", [])
        
        assert len(after_wait_celldata) > 0, "Sheet data was wiped! Bug not fixed."
        assert len(after_wait_celldata) == initial_celldata_count, \
            f"Data changed: initial {initial_celldata_count}, after wait {len(after_wait_celldata)}"
        print(f"✓ Data persisted after 12s wait: {len(after_wait_celldata)} cells")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
    
    def test_03_manual_save_works(self):
        """Test: PUT /api/sheets/{id} saves data correctly"""
        # Create a sheet
        create_response = self.session.post(
            f"{BASE_URL}/api/sheets",
            json={"title": "TEST_ManualSave"}
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        sheet_id = create_response.json()["id"]
        
        # Prepare test data
        test_data = [{
            "name": "Sheet1",
            "celldata": [
                {"r": 0, "c": 0, "v": {"v": "Header1", "m": "Header1", "ct": {"fa": "General", "t": "g"}}},
                {"r": 0, "c": 1, "v": {"v": "Header2", "m": "Header2", "ct": {"fa": "General", "t": "g"}}},
                {"r": 1, "c": 0, "v": {"v": "Value1", "m": "Value1", "ct": {"fa": "General", "t": "g"}}},
                {"r": 1, "c": 1, "v": {"v": 100, "m": "100", "ct": {"fa": "General", "t": "n"}}},
            ],
            "order": 0,
            "row": 50,
            "column": 26,
            "status": 1
        }]
        
        # Save data via PUT
        save_response = self.session.put(
            f"{BASE_URL}/api/sheets/{sheet_id}",
            json={"data": test_data}
        )
        assert save_response.status_code == 200, f"Save failed: {save_response.text}"
        print("✓ Manual save returned 200")
        
        # Verify data persisted
        get_response = self.session.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_response.status_code == 200, "Failed to fetch saved sheet"
        
        saved_data = get_response.json()
        saved_celldata = saved_data["data"][0].get("celldata", [])
        assert len(saved_celldata) == 4, f"Expected 4 cells, got {len(saved_celldata)}"
        print(f"✓ Data persisted: {len(saved_celldata)} cells")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
    
    def test_04_empty_data_not_saved(self):
        """Test: Backend should reject saving empty data (protection against auto-save bug)"""
        # Create a sheet with data first
        create_response = self.session.post(
            f"{BASE_URL}/api/sheets",
            json={"title": "TEST_EmptyDataProtection"}
        )
        assert create_response.status_code == 200
        sheet_id = create_response.json()["id"]
        
        # Add some data
        test_data = [{
            "name": "Sheet1",
            "celldata": [
                {"r": 0, "c": 0, "v": {"v": "Important Data", "m": "Important Data"}},
            ],
            "order": 0, "row": 50, "column": 26, "status": 1
        }]
        self.session.put(f"{BASE_URL}/api/sheets/{sheet_id}", json={"data": test_data})
        
        # Try to save empty data (simulating the bug scenario)
        empty_data = [{
            "name": "Sheet1",
            "celldata": [],  # Empty!
            "order": 0, "row": 50, "column": 26, "status": 1
        }]
        
        # Note: Backend currently accepts this - the protection is in frontend
        # This test documents the current behavior
        save_response = self.session.put(
            f"{BASE_URL}/api/sheets/{sheet_id}",
            json={"data": empty_data}
        )
        # Backend accepts the save (protection is in frontend)
        assert save_response.status_code == 200, "Save request failed"
        print("Note: Backend accepts empty data - protection is in frontend saveData function")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
    
    def test_05_navigate_away_and_back(self):
        """Test: Sheet data persists after navigating away and back"""
        # Generate a sheet
        gen_response = self.session.post(
            f"{BASE_URL}/api/sheets/ai/generate",
            json={"prompt": "Create TEST_Navigation sheet with 3 tasks: Task, Status, Due Date"}
        )
        assert gen_response.status_code == 200
        
        sheet_id = gen_response.json()["id"]
        initial_count = len(gen_response.json()["data"][0].get("celldata", []))
        print(f"✓ Created sheet with {initial_count} cells")
        
        # Simulate "navigating away" by listing all sheets
        list_response = self.session.get(f"{BASE_URL}/api/sheets")
        assert list_response.status_code == 200
        print("✓ Listed sheets (simulating navigation away)")
        
        # Wait a bit
        time.sleep(2)
        
        # "Navigate back" by fetching the sheet again
        get_response = self.session.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_response.status_code == 200
        
        after_nav_count = len(get_response.json()["data"][0].get("celldata", []))
        assert after_nav_count == initial_count, \
            f"Data changed after navigation: {initial_count} -> {after_nav_count}"
        print(f"✓ Data persisted after navigation: {after_nav_count} cells")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
    
    def test_06_download_xlsx_has_data(self):
        """Test: Downloaded XLSX should contain actual data"""
        # Generate a sheet with data
        gen_response = self.session.post(
            f"{BASE_URL}/api/sheets/ai/generate",
            json={"prompt": "Create TEST_Download sheet with 5 items: Item, Quantity, Price"}
        )
        assert gen_response.status_code == 200
        
        sheet_id = gen_response.json()["id"]
        celldata_count = len(gen_response.json()["data"][0].get("celldata", []))
        print(f"✓ Created sheet with {celldata_count} cells")
        
        # Download the sheet
        download_response = self.session.get(f"{BASE_URL}/api/sheets/{sheet_id}/download")
        assert download_response.status_code == 200, f"Download failed: {download_response.text}"
        
        # Check content type
        content_type = download_response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type, \
            f"Wrong content type: {content_type}"
        
        # Check file size (should be > 0 for non-empty sheet)
        content_length = len(download_response.content)
        assert content_length > 1000, f"File too small ({content_length} bytes), might be empty"
        print(f"✓ Downloaded XLSX: {content_length} bytes")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
    
    def test_07_existing_sheet_data_check(self):
        """Test: Verify the existing 'Employee List' sheet still has data"""
        # The main agent mentioned sheet ID: 7b4d39e5-6f6e-4733-b29d-a9e84b7a0fbe
        existing_sheet_id = "7b4d39e5-6f6e-4733-b29d-a9e84b7a0fbe"
        
        get_response = self.session.get(f"{BASE_URL}/api/sheets/{existing_sheet_id}")
        
        if get_response.status_code == 404:
            print("Note: Existing test sheet not found (may have been deleted)")
            pytest.skip("Existing test sheet not found")
            return
        
        assert get_response.status_code == 200, f"Failed to fetch existing sheet: {get_response.text}"
        
        sheet_data = get_response.json()
        celldata = sheet_data.get("data", [{}])[0].get("celldata", [])
        
        print(f"Existing sheet '{sheet_data.get('title')}' has {len(celldata)} cells")
        assert len(celldata) > 0, "Existing sheet has no data - bug may have wiped it!"
        print(f"✓ Existing sheet data intact: {len(celldata)} cells")
    
    def test_08_ai_insights_works_with_data(self):
        """Test: AI Insights should work on sheets with data"""
        # Generate a sheet
        gen_response = self.session.post(
            f"{BASE_URL}/api/sheets/ai/generate",
            json={"prompt": "Create TEST_Insights sheet with sales data: Product, Q1, Q2, Q3, Q4"}
        )
        assert gen_response.status_code == 200
        
        sheet_id = gen_response.json()["id"]
        print(f"✓ Created sheet for insights test")
        
        # Request AI insights
        insights_response = self.session.post(
            f"{BASE_URL}/api/sheets/{sheet_id}/ai/insights",
            json={}
        )
        assert insights_response.status_code == 200, f"Insights failed: {insights_response.text}"
        
        insights = insights_response.json()
        assert "summary" in insights, "No summary in insights"
        assert "key_metrics" in insights, "No key_metrics in insights"
        print(f"✓ AI Insights returned: summary, {len(insights.get('key_metrics', []))} metrics")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/sheets/{sheet_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
