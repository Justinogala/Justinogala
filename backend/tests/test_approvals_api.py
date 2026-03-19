"""
Approvals Module API Tests
Tests for: Templates, Create, List, Detail, Actions, Comments, Stats, Export
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user IDs
SENDER_USER_ID = "test-user-1"
APPROVER_USER_ID = "test-user-2"
SENDER_NAME = "Test Sender"
APPROVER_NAME = "Test Approver"


class TestApprovalsTemplates:
    """Template API endpoint tests"""

    def test_get_templates_returns_success(self):
        """GET /api/approvals/templates returns 200 with templates and categories"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates'"
        assert "categories" in data, "Response should contain 'categories'"
        
    def test_get_templates_returns_23_default_templates(self):
        """GET /api/approvals/templates returns 23 default templates"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        # Should have at least the 23 default templates
        assert len(templates) >= 23, f"Expected at least 23 templates, got {len(templates)}"
        
    def test_get_templates_returns_6_categories(self):
        """GET /api/approvals/templates returns 6 categories"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates")
        assert response.status_code == 200
        
        data = response.json()
        categories = data.get("categories", [])
        expected_categories = ["Activity", "Administration", "Projects", "Attendance", "Finance", "Order Management"]
        assert len(categories) == 6, f"Expected 6 categories, got {len(categories)}"
        for cat in expected_categories:
            assert cat in categories, f"Category '{cat}' not found in {categories}"

    def test_get_templates_template_structure(self):
        """Each template should have id, name, category, description, icon, fields"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        if templates:
            template = templates[0]
            assert "id" in template, "Template should have 'id'"
            assert "name" in template, "Template should have 'name'"
            assert "category" in template, "Template should have 'category'"
            assert "description" in template, "Template should have 'description'"
            assert "fields" in template, "Template should have 'fields'"

    def test_get_templates_filter_by_category(self):
        """GET /api/approvals/templates?category=Finance returns only Finance templates"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates?category=Finance")
        assert response.status_code == 200
        
        data = response.json()
        templates = data.get("templates", [])
        assert len(templates) > 0, "Should return Finance templates"
        for t in templates:
            assert t.get("category") == "Finance", f"Template {t.get('name')} has category {t.get('category')}, expected Finance"

    def test_get_single_template(self):
        """GET /api/approvals/templates/{id} returns specific template"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates/tpl-leave")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("id") == "tpl-leave"
        assert data.get("name") == "Leave Request"
        assert data.get("category") == "Attendance"

    def test_get_nonexistent_template_returns_404(self):
        """GET /api/approvals/templates/{nonexistent} returns 404"""
        response = requests.get(f"{BASE_URL}/api/approvals/templates/nonexistent-template-xyz")
        assert response.status_code == 404


class TestApprovalsStats:
    """Stats API endpoint tests"""

    def test_get_stats_returns_success(self):
        """GET /api/approvals/stats returns 200 with counts"""
        response = requests.get(f"{BASE_URL}/api/approvals/stats?user_id={SENDER_USER_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "received_pending" in data
        assert "sent_pending" in data
        assert "approved" in data
        assert "rejected" in data
        assert "total_sent" in data
        assert "total_received" in data

    def test_get_stats_requires_user_id(self):
        """GET /api/approvals/stats without user_id returns 422"""
        response = requests.get(f"{BASE_URL}/api/approvals/stats")
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"


class TestApprovalsCRUD:
    """Approval CRUD endpoint tests"""

    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data prefix"""
        self.test_prefix = f"TEST_{uuid.uuid4().hex[:6]}_"

    def test_create_approval_success(self):
        """POST /api/approvals/create creates an approval and returns it"""
        unique_title = f"TEST_{uuid.uuid4().hex[:8]}_Leave Request"
        payload = {
            "title": unique_title,
            "template_id": "tpl-leave",
            "category": "Attendance",
            "priority": "High",
            "approvers": [
                {"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "email": "approver@test.com", "type": "individual"}
            ],
            "form_data": {
                "leave_type": "Annual Leave",
                "start_date": "2026-03-20",
                "end_date": "2026-03-22",
                "reason": "Family vacation"
            },
            "workflow_type": "single",
            "description": "Test leave request for API testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}&user_email=sender@test.com",
            json=payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "approval" in data
        
        approval = data["approval"]
        assert approval["title"] == unique_title
        assert approval["priority"] == "High"
        assert approval["status"] == "pending"
        assert approval["sender_id"] == SENDER_USER_ID
        assert len(approval["steps"]) == 1
        assert approval["steps"][0]["approver_id"] == APPROVER_USER_ID
        
        return approval["id"]

    def test_create_approval_requires_user_id(self):
        """POST /api/approvals/create without user_id returns 422"""
        payload = {"title": "Test", "approvers": []}
        response = requests.post(f"{BASE_URL}/api/approvals/create", json=payload)
        assert response.status_code == 422

    def test_list_approvals_sent_tab(self):
        """GET /api/approvals/list?tab=sent returns sent approvals"""
        response = requests.get(f"{BASE_URL}/api/approvals/list?user_id={SENDER_USER_ID}&tab=sent")
        assert response.status_code == 200
        
        data = response.json()
        assert "approvals" in data
        # If there are approvals, verify they are sent by this user
        for approval in data["approvals"]:
            assert approval["sender_id"] == SENDER_USER_ID

    def test_list_approvals_received_tab(self):
        """GET /api/approvals/list?tab=received returns received approvals"""
        response = requests.get(f"{BASE_URL}/api/approvals/list?user_id={APPROVER_USER_ID}&tab=received")
        assert response.status_code == 200
        
        data = response.json()
        assert "approvals" in data

    def test_list_approvals_filter_by_status(self):
        """GET /api/approvals/list with status filter works"""
        response = requests.get(f"{BASE_URL}/api/approvals/list?user_id={SENDER_USER_ID}&tab=sent&status=pending")
        assert response.status_code == 200
        
        data = response.json()
        for approval in data.get("approvals", []):
            assert approval["status"] == "pending"

    def test_list_approvals_filter_by_priority(self):
        """GET /api/approvals/list with priority filter works"""
        response = requests.get(f"{BASE_URL}/api/approvals/list?user_id={SENDER_USER_ID}&tab=sent&priority=High")
        assert response.status_code == 200
        
        data = response.json()
        for approval in data.get("approvals", []):
            assert approval["priority"] == "High"


class TestApprovalDetail:
    """Approval detail endpoint tests"""

    def test_get_approval_detail(self):
        """GET /api/approvals/detail/{id} returns approval with comments and audit"""
        # First create an approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Detail Test",
            "template_id": "tpl-wfh",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"date": "2026-03-20", "reason": "Home office day"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        assert create_response.status_code == 200
        approval_id = create_response.json()["approval"]["id"]
        
        # Get detail
        response = requests.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "approval" in data
        assert "comments" in data
        assert "audit" in data
        assert data["approval"]["id"] == approval_id

    def test_get_nonexistent_approval_returns_404(self):
        """GET /api/approvals/detail/{nonexistent} returns 404"""
        response = requests.get(f"{BASE_URL}/api/approvals/detail/nonexistent-id-xyz")
        assert response.status_code == 404


class TestApprovalActions:
    """Approval action endpoint tests (approve/reject/cancel)"""

    def test_approve_action(self):
        """POST /api/approvals/action/{id} with action=approve works"""
        # Create approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Approve Test",
            "template_id": "tpl-overtime",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"date": "2026-03-20", "hours": 4, "reason": "Project deadline"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        approval_id = create_response.json()["approval"]["id"]
        
        # Approve
        action_response = requests.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={APPROVER_USER_ID}&user_name={APPROVER_NAME}",
            json={"action": "approve", "comment": "Approved for testing"}
        )
        assert action_response.status_code == 200
        
        data = action_response.json()
        assert data.get("success") is True
        assert data["approval"]["status"] == "approved"

    def test_reject_action(self):
        """POST /api/approvals/action/{id} with action=reject works"""
        # Create approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Reject Test",
            "template_id": "tpl-reimbursement",
            "category": "Finance",
            "priority": "Low",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"expense_type": "Travel", "amount": 500, "date": "2026-03-15", "description": "Test expense"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        approval_id = create_response.json()["approval"]["id"]
        
        # Reject
        action_response = requests.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={APPROVER_USER_ID}&user_name={APPROVER_NAME}",
            json={"action": "reject", "comment": "Rejected for testing"}
        )
        assert action_response.status_code == 200
        
        data = action_response.json()
        assert data.get("success") is True
        assert data["approval"]["status"] == "rejected"

    def test_cancel_action(self):
        """POST /api/approvals/action/{id} with action=cancel works"""
        # Create approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Cancel Test",
            "template_id": "tpl-wfh",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"date": "2026-03-20", "reason": "Test WFH"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        approval_id = create_response.json()["approval"]["id"]
        
        # Cancel (by sender)
        action_response = requests.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json={"action": "cancel", "comment": "Cancelled for testing"}
        )
        assert action_response.status_code == 200
        
        data = action_response.json()
        assert data.get("success") is True
        assert data["approval"]["status"] == "cancelled"

    def test_action_on_nonexistent_approval_returns_404(self):
        """POST /api/approvals/action/{nonexistent} returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/action/nonexistent-xyz?user_id={APPROVER_USER_ID}&user_name=Test",
            json={"action": "approve"}
        )
        assert response.status_code == 404


class TestApprovalComments:
    """Comments endpoint tests"""

    def test_add_comment_success(self):
        """POST /api/approvals/comments/{id} adds a comment"""
        # Create approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Comment Test",
            "template_id": "tpl-leave",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"leave_type": "Sick Leave", "start_date": "2026-03-20", "end_date": "2026-03-20", "reason": "Feeling unwell"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        approval_id = create_response.json()["approval"]["id"]
        
        # Add comment
        comment_response = requests.post(
            f"{BASE_URL}/api/approvals/comments/{approval_id}?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json={"content": "This is a test comment"}
        )
        assert comment_response.status_code == 200
        
        data = comment_response.json()
        assert data.get("success") is True
        assert "comment" in data
        assert data["comment"]["content"] == "This is a test comment"
        assert data["comment"]["user_id"] == SENDER_USER_ID

    def test_comment_appears_in_detail(self):
        """Comment should appear in detail endpoint"""
        # Create approval
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Comment Detail Test",
            "template_id": "tpl-leave",
            "category": "Attendance",
            "priority": "Medium",
            "approvers": [{"user_id": APPROVER_USER_ID, "name": APPROVER_NAME, "type": "individual"}],
            "form_data": {"leave_type": "Annual Leave", "start_date": "2026-03-25", "end_date": "2026-03-26", "reason": "Rest"},
            "workflow_type": "single"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        approval_id = create_response.json()["approval"]["id"]
        
        # Add comment
        comment_text = f"Test comment {uuid.uuid4().hex[:6]}"
        requests.post(
            f"{BASE_URL}/api/approvals/comments/{approval_id}?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json={"content": comment_text}
        )
        
        # Get detail and verify comment
        detail_response = requests.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        data = detail_response.json()
        comments = data.get("comments", [])
        
        assert any(c["content"] == comment_text for c in comments), "Comment should appear in detail"


class TestApprovalExport:
    """Export endpoint tests"""

    def test_export_csv_returns_file(self):
        """GET /api/approvals/export returns CSV file"""
        response = requests.get(f"{BASE_URL}/api/approvals/export?user_id={SENDER_USER_ID}&format=csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("Content-Type", "")
        assert "attachment" in response.headers.get("Content-Disposition", "")

    def test_export_csv_has_headers(self):
        """Export CSV should have proper headers"""
        response = requests.get(f"{BASE_URL}/api/approvals/export?user_id={SENDER_USER_ID}&format=csv")
        content = response.text
        # Check for CSV headers
        assert "Title" in content
        assert "Category" in content
        assert "Priority" in content
        assert "Status" in content


class TestSequentialWorkflow:
    """Sequential workflow tests"""

    def test_sequential_workflow_first_step_pending(self):
        """Sequential workflow: first step is pending, others are waiting"""
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Sequential Workflow",
            "template_id": "tpl-project-request",
            "category": "Projects",
            "priority": "High",
            "approvers": [
                {"user_id": "approver1", "name": "Approver 1", "type": "individual"},
                {"user_id": "approver2", "name": "Approver 2", "type": "individual"}
            ],
            "form_data": {"project_name": "Test Project", "budget": 10000, "start_date": "2026-04-01", "end_date": "2026-06-01", "team_size": 5, "description": "Test sequential workflow"},
            "workflow_type": "sequential"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        assert response.status_code == 200
        
        approval = response.json()["approval"]
        steps = approval["steps"]
        
        assert len(steps) == 2
        assert steps[0]["status"] == "pending", "First step should be pending"
        assert steps[1]["status"] == "waiting", "Second step should be waiting"


class TestParallelWorkflow:
    """Parallel workflow tests"""

    def test_parallel_workflow_all_pending(self):
        """Parallel workflow: all steps are pending"""
        payload = {
            "title": f"TEST_{uuid.uuid4().hex[:8]}_Parallel Workflow",
            "template_id": "tpl-contract",
            "category": "Order Management",
            "priority": "Urgent",
            "approvers": [
                {"user_id": "approver1", "name": "Legal Approver", "type": "individual"},
                {"user_id": "approver2", "name": "Finance Approver", "type": "individual"}
            ],
            "form_data": {"contract_type": "Vendor", "party": "Acme Corp", "value": 50000, "start_date": "2026-04-01", "end_date": "2027-04-01"},
            "workflow_type": "parallel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/approvals/create?user_id={SENDER_USER_ID}&user_name={SENDER_NAME}",
            json=payload
        )
        assert response.status_code == 200
        
        approval = response.json()["approval"]
        steps = approval["steps"]
        
        assert len(steps) == 2
        # In parallel workflow, all steps should be pending
        for step in steps:
            assert step["status"] == "pending", f"Step {step['step']} should be pending in parallel workflow"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
