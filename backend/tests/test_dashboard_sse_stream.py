"""
Dashboard SSE Stream API Tests
Tests for real-time activity updates via Server-Sent Events (SSE)
- GET /api/dashboard/activity - returns graph data and activities
- GET /api/dashboard/activity/stream - SSE endpoint for real-time updates
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestDashboardActivityAPI:
    """Tests for /api/dashboard/activity endpoint"""
    
    def test_activity_endpoint_returns_200(self):
        """Test that activity endpoint returns 200 with user_id"""
        response = requests.get(f"{BASE_URL}/api/dashboard/activity", params={"user_id": "test-user"})
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Activity endpoint returns 200")
    
    def test_activity_endpoint_returns_graph_data(self):
        """Test that activity endpoint returns graph data with 7 days"""
        response = requests.get(f"{BASE_URL}/api/dashboard/activity", params={"user_id": "test-user"})
        assert response.status_code == 200
        data = response.json()
        
        assert "graph" in data, "Response should contain 'graph' key"
        assert isinstance(data["graph"], list), "Graph should be a list"
        assert len(data["graph"]) == 7, f"Graph should have 7 days, got {len(data['graph'])}"
        
        # Check each day has required fields
        for day in data["graph"]:
            assert "day" in day, "Each day should have 'day' field"
            assert "messages" in day, "Each day should have 'messages' field"
            assert "meetings" in day, "Each day should have 'meetings' field"
            assert "approvals" in day, "Each day should have 'approvals' field"
            assert "logins" in day, "Each day should have 'logins' field"
            assert "total" in day, "Each day should have 'total' field"
        
        print(f"✓ Activity endpoint returns graph data with {len(data['graph'])} days")
    
    def test_activity_endpoint_returns_activities(self):
        """Test that activity endpoint returns activities list"""
        response = requests.get(f"{BASE_URL}/api/dashboard/activity", params={"user_id": "test-user"})
        assert response.status_code == 200
        data = response.json()
        
        assert "activities" in data, "Response should contain 'activities' key"
        assert isinstance(data["activities"], list), "Activities should be a list"
        
        # Check activities have required fields
        for activity in data["activities"]:
            assert "type" in activity, "Each activity should have 'type' field"
            assert "title" in activity, "Each activity should have 'title' field"
            assert "timestamp" in activity, "Each activity should have 'timestamp' field"
            assert "icon" in activity, "Each activity should have 'icon' field"
        
        print(f"✓ Activity endpoint returns {len(data['activities'])} activities")


class TestDashboardSSEStream:
    """Tests for /api/dashboard/activity/stream SSE endpoint"""
    
    def test_sse_stream_returns_200(self):
        """Test that SSE stream endpoint returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": "test-user"},
            stream=True,
            timeout=5
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        response.close()
        print("✓ SSE stream endpoint returns 200")
    
    def test_sse_stream_content_type(self):
        """Test that SSE stream has correct content type"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": "test-user"},
            stream=True,
            timeout=5
        )
        assert response.status_code == 200
        content_type = response.headers.get('content-type', '')
        assert 'text/event-stream' in content_type, f"Expected text/event-stream, got {content_type}"
        response.close()
        print("✓ SSE stream has correct content-type: text/event-stream")
    
    def test_sse_stream_sends_init_event(self):
        """Test that SSE stream sends 'init' event with full data on connect"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": "test-user"},
            stream=True,
            timeout=10
        )
        assert response.status_code == 200
        
        # Read the first event
        init_event_found = False
        event_data = ""
        
        for line in response.iter_lines(decode_unicode=True):
            if line:
                if line.startswith("event: init"):
                    init_event_found = True
                elif line.startswith("data: ") and init_event_found:
                    event_data = line[6:]  # Remove "data: " prefix
                    break
        
        response.close()
        
        assert init_event_found, "SSE stream should send 'init' event on connect"
        assert event_data, "Init event should contain data"
        
        # Parse and validate the init data
        import json
        data = json.loads(event_data)
        
        assert "graph" in data, "Init event should contain 'graph'"
        assert "activities" in data, "Init event should contain 'activities'"
        assert "stats" in data, "Init event should contain 'stats'"
        
        # Validate stats structure
        stats = data["stats"]
        assert "workspaceCount" in stats, "Stats should contain 'workspaceCount'"
        assert "memberCount" in stats, "Stats should contain 'memberCount'"
        assert "pendingApprovals" in stats, "Stats should contain 'pendingApprovals'"
        assert "announcements" in stats, "Stats should contain 'announcements'"
        
        print(f"✓ SSE stream sends 'init' event with graph ({len(data['graph'])} days), activities ({len(data['activities'])} items), and stats")
        print(f"  Stats: workspaces={stats['workspaceCount']}, members={stats['memberCount']}, approvals={stats['pendingApprovals']}, announcements={stats['announcements']}")
    
    def test_sse_stream_graph_has_7_days(self):
        """Test that SSE init event graph data has 7 days"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": "test-user"},
            stream=True,
            timeout=10
        )
        assert response.status_code == 200
        
        import json
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                data = json.loads(line[6:])
                if "graph" in data:
                    assert len(data["graph"]) == 7, f"Graph should have 7 days, got {len(data['graph'])}"
                    print(f"✓ SSE init event graph has 7 days: {[d['day'] for d in data['graph']]}")
                    break
        
        response.close()
    
    def test_sse_stream_activities_max_10(self):
        """Test that SSE init event activities are limited to 10 items"""
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": "test-user"},
            stream=True,
            timeout=10
        )
        assert response.status_code == 200
        
        import json
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                data = json.loads(line[6:])
                if "activities" in data:
                    assert len(data["activities"]) <= 10, f"Activities should be max 10, got {len(data['activities'])}"
                    print(f"✓ SSE init event has {len(data['activities'])} activities (max 10)")
                    break
        
        response.close()


class TestDashboardSSEStreamWithAuth:
    """Tests for SSE stream with authenticated user"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@munal.com",
            "password": "Admin@123456"
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token"), data.get("user", {}).get("id")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_sse_stream_with_real_user_id(self, auth_token):
        """Test SSE stream with real authenticated user ID"""
        token, user_id = auth_token
        
        response = requests.get(
            f"{BASE_URL}/api/dashboard/activity/stream",
            params={"user_id": user_id},
            stream=True,
            timeout=10
        )
        assert response.status_code == 200
        
        import json
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith("data: "):
                data = json.loads(line[6:])
                if "stats" in data:
                    stats = data["stats"]
                    print(f"✓ SSE stream with real user returns stats:")
                    print(f"  - Workspaces: {stats['workspaceCount']}")
                    print(f"  - Members: {stats['memberCount']}")
                    print(f"  - Pending Approvals: {stats['pendingApprovals']}")
                    print(f"  - Announcements: {stats['announcements']}")
                    break
        
        response.close()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
