"""
Test Suite for Sheets Phase 3 API - Download XLSX and AI Insights
Tests the new features:
- GET /api/sheets/{sheet_id}/download - Download sheet as XLSX
- POST /api/sheets/{sheet_id}/ai/insights - AI-generated insights with charts
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"


class TestSheetsPhase3:
    """Phase 3 Sheets API tests - Download and AI Insights"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for org admin"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        return data.get("token")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def existing_sheet_id(self, auth_headers):
        """Get an existing sheet ID for testing"""
        response = requests.get(f"{BASE_URL}/api/sheets", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list sheets: {response.text}"
        sheets = response.json()
        assert len(sheets) > 0, "No existing sheets found for testing"
        return sheets[0]["id"]
    
    # ── Download XLSX Tests ──
    
    def test_01_download_sheet_success(self, auth_headers, existing_sheet_id):
        """Test downloading a sheet as XLSX returns valid file"""
        response = requests.get(
            f"{BASE_URL}/api/sheets/{existing_sheet_id}/download",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Download failed: {response.status_code} - {response.text}"
        
        # Check content type is XLSX
        content_type = response.headers.get("Content-Type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type, \
            f"Expected XLSX content type, got: {content_type}"
        
        # Check Content-Disposition header has filename
        disposition = response.headers.get("Content-Disposition", "")
        assert "attachment" in disposition, f"Expected attachment disposition, got: {disposition}"
        assert ".xlsx" in disposition, f"Expected .xlsx filename in disposition: {disposition}"
        
        # Check content is not empty
        assert len(response.content) > 0, "Downloaded file is empty"
        
        # Verify it's a valid XLSX (starts with PK - ZIP signature)
        assert response.content[:2] == b'PK', "Downloaded file is not a valid XLSX (ZIP) file"
        
        print(f"✓ Download successful: {len(response.content)} bytes, disposition: {disposition}")
    
    def test_02_download_sheet_not_found(self, auth_headers):
        """Test downloading non-existent sheet returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/sheets/nonexistent-sheet-id-12345/download",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("✓ Non-existent sheet returns 404")
    
    def test_03_download_sheet_unauthorized(self, existing_sheet_id):
        """Test downloading without auth returns 401/403"""
        response = requests.get(f"{BASE_URL}/api/sheets/{existing_sheet_id}/download")
        assert response.status_code in [401, 403], f"Expected 401/403, got: {response.status_code}"
        print("✓ Unauthorized download blocked")
    
    # ── AI Insights Tests ──
    
    def test_04_ai_insights_success(self, auth_headers, existing_sheet_id):
        """Test AI insights endpoint returns valid insights structure"""
        response = requests.post(
            f"{BASE_URL}/api/sheets/{existing_sheet_id}/ai/insights",
            headers=auth_headers,
            json={},
            timeout=60  # AI calls can take time
        )
        
        assert response.status_code == 200, f"AI insights failed: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "summary" in data, "Response missing 'summary' field"
        assert isinstance(data["summary"], str), "Summary should be a string"
        
        # Check key_metrics if present
        if "key_metrics" in data:
            assert isinstance(data["key_metrics"], list), "key_metrics should be a list"
            for metric in data["key_metrics"]:
                assert "label" in metric, "Metric missing 'label'"
                assert "value" in metric, "Metric missing 'value'"
        
        # Check insights if present
        if "insights" in data:
            assert isinstance(data["insights"], list), "insights should be a list"
            for insight in data["insights"]:
                assert "title" in insight, "Insight missing 'title'"
                assert "description" in insight, "Insight missing 'description'"
        
        # Check charts if present
        if "charts" in data:
            assert isinstance(data["charts"], list), "charts should be a list"
            for chart in data["charts"]:
                assert "title" in chart, "Chart missing 'title'"
                assert "type" in chart, "Chart missing 'type'"
                assert chart["type"] in ["bar", "line", "pie"], f"Invalid chart type: {chart['type']}"
                assert "data" in chart, "Chart missing 'data'"
        
        print(f"✓ AI Insights returned: summary={len(data.get('summary', ''))} chars, "
              f"metrics={len(data.get('key_metrics', []))}, "
              f"insights={len(data.get('insights', []))}, "
              f"charts={len(data.get('charts', []))}")
    
    def test_05_ai_insights_with_summary(self, auth_headers, existing_sheet_id):
        """Test AI insights with custom sheet_data_summary"""
        response = requests.post(
            f"{BASE_URL}/api/sheets/{existing_sheet_id}/ai/insights",
            headers=auth_headers,
            json={
                "sheet_data_summary": "HEADER: Month | Revenue | Expenses\nRow 1: Jan | 5000 | 3000\nRow 2: Feb | 6000 | 3500\nRow 3: Mar | 7500 | 4000"
            },
            timeout=60
        )
        
        assert response.status_code == 200, f"AI insights with summary failed: {response.status_code}"
        data = response.json()
        assert "summary" in data, "Response missing summary"
        print(f"✓ AI Insights with custom summary: {data.get('summary', '')[:100]}...")
    
    def test_06_ai_insights_not_found(self, auth_headers):
        """Test AI insights on non-existent sheet returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/sheets/nonexistent-sheet-id-12345/ai/insights",
            headers=auth_headers,
            json={},
            timeout=30
        )
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("✓ Non-existent sheet returns 404 for insights")
    
    def test_07_ai_insights_unauthorized(self, existing_sheet_id):
        """Test AI insights without auth returns 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/sheets/{existing_sheet_id}/ai/insights",
            json={}
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got: {response.status_code}"
        print("✓ Unauthorized insights request blocked")
    
    # ── Verify Existing Endpoints Still Work ──
    
    def test_08_list_sheets_still_works(self, auth_headers):
        """Verify GET /api/sheets still works (regression check)"""
        response = requests.get(f"{BASE_URL}/api/sheets", headers=auth_headers)
        assert response.status_code == 200, f"List sheets failed: {response.status_code}"
        sheets = response.json()
        assert isinstance(sheets, list), "Expected list of sheets"
        print(f"✓ List sheets works: {len(sheets)} sheets found")
    
    def test_09_get_sheet_still_works(self, auth_headers, existing_sheet_id):
        """Verify GET /api/sheets/{id} still works (regression check)"""
        response = requests.get(
            f"{BASE_URL}/api/sheets/{existing_sheet_id}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get sheet failed: {response.status_code}"
        sheet = response.json()
        assert "id" in sheet, "Sheet missing 'id'"
        assert "title" in sheet, "Sheet missing 'title'"
        assert "data" in sheet, "Sheet missing 'data'"
        print(f"✓ Get sheet works: {sheet.get('title')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
