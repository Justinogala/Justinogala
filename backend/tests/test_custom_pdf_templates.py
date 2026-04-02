"""
Test Custom PDF Templates Feature
- Admin CRUD for custom PDF templates
- Template listing (builtin + custom merged)
- PDF generation from custom templates with field values
"""
import pytest
import requests
import os
import json
import fitz  # PyMuPDF

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Create a simple test PDF for upload
def create_test_pdf():
    """Create a simple test PDF file for upload testing."""
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text(fitz.Point(72, 72), "Test Template Document", fontsize=16)
    page.insert_text(fitz.Point(72, 100), "This is a branded template for testing.", fontsize=12)
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


class TestAdminPDFTemplatesCRUD:
    """Admin Custom PDF Templates CRUD Tests"""
    
    created_template_id = None
    
    def test_01_list_templates_empty_or_existing(self):
        """GET /api/admin/pdf-templates - List all custom templates"""
        response = requests.get(f"{BASE_URL}/api/admin/pdf-templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "templates" in data
        assert "count" in data
        assert isinstance(data["templates"], list)
        print(f"✓ List templates: {data['count']} existing templates")
    
    def test_02_create_template_with_pdf_upload(self):
        """POST /api/admin/pdf-templates - Create template with PDF upload"""
        pdf_bytes = create_test_pdf()
        
        files = {
            'file': ('test_template.pdf', pdf_bytes, 'application/pdf')
        }
        data = {
            'name': 'TEST_Custom Contract',
            'description': 'A test custom contract template',
            'category': 'Legal',
            'fields': json.dumps(['Client Name', 'Contract Date', 'Amount'])
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/pdf-templates", files=files, data=data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") is True
        assert "template" in result
        
        template = result["template"]
        assert template["name"] == "TEST_Custom Contract"
        assert template["description"] == "A test custom contract template"
        assert template["category"] == "Legal"
        assert template["fields"] == ['Client Name', 'Contract Date', 'Amount']
        assert template["is_active"] is True
        assert "id" in template
        assert template["page_count"] == 1
        
        TestAdminPDFTemplatesCRUD.created_template_id = template["id"]
        print(f"✓ Created template: {template['id']}")
    
    def test_03_get_single_template(self):
        """GET /api/admin/pdf-templates/{id} - Get single template"""
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        if not template_id:
            pytest.skip("No template created in previous test")
        
        response = requests.get(f"{BASE_URL}/api/admin/pdf-templates/{template_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "template" in data
        template = data["template"]
        assert template["id"] == template_id
        assert template["name"] == "TEST_Custom Contract"
        print(f"✓ Get single template: {template['name']}")
    
    def test_04_update_template_metadata(self):
        """PUT /api/admin/pdf-templates/{id} - Update template metadata"""
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        if not template_id:
            pytest.skip("No template created in previous test")
        
        update_data = {
            "name": "TEST_Updated Contract",
            "description": "Updated description",
            "category": "Business",
            "fields": ["Client Name", "Contract Date", "Amount", "Signature"]
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/pdf-templates/{template_id}",
            json=update_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") is True
        template = result["template"]
        assert template["name"] == "TEST_Updated Contract"
        assert template["description"] == "Updated description"
        assert template["category"] == "Business"
        assert len(template["fields"]) == 4
        print(f"✓ Updated template: {template['name']}")
    
    def test_05_toggle_template_inactive(self):
        """PUT /api/admin/pdf-templates/{id} - Toggle is_active to false"""
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        if not template_id:
            pytest.skip("No template created in previous test")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/pdf-templates/{template_id}",
            json={"is_active": False}
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["template"]["is_active"] is False
        print("✓ Template set to inactive")
    
    def test_06_inactive_template_not_in_user_list(self):
        """GET /api/pdf-editor/templates - Inactive templates should NOT appear"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        template_ids = [t["id"] for t in templates]
        
        assert template_id not in template_ids, "Inactive template should not appear in user template list"
        print("✓ Inactive template correctly hidden from user list")
    
    def test_07_toggle_template_active(self):
        """PUT /api/admin/pdf-templates/{id} - Toggle is_active back to true"""
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        if not template_id:
            pytest.skip("No template created in previous test")
        
        response = requests.put(
            f"{BASE_URL}/api/admin/pdf-templates/{template_id}",
            json={"is_active": True}
        )
        assert response.status_code == 200
        
        result = response.json()
        assert result["template"]["is_active"] is True
        print("✓ Template set back to active")
    
    def test_08_active_template_in_user_list(self):
        """GET /api/pdf-editor/templates - Active custom templates should appear"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        template_id = TestAdminPDFTemplatesCRUD.created_template_id
        custom_templates = [t for t in templates if t.get("source") == "custom"]
        custom_ids = [t["id"] for t in custom_templates]
        
        assert template_id in custom_ids, "Active custom template should appear in user list"
        
        # Verify custom template has correct structure
        our_template = next(t for t in templates if t["id"] == template_id)
        assert our_template["source"] == "custom"
        assert "fields" in our_template
        assert len(our_template["fields"]) > 0
        print(f"✓ Active custom template appears in user list with {len(our_template['fields'])} fields")
    
    def test_09_get_nonexistent_template_404(self):
        """GET /api/admin/pdf-templates/{id} - Non-existent template returns 404"""
        response = requests.get(f"{BASE_URL}/api/admin/pdf-templates/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Non-existent template returns 404")
    
    def test_10_update_nonexistent_template_404(self):
        """PUT /api/admin/pdf-templates/{id} - Non-existent template returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/admin/pdf-templates/nonexistent-id-12345",
            json={"name": "Test"}
        )
        assert response.status_code == 404
        print("✓ Update non-existent template returns 404")


class TestTemplateListingMerge:
    """Test that GET /api/pdf-editor/templates merges builtin + custom templates"""
    
    def test_01_templates_list_has_builtin(self):
        """GET /api/pdf-editor/templates - Should have 6 builtin templates"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        builtin = [t for t in templates if t.get("source") == "builtin"]
        assert len(builtin) == 6, f"Expected 6 builtin templates, got {len(builtin)}"
        
        builtin_ids = [t["id"] for t in builtin]
        expected_ids = ["nda", "employment_contract", "freelance_agreement", "invoice", "service_agreement", "lease_agreement"]
        for eid in expected_ids:
            assert eid in builtin_ids, f"Missing builtin template: {eid}"
        
        print(f"✓ Found all 6 builtin templates: {builtin_ids}")
    
    def test_02_templates_list_has_custom(self):
        """GET /api/pdf-editor/templates - Should include active custom templates"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        custom = [t for t in templates if t.get("source") == "custom"]
        print(f"✓ Found {len(custom)} custom templates in merged list")
        
        # Verify custom templates have required fields
        for tpl in custom:
            assert "id" in tpl
            assert "name" in tpl
            assert "fields" in tpl
            assert tpl["source"] == "custom"


class TestCustomTemplateGeneration:
    """Test PDF generation from custom templates with field values"""
    
    test_template_id = None
    generated_doc_id = None
    
    def test_01_create_template_for_generation(self):
        """Create a custom template for generation testing"""
        pdf_bytes = create_test_pdf()
        
        files = {
            'file': ('gen_test_template.pdf', pdf_bytes, 'application/pdf')
        }
        data = {
            'name': 'TEST_Generation Template',
            'description': 'Template for testing generation',
            'category': 'Testing',
            'fields': json.dumps(['Full Name', 'Email', 'Date'])
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/pdf-templates", files=files, data=data)
        assert response.status_code == 200
        
        result = response.json()
        TestCustomTemplateGeneration.test_template_id = result["template"]["id"]
        print(f"✓ Created template for generation: {result['template']['id']}")
    
    def test_02_generate_pdf_from_custom_template(self):
        """POST /api/pdf-editor/templates/{id}/generate - Generate PDF with field values"""
        template_id = TestCustomTemplateGeneration.test_template_id
        if not template_id:
            pytest.skip("No template created")
        
        payload = {
            "user_id": "test-user-123",
            "fields": {
                "Full Name": "John Doe",
                "Email": "john@example.com",
                "Date": "2026-01-15"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/{template_id}/generate",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get("success") is True
        assert "document" in result
        
        doc = result["document"]
        assert "id" in doc
        assert "filename" in doc
        assert doc["template_id"] == template_id
        assert "TEST_Generation_Template" in doc["template_name"] or "Generation" in doc["template_name"]
        
        TestCustomTemplateGeneration.generated_doc_id = doc["id"]
        print(f"✓ Generated PDF from custom template: {doc['filename']}")
    
    def test_03_stream_generated_pdf(self):
        """GET /api/pdf-editor/documents/{id}/pdf - Stream the generated PDF"""
        doc_id = TestCustomTemplateGeneration.generated_doc_id
        if not doc_id:
            pytest.skip("No document generated")
        
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}/pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        
        # Verify it's a valid PDF
        content = response.content
        assert content[:4] == b'%PDF', "Response should be a valid PDF"
        print(f"✓ Streamed generated PDF ({len(content)} bytes)")
    
    def test_04_verify_field_values_in_pdf(self):
        """Verify that field values are overlaid in the generated PDF"""
        doc_id = TestCustomTemplateGeneration.generated_doc_id
        if not doc_id:
            pytest.skip("No document generated")
        
        response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}/pdf")
        assert response.status_code == 200
        
        # Parse the PDF and check for text
        pdf_doc = fitz.open(stream=response.content, filetype="pdf")
        page = pdf_doc[0]
        text = page.get_text()
        pdf_doc.close()
        
        # The field values should be overlaid on the PDF
        assert "Full Name: John Doe" in text or "John Doe" in text, "Field value 'John Doe' should be in PDF"
        print("✓ Field values are overlaid in the generated PDF")
    
    def test_05_generate_without_user_id_fails(self):
        """POST /api/pdf-editor/templates/{id}/generate - Missing user_id returns 400"""
        template_id = TestCustomTemplateGeneration.test_template_id
        if not template_id:
            pytest.skip("No template created")
        
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/{template_id}/generate",
            json={"fields": {}}
        )
        assert response.status_code == 400
        print("✓ Generate without user_id returns 400")
    
    def test_06_generate_nonexistent_template_404(self):
        """POST /api/pdf-editor/templates/{id}/generate - Non-existent template returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nonexistent-template-xyz/generate",
            json={"user_id": "test-user", "fields": {}}
        )
        assert response.status_code == 404
        print("✓ Generate from non-existent template returns 404")
    
    def test_07_cleanup_test_template(self):
        """Delete the test template"""
        template_id = TestCustomTemplateGeneration.test_template_id
        if template_id:
            response = requests.delete(f"{BASE_URL}/api/admin/pdf-templates/{template_id}")
            assert response.status_code == 200
            print(f"✓ Cleaned up test template: {template_id}")


class TestAdminTemplateValidation:
    """Test validation for admin template creation"""
    
    def test_01_create_without_pdf_fails(self):
        """POST /api/admin/pdf-templates - Missing PDF file should fail"""
        data = {
            'name': 'No PDF Template',
            'description': 'This should fail',
            'category': 'Test',
            'fields': json.dumps([])
        }
        
        # Send without file
        response = requests.post(f"{BASE_URL}/api/admin/pdf-templates", data=data)
        assert response.status_code == 422, f"Expected 422 for missing file, got {response.status_code}"
        print("✓ Create without PDF file returns 422")
    
    def test_02_create_with_non_pdf_fails(self):
        """POST /api/admin/pdf-templates - Non-PDF file should fail"""
        files = {
            'file': ('test.txt', b'This is not a PDF', 'text/plain')
        }
        data = {
            'name': 'Text File Template',
            'description': 'This should fail',
            'category': 'Test',
            'fields': json.dumps([])
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/pdf-templates", files=files, data=data)
        assert response.status_code == 400, f"Expected 400 for non-PDF, got {response.status_code}"
        print("✓ Create with non-PDF file returns 400")
    
    def test_03_create_with_invalid_fields_json(self):
        """POST /api/admin/pdf-templates - Invalid fields JSON should fail"""
        pdf_bytes = create_test_pdf()
        
        files = {
            'file': ('test.pdf', pdf_bytes, 'application/pdf')
        }
        data = {
            'name': 'Invalid Fields Template',
            'description': 'This should fail',
            'category': 'Test',
            'fields': 'not valid json'
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/pdf-templates", files=files, data=data)
        assert response.status_code == 400, f"Expected 400 for invalid JSON, got {response.status_code}"
        print("✓ Create with invalid fields JSON returns 400")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_templates(self):
        """Delete all TEST_ prefixed templates"""
        response = requests.get(f"{BASE_URL}/api/admin/pdf-templates")
        if response.status_code != 200:
            pytest.skip("Could not list templates")
        
        templates = response.json().get("templates", [])
        test_templates = [t for t in templates if t["name"].startswith("TEST_")]
        
        for tpl in test_templates:
            del_response = requests.delete(f"{BASE_URL}/api/admin/pdf-templates/{tpl['id']}")
            if del_response.status_code == 200:
                print(f"  Deleted: {tpl['name']}")
        
        print(f"✓ Cleaned up {len(test_templates)} test templates")
