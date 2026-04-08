"""
Tests for Meeting Transcripts Widget and Export functionality
- GET /api/ai/meeting/user/{user_id} - User transcripts list
- GET /api/ai/meeting/{meeting_id}/export?format=pdf|docx|md - Export endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
TEST_TRANSCRIPT_IDS = ["test-transcript-001", "test-transcript-002", "test-transcript-003"]


class TestUserTranscriptsEndpoint:
    """Tests for GET /api/ai/meeting/user/{user_id}"""
    
    def test_get_user_transcripts_returns_meetings(self):
        """User transcripts endpoint returns meetings list"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "meetings" in data
        assert "count" in data
        assert isinstance(data["meetings"], list)
    
    def test_user_transcripts_count_matches_list(self):
        """Count field matches actual meetings list length"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == len(data["meetings"])
    
    def test_user_transcripts_has_required_fields(self):
        """Each transcript has required fields for widget display"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        if data["meetings"]:
            meeting = data["meetings"][0]
            # Required fields for TranscriptsWidget
            assert "id" in meeting
            assert "title" in meeting
            assert "created_at" in meeting
            assert "status" in meeting
    
    def test_user_transcripts_has_optional_display_fields(self):
        """Transcripts have optional fields for enhanced display"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        if data["meetings"]:
            meeting = data["meetings"][0]
            # Optional but expected fields
            assert "duration_seconds" in meeting
            assert "participants" in meeting
    
    def test_user_transcripts_excludes_mongodb_id(self):
        """Response excludes MongoDB _id field"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        for meeting in data["meetings"]:
            assert "_id" not in meeting
    
    def test_user_transcripts_empty_for_unknown_user(self):
        """Returns empty list for unknown user"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/unknown-user-id-12345")
        assert response.status_code == 200
        data = response.json()
        assert data["meetings"] == []
        assert data["count"] == 0
    
    def test_user_transcripts_limit_parameter(self):
        """Limit parameter works correctly"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/user/{TEST_USER_ID}?limit=1")
        assert response.status_code == 200
        data = response.json()
        assert len(data["meetings"]) <= 1


class TestMeetingStatusEndpoint:
    """Tests for GET /api/ai/meeting/{meeting_id}/status"""
    
    def test_get_meeting_status_success(self):
        """Get status for existing meeting"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/status")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "test-transcript-001"
        assert data["status"] == "completed"
    
    def test_meeting_status_not_found(self):
        """Returns 404 for non-existent meeting"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/non-existent-meeting-xyz/status")
        assert response.status_code == 404
    
    def test_meeting_status_has_transcript_and_insights(self):
        """Completed meeting has transcript and insights"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/status")
        assert response.status_code == 200
        data = response.json()
        assert "transcript" in data
        assert "insights" in data


class TestExportPDFEndpoint:
    """Tests for GET /api/ai/meeting/{meeting_id}/export?format=pdf"""
    
    def test_export_pdf_success(self):
        """PDF export returns valid PDF"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=pdf")
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        # PDF files start with %PDF
        assert response.content[:4] == b'%PDF'
    
    def test_export_pdf_has_content_disposition(self):
        """PDF export has Content-Disposition header"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=pdf")
        assert response.status_code == 200
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert ".pdf" in content_disposition
    
    def test_export_pdf_not_found(self):
        """PDF export returns 404 for non-existent meeting"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/non-existent-id/export?format=pdf")
        assert response.status_code == 404


class TestExportDOCXEndpoint:
    """Tests for GET /api/ai/meeting/{meeting_id}/export?format=docx"""
    
    def test_export_docx_success(self):
        """DOCX export returns valid DOCX"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=docx")
        assert response.status_code == 200
        assert "openxmlformats-officedocument.wordprocessingml.document" in response.headers.get("content-type", "")
        # DOCX files are ZIP archives starting with PK
        assert response.content[:2] == b'PK'
    
    def test_export_docx_has_content_disposition(self):
        """DOCX export has Content-Disposition header"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=docx")
        assert response.status_code == 200
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert ".docx" in content_disposition
    
    def test_export_docx_not_found(self):
        """DOCX export returns 404 for non-existent meeting"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/non-existent-id/export?format=docx")
        assert response.status_code == 404


class TestExportMarkdownEndpoint:
    """Tests for GET /api/ai/meeting/{meeting_id}/export?format=md"""
    
    def test_export_md_success(self):
        """Markdown export returns valid markdown"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=md")
        assert response.status_code == 200
        assert "text/markdown" in response.headers.get("content-type", "")
        # Markdown should start with # (heading)
        assert response.text.startswith("#")
    
    def test_export_md_contains_sections(self):
        """Markdown export contains expected sections"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=md")
        assert response.status_code == 200
        content = response.text
        assert "## Summary" in content
        assert "## Full Transcript" in content
    
    def test_export_md_has_content_disposition(self):
        """Markdown export has Content-Disposition header"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=md")
        assert response.status_code == 200
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition
        assert ".md" in content_disposition
    
    def test_export_md_not_found(self):
        """Markdown export returns 404 for non-existent meeting"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/non-existent-id/export?format=md")
        assert response.status_code == 404


class TestExportValidation:
    """Tests for export endpoint validation"""
    
    def test_export_invalid_format(self):
        """Invalid format returns 422"""
        response = requests.get(f"{BASE_URL}/api/ai/meeting/test-transcript-001/export?format=txt")
        assert response.status_code == 422
    
    def test_export_all_test_transcripts(self):
        """All test transcripts can be exported"""
        for transcript_id in TEST_TRANSCRIPT_IDS:
            response = requests.get(f"{BASE_URL}/api/ai/meeting/{transcript_id}/export?format=md")
            assert response.status_code == 200, f"Failed to export {transcript_id}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
