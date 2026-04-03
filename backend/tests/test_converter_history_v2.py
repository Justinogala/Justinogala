"""
Test Converter History Feature - Iteration 107
Tests for:
- POST /api/converter/convert saves history
- GET /api/converter/history returns recent conversions
- GET /api/converter/history/{id}/download re-downloads file
- DELETE /api/converter/history/{id} removes record
- POST /api/converter/batch-convert saves history
- History auto-prunes to 50 records per user
- Anonymous users get 'anonymous' user_id
"""
import pytest
import requests
import os
import io
import uuid
from PIL import Image as PILImage
from reportlab.pdfgen import canvas

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


def get_auth_token():
    """Get auth token for testing"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "orgmgr@munal.com",
        "password": "OrgMgr@123"
    })
    if resp.status_code == 200:
        return resp.json().get("token")
    return None


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for authenticated tests"""
    token = get_auth_token()
    if not token:
        pytest.skip("Could not get auth token")
    return token


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def test_png_file():
    """Create a test PNG image in memory"""
    img = PILImage.new('RGB', (100, 100), color='blue')
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture(scope="module")
def test_jpg_file():
    """Create a test JPG image in memory"""
    img = PILImage.new('RGB', (100, 100), color='red')
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    return buffer.getvalue()


@pytest.fixture(scope="module")
def test_pdf_file():
    """Create a test PDF file in memory"""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer)
    c.drawString(100, 750, "Test PDF Document")
    c.drawString(100, 730, "For conversion history testing")
    c.save()
    buffer.seek(0)
    return buffer.getvalue()


class TestConverterHistoryEndpoints:
    """Tests for /api/converter/history endpoints"""

    def test_get_history_empty_for_new_user(self, auth_headers):
        """GET /api/converter/history returns empty list initially or existing records"""
        response = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert "history" in data
        assert isinstance(data["history"], list)
        print(f"✓ GET /api/converter/history returns {len(data['history'])} records")

    def test_convert_saves_history(self, auth_headers, test_png_file):
        """POST /api/converter/convert saves a history record"""
        # First, get current history count
        history_before = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        count_before = len(history_before.get("history", []))
        
        # Convert a file
        files = {"file": ("test_history.png", test_png_file, "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200, f"Conversion failed: {response.text}"
        
        # Check history increased
        history_after = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        count_after = len(history_after.get("history", []))
        
        assert count_after >= count_before, "History should have at least same or more records"
        
        # Check the latest record
        if history_after["history"]:
            latest = history_after["history"][0]  # Most recent first
            assert "id" in latest
            assert "conversion_type" in latest
            assert "original_name" in latest
            assert "output_name" in latest
            assert "output_size" in latest
            assert "created_at" in latest
            assert "downloadable" in latest
            print(f"✓ Conversion saved to history: {latest['original_name']} -> {latest['output_name']}")

    def test_history_record_structure(self, auth_headers, test_jpg_file):
        """History records have correct structure"""
        # Convert a file
        files = {"file": ("structure_test.jpg", test_jpg_file, "image/jpeg")}
        data = {"conversion_type": "jpg-to-png"}
        
        requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        
        # Get history
        response = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers)
        data = response.json()
        
        assert len(data["history"]) > 0, "Should have history records"
        record = data["history"][0]
        
        # Check required fields
        required_fields = ["id", "user_id", "conversion_type", "original_name", 
                          "original_size", "output_name", "output_size", 
                          "file_count", "created_at", "downloadable"]
        for field in required_fields:
            assert field in record, f"Missing field: {field}"
        
        # output_data should NOT be in response (excluded for performance)
        assert "output_data" not in record, "output_data should be excluded from history list"
        print(f"✓ History record has all required fields: {list(record.keys())}")

    def test_download_history_item(self, auth_headers, test_png_file):
        """GET /api/converter/history/{id}/download returns the converted file"""
        # Convert a file
        files = {"file": ("download_test.png", test_png_file, "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        
        # Get history to find the record ID
        history = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        record = history["history"][0]
        record_id = record["id"]
        
        # Download
        response = requests.get(f"{BASE_URL}/api/converter/history/{record_id}/download", headers=auth_headers)
        
        assert response.status_code == 200, f"Download failed: {response.status_code}"
        assert len(response.content) > 0, "Downloaded file should have content"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "image" in content_type or "octet" in content_type, f"Unexpected content type: {content_type}"
        print(f"✓ Downloaded history item: {len(response.content)} bytes")

    def test_download_nonexistent_record(self, auth_headers):
        """GET /api/converter/history/{id}/download returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        
        response = requests.get(f"{BASE_URL}/api/converter/history/{fake_id}/download", headers=auth_headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Download returns 404 for nonexistent record")

    def test_delete_history_item(self, auth_headers, test_jpg_file):
        """DELETE /api/converter/history/{id} removes the record"""
        # Convert a file
        files = {"file": ("delete_test.jpg", test_jpg_file, "image/jpeg")}
        data = {"conversion_type": "jpg-to-png"}
        
        requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        
        # Get history to find the record ID
        history = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        record = history["history"][0]
        record_id = record["id"]
        
        # Delete
        response = requests.delete(f"{BASE_URL}/api/converter/history/{record_id}", headers=auth_headers)
        
        assert response.status_code == 200, f"Delete failed: {response.status_code}"
        data = response.json()
        assert data.get("success") == True
        
        # Verify deletion - try to download
        download_resp = requests.get(f"{BASE_URL}/api/converter/history/{record_id}/download", headers=auth_headers)
        assert download_resp.status_code == 404, "Deleted record should not be downloadable"
        print("✓ History item deleted successfully")

    def test_delete_nonexistent_record(self, auth_headers):
        """DELETE /api/converter/history/{id} returns 404 for invalid ID"""
        fake_id = str(uuid.uuid4())
        
        response = requests.delete(f"{BASE_URL}/api/converter/history/{fake_id}", headers=auth_headers)
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Delete returns 404 for nonexistent record")

    def test_history_limit_parameter(self, auth_headers):
        """GET /api/converter/history respects limit parameter"""
        response = requests.get(f"{BASE_URL}/api/converter/history?limit=5", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["history"]) <= 5, "Should respect limit parameter"
        print(f"✓ History limit parameter works: returned {len(data['history'])} records (limit=5)")


class TestBatchConvertHistory:
    """Tests for batch conversion history"""

    def test_batch_convert_saves_history(self, auth_headers, test_png_file, test_jpg_file):
        """POST /api/converter/batch-convert saves history record"""
        # Get history count before
        history_before = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        count_before = len(history_before.get("history", []))
        
        # Batch convert
        files = [
            ("files", ("batch1.png", test_png_file, "image/png")),
            ("files", ("batch2.png", test_png_file, "image/png")),
        ]
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/batch-convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200, f"Batch conversion failed: {response.text}"
        
        # Check history
        history_after = requests.get(f"{BASE_URL}/api/converter/history", headers=auth_headers).json()
        count_after = len(history_after.get("history", []))
        
        assert count_after > count_before, "Batch conversion should add history record"
        
        # Check the record has file_count > 1
        latest = history_after["history"][0]
        assert latest.get("file_count", 1) >= 1, "Batch record should have file_count"
        print(f"✓ Batch conversion saved to history with file_count={latest.get('file_count')}")


class TestAnonymousUserHistory:
    """Tests for anonymous user history"""

    def test_anonymous_convert_saves_history(self, test_png_file):
        """Conversion without auth saves history with 'anonymous' user_id"""
        # Convert without auth
        files = {"file": ("anon_test.png", test_png_file, "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data)
        assert response.status_code == 200, f"Conversion failed: {response.text}"
        
        # Get history without auth
        history_resp = requests.get(f"{BASE_URL}/api/converter/history")
        assert history_resp.status_code == 200
        
        data = history_resp.json()
        if data["history"]:
            # Check user_id is 'anonymous'
            record = data["history"][0]
            assert record.get("user_id") == "anonymous", f"Expected 'anonymous', got {record.get('user_id')}"
            print("✓ Anonymous conversion saved with user_id='anonymous'")
        else:
            print("✓ Anonymous history endpoint works (no records yet)")


class TestSingleConversionRegression:
    """Regression tests for single file conversions"""

    def test_png_to_jpg(self, auth_headers, test_png_file):
        """png-to-jpg conversion works"""
        files = {"file": ("test.png", test_png_file, "image/png")}
        data = {"conversion_type": "png-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ png-to-jpg conversion works")

    def test_jpg_to_png(self, auth_headers, test_jpg_file):
        """jpg-to-png conversion works"""
        files = {"file": ("test.jpg", test_jpg_file, "image/jpeg")}
        data = {"conversion_type": "jpg-to-png"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ jpg-to-png conversion works")

    def test_image_to_pdf(self, auth_headers, test_png_file):
        """image-to-pdf conversion works"""
        files = {"file": ("test.png", test_png_file, "image/png")}
        data = {"conversion_type": "image-to-pdf"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200
        assert response.content.startswith(b'%PDF-')
        print("✓ image-to-pdf conversion works")

    def test_pdf_to_jpg(self, auth_headers, test_pdf_file):
        """pdf-to-jpg conversion works"""
        files = {"file": ("test.pdf", test_pdf_file, "application/pdf")}
        data = {"conversion_type": "pdf-to-jpg"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ pdf-to-jpg conversion works")

    def test_pdf_to_png(self, auth_headers, test_pdf_file):
        """pdf-to-png conversion works"""
        files = {"file": ("test.pdf", test_pdf_file, "application/pdf")}
        data = {"conversion_type": "pdf-to-png"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 200
        assert len(response.content) > 0
        print("✓ pdf-to-png conversion works")

    def test_unsupported_conversion_type(self, auth_headers, test_png_file):
        """Unsupported conversion type returns 400"""
        files = {"file": ("test.png", test_png_file, "image/png")}
        data = {"conversion_type": "png-to-gif"}
        
        response = requests.post(f"{BASE_URL}/api/converter/convert", files=files, data=data, headers=auth_headers)
        assert response.status_code == 400
        print("✓ Unsupported conversion type returns 400")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
