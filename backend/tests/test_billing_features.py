"""
Backend API Tests for New Billing Features:
1. Team Billing API - /api/team-billing/*
2. Usage Alerts API - /api/usage-alerts/*
3. Shift Reminders API - /api/shift-reminders/*
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://munal-mobile-wrap.preview.emergentagent.com')

# ============== Fixtures ==============

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_user_id():
    """Generate unique test user ID"""
    return f"TEST_user_{uuid.uuid4().hex[:8]}"


# ============== Team Billing API Tests ==============

class TestTeamBillingPlans:
    """Team billing plans endpoint tests"""
    
    def test_get_team_billing_plans_returns_3_plans(self, api_client):
        """GET /api/team-billing/plans - should return 3 team plans"""
        response = api_client.get(f"{BASE_URL}/api/team-billing/plans")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "plans" in data
        assert len(data["plans"]) == 3
        
        # Verify plan IDs
        plan_ids = [p["id"] for p in data["plans"]]
        assert "team_starter" in plan_ids
        assert "team_professional" in plan_ids
        assert "team_enterprise" in plan_ids
        
    def test_team_plans_have_required_fields(self, api_client):
        """Verify each plan has all required fields"""
        response = api_client.get(f"{BASE_URL}/api/team-billing/plans")
        data = response.json()
        
        required_fields = ["id", "name", "price_per_seat_monthly", "price_per_seat_yearly", 
                          "min_seats", "max_seats", "features", "annual_savings"]
        
        for plan in data["plans"]:
            for field in required_fields:
                assert field in plan, f"Plan {plan['id']} missing field: {field}"
    
    def test_team_plans_annual_savings_calculation(self, api_client):
        """Verify annual savings are calculated correctly (~17%)"""
        response = api_client.get(f"{BASE_URL}/api/team-billing/plans")
        data = response.json()
        
        for plan in data["plans"]:
            if plan["price_per_seat_monthly"] > 0:
                savings = plan["annual_savings"]
                assert savings["savings_percentage"] >= 16, f"Plan {plan['id']} should have at least 16% savings"
                assert savings["savings_percentage"] <= 18, f"Plan {plan['id']} savings should be around 17%"

    def test_get_single_plan_details(self, api_client):
        """GET /api/team-billing/plans/{plan_id} - should return single plan"""
        response = api_client.get(f"{BASE_URL}/api/team-billing/plans/team_professional")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["plan"]["id"] == "team_professional"
        assert data["plan"]["name"] == "Team Professional"
        
    def test_get_nonexistent_plan_returns_404(self, api_client):
        """GET /api/team-billing/plans/{invalid} - should return 404"""
        response = api_client.get(f"{BASE_URL}/api/team-billing/plans/nonexistent_plan")
        assert response.status_code == 404


class TestTeamBillingPriceCalculation:
    """Team billing price calculation tests"""
    
    def test_calculate_price_monthly(self, api_client):
        """POST /api/team-billing/calculate-price - monthly billing"""
        response = api_client.post(
            f"{BASE_URL}/api/team-billing/calculate-price",
            params={"plan_id": "team_starter", "seats": 5, "billing_period": "monthly"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        calc = data["calculation"]
        assert calc["plan_id"] == "team_starter"
        assert calc["seats"] == 5
        assert calc["billing_period"] == "monthly"
        assert calc["price_per_seat"] == 8  # team_starter monthly price
        assert calc["total_price"] == 40  # 5 * 8
        
    def test_calculate_price_yearly(self, api_client):
        """POST /api/team-billing/calculate-price - yearly billing with savings"""
        response = api_client.post(
            f"{BASE_URL}/api/team-billing/calculate-price",
            params={"plan_id": "team_professional", "seats": 10, "billing_period": "yearly"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        calc = data["calculation"]
        assert calc["billing_period"] == "yearly"
        assert calc["price_per_seat"] == 150  # team_professional yearly price
        assert calc["total_price"] == 1500  # 10 * 150
        
        # Verify savings are calculated
        assert "annual_savings" in calc
        assert calc["annual_savings"]["savings"] > 0
        
    def test_calculate_price_validates_min_seats(self, api_client):
        """Should reject if seats below minimum"""
        response = api_client.post(
            f"{BASE_URL}/api/team-billing/calculate-price",
            params={"plan_id": "team_starter", "seats": 1, "billing_period": "monthly"}
        )
        
        # team_starter min_seats = 3, so 1 seat should fail
        assert response.status_code == 400
        
    def test_calculate_price_validates_max_seats(self, api_client):
        """Should reject if seats exceed maximum"""
        response = api_client.post(
            f"{BASE_URL}/api/team-billing/calculate-price",
            params={"plan_id": "team_starter", "seats": 100, "billing_period": "monthly"}
        )
        
        # team_starter max_seats = 10, so 100 seats should fail
        assert response.status_code == 400


class TestTeamBillingWorkspaceSubscription:
    """Workspace subscription tests"""
    
    def test_get_workspace_subscription_no_subscription(self, api_client):
        """GET /api/team-billing/workspace/{id}/subscription - no subscription"""
        workspace_id = "test-workspace-no-billing"
        response = api_client.get(f"{BASE_URL}/api/team-billing/workspace/{workspace_id}/subscription")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["subscription"] is None
        assert data["has_team_billing"] is False


# ============== Usage Alerts API Tests ==============

class TestUsageAlerts:
    """Usage alerts endpoint tests"""
    
    def test_get_user_alerts_empty(self, api_client, test_user_id):
        """GET /api/usage-alerts/user/{user_id} - should return empty for new user"""
        response = api_client.get(f"{BASE_URL}/api/usage-alerts/user/{test_user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "alerts" in data
        assert isinstance(data["alerts"], list)
        
    def test_check_usage_alerts(self, api_client, test_user_id):
        """POST /api/usage-alerts/check/{user_id} - should check and create alerts"""
        response = api_client.post(f"{BASE_URL}/api/usage-alerts/check/{test_user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "alerts_created" in data
        assert isinstance(data["alerts_created"], int)
        assert "alerts" in data
        
    def test_get_alert_preferences(self, api_client, test_user_id):
        """GET /api/usage-alerts/user/{user_id}/preferences"""
        response = api_client.get(f"{BASE_URL}/api/usage-alerts/user/{test_user_id}/preferences")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "preferences" in data
        prefs = data["preferences"]
        
        # Verify default preferences structure
        assert "email_alerts" in prefs
        assert "push_alerts" in prefs
        assert "warning_threshold" in prefs
        assert "features_to_track" in prefs
        
    def test_update_alert_preferences(self, api_client, test_user_id):
        """PUT /api/usage-alerts/user/{user_id}/preferences"""
        new_prefs = {
            "email_alerts": False,
            "push_alerts": True,
            "warning_threshold": 90,
            "features_to_track": ["ai_chat", "meetings"]
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/usage-alerts/user/{test_user_id}/preferences",
            json=new_prefs
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["preferences"]["email_alerts"] is False
        assert data["preferences"]["warning_threshold"] == 90
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/usage-alerts/user/{test_user_id}/preferences")
        get_data = get_response.json()
        
        assert get_data["preferences"]["email_alerts"] is False
        assert get_data["preferences"]["warning_threshold"] == 90

    def test_mark_alerts_read(self, api_client, test_user_id):
        """PUT /api/usage-alerts/user/{user_id}/mark-read"""
        # API can take alert_ids as query param or mark all if not provided
        response = api_client.put(
            f"{BASE_URL}/api/usage-alerts/user/{test_user_id}/mark-read"
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True


# ============== Shift Reminders API Tests ==============

class TestShiftReminders:
    """Shift reminders endpoint tests"""
    
    def test_get_reminder_preferences(self, api_client, test_user_id):
        """GET /api/shift-reminders/user/{user_id}/preferences"""
        response = api_client.get(f"{BASE_URL}/api/shift-reminders/user/{test_user_id}/preferences")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "preferences" in data
        prefs = data["preferences"]
        
        # Verify default preferences structure
        assert "enabled" in prefs
        assert "reminder_times" in prefs
        assert "push_enabled" in prefs
        assert "email_enabled" in prefs
        assert "sms_enabled" in prefs
        
        # Verify default values
        assert isinstance(prefs["reminder_times"], list)
        assert 15 in prefs["reminder_times"]  # Default 15 min before
        assert 60 in prefs["reminder_times"]  # Default 1 hour before
        
    def test_update_reminder_preferences(self, api_client, test_user_id):
        """PUT /api/shift-reminders/user/{user_id}/preferences"""
        new_prefs = {
            "enabled": True,
            "reminder_times": [5, 15, 30, 60, 120],
            "push_enabled": True,
            "email_enabled": True,
            "sms_enabled": False
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/shift-reminders/user/{test_user_id}/preferences",
            json=new_prefs
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert data["message"] == "Preferences updated"
        assert data["preferences"]["reminder_times"] == [5, 15, 30, 60, 120]
        assert data["preferences"]["email_enabled"] is True
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/shift-reminders/user/{test_user_id}/preferences")
        get_data = get_response.json()
        
        assert get_data["preferences"]["reminder_times"] == [5, 15, 30, 60, 120]
        
    def test_get_upcoming_reminders(self, api_client, test_user_id):
        """GET /api/shift-reminders/user/{user_id}/upcoming"""
        response = api_client.get(f"{BASE_URL}/api/shift-reminders/user/{test_user_id}/upcoming")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "reminders" in data
        assert isinstance(data["reminders"], list)
        
    def test_get_reminder_history(self, api_client, test_user_id):
        """GET /api/shift-reminders/history/{user_id}"""
        response = api_client.get(f"{BASE_URL}/api/shift-reminders/history/{test_user_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "reminders" in data
        
    def test_trigger_reminder_processing(self, api_client):
        """POST /api/shift-reminders/process - trigger reminder processing"""
        response = api_client.post(f"{BASE_URL}/api/shift-reminders/process")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "message" in data


# ============== User Plans API Tests ==============

class TestUserPlansAPI:
    """User plans API tests - for annual discount feature"""
    
    def test_get_plans_returns_multiple_plans(self, api_client):
        """GET /api/payments/plans - should return plans with annual pricing"""
        response = api_client.get(f"{BASE_URL}/api/payments/plans")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] is True
        assert "plans" in data
        assert len(data["plans"]) >= 1
        
    def test_plans_have_annual_and_monthly_pricing(self, api_client):
        """Verify plans have both monthly and annual prices"""
        response = api_client.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        for plan in data["plans"]:
            assert "price_monthly" in plan, f"Plan {plan['id']} missing price_monthly"
            assert "price_annual" in plan, f"Plan {plan['id']} missing price_annual"
            
            # For paid plans, annual should be ~17% cheaper than monthly * 12
            if plan["price_monthly"] > 0:
                expected_annual_no_discount = plan["price_monthly"] * 12
                assert plan["price_annual"] < expected_annual_no_discount, \
                    f"Plan {plan['id']} annual price should be discounted"


# ============== Note: Cleanup ==============
# Test data uses random user IDs (TEST_user_*), so cleanup happens naturally
