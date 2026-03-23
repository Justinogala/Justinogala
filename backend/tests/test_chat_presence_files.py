"""
Test Chat Features: Messages, File Upload/Download, Rich Presence Status, SSE Stream
Tests for chat connection stability, file attachments, and Teams-style presence system.
"""
import pytest
import requests
import os
import time
import json
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@munal.com"
ADMIN_PASSWORD = "Admin@123456"


class TestChatMessagesAPI:
    """Test chat message send/receive via JSON body"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
        self.token = data.get("token")
        assert self.user_id, "User ID not found in login response"
    
    def test_send_message_json_body(self):
        """POST /api/chat/messages - Send message with JSON body"""
        # Create a test receiver ID (can be any UUID)
        receiver_id = "test-receiver-" + str(int(time.time()))
        
        response = requests.post(f"{BASE_URL}/api/chat/messages", json={
            "sender_id": self.user_id,
            "receiver_id": receiver_id,
            "content": "Test message from pytest",
            "message_type": "text",
            "attachments": []
        })
        
        assert response.status_code == 200, f"Send message failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert "message" in data
        assert "id" in data
        
        message = data["message"]
        assert message["sender_id"] == self.user_id
        assert message["receiver_id"] == receiver_id
        assert message["content"] == "Test message from pytest"
        assert message["message_type"] == "text"
        assert "created_at" in message
        print(f"✓ Message sent successfully with ID: {data['id']}")
    
    def test_send_message_with_attachments(self):
        """POST /api/chat/messages - Send message with attachments array"""
        receiver_id = "test-receiver-" + str(int(time.time()))
        
        attachments = [
            {"type": "image", "url": "/api/chat/files/test-file/download", "name": "test.jpg"}
        ]
        
        response = requests.post(f"{BASE_URL}/api/chat/messages", json={
            "sender_id": self.user_id,
            "receiver_id": receiver_id,
            "content": "Message with attachment",
            "message_type": "image",
            "attachments": attachments
        })
        
        assert response.status_code == 200, f"Send message with attachments failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        message = data["message"]
        assert message["attachments"] == attachments
        print(f"✓ Message with attachments sent successfully")
    
    def test_send_message_missing_fields(self):
        """POST /api/chat/messages - Returns 400 for missing required fields"""
        response = requests.post(f"{BASE_URL}/api/chat/messages", json={
            "content": "Test message"
            # Missing sender_id and receiver_id
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Correctly returns 400 for missing required fields")
    
    def test_get_conversation_messages(self):
        """GET /api/chat/messages/{user_id}/{partner_id} - Get conversation history"""
        partner_id = "test-partner-" + str(int(time.time()))
        
        # First send a message
        requests.post(f"{BASE_URL}/api/chat/messages", json={
            "sender_id": self.user_id,
            "receiver_id": partner_id,
            "content": "Test conversation message",
            "message_type": "text",
            "attachments": []
        })
        
        # Then retrieve messages
        response = requests.get(f"{BASE_URL}/api/chat/messages/{self.user_id}/{partner_id}")
        
        assert response.status_code == 200, f"Get messages failed: {response.text}"
        data = response.json()
        
        assert "messages" in data
        assert isinstance(data["messages"], list)
        print(f"✓ Retrieved {len(data['messages'])} messages from conversation")


class TestFileUploadDownload:
    """Test file upload to object storage and download"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
        assert self.user_id, "User ID not found"
    
    def test_upload_file_multipart(self):
        """POST /api/chat/files/upload - Upload file via multipart form"""
        # Create a test file content
        test_content = b"This is a test file content for pytest"
        
        files = {
            'file': ('test_document.txt', test_content, 'text/plain')
        }
        data = {
            'user_id': self.user_id,
            'category': 'chat-files'
        }
        
        response = requests.post(f"{BASE_URL}/api/chat/files/upload", files=files, data=data)
        
        assert response.status_code == 200, f"File upload failed: {response.text}"
        result = response.json()
        
        assert result.get("success") == True
        assert "file" in result
        
        file_data = result["file"]
        assert "id" in file_data
        assert file_data["file_name"] == "test_document.txt"
        assert file_data["content_type"] == "text/plain"
        assert "url" in file_data
        
        self.uploaded_file_id = file_data["id"]
        print(f"✓ File uploaded successfully with ID: {file_data['id']}")
        
        return file_data["id"]
    
    def test_upload_file_base64(self):
        """POST /api/chat/files/upload - Upload file via base64 encoded data"""
        test_content = b"Base64 encoded test content"
        encoded_content = base64.b64encode(test_content).decode('utf-8')
        
        data = {
            'user_id': self.user_id,
            'file_name': 'base64_test.txt',
            'file_data': encoded_content,
            'content_type': 'text/plain',
            'category': 'chat-files'
        }
        
        response = requests.post(f"{BASE_URL}/api/chat/files/upload", data=data)
        
        assert response.status_code == 200, f"Base64 upload failed: {response.text}"
        result = response.json()
        
        assert result.get("success") == True
        print(f"✓ Base64 file uploaded successfully")
    
    def test_download_file(self):
        """GET /api/chat/files/{file_id}/download - Download uploaded file"""
        # First upload a file
        test_content = b"Download test content"
        files = {
            'file': ('download_test.txt', test_content, 'text/plain')
        }
        data = {
            'user_id': self.user_id,
            'category': 'chat-files'
        }
        
        upload_response = requests.post(f"{BASE_URL}/api/chat/files/upload", files=files, data=data)
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file"]["id"]
        
        # Now download it
        download_response = requests.get(f"{BASE_URL}/api/chat/files/{file_id}/download")
        
        assert download_response.status_code == 200, f"Download failed: {download_response.text}"
        assert download_response.content == test_content
        print(f"✓ File downloaded successfully, content matches")
    
    def test_download_nonexistent_file(self):
        """GET /api/chat/files/{file_id}/download - Returns 404 for non-existent file"""
        response = requests.get(f"{BASE_URL}/api/chat/files/nonexistent-file-id/download")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent file")
    
    def test_get_user_files(self):
        """GET /api/chat/files/user/{user_id} - Get files uploaded by user"""
        response = requests.get(f"{BASE_URL}/api/chat/files/user/{self.user_id}")
        
        assert response.status_code == 200, f"Get user files failed: {response.text}"
        data = response.json()
        
        assert "files" in data
        assert isinstance(data["files"], list)
        print(f"✓ Retrieved {len(data['files'])} files for user")


class TestRichPresenceStatus:
    """Test Teams/Slack style rich presence status system"""
    
    VALID_STATUS_TYPES = ["available", "busy", "do_not_disturb", "be_right_back", "away", "appear_offline"]
    VALID_DURATIONS = ["30_minutes", "1_hour", "2_hours", "today", "this_week"]
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
        assert self.user_id, "User ID not found"
    
    def test_set_presence_available(self):
        """PUT /api/chat/presence/status - Set status to available"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "available",
            "status_message": "",
            "clear_after": None
        })
        
        assert response.status_code == 200, f"Set presence failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "presence" in data
        assert data["presence"]["status_type"] == "available"
        print(f"✓ Status set to 'available'")
    
    def test_set_presence_busy_with_message(self):
        """PUT /api/chat/presence/status - Set busy status with custom message"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "busy",
            "status_message": "In a meeting",
            "clear_after": "1_hour"
        })
        
        assert response.status_code == 200, f"Set busy status failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert data["presence"]["status_type"] == "busy"
        assert data["presence"]["status_message"] == "In a meeting"
        assert data["presence"]["clear_after"] == "1_hour"
        print(f"✓ Status set to 'busy' with message and duration")
    
    def test_set_presence_do_not_disturb(self):
        """PUT /api/chat/presence/status - Set do_not_disturb status"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "do_not_disturb",
            "status_message": "Focusing on work",
            "clear_after": "2_hours"
        })
        
        assert response.status_code == 200, f"Set DND status failed: {response.text}"
        data = response.json()
        
        assert data["presence"]["status_type"] == "do_not_disturb"
        print(f"✓ Status set to 'do_not_disturb'")
    
    def test_set_presence_be_right_back(self):
        """PUT /api/chat/presence/status - Set be_right_back status"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "be_right_back",
            "status_message": "Getting coffee",
            "clear_after": "30_minutes"
        })
        
        assert response.status_code == 200
        assert response.json()["presence"]["status_type"] == "be_right_back"
        print(f"✓ Status set to 'be_right_back'")
    
    def test_set_presence_away(self):
        """PUT /api/chat/presence/status - Set away status"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "away",
            "status_message": "",
            "clear_after": None
        })
        
        assert response.status_code == 200
        assert response.json()["presence"]["status_type"] == "away"
        print(f"✓ Status set to 'away'")
    
    def test_set_presence_appear_offline(self):
        """PUT /api/chat/presence/status - Set appear_offline status"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "appear_offline",
            "status_message": "",
            "clear_after": None
        })
        
        assert response.status_code == 200
        assert response.json()["presence"]["status_type"] == "appear_offline"
        print(f"✓ Status set to 'appear_offline'")
    
    def test_set_presence_invalid_status(self):
        """PUT /api/chat/presence/status - Returns 400 for invalid status_type"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "invalid_status",
            "status_message": "",
            "clear_after": None
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Correctly returns 400 for invalid status_type")
    
    def test_set_presence_missing_user_id(self):
        """PUT /api/chat/presence/status - Returns 400 for missing user_id"""
        response = requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "status_type": "available"
        })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print(f"✓ Correctly returns 400 for missing user_id")
    
    def test_get_user_presence(self):
        """GET /api/chat/presence/status/{user_id} - Get user's presence"""
        # First set a status
        requests.put(f"{BASE_URL}/api/chat/presence/status", json={
            "user_id": self.user_id,
            "status_type": "available",
            "status_message": "Ready to chat",
            "clear_after": None
        })
        
        # Then get it
        response = requests.get(f"{BASE_URL}/api/chat/presence/status/{self.user_id}")
        
        assert response.status_code == 200, f"Get presence failed: {response.text}"
        data = response.json()
        
        assert "user_id" in data
        assert "presence" in data
        assert data["presence"]["status_type"] == "available"
        assert "is_online" in data["presence"]
        print(f"✓ Retrieved user presence: {data['presence']['status_type']}")
    
    def test_get_presence_nonexistent_user(self):
        """GET /api/chat/presence/status/{user_id} - Returns 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/chat/presence/status/nonexistent-user-id")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly returns 404 for non-existent user")
    
    def test_get_bulk_presence(self):
        """GET /api/chat/presence/bulk - Get presence for multiple users"""
        response = requests.get(f"{BASE_URL}/api/chat/presence/bulk?user_ids={self.user_id},other-user-id")
        
        assert response.status_code == 200, f"Bulk presence failed: {response.text}"
        data = response.json()
        
        assert "presences" in data
        assert isinstance(data["presences"], dict)
        assert self.user_id in data["presences"]
        print(f"✓ Retrieved bulk presence for {len(data['presences'])} users")
    
    def test_get_bulk_presence_empty(self):
        """GET /api/chat/presence/bulk - Returns empty for no user_ids"""
        response = requests.get(f"{BASE_URL}/api/chat/presence/bulk?user_ids=")
        
        assert response.status_code == 200
        data = response.json()
        assert data["presences"] == {}
        print(f"✓ Correctly returns empty presences for empty user_ids")


class TestSSEStream:
    """Test Server-Sent Events stream connection"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
        assert self.user_id, "User ID not found"
    
    def test_sse_stream_connection(self):
        """GET /api/chat/stream/{user_id} - SSE stream connects and returns events"""
        # Use streaming request with short timeout
        response = requests.get(
            f"{BASE_URL}/api/chat/stream/{self.user_id}",
            stream=True,
            timeout=5
        )
        
        assert response.status_code == 200, f"SSE connection failed: {response.status_code}"
        content_type = response.headers.get('Content-Type', '')
        assert 'text/event-stream' in content_type, \
            f"Expected text/event-stream, got {content_type}"
        
        # Read first event (should be 'connected')
        first_line = None
        for line in response.iter_lines(decode_unicode=True):
            if line:
                first_line = line
                break
        
        response.close()
        
        assert first_line is not None, "No data received from SSE stream"
        assert "connected" in first_line or "event:" in first_line, f"Unexpected first line: {first_line}"
        print(f"✓ SSE stream connected successfully, first event: {first_line[:50]}...")
    
    def test_get_online_users(self):
        """GET /api/chat/online-users - Get list of online users"""
        response = requests.get(f"{BASE_URL}/api/chat/online-users")
        
        assert response.status_code == 200, f"Get online users failed: {response.text}"
        data = response.json()
        
        assert "online_users" in data
        assert isinstance(data["online_users"], list)
        print(f"✓ Retrieved {len(data['online_users'])} online users")
    
    def test_get_user_status(self):
        """GET /api/chat/user-status/{user_id} - Check if user is online"""
        response = requests.get(f"{BASE_URL}/api/chat/user-status/{self.user_id}")
        
        assert response.status_code == 200, f"Get user status failed: {response.text}"
        data = response.json()
        
        assert "user_id" in data
        assert "status" in data
        assert data["status"] in ["online", "offline"]
        assert "timestamp" in data
        print(f"✓ User status: {data['status']}")


class TestTypingIndicator:
    """Test typing indicator functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
    
    def test_send_typing_indicator(self):
        """POST /api/chat/typing - Send typing indicator"""
        receiver_id = "test-receiver-typing"
        
        response = requests.post(
            f"{BASE_URL}/api/chat/typing?user_id={self.user_id}&receiver_id={receiver_id}&is_typing=true"
        )
        
        assert response.status_code == 200, f"Typing indicator failed: {response.text}"
        data = response.json()
        assert data.get("status") == "sent"
        print(f"✓ Typing indicator sent successfully")


class TestMarkMessagesRead:
    """Test mark messages as read functionality"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get user ID"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        self.user_id = data.get("user", {}).get("id")
    
    def test_mark_messages_read(self):
        """PUT /api/chat/messages/read - Mark messages as read"""
        # First create a message
        receiver_id = "test-receiver-read"
        send_response = requests.post(f"{BASE_URL}/api/chat/messages", json={
            "sender_id": receiver_id,
            "receiver_id": self.user_id,
            "content": "Test message to mark as read",
            "message_type": "text",
            "attachments": []
        })
        
        assert send_response.status_code == 200
        message_id = send_response.json()["id"]
        
        # Mark as read
        response = requests.put(
            f"{BASE_URL}/api/chat/messages/read?reader_id={self.user_id}",
            json=[message_id]
        )
        
        assert response.status_code == 200, f"Mark read failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Messages marked as read successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
