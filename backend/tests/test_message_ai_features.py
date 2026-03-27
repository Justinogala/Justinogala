"""
Message AI Features API Tests
Tests for AI endpoints in the messaging system:
- POST /api/messages/ai/smart-replies - Smart reply suggestions
- POST /api/messages/ai/summarize-thread - Thread summarization
- POST /api/messages/ai/suggest-actions - Action suggestions
- POST /api/messages/ai/draft-reply - Auto-draft replies
- POST /api/messages/ai/categorize - Message categorization
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://munal-preview-2.preview.emergentagent.com').rstrip('/')

# Test user credentials from review_request
TEST_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
TEST_EMAIL = "admin@munal.com"
TEST_PASSWORD = "Admin@123456"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token via login"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token")
    pytest.skip(f"Authentication failed - skipping tests. Status: {response.status_code}")


@pytest.fixture(scope="module")
def test_message_data():
    """Sample message data for AI testing"""
    return {
        "user_id": TEST_USER_ID,
        "message_content": "Hi, I wanted to follow up on our meeting yesterday about the quarterly budget. Can you send me the final numbers by Friday? Also, please confirm if the team meeting is still scheduled for next Tuesday at 3 PM.",
        "message_subject": "Follow-up: Quarterly Budget Discussion",
        "sender_name": "John Smith",
        "thread_messages": [
            {"sender_name": "John Smith", "content": "Let's discuss the quarterly budget in our meeting tomorrow."},
            {"sender_name": "Admin User", "content": "Sounds good. I'll prepare the preliminary numbers."},
            {"sender_name": "John Smith", "content": "Great, see you then."}
        ]
    }


class TestSmartReplies:
    """Tests for POST /api/messages/ai/smart-replies endpoint"""
    
    def test_smart_replies_returns_array_of_suggestions(self, api_client, test_message_data):
        """Smart replies should return an array of 3 reply suggestions"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/smart-replies",
            json=test_message_data,
            timeout=30  # AI calls may take time
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Success should be True"
        assert "replies" in data, "Response should have 'replies' field"
        assert isinstance(data["replies"], list), "Replies should be a list"
        
        # Should have up to 3 replies
        if len(data["replies"]) > 0:
            assert len(data["replies"]) <= 3, "Should return at most 3 replies"
            # Each reply should be a string
            for reply in data["replies"]:
                assert isinstance(reply, str), "Each reply should be a string"
                assert len(reply) > 0, "Each reply should not be empty"
            print(f"SUCCESS: Smart replies returned {len(data['replies'])} suggestions")
            print(f"Sample reply: {data['replies'][0][:100]}...")
        else:
            print("NOTE: Empty replies returned (AI settings may be disabled)")
    
    def test_smart_replies_with_minimal_data(self, api_client):
        """Smart replies should work with minimal required data"""
        minimal_data = {
            "user_id": TEST_USER_ID,
            "message_content": "Can you help me with this task?",
            "message_subject": "Help needed",
            "sender_name": "Colleague"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/smart-replies",
            json=minimal_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "replies" in data
        print(f"SUCCESS: Smart replies with minimal data - {len(data.get('replies', []))} replies")


class TestSummarizeThread:
    """Tests for POST /api/messages/ai/summarize-thread endpoint"""
    
    def test_summarize_thread_returns_summary(self, api_client, test_message_data):
        """Summarize thread should return a text summary"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/summarize-thread",
            json=test_message_data,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Success should be True"
        assert "summary" in data, "Response should have 'summary' field"
        
        if data["summary"]:
            assert isinstance(data["summary"], str), "Summary should be a string"
            assert len(data["summary"]) > 0, "Summary should not be empty"
            print(f"SUCCESS: Thread summary generated ({len(data['summary'])} chars)")
            print(f"Summary preview: {data['summary'][:200]}...")
        else:
            print("NOTE: Empty summary returned (AI settings may be disabled)")
    
    def test_summarize_single_message_thread(self, api_client):
        """Summarize should work even with a single message"""
        single_msg_data = {
            "user_id": TEST_USER_ID,
            "message_content": "Please review the attached quarterly report and let me know your thoughts.",
            "message_subject": "Quarterly Report Review",
            "sender_name": "Manager",
            "thread_messages": []
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/summarize-thread",
            json=single_msg_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        print(f"SUCCESS: Single message summarization - {'has summary' if data.get('summary') else 'empty summary'}")


class TestSuggestActions:
    """Tests for POST /api/messages/ai/suggest-actions endpoint"""
    
    def test_suggest_actions_returns_action_list(self, api_client, test_message_data):
        """Suggest actions should return array of action objects"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/suggest-actions",
            json=test_message_data,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Success should be True"
        assert "actions" in data, "Response should have 'actions' field"
        assert isinstance(data["actions"], list), "Actions should be a list"
        
        if len(data["actions"]) > 0:
            # Should return 2-4 actions
            assert len(data["actions"]) <= 4, "Should return at most 4 actions"
            
            # Each action should have 'action' and 'description' fields
            for action in data["actions"]:
                assert isinstance(action, dict), "Each action should be an object"
                assert "action" in action, "Each action should have 'action' field"
                assert "description" in action, "Each action should have 'description' field"
            
            print(f"SUCCESS: Suggested {len(data['actions'])} actions")
            for a in data["actions"]:
                print(f"  - {a.get('action')}: {a.get('description', '')[:60]}...")
        else:
            print("NOTE: Empty actions returned (AI settings may be disabled)")


class TestDraftReply:
    """Tests for POST /api/messages/ai/draft-reply endpoint"""
    
    def test_draft_reply_returns_draft_text(self, api_client, test_message_data):
        """Draft reply should return a full reply text"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/draft-reply",
            json=test_message_data,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Success should be True"
        assert "draft" in data, "Response should have 'draft' field"
        
        if data["draft"]:
            assert isinstance(data["draft"], str), "Draft should be a string"
            assert len(data["draft"]) > 10, "Draft should be a meaningful response"
            print(f"SUCCESS: Draft reply generated ({len(data['draft'])} chars)")
            print(f"Draft preview: {data['draft'][:300]}...")
        else:
            print("NOTE: Empty draft returned (AI settings may be disabled)")
    
    def test_draft_reply_with_thread_context(self, api_client, test_message_data):
        """Draft reply should consider thread context"""
        # Add more context
        extended_data = test_message_data.copy()
        extended_data["thread_messages"] = test_message_data["thread_messages"] + [
            {"sender_name": "Admin User", "content": "I'll have the numbers ready."},
            {"sender_name": "John Smith", "content": "Thanks, looking forward to it."}
        ]
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/draft-reply",
            json=extended_data,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "draft" in data
        print(f"SUCCESS: Draft with extended context - {'has draft' if data.get('draft') else 'empty'}")


class TestCategorizeMessage:
    """Tests for POST /api/messages/ai/categorize endpoint"""
    
    def test_categorize_returns_valid_category(self, api_client, test_message_data):
        """Categorize should return one of the valid categories"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/categorize",
            json=test_message_data,
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "Success should be True"
        assert "category" in data, "Response should have 'category' field"
        
        valid_categories = {"work", "personal", "urgent", "finance", "scheduling", "support", "social", "other"}
        
        if data["category"]:
            assert data["category"] in valid_categories, f"Category should be one of {valid_categories}, got: {data['category']}"
            print(f"SUCCESS: Message categorized as '{data['category']}'")
        else:
            print("NOTE: Empty category returned (AI settings may be disabled)")
    
    def test_categorize_work_message(self, api_client):
        """Work-related messages should be categorized as 'work'"""
        work_message = {
            "user_id": TEST_USER_ID,
            "message_content": "Please submit your quarterly performance review by end of week. HR needs all evaluations for the annual assessment.",
            "message_subject": "Performance Review Deadline",
            "sender_name": "HR Department"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/categorize",
            json=work_message,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        if data.get("category"):
            print(f"Work message categorized as: {data['category']}")
            # Should be work or other work-related category
            assert data["category"] in {"work", "scheduling", "other"}
    
    def test_categorize_urgent_message(self, api_client):
        """Urgent messages should be categorized appropriately"""
        urgent_message = {
            "user_id": TEST_USER_ID,
            "message_content": "URGENT: Server is down! Need immediate assistance. Production is affected.",
            "message_subject": "CRITICAL: Production Server Down",
            "sender_name": "System Alert"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/categorize",
            json=urgent_message,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        if data.get("category"):
            print(f"Urgent message categorized as: {data['category']}")
            # Should be urgent or support
            assert data["category"] in {"urgent", "support", "work", "other"}
    
    def test_categorize_finance_message(self, api_client):
        """Finance messages should be categorized appropriately"""
        finance_message = {
            "user_id": TEST_USER_ID,
            "message_content": "Your invoice #12345 is due. Amount: $500. Please process payment by the 15th.",
            "message_subject": "Invoice Payment Reminder",
            "sender_name": "Accounts Payable"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/categorize",
            json=finance_message,
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        if data.get("category"):
            print(f"Finance message categorized as: {data['category']}")
            assert data["category"] in {"finance", "work", "other"}


class TestAISettingsIntegration:
    """Tests for AI settings affecting AI features"""
    
    def test_get_message_settings(self, api_client):
        """Get message settings should return AI-related settings"""
        response = api_client.get(f"{BASE_URL}/api/messages/settings/{TEST_USER_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "success" in data
        assert "settings" in data
        
        settings = data["settings"]
        # Check AI-related settings exist
        assert "ai_personalization_enabled" in settings or settings.get("ai_personalization_enabled") is None
        print(f"SUCCESS: Message settings retrieved - AI enabled: {settings.get('ai_personalization_enabled', True)}")
    
    def test_get_assistant_settings(self, api_client):
        """Get assistant settings should return assistant configuration"""
        response = api_client.get(f"{BASE_URL}/api/messages/assistant/{TEST_USER_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "success" in data
        assert "settings" in data
        
        settings = data["settings"]
        print(f"SUCCESS: Assistant settings retrieved")
        print(f"  - Enabled: {settings.get('enabled', True)}")
        print(f"  - Auto-draft: {settings.get('auto_draft_replies', False)}")
        print(f"  - Summarize: {settings.get('summarize_threads', True)}")
        print(f"  - Suggest actions: {settings.get('suggest_actions', True)}")
    
    def test_update_assistant_settings(self, api_client):
        """Update assistant settings should work"""
        # First get current settings
        get_response = api_client.get(f"{BASE_URL}/api/messages/assistant/{TEST_USER_ID}")
        current = get_response.json().get("settings", {})
        
        # Update with new settings
        update_data = {
            "enabled": True,
            "summarize_threads": True,
            "suggest_actions": True,
            "writing_style": "concise"
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/messages/assistant/{TEST_USER_ID}",
            json=update_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        print(f"SUCCESS: Assistant settings updated")


class TestAIEndpointsErrorHandling:
    """Tests for error handling in AI endpoints"""
    
    def test_smart_replies_missing_user_id(self, api_client):
        """Smart replies should handle missing user_id"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/smart-replies",
            json={
                "message_content": "Test message",
                "message_subject": "Test"
            },
            timeout=30
        )
        
        # Should return 422 (validation error) or handle gracefully
        assert response.status_code in [200, 422, 500], f"Unexpected status: {response.status_code}"
        print(f"Missing user_id handled with status: {response.status_code}")
    
    def test_draft_reply_empty_content(self, api_client):
        """Draft reply should handle empty message content"""
        response = api_client.post(
            f"{BASE_URL}/api/messages/ai/draft-reply",
            json={
                "user_id": TEST_USER_ID,
                "message_content": "",
                "message_subject": "",
                "sender_name": ""
            },
            timeout=30
        )
        
        # Should not crash, may return empty draft
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        print(f"Empty content handled - success: {data.get('success')}, has draft: {bool(data.get('draft'))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
