"""
Shift Management API Tests
Testing all shift CRUD operations and related endpoints
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://munal-system-updates.preview.emergentagent.com').rstrip('/')
TEST_WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"

# Test credentials
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"


class TestShiftManagementAPI:
    """Test shift management endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_shift_ids = []
        yield
        # Cleanup created shifts
        for shift_id in self.created_shift_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/shifts/{shift_id}")
            except:
                pass
    
    def get_auth_token(self):
        """Get authentication token for admin user"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        return None

    # ============== Health Check ==============
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "healthy"
        print("✓ Health check passed - API and database healthy")

    # ============== Shift CRUD Tests ==============
    
    def test_create_shift(self):
        """Test creating a new shift"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        shift_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "date": tomorrow,
            "start_time": "09:00",
            "end_time": "17:00",
            "role": "TEST_Cashier",
            "department": "Sales",
            "notes": "Test shift created by automated tests",
            "color": "#6366f1"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
        assert response.status_code == 200, f"Failed to create shift: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "shift" in data
        
        shift = data["shift"]
        assert shift["workspace_id"] == TEST_WORKSPACE_ID
        assert shift["date"] == tomorrow
        assert shift["start_time"] == "09:00"
        assert shift["end_time"] == "17:00"
        assert shift["role"] == "TEST_Cashier"
        assert "id" in shift
        
        # Store for cleanup
        self.created_shift_ids.append(shift["id"])
        print(f"✓ Shift created successfully with ID: {shift['id']}")
        
        return shift
    
    def test_create_shift_with_hours_calculation(self):
        """Test that shift hours are calculated correctly"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        shift_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "date": tomorrow,
            "start_time": "08:00",
            "end_time": "16:30",
            "role": "TEST_Manager"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
        assert response.status_code == 200
        
        data = response.json()
        shift = data["shift"]
        
        # 8:00 to 16:30 = 8.5 hours
        assert shift["hours"] == 8.5, f"Expected 8.5 hours, got {shift['hours']}"
        
        self.created_shift_ids.append(shift["id"])
        print(f"✓ Hours calculation correct: {shift['hours']} hours")
    
    def test_get_workspace_shifts(self):
        """Test getting all shifts for a workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/workspace/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "shifts" in data
        assert "users" in data
        assert "total" in data
        
        print(f"✓ Retrieved {data['total']} shifts for workspace")
    
    def test_get_workspace_shifts_with_date_filter(self):
        """Test getting shifts with date filters"""
        today = datetime.now().strftime("%Y-%m-%d")
        next_week = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/shifts/workspace/{TEST_WORKSPACE_ID}",
            params={"start_date": today, "end_date": next_week}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"✓ Date filter working - Retrieved {data['total']} shifts")
    
    def test_get_single_shift(self):
        """Test getting a single shift by ID"""
        # First create a shift
        shift = self.test_create_shift()
        shift_id = shift["id"]
        
        # Get the shift
        response = self.session.get(f"{BASE_URL}/api/shifts/{shift_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["shift"]["id"] == shift_id
        print(f"✓ Retrieved single shift: {shift_id}")
    
    def test_update_shift(self):
        """Test updating a shift"""
        # First create a shift
        shift = self.test_create_shift()
        shift_id = shift["id"]
        
        # Update the shift
        update_data = {
            "role": "TEST_Manager_Updated",
            "start_time": "10:00",
            "end_time": "18:00"
        }
        
        response = self.session.put(f"{BASE_URL}/api/shifts/{shift_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["shift"]["role"] == "TEST_Manager_Updated"
        assert data["shift"]["start_time"] == "10:00"
        
        # Verify with GET
        verify_response = self.session.get(f"{BASE_URL}/api/shifts/{shift_id}")
        verify_data = verify_response.json()
        assert verify_data["shift"]["role"] == "TEST_Manager_Updated"
        
        print(f"✓ Shift updated successfully")
    
    def test_delete_shift(self):
        """Test deleting a shift"""
        # First create a shift
        tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        shift_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "date": tomorrow,
            "start_time": "09:00",
            "end_time": "17:00",
            "role": "TEST_ToDelete"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
        assert response.status_code == 200
        shift_id = response.json()["shift"]["id"]
        
        # Delete the shift
        delete_response = self.session.delete(f"{BASE_URL}/api/shifts/{shift_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        assert data["deleted_count"] == 1
        
        # Verify shift is deleted
        verify_response = self.session.get(f"{BASE_URL}/api/shifts/{shift_id}")
        assert verify_response.status_code == 404
        
        print(f"✓ Shift deleted successfully")
    
    def test_duplicate_shift(self):
        """Test duplicating a shift"""
        # First create a shift
        shift = self.test_create_shift()
        shift_id = shift["id"]
        
        # Duplicate to a new date
        new_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        response = self.session.post(f"{BASE_URL}/api/shifts/{shift_id}/duplicate?new_date={new_date}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["shift"]["date"] == new_date
        assert data["shift"]["id"] != shift_id
        
        self.created_shift_ids.append(data["shift"]["id"])
        print(f"✓ Shift duplicated to {new_date}")

    # ============== Summary & Hours Tests ==============
    
    def test_get_workspace_summary(self):
        """Test getting workspace shift summary"""
        response = self.session.get(f"{BASE_URL}/api/shifts/summary/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "summary" in data
        
        summary = data["summary"]
        assert "today_shifts" in summary
        assert "week_total_hours" in summary
        assert "active_users" in summary
        assert "pending_swap_requests" in summary
        assert "pending_timeoff_requests" in summary
        
        print(f"✓ Summary retrieved: Today={summary['today_shifts']} shifts, Week={summary['week_total_hours']}h")

    # ============== Swap Request Tests ==============
    
    def test_get_swap_requests(self):
        """Test getting swap requests for a workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/swap-requests/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "requests" in data
        
        print(f"✓ Retrieved {len(data['requests'])} swap requests")

    # ============== Time Off Request Tests ==============
    
    def test_get_time_off_requests(self):
        """Test getting time off requests for a workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/time-off/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "requests" in data
        
        print(f"✓ Retrieved {len(data['requests'])} time off requests")

    # ============== Export Tests ==============
    
    def test_export_shifts_json(self):
        """Test exporting shifts as JSON"""
        response = self.session.get(f"{BASE_URL}/api/shifts/export/{TEST_WORKSPACE_ID}?format=json")
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        print("✓ JSON export working")
    
    def test_export_shifts_csv(self):
        """Test exporting shifts as CSV"""
        response = self.session.get(f"{BASE_URL}/api/shifts/export/{TEST_WORKSPACE_ID}?format=csv")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        print("✓ CSV export working")

    # ============== Roles & Departments Tests ==============
    
    def test_get_workspace_roles(self):
        """Test getting unique roles used in workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/roles/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "roles" in data
        
        print(f"✓ Retrieved {len(data['roles'])} roles")
    
    def test_get_workspace_departments(self):
        """Test getting unique departments used in workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/departments/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "departments" in data
        
        print(f"✓ Retrieved {len(data['departments'])} departments")

    # ============== Error Handling Tests ==============
    
    def test_get_nonexistent_shift_returns_404(self):
        """Test that getting a non-existent shift returns 404"""
        response = self.session.get(f"{BASE_URL}/api/shifts/nonexistent-shift-id-12345")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent shift")
    
    def test_update_nonexistent_shift_returns_404(self):
        """Test that updating a non-existent shift returns 404"""
        response = self.session.put(
            f"{BASE_URL}/api/shifts/nonexistent-shift-id-12345",
            json={"role": "Test"}
        )
        assert response.status_code == 404
        print("✓ 404 returned for updating non-existent shift")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
