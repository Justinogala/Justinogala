"""
Test onboarding API endpoints:
- GET /api/users/{user_id}/onboarding - Get onboarding status
- PUT /api/users/{user_id}/onboarding - Mark onboarding complete
- DELETE /api/users/{user_id}/onboarding - Reset onboarding for replay
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user ID from context
ORG_MEMBER_USER_ID = "09022027-0ed3-4b65-ac39-13f38e96ad5b"
ORG_MEMBER_EMAIL = "orgmember@munal.com"
ORG_MEMBER_PASSWORD = "OrgMem@123"


class TestOnboardingAPI:
    """Test onboarding API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_onboarding_status_valid_user(self):
        """GET /api/users/{user_id}/onboarding - returns onboarding status for valid user"""
        response = self.session.get(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "onboarding_completed" in data, "Response should contain 'onboarding_completed' field"
        assert isinstance(data["onboarding_completed"], bool), "onboarding_completed should be boolean"
        print(f"✓ GET onboarding status: onboarding_completed={data['onboarding_completed']}")
    
    def test_get_onboarding_status_invalid_user(self):
        """GET /api/users/{user_id}/onboarding - returns 404 for non-existent user"""
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        response = self.session.get(f"{BASE_URL}/api/users/{fake_user_id}/onboarding")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ GET onboarding status for invalid user returns 404")
    
    def test_put_onboarding_complete(self):
        """PUT /api/users/{user_id}/onboarding - marks onboarding as complete"""
        response = self.session.put(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
        assert data.get("onboarding_completed") == True, "Response should have onboarding_completed=True"
        print("✓ PUT onboarding complete: success")
        
        # Verify the change persisted
        verify_response = self.session.get(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("onboarding_completed") == True, "Onboarding should be marked complete after PUT"
        print("✓ Verified onboarding_completed=True persisted")
    
    def test_put_onboarding_invalid_user(self):
        """PUT /api/users/{user_id}/onboarding - returns 404 for non-existent user"""
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        response = self.session.put(f"{BASE_URL}/api/users/{fake_user_id}/onboarding")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ PUT onboarding for invalid user returns 404")
    
    def test_delete_onboarding_reset(self):
        """DELETE /api/users/{user_id}/onboarding - resets onboarding for replay"""
        response = self.session.delete(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
        assert data.get("onboarding_completed") == False, "Response should have onboarding_completed=False"
        print("✓ DELETE onboarding reset: success")
        
        # Verify the change persisted
        verify_response = self.session.get(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data.get("onboarding_completed") == False, "Onboarding should be reset after DELETE"
        print("✓ Verified onboarding_completed=False persisted")
    
    def test_delete_onboarding_invalid_user(self):
        """DELETE /api/users/{user_id}/onboarding - returns 404 for non-existent user"""
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        response = self.session.delete(f"{BASE_URL}/api/users/{fake_user_id}/onboarding")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"
        print("✓ DELETE onboarding for invalid user returns 404")
    
    def test_onboarding_full_flow(self):
        """Test complete onboarding flow: reset -> check -> complete -> check"""
        # Step 1: Reset onboarding
        reset_response = self.session.delete(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert reset_response.status_code == 200, "Reset should succeed"
        print("✓ Step 1: Reset onboarding")
        
        # Step 2: Check status is false
        check1_response = self.session.get(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert check1_response.status_code == 200
        assert check1_response.json().get("onboarding_completed") == False
        print("✓ Step 2: Verified onboarding_completed=False")
        
        # Step 3: Complete onboarding
        complete_response = self.session.put(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert complete_response.status_code == 200
        print("✓ Step 3: Completed onboarding")
        
        # Step 4: Check status is true
        check2_response = self.session.get(f"{BASE_URL}/api/users/{ORG_MEMBER_USER_ID}/onboarding")
        assert check2_response.status_code == 200
        assert check2_response.json().get("onboarding_completed") == True
        print("✓ Step 4: Verified onboarding_completed=True")
        
        print("✓ Full onboarding flow test passed!")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
