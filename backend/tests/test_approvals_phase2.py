"""
Test Approvals Phase 2 Features:
- Analytics Dashboard (GET /api/approvals/analytics)
- Duplicate Endpoint (POST /api/approvals/duplicate/{id})
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user IDs 
TEST_USER_ID = "test-user-1"  # User with 22+ approvals as per context
ADMIN_USER_ID = "admin-test-p2"


class TestAnalyticsEndpoint:
    """Analytics Dashboard API Tests"""
    
    def test_analytics_endpoint_returns_200(self):
        """Verify analytics endpoint is accessible and returns 200"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Analytics endpoint returns 200")
    
    def test_analytics_returns_volume_trend(self):
        """Verify volume_trend has 30 data points for last 30 days"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "volume_trend" in data, "Missing volume_trend in response"
        volume = data["volume_trend"]
        assert len(volume) == 30, f"Expected 30 days of data, got {len(volume)}"
        
        # Verify structure of each data point
        for point in volume:
            assert "date" in point, "volume_trend point missing 'date'"
            assert "created" in point, "volume_trend point missing 'created'"
            assert "resolved" in point, "volume_trend point missing 'resolved'"
        print(f"✓ volume_trend has 30 data points with correct structure")
    
    def test_analytics_returns_status_breakdown(self):
        """Verify status_breakdown in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "status_breakdown" in data, "Missing status_breakdown"
        for item in data["status_breakdown"]:
            assert "status" in item, "status_breakdown item missing 'status'"
            assert "count" in item, "status_breakdown item missing 'count'"
        print(f"✓ status_breakdown present with {len(data['status_breakdown'])} statuses")
    
    def test_analytics_returns_category_breakdown(self):
        """Verify category_breakdown in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "category_breakdown" in data, "Missing category_breakdown"
        for item in data["category_breakdown"]:
            assert "category" in item, "category_breakdown item missing 'category'"
            assert "count" in item, "category_breakdown item missing 'count'"
        print(f"✓ category_breakdown present with {len(data['category_breakdown'])} categories")
    
    def test_analytics_returns_resolution_by_category(self):
        """Verify resolution_by_category in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "resolution_by_category" in data, "Missing resolution_by_category"
        for item in data["resolution_by_category"]:
            assert "category" in item, "resolution_by_category item missing 'category'"
            assert "avg_hours" in item, "resolution_by_category item missing 'avg_hours'"
            assert "count" in item, "resolution_by_category item missing 'count'"
        print(f"✓ resolution_by_category present with {len(data['resolution_by_category'])} categories")
    
    def test_analytics_returns_summary(self):
        """Verify summary stats in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data, "Missing summary"
        summary = data["summary"]
        
        required_fields = ["total_requests", "approved", "rejected", "pending", 
                         "approval_rate", "avg_resolution_hours", "most_active_category"]
        for field in required_fields:
            assert field in summary, f"Summary missing '{field}'"
        
        # Verify approval_rate is a percentage
        assert 0 <= summary["approval_rate"] <= 100, "approval_rate should be 0-100"
        print(f"✓ Summary contains all required fields: {list(summary.keys())}")
    
    def test_analytics_approval_rate_calculation(self):
        """Verify approval_rate is calculated correctly"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        summary = data["summary"]
        approved = summary.get("approved", 0)
        rejected = summary.get("rejected", 0)
        calculated_rate = round((approved / max(approved + rejected, 1)) * 100, 1)
        
        assert summary["approval_rate"] == calculated_rate, \
            f"Approval rate mismatch: expected {calculated_rate}, got {summary['approval_rate']}"
        print(f"✓ Approval rate correctly calculated as {summary['approval_rate']}%")
    
    def test_analytics_returns_bottlenecks(self):
        """Verify bottlenecks array in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "bottlenecks" in data, "Missing bottlenecks"
        assert isinstance(data["bottlenecks"], list), "bottlenecks should be a list"
        
        # Verify structure if bottlenecks exist
        for b in data["bottlenecks"]:
            assert "type" in b, "Bottleneck missing 'type'"
            assert "severity" in b, "Bottleneck missing 'severity'"
            assert "message" in b, "Bottleneck missing 'message'"
            assert b["type"] in ["slow_approver", "stuck_request"], f"Unknown bottleneck type: {b['type']}"
        print(f"✓ bottlenecks present with {len(data['bottlenecks'])} items")
    
    def test_analytics_returns_insights(self):
        """Verify AI insights in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "insights" in data, "Missing insights"
        assert isinstance(data["insights"], list), "insights should be a list"
        
        # Verify structure if insights exist
        valid_types = ["trend", "rejection_rate", "approval_rate", "bottleneck", "pattern"]
        for ins in data["insights"]:
            assert "type" in ins, "Insight missing 'type'"
            assert "title" in ins, "Insight missing 'title'"
            assert "detail" in ins, "Insight missing 'detail'"
            assert "severity" in ins, "Insight missing 'severity'"
            assert ins["type"] in valid_types, f"Unknown insight type: {ins['type']}"
        print(f"✓ insights present with {len(data['insights'])} items")


class TestDuplicateEndpoint:
    """Duplicate Approval API Tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get an existing approval ID for duplicate tests"""
        response = requests.get(f"{BASE_URL}/api/approvals/list?user_id={TEST_USER_ID}&tab=sent")
        if response.status_code == 200:
            approvals = response.json().get("approvals", [])
            if approvals:
                self.existing_approval = approvals[0]
                self.existing_approval_id = self.existing_approval["id"]
            else:
                pytest.skip("No existing approvals to duplicate")
        else:
            pytest.skip("Could not fetch approvals list")
    
    def test_duplicate_returns_200(self):
        """Verify duplicate endpoint returns 200"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        print(f"✓ Duplicate endpoint returns 200 with success: true")
    
    def test_duplicate_creates_new_approval(self):
        """Verify duplicate creates a new approval with different ID"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert new_approval, "Missing approval in response"
        assert new_approval["id"] != self.existing_approval_id, "Duplicate should have new ID"
        print(f"✓ New approval created with ID: {new_approval['id']}")
    
    def test_duplicate_has_copy_suffix_in_title(self):
        """Verify duplicated approval has '(Copy)' suffix in title"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert "(Copy)" in new_approval["title"], f"Title should contain '(Copy)': {new_approval['title']}"
        print(f"✓ Duplicated title: '{new_approval['title']}'")
    
    def test_duplicate_preserves_form_data(self):
        """Verify duplicated approval preserves form_data from original"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        original_form = self.existing_approval.get("form_data", {})
        new_form = new_approval.get("form_data", {})
        
        assert new_form == original_form, "form_data should be preserved"
        print(f"✓ form_data preserved: {new_form}")
    
    def test_duplicate_preserves_category(self):
        """Verify duplicated approval preserves category"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert new_approval["category"] == self.existing_approval.get("category", "General"), \
            "Category should be preserved"
        print(f"✓ Category preserved: {new_approval['category']}")
    
    def test_duplicate_preserves_priority(self):
        """Verify duplicated approval preserves priority"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert new_approval["priority"] == self.existing_approval.get("priority", "Medium"), \
            "Priority should be preserved"
        print(f"✓ Priority preserved: {new_approval['priority']}")
    
    def test_duplicate_preserves_approvers(self):
        """Verify duplicated approval preserves approvers from original"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        original_steps = self.existing_approval.get("steps", [])
        new_steps = new_approval.get("steps", [])
        
        # Same number of steps
        assert len(new_steps) == len(original_steps), "Should have same number of approvers"
        
        # Approver IDs should match
        for i, step in enumerate(new_steps):
            if i < len(original_steps):
                assert step["approver_id"] == original_steps[i]["approver_id"], \
                    "Approver IDs should match"
        print(f"✓ Approvers preserved: {len(new_steps)} steps")
    
    def test_duplicate_has_pending_status(self):
        """Verify duplicated approval has 'pending' status"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert new_approval["status"] == "pending", f"Status should be 'pending', got {new_approval['status']}"
        print(f"✓ Status is 'pending'")
    
    def test_duplicate_has_duplicated_source(self):
        """Verify duplicated approval has source='Duplicated'"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/{self.existing_approval_id}?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 200
        data = response.json()
        
        new_approval = data.get("approval")
        assert new_approval.get("source") == "Duplicated", \
            f"Source should be 'Duplicated', got {new_approval.get('source')}"
        print(f"✓ Source is 'Duplicated'")
    
    def test_duplicate_with_invalid_id_returns_404(self):
        """Verify duplicate with non-existent ID returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/approvals/duplicate/invalid-id-123?user_id={TEST_USER_ID}&user_name=Test%20User&user_email=test@example.com"
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Invalid ID returns 404")


class TestBottleneckDetection:
    """Bottleneck Detection Tests (pending > 72h)"""
    
    def test_stuck_request_detection_logic(self):
        """Verify stuck request detection criteria (pending > 72 hours)"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        bottlenecks = data.get("bottlenecks", [])
        stuck = [b for b in bottlenecks if b["type"] == "stuck_request"]
        
        # Verify stuck requests have required fields
        for b in stuck:
            assert "age_hours" in b, "Stuck request should have age_hours"
            assert b["age_hours"] > 72, f"Stuck request should be > 72h: {b['age_hours']}"
            assert "title" in b, "Stuck request should have title"
            assert "approval_id" in b, "Stuck request should have approval_id"
            assert "message" in b, "Stuck request should have message"
        
        print(f"✓ Bottleneck detection working. Found {len(stuck)} stuck requests")
    
    def test_bottleneck_severity_levels(self):
        """Verify bottleneck severity is high for > 7 days"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        bottlenecks = data.get("bottlenecks", [])
        for b in bottlenecks:
            if b["type"] == "stuck_request":
                if b.get("age_hours", 0) > 168:  # > 7 days
                    assert b["severity"] == "high", "Should be high severity for > 7 days"
                elif b.get("age_hours", 0) > 72:  # > 3 days
                    assert b["severity"] in ["high", "medium"], "Should be medium/high for > 3 days"
        
        print(f"✓ Bottleneck severity levels working correctly")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
