"""
Time Clock API Tests
Tests for workspace-level punch in/out functionality.
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"
ORG_ADMIN_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
TEST_WORKSPACE_ID = "b3478da2-7782-425a-9fa7-2dbc4f22d047"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for org admin"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ORG_ADMIN_EMAIL,
        "password": ORG_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def user_id(api_client, auth_token):
    """Get user ID from auth response"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": ORG_ADMIN_EMAIL,
        "password": ORG_ADMIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("user", {}).get("id", ORG_ADMIN_USER_ID)
    return ORG_ADMIN_USER_ID


@pytest.fixture(autouse=True)
def cleanup_clock_state(api_client, user_id):
    """Ensure user is clocked out before each test"""
    # Try to clock out to clean up any existing state
    api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
        "workspace_id": TEST_WORKSPACE_ID,
        "user_id": user_id
    })
    yield
    # Cleanup after test
    api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
        "workspace_id": TEST_WORKSPACE_ID,
        "user_id": user_id
    })


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") in ["healthy", "degraded"]
        print(f"API Health: {data}")


class TestClockIn:
    """Clock-in endpoint tests"""
    
    def test_clock_in_success(self, api_client, user_id):
        """POST /api/time-clock/clock-in - clocks user into workspace"""
        response = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "entry" in data
        
        entry = data["entry"]
        assert entry.get("workspace_id") == TEST_WORKSPACE_ID
        assert entry.get("user_id") == user_id
        assert entry.get("clock_in") is not None
        assert entry.get("clock_out") is None
        assert entry.get("status") == "active"
        assert "id" in entry
        
        print(f"Clock-in successful: entry_id={entry['id']}")
    
    def test_double_clock_in_prevention(self, api_client, user_id):
        """POST /api/time-clock/clock-in when already clocked in returns 400"""
        # First clock in
        response1 = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        assert response1.status_code == 200
        
        # Try to clock in again - should fail
        response2 = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        assert response2.status_code == 400, f"Expected 400, got {response2.status_code}"
        data = response2.json()
        assert "already clocked in" in data.get("detail", "").lower()
        
        print("Double clock-in prevention working correctly")


class TestClockOut:
    """Clock-out endpoint tests"""
    
    def test_clock_out_success(self, api_client, user_id):
        """POST /api/time-clock/clock-out - clocks user out with duration"""
        # First clock in
        clock_in_response = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        assert clock_in_response.status_code == 200
        
        # Wait a moment then clock out
        import time
        time.sleep(1)
        
        response = api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert "entry_id" in data
        assert "duration_minutes" in data
        assert "duration_hours" in data
        assert isinstance(data["duration_minutes"], (int, float))
        assert isinstance(data["duration_hours"], (int, float))
        
        print(f"Clock-out successful: duration={data['duration_minutes']} min ({data['duration_hours']} hrs)")
    
    def test_clock_out_when_not_clocked_in(self, api_client, user_id):
        """POST /api/time-clock/clock-out when not clocked in returns 400"""
        # Ensure not clocked in (cleanup fixture handles this)
        response = api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "not clocked in" in data.get("detail", "").lower()
        
        print("Clock-out when not clocked in returns 400 correctly")


class TestClockStatus:
    """Clock status endpoint tests"""
    
    def test_status_when_not_clocked_in(self, api_client, user_id):
        """GET /api/time-clock/status/{workspace_id}/{user_id} - not clocked in"""
        response = api_client.get(f"{BASE_URL}/api/time-clock/status/{TEST_WORKSPACE_ID}/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("clocked_in") is False
        assert data.get("entry") is None
        assert data.get("elapsed_seconds") == 0
        
        print("Status when not clocked in: clocked_in=False")
    
    def test_status_when_clocked_in(self, api_client, user_id):
        """GET /api/time-clock/status/{workspace_id}/{user_id} - clocked in with elapsed time"""
        # Clock in first
        clock_in_response = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        assert clock_in_response.status_code == 200
        
        # Wait a moment
        import time
        time.sleep(2)
        
        # Check status
        response = api_client.get(f"{BASE_URL}/api/time-clock/status/{TEST_WORKSPACE_ID}/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("clocked_in") is True
        assert data.get("entry") is not None
        assert data.get("elapsed_seconds") >= 1  # At least 1 second elapsed
        
        entry = data["entry"]
        assert entry.get("workspace_id") == TEST_WORKSPACE_ID
        assert entry.get("user_id") == user_id
        assert entry.get("status") == "active"
        
        print(f"Status when clocked in: elapsed_seconds={data['elapsed_seconds']}")


class TestClockHistory:
    """Clock history endpoint tests"""
    
    def test_history_returns_entries(self, api_client, user_id):
        """GET /api/time-clock/history/{workspace_id}/{user_id} - returns entries with total_hours"""
        # Create a clock entry
        api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        import time
        time.sleep(1)
        api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        # Get history
        response = api_client.get(f"{BASE_URL}/api/time-clock/history/{TEST_WORKSPACE_ID}/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "entries" in data
        assert "total_minutes" in data
        assert "total_hours" in data
        assert "count" in data
        
        assert isinstance(data["entries"], list)
        assert isinstance(data["total_hours"], (int, float))
        
        print(f"History: {data['count']} entries, total_hours={data['total_hours']}")
    
    def test_history_with_limit(self, api_client, user_id):
        """GET /api/time-clock/history with limit parameter"""
        response = api_client.get(f"{BASE_URL}/api/time-clock/history/{TEST_WORKSPACE_ID}/{user_id}?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data.get("entries", [])) <= 5
        print(f"History with limit=5: returned {len(data.get('entries', []))} entries")


class TestTodayClocks:
    """Today's clock entries endpoint tests"""
    
    def test_today_clocks(self, api_client, user_id):
        """GET /api/time-clock/today/{workspace_id} - returns today's entries"""
        # Create a clock entry for today
        api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        import time
        time.sleep(1)
        api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        # Get today's entries
        response = api_client.get(f"{BASE_URL}/api/time-clock/today/{TEST_WORKSPACE_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "entries" in data
        assert "count" in data
        assert isinstance(data["entries"], list)
        
        # Should have at least one entry from our test
        assert data["count"] >= 1
        
        print(f"Today's clocks: {data['count']} entries")


class TestEdgeCases:
    """Edge case tests"""
    
    def test_clock_in_with_notes(self, api_client, user_id):
        """Clock in with optional notes field"""
        response = api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id,
            "notes": "Starting morning shift"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["entry"].get("notes_in") == "Starting morning shift"
        
        print("Clock-in with notes working")
    
    def test_clock_out_with_notes(self, api_client, user_id):
        """Clock out with optional notes field"""
        # Clock in first
        api_client.post(f"{BASE_URL}/api/time-clock/clock-in", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id
        })
        
        response = api_client.post(f"{BASE_URL}/api/time-clock/clock-out", json={
            "workspace_id": TEST_WORKSPACE_ID,
            "user_id": user_id,
            "notes": "Ending shift"
        })
        
        assert response.status_code == 200
        print("Clock-out with notes working")
    
    def test_invalid_workspace_id(self, api_client, user_id):
        """Status check with non-existent workspace returns empty state"""
        fake_workspace = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/time-clock/status/{fake_workspace}/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("clocked_in") is False
        
        print("Invalid workspace returns not clocked in state")
