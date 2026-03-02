"""
Test cases for 4-tier Subscription Plans Feature
Tests GET /api/payments/plans, GET /api/payments/user/{user_id}/subscription,
GET /api/admin/stripe-settings
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPlansEndpoint:
    """Test /api/payments/plans endpoint - 4-tier subscription plans"""
    
    def test_get_plans_success(self):
        """Verify GET /api/payments/plans returns all 4 plans"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
        assert "plans" in data, "Response should contain plans array"
        
        plans = data["plans"]
        assert len(plans) == 4, f"Expected 4 plans, got {len(plans)}"
    
    def test_plans_structure(self):
        """Verify each plan has required fields"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        plans = data["plans"]
        
        required_fields = ["id", "name", "description", "price_monthly", "features", "limits"]
        for plan in plans:
            for field in required_fields:
                assert field in plan, f"Plan {plan.get('name', 'unknown')} missing field: {field}"
    
    def test_free_plan_exists_with_correct_price(self):
        """Verify Free plan exists and has $0 price"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        plans = data["plans"]
        
        free_plan = next((p for p in plans if p["id"] == "free"), None)
        assert free_plan is not None, "Free plan not found"
        assert free_plan["name"] == "Free", f"Expected name 'Free', got {free_plan['name']}"
        assert free_plan["price_monthly"] == 0, f"Free plan should be $0, got ${free_plan['price_monthly']}"
    
    def test_pro_plan_exists_with_correct_price(self):
        """Verify Pro plan exists and has $19 price"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        plans = data["plans"]
        
        pro_plan = next((p for p in plans if p["id"] == "pro"), None)
        assert pro_plan is not None, "Pro plan not found"
        assert pro_plan["name"] == "Pro", f"Expected name 'Pro', got {pro_plan['name']}"
        assert pro_plan["price_monthly"] == 19, f"Pro plan should be $19, got ${pro_plan['price_monthly']}"
        assert pro_plan.get("is_popular") == True, "Pro plan should be marked as popular"
    
    def test_business_plan_exists_with_correct_price(self):
        """Verify Business plan exists and has $39 price"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        plans = data["plans"]
        
        business_plan = next((p for p in plans if p["id"] == "business"), None)
        assert business_plan is not None, "Business plan not found"
        assert business_plan["name"] == "Business", f"Expected name 'Business', got {business_plan['name']}"
        assert business_plan["price_monthly"] == 39, f"Business plan should be $39, got ${business_plan['price_monthly']}"
    
    def test_enterprise_plan_exists_with_correct_price(self):
        """Verify Enterprise plan exists and has $79 price"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        plans = data["plans"]
        
        enterprise_plan = next((p for p in plans if p["id"] == "enterprise"), None)
        assert enterprise_plan is not None, "Enterprise plan not found"
        assert enterprise_plan["name"] == "Enterprise", f"Expected name 'Enterprise', got {enterprise_plan['name']}"
        assert enterprise_plan["price_monthly"] == 79, f"Enterprise plan should be $79, got ${enterprise_plan['price_monthly']}"


class TestUserSubscriptionEndpoint:
    """Test /api/payments/user/{user_id}/subscription endpoint"""
    
    def test_get_user_subscription_success(self):
        """Verify endpoint returns subscription for a user"""
        response = requests.get(f"{BASE_URL}/api/payments/user/test-user-123/subscription")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
    
    def test_user_subscription_returns_plan(self):
        """Verify response includes plan info"""
        response = requests.get(f"{BASE_URL}/api/payments/user/test-user-123/subscription")
        data = response.json()
        
        assert "plan" in data, "Response should contain plan"
        plan = data["plan"]
        assert "id" in plan, "Plan should have id"
        assert "name" in plan, "Plan should have name"
        assert "price_monthly" in plan, "Plan should have price_monthly"
    
    def test_user_subscription_returns_usage(self):
        """Verify response includes usage data"""
        response = requests.get(f"{BASE_URL}/api/payments/user/test-user-123/subscription")
        data = response.json()
        
        assert "usage" in data, "Response should contain usage"
        usage = data["usage"]
        assert "meetings" in usage, "Usage should contain meetings"
        assert "transcription_minutes" in usage, "Usage should contain transcription_minutes"
        assert "storage_gb" in usage, "Usage should contain storage_gb"
    
    def test_user_subscription_usage_structure(self):
        """Verify usage fields have used/limit structure"""
        response = requests.get(f"{BASE_URL}/api/payments/user/test-user-123/subscription")
        data = response.json()
        usage = data["usage"]
        
        for key in ["meetings", "transcription_minutes", "storage_gb"]:
            assert "used" in usage[key], f"{key} should have 'used' field"
            assert "limit" in usage[key], f"{key} should have 'limit' field"
    
    def test_non_existent_user_returns_free_plan(self):
        """Verify non-existent users get free plan defaults"""
        response = requests.get(f"{BASE_URL}/api/payments/user/non-existent-user-xyz/subscription")
        assert response.status_code == 200
        
        data = response.json()
        plan = data.get("plan", {})
        assert plan.get("id") == "free" or plan.get("name") == "Free", "Non-existent user should get free plan"


class TestStripeSettingsEndpoint:
    """Test /api/admin/stripe-settings endpoint"""
    
    def test_get_stripe_settings_success(self):
        """Verify GET /api/admin/stripe-settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/admin/stripe-settings")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Response should have success=True"
    
    def test_stripe_settings_structure(self):
        """Verify stripe settings have required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/stripe-settings")
        data = response.json()
        
        assert "configured" in data, "Response should have 'configured' field"
        assert "prices" in data, "Response should have 'prices' field"
        assert isinstance(data["configured"], bool), "configured should be boolean"
    
    def test_stripe_prices_structure(self):
        """Verify prices object has pro, business, enterprise fields"""
        response = requests.get(f"{BASE_URL}/api/admin/stripe-settings")
        data = response.json()
        prices = data.get("prices", {})
        
        assert "pro" in prices, "Prices should have 'pro' field"
        assert "business" in prices, "Prices should have 'business' field"
        assert "enterprise" in prices, "Prices should have 'enterprise' field"


class TestPlanPricing:
    """Verify all 4 plans have correct pricing structure"""
    
    def test_all_plans_have_annual_pricing(self):
        """Verify all plans have annual pricing"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        for plan in data["plans"]:
            assert "price_annual" in plan, f"Plan {plan['name']} missing price_annual"
    
    def test_annual_pricing_is_discounted(self):
        """Verify annual pricing offers savings (approx 17% off)"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        for plan in data["plans"]:
            monthly = plan["price_monthly"]
            annual = plan.get("price_annual", 0)
            
            if monthly > 0:
                # Annual should be less than 12x monthly (i.e., has discount)
                annual_monthly_equivalent = annual / 12 if annual > 0 else 0
                assert annual_monthly_equivalent < monthly, f"Plan {plan['name']} annual price should offer discount"


class TestPlanFeatures:
    """Verify plans have appropriate features"""
    
    def test_all_plans_have_features(self):
        """Verify each plan has features array"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        for plan in data["plans"]:
            assert "features" in plan, f"Plan {plan['name']} missing features"
            assert isinstance(plan["features"], list), f"Plan {plan['name']} features should be a list"
            assert len(plan["features"]) > 0, f"Plan {plan['name']} should have at least one feature"
    
    def test_all_plans_have_limits(self):
        """Verify each plan has limits object"""
        response = requests.get(f"{BASE_URL}/api/payments/plans")
        data = response.json()
        
        for plan in data["plans"]:
            assert "limits" in plan, f"Plan {plan['name']} missing limits"
            limits = plan["limits"]
            assert "meetings_per_month" in limits, f"Plan {plan['name']} missing meetings_per_month limit"
            assert "transcription_minutes" in limits, f"Plan {plan['name']} missing transcription_minutes limit"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
