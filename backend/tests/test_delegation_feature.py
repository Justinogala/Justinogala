"""
Tests for Approval Delegation Feature
- POST /api/approvals/delegate/{id} - delegate a pending approval step
- Delegation blocked when approval is not pending (400)
- Delegation blocked when user has no pending step (400)
- Delegated user can approve via POST /api/approvals/action/{id}
- Delegated user can reject via POST /api/approvals/action/{id}
- Audit trail records delegation event
- Audit trail records acted_by_delegate when delegate acts
- GET /api/approvals/delegated-to-me returns approvals delegated to user
- GET /api/approvals/list?tab=delegated shows delegated approvals
- GET /api/approvals/list?tab=received shows delegated approvals via $or
- GET /api/approvals/stats includes delegated_pending count
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# User credentials from test context
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"
ADMIN_USER_NAME = "Admin User"
ADMIN_USER_EMAIL = "admin@munal.com"

DELEGATE_USER_ID = "7be4b0ec-2a5f-45e8-b5f6-39f9f08d4c74"
DELEGATE_USER_NAME = "Justin"
DELEGATE_USER_EMAIL = "justinoo2001@gmail.com"

# Test approval prefix for cleanup
TEST_PREFIX = "TEST_DELEGATION_"


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def created_approval(api_client):
    """Create a test approval for delegation tests"""
    payload = {
        "title": f"{TEST_PREFIX}Delegation Test Approval",
        "template_id": None,
        "category": "General",
        "priority": "Medium",
        "approvers": [
            {
                "user_id": ADMIN_USER_ID,
                "name": ADMIN_USER_NAME,
                "email": ADMIN_USER_EMAIL,
                "type": "individual"
            }
        ],
        "form_data": {"test_field": "test_value"},
        "workflow_type": "single",
        "description": "Test approval for delegation feature"
    }
    
    res = api_client.post(
        f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}&user_email={DELEGATE_USER_EMAIL}",
        json=payload
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    return data["approval"]


class TestDelegationEndpoint:
    """Test POST /api/approvals/delegate/{id} endpoint"""
    
    def test_delegate_approval_success(self, api_client, created_approval):
        """Test successful delegation of a pending approval"""
        # Create another test approval for this specific test
        payload = {
            "title": f"{TEST_PREFIX}Delegate Success Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        assert create_res.status_code == 200
        approval = create_res.json()["approval"]
        approval_id = approval["id"]
        
        # Delegate the approval
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "delegate_to_email": DELEGATE_USER_EMAIL,
            "reason": "Out of office - please review"
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data["success"] is True
        
        # Verify delegation info on the step
        updated_approval = data["approval"]
        step = updated_approval["steps"][0]
        assert step["delegated_to_id"] == DELEGATE_USER_ID
        assert step["delegated_to_name"] == DELEGATE_USER_NAME
        assert step["delegated_by_id"] == ADMIN_USER_ID
        assert step["delegated_by_name"] == ADMIN_USER_NAME
        assert step["delegation_reason"] == "Out of office - please review"
        assert "delegation_timestamp" in step
        print(f"✓ Delegation successful: {approval_id}")
    
    def test_delegate_blocked_when_not_pending(self, api_client):
        """Test that delegation is blocked when approval is not pending"""
        # Create and approve an approval first
        payload = {
            "title": f"{TEST_PREFIX}Delegate Non-Pending Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Approve it first
        action_res = api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json={"action": "approve", "comment": "Approved for testing"}
        )
        assert action_res.status_code == 200
        
        # Try to delegate an approved approval
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Should fail"
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        data = res.json()
        assert "pending" in data["detail"].lower() or "not pending" in data["detail"].lower()
        print("✓ Delegation blocked for non-pending approval")
    
    def test_delegate_blocked_when_user_has_no_pending_step(self, api_client):
        """Test that delegation is blocked when user has no pending step"""
        # Create approval where DELEGATE_USER is the sender (not approver)
        payload = {
            "title": f"{TEST_PREFIX}No Pending Step Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Try to delegate as the sender (not the approver)
        delegate_payload = {
            "delegate_to_id": ADMIN_USER_ID,
            "delegate_to_name": ADMIN_USER_NAME,
            "reason": "Should fail - I'm not the approver"
        }
        
        res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=delegate_payload
        )
        
        assert res.status_code == 400, f"Expected 400, got {res.status_code}: {res.text}"
        data = res.json()
        assert "no pending step" in data["detail"].lower()
        print("✓ Delegation blocked when user has no pending step")


class TestDelegatedUserActions:
    """Test that delegated user can approve/reject"""
    
    def test_delegate_can_approve(self, api_client):
        """Test that a delegated user can approve the approval"""
        # Create approval
        payload = {
            "title": f"{TEST_PREFIX}Delegate Approve Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Delegate to DELEGATE_USER
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "delegate_to_email": DELEGATE_USER_EMAIL,
            "reason": "Please review on my behalf"
        }
        delegate_res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        assert delegate_res.status_code == 200
        
        # Delegate user approves
        action_res = api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json={"action": "approve", "comment": "Approved as delegate"}
        )
        
        assert action_res.status_code == 200
        data = action_res.json()
        assert data["success"] is True
        assert data["approval"]["status"] == "approved"
        
        # Verify acted_by_delegate flag
        step = data["approval"]["steps"][0]
        assert step["acted_by_delegate"] is True
        assert step["delegate_actor_id"] == DELEGATE_USER_ID
        assert step["delegate_actor_name"] == DELEGATE_USER_NAME
        print("✓ Delegate can approve successfully")
    
    def test_delegate_can_reject(self, api_client):
        """Test that a delegated user can reject the approval"""
        # Create approval
        payload = {
            "title": f"{TEST_PREFIX}Delegate Reject Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Delegate to DELEGATE_USER
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Please review"
        }
        delegate_res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        assert delegate_res.status_code == 200
        
        # Delegate user rejects
        action_res = api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json={"action": "reject", "comment": "Rejected as delegate"}
        )
        
        assert action_res.status_code == 200
        data = action_res.json()
        assert data["success"] is True
        assert data["approval"]["status"] == "rejected"
        
        step = data["approval"]["steps"][0]
        assert step["acted_by_delegate"] is True
        print("✓ Delegate can reject successfully")


class TestAuditTrail:
    """Test audit trail records for delegation"""
    
    def test_audit_trail_records_delegation(self, api_client):
        """Test that audit trail records the delegation event"""
        # Create approval
        payload = {
            "title": f"{TEST_PREFIX}Audit Delegation Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Delegate
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "OOO - please review"
        }
        delegate_res = api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        assert delegate_res.status_code == 200
        
        # Get detail with audit trail
        detail_res = api_client.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        assert detail_res.status_code == 200
        data = detail_res.json()
        
        audit = data["audit"]
        delegation_event = next((a for a in audit if a["action"] == "delegated"), None)
        
        assert delegation_event is not None, "Delegation event not found in audit trail"
        assert delegation_event["actor_id"] == ADMIN_USER_ID
        assert delegation_event["actor_name"] == ADMIN_USER_NAME
        assert DELEGATE_USER_NAME in delegation_event["details"]
        assert "OOO - please review" in delegation_event["details"]
        print("✓ Audit trail records delegation event correctly")
    
    def test_audit_trail_records_delegate_action(self, api_client):
        """Test that audit shows who acted when delegate approves"""
        # Create approval
        payload = {
            "title": f"{TEST_PREFIX}Audit Delegate Action Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Delegate
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Delegation test"
        }
        api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        # Delegate approves
        api_client.post(
            f"{BASE_URL}/api/approvals/action/{approval_id}?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json={"action": "approve", "comment": "Approved on behalf"}
        )
        
        # Check audit trail
        detail_res = api_client.get(f"{BASE_URL}/api/approvals/detail/{approval_id}")
        data = detail_res.json()
        
        audit = data["audit"]
        approve_event = next((a for a in audit if a["action"] == "approve"), None)
        
        assert approve_event is not None
        assert approve_event["actor_id"] == DELEGATE_USER_ID
        assert approve_event["actor_name"] == DELEGATE_USER_NAME
        print("✓ Audit trail records delegate actor correctly")


class TestDelegatedToMeEndpoint:
    """Test GET /api/approvals/delegated-to-me endpoint"""
    
    def test_delegated_to_me_returns_delegated_approvals(self, api_client):
        """Test that delegated-to-me endpoint returns approvals delegated to user"""
        # Create and delegate an approval
        payload = {
            "title": f"{TEST_PREFIX}Delegated To Me Test",
            "category": "General",
            "priority": "High",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        # Delegate to DELEGATE_USER
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Test delegation"
        }
        api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        # Check delegated-to-me endpoint
        res = api_client.get(f"{BASE_URL}/api/approvals/delegated-to-me?user_id={DELEGATE_USER_ID}")
        assert res.status_code == 200
        data = res.json()
        
        approvals = data["approvals"]
        found = any(a["id"] == approval_id for a in approvals)
        assert found, f"Approval {approval_id} not found in delegated-to-me list"
        print("✓ delegated-to-me endpoint returns delegated approvals")


class TestListEndpointDelegated:
    """Test GET /api/approvals/list?tab=delegated and tab=received"""
    
    def test_list_delegated_tab_shows_delegated_approvals(self, api_client):
        """Test that list with tab=delegated shows approvals delegated to user"""
        # Create and delegate
        payload = {
            "title": f"{TEST_PREFIX}List Delegated Tab Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Tab test"
        }
        api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        # Check list with tab=delegated
        res = api_client.get(f"{BASE_URL}/api/approvals/list?user_id={DELEGATE_USER_ID}&tab=delegated")
        assert res.status_code == 200
        data = res.json()
        
        found = any(a["id"] == approval_id for a in data["approvals"])
        assert found, "Delegated approval not found in tab=delegated list"
        print("✓ tab=delegated shows delegated approvals")
    
    def test_list_received_tab_includes_delegated_via_or(self, api_client):
        """Test that list with tab=received also includes delegated approvals via $or"""
        # Create and delegate
        payload = {
            "title": f"{TEST_PREFIX}List Received Or Test",
            "category": "General",
            "priority": "Medium",
            "approvers": [{"user_id": ADMIN_USER_ID, "name": ADMIN_USER_NAME, "email": ADMIN_USER_EMAIL, "type": "individual"}],
            "form_data": {},
            "workflow_type": "single"
        }
        create_res = api_client.post(
            f"{BASE_URL}/api/approvals/create?user_id={DELEGATE_USER_ID}&user_name={DELEGATE_USER_NAME}",
            json=payload
        )
        approval_id = create_res.json()["approval"]["id"]
        
        delegate_payload = {
            "delegate_to_id": DELEGATE_USER_ID,
            "delegate_to_name": DELEGATE_USER_NAME,
            "reason": "Received tab test"
        }
        api_client.post(
            f"{BASE_URL}/api/approvals/delegate/{approval_id}?user_id={ADMIN_USER_ID}&user_name={ADMIN_USER_NAME}",
            json=delegate_payload
        )
        
        # Check list with tab=received for the DELEGATE_USER
        res = api_client.get(f"{BASE_URL}/api/approvals/list?user_id={DELEGATE_USER_ID}&tab=received")
        assert res.status_code == 200
        data = res.json()
        
        found = any(a["id"] == approval_id for a in data["approvals"])
        assert found, "Delegated approval not found in tab=received (via $or)"
        print("✓ tab=received includes delegated approvals via $or")


class TestStatsEndpoint:
    """Test GET /api/approvals/stats includes delegated_pending"""
    
    def test_stats_includes_delegated_pending(self, api_client):
        """Test that stats endpoint includes delegated_pending count"""
        res = api_client.get(f"{BASE_URL}/api/approvals/stats?user_id={DELEGATE_USER_ID}")
        assert res.status_code == 200
        data = res.json()
        
        assert "delegated_pending" in data, "delegated_pending not in stats response"
        assert isinstance(data["delegated_pending"], int)
        print(f"✓ stats includes delegated_pending: {data['delegated_pending']}")


class TestUserSearchEndpoint:
    """Test GET /api/users/search for delegate user search"""
    
    def test_user_search_works(self, api_client):
        """Test that user search endpoint works for finding delegate users"""
        res = api_client.get(f"{BASE_URL}/api/users/search?q=justin&limit=10")
        
        # The endpoint should return 200 regardless of results
        assert res.status_code == 200
        data = res.json()
        
        assert isinstance(data, list), "User search should return a list"
        print(f"✓ User search returned {len(data)} results")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_approvals(self, api_client):
        """Clean up test approvals (informational only)"""
        # List all approvals sent by DELEGATE_USER
        res = api_client.get(f"{BASE_URL}/api/approvals/list?user_id={DELEGATE_USER_ID}&tab=sent")
        if res.status_code == 200:
            approvals = res.json().get("approvals", [])
            test_approvals = [a for a in approvals if a.get("title", "").startswith(TEST_PREFIX)]
            print(f"Found {len(test_approvals)} test approvals to clean up (manual cleanup may be needed)")
        print("✓ Cleanup check complete")
