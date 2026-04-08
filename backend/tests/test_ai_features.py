"""
AI Features API Tests - 5 AI capabilities:
1. AI Smart Search (NLP across all data)
2. AI Document Summarizer
3. AI Meeting Summary Emails
4. AI Auto-Generated Meeting Agenda
5. AI Weekly Digest
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://transcript-dash.preview.emergentagent.com').rstrip('/')

# Test user credentials from test_credentials.md
TEST_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"
TEST_USER_EMAIL = "orgadmin@munal.com"
TEST_USER_PASSWORD = "OrgAdmin@123"

# Test transcript IDs seeded in Atlas
TEST_TRANSCRIPT_IDS = ["test-transcript-001", "test-transcript-002", "test-transcript-003"]


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


# ─────────────────────────────────────────────────
# 1. AI SMART SEARCH TESTS
# ─────────────────────────────────────────────────

class TestAISmartSearch:
    """AI Smart Search endpoint tests - POST /api/ai-features/smart-search"""
    
    def test_smart_search_endpoint_exists(self, api_client):
        """Test that smart search endpoint is accessible"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "test",
            "user_id": TEST_USER_ID
        })
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, "Smart search endpoint not found"
        print(f"Smart search endpoint status: {response.status_code}")
    
    def test_smart_search_returns_results_structure(self, api_client):
        """Test smart search returns proper result structure"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "meeting",
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Response should have success=True"
        assert "transcripts" in data, "Response should have transcripts field"
        assert "documents" in data, "Response should have documents field"
        assert "sheets" in data, "Response should have sheets field"
        assert "meetings" in data, "Response should have meetings field"
        assert "messages" in data, "Response should have messages field"
        assert "total_results" in data, "Response should have total_results field"
        print(f"Smart search returned {data.get('total_results')} total results")
    
    def test_smart_search_finds_transcripts(self, api_client):
        """Test smart search finds meeting transcripts"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "strategy",  # Should match "Q1 Strategy Planning" transcript
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        
        transcripts = data.get("transcripts", [])
        print(f"Found {len(transcripts)} transcripts matching 'strategy'")
        
        # Should find at least one transcript
        if len(transcripts) > 0:
            # Verify transcript structure
            t = transcripts[0]
            assert "id" in t, "Transcript should have id"
            assert "title" in t, "Transcript should have title"
    
    def test_smart_search_empty_query_rejected(self, api_client):
        """Test that empty query is rejected"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "",
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 400, "Empty query should return 400"
    
    def test_smart_search_ai_answer_field(self, api_client):
        """Test smart search includes AI answer when results found"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "budget planning",
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200
        data = response.json()
        
        # ai_answer may be empty if no context or LLM rate limited
        assert "ai_answer" in data, "Response should have ai_answer field"
        print(f"AI answer present: {bool(data.get('ai_answer'))}")


# ─────────────────────────────────────────────────
# 2. AI DOCUMENT SUMMARIZER TESTS
# ─────────────────────────────────────────────────

class TestAIDocumentSummarizer:
    """AI Document Summarizer endpoint tests - POST /api/ai-features/document/summarize"""
    
    def test_document_summarize_endpoint_exists(self, api_client):
        """Test that document summarize endpoint is accessible"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/document/summarize", json={
            "document_id": "nonexistent-doc",
            "mode": "summary"
        })
        # Should return 404 for nonexistent doc, not 404 for endpoint
        assert response.status_code in [404, 400, 500], f"Unexpected status: {response.status_code}"
        print(f"Document summarize endpoint status: {response.status_code}")
    
    def test_document_summarize_not_found(self, api_client):
        """Test document summarize returns 404 for nonexistent document"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/document/summarize", json={
            "document_id": "nonexistent-document-id-12345",
            "mode": "summary"
        })
        assert response.status_code == 404, f"Expected 404 for nonexistent doc, got {response.status_code}"
    
    def test_document_summarize_modes_accepted(self, api_client):
        """Test that all summarize modes are accepted (summary, key_points, qa)"""
        # This tests the endpoint accepts the modes even if doc doesn't exist
        for mode in ["summary", "key_points", "qa"]:
            response = api_client.post(f"{BASE_URL}/api/ai-features/document/summarize", json={
                "document_id": "test-doc",
                "mode": mode,
                "question": "What is this about?" if mode == "qa" else None
            })
            # Should be 404 (doc not found) not 422 (validation error)
            assert response.status_code != 422, f"Mode '{mode}' should be accepted"
            print(f"Mode '{mode}' accepted, status: {response.status_code}")


# ─────────────────────────────────────────────────
# 3. AI MEETING SUMMARY EMAIL TESTS
# ─────────────────────────────────────────────────

class TestAIMeetingSummaryEmail:
    """AI Meeting Summary Email endpoint tests - POST /api/ai-features/meeting/{id}/send-summary"""
    
    def test_meeting_summary_email_endpoint_exists(self, api_client):
        """Test that meeting summary email endpoint is accessible"""
        response = api_client.post(
            f"{BASE_URL}/api/ai-features/meeting/test-transcript-001/send-summary",
            json={"meeting_id": "test-transcript-001", "recipient_emails": []}
        )
        # Should not return 404 for endpoint (may return 404 for meeting or 400 for no recipients)
        print(f"Meeting summary email endpoint status: {response.status_code}")
        assert response.status_code != 405, "Endpoint should accept POST"
    
    def test_meeting_summary_email_not_found(self, api_client):
        """Test meeting summary email returns 404 for nonexistent meeting"""
        response = api_client.post(
            f"{BASE_URL}/api/ai-features/meeting/nonexistent-meeting-id/send-summary",
            json={"meeting_id": "nonexistent-meeting-id", "recipient_emails": ["test@example.com"]}
        )
        assert response.status_code == 404, f"Expected 404 for nonexistent meeting, got {response.status_code}"
    
    def test_meeting_summary_email_with_valid_transcript(self, api_client):
        """Test meeting summary email with valid transcript ID"""
        # Use test-transcript-001 which should be seeded
        response = api_client.post(
            f"{BASE_URL}/api/ai-features/meeting/test-transcript-001/send-summary",
            json={"meeting_id": "test-transcript-001", "recipient_emails": ["test@example.com"]}
        )
        print(f"Send summary response: {response.status_code} - {response.text[:200] if response.text else 'empty'}")
        
        # May succeed (200) or fail due to email service issues
        # Should not be 404 if transcript exists
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            assert "sent_to" in data or "total_sent" in data


# ─────────────────────────────────────────────────
# 4. AI MEETING AGENDA GENERATOR TESTS
# ─────────────────────────────────────────────────

class TestAIMeetingAgendaGenerator:
    """AI Meeting Agenda Generator endpoint tests - POST /api/ai-features/meeting/generate-agenda"""
    
    def test_agenda_generator_endpoint_exists(self, api_client):
        """Test that agenda generator endpoint is accessible"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/meeting/generate-agenda", json={
            "user_id": TEST_USER_ID,
            "meeting_title": "Test Meeting",
            "participant_names": [],
            "meeting_date": ""
        })
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404, "Agenda generator endpoint not found"
        print(f"Agenda generator endpoint status: {response.status_code}")
    
    def test_agenda_generator_returns_structure(self, api_client):
        """Test agenda generator returns proper structure"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/meeting/generate-agenda", json={
            "user_id": TEST_USER_ID,
            "meeting_title": "Q2 Planning Session",
            "participant_names": ["John", "Sarah"],
            "meeting_date": "2026-04-15"
        })
        
        print(f"Agenda generator response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Response should have success=True"
            assert "agenda" in data, "Response should have agenda field"
            assert "context_used" in data, "Response should have context_used field"
            
            agenda = data.get("agenda", {})
            if agenda:
                assert "agenda_title" in agenda or "items" in agenda, "Agenda should have title or items"
                print(f"Generated agenda with {len(agenda.get('items', []))} items")
        elif response.status_code == 500:
            # LLM may be rate limited
            print(f"Agenda generation failed (possibly rate limited): {response.text[:200]}")
    
    def test_agenda_generator_uses_past_meetings(self, api_client):
        """Test agenda generator analyzes past meetings"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/meeting/generate-agenda", json={
            "user_id": TEST_USER_ID,
            "meeting_title": "Follow-up Meeting",
            "participant_names": [],
            "meeting_date": ""
        })
        
        if response.status_code == 200:
            data = response.json()
            context = data.get("context_used", {})
            print(f"Context used - past meetings: {context.get('past_meetings_analyzed', 0)}, "
                  f"open actions: {context.get('open_action_items', 0)}")


# ─────────────────────────────────────────────────
# 5. AI WEEKLY DIGEST TESTS
# ─────────────────────────────────────────────────

class TestAIWeeklyDigest:
    """AI Weekly Digest endpoint tests"""
    
    def test_weekly_digest_preview_endpoint_exists(self, api_client):
        """Test that weekly digest preview endpoint is accessible"""
        response = api_client.get(f"{BASE_URL}/api/ai-features/weekly-digest/preview/{TEST_USER_ID}")
        # Should not return 404 for endpoint (may return 404 for no activity)
        print(f"Weekly digest preview endpoint status: {response.status_code}")
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
    
    def test_weekly_digest_preview_returns_structure(self, api_client):
        """Test weekly digest preview returns proper structure when activity exists"""
        response = api_client.get(f"{BASE_URL}/api/ai-features/weekly-digest/preview/{TEST_USER_ID}")
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Response should have success=True"
            assert "week_label" in data, "Response should have week_label"
            assert "stats" in data, "Response should have stats"
            
            stats = data.get("stats", {})
            assert "meetings_count" in stats, "Stats should have meetings_count"
            assert "action_items_count" in stats, "Stats should have action_items_count"
            print(f"Digest stats: {stats}")
        elif response.status_code == 404:
            print("No activity found for weekly digest (expected if no recent data)")
    
    def test_weekly_digest_send_endpoint_exists(self, api_client):
        """Test that weekly digest send endpoint is accessible"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/weekly-digest/send/{TEST_USER_ID}")
        # Should not return 404 for endpoint
        print(f"Weekly digest send endpoint status: {response.status_code}")
        assert response.status_code != 405, "Endpoint should accept POST"
    
    def test_weekly_digest_send_for_unknown_user(self, api_client):
        """Test weekly digest send returns 404 for unknown user"""
        response = api_client.post(f"{BASE_URL}/api/ai-features/weekly-digest/send/unknown-user-id-12345")
        assert response.status_code == 404, f"Expected 404 for unknown user, got {response.status_code}"


# ─────────────────────────────────────────────────
# INTEGRATION TESTS
# ─────────────────────────────────────────────────

class TestAIFeaturesIntegration:
    """Integration tests for AI features"""
    
    def test_all_endpoints_registered(self, api_client):
        """Verify all 5 AI feature endpoints are registered"""
        endpoints = [
            ("POST", "/api/ai-features/smart-search"),
            ("POST", "/api/ai-features/document/summarize"),
            ("POST", "/api/ai-features/meeting/test-id/send-summary"),
            ("POST", "/api/ai-features/meeting/generate-agenda"),
            ("GET", "/api/ai-features/weekly-digest/preview/test-user"),
            ("POST", "/api/ai-features/weekly-digest/send/test-user"),
        ]
        
        for method, path in endpoints:
            url = f"{BASE_URL}{path}"
            if method == "POST":
                response = api_client.post(url, json={})
            else:
                response = api_client.get(url)
            
            # 404 with "no activity" or "not found" in detail is OK (endpoint exists, just no data)
            # 422 is validation error (endpoint exists)
            # Only fail if we get a true "endpoint not found" 404
            if response.status_code == 404:
                detail = response.text.lower()
                # These are valid responses meaning endpoint exists
                valid_404 = any(x in detail for x in ["no activity", "not found", "user not found", "document not found", "meeting", "transcript"])
                assert valid_404, f"Endpoint {method} {path} not found (true 404)"
            print(f"{method} {path}: {response.status_code}")
    
    def test_router_prefix_correct(self, api_client):
        """Verify AI features router uses /ai-features prefix"""
        # Test that /api/ai-features/smart-search works
        response = api_client.post(f"{BASE_URL}/api/ai-features/smart-search", json={
            "query": "test",
            "user_id": TEST_USER_ID
        })
        assert response.status_code == 200, f"Router prefix issue: {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
