"""
Admin Reports - All Report Types Backend Tests
Tests all 7 admin report types (User Activity, Meeting Summary, System Performance,
Security Audit, Storage Usage, Revenue & Billing, Subscriptions) for real MongoDB data.
Also tests invalid type handling.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://shift-mgmt-preview.preview.emergentagent.com')
BASE_URL = BASE_URL.rstrip('/')

ADMIN_REPORT_ENDPOINT = f"{BASE_URL}/api/admin/reports/generate"

# All report types
REPORT_TYPES = [
    "User Activity",
    "Meeting Summary",
    "System Performance",
    "Security Audit",
    "Storage Usage",
    "Revenue & Billing",
    "Subscriptions",
]


class TestAdminReportsPDF:
    """Test PDF generation for all report types"""

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_pdf_report_returns_200(self, report_type):
        """Test that each report type returns HTTP 200 for PDF format"""
        params = {
            "type": report_type,
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200, f"Expected 200 for {report_type} PDF, got {response.status_code}: {response.text}"

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_pdf_report_content_type(self, report_type):
        """Test that PDF reports return correct content type"""
        params = {
            "type": report_type,
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type for {report_type}, got {content_type}"

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_pdf_report_has_content(self, report_type):
        """Test that PDF reports have actual content (starts with %PDF)"""
        params = {
            "type": report_type,
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        # PDF files start with %PDF
        content = response.content
        assert len(content) > 1000, f"PDF for {report_type} too small: {len(content)} bytes"
        assert content[:4] == b'%PDF', f"PDF for {report_type} doesn't start with PDF header"


class TestAdminReportsExcel:
    """Test Excel generation for all report types"""

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_excel_report_returns_200(self, report_type):
        """Test that each report type returns HTTP 200 for Excel format"""
        params = {
            "type": report_type,
            "format": "Excel",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200, f"Expected 200 for {report_type} Excel, got {response.status_code}: {response.text}"

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_excel_report_content_type(self, report_type):
        """Test that Excel reports return correct content type"""
        params = {
            "type": report_type,
            "format": "Excel",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        content_type = response.headers.get("content-type", "")
        assert "spreadsheetml" in content_type or "application/vnd" in content_type, f"Expected Excel content type for {report_type}, got {content_type}"

    @pytest.mark.parametrize("report_type", REPORT_TYPES)
    def test_excel_report_has_content(self, report_type):
        """Test that Excel reports have actual content (starts with PK - ZIP/XLSX format)"""
        params = {
            "type": report_type,
            "format": "Excel",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        content = response.content
        assert len(content) > 1000, f"Excel for {report_type} too small: {len(content)} bytes"
        # XLSX files are ZIP files starting with PK
        assert content[:2] == b'PK', f"Excel for {report_type} doesn't start with PK (ZIP header)"


class TestAdminReportsInvalidTypes:
    """Test error handling for invalid report types"""

    def test_invalid_report_type_returns_400(self):
        """Test that invalid report type returns 400 with error message"""
        params = {
            "type": "Invalid Report Type",
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 400, f"Expected 400 for invalid type, got {response.status_code}"
        data = response.json()
        assert "detail" in data
        assert "Unknown report type" in data["detail"]

    def test_missing_type_returns_422(self):
        """Test that missing type parameter returns 422 (validation error)"""
        params = {
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        # FastAPI returns 422 for missing required params
        assert response.status_code == 422, f"Expected 422 for missing type, got {response.status_code}"


class TestAdminReportsDateFilters:
    """Test date filtering for reports"""

    def test_user_activity_with_date_filter(self):
        """Test User Activity report with date filter"""
        params = {
            "type": "User Activity",
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-03-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200

    def test_revenue_billing_with_date_filter(self):
        """Test Revenue & Billing report with date filter"""
        params = {
            "type": "Revenue & Billing",
            "format": "Excel",
            "start_date": "2025-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200

    def test_report_without_dates(self):
        """Test that reports work without date params (all time)"""
        params = {
            "type": "System Performance",
            "format": "PDF"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200


class TestAdminReportsContentDisposition:
    """Test file download headers"""

    def test_pdf_filename_header(self):
        """Test that PDF response has correct filename in Content-Disposition"""
        params = {
            "type": "User Activity",
            "format": "PDF",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp
        assert ".pdf" in content_disp
        assert "user_activity" in content_disp.lower()

    def test_excel_filename_header(self):
        """Test that Excel response has correct filename in Content-Disposition"""
        params = {
            "type": "Meeting Summary",
            "format": "Excel",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31"
        }
        response = requests.get(ADMIN_REPORT_ENDPOINT, params=params)
        assert response.status_code == 200
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp
        assert ".xlsx" in content_disp
        assert "meeting_summary" in content_disp.lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
