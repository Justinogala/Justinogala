"""
Smart Templates API Tests
Tests for GET /api/sheets/templates/list and POST /api/sheets/templates/create endpoints
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"

# Expected template IDs
EXPECTED_TEMPLATES = [
    "budget_planner",
    "project_tracker",
    "invoice",
    "sales_pipeline",
    "employee_directory",
    "weekly_schedule"
]


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for testing"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture
def api_client(auth_token):
    """Authenticated requests session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestTemplatesList:
    """Tests for GET /api/sheets/templates/list"""

    def test_01_list_templates_returns_6_templates(self, api_client):
        """Verify endpoint returns exactly 6 templates"""
        response = api_client.get(f"{BASE_URL}/api/sheets/templates/list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        templates = response.json()
        assert isinstance(templates, list), "Response should be a list"
        assert len(templates) == 6, f"Expected 6 templates, got {len(templates)}"

    def test_02_templates_have_required_fields(self, api_client):
        """Verify each template has id, title, description, icon, color"""
        response = api_client.get(f"{BASE_URL}/api/sheets/templates/list")
        assert response.status_code == 200
        
        templates = response.json()
        required_fields = ["id", "title", "description", "icon", "color"]
        
        for tpl in templates:
            for field in required_fields:
                assert field in tpl, f"Template missing field: {field}"
                assert tpl[field], f"Template field '{field}' is empty"

    def test_03_all_expected_template_ids_present(self, api_client):
        """Verify all 6 expected template IDs are present"""
        response = api_client.get(f"{BASE_URL}/api/sheets/templates/list")
        assert response.status_code == 200
        
        templates = response.json()
        template_ids = [t["id"] for t in templates]
        
        for expected_id in EXPECTED_TEMPLATES:
            assert expected_id in template_ids, f"Missing template: {expected_id}"

    def test_04_templates_have_valid_colors(self, api_client):
        """Verify template colors are valid hex colors"""
        response = api_client.get(f"{BASE_URL}/api/sheets/templates/list")
        assert response.status_code == 200
        
        templates = response.json()
        for tpl in templates:
            color = tpl.get("color", "")
            assert color.startswith("#"), f"Color should start with #: {color}"
            assert len(color) == 7, f"Color should be 7 chars (#RRGGBB): {color}"


class TestTemplateCreate:
    """Tests for POST /api/sheets/templates/create"""

    def test_05_create_budget_planner_template(self, api_client):
        """Create sheet from budget_planner template and verify celldata"""
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "budget_planner"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        sheet = response.json()
        assert "id" in sheet, "Response should have sheet id"
        assert sheet["title"] == "Monthly Budget Planner", f"Wrong title: {sheet['title']}"
        
        # Verify data structure
        assert "data" in sheet, "Sheet should have data"
        assert len(sheet["data"]) > 0, "Sheet data should not be empty"
        
        # Verify celldata has content
        sheet_data = sheet["data"][0]
        assert "celldata" in sheet_data, "Sheet should have celldata"
        celldata = sheet_data["celldata"]
        assert len(celldata) > 10, f"Budget planner should have many cells, got {len(celldata)}"
        
        # Verify formulas exist (budget planner has formulas)
        formulas = [c for c in celldata if c.get("v", {}).get("f")]
        assert len(formulas) > 0, "Budget planner should have formulas"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/sheets/{sheet['id']}")

    def test_06_create_invoice_template_has_formulas(self, api_client):
        """Create sheet from invoice template and verify it has formulas"""
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "invoice"}
        )
        assert response.status_code == 200
        
        sheet = response.json()
        assert sheet["title"] == "Invoice Template"
        
        celldata = sheet["data"][0]["celldata"]
        formulas = [c for c in celldata if c.get("v", {}).get("f")]
        
        # Invoice should have formulas for line items and totals
        assert len(formulas) >= 5, f"Invoice should have at least 5 formulas, got {len(formulas)}"
        
        # Check for specific formula patterns (multiplication and sum)
        formula_texts = [c["v"]["f"] for c in formulas]
        has_multiply = any("*" in f for f in formula_texts)
        has_sum = any("SUM" in f.upper() for f in formula_texts)
        
        assert has_multiply, "Invoice should have multiplication formulas"
        assert has_sum, "Invoice should have SUM formulas"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/sheets/{sheet['id']}")

    def test_07_create_project_tracker_template(self, api_client):
        """Create sheet from project_tracker template"""
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "project_tracker"}
        )
        assert response.status_code == 200
        
        sheet = response.json()
        assert sheet["title"] == "Project Task Tracker"
        
        celldata = sheet["data"][0]["celldata"]
        # Project tracker has headers + 10 task rows
        assert len(celldata) > 50, f"Project tracker should have many cells, got {len(celldata)}"
        
        # Verify headers exist (first row)
        headers = [c for c in celldata if c.get("r") == 0]
        assert len(headers) >= 5, "Should have multiple header columns"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/sheets/{sheet['id']}")

    def test_08_create_all_templates_successfully(self, api_client):
        """Create sheets from all 6 templates and verify each"""
        created_ids = []
        
        for template_id in EXPECTED_TEMPLATES:
            response = api_client.post(
                f"{BASE_URL}/api/sheets/templates/create",
                json={"template_id": template_id}
            )
            assert response.status_code == 200, f"Failed to create {template_id}: {response.text}"
            
            sheet = response.json()
            assert "id" in sheet
            assert "data" in sheet
            assert len(sheet["data"]) > 0
            assert "celldata" in sheet["data"][0]
            assert len(sheet["data"][0]["celldata"]) > 0, f"{template_id} has no celldata"
            
            created_ids.append(sheet["id"])
        
        # Cleanup all created sheets
        for sheet_id in created_ids:
            api_client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")

    def test_09_invalid_template_returns_404(self, api_client):
        """Verify invalid template_id returns 404"""
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "nonexistent_template"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestTemplatePersistence:
    """Tests for template sheet persistence (verify data not wiped by auto-save)"""

    def test_10_template_sheet_persists_after_10s(self, api_client):
        """Create template sheet, wait 10s, verify data still exists"""
        # Create from budget_planner template
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "budget_planner"}
        )
        assert response.status_code == 200
        
        sheet = response.json()
        sheet_id = sheet["id"]
        original_celldata_count = len(sheet["data"][0]["celldata"])
        
        # Wait 10 seconds (longer than auto-save interval)
        print(f"Waiting 10s to verify persistence... (original celldata count: {original_celldata_count})")
        time.sleep(10)
        
        # Fetch sheet again
        get_response = api_client.get(f"{BASE_URL}/api/sheets/{sheet_id}")
        assert get_response.status_code == 200
        
        fetched_sheet = get_response.json()
        
        # Verify data still exists
        assert "data" in fetched_sheet
        assert len(fetched_sheet["data"]) > 0
        
        # Check celldata or data array has content
        sheet_data = fetched_sheet["data"][0]
        has_celldata = "celldata" in sheet_data and len(sheet_data.get("celldata", [])) > 0
        has_data_array = "data" in sheet_data and isinstance(sheet_data.get("data"), list) and len(sheet_data.get("data", [])) > 0
        
        assert has_celldata or has_data_array, "Sheet data was wiped after 10s!"
        
        if has_celldata:
            current_count = len(sheet_data["celldata"])
            print(f"After 10s: celldata count = {current_count}")
            assert current_count >= original_celldata_count * 0.9, f"Celldata count dropped significantly: {current_count} vs {original_celldata_count}"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")


class TestTemplateDownload:
    """Tests for downloading template-created sheets as XLSX"""

    def test_11_download_template_sheet_as_xlsx(self, api_client):
        """Create template sheet and download as XLSX"""
        # Create from invoice template
        response = api_client.post(
            f"{BASE_URL}/api/sheets/templates/create",
            json={"template_id": "invoice"}
        )
        assert response.status_code == 200
        
        sheet = response.json()
        sheet_id = sheet["id"]
        
        # Download as XLSX
        download_response = api_client.get(f"{BASE_URL}/api/sheets/{sheet_id}/download")
        assert download_response.status_code == 200, f"Download failed: {download_response.status_code}"
        
        # Verify content type
        content_type = download_response.headers.get("Content-Type", "")
        assert "spreadsheet" in content_type or "octet-stream" in content_type, f"Wrong content type: {content_type}"
        
        # Verify content disposition
        disposition = download_response.headers.get("Content-Disposition", "")
        assert "attachment" in disposition, "Should be attachment"
        assert ".xlsx" in disposition, "Should be .xlsx file"
        
        # Verify file is not empty
        content = download_response.content
        assert len(content) > 1000, f"XLSX file too small: {len(content)} bytes"
        
        # Verify it's a valid ZIP (XLSX is a ZIP file)
        assert content[:4] == b'PK\x03\x04', "XLSX should start with ZIP magic bytes"
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
