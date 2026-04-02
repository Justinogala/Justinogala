"""
PDF Templates API Tests
Tests for GET /api/pdf-editor/templates and POST /api/pdf-editor/templates/{id}/generate endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPDFTemplatesAPI:
    """Tests for PDF template listing and generation endpoints"""
    
    # Test user ID for template generation
    test_user_id = f"test_user_{uuid.uuid4().hex[:8]}"
    created_doc_ids = []
    
    def test_list_templates_returns_6_templates(self):
        """GET /api/pdf-editor/templates returns 6 templates"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        templates = data["templates"]
        assert len(templates) == 6, f"Expected 6 templates, got {len(templates)}"
    
    def test_templates_have_required_fields(self):
        """Each template has id, name, description, category, icon, fields"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        templates = response.json()["templates"]
        required_fields = ["id", "name", "description", "category", "icon", "fields"]
        
        for tpl in templates:
            for field in required_fields:
                assert field in tpl, f"Template {tpl.get('id', 'unknown')} missing field: {field}"
            assert isinstance(tpl["fields"], list), f"Template {tpl['id']} fields should be a list"
    
    def test_template_ids_are_correct(self):
        """Verify all 6 expected template IDs exist"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        templates = response.json()["templates"]
        template_ids = [t["id"] for t in templates]
        
        expected_ids = ["nda", "employment_contract", "freelance_agreement", "invoice", "service_agreement", "lease_agreement"]
        for expected_id in expected_ids:
            assert expected_id in template_ids, f"Missing template: {expected_id}"
    
    def test_generate_nda_template(self):
        """POST /api/pdf-editor/templates/nda/generate creates NDA PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nda/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "party_a": "Acme Corp",
                    "party_b": "Test Company",
                    "effective_date": "2026-01-15",
                    "confidential_info": "Trade secrets and business plans"
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "document" in data
        doc = data["document"]
        assert "id" in doc
        assert "filename" in doc
        assert "page_count" in doc
        assert doc["template_id"] == "nda"
        assert doc["template_name"] == "Non-Disclosure Agreement"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generate_employment_contract_template(self):
        """POST /api/pdf-editor/templates/employment_contract/generate creates Employment Contract PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/employment_contract/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "employer": "Tech Corp",
                    "employee": "John Doe",
                    "position": "Software Engineer",
                    "salary": "$120,000",
                    "start_date": "2026-02-01"
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        doc = data["document"]
        assert doc["template_id"] == "employment_contract"
        assert doc["template_name"] == "Employment Contract"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generate_freelance_agreement_template(self):
        """POST /api/pdf-editor/templates/freelance_agreement/generate creates Freelance Agreement PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/freelance_agreement/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "client": "Startup Inc",
                    "freelancer": "Jane Smith",
                    "project_scope": "Website redesign",
                    "payment_terms": "$5,000 upon completion",
                    "deadline": "2026-03-15"
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        doc = data["document"]
        assert doc["template_id"] == "freelance_agreement"
        assert doc["template_name"] == "Freelance Agreement"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generate_invoice_template(self):
        """POST /api/pdf-editor/templates/invoice/generate creates Invoice PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/invoice/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "company": "My Business LLC",
                    "client": "Customer Corp",
                    "invoice_number": "INV-2026-001",
                    "due_date": "2026-02-15",
                    "items": [
                        {"description": "Consulting Services", "qty": "10", "price": "$100", "amount": "$1,000"},
                        {"description": "Development Work", "qty": "20", "price": "$150", "amount": "$3,000"}
                    ]
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        doc = data["document"]
        assert doc["template_id"] == "invoice"
        assert doc["template_name"] == "Invoice"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generate_service_agreement_template(self):
        """POST /api/pdf-editor/templates/service_agreement/generate creates Service Agreement PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/service_agreement/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "provider": "Service Provider Inc",
                    "client": "Client Company",
                    "services": "IT Support and Maintenance",
                    "duration": "12 months",
                    "fees": "$2,000/month"
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        doc = data["document"]
        assert doc["template_id"] == "service_agreement"
        assert doc["template_name"] == "Service Agreement"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generate_lease_agreement_template(self):
        """POST /api/pdf-editor/templates/lease_agreement/generate creates Lease Agreement PDF"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/lease_agreement/generate",
            json={
                "user_id": self.test_user_id,
                "fields": {
                    "landlord": "Property Owner LLC",
                    "tenant": "Tenant Name",
                    "property_address": "123 Main St, City, State 12345",
                    "rent": "$2,500/month",
                    "lease_period": "January 1, 2026 to December 31, 2026"
                }
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        doc = data["document"]
        assert doc["template_id"] == "lease_agreement"
        assert doc["template_name"] == "Lease Agreement"
        
        self.created_doc_ids.append(doc["id"])
    
    def test_generated_pdf_can_be_streamed(self):
        """Generated template PDFs can be streamed via GET /api/pdf-editor/documents/{id}/pdf"""
        # First generate a template
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nda/generate",
            json={"user_id": self.test_user_id, "fields": {}}
        )
        assert response.status_code == 200
        doc_id = response.json()["document"]["id"]
        self.created_doc_ids.append(doc_id)
        
        # Now stream the PDF
        stream_response = requests.get(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}/pdf")
        assert stream_response.status_code == 200, f"Expected 200, got {stream_response.status_code}"
        assert stream_response.headers.get("content-type") == "application/pdf"
        
        # Verify it's a valid PDF (starts with %PDF)
        content = stream_response.content
        assert content[:4] == b'%PDF', "Response should be a valid PDF file"
    
    def test_generated_pdf_saved_in_user_documents(self):
        """Generated template PDFs are saved in user's document list"""
        # Generate a template
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/invoice/generate",
            json={"user_id": self.test_user_id, "fields": {"invoice_number": "TEST-VERIFY-001"}}
        )
        assert response.status_code == 200
        doc_id = response.json()["document"]["id"]
        self.created_doc_ids.append(doc_id)
        
        # Check user's document list
        list_response = requests.get(f"{BASE_URL}/api/pdf-editor/documents?user_id={self.test_user_id}")
        assert list_response.status_code == 200
        
        documents = list_response.json()["documents"]
        doc_ids = [d["id"] for d in documents]
        assert doc_id in doc_ids, "Generated document should appear in user's document list"
    
    def test_generate_nonexistent_template_returns_404(self):
        """POST /api/pdf-editor/templates/nonexistent/generate returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nonexistent/generate",
            json={"user_id": self.test_user_id, "fields": {}}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower()
    
    def test_generate_without_user_id_returns_400(self):
        """POST /api/pdf-editor/templates/{id}/generate without user_id returns 400"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nda/generate",
            json={"fields": {}}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"
    
    def test_generate_with_empty_fields_uses_placeholders(self):
        """Generate with empty fields uses placeholder values"""
        response = requests.post(
            f"{BASE_URL}/api/pdf-editor/templates/nda/generate",
            json={"user_id": self.test_user_id, "fields": {}}
        )
        assert response.status_code == 200
        
        doc = response.json()["document"]
        assert doc["page_count"] >= 1, "Generated PDF should have at least 1 page"
        self.created_doc_ids.append(doc["id"])
    
    @pytest.fixture(autouse=True, scope="class")
    def cleanup(self, request):
        """Cleanup test documents after all tests in class complete"""
        yield
        # Cleanup created documents
        for doc_id in TestPDFTemplatesAPI.created_doc_ids:
            try:
                requests.delete(f"{BASE_URL}/api/pdf-editor/documents/{doc_id}")
            except:
                pass


class TestTemplateCategories:
    """Test template categories and icons"""
    
    def test_template_categories(self):
        """Verify templates have correct categories"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        templates = {t["id"]: t for t in response.json()["templates"]}
        
        assert templates["nda"]["category"] == "Legal"
        assert templates["employment_contract"]["category"] == "HR"
        assert templates["freelance_agreement"]["category"] == "Business"
        assert templates["invoice"]["category"] == "Finance"
        assert templates["service_agreement"]["category"] == "Business"
        assert templates["lease_agreement"]["category"] == "Real Estate"
    
    def test_template_icons(self):
        """Verify templates have correct icons"""
        response = requests.get(f"{BASE_URL}/api/pdf-editor/templates")
        assert response.status_code == 200
        
        templates = {t["id"]: t for t in response.json()["templates"]}
        
        assert templates["nda"]["icon"] == "shield"
        assert templates["employment_contract"]["icon"] == "briefcase"
        assert templates["freelance_agreement"]["icon"] == "pen-tool"
        assert templates["invoice"]["icon"] == "receipt"
        assert templates["service_agreement"]["icon"] == "handshake"
        assert templates["lease_agreement"]["icon"] == "home"
