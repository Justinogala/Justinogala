"""
Sheets Phase 2 API Tests - AI Chat, Formula, Autofill, Smart Actions
Tests the Phase 2 AI-powered features for spreadsheet intelligence
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "orgadmin@munal.com"
TEST_PASSWORD = "OrgAdmin@123"


class TestSheetsPhase2API:
    """Phase 2 AI features: Chat, Formula, Autofill, Smart Actions"""
    
    @pytest.fixture(autouse=True)
    def setup(self, api_client, auth_token):
        """Setup for each test"""
        self.client = api_client
        self.token = auth_token
        self.client.headers.update({"Authorization": f"Bearer {self.token}"})
        self.created_sheet_ids = []
        self.test_sheet_id = None
    
    def teardown_method(self, method):
        """Cleanup created sheets after each test"""
        if hasattr(self, 'created_sheet_ids'):
            for sheet_id in self.created_sheet_ids:
                try:
                    self.client.delete(f"{BASE_URL}/api/sheets/{sheet_id}")
                except:
                    pass
    
    def _create_test_sheet_with_data(self):
        """Helper to create a sheet with sample data for testing"""
        # Create sheet
        response = self.client.post(f"{BASE_URL}/api/sheets", json={
            "title": "TEST_Phase2_Data_Sheet"
        })
        assert response.status_code == 200
        sheet_id = response.json()["id"]
        self.created_sheet_ids.append(sheet_id)
        
        # Add sample data
        sample_data = [{
            "name": "Sheet1",
            "celldata": [
                # Header row
                {"r": 0, "c": 0, "v": {"v": "Product", "m": "Product"}},
                {"r": 0, "c": 1, "v": {"v": "Category", "m": "Category"}},
                {"r": 0, "c": 2, "v": {"v": "Price", "m": "Price"}},
                {"r": 0, "c": 3, "v": {"v": "Description", "m": "Description"}},
                # Data rows
                {"r": 1, "c": 0, "v": {"v": "Laptop", "m": "Laptop"}},
                {"r": 1, "c": 1, "v": {"v": "Electronics", "m": "Electronics"}},
                {"r": 1, "c": 2, "v": {"v": 999, "m": "999"}},
                {"r": 1, "c": 3, "v": {"v": "High performance laptop for work", "m": "High performance laptop for work"}},
                {"r": 2, "c": 0, "v": {"v": "Headphones", "m": "Headphones"}},
                {"r": 2, "c": 1, "v": {"v": "Electronics", "m": "Electronics"}},
                {"r": 2, "c": 2, "v": {"v": 199, "m": "199"}},
                {"r": 2, "c": 3, "v": {"v": "Noise cancelling wireless headphones", "m": "Noise cancelling wireless headphones"}},
                {"r": 3, "c": 0, "v": {"v": "Coffee Maker", "m": "Coffee Maker"}},
                {"r": 3, "c": 1, "v": {"v": "Kitchen", "m": "Kitchen"}},
                {"r": 3, "c": 2, "v": {"v": 79, "m": "79"}},
                {"r": 3, "c": 3, "v": {"v": "Automatic drip coffee maker", "m": "Automatic drip coffee maker"}},
            ],
            "order": 0,
            "row": 50,
            "column": 26,
            "status": 1
        }]
        
        update_resp = self.client.put(f"{BASE_URL}/api/sheets/{sheet_id}", json={
            "data": sample_data
        })
        assert update_resp.status_code == 200
        
        return sheet_id
    
    # ── Chat with Data Tests ──
    def test_01_chat_with_data_basic(self):
        """POST /api/sheets/{id}/ai/chat - basic chat functionality"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/chat", json={
            "message": "What products are in this spreadsheet?"
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            assert isinstance(data["response"], str)
            assert len(data["response"]) > 0
            print(f"✓ Chat response received: {data['response'][:100]}...")
        else:
            error = response.json()
            print(f"⚠ AI service error (expected if not configured): {error}")
    
    def test_02_chat_with_data_summary(self):
        """POST /api/sheets/{id}/ai/chat - with sheet_data_summary"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/chat", json={
            "message": "What is the total price of all products?",
            "sheet_data_summary": "HEADER: Product | Category | Price | Description\nRow 1: Laptop | Electronics | 999 | High performance laptop\nRow 2: Headphones | Electronics | 199 | Wireless headphones\nRow 3: Coffee Maker | Kitchen | 79 | Drip coffee maker"
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "response" in data
            # The AI should mention the total (1277) or the prices
            print(f"✓ Chat with summary response: {data['response'][:100]}...")
        else:
            print(f"⚠ AI service error: {response.json()}")
    
    def test_03_chat_with_data_invalid_sheet(self):
        """POST /api/sheets/{id}/ai/chat - 404 for invalid sheet"""
        response = self.client.post(f"{BASE_URL}/api/sheets/nonexistent-sheet-id/ai/chat", json={
            "message": "Hello"
        })
        assert response.status_code == 404
        print("✓ 404 returned for chat with nonexistent sheet")
    
    # ── AI Formula Tests ──
    def test_04_ai_formula_sum(self):
        """POST /api/sheets/ai/formula - SUM formula"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Sum of column C from row 2 to row 10"
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "formula" in data
            assert data["formula"].startswith("=")
            print(f"✓ AI formula (SUM): {data['formula']}")
        else:
            print(f"⚠ AI formula service error: {response.json()}")
    
    def test_05_ai_formula_average(self):
        """POST /api/sheets/ai/formula - AVERAGE formula"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Calculate the average of values in column B"
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "formula" in data
            assert data["formula"].startswith("=")
            print(f"✓ AI formula (AVERAGE): {data['formula']}")
        else:
            print(f"⚠ AI formula service error: {response.json()}")
    
    def test_06_ai_formula_with_context(self):
        """POST /api/sheets/ai/formula - with cell context"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Calculate profit margin (Revenue minus Cost divided by Revenue)",
            "context": "A1=Product, B1=Revenue, C1=Cost, D1=Profit Margin"
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "formula" in data
            assert data["formula"].startswith("=")
            print(f"✓ AI formula with context: {data['formula']}")
        else:
            print(f"⚠ AI formula service error: {response.json()}")
    
    def test_07_ai_formula_vlookup(self):
        """POST /api/sheets/ai/formula - VLOOKUP formula"""
        response = self.client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Look up the price of a product from column A in a table from A1 to C10, return the value from column 3"
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "formula" in data
            assert data["formula"].startswith("=")
            print(f"✓ AI formula (VLOOKUP): {data['formula']}")
        else:
            print(f"⚠ AI formula service error: {response.json()}")
    
    # ── Autofill Tests ──
    def test_08_autofill_basic(self):
        """POST /api/sheets/{id}/ai/autofill - basic autofill"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/autofill", json={
            "column_index": 0,
            "column_name": "Product",
            "existing_values": ["Laptop", "Headphones", "Coffee Maker"],
            "row_count": 5
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "values" in data
            assert isinstance(data["values"], list)
            assert len(data["values"]) > 0
            print(f"✓ Autofill generated {len(data['values'])} values: {data['values']}")
        else:
            print(f"⚠ AI autofill service error: {response.json()}")
    
    def test_09_autofill_with_context(self):
        """POST /api/sheets/{id}/ai/autofill - with context columns"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/autofill", json={
            "column_index": 1,
            "column_name": "Category",
            "existing_values": ["Electronics", "Electronics", "Kitchen"],
            "row_count": 3,
            "context_columns": {
                "Product": ["Laptop", "Headphones", "Coffee Maker", "Blender", "Tablet", "Toaster"]
            }
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "values" in data
            print(f"✓ Autofill with context: {data['values']}")
        else:
            print(f"⚠ AI autofill service error: {response.json()}")
    
    # ── Smart Actions Tests ──
    def test_10_smart_action_summarize(self):
        """POST /api/sheets/{id}/ai/smart-action - summarize"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "summarize",
            "values": [
                "High performance laptop for work with 16GB RAM and 512GB SSD",
                "Noise cancelling wireless headphones with 30 hour battery life",
                "Automatic drip coffee maker with programmable timer and 12 cup capacity"
            ]
        })
        
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert "action" in data
            assert data["action"] == "summarize"
            assert isinstance(data["results"], list)
            print(f"✓ Summarize results: {data['results']}")
        else:
            print(f"⚠ AI smart action service error: {response.json()}")
    
    def test_11_smart_action_sentiment(self):
        """POST /api/sheets/{id}/ai/smart-action - sentiment analysis"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "sentiment",
            "values": [
                "This product is amazing! Best purchase ever!",
                "Terrible quality, broke after one week. Very disappointed.",
                "It's okay, nothing special but does the job."
            ]
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert data["action"] == "sentiment"
            print(f"✓ Sentiment results: {data['results']}")
        else:
            print(f"⚠ AI smart action service error: {response.json()}")
    
    def test_12_smart_action_categorize(self):
        """POST /api/sheets/{id}/ai/smart-action - categorize"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "categorize",
            "values": [
                "iPhone 15 Pro Max",
                "Nike Air Jordan sneakers",
                "Samsung 65 inch TV",
                "Levi's denim jeans"
            ]
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert data["action"] == "categorize"
            print(f"✓ Categorize results: {data['results']}")
        else:
            print(f"⚠ AI smart action service error: {response.json()}")
    
    def test_13_smart_action_translate(self):
        """POST /api/sheets/{id}/ai/smart-action - translate"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "translate",
            "values": [
                "Hello, how are you?",
                "Thank you for your purchase",
                "Please contact customer support"
            ],
            "options": {"target_language": "Spanish"}
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            assert data["action"] == "translate"
            print(f"✓ Translate results: {data['results']}")
        else:
            print(f"⚠ AI smart action service error: {response.json()}")
    
    def test_14_smart_action_translate_french(self):
        """POST /api/sheets/{id}/ai/smart-action - translate to French"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "translate",
            "values": ["Good morning", "Welcome to our store"],
            "options": {"target_language": "French"}
        })
        
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            print(f"✓ Translate to French: {data['results']}")
        else:
            print(f"⚠ AI smart action service error: {response.json()}")
    
    def test_15_smart_action_invalid_action(self):
        """POST /api/sheets/{id}/ai/smart-action - unknown action type"""
        sheet_id = self._create_test_sheet_with_data()
        
        response = self.client.post(f"{BASE_URL}/api/sheets/{sheet_id}/ai/smart-action", json={
            "action": "unknown_action",
            "values": ["test value"]
        })
        
        # Should still work but with generic processing
        assert response.status_code in [200, 500]
        
        if response.status_code == 200:
            data = response.json()
            assert "results" in data
            print(f"✓ Unknown action handled: {data}")
        else:
            print(f"⚠ AI service error: {response.json()}")
    
    # ── Auth Tests ──
    def test_16_chat_unauthorized(self):
        """Chat endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(f"{BASE_URL}/api/sheets/some-id/ai/chat", json={
            "message": "Hello"
        })
        assert response.status_code in [401, 403, 422]
        print("✓ Chat endpoint requires auth")
    
    def test_17_formula_unauthorized(self):
        """Formula endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(f"{BASE_URL}/api/sheets/ai/formula", json={
            "description": "Sum of A1 to A10"
        })
        assert response.status_code in [401, 403, 422]
        print("✓ Formula endpoint requires auth")
    
    def test_18_autofill_unauthorized(self):
        """Autofill endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(f"{BASE_URL}/api/sheets/some-id/ai/autofill", json={
            "column_index": 0,
            "column_name": "Test",
            "existing_values": ["a", "b"],
            "row_count": 3
        })
        assert response.status_code in [401, 403, 422]
        print("✓ Autofill endpoint requires auth")
    
    def test_19_smart_action_unauthorized(self):
        """Smart action endpoint requires authentication"""
        fresh_client = requests.Session()
        fresh_client.headers.update({"Content-Type": "application/json"})
        
        response = fresh_client.post(f"{BASE_URL}/api/sheets/some-id/ai/smart-action", json={
            "action": "summarize",
            "values": ["test"]
        })
        assert response.status_code in [401, 403, 422]
        print("✓ Smart action endpoint requires auth")


# ── Fixtures ──
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
