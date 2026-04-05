"""
P1 Shift Management Features Tests
Tests for: Custom Shift Presets and Clock In/Out functionality
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://munal-app-release.preview.emergentagent.com').rstrip('/')
TEST_WORKSPACE_ID = "09d5860a-d822-4597-962d-a787f643cd0f"

# Admin user credentials
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"


class TestShiftPresetsAPI:
    """Test custom shift presets CRUD operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_preset_ids = []
        yield
        # Cleanup created presets
        for preset_id in self.created_preset_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/shifts/presets/{preset_id}")
            except:
                pass
    
    def test_get_shift_presets(self):
        """Test getting shift presets for a workspace"""
        response = self.session.get(f"{BASE_URL}/api/shifts/presets/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "presets" in data
        assert isinstance(data["presets"], list)
        
        print(f"✓ Retrieved {len(data['presets'])} presets")
        return data["presets"]
    
    def test_create_shift_preset(self):
        """Test creating a custom shift preset"""
        preset_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "name": "TEST_Early Morning",
            "start_time": "05:00",
            "end_time": "13:00",
            "color": "#f59e0b",
            "icon": "🌅"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/presets", json=preset_data)
        assert response.status_code == 200, f"Failed to create preset: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "preset" in data
        
        preset = data["preset"]
        assert preset["name"] == "TEST_Early Morning"
        assert preset["start_time"] == "05:00"
        assert preset["end_time"] == "13:00"
        assert preset["color"] == "#f59e0b"
        assert preset["icon"] == "🌅"
        assert preset["is_default"] == False
        assert "id" in preset
        
        self.created_preset_ids.append(preset["id"])
        print(f"✓ Preset created successfully: {preset['name']} ({preset['id']})")
        return preset
    
    def test_create_preset_and_verify_persistence(self):
        """Test that created preset persists in the database"""
        # Create a preset
        preset = self.test_create_shift_preset()
        preset_id = preset["id"]
        
        # Fetch presets and verify it exists
        response = self.session.get(f"{BASE_URL}/api/shifts/presets/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        preset_names = [p["name"] for p in data["presets"]]
        assert "TEST_Early Morning" in preset_names
        
        print(f"✓ Preset persistence verified")
    
    def test_delete_shift_preset(self):
        """Test deleting a shift preset"""
        # First create a preset
        preset_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "name": "TEST_ToDelete",
            "start_time": "10:00",
            "end_time": "18:00",
            "color": "#ef4444",
            "icon": "❌"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/presets", json=preset_data)
        assert response.status_code == 200
        preset_id = response.json()["preset"]["id"]
        
        # Delete the preset
        delete_response = self.session.delete(f"{BASE_URL}/api/shifts/presets/{preset_id}")
        assert delete_response.status_code == 200
        
        data = delete_response.json()
        assert data["success"] == True
        
        # Verify preset is deleted
        verify_response = self.session.get(f"{BASE_URL}/api/shifts/presets/{TEST_WORKSPACE_ID}")
        preset_ids = [p["id"] for p in verify_response.json()["presets"]]
        assert preset_id not in preset_ids
        
        print(f"✓ Preset deleted successfully")
    
    def test_update_shift_preset(self):
        """Test updating a shift preset"""
        # First create a preset
        preset = self.test_create_shift_preset()
        preset_id = preset["id"]
        
        # Update the preset
        update_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "name": "TEST_Updated Name",
            "start_time": "06:00",
            "end_time": "14:00",
            "color": "#10b981",
            "icon": "🌞"
        }
        
        response = self.session.put(f"{BASE_URL}/api/shifts/presets/{preset_id}", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["preset"]["name"] == "TEST_Updated Name"
        assert data["preset"]["start_time"] == "06:00"
        
        print(f"✓ Preset updated successfully")
    
    def test_delete_nonexistent_preset_returns_404(self):
        """Test that deleting non-existent preset returns 404"""
        response = self.session.delete(f"{BASE_URL}/api/shifts/presets/nonexistent-preset-id-12345")
        assert response.status_code == 404
        print("✓ 404 returned for non-existent preset")


class TestClockInOutAPI:
    """Test clock in/out functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.created_shift_ids = []
        self.admin_user_id = None
        
        # Get admin user ID
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if login_response.status_code == 200:
            user_data = login_response.json()
            self.admin_user_id = user_data.get("user", {}).get("id")
        
        yield
        
        # Cleanup created shifts
        for shift_id in self.created_shift_ids:
            try:
                self.session.delete(f"{BASE_URL}/api/shifts/{shift_id}")
            except:
                pass
    
    def create_shift_for_today(self, assigned_to=None):
        """Helper to create a shift for today"""
        today = datetime.now().strftime("%Y-%m-%d")
        shift_data = {
            "workspace_id": TEST_WORKSPACE_ID,
            "assigned_to": assigned_to,
            "date": today,
            "start_time": "09:00",
            "end_time": "17:00",
            "role": "TEST_ClockInOut",
            "department": "Test"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/create", json=shift_data)
        assert response.status_code == 200
        shift = response.json()["shift"]
        self.created_shift_ids.append(shift["id"])
        return shift
    
    def test_clock_in(self):
        """Test clocking in to a shift"""
        if not self.admin_user_id:
            pytest.skip("Admin user ID not available")
        
        # Create a shift assigned to admin for today
        shift = self.create_shift_for_today(assigned_to=self.admin_user_id)
        
        # Clock in
        clock_data = {
            "shift_id": shift["id"],
            "user_id": self.admin_user_id,
            "action": "in",
            "location": "Office",
            "notes": "Test clock in"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_data)
        assert response.status_code == 200, f"Clock in failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["action"] == "clock_in"
        assert "entry" in data
        assert data["message"] == "Clocked in successfully"
        
        print(f"✓ Clocked in successfully for shift {shift['id']}")
        return data
    
    def test_clock_out(self):
        """Test clocking out of a shift"""
        if not self.admin_user_id:
            pytest.skip("Admin user ID not available")
        
        # Create a shift and clock in first
        shift = self.create_shift_for_today(assigned_to=self.admin_user_id)
        
        # Clock in
        clock_in_data = {
            "shift_id": shift["id"],
            "user_id": self.admin_user_id,
            "action": "in"
        }
        clock_in_response = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_in_data)
        assert clock_in_response.status_code == 200
        
        # Clock out
        clock_out_data = {
            "shift_id": shift["id"],
            "user_id": self.admin_user_id,
            "action": "out",
            "location": "Office",
            "notes": "Test clock out"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_out_data)
        assert response.status_code == 200, f"Clock out failed: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert data["action"] == "clock_out"
        assert "duration_minutes" in data
        assert "duration_hours" in data
        
        print(f"✓ Clocked out successfully - worked {data['duration_hours']} hours")
    
    def test_get_clock_status(self):
        """Test getting clock status for a shift"""
        if not self.admin_user_id:
            pytest.skip("Admin user ID not available")
        
        # Create a shift
        shift = self.create_shift_for_today(assigned_to=self.admin_user_id)
        
        # Check status before clock in
        response = self.session.get(f"{BASE_URL}/api/shifts/clock/status/{shift['id']}/{self.admin_user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["clocked_in"] == False
        
        # Clock in
        clock_in_data = {
            "shift_id": shift["id"],
            "user_id": self.admin_user_id,
            "action": "in"
        }
        self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_in_data)
        
        # Check status after clock in
        response = self.session.get(f"{BASE_URL}/api/shifts/clock/status/{shift['id']}/{self.admin_user_id}")
        data = response.json()
        assert data["clocked_in"] == True
        assert data["entry"] is not None
        
        print(f"✓ Clock status API working correctly")
    
    def test_double_clock_in_prevented(self):
        """Test that double clock in is prevented"""
        if not self.admin_user_id:
            pytest.skip("Admin user ID not available")
        
        # Create a shift and clock in
        shift = self.create_shift_for_today(assigned_to=self.admin_user_id)
        
        clock_data = {
            "shift_id": shift["id"],
            "user_id": self.admin_user_id,
            "action": "in"
        }
        
        # First clock in - should succeed
        response1 = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_data)
        assert response1.status_code == 200
        
        # Second clock in - should fail
        response2 = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_data)
        assert response2.status_code == 400
        
        print(f"✓ Double clock in correctly prevented")
    
    def test_clock_in_unauthorized_user(self):
        """Test that unauthorized user cannot clock in to others shift"""
        if not self.admin_user_id:
            pytest.skip("Admin user ID not available")
        
        # Create a shift assigned to admin
        shift = self.create_shift_for_today(assigned_to=self.admin_user_id)
        
        # Try to clock in with a different user
        clock_data = {
            "shift_id": shift["id"],
            "user_id": "different-user-id-12345",
            "action": "in"
        }
        
        response = self.session.post(f"{BASE_URL}/api/shifts/clock", json=clock_data)
        assert response.status_code == 403
        
        print(f"✓ Unauthorized clock in correctly prevented")


class TestTimesheetAPI:
    """Test timesheet functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_workspace_timesheet(self):
        """Test getting workspace timesheet"""
        response = self.session.get(f"{BASE_URL}/api/shifts/timesheet/{TEST_WORKSPACE_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "period" in data
        assert "users" in data
        assert "total_minutes" in data
        assert "total_hours" in data
        assert "user_count" in data
        
        print(f"✓ Timesheet retrieved: {data['total_hours']}h total, {data['user_count']} users")
    
    def test_get_timesheet_with_date_range(self):
        """Test getting timesheet with custom date range"""
        today = datetime.now().strftime("%Y-%m-%d")
        last_week = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        
        response = self.session.get(
            f"{BASE_URL}/api/shifts/timesheet/{TEST_WORKSPACE_ID}",
            params={"start_date": last_week, "end_date": today}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert data["period"]["start"] == last_week
        assert data["period"]["end"] == today
        
        print(f"✓ Timesheet with date range working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
