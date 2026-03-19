"""
Test Suite for Approvals Module P1 Features:
1. Admin Template Management (Create, Update, Delete, List)
2. In-app Notifications (Create, Approve/Reject, Comment notifications)
3. Integrations (Linked Meetings & Files stored in approval documents)
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ============ ADMIN TEMPLATE MANAGEMENT TESTS ============

class TestAdminTemplateManagement:
    """Tests for Admin Template CRUD operations"""
    
    created_template_id = None
    
    def test_get_templates_returns_default_templates(self, api_client):
        """Test 1: GET /api/approvals/templates returns 23+ default templates"""
        res = api_client.get(f"{BASE_URL}/api/approvals/templates")
        assert res.status_code == 200
        data = res.json()
        templates = data.get("templates", [])
        categories = data.get("categories", [])
        
        # Verify we have default templates
        default_templates = [t for t in templates if not t.get("is_custom")]
        print(f"Found {len(default_templates)} default templates")
        assert len(default_templates) >= 23, f"Expected 23+ default templates, got {len(default_templates)}"
        
        # Verify categories
        assert len(categories) == 6
        assert "Activity" in categories
        assert "Finance" in categories
        print("PASS: GET /api/approvals/templates returns 23+ default templates")
    
    def test_create_custom_template(self, api_client):
        """Test 4: Create a custom template with fields"""
        payload = {
            "name": f"TEST_Custom Template {uuid.uuid4().hex[:6]}",
            "category": "Administration",
            "description": "Test custom template for automated testing",
            "icon": "file-text",
            "fields": [
                {"name": "test_field", "label": "Test Field", "type": "text", "required": True},
                {"name": "amount", "label": "Amount", "type": "number", "required": True},
                {"name": "notes", "label": "Notes", "type": "textarea", "required": False}
            ],
            "scope": "org"
        }
        res = api_client.post(f"{BASE_URL}/api/approvals/templates", json=payload)
        assert res.status_code == 200
        data = res.json()
        
        assert data.get("success") == True
        template = data.get("template", {})
        assert template.get("name") == payload["name"]
        assert template.get("is_custom") == True
        assert len(template.get("fields", [])) == 3
        
        # Store for later tests
        TestAdminTemplateManagement.created_template_id = template.get("id")
        print(f"PASS: Created custom template with id {template.get('id')}")
    
    def test_custom_template_appears_in_list(self, api_client):
        """Verify created template appears in list"""
        res = api_client.get(f"{BASE_URL}/api/approvals/templates")
        assert res.status_code == 200
        templates = res.json().get("templates", [])
        
        # Find our created template by ID (not by is_custom flag, as it may have been updated)
        template_id = TestAdminTemplateManagement.created_template_id
        our_template = next((t for t in templates if t.get("id") == template_id), None)
        assert our_template is not None, f"Created template {template_id} not found in list"
        print(f"PASS: Custom template {template_id} appears in list")
    
    def test_update_custom_template(self, api_client):
        """Test 5 & 19: PUT /api/approvals/templates/{id} updates custom templates"""
        template_id = TestAdminTemplateManagement.created_template_id
        assert template_id, "No template ID from create test"
        
        updated_payload = {
            "name": f"TEST_Updated Template {uuid.uuid4().hex[:4]}",
            "category": "Finance",
            "description": "Updated description for testing",
            "icon": "banknote",
            "fields": [
                {"name": "updated_field", "label": "Updated Field", "type": "text", "required": True},
                {"name": "budget", "label": "Budget", "type": "number", "required": True}
            ],
            "scope": "org"
        }
        res = api_client.put(f"{BASE_URL}/api/approvals/templates/{template_id}", json=updated_payload)
        assert res.status_code == 200
        data = res.json()
        
        assert data.get("success") == True
        template = data.get("template", {})
        assert template.get("name") == updated_payload["name"]
        assert template.get("category") == "Finance"
        assert len(template.get("fields", [])) == 2
        print(f"PASS: PUT /api/approvals/templates/{template_id} updates correctly")
    
    def test_get_specific_template(self, api_client):
        """Test 9: Get template by ID (for preview)"""
        template_id = TestAdminTemplateManagement.created_template_id
        res = api_client.get(f"{BASE_URL}/api/approvals/templates/{template_id}")
        assert res.status_code == 200
        template = res.json()
        
        assert template.get("id") == template_id
        assert "fields" in template
        print(f"PASS: GET /api/approvals/templates/{template_id} returns template details")
    
    def test_delete_custom_template(self, api_client):
        """Test 6: Delete custom template"""
        template_id = TestAdminTemplateManagement.created_template_id
        res = api_client.delete(f"{BASE_URL}/api/approvals/templates/{template_id}")
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") == True
        
        # Verify deletion
        res2 = api_client.get(f"{BASE_URL}/api/approvals/templates/{template_id}")
        assert res2.status_code == 404
        print(f"PASS: DELETE /api/approvals/templates/{template_id} removes template")
    
    def test_cannot_delete_default_template(self, api_client):
        """Test 7: Default templates cannot be deleted"""
        # Try to delete a default template
        res = api_client.delete(f"{BASE_URL}/api/approvals/templates/tpl-leave")
        assert res.status_code == 404
        print("PASS: Default templates cannot be deleted")
    
    def test_category_filter_works(self, api_client):
        """Test 8: Search and category filter work"""
        res = api_client.get(f"{BASE_URL}/api/approvals/templates?category=Finance")
        assert res.status_code == 200
        templates = res.json().get("templates", [])
        
        # All returned templates should be Finance category
        for t in templates:
            assert t.get("category") == "Finance", f"Template {t.get('name')} has wrong category"
        print(f"PASS: Category filter returns {len(templates)} Finance templates")


# ============ NOTIFICATION TESTS ============

class TestApprovalNotifications:
    """Tests for notification generation on approval actions"""
    
    approval_id = None
    
    def test_create_approval_generates_notification(self, api_client):
        """Test 10: POST /api/approvals/create generates notification for approvers"""
        payload = {
            "title": f"TEST_Notification Test Approval {uuid.uuid4().hex[:6]}",
            "template_id": "tpl-leave",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [
                {"user_id": "notif-test-user", "name": "Notification Test User", "email": "notif@test.com", "type": "individual"}
            ],
            "form_data": {"leave_type": "Annual Leave", "start_date": "2026-03-01", "end_date": "2026-03-05", "reason": "Vacation"},
            "workflow_type": "single",
            "description": "Testing notification generation"
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id=test-user-1&user_name=Test%20User&user_email=test@example.com",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") == True
        
        approval = data.get("approval", {})
        TestApprovalNotifications.approval_id = approval.get("id")
        
        # Check notification was created for the approver
        notif_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=notif-test-user")
        assert notif_res.status_code == 200
        notif_data = notif_res.json()
        
        notifications = notif_data.get("notifications", [])
        # Find notification for this approval
        matching = [n for n in notifications if n.get("approval_id") == approval.get("id")]
        assert len(matching) >= 1, "No notification created for approver"
        assert matching[0].get("type") == "approval_request"
        print(f"PASS: Create approval generates notification for approvers")
    
    def test_approve_action_generates_notification(self, api_client):
        """Test 11: POST /api/approvals/action/{id} (approve) generates notification for sender"""
        approval_id = TestApprovalNotifications.approval_id
        assert approval_id, "No approval ID from create test"
        
        # Approve the request as the approver
        res = api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id=notif-test-user&user_name=Approver",
            json={"action": "approve", "comment": "Approved for testing"}
        )
        assert res.status_code == 200
        
        # Check notification was created for sender (test-user-1)
        notif_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-1")
        assert notif_res.status_code == 200
        notifications = notif_res.json().get("notifications", [])
        
        matching = [n for n in notifications if n.get("approval_id") == approval_id and n.get("type") == "approval_approved"]
        assert len(matching) >= 1, "No approval notification created for sender"
        print("PASS: Approve action generates notification for sender")
    
    def test_reject_action_generates_notification(self, api_client):
        """Create new approval and test rejection notification"""
        # First create a new approval
        payload = {
            "title": f"TEST_Reject Notification Test {uuid.uuid4().hex[:6]}",
            "template_id": "tpl-overtime",
            "category": "Attendance",
            "priority": "High",
            "approvers": [
                {"user_id": "approver-1", "name": "Approver One", "email": "approver1@test.com", "type": "individual"}
            ],
            "form_data": {"date": "2026-02-15", "hours": 4, "reason": "Project deadline"},
            "workflow_type": "single",
            "description": "Testing rejection notification"
        }
        
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id=test-user-2&user_name=Sender%20Two&user_email=sender2@test.com",
            json=payload
        )
        assert create_res.status_code == 200
        approval_id = create_res.json().get("approval", {}).get("id")
        
        # Reject the request
        reject_res = api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id=approver-1&user_name=Approver%20One",
            json={"action": "reject", "comment": "Budget constraints"}
        )
        assert reject_res.status_code == 200
        
        # Check notification for sender
        notif_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-2")
        assert notif_res.status_code == 200
        notifications = notif_res.json().get("notifications", [])
        
        matching = [n for n in notifications if n.get("approval_id") == approval_id and n.get("type") == "approval_rejected"]
        assert len(matching) >= 1, "No rejection notification created for sender"
        print("PASS: Reject action generates notification for sender")
    
    def test_comment_generates_notification(self, api_client):
        """Test 12: POST /api/approvals/comments/{id} generates notification for participants"""
        approval_id = TestApprovalNotifications.approval_id
        
        # Add a comment
        comment_res = api_client.post(
            f"{BASE_URL}/api/approvals/comments/{approval_id}?user_id=external-user&user_name=External%20User",
            json={"content": "This is a test comment for notification"}
        )
        assert comment_res.status_code == 200
        
        # Check notification for sender (test-user-1 - who created the original approval)
        notif_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-1")
        assert notif_res.status_code == 200
        notifications = notif_res.json().get("notifications", [])
        
        comment_notifs = [n for n in notifications if n.get("approval_id") == approval_id and n.get("type") == "approval_comment"]
        assert len(comment_notifs) >= 1, "No comment notification created for participants"
        print("PASS: Comment generates notification for participants")
    
    def test_get_notifications_with_unread_count(self, api_client):
        """Test 13: GET /api/approvals/notifications returns notifications with unread count"""
        res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-1")
        assert res.status_code == 200
        data = res.json()
        
        assert "notifications" in data
        assert "unread_count" in data
        assert isinstance(data["unread_count"], int)
        print(f"PASS: GET notifications returns unread_count={data['unread_count']}")
    
    def test_mark_notifications_read(self, api_client):
        """Test 14: POST /api/approvals/notifications/read marks all as read"""
        # First ensure there are unread notifications
        pre_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-1")
        
        # Mark as read
        res = api_client.post(f"{BASE_URL}/api/approvals/notifications/read?user_id=test-user-1")
        assert res.status_code == 200
        assert res.json().get("success") == True
        
        # Verify unread count is now 0
        post_res = api_client.get(f"{BASE_URL}/api/approvals/notifications?user_id=test-user-1")
        assert post_res.status_code == 200
        assert post_res.json().get("unread_count") == 0
        print("PASS: Mark notifications read works correctly")


# ============ INTEGRATION TESTS (Linked Items) ============

class TestLinkedItemsIntegration:
    """Tests for Meeting and File linking in approvals"""
    
    def test_create_approval_with_linked_meeting(self, api_client):
        """Test 17, 18, 20: Create approval with linked meeting and verify storage"""
        payload = {
            "title": f"TEST_Linked Meeting Approval {uuid.uuid4().hex[:6]}",
            "template_id": "tpl-business-trip",
            "category": "Attendance",
            "priority": "High",
            "approvers": [
                {"user_id": "test-approver", "name": "Test Approver", "email": "approver@test.com", "type": "individual"}
            ],
            "form_data": {
                "destination": "New York",
                "departure_date": "2026-04-01",
                "return_date": "2026-04-05",
                "budget": 2500,
                "purpose": "Client meeting"
            },
            "workflow_type": "single",
            "description": "Business trip with linked meeting",
            "linked_meeting": {
                "meeting_id": "test-meeting-123",
                "title": "Client Strategy Meeting"
            },
            "linked_files": []
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id=test-user-1&user_name=Test%20User&user_email=test@example.com",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") == True
        
        approval = data.get("approval", {})
        approval_id = approval.get("id")
        
        # Verify linked_meeting is stored
        assert approval.get("linked_meeting") is not None
        assert approval["linked_meeting"]["meeting_id"] == "test-meeting-123"
        assert approval["linked_meeting"]["title"] == "Client Strategy Meeting"
        
        # Verify via detail endpoint
        detail_res = api_client.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        assert detail_res.status_code == 200
        detail_approval = detail_res.json().get("approval", {})
        assert detail_approval.get("linked_meeting") is not None
        print("PASS: Linked meeting is stored and shown in approval detail")
    
    def test_create_approval_with_linked_files(self, api_client):
        """Test 17, 18, 20: Create approval with linked files and verify storage"""
        payload = {
            "title": f"TEST_Linked Files Approval {uuid.uuid4().hex[:6]}",
            "template_id": "tpl-reimbursement",
            "category": "Finance",
            "priority": "Medium",
            "approvers": [
                {"user_id": "test-approver-2", "name": "Finance Manager", "email": "finance@test.com", "type": "individual"}
            ],
            "form_data": {
                "expense_type": "Travel",
                "amount": 350,
                "date": "2026-02-10",
                "description": "Airport taxi and meals"
            },
            "workflow_type": "single",
            "description": "Reimbursement with receipt attachments",
            "linked_meeting": None,
            "linked_files": [
                {"file_id": "file-001", "name": "receipt_taxi.pdf", "url": "https://files.example.com/receipt_taxi.pdf"},
                {"file_id": "file-002", "name": "receipt_meal.jpg", "url": "https://files.example.com/receipt_meal.jpg"}
            ]
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id=test-user-1&user_name=Test%20User&user_email=test@example.com",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") == True
        
        approval = data.get("approval", {})
        approval_id = approval.get("id")
        
        # Verify linked_files is stored
        assert approval.get("linked_files") is not None
        assert len(approval["linked_files"]) == 2
        assert approval["linked_files"][0]["name"] == "receipt_taxi.pdf"
        assert approval["linked_files"][1]["file_id"] == "file-002"
        
        # Verify via detail endpoint
        detail_res = api_client.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        assert detail_res.status_code == 200
        detail_approval = detail_res.json().get("approval", {})
        assert len(detail_approval.get("linked_files", [])) == 2
        print("PASS: Linked files are stored and shown in approval detail")
    
    def test_create_approval_with_both_meeting_and_files(self, api_client):
        """Test combined meeting and files linking"""
        payload = {
            "title": f"TEST_Full Integration Approval {uuid.uuid4().hex[:6]}",
            "template_id": "tpl-project-request",
            "category": "Projects",
            "priority": "High",
            "approvers": [
                {"user_id": "pm-approver", "name": "Project Manager", "email": "pm@test.com", "type": "individual"}
            ],
            "form_data": {
                "project_name": "Q2 Initiative",
                "budget": 50000,
                "start_date": "2026-04-01",
                "end_date": "2026-06-30",
                "team_size": 5,
                "description": "New product development"
            },
            "workflow_type": "single",
            "description": "Project proposal with meeting and attachments",
            "linked_meeting": {
                "meeting_id": "kickoff-meeting-456",
                "title": "Project Kickoff Meeting"
            },
            "linked_files": [
                {"file_id": "doc-001", "name": "project_plan.pdf", "url": "https://files.example.com/project_plan.pdf"},
                {"file_id": "doc-002", "name": "budget_breakdown.xlsx", "url": "https://files.example.com/budget.xlsx"},
                {"file_id": "doc-003", "name": "team_roster.docx", "url": "https://files.example.com/team.docx"}
            ]
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id=test-user-1&user_name=Test%20User&user_email=test@example.com",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        
        approval = data.get("approval", {})
        
        # Verify both linked_meeting and linked_files
        assert approval.get("linked_meeting") is not None
        assert approval["linked_meeting"]["title"] == "Project Kickoff Meeting"
        
        assert len(approval.get("linked_files", [])) == 3
        file_names = [f["name"] for f in approval["linked_files"]]
        assert "project_plan.pdf" in file_names
        assert "budget_breakdown.xlsx" in file_names
        print("PASS: Both meeting and files are stored correctly in approval")


# ============ CLEANUP ============

@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(api_client):
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Note: In a real environment, we'd clean up test approvals and templates
    # For now, we rely on the TEST_ prefix to identify test data
    print("Test cleanup: Test data prefixed with TEST_ created during this run")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
