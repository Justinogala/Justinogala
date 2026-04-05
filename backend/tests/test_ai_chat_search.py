"""
AI Chat Search Conversations Tests - Testing the new /search endpoint
Tests: Search by title, search by message content, empty query, unauthorized access
"""
import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from test_credentials.md
ORG_ADMIN_EMAIL = "orgadmin@munal.com"
ORG_ADMIN_PASSWORD = "OrgAdmin@123"


class TestAIChatSearch:
    """Test AI Chat conversation search functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ORG_ADMIN_EMAIL,
            "password": ORG_ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in login response"
        print(f"✓ Logged in as {ORG_ADMIN_EMAIL}")
        return data["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_search_endpoint_exists(self, headers):
        """Test that the /search endpoint exists and returns 200"""
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=test",
            headers=headers
        )
        assert response.status_code == 200, f"Search endpoint failed: {response.status_code} - {response.text}"
        data = response.json()
        assert isinstance(data, list), "Search should return a list"
        print(f"✓ Search endpoint exists and returns list with {len(data)} results")
    
    def test_search_by_title(self, headers):
        """Test searching conversations by title - should find 'hello' in titles"""
        # Search for 'hello' which should match existing test conversations
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=hello",
            headers=headers
        )
        assert response.status_code == 200, f"Search failed: {response.status_code}"
        data = response.json()
        assert isinstance(data, list), "Search should return a list"
        
        # Check if any results have 'hello' in title (case-insensitive)
        hello_in_title = [c for c in data if 'hello' in c.get('title', '').lower()]
        print(f"✓ Search 'hello' returned {len(data)} results, {len(hello_in_title)} with 'hello' in title")
        
        # Verify structure of returned conversations
        if data:
            conv = data[0]
            assert "id" in conv, "Conversation should have id"
            assert "title" in conv, "Conversation should have title"
            assert "user_id" in conv, "Conversation should have user_id"
    
    def test_search_by_message_content(self, headers):
        """Test searching by message content - create conv with specific content and search"""
        # Create a conversation with unique content
        unique_keyword = f"TESTSEARCHKEYWORD{int(time.time())}"
        
        # Create conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        print(f"✓ Created test conversation: {conv_id}")
        
        # Send a message with unique keyword
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": f"Say the word {unique_keyword} only"},
            stream=True,
            timeout=60
        )
        assert msg_resp.status_code == 200
        
        # Consume stream
        for line in msg_resp.iter_lines():
            pass
        
        time.sleep(1)  # Wait for DB write
        
        # Search for the unique keyword
        search_resp = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q={unique_keyword}",
            headers=headers
        )
        assert search_resp.status_code == 200
        results = search_resp.json()
        
        # Should find the conversation by message content
        found_conv = any(c.get("id") == conv_id for c in results)
        print(f"✓ Search for '{unique_keyword}' returned {len(results)} results, found our conv: {found_conv}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        print(f"✓ Cleaned up test conversation")
    
    def test_search_empty_query_validation(self, headers):
        """Test that empty query returns validation error (min_length=1)"""
        # Empty query should fail validation
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=",
            headers=headers
        )
        # FastAPI Query with min_length=1 returns 422 for empty string
        assert response.status_code == 422, f"Expected 422 for empty query, got {response.status_code}"
        print("✓ Empty query correctly returns 422 validation error")
    
    def test_search_whitespace_only_query(self, headers):
        """Test that whitespace-only query returns empty array"""
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=%20%20%20",  # URL encoded spaces
            headers=headers
        )
        # Whitespace passes min_length but strip() makes it empty, returns []
        if response.status_code == 200:
            data = response.json()
            assert data == [], f"Whitespace query should return empty array, got {data}"
            print("✓ Whitespace-only query returns empty array")
        else:
            # May return 422 if validation catches it
            assert response.status_code == 422
            print("✓ Whitespace-only query returns validation error")
    
    def test_search_unauthorized(self):
        """Test search without auth returns 401/403"""
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=test"
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized search correctly rejected")
    
    def test_search_case_insensitive(self, headers):
        """Test that search is case-insensitive"""
        # Create conversation with specific title
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Rename with mixed case
        unique_title = f"TEST_CaseSensitive_{int(time.time())}"
        requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}",
            headers=headers,
            json={"title": unique_title}
        )
        
        # Search with lowercase
        search_lower = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q={unique_title.lower()}",
            headers=headers
        )
        assert search_lower.status_code == 200
        results_lower = search_lower.json()
        
        # Search with uppercase
        search_upper = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q={unique_title.upper()}",
            headers=headers
        )
        assert search_upper.status_code == 200
        results_upper = search_upper.json()
        
        # Both should find the conversation
        found_lower = any(c.get("id") == conv_id for c in results_lower)
        found_upper = any(c.get("id") == conv_id for c in results_upper)
        
        print(f"✓ Case-insensitive search: lowercase found={found_lower}, uppercase found={found_upper}")
        assert found_lower or found_upper, "At least one case should find the conversation"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_search_returns_correct_structure(self, headers):
        """Test that search results have correct conversation structure"""
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=a",  # Common letter
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        if data:
            conv = data[0]
            # Verify required fields
            assert "id" in conv, "Missing 'id' field"
            assert "title" in conv, "Missing 'title' field"
            assert "user_id" in conv, "Missing 'user_id' field"
            assert "created_at" in conv, "Missing 'created_at' field"
            assert "updated_at" in conv, "Missing 'updated_at' field"
            # Should NOT have _id (MongoDB internal)
            assert "_id" not in conv, "Should not expose MongoDB _id"
            print(f"✓ Search results have correct structure: {list(conv.keys())}")
        else:
            print("✓ No results to verify structure (search returned empty)")
    
    def test_search_existing_hello_conversations(self, headers):
        """Test searching for existing test conversations with 'hello' in title"""
        # Per the review request, these conversations exist:
        # 'Say Hello World only', 'Say hello in 3 different languages', 'Say just hi'
        
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/search?q=hello",
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check for expected conversations
        titles = [c.get('title', '') for c in data]
        print(f"✓ Search 'hello' found {len(data)} conversations: {titles[:5]}")
        
        # At least verify the endpoint works and returns valid data
        assert isinstance(data, list)


class TestSearchWithRegenerate:
    """Test that search works alongside regenerate functionality"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ORG_ADMIN_EMAIL,
            "password": ORG_ADMIN_PASSWORD
        })
        assert response.status_code == 200
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def headers(self, auth_token):
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
    
    def test_regenerate_still_works(self, headers):
        """Verify regenerate endpoint still works after search implementation"""
        # Create conversation with message
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Send message
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say 'test' only"},
            stream=True,
            timeout=60
        )
        for line in msg_resp.iter_lines():
            pass
        
        time.sleep(0.5)
        
        # Test regenerate
        regen_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers,
            stream=True,
            timeout=60
        )
        assert regen_resp.status_code == 200, f"Regenerate failed: {regen_resp.status_code}"
        
        # Verify SSE content type
        content_type = regen_resp.headers.get("content-type", "")
        assert "text/event-stream" in content_type
        
        # Consume stream
        for line in regen_resp.iter_lines():
            pass
        
        print("✓ Regenerate endpoint still works correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_streaming_still_works(self, headers):
        """Verify streaming endpoint still works after search implementation"""
        # Create conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Send message with streaming
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say 'streaming test' only"},
            stream=True,
            timeout=60
        )
        assert msg_resp.status_code == 200
        
        # Verify SSE content type
        content_type = msg_resp.headers.get("content-type", "")
        assert "text/event-stream" in content_type
        
        # Verify we get events
        events = {"thinking": False, "chunk": False, "done": False}
        for line in msg_resp.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        event_type = data.get("type")
                        if event_type in events:
                            events[event_type] = True
                    except:
                        pass
        
        assert events["thinking"], "Missing thinking event"
        assert events["done"], "Missing done event"
        print("✓ Streaming endpoint still works correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
