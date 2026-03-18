"""
Tests for Reply Attachment Feature in Messages
- File upload to /api/messages/attachments/upload
- Reply with attachments to /api/messages/reply/{message_id}/{sender_id}
- Delete attachment /api/messages/attachments/{id}
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "admin@munal.com"
TEST_PASSWORD = "Admin@123456"


@pytest.fixture(scope="module")
def api_session():
    """Create a requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_data(api_session):
    """Login and get user data"""
    response = api_session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    # Login returns user object directly (not wrapped in success)
    assert "user" in data, f"Login response missing user: {data}"
    return data.get("user")


class TestAttachmentUpload:
    """Tests for /api/messages/attachments/upload endpoint"""
    
    def test_upload_text_file(self, api_session, auth_data):
        """Test uploading a small text file"""
        user_id = auth_data["id"]
        
        # Create a test file
        file_content = b"This is a test reply attachment file"
        files = {
            'file': ('test_reply_attachment.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {'user_id': user_id}
        
        # Remove content-type header for multipart
        headers = dict(api_session.headers)
        if 'Content-Type' in headers:
            del headers['Content-Type']
        
        response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        assert result.get("success"), f"Upload not successful: {result}"
        assert "attachment" in result, "Missing attachment in response"
        
        attachment = result["attachment"]
        assert "id" in attachment, "Attachment missing id"
        assert attachment["filename"] == "test_reply_attachment.txt", f"Wrong filename: {attachment['filename']}"
        assert attachment["content_type"] == "text/plain", f"Wrong content_type: {attachment.get('content_type')}"
        assert attachment["user_id"] == user_id, f"Wrong user_id: {attachment.get('user_id')}"
        assert "size" in attachment, "Attachment missing size"
        
        print(f"✓ Upload text file test passed. Attachment ID: {attachment['id']}")
        return attachment
    
    def test_upload_pdf_file(self, api_session, auth_data):
        """Test uploading a PDF file"""
        user_id = auth_data["id"]
        
        # Create a minimal PDF content
        pdf_content = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
        files = {
            'file': ('test_document.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {'user_id': user_id}
        
        response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        assert result.get("success"), f"Upload not successful: {result}"
        
        attachment = result["attachment"]
        assert attachment["filename"] == "test_document.pdf"
        assert "application/pdf" in attachment["content_type"].lower() or attachment["content_type"] == "application/pdf"
        
        print(f"✓ Upload PDF file test passed. Attachment ID: {attachment['id']}")
        return attachment
    
    def test_upload_image_file(self, api_session, auth_data):
        """Test uploading an image file"""
        user_id = auth_data["id"]
        
        # Create a minimal PNG content (1x1 transparent pixel)
        png_content = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
            b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
            b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01'
            b'\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        files = {
            'file': ('test_image.png', io.BytesIO(png_content), 'image/png')
        }
        data = {'user_id': user_id}
        
        response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data
        )
        
        assert response.status_code == 200, f"Upload failed: {response.text}"
        result = response.json()
        assert result.get("success"), f"Upload not successful: {result}"
        
        attachment = result["attachment"]
        assert attachment["filename"] == "test_image.png"
        
        print(f"✓ Upload image file test passed. Attachment ID: {attachment['id']}")
        return attachment


class TestAttachmentDownload:
    """Tests for /api/messages/attachments/{id} GET endpoint"""
    
    def test_download_uploaded_attachment(self, api_session, auth_data):
        """Upload a file and then download it"""
        user_id = auth_data["id"]
        
        # Upload first
        file_content = b"Test content for download verification"
        files = {
            'file': ('download_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {'user_id': user_id}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data
        )
        assert upload_response.status_code == 200
        attachment = upload_response.json()["attachment"]
        
        # Download
        download_response = requests.get(f"{BASE_URL}/api/messages/attachments/{attachment['id']}")
        assert download_response.status_code == 200, f"Download failed: {download_response.text}"
        assert download_response.content == file_content, "Downloaded content doesn't match uploaded content"
        
        print(f"✓ Download attachment test passed")
    
    def test_download_nonexistent_attachment(self, api_session):
        """Test downloading a non-existent attachment returns 404"""
        response = requests.get(f"{BASE_URL}/api/messages/attachments/nonexistent-id-12345")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✓ Download nonexistent attachment returns 404")


class TestAttachmentDelete:
    """Tests for /api/messages/attachments/{id} DELETE endpoint"""
    
    def test_delete_own_attachment(self, api_session, auth_data):
        """Upload and delete an attachment"""
        user_id = auth_data["id"]
        
        # Upload first
        file_content = b"File to be deleted"
        files = {
            'file': ('delete_test.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {'user_id': user_id}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data
        )
        assert upload_response.status_code == 200
        attachment = upload_response.json()["attachment"]
        
        # Delete
        delete_response = requests.delete(
            f"{BASE_URL}/api/messages/attachments/{attachment['id']}?user_id={user_id}"
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        result = delete_response.json()
        assert result.get("success"), f"Delete not successful: {result}"
        
        # Verify deletion - should return 404
        verify_response = requests.get(f"{BASE_URL}/api/messages/attachments/{attachment['id']}")
        assert verify_response.status_code == 404, "Attachment should be deleted"
        
        print(f"✓ Delete attachment test passed")
    
    def test_delete_nonexistent_attachment(self, api_session, auth_data):
        """Test deleting a non-existent attachment returns 404"""
        user_id = auth_data["id"]
        response = requests.delete(
            f"{BASE_URL}/api/messages/attachments/nonexistent-id-12345?user_id={user_id}"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        
        print(f"✓ Delete nonexistent attachment returns 404")


class TestReplyWithAttachments:
    """Tests for replying with attachments"""
    
    def test_send_message_and_reply_with_attachment(self, api_session, auth_data):
        """Send a message, upload attachment, reply with attachment"""
        user_id = auth_data["id"]
        
        # First, get another user to send message to (or send to self for testing)
        # Search for users
        search_response = api_session.get(
            f"{BASE_URL}/api/messages/users/search?q=admin&current_user_id={user_id}"
        )
        
        # If no other user found, we'll test with the message thread flow
        # Create a test message first
        recipient_id = user_id  # Send to self for testing
        
        send_response = api_session.post(
            f"{BASE_URL}/api/messages/send/{user_id}",
            json={
                "recipient_id": recipient_id,
                "subject": "Test Reply Attachment Subject",
                "content": "This is a test message for reply attachment testing"
            }
        )
        
        assert send_response.status_code == 200, f"Send failed: {send_response.text}"
        send_data = send_response.json()
        assert send_data.get("success"), f"Send not successful: {send_data}"
        
        message_id = send_data["message"]["id"]
        print(f"  Created test message: {message_id}")
        
        # Upload an attachment for the reply
        file_content = b"This is attachment content for the reply"
        files = {
            'file': ('reply_attachment.txt', io.BytesIO(file_content), 'text/plain')
        }
        data = {'user_id': user_id}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data=data
        )
        assert upload_response.status_code == 200
        attachment = upload_response.json()["attachment"]
        print(f"  Uploaded attachment: {attachment['id']}")
        
        # Reply with attachment
        reply_response = api_session.post(
            f"{BASE_URL}/api/messages/reply/{message_id}/{user_id}",
            json={
                "content": "This is a reply with an attachment",
                "attachments": [attachment]
            }
        )
        
        assert reply_response.status_code == 200, f"Reply failed: {reply_response.text}"
        reply_data = reply_response.json()
        assert reply_data.get("success"), f"Reply not successful: {reply_data}"
        
        # Verify reply has attachment
        reply_message = reply_data["message"]
        assert "attachments" in reply_message, "Reply missing attachments field"
        assert len(reply_message["attachments"]) == 1, f"Expected 1 attachment, got {len(reply_message.get('attachments', []))}"
        assert reply_message["attachments"][0]["id"] == attachment["id"], "Attachment ID mismatch"
        
        print(f"✓ Reply with attachment test passed. Reply ID: {reply_message['id']}")
    
    def test_reply_without_attachments(self, api_session, auth_data):
        """Test that reply without attachments still works (regression)"""
        user_id = auth_data["id"]
        
        # Create a test message
        send_response = api_session.post(
            f"{BASE_URL}/api/messages/send/{user_id}",
            json={
                "recipient_id": user_id,
                "subject": "Test No Attachment Reply",
                "content": "Testing reply without attachments"
            }
        )
        
        assert send_response.status_code == 200
        message_id = send_response.json()["message"]["id"]
        
        # Reply without attachments
        reply_response = api_session.post(
            f"{BASE_URL}/api/messages/reply/{message_id}/{user_id}",
            json={
                "content": "This is a reply without attachments"
            }
        )
        
        assert reply_response.status_code == 200, f"Reply failed: {reply_response.text}"
        reply_data = reply_response.json()
        assert reply_data.get("success"), f"Reply not successful: {reply_data}"
        
        # Verify attachments is empty or not present
        reply_message = reply_data["message"]
        attachments = reply_message.get("attachments", [])
        assert len(attachments) == 0, f"Expected no attachments, got {len(attachments)}"
        
        print(f"✓ Reply without attachments test passed")
    
    def test_reply_with_multiple_attachments(self, api_session, auth_data):
        """Test replying with multiple attachments"""
        user_id = auth_data["id"]
        
        # Create a test message
        send_response = api_session.post(
            f"{BASE_URL}/api/messages/send/{user_id}",
            json={
                "recipient_id": user_id,
                "subject": "Test Multiple Attachments",
                "content": "Testing reply with multiple attachments"
            }
        )
        
        assert send_response.status_code == 200
        message_id = send_response.json()["message"]["id"]
        
        # Upload multiple attachments
        attachments = []
        for i in range(3):
            file_content = f"Attachment content {i+1}".encode()
            files = {
                'file': (f'attachment_{i+1}.txt', io.BytesIO(file_content), 'text/plain')
            }
            data = {'user_id': user_id}
            
            upload_response = requests.post(
                f"{BASE_URL}/api/messages/attachments/upload",
                files=files,
                data=data
            )
            assert upload_response.status_code == 200
            attachments.append(upload_response.json()["attachment"])
        
        print(f"  Uploaded {len(attachments)} attachments")
        
        # Reply with multiple attachments
        reply_response = api_session.post(
            f"{BASE_URL}/api/messages/reply/{message_id}/{user_id}",
            json={
                "content": "Reply with multiple attachments",
                "attachments": attachments
            }
        )
        
        assert reply_response.status_code == 200, f"Reply failed: {reply_response.text}"
        reply_data = reply_response.json()
        assert reply_data.get("success")
        
        reply_message = reply_data["message"]
        assert len(reply_message.get("attachments", [])) == 3, f"Expected 3 attachments, got {len(reply_message.get('attachments', []))}"
        
        print(f"✓ Reply with multiple attachments test passed")


class TestMessageThread:
    """Tests for message thread with attachments"""
    
    def test_thread_includes_attachments(self, api_session, auth_data):
        """Verify thread endpoint returns messages with their attachments"""
        user_id = auth_data["id"]
        
        # Create message with attachment
        send_response = api_session.post(
            f"{BASE_URL}/api/messages/send/{user_id}",
            json={
                "recipient_id": user_id,
                "subject": "Thread Attachment Test",
                "content": "Original message"
            }
        )
        
        assert send_response.status_code == 200
        message_id = send_response.json()["message"]["id"]
        
        # Upload and reply with attachment
        file_content = b"Thread attachment content"
        files = {
            'file': ('thread_attachment.txt', io.BytesIO(file_content), 'text/plain')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/messages/attachments/upload",
            files=files,
            data={'user_id': user_id}
        )
        attachment = upload_response.json()["attachment"]
        
        reply_response = api_session.post(
            f"{BASE_URL}/api/messages/reply/{message_id}/{user_id}",
            json={
                "content": "Reply with attachment in thread",
                "attachments": [attachment]
            }
        )
        
        assert reply_response.status_code == 200
        
        # Fetch thread
        thread_response = api_session.get(f"{BASE_URL}/api/messages/thread/{message_id}")
        assert thread_response.status_code == 200
        
        thread_data = thread_response.json()
        assert thread_data.get("success")
        
        # Find the reply in thread
        thread_messages = thread_data.get("thread", [])
        assert len(thread_messages) >= 2, f"Expected at least 2 messages in thread, got {len(thread_messages)}"
        
        # Check that reply has attachments
        reply_in_thread = [m for m in thread_messages if m.get("parent_id") == message_id]
        assert len(reply_in_thread) > 0, "Reply not found in thread"
        assert len(reply_in_thread[0].get("attachments", [])) == 1, "Reply attachment not in thread"
        
        print(f"✓ Thread includes attachments test passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
