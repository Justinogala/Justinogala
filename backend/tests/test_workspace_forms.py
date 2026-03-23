"""
Workspace Forms Module - Templates & Submissions API Tests
Tests for form templates CRUD and form submissions CRUD
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
ADMIN_EMAIL = "admin@munal.com"
ADMIN_NAME = "Admin User"
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"


class TestFormTemplates:
    """Form Templates CRUD tests"""
    
    def test_get_form_templates_returns_list_with_is_admin(self):
        """GET /api/workspaces/{id}/form-templates - Returns templates list with is_admin flag"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        assert "is_admin" in data, "Response should contain 'is_admin' key"
        assert isinstance(data["templates"], list), "templates should be a list"
        assert isinstance(data["is_admin"], bool), "is_admin should be boolean"
        print(f"Found {len(data['templates'])} templates, is_admin={data['is_admin']}")
    
    def test_maintenance_form_auto_seeded(self):
        """GET /api/workspaces/{id}/form-templates - Auto-seeds Maintenance Request Form on first access"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Find Maintenance Request Form
        maintenance_form = next((t for t in templates if t.get("name") == "Maintenance Request Form"), None)
        assert maintenance_form is not None, "Maintenance Request Form should be auto-seeded"
        
        # Verify it has the expected fields
        fields = maintenance_form.get("fields", [])
        field_ids = [f.get("id") for f in fields]
        expected_fields = ["date_submitted", "staff_name", "repair_location", "behavior_concern", "priority_level", "repair_description"]
        for field_id in expected_fields:
            assert field_id in field_ids, f"Field '{field_id}' should exist in Maintenance Request Form"
        
        print(f"Maintenance Request Form has {len(fields)} fields: {field_ids}")
    
    def test_create_form_template_admin(self):
        """POST /api/workspaces/{id}/form-templates - Admin can create new template"""
        template_data = {
            "name": f"TEST_Template_{uuid.uuid4().hex[:8]}",
            "description": "Test template for automated testing",
            "fields": [
                {"id": "test_field_1", "label": "Test Text Field", "type": "text", "required": True, "placeholder": "Enter text", "options": [], "description": ""},
                {"id": "test_field_2", "label": "Test Dropdown", "type": "dropdown", "required": False, "placeholder": "Select", "options": ["Option A", "Option B"], "description": ""}
            ],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": ADMIN_NAME
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            json=template_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True, "Response should indicate success"
        assert "template" in data, "Response should contain created template"
        
        template = data["template"]
        assert template["name"] == template_data["name"]
        assert len(template["fields"]) == 2
        assert "id" in template, "Template should have an ID"
        
        # Store for cleanup
        self.__class__.created_template_id = template["id"]
        print(f"Created template: {template['id']}")
        return template["id"]
    
    def test_update_form_template_admin(self):
        """PUT /api/workspaces/{id}/form-templates/{id} - Admin can update template"""
        # First create a template to update
        template_data = {
            "name": f"TEST_UpdateTemplate_{uuid.uuid4().hex[:8]}",
            "description": "Original description",
            "fields": [{"id": "field_1", "label": "Original Field", "type": "text", "required": False, "placeholder": "", "options": [], "description": ""}],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": ADMIN_NAME
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            json=template_data
        )
        assert create_response.status_code == 200
        template_id = create_response.json()["template"]["id"]
        
        # Update the template
        update_data = {
            "name": "TEST_UpdatedName",
            "description": "Updated description",
            "fields": [
                {"id": "field_1", "label": "Updated Field", "type": "textarea", "required": True, "placeholder": "Updated", "options": [], "description": "Updated desc"}
            ]
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{template_id}",
            params={"user_id": ADMIN_USER_ID},
            json=update_data
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert data.get("success") is True
        assert data["template"]["name"] == "TEST_UpdatedName"
        assert data["template"]["description"] == "Updated description"
        
        # Verify with GET
        get_response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        templates = get_response.json().get("templates", [])
        updated_template = next((t for t in templates if t["id"] == template_id), None)
        assert updated_template is not None
        assert updated_template["name"] == "TEST_UpdatedName"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{template_id}",
            params={"user_id": ADMIN_USER_ID}
        )
        print(f"Updated and verified template: {template_id}")
    
    def test_delete_form_template_admin(self):
        """DELETE /api/workspaces/{id}/form-templates/{id} - Admin can delete template and its submissions"""
        # Create a template
        template_data = {
            "name": f"TEST_DeleteTemplate_{uuid.uuid4().hex[:8]}",
            "description": "To be deleted",
            "fields": [{"id": "field_1", "label": "Field", "type": "text", "required": False, "placeholder": "", "options": [], "description": ""}],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": ADMIN_NAME
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            json=template_data
        )
        assert create_response.status_code == 200
        template_id = create_response.json()["template"]["id"]
        
        # Create a submission for this template
        submission_data = {
            "template_id": template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {"field_1": "Test value"}
        }
        requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        
        # Delete the template
        delete_response = requests.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{template_id}",
            params={"user_id": ADMIN_USER_ID}
        )
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        assert delete_response.json().get("success") is True
        
        # Verify template is deleted
        get_response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        templates = get_response.json().get("templates", [])
        deleted_template = next((t for t in templates if t["id"] == template_id), None)
        assert deleted_template is None, "Template should be deleted"
        
        print(f"Deleted template and its submissions: {template_id}")


class TestFormSubmissions:
    """Form Submissions CRUD tests"""
    
    @pytest.fixture(autouse=True)
    def setup_template(self):
        """Create a test template for submission tests"""
        template_data = {
            "name": f"TEST_SubmissionTemplate_{uuid.uuid4().hex[:8]}",
            "description": "Template for submission tests",
            "fields": [
                {"id": "text_field", "label": "Text Field", "type": "text", "required": True, "placeholder": "", "options": [], "description": ""},
                {"id": "date_field", "label": "Date Field", "type": "date", "required": False, "placeholder": "", "options": [], "description": ""},
                {"id": "yesno_field", "label": "Yes/No Field", "type": "yesno", "required": False, "placeholder": "", "options": ["Yes", "No"], "description": ""},
                {"id": "dropdown_field", "label": "Dropdown Field", "type": "dropdown", "required": False, "placeholder": "", "options": ["Low", "Medium", "High"], "description": ""}
            ],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": ADMIN_NAME
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            json=template_data
        )
        if response.status_code == 200:
            self.template_id = response.json()["template"]["id"]
        else:
            # Use existing Maintenance Request Form
            get_response = requests.get(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
                params={"user_id": ADMIN_USER_ID}
            )
            templates = get_response.json().get("templates", [])
            maintenance_form = next((t for t in templates if t.get("name") == "Maintenance Request Form"), None)
            self.template_id = maintenance_form["id"] if maintenance_form else None
        
        yield
        
        # Cleanup - delete test template if created
        if hasattr(self, 'template_id') and self.template_id and "TEST_" in str(self.template_id):
            requests.delete(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{self.template_id}",
                params={"user_id": ADMIN_USER_ID}
            )
    
    def test_submit_form(self):
        """POST /api/workspaces/{id}/form-submissions - Submit a filled form with responses dict"""
        submission_data = {
            "template_id": self.template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {
                "text_field": "Test submission value",
                "date_field": "2026-01-15",
                "yesno_field": "Yes",
                "dropdown_field": "High"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "submission" in data
        
        submission = data["submission"]
        assert submission["template_id"] == self.template_id
        assert submission["submitted_by_id"] == ADMIN_USER_ID
        assert submission["submitted_by_name"] == ADMIN_NAME
        assert submission["submitted_by_email"] == ADMIN_EMAIL
        assert "responses" in submission
        assert submission["responses"]["text_field"] == "Test submission value"
        assert "id" in submission
        assert "submitted_at" in submission
        
        self.__class__.created_submission_id = submission["id"]
        print(f"Created submission: {submission['id']}")
    
    def test_get_form_submissions_admin_sees_all(self):
        """GET /api/workspaces/{id}/form-submissions - Admin sees all submissions"""
        # First create a submission
        submission_data = {
            "template_id": self.template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {"text_field": "Admin test submission"}
        }
        requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        
        # Get all submissions
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submissions" in data
        assert "is_admin" in data
        assert data["is_admin"] is True, "Admin user should have is_admin=True"
        assert isinstance(data["submissions"], list)
        
        print(f"Admin sees {len(data['submissions'])} submissions")
    
    def test_get_form_submissions_filter_by_template(self):
        """GET /api/workspaces/{id}/form-submissions - Filter by template_id"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            params={"user_id": ADMIN_USER_ID, "template_id": self.template_id}
        )
        assert response.status_code == 200
        
        data = response.json()
        submissions = data.get("submissions", [])
        
        # All returned submissions should be for the specified template
        for sub in submissions:
            assert sub["template_id"] == self.template_id, f"Submission {sub['id']} has wrong template_id"
        
        print(f"Filtered submissions for template {self.template_id}: {len(submissions)}")
    
    def test_get_single_submission_detail(self):
        """GET /api/workspaces/{id}/form-submissions/{id} - Get single submission detail"""
        # First create a submission
        submission_data = {
            "template_id": self.template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {"text_field": "Detail test submission"}
        }
        create_response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        submission_id = create_response.json()["submission"]["id"]
        
        # Get single submission
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions/{submission_id}",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == submission_id
        assert data["submitted_by_name"] == ADMIN_NAME
        assert data["submitted_by_email"] == ADMIN_EMAIL
        assert "responses" in data
        assert data["responses"]["text_field"] == "Detail test submission"
        
        print(f"Retrieved submission detail: {submission_id}")
    
    def test_non_member_cannot_submit(self):
        """POST /api/workspaces/{id}/form-submissions - Non-member cannot submit"""
        fake_user_id = str(uuid.uuid4())
        submission_data = {
            "template_id": self.template_id,
            "submitted_by_id": fake_user_id,
            "submitted_by_name": "Fake User",
            "submitted_by_email": "fake@example.com",
            "responses": {"text_field": "Should fail"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert response.status_code == 403, f"Expected 403 for non-member, got {response.status_code}"
        print("Non-member correctly denied submission")


class TestFormFieldTypes:
    """Test all supported field types in form templates"""
    
    def test_all_field_types_in_template(self):
        """Verify all 6 field types are supported: text, textarea, date, number, yesno, dropdown"""
        template_data = {
            "name": f"TEST_AllFieldTypes_{uuid.uuid4().hex[:8]}",
            "description": "Template with all field types",
            "fields": [
                {"id": "f_text", "label": "Text Input", "type": "text", "required": True, "placeholder": "Enter text", "options": [], "description": "Text field"},
                {"id": "f_textarea", "label": "Text Area", "type": "textarea", "required": False, "placeholder": "Enter long text", "options": [], "description": "Textarea field"},
                {"id": "f_date", "label": "Date", "type": "date", "required": True, "placeholder": "M/d/yyyy", "options": [], "description": "Date field"},
                {"id": "f_number", "label": "Number", "type": "number", "required": False, "placeholder": "0", "options": [], "description": "Number field"},
                {"id": "f_yesno", "label": "Yes/No", "type": "yesno", "required": True, "placeholder": "", "options": ["Yes", "No"], "description": "Yes/No field"},
                {"id": "f_dropdown", "label": "Dropdown", "type": "dropdown", "required": False, "placeholder": "Select", "options": ["Option 1", "Option 2", "Option 3"], "description": "Dropdown field"}
            ],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": ADMIN_NAME
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            json=template_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        template = response.json()["template"]
        template_id = template["id"]
        
        # Verify all field types are saved
        fields = template["fields"]
        field_types = [f["type"] for f in fields]
        expected_types = ["text", "textarea", "date", "number", "yesno", "dropdown"]
        for ft in expected_types:
            assert ft in field_types, f"Field type '{ft}' should be in template"
        
        # Submit a form with all field types
        submission_data = {
            "template_id": template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {
                "f_text": "Sample text",
                "f_textarea": "This is a longer text\nwith multiple lines",
                "f_date": "2026-01-20",
                "f_number": "42",
                "f_yesno": "Yes",
                "f_dropdown": "Option 2"
            }
        }
        
        sub_response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert sub_response.status_code == 200
        
        submission = sub_response.json()["submission"]
        assert submission["responses"]["f_text"] == "Sample text"
        assert submission["responses"]["f_number"] == "42"
        assert submission["responses"]["f_yesno"] == "Yes"
        assert submission["responses"]["f_dropdown"] == "Option 2"
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{template_id}",
            params={"user_id": ADMIN_USER_ID}
        )
        
        print("All 6 field types work correctly")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_templates(self):
        """Remove all TEST_ prefixed templates"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        if response.status_code == 200:
            templates = response.json().get("templates", [])
            for tpl in templates:
                if tpl.get("name", "").startswith("TEST_"):
                    requests.delete(
                        f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates/{tpl['id']}",
                        params={"user_id": ADMIN_USER_ID}
                    )
                    print(f"Cleaned up template: {tpl['name']}")
        print("Cleanup complete")
