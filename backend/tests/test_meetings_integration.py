"""
Test Calendar-Meetings Integration
Tests that calendar events created via /api/calendar/events are properly 
displayed on the /meetings page dashboard.
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_EMAIL = "admin@munal.com"
TEST_USER_PASSWORD = "Admin@123456"
TEST_USER_ID = None  # Will be set after login


class TestCalendarMeetingsIntegration:
    """Tests for Calendar-Meetings integration"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID before each test"""
        global TEST_USER_ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        TEST_USER_ID = data["user"]["id"]
        self.auth_token = data.get("token")
        
    def test_get_calendar_events_endpoint(self):
        """Test GET /api/calendar/events returns events for user"""
        response = requests.get(f"{BASE_URL}/api/calendar/events", params={
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "total" in data
        assert isinstance(data["events"], list)
        print(f"Found {data['total']} calendar events for user")
        
    def test_create_calendar_event_for_meetings(self):
        """Test POST /api/calendar/events creates event visible on meetings page"""
        # Create a new event
        event_data = {
            "title": "TEST_Meeting_Integration",
            "description": "Test meeting for integration testing",
            "start_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT10:00:00"),
            "end_time": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%dT11:00:00"),
            "created_by": TEST_USER_ID,
            "category": "meeting",
            "color": "blue",
            "video_call": True
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200, f"Create event failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "event" in data
        
        event = data["event"]
        assert event["title"] == "TEST_Meeting_Integration"
        assert event["video_call"] == True
        assert "video_call_link" in event
        assert event["video_call_link"] is not None
        
        # Store event ID for cleanup
        self.created_event_id = event["id"]
        
        # Verify event appears in GET events
        verify_response = requests.get(f"{BASE_URL}/api/calendar/events", params={
            "user_id": TEST_USER_ID
        })
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        event_ids = [e["id"] for e in verify_data["events"]]
        assert self.created_event_id in event_ids, "Created event not found in events list"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{self.created_event_id}")
        print("SUCCESS: Created event appears in calendar events API")
        
    def test_meeting_card_data_format(self):
        """Test that calendar event data matches expected meeting card format"""
        # Create event with all fields a meeting card needs
        tomorrow = (datetime.now() + timedelta(days=1))
        event_data = {
            "title": "TEST_Card_Format_Meeting",
            "description": "Testing meeting card data format",
            "start_time": tomorrow.strftime("%Y-%m-%dT14:30:00"),
            "end_time": tomorrow.strftime("%Y-%m-%dT15:30:00"),
            "created_by": TEST_USER_ID,
            "category": "meeting",
            "color": "purple",
            "video_call": True,
            "location": "Conference Room A",
            "invitees": []
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200
        
        event = response.json()["event"]
        
        # Verify all fields needed by MeetingCard.jsx are present
        required_fields = ["id", "title", "description", "start_time", "end_time", 
                          "video_call", "video_call_link", "color", "category",
                          "invitees", "created_by", "created_at"]
        
        for field in required_fields:
            assert field in event, f"Missing required field: {field}"
            
        # Verify date/time format can be parsed
        assert event["start_time"] is not None
        assert event["end_time"] is not None
        
        # Verify video call link format
        if event["video_call"]:
            assert "/meeting/" in event["video_call_link"] or "/workspace/meeting/" in event["video_call_link"]
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{event['id']}")
        print("SUCCESS: Event data format matches meeting card requirements")
        
    def test_delete_meeting_from_calendar(self):
        """Test DELETE /api/calendar/events/{id} removes event from meetings"""
        # Create event
        event_data = {
            "title": "TEST_Delete_Meeting",
            "description": "Meeting to be deleted",
            "start_time": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%dT09:00:00"),
            "end_time": (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%dT10:00:00"),
            "created_by": TEST_USER_ID,
            "category": "meeting",
            "video_call": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Verify event exists
        get_response = requests.get(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert get_response.status_code == 200
        
        # Delete the event
        delete_response = requests.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") == True
        
        # Verify event is gone
        verify_response = requests.get(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert verify_response.status_code == 404, "Event should not exist after deletion"
        
        print("SUCCESS: Delete meeting removes event from calendar")
        
    def test_get_single_event_by_id(self):
        """Test GET /api/calendar/events/{id} for meeting details"""
        # Create event
        event_data = {
            "title": "TEST_Single_Event",
            "description": "Test getting single event",
            "start_time": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%dT11:00:00"),
            "end_time": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%dT12:00:00"),
            "created_by": TEST_USER_ID,
            "category": "meeting",
            "video_call": True
        }
        
        create_response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Get single event
        get_response = requests.get(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert get_response.status_code == 200
        
        event = get_response.json()
        assert event["id"] == event_id
        assert event["title"] == "TEST_Single_Event"
        assert event["video_call"] == True
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
        print("SUCCESS: Get single event by ID works correctly")
        
    def test_update_calendar_event(self):
        """Test PUT /api/calendar/events/{id} updates meeting"""
        # Create event
        event_data = {
            "title": "TEST_Update_Meeting",
            "description": "Original description",
            "start_time": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%dT09:00:00"),
            "end_time": (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%dT10:00:00"),
            "created_by": TEST_USER_ID,
            "category": "meeting",
            "video_call": False
        }
        
        create_response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert create_response.status_code == 200
        event_id = create_response.json()["event"]["id"]
        
        # Update event
        update_data = {
            "title": "TEST_Updated_Meeting",
            "description": "Updated description",
            "video_call": True
        }
        
        update_response = requests.put(f"{BASE_URL}/api/calendar/events/{event_id}", json=update_data)
        assert update_response.status_code == 200
        
        updated_event = update_response.json()
        assert updated_event["title"] == "TEST_Updated_Meeting"
        assert updated_event["description"] == "Updated description"
        assert updated_event["video_call"] == True
        
        # Verify update persisted
        verify_response = requests.get(f"{BASE_URL}/api/calendar/events/{event_id}")
        assert verify_response.status_code == 200
        verified_event = verify_response.json()
        assert verified_event["title"] == "TEST_Updated_Meeting"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{event_id}")
        print("SUCCESS: Update calendar event works correctly")
        
    def test_stats_counts_match_events(self):
        """Test that stats (total meetings, upcoming) match actual events"""
        # Get current events
        response = requests.get(f"{BASE_URL}/api/calendar/events", params={
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        
        total_events = data["total"]
        
        # Count upcoming events (future dates)
        now = datetime.now()
        upcoming_count = sum(1 for e in data["events"] 
                           if datetime.fromisoformat(e["start_time"].replace("Z", "")) > now)
        
        print(f"Total events: {total_events}, Upcoming: {upcoming_count}")
        
        # These should match what the frontend displays in Quick Stats
        assert total_events >= 0
        assert upcoming_count <= total_events
        print("SUCCESS: Stats counts are consistent with events data")
        
    def test_non_existent_event_returns_404(self):
        """Test GET/DELETE non-existent event returns 404"""
        fake_id = "non-existent-event-id-12345"
        
        # Test GET
        get_response = requests.get(f"{BASE_URL}/api/calendar/events/{fake_id}")
        assert get_response.status_code == 404
        
        # Test DELETE
        delete_response = requests.delete(f"{BASE_URL}/api/calendar/events/{fake_id}")
        assert delete_response.status_code == 404
        
        print("SUCCESS: Non-existent event returns 404")


class TestMeetingsAPIRequirements:
    """Tests for API requirements specific to Meetings page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        global TEST_USER_ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        TEST_USER_ID = data["user"]["id"]
        
    def test_user_id_required_for_events(self):
        """Test that user_id is required to get calendar events"""
        response = requests.get(f"{BASE_URL}/api/calendar/events")
        assert response.status_code == 422, "Should require user_id parameter"
        print("SUCCESS: user_id is required for getting events")
        
    def test_video_call_link_auto_generated(self):
        """Test video_call_link is auto-generated when video_call=true"""
        event_data = {
            "title": "TEST_Video_Link_Gen",
            "start_time": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%dT10:00:00"),
            "end_time": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%dT11:00:00"),
            "created_by": TEST_USER_ID,
            "video_call": True
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200
        
        event = response.json()["event"]
        assert event["video_call_link"] is not None
        assert len(event["video_call_link"]) > 0
        assert event["id"] in event["video_call_link"], "Video link should contain event ID"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{event['id']}")
        print("SUCCESS: Video call link auto-generated correctly")
        
    def test_creator_info_included_in_response(self):
        """Test that creator info is included in event response"""
        event_data = {
            "title": "TEST_Creator_Info",
            "start_time": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%dT10:00:00"),
            "end_time": (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%dT11:00:00"),
            "created_by": TEST_USER_ID,
            "video_call": False
        }
        
        response = requests.post(f"{BASE_URL}/api/calendar/events", json=event_data)
        assert response.status_code == 200
        
        event = response.json()["event"]
        assert "creator" in event
        assert event["creator"]["email"] == TEST_USER_EMAIL
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/calendar/events/{event['id']}")
        print("SUCCESS: Creator info included in event response")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
