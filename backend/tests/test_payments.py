"""
Payment API Tests for Stripe Integration
Tests: GET /api/payments/packages, POST /api/payments/checkout, 
       GET /api/payments/status/{session_id}, GET /api/payments/transactions,
       GET /api/payments/transactions/all
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPaymentPackages:
    """Test GET /api/payments/packages endpoint"""
    
    def test_get_packages_returns_200(self):
        """Test that packages endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_get_packages_returns_list(self):
        """Test that packages endpoint returns list of packages"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        data = response.json()
        
        assert "packages" in data, "Response should contain 'packages' key"
        assert isinstance(data["packages"], list), "Packages should be a list"
        assert len(data["packages"]) > 0, "Should have at least one package"
        
    def test_packages_contain_required_fields(self):
        """Test that each package has required fields"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        data = response.json()
        
        required_fields = ["id", "name", "price", "features"]
        for package in data["packages"]:
            for field in required_fields:
                assert field in package, f"Package {package.get('id', 'unknown')} missing field: {field}"
                
    def test_packages_include_free_tier(self):
        """Test that free tier package exists"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        data = response.json()
        
        package_ids = [p["id"] for p in data["packages"]]
        assert "free" in package_ids, "Free tier package should exist"
        
        free_package = next(p for p in data["packages"] if p["id"] == "free")
        assert free_package["price"] == 0, "Free tier should have price 0"
        
    def test_packages_include_pro_tiers(self):
        """Test that pro tier packages exist (monthly and annual)"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        data = response.json()
        
        package_ids = [p["id"] for p in data["packages"]]
        assert "pro_monthly" in package_ids, "Pro Monthly package should exist"
        assert "pro_annual" in package_ids, "Pro Annual package should exist"
        
    def test_packages_include_enterprise_tiers(self):
        """Test that enterprise tier packages exist"""
        response = requests.get(f"{BASE_URL}/api/payments/packages")
        data = response.json()
        
        package_ids = [p["id"] for p in data["packages"]]
        assert "enterprise_monthly" in package_ids, "Enterprise Monthly package should exist"
        assert "enterprise_annual" in package_ids, "Enterprise Annual package should exist"


class TestPaymentCheckout:
    """Test POST /api/payments/checkout endpoint"""
    
    def test_checkout_free_plan_no_payment_required(self):
        """Test that free plan doesn't require payment"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "free",
                "origin_url": BASE_URL,
                "user_id": "test_user_123",
                "user_email": "test@example.com"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("requires_payment") is False, "Free plan should not require payment"
        assert data.get("success") is True, "Should return success"
        
    def test_checkout_paid_plan_returns_checkout_url(self):
        """Test that paid plan returns Stripe checkout URL"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_monthly",
                "origin_url": BASE_URL,
                "user_id": f"TEST_user_{uuid.uuid4().hex[:8]}",
                "user_email": "test@example.com"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") is True, "Should return success"
        assert "checkout_url" in data, "Should return checkout_url for paid plans"
        assert "session_id" in data, "Should return session_id"
        assert data["checkout_url"].startswith("http"), "Checkout URL should be a valid URL"
        
    def test_checkout_creates_transaction_record(self):
        """Test that checkout creates a transaction record in database"""
        user_id = f"TEST_user_{uuid.uuid4().hex[:8]}"
        
        # Create checkout
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_annual",
                "origin_url": BASE_URL,
                "user_id": user_id,
                "user_email": "test@example.com"
            }
        )
        
        assert checkout_response.status_code == 200
        checkout_data = checkout_response.json()
        session_id = checkout_data.get("session_id")
        
        # Verify transaction was created
        txn_response = requests.get(f"{BASE_URL}/api/payments/transactions?user_id={user_id}")
        assert txn_response.status_code == 200
        
        txn_data = txn_response.json()
        transactions = txn_data.get("transactions", [])
        
        # Find the transaction with matching session_id
        matching_txn = next((t for t in transactions if t.get("session_id") == session_id), None)
        assert matching_txn is not None, f"Transaction with session_id {session_id} should exist"
        assert matching_txn["payment_status"] == "pending", "New transaction should be pending"
        
    def test_checkout_invalid_package_returns_400(self):
        """Test that invalid package ID returns 400 error"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "invalid_package_xyz",
                "origin_url": BASE_URL
            }
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid package, got {response.status_code}"
        
    def test_checkout_with_enterprise_package(self):
        """Test checkout with enterprise package"""
        response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "enterprise_monthly",
                "origin_url": BASE_URL,
                "user_id": f"TEST_enterprise_{uuid.uuid4().hex[:8]}",
                "user_email": "enterprise@example.com"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") is True


class TestPaymentStatus:
    """Test GET /api/payments/status/{session_id} endpoint"""
    
    def test_payment_status_for_valid_session(self):
        """Test payment status check for a valid session"""
        # First create a checkout session
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_monthly",
                "origin_url": BASE_URL,
                "user_id": f"TEST_status_{uuid.uuid4().hex[:8]}"
            }
        )
        
        assert checkout_response.status_code == 200
        session_id = checkout_response.json().get("session_id")
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_response.status_code == 200, f"Expected 200, got {status_response.status_code}"
        
        data = status_response.json()
        assert "session_id" in data, "Response should contain session_id"
        assert "payment_status" in data, "Response should contain payment_status"
        assert "status" in data, "Response should contain status"
        
    def test_payment_status_returns_stripe_info(self):
        """Test that payment status includes Stripe session info"""
        # Create checkout session
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "enterprise_annual",
                "origin_url": BASE_URL,
                "user_id": f"TEST_info_{uuid.uuid4().hex[:8]}"
            }
        )
        
        session_id = checkout_response.json().get("session_id")
        
        # Check status
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        data = status_response.json()
        
        # Status should include currency and amount
        assert "currency" in data, "Should include currency"
        assert "amount_total" in data or "metadata" in data, "Should include amount info"


class TestPaymentTransactions:
    """Test GET /api/payments/transactions endpoint"""
    
    def test_get_transactions_by_user_id(self):
        """Test fetching transactions by user_id"""
        user_id = f"TEST_txn_{uuid.uuid4().hex[:8]}"
        
        # Create a transaction first
        requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_monthly",
                "origin_url": BASE_URL,
                "user_id": user_id
            }
        )
        
        # Fetch transactions
        response = requests.get(f"{BASE_URL}/api/payments/transactions?user_id={user_id}")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data, "Response should contain 'transactions' key"
        assert isinstance(data["transactions"], list), "Transactions should be a list"
        assert len(data["transactions"]) > 0, "Should have at least one transaction"
        
    def test_get_transactions_by_email(self):
        """Test fetching transactions by user_email"""
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        
        # Create a transaction
        requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_annual",
                "origin_url": BASE_URL,
                "user_email": email
            }
        )
        
        # Fetch by email
        response = requests.get(f"{BASE_URL}/api/payments/transactions?user_email={email}")
        assert response.status_code == 200
        
        data = response.json()
        assert "transactions" in data
        
    def test_transaction_contains_required_fields(self):
        """Test that transaction records contain required fields"""
        user_id = f"TEST_fields_{uuid.uuid4().hex[:8]}"
        
        # Create transaction
        requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "enterprise_monthly",
                "origin_url": BASE_URL,
                "user_id": user_id
            }
        )
        
        # Fetch and verify fields
        response = requests.get(f"{BASE_URL}/api/payments/transactions?user_id={user_id}")
        data = response.json()
        
        if len(data["transactions"]) > 0:
            txn = data["transactions"][0]
            required_fields = ["id", "session_id", "package_id", "package_name", "amount", "payment_status", "created_at"]
            for field in required_fields:
                assert field in txn, f"Transaction missing required field: {field}"


class TestAdminTransactions:
    """Test GET /api/payments/transactions/all endpoint (admin)"""
    
    def test_get_all_transactions_returns_200(self):
        """Test that admin transactions endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/payments/transactions/all")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
    def test_get_all_transactions_returns_list(self):
        """Test that admin endpoint returns list of transactions"""
        response = requests.get(f"{BASE_URL}/api/payments/transactions/all")
        data = response.json()
        
        assert "transactions" in data, "Response should contain 'transactions' key"
        assert "total" in data, "Response should contain 'total' count"
        assert isinstance(data["transactions"], list), "Transactions should be a list"
        
    def test_get_all_transactions_with_pagination(self):
        """Test admin transactions endpoint with pagination"""
        response = requests.get(f"{BASE_URL}/api/payments/transactions/all?skip=0&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "skip" in data, "Response should contain 'skip'"
        assert "limit" in data, "Response should contain 'limit'"
        assert data["skip"] == 0
        assert data["limit"] == 10
        
    def test_all_transactions_include_user_info(self):
        """Test that admin view includes user information"""
        # Create a transaction with user info
        user_id = f"TEST_admin_{uuid.uuid4().hex[:8]}"
        user_email = "admin_test@example.com"
        
        requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_monthly",
                "origin_url": BASE_URL,
                "user_id": user_id,
                "user_email": user_email
            }
        )
        
        # Fetch all transactions
        response = requests.get(f"{BASE_URL}/api/payments/transactions/all")
        data = response.json()
        
        # Find our test transaction
        if len(data["transactions"]) > 0:
            # At least one transaction should have user fields
            has_user_fields = any(
                t.get("user_id") or t.get("user_email") 
                for t in data["transactions"]
            )
            assert has_user_fields, "Transactions should include user information"


class TestIntegrationFlow:
    """Integration tests for complete payment flow"""
    
    def test_full_checkout_flow(self):
        """Test complete flow: packages -> checkout -> status -> transactions"""
        user_id = f"TEST_flow_{uuid.uuid4().hex[:8]}"
        
        # Step 1: Get packages
        packages_response = requests.get(f"{BASE_URL}/api/payments/packages")
        assert packages_response.status_code == 200
        packages = packages_response.json()["packages"]
        pro_package = next(p for p in packages if p["id"] == "pro_monthly")
        assert pro_package["price"] == 29.0, "Pro Monthly should be $29"
        
        # Step 2: Create checkout
        checkout_response = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "pro_monthly",
                "origin_url": BASE_URL,
                "user_id": user_id,
                "user_email": "flow_test@example.com"
            }
        )
        assert checkout_response.status_code == 200
        checkout_data = checkout_response.json()
        session_id = checkout_data["session_id"]
        
        # Step 3: Check status
        status_response = requests.get(f"{BASE_URL}/api/payments/status/{session_id}")
        assert status_response.status_code == 200
        
        # Step 4: Verify transaction exists
        txn_response = requests.get(f"{BASE_URL}/api/payments/transactions?user_id={user_id}")
        assert txn_response.status_code == 200
        transactions = txn_response.json()["transactions"]
        assert len(transactions) > 0, "Transaction should be recorded"
        
        # Step 5: Verify in admin view
        admin_response = requests.get(f"{BASE_URL}/api/payments/transactions/all")
        assert admin_response.status_code == 200
        all_transactions = admin_response.json()["transactions"]
        matching = [t for t in all_transactions if t.get("session_id") == session_id]
        assert len(matching) > 0, "Transaction should appear in admin view"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
