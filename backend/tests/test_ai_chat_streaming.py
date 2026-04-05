"""
AI Chat Streaming Tests - Testing real-time token-by-token SSE streaming
Tests: SSE event types (thinking, chunk, done), token streaming, message persistence
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


class TestAIChatStreaming:
    """Test AI Chat real-time streaming functionality"""
    
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
    
    @pytest.fixture
    def conversation_id(self, headers):
        """Create a conversation for testing"""
        response = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        conv_id = response.json()["id"]
        print(f"✓ Created test conversation: {conv_id}")
        return conv_id
    
    def test_streaming_sse_event_types(self, headers, conversation_id):
        """Test that streaming returns correct SSE event types: thinking, chunk, done"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": "Say 'Hello World' only"},
            stream=True,
            timeout=60
        )
        assert response.status_code == 200, f"Send message failed: {response.status_code} - {response.text}"
        
        # Verify content type is SSE
        content_type = response.headers.get("content-type", "")
        assert "text/event-stream" in content_type, f"Expected text/event-stream, got {content_type}"
        
        # Track event types received
        events = {"thinking": False, "chunk": [], "done": False}
        message_id = None
        
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        event_type = data.get("type")
                        
                        if event_type == "thinking":
                            events["thinking"] = True
                            print("✓ Received 'thinking' event")
                        elif event_type == "chunk":
                            content = data.get("content", "")
                            events["chunk"].append(content)
                        elif event_type == "done":
                            events["done"] = True
                            message_id = data.get("message_id")
                            print(f"✓ Received 'done' event with message_id: {message_id}")
                    except json.JSONDecodeError:
                        pass
        
        # Assertions
        assert events["thinking"], "Missing 'thinking' event"
        assert len(events["chunk"]) > 0, "No 'chunk' events received"
        assert events["done"], "Missing 'done' event"
        assert message_id is not None, "No message_id in done event"
        
        full_response = "".join(events["chunk"])
        print(f"✓ Received {len(events['chunk'])} chunks, total response: '{full_response}'")
        
        return message_id
    
    def test_streaming_token_by_token(self, headers, conversation_id):
        """Test that chunks contain individual tokens (not large word groups)"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": "Count from 1 to 5"},
            stream=True,
            timeout=60
        )
        assert response.status_code == 200
        
        chunks = []
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            chunks.append(data.get("content", ""))
                    except json.JSONDecodeError:
                        pass
        
        # Real streaming should have many small chunks (tokens)
        # Fake streaming would have fewer, larger chunks
        assert len(chunks) >= 3, f"Expected multiple chunks for token streaming, got {len(chunks)}"
        
        # Check that most chunks are small (1-3 tokens typically)
        small_chunks = [c for c in chunks if len(c.split()) <= 3]
        ratio = len(small_chunks) / len(chunks) if chunks else 0
        
        print(f"✓ Received {len(chunks)} chunks")
        print(f"✓ Small chunk ratio: {ratio:.1%} ({len(small_chunks)}/{len(chunks)})")
        print(f"✓ Sample chunks: {chunks[:5]}")
        
        # At least 50% should be small chunks for real token streaming
        assert ratio >= 0.5, f"Expected mostly small chunks for token streaming, got {ratio:.1%}"
    
    def test_message_persisted_after_streaming(self, headers, conversation_id):
        """Test that assistant message is saved to database after streaming completes"""
        # Send message and get streaming response
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": "What is 2+2?"},
            stream=True,
            timeout=60
        )
        assert response.status_code == 200
        
        # Consume stream and get message_id
        message_id = None
        full_content = ""
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            full_content += data.get("content", "")
                        elif data.get("type") == "done":
                            message_id = data.get("message_id")
                    except json.JSONDecodeError:
                        pass
        
        assert message_id is not None, "No message_id received"
        
        # Verify message is persisted by fetching conversation
        time.sleep(0.5)  # Small delay to ensure DB write completes
        get_resp = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}",
            headers=headers
        )
        assert get_resp.status_code == 200
        
        conv_data = get_resp.json()
        messages = conv_data.get("messages", [])
        
        # Should have user message and assistant message
        assert len(messages) >= 2, f"Expected at least 2 messages, got {len(messages)}"
        
        # Find assistant message
        assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
        assert len(assistant_msgs) >= 1, "No assistant message found"
        
        # Verify content matches what was streamed
        last_assistant = assistant_msgs[-1]
        assert last_assistant.get("content") == full_content, "Persisted content doesn't match streamed content"
        print(f"✓ Message persisted correctly: '{full_content[:50]}...'")
    
    def test_conversation_crud_operations(self, headers):
        """Test full CRUD cycle for conversations"""
        # CREATE
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv = create_resp.json()
        conv_id = conv["id"]
        assert conv["title"] == "New Chat"
        print(f"✓ CREATE: {conv_id}")
        
        # READ (list)
        list_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert list_resp.status_code == 200
        convs = list_resp.json()
        assert any(c["id"] == conv_id for c in convs)
        print(f"✓ READ (list): Found conversation in list")
        
        # READ (single)
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == conv_id
        print(f"✓ READ (single): Retrieved conversation")
        
        # UPDATE (rename)
        new_title = "TEST_Streaming Test Conv"
        patch_resp = requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}",
            headers=headers,
            json={"title": new_title}
        )
        assert patch_resp.status_code == 200
        
        # Verify update
        verify_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert verify_resp.json()["title"] == new_title
        print(f"✓ UPDATE: Renamed to '{new_title}'")
        
        # DELETE
        del_resp = requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert del_resp.status_code == 200
        
        # Verify deletion
        verify_del = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert verify_del.status_code == 404
        print(f"✓ DELETE: Conversation removed")


class TestAIChatStreamingEdgeCases:
    """Test edge cases for streaming"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token"""
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
    
    def test_empty_message_rejected(self, headers):
        """Test that empty messages are rejected"""
        # Create conversation first
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": ""}
        )
        assert response.status_code == 400
        print("✓ Empty message correctly rejected")
    
    def test_message_to_nonexistent_conversation(self, headers):
        """Test message to non-existent conversation returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/nonexistent-id-12345/messages",
            headers=headers,
            json={"content": "Hello"}
        )
        assert response.status_code == 404
        print("✓ Non-existent conversation correctly returns 404")
    
    def test_unauthorized_access(self):
        """Test that unauthorized requests are rejected"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access correctly rejected")


class TestCleanupStreamingTests:
    """Cleanup test conversations"""
    
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
    
    def test_cleanup_test_conversations(self, headers):
        """Clean up TEST_ prefixed conversations"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        if response.status_code == 200:
            conversations = response.json()
            deleted = 0
            for conv in conversations:
                title = conv.get("title", "")
                # Clean up test conversations
                if title.startswith("TEST_") or title == "New Chat":
                    del_resp = requests.delete(
                        f"{BASE_URL}/api/ai-chat/conversations/{conv['id']}",
                        headers=headers
                    )
                    if del_resp.status_code == 200:
                        deleted += 1
            print(f"✓ Cleaned up {deleted} test conversations")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
