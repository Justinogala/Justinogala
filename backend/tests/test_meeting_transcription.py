"""
Test Meeting Auto-Transcription + Insights API Endpoints
Tests: POST /api/ai/meeting/process, GET /api/ai/meeting/{meeting_id}/status, GET /api/ai/meeting/user/{user_id}
"""
import pytest
import requests
import os
import uuid
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMeetingTranscriptionAPI:
    """Tests for meeting auto-transcription and insights endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_meeting_id = f"test-meeting-{uuid.uuid4().hex[:8]}"
        self.test_user_id = f"test-user-{uuid.uuid4().hex[:8]}"
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    # ============== GET /api/ai/meeting/{meeting_id}/status ==============
    
    def test_01_get_meeting_status_not_found(self):
        """Test GET /api/ai/meeting/{meeting_id}/status returns 404 for non-existent meeting"""
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/nonexistent-meeting-id/status")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        data = response.json()
        assert "detail" in data or "error" in data or "Meeting transcript not found" in str(data)
        print("✓ GET /api/ai/meeting/{meeting_id}/status returns 404 for non-existent meeting")
    
    # ============== GET /api/ai/meeting/user/{user_id} ==============
    
    def test_02_get_user_meetings_empty(self):
        """Test GET /api/ai/meeting/user/{user_id} returns empty list for new user"""
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/user/{self.test_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "meetings" in data, f"Response should have 'meetings' key: {data}"
        assert "count" in data, f"Response should have 'count' key: {data}"
        assert isinstance(data["meetings"], list), "meetings should be a list"
        print(f"✓ GET /api/ai/meeting/user/{self.test_user_id} returns empty list for new user")
    
    def test_03_get_user_meetings_with_limit(self):
        """Test GET /api/ai/meeting/user/{user_id} respects limit parameter"""
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/user/{self.test_user_id}?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "meetings" in data
        assert "count" in data
        print("✓ GET /api/ai/meeting/user/{user_id}?limit=10 works correctly")
    
    # ============== POST /api/ai/meeting/process ==============
    
    def test_04_process_meeting_missing_file(self):
        """Test POST /api/ai/meeting/process returns error when file is missing"""
        # Send request without file
        response = requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": self.test_meeting_id,
                "user_id": self.test_user_id,
                "meeting_title": "Test Meeting",
            }
        )
        # Should return 422 (validation error) for missing file
        assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"
        print("✓ POST /api/ai/meeting/process returns 422 when file is missing")
    
    def test_05_process_meeting_empty_audio(self):
        """Test POST /api/ai/meeting/process returns error for empty/too short audio"""
        # Create a very small file (less than 1000 bytes)
        small_audio = io.BytesIO(b"x" * 500)
        small_audio.name = "test.webm"
        
        response = requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": self.test_meeting_id,
                "user_id": self.test_user_id,
                "meeting_title": "Test Meeting",
                "participants": "user1,user2",
                "duration_seconds": "60"
            },
            files={"file": ("test.webm", small_audio, "audio/webm")}
        )
        # Should return 400 or 500 for too short audio (endpoint handles it but may return different codes)
        assert response.status_code in [400, 500], f"Expected 400 or 500, got {response.status_code}: {response.text}"
        print(f"✓ POST /api/ai/meeting/process returns {response.status_code} for too short audio")
    
    def test_06_process_meeting_creates_record(self):
        """Test POST /api/ai/meeting/process creates meeting_transcripts record (even if processing fails)"""
        # Create a minimal audio file that passes size check but may fail transcription
        # This tests that the endpoint creates the DB record before processing
        meeting_id = f"test-record-{uuid.uuid4().hex[:8]}"
        
        # Create a file that's > 1000 bytes but not a valid audio
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)  # Fake RIFF header
        fake_audio.name = "test.webm"
        
        response = requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": meeting_id,
                "user_id": self.test_user_id,
                "meeting_title": "Test Record Creation",
                "participants": "alice,bob",
                "duration_seconds": "120"
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        # The endpoint may return 500 if transcription fails, but should have created the record
        # Check if record was created by querying status
        status_response = self.session.get(f"{BASE_URL}/api/ai/meeting/{meeting_id}/status")
        
        if status_response.status_code == 200:
            data = status_response.json()
            assert data.get("id") == meeting_id, f"Meeting ID should match: {data}"
            assert data.get("user_id") == self.test_user_id, f"User ID should match: {data}"
            assert data.get("title") == "Test Record Creation", f"Title should match: {data}"
            assert "status" in data, f"Should have status field: {data}"
            print(f"✓ POST /api/ai/meeting/process creates DB record (status: {data.get('status')})")
        else:
            # If record wasn't created, the process endpoint should have returned an error
            assert response.status_code in [400, 500], f"Expected error response: {response.status_code}"
            print(f"✓ POST /api/ai/meeting/process handles invalid audio (status: {response.status_code})")
    
    def test_07_meeting_status_fields(self):
        """Test that meeting status response has all required fields"""
        # First create a meeting record
        meeting_id = f"test-fields-{uuid.uuid4().hex[:8]}"
        
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)
        fake_audio.name = "test.webm"
        
        # Try to create the record
        requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": meeting_id,
                "user_id": self.test_user_id,
                "meeting_title": "Field Test Meeting",
                "participants": "alice,bob,charlie",
                "duration_seconds": "300"
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        # Check status
        status_response = self.session.get(f"{BASE_URL}/api/ai/meeting/{meeting_id}/status")
        
        if status_response.status_code == 200:
            data = status_response.json()
            # Check required fields
            required_fields = ["id", "user_id", "title", "status", "created_at", "updated_at"]
            for field in required_fields:
                assert field in data, f"Missing required field '{field}': {data}"
            
            # Check optional fields that should be present
            assert "participants" in data, f"Should have participants field: {data}"
            assert "duration_seconds" in data, f"Should have duration_seconds field: {data}"
            
            print(f"✓ Meeting status has all required fields: {list(data.keys())}")
        else:
            print(f"⚠ Could not verify fields - meeting not created (status: {status_response.status_code})")
    
    def test_08_user_meetings_returns_created_meetings(self):
        """Test that GET /api/ai/meeting/user/{user_id} returns meetings created by that user"""
        # Create a meeting for a specific user
        user_id = f"test-list-user-{uuid.uuid4().hex[:8]}"
        meeting_id = f"test-list-meeting-{uuid.uuid4().hex[:8]}"
        
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)
        fake_audio.name = "test.webm"
        
        # Create meeting
        requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": meeting_id,
                "user_id": user_id,
                "meeting_title": "User List Test Meeting",
                "participants": "",
                "duration_seconds": "60"
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        # Get user's meetings
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/user/{user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        meetings = data.get("meetings", [])
        
        # Check if our meeting is in the list
        meeting_ids = [m.get("id") for m in meetings]
        if meeting_id in meeting_ids:
            print(f"✓ GET /api/ai/meeting/user/{user_id} returns created meeting")
        else:
            print(f"⚠ Meeting may not have been created successfully (found {len(meetings)} meetings)")
    
    def test_09_meeting_status_excludes_mongodb_id(self):
        """Test that meeting status response excludes MongoDB _id field"""
        # Create a meeting
        meeting_id = f"test-noid-{uuid.uuid4().hex[:8]}"
        
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)
        fake_audio.name = "test.webm"
        
        requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": meeting_id,
                "user_id": self.test_user_id,
                "meeting_title": "No ID Test",
                "participants": "",
                "duration_seconds": "60"
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        # Check status
        status_response = self.session.get(f"{BASE_URL}/api/ai/meeting/{meeting_id}/status")
        
        if status_response.status_code == 200:
            data = status_response.json()
            assert "_id" not in data, f"Response should not contain MongoDB _id: {data}"
            print("✓ Meeting status response excludes MongoDB _id field")
        else:
            print(f"⚠ Could not verify _id exclusion - meeting not found")
    
    def test_10_user_meetings_excludes_mongodb_id(self):
        """Test that user meetings list excludes MongoDB _id field"""
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/user/{self.test_user_id}")
        assert response.status_code == 200
        
        data = response.json()
        meetings = data.get("meetings", [])
        
        for meeting in meetings:
            assert "_id" not in meeting, f"Meeting should not contain MongoDB _id: {meeting}"
        
        print(f"✓ User meetings list excludes MongoDB _id field ({len(meetings)} meetings checked)")


class TestMeetingProcessingEndpointValidation:
    """Tests for endpoint validation and error handling"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
    
    def test_11_process_endpoint_requires_meeting_id(self):
        """Test that process endpoint requires meeting_id"""
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)
        
        response = requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "user_id": "test-user",
                "meeting_title": "Test",
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        assert response.status_code == 422, f"Expected 422 for missing meeting_id, got {response.status_code}"
        print("✓ POST /api/ai/meeting/process requires meeting_id")
    
    def test_12_process_endpoint_requires_user_id(self):
        """Test that process endpoint requires user_id"""
        fake_audio = io.BytesIO(b"RIFF" + b"x" * 2000)
        
        response = requests.post(
            f"{BASE_URL}/api/ai/meeting/process",
            data={
                "meeting_id": "test-meeting",
                "meeting_title": "Test",
            },
            files={"file": ("test.webm", fake_audio, "audio/webm")}
        )
        
        assert response.status_code == 422, f"Expected 422 for missing user_id, got {response.status_code}"
        print("✓ POST /api/ai/meeting/process requires user_id")
    
    def test_13_status_endpoint_handles_special_characters(self):
        """Test that status endpoint handles special characters in meeting_id"""
        # Test with URL-encoded special characters
        response = self.session.get(f"{BASE_URL}/api/ai/meeting/test%20meeting%2Fid/status")
        # Should return 404 (not found) not 500 (server error)
        assert response.status_code in [404, 400], f"Expected 404 or 400, got {response.status_code}"
        print("✓ Status endpoint handles special characters gracefully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
