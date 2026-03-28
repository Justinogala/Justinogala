"""
Test Shift Management Phase 2 Features:
- Time-Off Balance Tracking (GET/PUT)
- Time-Off Request Creation (POST)
- Time-Off Request Approval (PUT)
- PDF Export (GET)
- Swap Request Creation (POST)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data from requirements
WORKSPACE_ID = "b3478da2-7782-425a-9fa7-2dbc4f22d047"
USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"  # orgadmin user


class TestTimeOffBalance:
    """Time-Off Balance Tracking API Tests"""
    
    def test_get_time_off_balance_returns_200(self):
        """GET /api/shifts/time-off-balance/{workspace_id}/{user_id} returns balance data"""
        response = requests.get(f"{BASE_URL}/api/shifts/time-off-balance/{WORKSPACE_ID}/{USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "balance" in data
        
        balance = data["balance"]
        # Verify vacation balance structure
        assert "vacation" in balance
        assert "total" in balance["vacation"]
        assert "used" in balance["vacation"]
        assert "remaining" in balance["vacation"]
        
        # Verify sick balance structure
        assert "sick" in balance
        assert "total" in balance["sick"]
        assert "used" in balance["sick"]
        assert "remaining" in balance["sick"]
        
        # Verify personal balance structure
        assert "personal" in balance
        assert "total" in balance["personal"]
        assert "used" in balance["personal"]
        assert "remaining" in balance["personal"]
        
        print(f"✓ Time-off balance retrieved: Vacation={balance['vacation']['remaining']}/{balance['vacation']['total']}, "
              f"Sick={balance['sick']['remaining']}/{balance['sick']['total']}, "
              f"Personal={balance['personal']['remaining']}/{balance['personal']['total']}")
    
    def test_get_time_off_balance_auto_creates_default(self):
        """GET balance for new user auto-creates default allocation (15/10/5)"""
        # Use a test user ID that likely doesn't have balance yet
        test_user_id = "test-user-balance-check-" + datetime.now().strftime("%Y%m%d%H%M%S")
        response = requests.get(f"{BASE_URL}/api/shifts/time-off-balance/{WORKSPACE_ID}/{test_user_id}")
        
        # Should still return 200 with default values
        assert response.status_code == 200
        data = response.json()
        
        # Default values should be vacation:15, sick:10, personal:5
        balance = data.get("balance", {})
        assert balance.get("vacation", {}).get("total") == 15, "Default vacation should be 15"
        assert balance.get("sick", {}).get("total") == 10, "Default sick should be 10"
        assert balance.get("personal", {}).get("total") == 5, "Default personal should be 5"
        print("✓ Default balance auto-created for new user")
    
    def test_update_time_off_balance(self):
        """PUT /api/shifts/time-off-balance updates allocated days"""
        update_data = {
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "vacation_total": 20,
            "sick_total": 12,
            "personal_total": 7
        }
        
        response = requests.put(f"{BASE_URL}/api/shifts/time-off-balance", json=update_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        
        # Verify the update by fetching balance again
        verify_response = requests.get(f"{BASE_URL}/api/shifts/time-off-balance/{WORKSPACE_ID}/{USER_ID}")
        verify_data = verify_response.json()
        balance = verify_data.get("balance", {})
        
        assert balance.get("vacation", {}).get("total") == 20, "Vacation total should be updated to 20"
        assert balance.get("sick", {}).get("total") == 12, "Sick total should be updated to 12"
        assert balance.get("personal", {}).get("total") == 7, "Personal total should be updated to 7"
        
        print("✓ Time-off balance updated successfully")
        
        # Reset to default values
        reset_data = {
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "vacation_total": 15,
            "sick_total": 10,
            "personal_total": 5
        }
        requests.put(f"{BASE_URL}/api/shifts/time-off-balance", json=reset_data)


class TestTimeOffRequests:
    """Time-Off Request CRUD Tests"""
    
    def test_create_time_off_request(self):
        """POST /api/shifts/time-off creates a new time off request"""
        # Create a time-off request for next week
        start_date = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
        
        request_data = {
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "start_date": start_date,
            "end_date": end_date,
            "type": "sick",
            "reason": "TEST_Medical appointment"
        }
        
        response = requests.post(f"{BASE_URL}/api/shifts/time-off", json=request_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "request" in data
        
        created_request = data["request"]
        assert created_request.get("workspace_id") == WORKSPACE_ID
        assert created_request.get("user_id") == USER_ID
        assert created_request.get("start_date") == start_date
        assert created_request.get("end_date") == end_date
        assert created_request.get("type") == "sick"
        assert created_request.get("status") == "pending"
        assert "id" in created_request
        
        print(f"✓ Time-off request created: {created_request['id']} ({start_date} to {end_date})")
        
        # Store for cleanup
        return created_request["id"]
    
    def test_get_time_off_requests_for_workspace(self):
        """GET /api/shifts/time-off/{workspace_id} returns all requests"""
        response = requests.get(f"{BASE_URL}/api/shifts/time-off/{WORKSPACE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "requests" in data
        assert isinstance(data["requests"], list)
        
        print(f"✓ Retrieved {len(data['requests'])} time-off requests for workspace")
    
    def test_approve_time_off_request(self):
        """PUT /api/shifts/time-off/{request_id}/approve approves a request"""
        # First create a request to approve
        start_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=15)).strftime("%Y-%m-%d")
        
        create_data = {
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "start_date": start_date,
            "end_date": end_date,
            "type": "personal",
            "reason": "TEST_Personal day for approval test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/shifts/time-off", json=create_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["request"]["id"]
        
        # Now approve it
        approve_response = requests.put(f"{BASE_URL}/api/shifts/time-off/{request_id}/approve")
        assert approve_response.status_code == 200, f"Expected 200, got {approve_response.status_code}: {approve_response.text}"
        
        data = approve_response.json()
        assert data.get("success") is True
        assert data.get("status") == "approved"
        
        print(f"✓ Time-off request {request_id} approved successfully")
    
    def test_reject_time_off_request(self):
        """PUT /api/shifts/time-off/{request_id}/reject rejects a request"""
        # First create a request to reject
        start_date = (datetime.now() + timedelta(days=21)).strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=22)).strftime("%Y-%m-%d")
        
        create_data = {
            "workspace_id": WORKSPACE_ID,
            "user_id": USER_ID,
            "start_date": start_date,
            "end_date": end_date,
            "type": "vacation",
            "reason": "TEST_Vacation for rejection test"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/shifts/time-off", json=create_data)
        assert create_response.status_code == 200
        request_id = create_response.json()["request"]["id"]
        
        # Now reject it
        reject_response = requests.put(f"{BASE_URL}/api/shifts/time-off/{request_id}/reject")
        assert reject_response.status_code == 200, f"Expected 200, got {reject_response.status_code}: {reject_response.text}"
        
        data = reject_response.json()
        assert data.get("success") is True
        assert data.get("status") == "rejected"
        
        print(f"✓ Time-off request {request_id} rejected successfully")


class TestPdfExport:
    """PDF Export API Tests"""
    
    def test_export_pdf_returns_html(self):
        """GET /api/shifts/export-pdf/{workspace_id} returns HTML PDF report"""
        response = requests.get(f"{BASE_URL}/api/shifts/export-pdf/{WORKSPACE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is HTML
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type, f"Expected text/html, got {content_type}"
        
        # Check Content-Disposition header for download
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, f"Expected attachment header, got {content_disposition}"
        assert "shifts_report" in content_disposition, "Filename should contain 'shifts_report'"
        
        # Verify HTML content
        html_content = response.text
        assert "<!DOCTYPE html>" in html_content or "<html>" in html_content, "Response should be valid HTML"
        assert "Shift Report" in html_content, "HTML should contain 'Shift Report' title"
        
        print(f"✓ PDF export returned HTML report ({len(html_content)} bytes)")
    
    def test_export_pdf_with_date_range(self):
        """GET /api/shifts/export-pdf with date filters"""
        start_date = datetime.now().strftime("%Y-%m-%d")
        end_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
        
        response = requests.get(
            f"{BASE_URL}/api/shifts/export-pdf/{WORKSPACE_ID}",
            params={"start_date": start_date, "end_date": end_date}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        html_content = response.text
        assert start_date in html_content or "Period:" in html_content, "Date range should be in report"
        
        print(f"✓ PDF export with date range ({start_date} to {end_date}) successful")


class TestSwapRequests:
    """Swap Request API Tests"""
    
    def test_create_swap_request_requires_shift(self):
        """POST /api/shifts/swap-request requires valid shift_id"""
        # First, we need to get or create a shift assigned to the user
        # Get existing shifts for the workspace
        shifts_response = requests.get(f"{BASE_URL}/api/shifts/workspace/{WORKSPACE_ID}")
        assert shifts_response.status_code == 200
        
        shifts = shifts_response.json().get("shifts", [])
        user_shift = None
        
        # Find a shift assigned to our test user
        for shift in shifts:
            if shift.get("assigned_to") == USER_ID:
                user_shift = shift
                break
        
        if not user_shift:
            # Create a shift for the user
            shift_data = {
                "workspace_id": WORKSPACE_ID,
                "assigned_to": USER_ID,
                "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
                "start_time": "09:00",
                "end_time": "17:00",
                "role": "Test Role"
            }
            create_shift_response = requests.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
            assert create_shift_response.status_code == 200
            user_shift = create_shift_response.json().get("shift")
        
        # Now create a swap request
        # We need another user to swap with - use a dummy target
        swap_data = {
            "shift_id": user_shift["id"],
            "requester_id": USER_ID,
            "target_user_id": "target-user-for-swap-test",
            "reason": "TEST_Need to swap for personal reasons"
        }
        
        response = requests.post(f"{BASE_URL}/api/shifts/swap-request", json=swap_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "request" in data
        
        swap_request = data["request"]
        assert swap_request.get("shift_id") == user_shift["id"]
        assert swap_request.get("requester_id") == USER_ID
        assert swap_request.get("status") == "pending"
        
        print(f"✓ Swap request created: {swap_request['id']}")
    
    def test_create_swap_request_invalid_shift_returns_404(self):
        """POST /api/shifts/swap-request with invalid shift returns 404"""
        swap_data = {
            "shift_id": "non-existent-shift-id",
            "requester_id": USER_ID,
            "target_user_id": "some-target-user",
            "reason": "Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/shifts/swap-request", json=swap_data)
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid shift returns 404 as expected")
    
    def test_get_swap_requests_for_workspace(self):
        """GET /api/shifts/swap-requests/{workspace_id} returns all swap requests"""
        response = requests.get(f"{BASE_URL}/api/shifts/swap-requests/{WORKSPACE_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "requests" in data
        assert isinstance(data["requests"], list)
        
        print(f"✓ Retrieved {len(data['requests'])} swap requests for workspace")


class TestPhase1Regression:
    """Regression tests for Phase 1 Time Clock features"""
    
    def test_time_clock_status_endpoint(self):
        """GET /api/time-clock/status/{workspace_id}/{user_id} still works"""
        response = requests.get(f"{BASE_URL}/api/time-clock/status/{WORKSPACE_ID}/{USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Time clock status returns clocked_in field (not success field)
        assert "clocked_in" in data, "Response should contain clocked_in field"
        
        print(f"✓ Time clock status endpoint working (clocked_in={data.get('clocked_in')})")
    
    def test_time_clock_history_endpoint(self):
        """GET /api/time-clock/history/{workspace_id}/{user_id} still works"""
        response = requests.get(f"{BASE_URL}/api/time-clock/history/{WORKSPACE_ID}/{USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Time clock history returns entries field (not success field)
        assert "entries" in data, "Response should contain entries field"
        
        print(f"✓ Time clock history endpoint working ({len(data.get('entries', []))} entries)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
