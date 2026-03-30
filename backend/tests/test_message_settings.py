"""
Message Settings API Tests
Tests for: Settings, Filters, Contacts, Assistant endpoints
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://admin-audit-hub-1.preview.emergentagent.com')

# Test user ID - will be set after login
TEST_USER_ID = None
TEST_USER_EMAIL = "admin@munal.com"
TEST_USER_PASSWORD = "Admin@123456"

@pytest.fixture(scope="module")
def auth_session():
    """Get authenticated session and user ID"""
    global TEST_USER_ID
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    
    # Login to get user ID
    response = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER_EMAIL,
        "password": TEST_USER_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    TEST_USER_ID = data.get("user", {}).get("id")
    assert TEST_USER_ID, "Failed to get user ID from login"
    
    return session, TEST_USER_ID

# ============== Settings API Tests ==============

class TestMessageSettings:
    """Message Settings CRUD tests"""
    
    def test_get_settings_default(self, auth_session):
        """GET /api/messages/settings/{user_id} - returns default settings"""
        session, user_id = auth_session
        response = session.get(f"{BASE_URL}/api/messages/settings/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "settings" in data
        
        settings = data["settings"]
        # Verify default settings structure
        assert "user_id" in settings
        assert settings["user_id"] == user_id
        print(f"✓ GET settings returned defaults for user {user_id}")
    
    def test_update_settings_notifications(self, auth_session):
        """PUT /api/messages/settings/{user_id} - update notifications"""
        session, user_id = auth_session
        
        # Update settings
        update_data = {
            "notifications_enabled": False,
            "notification_sound": False
        }
        
        response = session.put(
            f"{BASE_URL}/api/messages/settings/{user_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Verify updated values
        settings = data["settings"]
        assert settings["notifications_enabled"] == False
        assert settings["notification_sound"] == False
        print("✓ Notifications settings updated successfully")
    
    def test_update_settings_signature(self, auth_session):
        """PUT /api/messages/settings/{user_id} - update signature"""
        session, user_id = auth_session
        
        test_signature = "TEST_Best regards,\nTest User\nQA Engineer"
        
        response = session.put(
            f"{BASE_URL}/api/messages/settings/{user_id}",
            json={"signature": test_signature}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["settings"]["signature"] == test_signature
        
        # Verify by GET
        get_response = session.get(f"{BASE_URL}/api/messages/settings/{user_id}")
        assert get_response.status_code == 200
        assert get_response.json()["settings"]["signature"] == test_signature
        print("✓ Signature saved and persisted correctly")
    
    def test_update_settings_email_alias(self, auth_session):
        """PUT /api/messages/settings/{user_id} - update email alias"""
        session, user_id = auth_session
        
        test_alias = "TEST_Admin from Support"
        
        response = session.put(
            f"{BASE_URL}/api/messages/settings/{user_id}",
            json={"email_alias": test_alias}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["email_alias"] == test_alias
        print("✓ Email alias saved correctly")
    
    def test_update_settings_auto_reply(self, auth_session):
        """PUT /api/messages/settings/{user_id} - update auto reply"""
        session, user_id = auth_session
        
        response = session.put(
            f"{BASE_URL}/api/messages/settings/{user_id}",
            json={
                "auto_reply_enabled": True,
                "auto_reply_message": "TEST_I am currently out of office."
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["auto_reply_enabled"] == True
        assert "out of office" in data["settings"]["auto_reply_message"]
        print("✓ Auto-reply settings saved correctly")
    
    def test_update_settings_ai_personalization(self, auth_session):
        """PUT /api/messages/settings/{user_id} - update AI settings"""
        session, user_id = auth_session
        
        response = session.put(
            f"{BASE_URL}/api/messages/settings/{user_id}",
            json={
                "ai_personalization_enabled": True,
                "ai_tone": "casual",
                "ai_auto_categorize": True,
                "ai_smart_replies": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["settings"]["ai_personalization_enabled"] == True
        assert data["settings"]["ai_tone"] == "casual"
        assert data["settings"]["ai_auto_categorize"] == True
        assert data["settings"]["ai_smart_replies"] == True
        print("✓ AI personalization settings saved correctly")


# ============== Filters API Tests ==============

class TestMessageFilters:
    """Message Filters CRUD tests"""
    
    created_filter_id = None
    
    def test_get_filters_empty(self, auth_session):
        """GET /api/messages/filters/{user_id} - get filters"""
        session, user_id = auth_session
        
        response = session.get(f"{BASE_URL}/api/messages/filters/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "filters" in data
        assert isinstance(data["filters"], list)
        print(f"✓ GET filters returned {len(data['filters'])} filters")
    
    def test_create_filter(self, auth_session):
        """POST /api/messages/filters/{user_id} - create filter"""
        session, user_id = auth_session
        
        filter_data = {
            "name": "TEST_Work Emails Filter",
            "conditions": {
                "field": "from",
                "operator": "contains",
                "value": "@work.com"
            },
            "action": "move_to_folder",
            "action_value": "inbox"
        }
        
        response = session.post(
            f"{BASE_URL}/api/messages/filters/{user_id}",
            json=filter_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "filter" in data
        
        created_filter = data["filter"]
        TestMessageFilters.created_filter_id = created_filter["id"]
        
        assert created_filter["name"] == filter_data["name"]
        assert created_filter["conditions"]["field"] == "from"
        assert created_filter["action"] == "move_to_folder"
        assert created_filter["enabled"] == True
        print(f"✓ Filter created with ID: {created_filter['id']}")
    
    def test_update_filter(self, auth_session):
        """PUT /api/messages/filters/{filter_id} - update filter"""
        session, user_id = auth_session
        
        if not TestMessageFilters.created_filter_id:
            pytest.skip("No filter created to update")
        
        update_data = {
            "name": "TEST_Updated Work Filter",
            "conditions": {
                "field": "subject",
                "operator": "contains",
                "value": "urgent"
            },
            "action": "star"
        }
        
        response = session.put(
            f"{BASE_URL}/api/messages/filters/{TestMessageFilters.created_filter_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["filter"]["name"] == "TEST_Updated Work Filter"
        assert data["filter"]["action"] == "star"
        print("✓ Filter updated successfully")
    
    def test_delete_filter(self, auth_session):
        """DELETE /api/messages/filters/{filter_id} - delete filter"""
        session, user_id = auth_session
        
        if not TestMessageFilters.created_filter_id:
            pytest.skip("No filter created to delete")
        
        response = session.delete(
            f"{BASE_URL}/api/messages/filters/{TestMessageFilters.created_filter_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Filter deleted successfully")
        
        # Verify deletion
        get_response = session.get(f"{BASE_URL}/api/messages/filters/{user_id}")
        filters = get_response.json().get("filters", [])
        assert not any(f["id"] == TestMessageFilters.created_filter_id for f in filters)
        print("✓ Filter verified deleted from list")


# ============== Contacts API Tests ==============

class TestMessageContacts:
    """Message Contacts CRUD tests"""
    
    created_contact_id = None
    
    def test_get_contacts_empty(self, auth_session):
        """GET /api/messages/contacts/{user_id} - get contacts"""
        session, user_id = auth_session
        
        response = session.get(f"{BASE_URL}/api/messages/contacts/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "contacts" in data
        assert "groups" in data
        assert isinstance(data["contacts"], list)
        print(f"✓ GET contacts returned {len(data['contacts'])} contacts")
    
    def test_create_contact(self, auth_session):
        """POST /api/messages/contacts/{user_id} - create contact"""
        session, user_id = auth_session
        
        contact_data = {
            "name": "TEST_John Doe",
            "email": "test.john.doe@example.com",
            "nickname": "johnny",
            "notes": "Test contact for QA",
            "group": "Work"
        }
        
        response = session.post(
            f"{BASE_URL}/api/messages/contacts/{user_id}",
            json=contact_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "contact" in data
        
        created_contact = data["contact"]
        TestMessageContacts.created_contact_id = created_contact["id"]
        
        assert created_contact["name"] == contact_data["name"]
        assert created_contact["email"] == contact_data["email"]
        assert created_contact["nickname"] == contact_data["nickname"]
        assert created_contact["group"] == "Work"
        print(f"✓ Contact created with ID: {created_contact['id']}")
    
    def test_update_contact(self, auth_session):
        """PUT /api/messages/contacts/{contact_id} - update contact"""
        session, user_id = auth_session
        
        if not TestMessageContacts.created_contact_id:
            pytest.skip("No contact created to update")
        
        update_data = {
            "name": "TEST_John Smith Updated",
            "email": "test.john.smith@example.com",
            "nickname": "john",
            "notes": "Updated test contact",
            "group": "Friends"
        }
        
        response = session.put(
            f"{BASE_URL}/api/messages/contacts/{TestMessageContacts.created_contact_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert data["contact"]["name"] == "TEST_John Smith Updated"
        assert data["contact"]["group"] == "Friends"
        print("✓ Contact updated successfully")
    
    def test_delete_contact(self, auth_session):
        """DELETE /api/messages/contacts/{contact_id} - delete contact"""
        session, user_id = auth_session
        
        if not TestMessageContacts.created_contact_id:
            pytest.skip("No contact created to delete")
        
        response = session.delete(
            f"{BASE_URL}/api/messages/contacts/{TestMessageContacts.created_contact_id}"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print("✓ Contact deleted successfully")


# ============== Assistant Settings API Tests ==============

class TestAssistantSettings:
    """AI Assistant Settings tests"""
    
    def test_get_assistant_settings(self, auth_session):
        """GET /api/messages/assistant/{user_id} - get assistant settings"""
        session, user_id = auth_session
        
        response = session.get(f"{BASE_URL}/api/messages/assistant/{user_id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "settings" in data
        
        settings = data["settings"]
        assert "enabled" in settings
        assert "auto_draft_replies" in settings
        assert "summarize_threads" in settings
        assert "suggest_actions" in settings
        assert "writing_style" in settings
        print("✓ GET assistant settings returned default values")
    
    def test_update_assistant_settings(self, auth_session):
        """PUT /api/messages/assistant/{user_id} - update assistant settings"""
        session, user_id = auth_session
        
        update_data = {
            "enabled": True,
            "auto_draft_replies": True,
            "summarize_threads": True,
            "suggest_actions": False,
            "writing_style": "concise"
        }
        
        response = session.put(
            f"{BASE_URL}/api/messages/assistant/{user_id}",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        settings = data["settings"]
        assert settings["enabled"] == True
        assert settings["auto_draft_replies"] == True
        assert settings["suggest_actions"] == False
        assert settings["writing_style"] == "concise"
        print("✓ Assistant settings updated successfully")
        
        # Verify by GET
        get_response = session.get(f"{BASE_URL}/api/messages/assistant/{user_id}")
        get_settings = get_response.json()["settings"]
        assert get_settings["writing_style"] == "concise"
        print("✓ Assistant settings persisted correctly")


# ============== Cleanup ==============

def test_cleanup_test_data(auth_session):
    """Clean up test data - restore defaults"""
    session, user_id = auth_session
    
    # Reset settings to defaults
    session.put(
        f"{BASE_URL}/api/messages/settings/{user_id}",
        json={
            "notifications_enabled": True,
            "notification_sound": True,
            "signature": "",
            "email_alias": "",
            "auto_reply_enabled": False,
            "auto_reply_message": "",
            "ai_personalization_enabled": True,
            "ai_tone": "professional"
        }
    )
    
    # Reset assistant settings
    session.put(
        f"{BASE_URL}/api/messages/assistant/{user_id}",
        json={
            "enabled": True,
            "auto_draft_replies": False,
            "summarize_threads": True,
            "suggest_actions": True,
            "writing_style": "match_my_style"
        }
    )
    
    print("✓ Test data cleaned up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
