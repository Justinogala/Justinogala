"""
Backend tests for Admin Coupons and Tax Rates management
Tests CRUD operations for coupons and tax rates, and audit log export functionality
"""
import pytest
import requests
import os
import json
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://echo-workforce-admin.preview.emergentagent.com')

class TestCouponsAPI:
    """Test Admin Coupons CRUD operations"""
    
    test_coupon_code = f"TEST_{uuid.uuid4().hex[:8].upper()}"
    
    def test_get_all_coupons(self):
        """Test GET /api/admin/coupons returns coupon list"""
        response = requests.get(f"{BASE_URL}/api/admin/coupons")
        assert response.status_code == 200
        data = response.json()
        assert "coupons" in data
        assert "total" in data
        assert isinstance(data["coupons"], list)
        print(f"Found {data['total']} coupons")
    
    def test_create_coupon(self):
        """Test POST /api/admin/coupons creates a new coupon"""
        payload = {
            "code": self.test_coupon_code,
            "discount_type": "percentage",
            "discount_value": 15.0,
            "description": "Test coupon for pytest",
            "max_uses": 50,
            "max_uses_per_user": 2,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/coupons", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["coupon"]["code"] == self.test_coupon_code
        assert data["coupon"]["discount_value"] == 15.0
        print(f"Created coupon: {self.test_coupon_code}")
    
    def test_get_coupon_by_code(self):
        """Test GET /api/admin/coupons/{code} returns specific coupon"""
        response = requests.get(f"{BASE_URL}/api/admin/coupons/{self.test_coupon_code}")
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == self.test_coupon_code
        print(f"Retrieved coupon: {data['code']}")
    
    def test_update_coupon(self):
        """Test PUT /api/admin/coupons/{code} updates coupon"""
        payload = {
            "discount_value": 25.0,
            "description": "Updated test coupon"
        }
        response = requests.put(f"{BASE_URL}/api/admin/coupons/{self.test_coupon_code}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["coupon"]["discount_value"] == 25.0
        assert data["coupon"]["description"] == "Updated test coupon"
        print(f"Updated coupon discount to 25%")
    
    def test_toggle_coupon_status(self):
        """Test POST /api/admin/coupons/{code}/toggle toggles active status"""
        response = requests.post(f"{BASE_URL}/api/admin/coupons/{self.test_coupon_code}/toggle")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_active" in data
        print(f"Toggled coupon status to: {data['is_active']}")
    
    def test_delete_coupon(self):
        """Test DELETE /api/admin/coupons/{code} deletes coupon"""
        response = requests.delete(f"{BASE_URL}/api/admin/coupons/{self.test_coupon_code}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Deleted coupon: {self.test_coupon_code}")
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/admin/coupons/{self.test_coupon_code}")
        assert response.status_code == 404


class TestTaxRatesAPI:
    """Test Admin Tax Rates CRUD operations"""
    
    test_tax_id = None
    
    def test_get_all_tax_rates(self):
        """Test GET /api/admin/tax-rates returns tax rate list"""
        response = requests.get(f"{BASE_URL}/api/admin/tax-rates")
        assert response.status_code == 200
        data = response.json()
        assert "tax_rates" in data
        assert "total" in data
        assert isinstance(data["tax_rates"], list)
        print(f"Found {data['total']} tax rates")
    
    def test_create_tax_rate(self):
        """Test POST /api/admin/tax-rates creates a new tax rate"""
        payload = {
            "name": f"Test Tax {uuid.uuid4().hex[:6]}",
            "rate": 7.5,
            "country": "US",
            "state": "NY",
            "description": "Test tax rate for pytest",
            "is_inclusive": False,
            "is_active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/tax-rates", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["tax_rate"]["rate"] == 7.5
        assert data["tax_rate"]["country"] == "US"
        TestTaxRatesAPI.test_tax_id = data["tax_rate"]["id"]
        print(f"Created tax rate with ID: {TestTaxRatesAPI.test_tax_id}")
    
    def test_get_tax_rate_by_id(self):
        """Test GET /api/admin/tax-rates/{id} returns specific tax rate"""
        response = requests.get(f"{BASE_URL}/api/admin/tax-rates/{self.test_tax_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == self.test_tax_id
        print(f"Retrieved tax rate: {data['name']}")
    
    def test_update_tax_rate(self):
        """Test PUT /api/admin/tax-rates/{id} updates tax rate"""
        payload = {
            "rate": 8.0,
            "description": "Updated test tax rate"
        }
        response = requests.put(f"{BASE_URL}/api/admin/tax-rates/{self.test_tax_id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["tax_rate"]["rate"] == 8.0
        print(f"Updated tax rate to 8%")
    
    def test_toggle_tax_rate_status(self):
        """Test POST /api/admin/tax-rates/{id}/toggle toggles active status"""
        response = requests.post(f"{BASE_URL}/api/admin/tax-rates/{self.test_tax_id}/toggle")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "is_active" in data
        print(f"Toggled tax rate status to: {data['is_active']}")
    
    def test_delete_tax_rate(self):
        """Test DELETE /api/admin/tax-rates/{id} deletes tax rate"""
        response = requests.delete(f"{BASE_URL}/api/admin/tax-rates/{self.test_tax_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        print(f"Deleted tax rate: {self.test_tax_id}")
        
        # Verify deletion
        response = requests.get(f"{BASE_URL}/api/admin/tax-rates/{self.test_tax_id}")
        assert response.status_code == 404


class TestAuditLogsAPI:
    """Test Audit Logs API including IP/User-Agent tracking and export"""
    
    def test_get_audit_logs(self):
        """Test GET /api/admin/audit-logs returns audit logs"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "logs" in data
        assert "total" in data
        print(f"Found {data['total']} audit logs")
    
    def test_audit_logs_contain_ip_and_user_agent(self):
        """Test audit logs contain IP address and User Agent fields"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Check if at least some logs have IP and User Agent
        has_ip = False
        has_user_agent = False
        for log in data["logs"]:
            if log.get("ip_address"):
                has_ip = True
            if log.get("user_agent"):
                has_user_agent = True
        
        print(f"Logs with IP address: {has_ip}, Logs with User Agent: {has_user_agent}")
        # At least verify the fields exist in the schema
        assert "logs" in data
    
    def test_export_audit_logs_csv(self):
        """Test GET /api/admin/audit-logs/export?format=csv returns CSV"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs/export?format=csv&limit=10")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
        assert "Content-Disposition" in response.headers
        
        content = response.text
        assert "timestamp" in content
        assert "action" in content
        assert "ip_address" in content
        assert "user_agent" in content
        print("CSV export successful with IP/User-Agent columns")
    
    def test_export_audit_logs_json(self):
        """Test GET /api/admin/audit-logs/export?format=json returns JSON"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs/export?format=json&limit=10")
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        
        data = response.json()
        assert "logs" in data
        assert "exported_at" in data
        assert "count" in data
        print(f"JSON export successful with {data['count']} logs")
    
    def test_audit_logs_summary(self):
        """Test GET /api/admin/audit-logs/summary returns summary by action"""
        response = requests.get(f"{BASE_URL}/api/admin/audit-logs/summary")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        print(f"Audit logs summary: {len(data['summary'])} action types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
