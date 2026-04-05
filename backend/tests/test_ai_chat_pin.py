"""
AI Chat Pin Feature Tests - Testing conversation pinning functionality
Tests: Pin endpoint, pin toggle, pin sorting, search with pin order, unauthorized/nonexistent cases
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"


class TestAIChatPinAuth:
    """Test authentication for pin tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        return data["token"]
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        print(f"✓ Login successful for {TEST_EMAIL}")


class TestAIChatPinEndpoint:
    """Test PATCH /api/ai-chat/conversations/{id}/pin endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_pin_endpoint_exists(self, headers):
        """Test that pin endpoint exists and responds"""
        # Create a conversation first
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Test pin endpoint
        response = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/pin", headers=headers)
        assert response.status_code == 200, f"Pin endpoint failed: {response.text}"
        data = response.json()
        assert "pinned" in data, "Response should contain 'pinned' field"
        print(f"✓ Pin endpoint exists and returns pinned status: {data['pinned']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_pin_toggle_pins_conversation(self, headers):
        """Test that calling pin on unpinned conversation pins it"""
        # Create a new conversation (unpinned by default)
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Verify it's unpinned initially
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json().get("pinned", False) == False, "New conversation should be unpinned"
        
        # Pin it
        pin_resp = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/pin", headers=headers)
        assert pin_resp.status_code == 200
        assert pin_resp.json()["pinned"] == True, "First pin call should return pinned=true"
        
        # Verify it's pinned via GET
        get_resp2 = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp2.status_code == 200
        assert get_resp2.json().get("pinned") == True, "Conversation should be pinned after pin call"
        print("✓ Pin toggle correctly pins unpinned conversation")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_pin_toggle_unpins_conversation(self, headers):
        """Test that calling pin twice toggles pin state (pin then unpin)"""
        # Create a new conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # First pin call - should pin
        pin_resp1 = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/pin", headers=headers)
        assert pin_resp1.status_code == 200
        assert pin_resp1.json()["pinned"] == True, "First pin call should return pinned=true"
        
        # Second pin call - should unpin
        pin_resp2 = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/pin", headers=headers)
        assert pin_resp2.status_code == 200
        assert pin_resp2.json()["pinned"] == False, "Second pin call should return pinned=false"
        
        # Verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json().get("pinned", True) == False, "Conversation should be unpinned after second pin call"
        print("✓ Pin toggle correctly unpins pinned conversation")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_pin_unauthorized(self):
        """Test that pin endpoint returns 401 without auth"""
        response = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/some-id/pin")
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Pin endpoint correctly rejects unauthorized requests")
    
    def test_pin_nonexistent_conversation(self, headers):
        """Test that pin endpoint returns 404 for nonexistent conversation"""
        response = requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/nonexistent-conv-id-12345/pin",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Pin endpoint correctly returns 404 for nonexistent conversation")


class TestAIChatPinSorting:
    """Test that pinned conversations sort before unpinned ones"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_pinned_conversations_sort_first(self, headers):
        """Test that GET /conversations returns pinned conversations before unpinned"""
        # Create two conversations
        create_resp1 = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp1.status_code == 200
        conv1_id = create_resp1.json()["id"]
        
        # Rename first one for identification
        requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv1_id}",
            headers=headers,
            json={"title": "TEST_Unpinned_Conv"}
        )
        
        time.sleep(0.5)  # Ensure different timestamps
        
        create_resp2 = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp2.status_code == 200
        conv2_id = create_resp2.json()["id"]
        
        # Rename second one for identification
        requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}",
            headers=headers,
            json={"title": "TEST_Pinned_Conv"}
        )
        
        # Pin the second (newer) conversation
        pin_resp = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}/pin", headers=headers)
        assert pin_resp.status_code == 200
        assert pin_resp.json()["pinned"] == True
        
        # Get all conversations
        list_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert list_resp.status_code == 200
        conversations = list_resp.json()
        
        # Find our test conversations
        test_convs = [c for c in conversations if c.get("title", "").startswith("TEST_")]
        pinned_convs = [c for c in test_convs if c.get("pinned")]
        unpinned_convs = [c for c in test_convs if not c.get("pinned")]
        
        # Verify pinned conversations appear before unpinned in the full list
        if pinned_convs and unpinned_convs:
            # Find indices in full list
            pinned_indices = [i for i, c in enumerate(conversations) if c.get("pinned")]
            unpinned_indices = [i for i, c in enumerate(conversations) if not c.get("pinned")]
            
            if pinned_indices and unpinned_indices:
                max_pinned_idx = max(pinned_indices)
                min_unpinned_idx = min(unpinned_indices)
                assert max_pinned_idx < min_unpinned_idx, "All pinned conversations should appear before unpinned ones"
        
        print(f"✓ Pinned conversations sort before unpinned (found {len(pinned_convs)} pinned, {len(unpinned_convs)} unpinned test convs)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv1_id}", headers=headers)
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}", headers=headers)


class TestAIChatSearchWithPinOrder:
    """Test that search respects pin order"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_search_returns_pinned_first(self, headers):
        """Test that search results return pinned matches before unpinned"""
        # Create two conversations with searchable titles
        create_resp1 = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp1.status_code == 200
        conv1_id = create_resp1.json()["id"]
        
        requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv1_id}",
            headers=headers,
            json={"title": "TEST_SearchPin_Unpinned"}
        )
        
        time.sleep(0.5)
        
        create_resp2 = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp2.status_code == 200
        conv2_id = create_resp2.json()["id"]
        
        requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}",
            headers=headers,
            json={"title": "TEST_SearchPin_Pinned"}
        )
        
        # Pin the second conversation
        pin_resp = requests.patch(f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}/pin", headers=headers)
        assert pin_resp.status_code == 200
        
        # Search for both
        search_resp = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=TEST_SearchPin",
            headers=headers
        )
        assert search_resp.status_code == 200
        results = search_resp.json()
        
        # Filter to our test conversations
        test_results = [r for r in results if "TEST_SearchPin" in r.get("title", "")]
        
        if len(test_results) >= 2:
            # Verify pinned one comes first
            pinned_idx = next((i for i, r in enumerate(test_results) if r.get("pinned")), None)
            unpinned_idx = next((i for i, r in enumerate(test_results) if not r.get("pinned")), None)
            
            if pinned_idx is not None and unpinned_idx is not None:
                assert pinned_idx < unpinned_idx, "Pinned search result should appear before unpinned"
        
        print(f"✓ Search results respect pin order (found {len(test_results)} matching results)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv1_id}", headers=headers)
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv2_id}", headers=headers)


class TestAIChatStreamingStillWorks:
    """Verify streaming still works after pin feature addition"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_streaming_still_works(self, headers):
        """Test that message streaming still works"""
        # Create conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Send message with streaming
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say just 'hello'"},
            stream=True,
            timeout=60
        )
        assert response.status_code == 200, f"Streaming failed: {response.text}"
        assert "text/event-stream" in response.headers.get("content-type", "")
        
        # Read some chunks
        chunks_received = 0
        done_received = False
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    import json
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            chunks_received += 1
                        elif data.get("type") == "done":
                            done_received = True
                            break
                    except:
                        pass
            if chunks_received > 5:  # Don't wait for full response
                break
        
        assert chunks_received > 0 or done_received, "Should receive streaming chunks"
        print(f"✓ Streaming still works (received {chunks_received} chunks)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)


class TestAIChatRegenerateStillWorks:
    """Verify regenerate still works after pin feature addition"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_regenerate_still_works(self, headers):
        """Test that regenerate endpoint still works"""
        # Create conversation and send a message first
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Send initial message
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say just 'test'"},
            stream=True,
            timeout=60
        )
        assert msg_resp.status_code == 200
        
        # Consume the stream
        for _ in msg_resp.iter_lines():
            pass
        
        # Now test regenerate
        regen_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers,
            stream=True,
            timeout=60
        )
        assert regen_resp.status_code == 200, f"Regenerate failed: {regen_resp.text}"
        assert "text/event-stream" in regen_resp.headers.get("content-type", "")
        
        # Read some chunks
        chunks_received = 0
        for line in regen_resp.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    import json
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            chunks_received += 1
                        elif data.get("type") == "done":
                            break
                    except:
                        pass
            if chunks_received > 5:
                break
        
        print(f"✓ Regenerate still works (received {chunks_received} chunks)")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)


class TestCleanup:
    """Cleanup test data"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_cleanup_test_conversations(self, headers):
        """Clean up TEST_ prefixed conversations"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        if response.status_code == 200:
            conversations = response.json()
            deleted = 0
            for conv in conversations:
                if conv.get("title", "").startswith("TEST_"):
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/ai-chat/conversations/{conv['id']}",
                        headers=headers
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test conversations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
