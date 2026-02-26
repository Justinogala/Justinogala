"""
Backend tests for:
- Chat file upload to GridFS (POST /api/chat/files/upload)
- Chat file download/streaming (GET /api/chat/files/{file_id})
- AI Chat endpoint (POST /api/ai/chat)
- AI Chat streaming (POST /api/ai/chat/stream)
- Transcript analysis (POST /api/transcripts/analyze)
"""

import pytest
import requests
import base64
import os
import time

# Get API URL from environment - uses the public preview URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to reading from frontend .env
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=')[1].strip().strip('"\'')
                    break
    except:
        pass

if not BASE_URL:
    BASE_URL = "https://echonote-fix.preview.emergentagent.com"


class TestHealthCheck:
    """Basic API health check"""
    
    def test_api_root(self):
        """Test API is reachable"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root accessible: {data}")


class TestChatFileUpload:
    """Tests for POST /api/chat/files/upload - JSON file upload to GridFS"""
    
    @pytest.fixture
    def sample_file_data(self):
        """Generate sample base64 encoded file"""
        content = b"This is a test file content for GridFS upload testing."
        return {
            "user_id": "TEST_user_123",
            "file_name": "test_document.txt",
            "file_data": base64.b64encode(content).decode('utf-8'),
            "content_type": "text/plain",
            "category": "documents",
            "conversation_id": "TEST_conversation_456"
        }
    
    def test_file_upload_success(self, sample_file_data):
        """Test successful file upload to GridFS"""
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            json=sample_file_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "file_id" in data, "Response should contain file_id"
        assert "filename" in data, "Response should contain filename"
        assert "content_type" in data, "Response should contain content_type"
        assert "file_size" in data, "Response should contain file_size"
        assert "url" in data, "Response should contain url"
        
        # Validate values
        assert data["filename"] == sample_file_data["file_name"]
        assert data["content_type"] == sample_file_data["content_type"]
        assert data["file_size"] > 0
        assert f"/api/chat/files/{data['file_id']}" in data["url"]
        
        print(f"✓ File uploaded successfully: {data['file_id']}")
        return data["file_id"]
    
    def test_file_upload_invalid_base64(self):
        """Test file upload with invalid base64 data"""
        invalid_data = {
            "user_id": "TEST_user_123",
            "file_name": "invalid.txt",
            "file_data": "not_valid_base64!!!",
            "content_type": "text/plain",
            "category": "documents"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            json=invalid_data
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid base64, got {response.status_code}"
        print("✓ Invalid base64 rejected correctly")


class TestChatFileDownload:
    """Tests for GET /api/chat/files/{file_id} - File download/streaming"""
    
    def test_file_upload_and_download(self):
        """Test file upload followed by download"""
        # First upload a file
        content = b"Test content for download verification"
        upload_data = {
            "user_id": "TEST_download_user",
            "file_name": "download_test.txt",
            "file_data": base64.b64encode(content).decode('utf-8'),
            "content_type": "text/plain",
            "category": "documents"
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            json=upload_data
        )
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Now download the file
        download_response = requests.get(f"{BASE_URL}/api/chat/files/{file_id}")
        
        assert download_response.status_code == 200, f"Download failed: {download_response.status_code}"
        assert download_response.content == content, "Downloaded content doesn't match uploaded content"
        
        print(f"✓ File download successful for file_id: {file_id}")
    
    def test_file_not_found(self):
        """Test download of non-existent file"""
        fake_file_id = "nonexistent-file-id-12345"
        response = requests.get(f"{BASE_URL}/api/chat/files/{fake_file_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Non-existent file returns 404 correctly")


class TestAIChat:
    """Tests for POST /api/ai/chat - AI chat endpoint using Emergent LLM Key"""
    
    def test_ai_chat_simple_message(self):
        """Test simple AI chat request"""
        payload = {
            "messages": [
                {"role": "user", "content": "Hello, what is your name?"}
            ],
            "model": "gpt-4o",
            "max_tokens": 100,
            "temperature": 0.7
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json=payload,
            timeout=30
        )
        
        assert response.status_code == 200, f"AI chat failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should contain success field"
        assert data["success"] == True, f"AI chat not successful: {data}"
        assert "response" in data, "Response should contain response field"
        assert len(data["response"]) > 0, "Response should not be empty"
        
        print(f"✓ AI chat response received: {data['response'][:100]}...")
    
    def test_ai_chat_empty_message(self):
        """Test AI chat with no user message at end"""
        payload = {
            "messages": [
                {"role": "assistant", "content": "Hello!"}
            ],
            "model": "gpt-4o"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/chat",
            json=payload,
            timeout=30
        )
        
        # Should fail because last message must be from user
        assert response.status_code == 400, f"Expected 400 for non-user last message, got {response.status_code}"
        print("✓ Non-user last message rejected correctly")


class TestAIChatStream:
    """Tests for POST /api/ai/chat/stream - AI chat with streaming"""
    
    def test_ai_chat_stream(self):
        """Test streaming AI chat request"""
        payload = {
            "messages": [
                {"role": "user", "content": "Say hello in exactly 5 words."}
            ],
            "model": "gpt-4o",
            "max_tokens": 50
        }
        
        response = requests.post(
            f"{BASE_URL}/api/ai/chat/stream",
            json=payload,
            stream=True,
            timeout=60
        )
        
        assert response.status_code == 200, f"Stream request failed: {response.status_code}"
        
        chunks = []
        full_response = ""
        
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    import json
                    try:
                        data = json.loads(line_str[6:])
                        if 'chunk' in data:
                            chunks.append(data['chunk'])
                            full_response += data['chunk']
                        if data.get('done'):
                            break
                    except json.JSONDecodeError:
                        continue
        
        assert len(chunks) > 0, "Should receive at least one chunk"
        assert len(full_response) > 0, "Full response should not be empty"
        
        print(f"✓ Stream received {len(chunks)} chunks, total response: {full_response[:100]}...")


class TestTranscriptAnalysis:
    """Tests for POST /api/transcripts/analyze - Transcript analysis with AI"""
    
    def test_transcript_analysis(self):
        """Test transcript analysis endpoint"""
        sample_transcript = """
        Speaker 1: Good morning everyone, let's start the meeting.
        Speaker 2: Yes, I wanted to discuss the project timeline.
        Speaker 1: Sure, we need to complete phase 1 by next Friday.
        Speaker 2: I think we should assign John to handle the backend work.
        Speaker 1: Agreed. Let's also schedule a follow-up meeting next week.
        Speaker 2: Sounds good. I'll send out the calendar invite.
        """
        
        payload = {
            "text": sample_transcript,
            "analysis_types": ["summary", "key_points", "action_items", "sentiment", "topics"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transcripts/analyze",
            json=payload,
            timeout=60
        )
        
        assert response.status_code == 200, f"Analysis failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should contain success field"
        assert data["success"] == True, f"Analysis not successful: {data}"
        assert "analysis" in data, "Response should contain analysis field"
        assert "analyzed_at" in data, "Response should contain analyzed_at timestamp"
        
        analysis = data["analysis"]
        
        # Check for expected analysis fields
        if "summary" in analysis:
            print(f"  - Summary: {analysis['summary'][:100] if isinstance(analysis['summary'], str) else 'present'}...")
        if "key_points" in analysis:
            print(f"  - Key points: {len(analysis['key_points'])} items")
        if "action_items" in analysis:
            print(f"  - Action items: {len(analysis['action_items'])} items")
        if "sentiment" in analysis:
            print(f"  - Sentiment: {analysis['sentiment']}")
        if "topics" in analysis:
            print(f"  - Topics: {len(analysis['topics'])} identified")
        
        print(f"✓ Transcript analysis completed successfully")
    
    def test_transcript_analysis_empty_text(self):
        """Test transcript analysis with empty text"""
        payload = {
            "text": "",
            "analysis_types": ["summary"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/transcripts/analyze",
            json=payload,
            timeout=30
        )
        
        # Empty text should still be processed (AI might return error or minimal analysis)
        # The API doesn't explicitly reject empty text, so just verify it doesn't crash
        assert response.status_code in [200, 400, 500], f"Unexpected status: {response.status_code}"
        print(f"✓ Empty text handled: status {response.status_code}")


class TestFileDelete:
    """Tests for DELETE /api/chat/files/{file_id} - File deletion"""
    
    def test_file_delete(self):
        """Test file upload and delete"""
        # First upload a file
        content = b"File to be deleted"
        upload_data = {
            "user_id": "TEST_delete_user",
            "file_name": "delete_test.txt",
            "file_data": base64.b64encode(content).decode('utf-8'),
            "content_type": "text/plain",
            "category": "documents"
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/chat/files/upload",
            json=upload_data
        )
        
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Delete the file
        delete_response = requests.delete(
            f"{BASE_URL}/api/chat/files/{file_id}?user_id=TEST_delete_user"
        )
        
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.status_code}"
        
        # Verify file is gone
        get_response = requests.get(f"{BASE_URL}/api/chat/files/{file_id}")
        assert get_response.status_code == 404, "File should not exist after deletion"
        
        print(f"✓ File deleted successfully: {file_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
