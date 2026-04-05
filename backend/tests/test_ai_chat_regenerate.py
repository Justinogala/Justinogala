"""
AI Chat Regenerate Response Tests - Testing the new /regenerate endpoint
Tests: Regenerate endpoint, SSE streaming, message deletion, conversation state
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


class TestAIChatRegenerate:
    """Test AI Chat regenerate response functionality"""
    
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
    def conversation_with_messages(self, headers):
        """Create a conversation with user and assistant messages for regenerate testing"""
        # Create conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200, f"Create conversation failed: {create_resp.text}"
        conv_id = create_resp.json()["id"]
        print(f"✓ Created test conversation: {conv_id}")
        
        # Send a message to get an assistant response
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say 'Hello World' only"},
            stream=True,
            timeout=60
        )
        assert msg_resp.status_code == 200, f"Send message failed: {msg_resp.status_code}"
        
        # Consume the stream to complete the message
        for line in msg_resp.iter_lines():
            pass  # Just consume
        
        time.sleep(0.5)  # Wait for DB write
        
        yield conv_id
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        print(f"✓ Cleaned up conversation: {conv_id}")
    
    def test_regenerate_endpoint_exists(self, headers, conversation_with_messages):
        """Test that the /regenerate endpoint exists and returns SSE stream"""
        conv_id = conversation_with_messages
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers,
            stream=True,
            timeout=60
        )
        
        assert response.status_code == 200, f"Regenerate endpoint failed: {response.status_code} - {response.text}"
        
        # Verify content type is SSE
        content_type = response.headers.get("content-type", "")
        assert "text/event-stream" in content_type, f"Expected text/event-stream, got {content_type}"
        print("✓ Regenerate endpoint returns SSE stream")
    
    def test_regenerate_returns_sse_events(self, headers, conversation_with_messages):
        """Test that regenerate returns thinking, chunk, and done events"""
        conv_id = conversation_with_messages
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers,
            stream=True,
            timeout=60
        )
        assert response.status_code == 200
        
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
                            events["chunk"].append(data.get("content", ""))
                        elif event_type == "done":
                            events["done"] = True
                            message_id = data.get("message_id")
                            print(f"✓ Received 'done' event with message_id: {message_id}")
                    except json.JSONDecodeError:
                        pass
        
        assert events["thinking"], "Missing 'thinking' event"
        assert len(events["chunk"]) > 0, "No 'chunk' events received"
        assert events["done"], "Missing 'done' event"
        assert message_id is not None, "No message_id in done event"
        
        full_response = "".join(events["chunk"])
        print(f"✓ Regenerate returned {len(events['chunk'])} chunks, response: '{full_response[:50]}...'")
    
    def test_regenerate_deletes_old_assistant_message(self, headers):
        """Test that regenerate deletes the previous assistant message"""
        # Create fresh conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Send first message
        msg_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "What is 2+2?"},
            stream=True,
            timeout=60
        )
        
        # Get first assistant message ID
        first_assistant_id = None
        for line in msg_resp.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "done":
                            first_assistant_id = data.get("message_id")
                    except:
                        pass
        
        assert first_assistant_id, "No first assistant message ID"
        print(f"✓ First assistant message ID: {first_assistant_id}")
        
        time.sleep(0.5)
        
        # Verify first message exists
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        messages_before = get_resp.json().get("messages", [])
        assistant_msgs_before = [m for m in messages_before if m.get("role") == "assistant"]
        assert len(assistant_msgs_before) == 1, f"Expected 1 assistant message, got {len(assistant_msgs_before)}"
        
        # Call regenerate
        regen_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers,
            stream=True,
            timeout=60
        )
        
        new_assistant_id = None
        for line in regen_resp.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "done":
                            new_assistant_id = data.get("message_id")
                    except:
                        pass
        
        assert new_assistant_id, "No new assistant message ID from regenerate"
        assert new_assistant_id != first_assistant_id, "Regenerate should create new message ID"
        print(f"✓ New assistant message ID: {new_assistant_id}")
        
        time.sleep(0.5)
        
        # Verify old message is deleted and new one exists
        get_resp2 = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        messages_after = get_resp2.json().get("messages", [])
        assistant_msgs_after = [m for m in messages_after if m.get("role") == "assistant"]
        
        assert len(assistant_msgs_after) == 1, f"Expected 1 assistant message after regenerate, got {len(assistant_msgs_after)}"
        assert assistant_msgs_after[0]["id"] == new_assistant_id, "New message ID should be the regenerated one"
        
        # Verify old message is gone
        old_msg_exists = any(m.get("id") == first_assistant_id for m in messages_after)
        assert not old_msg_exists, "Old assistant message should be deleted"
        
        print("✓ Old assistant message deleted, new one created")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_regenerate_nonexistent_conversation(self, headers):
        """Test regenerate on non-existent conversation returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/nonexistent-conv-12345/regenerate",
            headers=headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent conversation correctly returns 404")
    
    def test_regenerate_empty_conversation(self, headers):
        """Test regenerate on conversation with no messages returns 400"""
        # Create empty conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/regenerate",
            headers=headers
        )
        assert response.status_code == 400, f"Expected 400 for empty conversation, got {response.status_code}"
        print("✓ Empty conversation correctly returns 400")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_regenerate_unauthorized(self):
        """Test regenerate without auth returns 401/403"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/some-id/regenerate"
        )
        assert response.status_code in [401, 403], f"Expected 401/403, got {response.status_code}"
        print("✓ Unauthorized regenerate correctly rejected")


class TestFirstMessageStreaming:
    """Test that first message streaming works correctly (bug fix verification)"""
    
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
    
    def test_first_message_streams_correctly(self, headers):
        """Test that the first message in a new conversation streams properly"""
        # Create new conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        print(f"✓ Created new conversation: {conv_id}")
        
        # Send first message and verify streaming
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": "Say 'First message test' only"},
            stream=True,
            timeout=60
        )
        assert response.status_code == 200
        
        chunks = []
        message_id = None
        
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            chunks.append(data.get("content", ""))
                        elif data.get("type") == "done":
                            message_id = data.get("message_id")
                    except:
                        pass
        
        assert len(chunks) > 0, "No chunks received for first message"
        assert message_id is not None, "No message_id received"
        
        full_content = "".join(chunks)
        assert len(full_content) > 0, "First message content is empty"
        
        print(f"✓ First message streamed {len(chunks)} chunks: '{full_content[:50]}...'")
        
        # Verify message persisted
        time.sleep(0.5)
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        messages = get_resp.json().get("messages", [])
        
        assert len(messages) >= 2, f"Expected at least 2 messages (user + assistant), got {len(messages)}"
        
        assistant_msg = next((m for m in messages if m.get("role") == "assistant"), None)
        assert assistant_msg is not None, "No assistant message found"
        assert assistant_msg["content"] == full_content, "Persisted content doesn't match streamed content"
        
        print("✓ First message persisted correctly")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)


class TestConversationCRUD:
    """Test conversation CRUD operations still work"""
    
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
    
    def test_create_conversation(self, headers):
        """Test creating a new conversation"""
        response = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["title"] == "New Chat"
        print(f"✓ Created conversation: {data['id']}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{data['id']}", headers=headers)
    
    def test_list_conversations(self, headers):
        """Test listing conversations"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} conversations")
    
    def test_rename_conversation(self, headers):
        """Test renaming a conversation"""
        # Create
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Rename
        new_title = "TEST_Renamed Conversation"
        patch_resp = requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}",
            headers=headers,
            json={"title": new_title}
        )
        assert patch_resp.status_code == 200
        
        # Verify
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.json()["title"] == new_title
        print(f"✓ Renamed conversation to: {new_title}")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
    
    def test_delete_conversation(self, headers):
        """Test deleting a conversation"""
        # Create
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        conv_id = create_resp.json()["id"]
        
        # Delete
        del_resp = requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert del_resp.status_code == 200
        
        # Verify deleted
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 404
        print(f"✓ Deleted conversation: {conv_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
