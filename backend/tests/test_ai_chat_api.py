"""
AI Chat API Tests - Testing GPT-5.2 powered conversational AI endpoints
Tests: Conversations CRUD, Message streaming, File upload, Voice transcription
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@munal.com"
TEST_PASSWORD = "Admin@123456"


class TestAIChatAuth:
    """Test authentication for AI Chat endpoints"""
    
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
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"✓ Login successful for {TEST_EMAIL}")


class TestAIChatConversations:
    """Test AI Chat Conversations CRUD operations"""
    
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
    
    def test_create_conversation(self, headers):
        """Test creating a new conversation"""
        response = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200, f"Create conversation failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "title" in data
        assert data["title"] == "New Chat"
        assert "created_at" in data
        assert "user_id" in data
        print(f"✓ Created conversation: {data['id']}")
        return data["id"]
    
    def test_list_conversations(self, headers):
        """Test listing all conversations"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200, f"List conversations failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Listed {len(data)} conversations")
    
    def test_get_conversation(self, headers):
        """Test getting a specific conversation"""
        # First create a conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Then get it
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert response.status_code == 200, f"Get conversation failed: {response.text}"
        data = response.json()
        assert data["id"] == conv_id
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Got conversation {conv_id} with {len(data['messages'])} messages")
    
    def test_rename_conversation(self, headers):
        """Test renaming a conversation"""
        # First create a conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Rename it
        new_title = "TEST_Renamed Conversation"
        response = requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}",
            headers=headers,
            json={"title": new_title}
        )
        assert response.status_code == 200, f"Rename conversation failed: {response.text}"
        
        # Verify rename
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 200
        assert get_resp.json()["title"] == new_title
        print(f"✓ Renamed conversation to '{new_title}'")
    
    def test_delete_conversation(self, headers):
        """Test deleting a conversation"""
        # First create a conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Delete it
        response = requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert response.status_code == 200, f"Delete conversation failed: {response.text}"
        
        # Verify deletion
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 404
        print(f"✓ Deleted conversation {conv_id}")
    
    def test_rename_empty_title_fails(self, headers):
        """Test that renaming with empty title fails"""
        # First create a conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        
        # Try to rename with empty title
        response = requests.patch(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}",
            headers=headers,
            json={"title": ""}
        )
        assert response.status_code == 400
        print("✓ Empty title rename correctly rejected")
    
    def test_get_nonexistent_conversation(self, headers):
        """Test getting a non-existent conversation returns 404"""
        response = requests.get(
            f"{BASE_URL}/api/ai-chat/conversations/nonexistent-id-12345",
            headers=headers
        )
        assert response.status_code == 404
        print("✓ Non-existent conversation correctly returns 404")


class TestAIChatMessages:
    """Test AI Chat Message streaming"""
    
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
    
    @pytest.fixture
    def conversation_id(self, headers):
        """Create a conversation for testing"""
        response = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert response.status_code == 200
        return response.json()["id"]
    
    def test_send_message_streaming(self, headers, conversation_id):
        """Test sending a message and receiving streaming response"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": "Say hello in exactly 5 words"},
            stream=True
        )
        assert response.status_code == 200, f"Send message failed: {response.text}"
        assert response.headers.get("content-type") == "text/event-stream; charset=utf-8"
        
        # Read streaming response
        chunks = []
        done_received = False
        for line in response.iter_lines():
            if line:
                decoded = line.decode('utf-8')
                if decoded.startswith('data: '):
                    import json
                    try:
                        data = json.loads(decoded[6:])
                        if data.get("type") == "chunk":
                            chunks.append(data.get("content", ""))
                        elif data.get("type") == "done":
                            done_received = True
                            assert "message_id" in data
                    except json.JSONDecodeError:
                        pass
        
        assert len(chunks) > 0, "No chunks received"
        assert done_received, "Done event not received"
        full_response = "".join(chunks)
        print(f"✓ Received streaming response: '{full_response[:100]}...'")
    
    def test_send_empty_message_fails(self, headers, conversation_id):
        """Test that sending empty message fails"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conversation_id}/messages",
            headers=headers,
            json={"content": ""}
        )
        assert response.status_code == 400
        print("✓ Empty message correctly rejected")
    
    def test_message_to_nonexistent_conversation(self, headers):
        """Test sending message to non-existent conversation"""
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/nonexistent-conv-id/messages",
            headers=headers,
            json={"content": "Hello"}
        )
        assert response.status_code == 404
        print("✓ Message to non-existent conversation correctly returns 404")
    
    def test_conversation_title_auto_updates(self, headers):
        """Test that conversation title auto-updates after first message"""
        # Create new conversation
        create_resp = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers)
        assert create_resp.status_code == 200
        conv_id = create_resp.json()["id"]
        original_title = create_resp.json()["title"]
        assert original_title == "New Chat"
        
        # Send first message
        test_message = "TEST_What is the capital of France?"
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json={"content": test_message},
            stream=True
        )
        assert response.status_code == 200
        
        # Consume the stream
        for _ in response.iter_lines():
            pass
        
        # Check title was updated
        get_resp = requests.get(f"{BASE_URL}/api/ai-chat/conversations/{conv_id}", headers=headers)
        assert get_resp.status_code == 200
        new_title = get_resp.json()["title"]
        assert new_title != "New Chat", f"Title should have been updated from 'New Chat'"
        assert test_message[:60] in new_title or new_title.startswith(test_message[:30])
        print(f"✓ Conversation title auto-updated to: '{new_title}'")


class TestAIChatFileUpload:
    """Test AI Chat File Upload"""
    
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
        """Get headers with auth token (no Content-Type for multipart)"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_upload_text_file(self, headers):
        """Test uploading a text file"""
        # Create a test file
        test_content = b"This is a test file content for AI Chat upload testing."
        files = {"file": ("test_file.txt", test_content, "text/plain")}
        
        response = requests.post(
            f"{BASE_URL}/api/ai-chat/upload",
            headers=headers,
            files=files
        )
        assert response.status_code == 200, f"Upload failed: {response.text}"
        data = response.json()
        assert "id" in data
        assert "original_filename" in data
        assert data["original_filename"] == "test_file.txt"
        assert "content_type" in data
        assert "size" in data
        assert data["size"] == len(test_content)
        print(f"✓ Uploaded file: {data['original_filename']} ({data['size']} bytes)")
        return data["id"]
    
    def test_upload_without_auth_fails(self):
        """Test that upload without auth fails"""
        test_content = b"Test content"
        files = {"file": ("test.txt", test_content, "text/plain")}
        
        response = requests.post(f"{BASE_URL}/api/ai-chat/upload", files=files)
        assert response.status_code in [401, 403]
        print("✓ Upload without auth correctly rejected")


class TestAIChatUnauthorized:
    """Test AI Chat endpoints without authentication"""
    
    def test_list_conversations_unauthorized(self):
        """Test listing conversations without auth"""
        response = requests.get(f"{BASE_URL}/api/ai-chat/conversations")
        assert response.status_code in [401, 403]
        print("✓ List conversations without auth correctly rejected")
    
    def test_create_conversation_unauthorized(self):
        """Test creating conversation without auth"""
        response = requests.post(f"{BASE_URL}/api/ai-chat/conversations")
        assert response.status_code in [401, 403]
        print("✓ Create conversation without auth correctly rejected")


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
