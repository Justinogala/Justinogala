"""
Admin Forms API Tests - Tests for admin-level form template management
Covers: GET/POST/PUT/DELETE /api/admin/form-templates, GET/DELETE /api/admin/form-submissions, GET /api/admin/workspaces-list
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"


class TestAdminFormTemplatesEndpoints:
    """Tests for admin form template CRUD operations"""
    
    def test_get_all_templates(self):
        """GET /api/admin/form-templates - Returns all templates across workspaces with workspace_name"""
        response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates' key"
        assert isinstance(data["templates"], list), "Templates should be a list"
        
        # Check that templates have workspace_name enriched
        if len(data["templates"]) > 0:
            template = data["templates"][0]
            assert "workspace_name" in template, "Template should have workspace_name field"
            assert "id" in template, "Template should have id"
            assert "name" in template, "Template should have name"
            assert "fields" in template, "Template should have fields"
            print(f"Found {len(data['templates'])} templates")
            print(f"First template: {template.get('name')} in workspace: {template.get('workspace_name')}")
    
    def test_get_workspaces_list(self):
        """GET /api/admin/workspaces-list - Returns workspaces for dropdown selection"""
        response = requests.get(f"{BASE_URL}/api/admin/workspaces-list")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "workspaces" in data, "Response should contain 'workspaces' key"
        assert isinstance(data["workspaces"], list), "Workspaces should be a list"
        
        if len(data["workspaces"]) > 0:
            ws = data["workspaces"][0]
            assert "id" in ws, "Workspace should have id"
            assert "name" in ws, "Workspace should have name"
            print(f"Found {len(data['workspaces'])} workspaces")
    
    def test_create_template_with_recipient_emails(self):
        """POST /api/admin/form-templates?workspace_id=X - Create template with recipient_emails"""
        unique_name = f"TEST_Admin_Form_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": unique_name,
            "description": "Test form created by admin",
            "fields": [
                {
                    "id": "test_field_1",
                    "label": "Test Text Field",
                    "type": "text",
                    "required": True,
                    "placeholder": "Enter text",
                    "options": [],
                    "description": "A test field"
                },
                {
                    "id": "test_field_2",
                    "label": "Test Dropdown",
                    "type": "dropdown",
                    "required": False,
                    "placeholder": "Select option",
                    "options": ["Option A", "Option B", "Option C"],
                    "description": ""
                }
            ],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": "Admin User",
            "recipient_emails": ["admin@munal.com", "test@example.com"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/form-templates?workspace_id={WORKSPACE_ID}",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "template" in data, "Response should contain template"
        
        template = data["template"]
        assert template["name"] == unique_name, "Template name should match"
        assert template["workspace_id"] == WORKSPACE_ID, "Workspace ID should match"
        assert "recipient_emails" in template, "Template should have recipient_emails"
        assert "admin@munal.com" in template["recipient_emails"], "Recipient emails should include admin@munal.com"
        assert len(template["fields"]) == 2, "Template should have 2 fields"
        
        print(f"Created template: {template['id']} with recipients: {template['recipient_emails']}")
        
        # Store for cleanup
        self.__class__.created_template_id = template["id"]
        return template["id"]
    
    def test_update_template_with_recipient_emails(self):
        """PUT /api/admin/form-templates/{id} - Update template including recipient_emails"""
        # First create a template to update
        unique_name = f"TEST_Update_Form_{uuid.uuid4().hex[:8]}"
        create_payload = {
            "name": unique_name,
            "description": "Original description",
            "fields": [{"id": "f1", "label": "Field 1", "type": "text", "required": False, "placeholder": "", "options": [], "description": ""}],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": "Admin",
            "recipient_emails": ["original@test.com"]
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/admin/form-templates?workspace_id={WORKSPACE_ID}",
            json=create_payload
        )
        assert create_res.status_code == 200, f"Create failed: {create_res.text}"
        template_id = create_res.json()["template"]["id"]
        
        # Now update it
        update_payload = {
            "name": f"{unique_name}_Updated",
            "description": "Updated description",
            "recipient_emails": ["updated@test.com", "another@test.com"],
            "is_active": True
        }
        
        response = requests.put(
            f"{BASE_URL}/api/admin/form-templates/{template_id}",
            json=update_payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        template = data["template"]
        assert template["name"] == f"{unique_name}_Updated", "Name should be updated"
        assert template["description"] == "Updated description", "Description should be updated"
        assert "updated@test.com" in template["recipient_emails"], "Recipient emails should be updated"
        assert len(template["recipient_emails"]) == 2, "Should have 2 recipient emails"
        
        print(f"Updated template: {template_id}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/form-templates/{template_id}")
    
    def test_update_nonexistent_template_returns_404(self):
        """PUT /api/admin/form-templates/{id} - Returns 404 for non-existent template"""
        fake_id = str(uuid.uuid4())
        response = requests.put(
            f"{BASE_URL}/api/admin/form-templates/{fake_id}",
            json={"name": "Test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
    
    def test_delete_template_and_submissions(self):
        """DELETE /api/admin/form-templates/{id} - Delete template and its submissions"""
        # Create a template first
        unique_name = f"TEST_Delete_Form_{uuid.uuid4().hex[:8]}"
        create_payload = {
            "name": unique_name,
            "description": "To be deleted",
            "fields": [{"id": "f1", "label": "Field", "type": "text", "required": False, "placeholder": "", "options": [], "description": ""}],
            "created_by_id": ADMIN_USER_ID,
            "created_by_name": "Admin",
            "recipient_emails": []
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/admin/form-templates?workspace_id={WORKSPACE_ID}",
            json=create_payload
        )
        assert create_res.status_code == 200
        template_id = create_res.json()["template"]["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/admin/form-templates/{template_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        
        # Verify it's gone
        get_res = requests.get(f"{BASE_URL}/api/admin/form-templates")
        templates = get_res.json().get("templates", [])
        template_ids = [t["id"] for t in templates]
        assert template_id not in template_ids, "Deleted template should not appear in list"
        
        print(f"Deleted template: {template_id}")
    
    def test_delete_nonexistent_template_returns_404(self):
        """DELETE /api/admin/form-templates/{id} - Returns 404 for non-existent template"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/admin/form-templates/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestAdminFormSubmissionsEndpoints:
    """Tests for admin form submissions endpoints"""
    
    def test_get_all_submissions(self):
        """GET /api/admin/form-submissions - Get all submissions across workspaces"""
        response = requests.get(f"{BASE_URL}/api/admin/form-submissions")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submissions" in data, "Response should contain 'submissions' key"
        assert isinstance(data["submissions"], list), "Submissions should be a list"
        
        print(f"Found {len(data['submissions'])} submissions across all workspaces")
        
        if len(data["submissions"]) > 0:
            sub = data["submissions"][0]
            assert "id" in sub, "Submission should have id"
            assert "template_id" in sub, "Submission should have template_id"
            assert "submitted_by_name" in sub, "Submission should have submitted_by_name"
            assert "responses" in sub, "Submission should have responses"
    
    def test_get_submissions_filtered_by_template(self):
        """GET /api/admin/form-submissions?template_id=X - Filter submissions by template"""
        # First get templates to find one with submissions
        templates_res = requests.get(f"{BASE_URL}/api/admin/form-templates")
        templates = templates_res.json().get("templates", [])
        
        if len(templates) > 0:
            template_id = templates[0]["id"]
            response = requests.get(f"{BASE_URL}/api/admin/form-submissions?template_id={template_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            assert "submissions" in data
            
            # All returned submissions should be for this template
            for sub in data["submissions"]:
                assert sub["template_id"] == template_id, "All submissions should be for the filtered template"
            
            print(f"Found {len(data['submissions'])} submissions for template {template_id}")
    
    def test_delete_submission(self):
        """DELETE /api/admin/form-submissions/{id} - Delete any submission"""
        # First, we need to create a submission to delete
        # Get a template first
        templates_res = requests.get(f"{BASE_URL}/api/admin/form-templates")
        templates = templates_res.json().get("templates", [])
        
        if len(templates) == 0:
            pytest.skip("No templates available to create submission")
        
        template = templates[0]
        
        # Create a submission via workspace endpoint
        submission_payload = {
            "template_id": template["id"],
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Test Admin",
            "submitted_by_email": "admin@munal.com",
            "responses": {"test_field": "test_value"}
        }
        
        create_res = requests.post(
            f"{BASE_URL}/api/workspaces/{template['workspace_id']}/form-submissions",
            json=submission_payload
        )
        
        if create_res.status_code != 200:
            pytest.skip(f"Could not create test submission: {create_res.text}")
        
        submission_id = create_res.json()["submission"]["id"]
        
        # Now delete via admin endpoint
        response = requests.delete(f"{BASE_URL}/api/admin/form-submissions/{submission_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        
        print(f"Deleted submission: {submission_id}")
    
    def test_delete_nonexistent_submission_returns_404(self):
        """DELETE /api/admin/form-submissions/{id} - Returns 404 for non-existent submission"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/admin/form-submissions/{fake_id}")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestWorkspaceFormsUserAccess:
    """Tests for workspace-level forms (user access - fill and view only)"""
    
    def test_user_can_get_templates(self):
        """GET /api/workspaces/{id}/form-templates - User can view templates"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates?user_id={ADMIN_USER_ID}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "templates" in data
        assert "is_admin" in data, "Response should include is_admin flag"
        
        print(f"User can view {len(data['templates'])} templates, is_admin: {data['is_admin']}")
    
    def test_user_can_submit_form(self):
        """POST /api/workspaces/{id}/form-submissions - User can submit a form"""
        # Get a template first
        templates_res = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates?user_id={ADMIN_USER_ID}"
        )
        templates = templates_res.json().get("templates", [])
        
        if len(templates) == 0:
            pytest.skip("No templates available")
        
        template = templates[0]
        
        # Build responses based on template fields
        responses = {}
        for field in template.get("fields", []):
            if field["type"] == "text":
                responses[field["id"]] = "Test response"
            elif field["type"] == "textarea":
                responses[field["id"]] = "Test textarea response"
            elif field["type"] == "date":
                responses[field["id"]] = "2026-01-15"
            elif field["type"] == "number":
                responses[field["id"]] = "42"
            elif field["type"] == "yesno":
                responses[field["id"]] = "Yes"
            elif field["type"] == "dropdown":
                options = field.get("options", [])
                responses[field["id"]] = options[0] if options else "Option 1"
        
        submission_payload = {
            "template_id": template["id"],
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Test User",
            "submitted_by_email": "testuser@munal.com",
            "responses": responses
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "submission" in data
        
        submission = data["submission"]
        assert submission["template_id"] == template["id"]
        assert submission["submitted_by_name"] == "Test User"
        
        print(f"User submitted form: {submission['id']}")
        
        # Cleanup via admin endpoint
        requests.delete(f"{BASE_URL}/api/admin/form-submissions/{submission['id']}")
    
    def test_user_can_view_own_submissions(self):
        """GET /api/workspaces/{id}/form-submissions - User can view their own submissions"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions?user_id={ADMIN_USER_ID}"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submissions" in data
        assert "is_admin" in data
        
        print(f"User can view {len(data['submissions'])} submissions")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_templates(self):
        """Clean up any TEST_ prefixed templates"""
        response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        if response.status_code == 200:
            templates = response.json().get("templates", [])
            for tpl in templates:
                if tpl.get("name", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/admin/form-templates/{tpl['id']}")
                    print(f"Cleaned up template: {tpl['name']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
