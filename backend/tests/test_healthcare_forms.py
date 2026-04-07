"""
Healthcare Forms API Tests - Iteration 63
Tests for 8 healthcare form templates and Resend email delivery on form submission.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ai-sheets-phase3.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
ADMIN_EMAIL = "admin@munal.com"
ADMIN_NAME = "Admin User"
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"

# Expected 8 healthcare form templates
EXPECTED_TEMPLATES = [
    {"name": "Maintenance Request Form", "min_fields": 6},
    {"name": "Daily Log Form", "min_fields": 12},
    {"name": "Incident Report Form", "min_fields": 13},
    {"name": "Medication Administration Record", "min_fields": 11},
    {"name": "Vehicle / Transportation Log", "min_fields": 10},
    {"name": "Fire Drill / Emergency Drill Report", "min_fields": 12},
    {"name": "Visitor Sign-In / Sign-Out Form", "min_fields": 9},
    {"name": "Supply / Inventory Request Form", "min_fields": 9},
]


class TestHealthcareFormTemplates:
    """Test healthcare form templates are seeded correctly"""
    
    def test_get_workspace_form_templates_returns_8_templates(self):
        """GET /api/workspaces/{id}/form-templates - Returns all 8 healthcare templates"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Verify we have at least 8 templates
        assert len(templates) >= 8, f"Expected at least 8 templates, got {len(templates)}"
        
        # Verify each expected template exists
        template_names = [t["name"] for t in templates]
        for expected in EXPECTED_TEMPLATES:
            assert expected["name"] in template_names, f"Missing template: {expected['name']}"
    
    def test_daily_log_form_has_12_fields(self):
        """Daily Log Form should have 12 fields"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        daily_log = next((t for t in templates if t["name"] == "Daily Log Form"), None)
        
        assert daily_log is not None, "Daily Log Form not found"
        assert len(daily_log.get("fields", [])) == 12, f"Expected 12 fields, got {len(daily_log.get('fields', []))}"
        
        # Verify specific fields exist
        field_ids = [f["id"] for f in daily_log["fields"]]
        expected_fields = ["log_date", "staff_name", "shift", "location", "clients_present", 
                          "activities_completed", "client_observations", "medications_administered",
                          "medication_notes", "incidents", "incident_details", "handoff_notes"]
        for field_id in expected_fields:
            assert field_id in field_ids, f"Missing field: {field_id}"
    
    def test_incident_report_form_has_13_fields(self):
        """Incident Report Form should have 13 fields"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        incident_report = next((t for t in templates if t["name"] == "Incident Report Form"), None)
        
        assert incident_report is not None, "Incident Report Form not found"
        assert len(incident_report.get("fields", [])) == 13, f"Expected 13 fields, got {len(incident_report.get('fields', []))}"
        
        # Verify specific fields exist
        field_ids = [f["id"] for f in incident_report["fields"]]
        expected_fields = ["incident_date", "incident_time", "reporter_name", "location", 
                          "incident_type", "persons_involved", "witnesses", "description",
                          "injuries", "injury_details", "action_taken", "supervisor_notified", "follow_up_needed"]
        for field_id in expected_fields:
            assert field_id in field_ids, f"Missing field: {field_id}"
    
    def test_all_templates_have_required_structure(self):
        """All templates should have id, name, fields, is_active, workspace_id"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        for template in templates:
            assert "id" in template, f"Template missing 'id': {template.get('name')}"
            assert "name" in template, f"Template missing 'name'"
            assert "fields" in template, f"Template missing 'fields': {template.get('name')}"
            assert "is_active" in template, f"Template missing 'is_active': {template.get('name')}"
            assert "workspace_id" in template, f"Template missing 'workspace_id': {template.get('name')}"
            assert template["workspace_id"] == WORKSPACE_ID


class TestAdminFormTemplatesAPI:
    """Test admin-level form template endpoints"""
    
    def test_admin_get_all_templates_with_workspace_name(self):
        """GET /api/admin/form-templates - Returns all templates with workspace_name"""
        response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        templates = data.get("templates", [])
        
        # Verify templates have workspace_name enriched
        for template in templates:
            assert "workspace_name" in template, f"Template missing workspace_name: {template.get('name')}"
    
    def test_admin_update_template_recipient_emails(self):
        """PUT /api/admin/form-templates/{id} - Update template recipient_emails"""
        # First get a template
        response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        assert len(templates) > 0, "No templates found"
        
        # Find a template to update (preferably Maintenance Request Form)
        template = next((t for t in templates if t["name"] == "Maintenance Request Form"), templates[0])
        template_id = template["id"]
        
        # Update recipient_emails
        test_emails = ["test@example.com", "admin@munal.com"]
        update_response = requests.put(
            f"{BASE_URL}/api/admin/form-templates/{template_id}",
            json={"recipient_emails": test_emails}
        )
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        updated = update_response.json().get("template", {})
        assert updated.get("recipient_emails") == test_emails, f"Expected {test_emails}, got {updated.get('recipient_emails')}"
        
        # Verify persistence with GET
        verify_response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert verify_response.status_code == 200
        
        verified_template = next((t for t in verify_response.json().get("templates", []) if t["id"] == template_id), None)
        assert verified_template is not None
        assert verified_template.get("recipient_emails") == test_emails
        
        # Clean up - reset recipient_emails
        requests.put(
            f"{BASE_URL}/api/admin/form-templates/{template_id}",
            json={"recipient_emails": []}
        )
    
    def test_admin_update_nonexistent_template_returns_404(self):
        """PUT /api/admin/form-templates/{id} - Returns 404 for non-existent template"""
        fake_id = str(uuid.uuid4())
        response = requests.put(
            f"{BASE_URL}/api/admin/form-templates/{fake_id}",
            json={"name": "Test"}
        )
        assert response.status_code == 404


class TestFormSubmissionWithEmail:
    """Test form submission and email delivery"""
    
    def test_submit_form_success(self):
        """POST /api/workspaces/{id}/form-submissions - Submit form successfully"""
        # Get a template first
        templates_response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert templates_response.status_code == 200
        
        templates = templates_response.json().get("templates", [])
        # Use Daily Log Form for testing
        daily_log = next((t for t in templates if t["name"] == "Daily Log Form"), None)
        assert daily_log is not None, "Daily Log Form not found"
        
        # Build responses for all required fields
        responses = {
            "log_date": "2026-01-15",
            "staff_name": "Test Staff",
            "shift": "Morning (7am-3pm)",
            "location": "Test Location",
            "clients_present": "J.D., M.S.",
            "activities_completed": "Morning routine, breakfast, therapy session",
            "client_observations": "All clients in good spirits",
            "medications_administered": "Yes",
            "medication_notes": "",
            "incidents": "No",
            "incident_details": "",
            "handoff_notes": "All good for next shift"
        }
        
        submission_data = {
            "template_id": daily_log["id"],
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": responses
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "submission" in data
        
        submission = data["submission"]
        assert submission.get("template_id") == daily_log["id"]
        assert submission.get("submitted_by_id") == ADMIN_USER_ID
        assert submission.get("submitted_by_name") == ADMIN_NAME
        assert submission.get("submitted_by_email") == ADMIN_EMAIL
        assert submission.get("responses") == responses
        assert "id" in submission
        assert "submitted_at" in submission
    
    def test_submit_form_with_recipient_emails_triggers_email(self):
        """POST /api/workspaces/{id}/form-submissions - Submit form triggers email to recipient_emails"""
        # First, set recipient_emails on a template
        templates_response = requests.get(f"{BASE_URL}/api/admin/form-templates")
        assert templates_response.status_code == 200
        
        templates = templates_response.json().get("templates", [])
        # Find Maintenance Request Form in our workspace
        maintenance_form = next(
            (t for t in templates if t["name"] == "Maintenance Request Form" and t["workspace_id"] == WORKSPACE_ID), 
            None
        )
        
        if maintenance_form is None:
            pytest.skip("Maintenance Request Form not found in workspace")
        
        template_id = maintenance_form["id"]
        
        # Set recipient_emails
        update_response = requests.put(
            f"{BASE_URL}/api/admin/form-templates/{template_id}",
            json={"recipient_emails": ["admin@munal.com"]}
        )
        assert update_response.status_code == 200
        
        # Submit the form
        responses = {
            "date_submitted": "2026-01-15",
            "staff_name": "Test Staff",
            "repair_location": "Room 101",
            "behavior_concern": "No",
            "priority_level": "Priority 3 - Standard",
            "repair_description": "Light bulb needs replacement"
        }
        
        submission_data = {
            "template_id": template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": responses
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Note: Email is sent asynchronously, so we can't verify delivery here
        # But we verify the submission was successful
        data = response.json()
        assert data.get("success") == True
        
        # Clean up - reset recipient_emails
        requests.put(
            f"{BASE_URL}/api/admin/form-templates/{template_id}",
            json={"recipient_emails": []}
        )
    
    def test_get_user_submissions(self):
        """GET /api/workspaces/{id}/form-submissions - User can view own submissions"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "submissions" in data
        assert isinstance(data["submissions"], list)
    
    def test_submit_form_nonexistent_template_returns_404(self):
        """POST /api/workspaces/{id}/form-submissions - Returns 404 for non-existent template"""
        fake_template_id = str(uuid.uuid4())
        
        submission_data = {
            "template_id": fake_template_id,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": ADMIN_NAME,
            "submitted_by_email": ADMIN_EMAIL,
            "responses": {"test": "value"}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-submissions",
            json=submission_data
        )
        assert response.status_code == 404


class TestFormFieldTypes:
    """Test that all field types are properly defined in templates"""
    
    def test_templates_have_various_field_types(self):
        """Templates should have text, textarea, date, number, yesno, dropdown field types"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        
        # Collect all field types across all templates
        all_field_types = set()
        for template in templates:
            for field in template.get("fields", []):
                all_field_types.add(field.get("type"))
        
        expected_types = {"text", "textarea", "date", "number", "yesno", "dropdown"}
        for expected_type in expected_types:
            assert expected_type in all_field_types, f"Missing field type: {expected_type}"
    
    def test_dropdown_fields_have_options(self):
        """Dropdown fields should have options array"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        
        for template in templates:
            for field in template.get("fields", []):
                if field.get("type") == "dropdown":
                    assert "options" in field, f"Dropdown field missing options: {field.get('label')}"
                    assert len(field["options"]) > 0, f"Dropdown field has no options: {field.get('label')}"
    
    def test_yesno_fields_have_options(self):
        """Yes/No fields should have options array"""
        response = requests.get(
            f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/form-templates",
            params={"user_id": ADMIN_USER_ID}
        )
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        
        for template in templates:
            for field in template.get("fields", []):
                if field.get("type") == "yesno":
                    assert "options" in field, f"Yes/No field missing options: {field.get('label')}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
