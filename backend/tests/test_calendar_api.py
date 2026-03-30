"""
Calendar API Tests
Tests for calendar event CRUD operations and meeting invitation functionality
"""
import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-audit-hub-1.preview.emergentagent.com')

class TestCalendarAPI:
    """Calendar endpoint tests"""
    
    # Test user credentials
    admin_email = "admin@munal.com"
    admin_password = "Admin@123456"
    test_user_id = None
    auth_token = None
    created_event_id = None
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID before tests"""
        # Login to get user ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": self.admin_email,
            "password": self.admin_password
        })
        if response.status_code == 200:
            data = response.json()
            self.__class__.test_user_id = data.get("user", {}).get("id")
            self.__class__.auth_token = data.get("token")
    
    def test_01_get_calendar_events_empty(self):
        """GET /api/calendar/events - Get events for user"""
        assert self.test_user_id, "User ID not available - login may have failed"
        
        response = requests.get(f"{BASE_URL}/api/calendar/events", params={
            "user_id": self.test_user_id
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "events" in data
        assert "total" in data
        assert isinstance(data["events"], list)
        print(f"✓ GET /api/calendar/events returned {data['total']} events")
    
    def test_02_create_calendar_event(self):
        """POST /api/calendar/events - Create new event with invitees"""
        assert self.test_user_id, "User ID not available - login may have failed"
        
        # Calculate start and end time (tomorrow at 10am for 1 hour)
        tomorrow = datetime.now() + timedelta(days=1)
        start_time = tomorrow.replace(hour=10, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=1)
        
        event_data = {
            "title": "TEST_Calendar_Event",
            "description": "Test event created by pytest",
            "start_time": start_time.isoformat() + "Z",
            "end_time": end_time.isoformat() + "Z",
            "all_day": False,
            "location": "Virtual Meeting Room",
            "color": "blue",
            "category": "meeting",
            "recurrence": None,
            "video_call": True,
            "invitees": [],  # Empty for basic test
            "created_by": self.test_user_id
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "event" in data
        assert data["event"]["title"] == "TEST_Calendar_Event"
        assert data["event"]["video_call"] == True
        assert "video_call_link" in data["event"]  # Should be generated when video_call=True
        
        # Store event ID for later tests
        self.__class__.created_event_id = data["event"]["id"]
        print(f"✓ POST /api/calendar/events created event ID: {self.created_event_id}")
    
    def test_03_get_single_event(self):
        """GET /api/calendar/events/{id} - Get single event by ID"""
        assert self.created_event_id, "No event ID - create test may have failed"
        
        response = requests.get(f"{BASE_URL}/api/calendar/events/{self.created_event_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["id"] == self.created_event_id
        assert data["title"] == "TEST_Calendar_Event"
        print(f"✓ GET /api/calendar/events/{self.created_event_id} returned event")
    
    def test_04_update_calendar_event(self):
        """PUT /api/calendar/events/{id} - Update event"""
        assert self.created_event_id, "No event ID - create test may have failed"
        
        update_data = {
            "title": "TEST_Calendar_Event_Updated",
            "location": "New Virtual Room",
            "color": "green"
        }
        
        response = requests.put(f"{BASE_URL}/api/calendar/events/{self.created_event_id}", json=update_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data["event"]["title"] == "TEST_Calendar_Event_Updated"
        assert data["event"]["color"] == "green"
        print(f"✓ PUT /api/calendar/events/{self.created_event_id} updated successfully")
    
    def test_05_get_events_with_date_filter(self):
        """GET /api/calendar/events with date range filter"""
        assert self.test_user_id, "User ID not available"
        
        # Get events for the next 30 days
        now = datetime.now()
        start_date = now.isoformat() + "Z"
        end_date = (now + timedelta(days=30)).isoformat() + "Z"
        
        response = requests.get(f"{BASE_URL}/api/calendar/events", params={
            "user_id": self.test_user_id,
            "start_date": start_date,
            "end_date": end_date
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "events" in data
        print(f"✓ GET /api/calendar/events with date filter returned {data['total']} events")
    
    def test_06_create_event_with_invitees(self):
        """POST /api/calendar/events - Create event with invitees (email notification)"""
        assert self.test_user_id, "User ID not available"
        
        # First get list of users to invite
        users_response = requests.get(f"{BASE_URL}/api/users")
        if users_response.status_code != 200:
            pytest.skip("Could not fetch users list")
        
        users = users_response.json().get("users", [])
        other_users = [u for u in users if u.get("id") != self.test_user_id]
        
        if not other_users:
            pytest.skip("No other users available to invite")
        
        invitee_id = other_users[0]["id"]
        
        # Create event with invitee
        tomorrow = datetime.now() + timedelta(days=2)
        start_time = tomorrow.replace(hour=14, minute=0, second=0, microsecond=0)
        end_time = start_time + timedelta(hours=1)
        
        event_data = {
            "title": "TEST_Meeting_With_Invitee",
            "description": "Test meeting with email invitation",
            "start_time": start_time.isoformat() + "Z",
            "end_time": end_time.isoformat() + "Z",
            "all_day": False,
            "location": "Conference Room A",
            "color": "purple",
            "category": "meeting",
            "video_call": True,
            "invitees": [invitee_id],
            "created_by": self.test_user_id
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert len(data["event"]["invitees"]) == 1
        assert data["event"]["invitees"][0]["user_id"] == invitee_id
        assert data["event"]["invitees"][0]["status"] == "pending"
        
        # Store for cleanup
        event_id_with_invitee = data["event"]["id"]
        print(f"✓ POST /api/calendar/events with invitee created event ID: {event_id_with_invitee}")
        print(f"  Invitee: {data['event']['invitees'][0].get('email')}")
        
        # Cleanup - delete this event
        requests.delete(f"{BASE_URL}/api/calendar/events/{event_id_with_invitee}")
    
    def test_07_get_upcoming_events(self):
        """GET /api/calendar/upcoming - Dashboard widget endpoint"""
        assert self.test_user_id, "User ID not available"
        
        response = requests.get(f"{BASE_URL}/api/calendar/upcoming", params={
            "user_id": self.test_user_id,
            "limit": 5
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "events" in data
        print(f"✓ GET /api/calendar/upcoming returned {len(data['events'])} upcoming events")
    
    def test_08_delete_calendar_event(self):
        """DELETE /api/calendar/events/{id} - Delete event"""
        assert self.created_event_id, "No event ID - create test may have failed"
        
        response = requests.delete(f"{BASE_URL}/api/calendar/events/{self.created_event_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ DELETE /api/calendar/events/{self.created_event_id} deleted successfully")
        
        # Verify event is deleted
        get_response = requests.get(f"{BASE_URL}/api/calendar/events/{self.created_event_id}")
        assert get_response.status_code == 404
        print(f"  Verified event is no longer accessible (404)")
    
    def test_09_delete_nonexistent_event(self):
        """DELETE /api/calendar/events/{id} - Delete non-existent event returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.delete(f"{BASE_URL}/api/calendar/events/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE /api/calendar/events/{fake_id} correctly returned 404")
    
    def test_10_get_nonexistent_event(self):
        """GET /api/calendar/events/{id} - Get non-existent event returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/calendar/events/{fake_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ GET /api/calendar/events/{fake_id} correctly returned 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
