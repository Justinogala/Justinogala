"""
Test IR/SOR Reports Export Endpoints for Admin Panel Generate Report Modal
- GET /api/reports/export/pdf - Bulk PDF export
- GET /api/reports/export/excel - Excel export
- Date range filtering support
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestBulkPDFExport:
    """Test GET /api/reports/export/pdf endpoint"""
    
    def test_pdf_export_returns_200(self):
        """PDF export endpoint returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/reports/export/pdf")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ PDF export returned HTTP 200")
    
    def test_pdf_export_returns_valid_pdf(self):
        """PDF export returns valid PDF content (starts with %PDF)"""
        response = requests.get(f"{BASE_URL}/api/reports/export/pdf")
        content = response.content
        assert content[:5] == b'%PDF-', f"Expected PDF header, got {content[:20]}"
        assert len(content) > 1000, f"PDF too small: {len(content)} bytes"
        print(f"✓ PDF export returned valid PDF ({len(content)} bytes)")
    
    def test_pdf_export_with_date_filter(self):
        """PDF export with date range filter returns 200"""
        params = {
            'start_date': '2026-03-01',
            'end_date': '2026-03-31'
        }
        response = requests.get(f"{BASE_URL}/api/reports/export/pdf", params=params)
        assert response.status_code == 200
        content = response.content
        assert content[:5] == b'%PDF-'
        print(f"✓ Filtered PDF export returned valid PDF ({len(content)} bytes)")
    
    def test_pdf_export_with_severity_filter(self):
        """PDF export with severity filter"""
        params = {'severity': 'critical'}
        response = requests.get(f"{BASE_URL}/api/reports/export/pdf", params=params)
        assert response.status_code == 200
        content = response.content
        assert content[:5] == b'%PDF-'
        print(f"✓ Severity-filtered PDF export works ({len(content)} bytes)")
    
    def test_pdf_export_with_status_filter(self):
        """PDF export with status filter"""
        params = {'status': 'open'}
        response = requests.get(f"{BASE_URL}/api/reports/export/pdf", params=params)
        assert response.status_code == 200
        content = response.content
        assert content[:5] == b'%PDF-'
        print(f"✓ Status-filtered PDF export works ({len(content)} bytes)")


class TestExcelExport:
    """Test GET /api/reports/export/excel endpoint"""
    
    def test_excel_export_returns_200(self):
        """Excel export endpoint returns HTTP 200"""
        response = requests.get(f"{BASE_URL}/api/reports/export/excel")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Excel export returned HTTP 200")
    
    def test_excel_export_returns_valid_xlsx(self):
        """Excel export returns valid XLSX content (starts with PK - zip format)"""
        response = requests.get(f"{BASE_URL}/api/reports/export/excel")
        content = response.content
        # XLSX files are actually ZIP archives starting with PK
        assert content[:2] == b'PK', f"Expected ZIP/XLSX header, got {content[:20]}"
        assert len(content) > 1000, f"Excel file too small: {len(content)} bytes"
        print(f"✓ Excel export returned valid XLSX ({len(content)} bytes)")
    
    def test_excel_export_with_report_type_filter(self):
        """Excel export with report_type filter"""
        params = {'report_type': 'IR'}
        response = requests.get(f"{BASE_URL}/api/reports/export/excel", params=params)
        assert response.status_code == 200
        content = response.content
        assert content[:2] == b'PK'
        print(f"✓ IR-type filtered Excel export works ({len(content)} bytes)")
    
    def test_excel_export_with_severity_filter(self):
        """Excel export with severity filter"""
        params = {'severity': 'serious_occurrence'}
        response = requests.get(f"{BASE_URL}/api/reports/export/excel", params=params)
        assert response.status_code == 200
        content = response.content
        assert content[:2] == b'PK'
        print(f"✓ SOR severity filtered Excel export works ({len(content)} bytes)")


class TestReportsDataAvailability:
    """Verify there are reports in DB for export"""
    
    def test_reports_exist_in_database(self):
        """GET /api/reports returns at least 1 report"""
        response = requests.get(f"{BASE_URL}/api/reports")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        total = data.get('total', 0)
        assert total > 0, "No reports in database for export"
        print(f"✓ Found {total} reports in database")
    
    def test_reports_stats_show_data(self):
        """GET /api/reports/stats returns report counts"""
        response = requests.get(f"{BASE_URL}/api/reports/stats")
        assert response.status_code == 200
        data = response.json()
        assert data.get('success') == True
        stats = data.get('stats', {})
        total = stats.get('total', 0)
        assert total > 0, "No reports in stats"
        print(f"✓ Stats show {total} total reports, {stats.get('ir_count', 0)} IR, {stats.get('sor_count', 0)} SOR")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
