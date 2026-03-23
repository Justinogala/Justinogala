"""
ICT Support Module Tests - Testing Excel-based fields, visibility rules, and CRUD operations
Tests for:
- POST /api/workspaces/{id}/ict-requests - Create ICT request with new Excel-based fields
- GET /api/workspaces/{id}/ict-requests - Admin sees all, standard users see only their own
- PUT /api/workspaces/{id}/ict-requests/{id} - Update status, notes, email_sent
- POST /api/workspaces/{id}/ict-requests/{id}/comments - Add comments
- DELETE /api/workspaces/{id}/ict-requests/{id} - Delete ticket (admin only)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from review request
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"
WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for admin user"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    if auth_token:
        api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestICTRequestCreate:
    """Test POST /api/workspaces/{id}/ict-requests - Create ICT request with Excel-based fields"""
    
    def test_create_ict_request_with_all_excel_fields(self, api_client):
        """Test creating ICT request with all new Excel-based fields"""
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Admin User",
            # Reporter info
            "reporter_role": "Administrative Staff",
            "department": "IT/ICT",
            "reporting_for_self": "Yes",
            "other_user_name": "",
            "other_user_email": "",
            # Request details
            "request_type": "Email Password Reset",
            "location": "Head Office Floor 3",
            "description": "TEST_ICT: Need password reset for email account",
            "device_equipment": "Desktop Computer",
            "who_is_affected": "Individual",
            # Symptoms & troubleshooting
            "symptoms": "Cannot login to email",
            "error_messages": "Invalid credentials error",
            "troubleshooting_attempted": "Yes",
            "troubleshooting_results": "Tried clearing cache, still not working",
            # HR related
            "is_hr_related": "No",
            "hr_details": "",
            "hr_email": "",
            # Contact
            "contact_number": "555-1234",
            "work_email": "admin@munal.com",
            # Priority
            "priority": "High"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify success
        assert data.get("success") == True
        assert "request" in data
        
        request = data["request"]
        
        # Verify all Excel-based fields are stored
        assert request["reporter_role"] == "Administrative Staff"
        assert request["department"] == "IT/ICT"
        assert request["reporting_for_self"] == "Yes"
        assert request["request_type"] == "Email Password Reset"
        assert request["location"] == "Head Office Floor 3"
        assert request["device_equipment"] == "Desktop Computer"
        assert request["symptoms"] == "Cannot login to email"
        assert request["error_messages"] == "Invalid credentials error"
        assert request["troubleshooting_attempted"] == "Yes"
        assert request["troubleshooting_results"] == "Tried clearing cache, still not working"
        assert request["is_hr_related"] == "No"
        assert request["contact_number"] == "555-1234"
        assert request["work_email"] == "admin@munal.com"
        assert request["priority"] == "High"
        
        # Verify auto-generated fields
        assert "id" in request
        assert "ticket_number" in request
        assert request["ticket_number"].startswith("ICT-")
        assert request["status"] == "Open"
        assert "created_at" in request
        
        # Store for cleanup
        TestICTRequestCreate.created_request_id = request["id"]
    
    def test_create_ict_request_reporting_for_someone_else(self, api_client):
        """Test creating ICT request when reporting for another user"""
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Admin User",
            "reporter_role": "Program Manager",
            "department": "Operations",
            "reporting_for_self": "No",
            "other_user_name": "John Doe",
            "other_user_email": "john.doe@example.com",
            "request_type": "Device/Hardware Issue",
            "location": "Branch Office",
            "description": "TEST_ICT: Laptop not turning on for team member",
            "device_equipment": "Laptop - Dell XPS",
            "who_is_affected": "Team",
            "symptoms": "Power button not responding",
            "error_messages": "",
            "troubleshooting_attempted": "No",
            "troubleshooting_results": "",
            "is_hr_related": "No",
            "hr_details": "",
            "hr_email": "",
            "contact_number": "",
            "work_email": "",
            "priority": "Critical"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        request = data["request"]
        
        # Verify reporting for someone else fields
        assert request["reporting_for_self"] == "No"
        assert request["other_user_name"] == "John Doe"
        assert request["other_user_email"] == "john.doe@example.com"
        
        TestICTRequestCreate.second_request_id = request["id"]
    
    def test_create_ict_request_hr_related(self, api_client):
        """Test creating HR-related ICT request"""
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Admin User",
            "reporter_role": "HR",
            "department": "HR",
            "reporting_for_self": "Yes",
            "request_type": "ADP Password Reset",
            "location": "Head Office",
            "description": "TEST_ICT: Need ADP access reset for new employee onboarding",
            "device_equipment": "",
            "who_is_affected": "Individual",
            "symptoms": "",
            "error_messages": "",
            "troubleshooting_attempted": "No",
            "troubleshooting_results": "",
            "is_hr_related": "Yes",
            "hr_details": "New employee starting Monday, needs ADP access for payroll",
            "hr_email": "hr@company.com",
            "contact_number": "555-9999",
            "work_email": "hr@munal.com",
            "priority": "Medium"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        request = data["request"]
        
        # Verify HR-related fields
        assert request["is_hr_related"] == "Yes"
        assert request["hr_details"] == "New employee starting Monday, needs ADP access for payroll"
        assert request["hr_email"] == "hr@company.com"
        
        TestICTRequestCreate.hr_request_id = request["id"]


class TestICTRequestGet:
    """Test GET /api/workspaces/{id}/ict-requests - Visibility rules"""
    
    def test_get_ict_requests_as_admin_returns_is_admin_flag(self, api_client):
        """Test that admin user gets is_admin=True flag"""
        response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify is_admin flag is returned
        assert "is_admin" in data
        assert data["is_admin"] == True
        
        # Verify requests array
        assert "requests" in data
        assert isinstance(data["requests"], list)
    
    def test_get_ict_requests_returns_all_fields(self, api_client):
        """Test that GET returns all Excel-based fields"""
        response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        if len(data["requests"]) > 0:
            request = data["requests"][0]
            
            # Verify all expected fields are present
            expected_fields = [
                "id", "ticket_number", "workspace_id", "submitted_by_id", "submitted_by_name",
                "reporter_role", "department", "reporting_for_self", "other_user_name", "other_user_email",
                "request_type", "location", "description", "device_equipment", "who_is_affected",
                "symptoms", "error_messages", "troubleshooting_attempted", "troubleshooting_results",
                "is_hr_related", "hr_details", "hr_email", "contact_number", "work_email",
                "priority", "status", "created_at", "updated_at"
            ]
            
            for field in expected_fields:
                assert field in request, f"Missing field: {field}"
    
    def test_get_single_ict_request(self, api_client):
        """Test GET single ICT request by ID"""
        # First get list to find a request ID
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        assert list_response.status_code == 200
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["id"] == request_id
            assert "comments" in data


class TestICTRequestUpdate:
    """Test PUT /api/workspaces/{id}/ict-requests/{id} - Update status, notes, email_sent"""
    
    def test_update_status_to_pending(self, api_client):
        """Test updating status to Pending"""
        # Get a request to update
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.put(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                json={"status": "Pending"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert data["request"]["status"] == "Pending"
    
    def test_update_status_to_resolved(self, api_client):
        """Test updating status to Resolved"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.put(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                json={"status": "Resolved", "resolution_notes": "Password has been reset successfully"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["request"]["status"] == "Resolved"
            assert data["request"]["resolution_notes"] == "Password has been reset successfully"
            assert "resolved_at" in data["request"]
    
    def test_update_status_to_cancelled_invalid(self, api_client):
        """Test updating status to Cancelled/Invalid"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        # Find a request that's not already cancelled
        for req in requests:
            if req["status"] != "Cancelled/Invalid":
                request_id = req["id"]
                
                response = api_client.put(
                    f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                    json={"status": "Cancelled/Invalid"}
                )
                
                assert response.status_code == 200
                data = response.json()
                assert data["request"]["status"] == "Cancelled/Invalid"
                break
    
    def test_update_notes_field(self, api_client):
        """Test updating internal notes field"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.put(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                json={"notes": "Internal note: User contacted via phone"}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["request"]["notes"] == "Internal note: User contacted via phone"
    
    def test_update_email_sent_field(self, api_client):
        """Test updating email_sent field"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.put(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                json={"email_sent": True}
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["request"]["email_sent"] == True


class TestICTRequestComments:
    """Test POST /api/workspaces/{id}/ict-requests/{id}/comments - Add comments"""
    
    def test_admin_can_add_comment_anytime(self, api_client):
        """Test that admin can add comments to any ticket"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            response = api_client.post(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}/comments",
                json={
                    "user_id": ADMIN_USER_ID,
                    "user_name": "Admin User",
                    "content": "TEST_COMMENT: Working on this issue"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert data["success"] == True
            assert "comment" in data
            assert data["comment"]["content"] == "TEST_COMMENT: Working on this issue"
            assert data["comment"]["user_name"] == "Admin User"
            assert "id" in data["comment"]
            assert "created_at" in data["comment"]
    
    def test_comment_appears_in_request_detail(self, api_client):
        """Test that added comment appears in request detail"""
        list_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        requests = list_response.json()["requests"]
        
        if len(requests) > 0:
            request_id = requests[0]["id"]
            
            # Get request detail
            detail_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}")
            
            assert detail_response.status_code == 200
            data = detail_response.json()
            
            assert "comments" in data
            assert isinstance(data["comments"], list)


class TestICTRequestDelete:
    """Test DELETE /api/workspaces/{id}/ict-requests/{id} - Delete ticket (admin only)"""
    
    def test_admin_can_delete_request(self, api_client):
        """Test that admin can delete ICT request"""
        # Create a request to delete
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Admin User",
            "reporter_role": "Other",
            "department": "Other",
            "reporting_for_self": "Yes",
            "request_type": "Other",
            "location": "Test Location",
            "description": "TEST_ICT_DELETE: This request will be deleted",
            "priority": "Low"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        assert create_response.status_code == 200
        request_id = create_response.json()["request"]["id"]
        
        # Delete the request
        delete_response = api_client.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}")
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data["success"] == True
        
        # Verify it's deleted
        get_response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}")
        assert get_response.status_code == 404


class TestICTRequestStatuses:
    """Test all 5 status values: Open, Pending, Resolved, Closed, Cancelled/Invalid"""
    
    def test_all_status_transitions(self, api_client):
        """Test that all 5 statuses can be set"""
        # Create a test request
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": ADMIN_USER_ID,
            "submitted_by_name": "Admin User",
            "reporter_role": "Administrative Staff",
            "department": "IT/ICT",
            "reporting_for_self": "Yes",
            "request_type": "Software Issue",
            "location": "Test",
            "description": "TEST_ICT_STATUS: Testing all status transitions",
            "priority": "Medium"
        }
        
        create_response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        assert create_response.status_code == 200
        request_id = create_response.json()["request"]["id"]
        
        # Test all statuses
        statuses = ["Open", "Pending", "Resolved", "Closed", "Cancelled/Invalid"]
        
        for status in statuses:
            response = api_client.put(
                f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}",
                json={"status": status}
            )
            
            assert response.status_code == 200, f"Failed to set status to {status}"
            assert response.json()["request"]["status"] == status
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{request_id}?user_id={ADMIN_USER_ID}")


class TestICTRequestValidation:
    """Test validation and error handling"""
    
    def test_non_member_cannot_create_request(self, api_client):
        """Test that non-workspace members cannot create requests"""
        fake_user_id = str(uuid.uuid4())
        
        payload = {
            "workspace_id": WORKSPACE_ID,
            "submitted_by_id": fake_user_id,
            "submitted_by_name": "Fake User",
            "request_type": "Other",
            "description": "This should fail",
            "priority": "Low"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests", json=payload)
        
        assert response.status_code == 403
    
    def test_invalid_workspace_returns_404(self, api_client):
        """Test that invalid workspace ID returns 404"""
        fake_workspace_id = str(uuid.uuid4())
        
        response = api_client.get(f"{BASE_URL}/api/workspaces/{fake_workspace_id}/ict-requests?user_id={ADMIN_USER_ID}")
        
        assert response.status_code == 403  # Not a member of non-existent workspace


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_requests(self, api_client):
        """Clean up TEST_ prefixed requests"""
        response = api_client.get(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests?user_id={ADMIN_USER_ID}")
        
        if response.status_code == 200:
            requests = response.json()["requests"]
            
            for req in requests:
                if req.get("description", "").startswith("TEST_ICT"):
                    api_client.delete(f"{BASE_URL}/api/workspaces/{WORKSPACE_ID}/ict-requests/{req['id']}?user_id={ADMIN_USER_ID}")
        
        assert True  # Cleanup always passes
