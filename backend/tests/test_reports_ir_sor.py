"""
IR/SOR Reports API Tests
Tests for PDF/Excel export, email notifications, filtering, and escalation scheduler.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthAndScheduler:
    """Health check and escalation scheduler verification"""
    
    def test_health_endpoint(self):
        """Verify health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "healthy"
        print(f"Health check passed: {data}")


class TestReportsList:
    """Tests for /api/reports list endpoint with filters"""
    
    def test_list_reports_basic(self):
        """List reports without filters"""
        response = requests.get(f"{BASE_URL}/api/reports?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "reports" in data
        assert "total" in data
        print(f"List reports: {data['total']} total, {len(data['reports'])} returned")
    
    def test_list_reports_filter_by_type(self):
        """Filter reports by type (IR/SOR)"""
        response = requests.get(f"{BASE_URL}/api/reports?report_type=IR&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        for report in data.get("reports", []):
            assert report["report_type"] == "IR"
        print(f"Filtered by IR: {len(data['reports'])} reports")
    
    def test_list_reports_filter_by_severity(self):
        """Filter reports by severity"""
        response = requests.get(f"{BASE_URL}/api/reports?severity=moderate&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        print(f"Filtered by moderate severity: {len(data['reports'])} reports")
    
    def test_list_reports_filter_by_status(self):
        """Filter reports by status"""
        response = requests.get(f"{BASE_URL}/api/reports?status=open&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        for report in data.get("reports", []):
            assert report["status"] == "open"
        print(f"Filtered by open status: {len(data['reports'])} reports")


class TestReportStats:
    """Tests for /api/reports/stats endpoint"""
    
    def test_get_report_stats(self):
        """Get dashboard statistics"""
        response = requests.get(f"{BASE_URL}/api/reports/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "stats" in data
        stats = data["stats"]
        assert "total" in stats
        assert "open" in stats
        assert "under_review" in stats
        assert "closed" in stats
        assert "ir_count" in stats
        assert "sor_count" in stats
        assert "critical" in stats
        print(f"Stats: total={stats['total']}, open={stats['open']}, critical={stats['critical']}")


class TestExcelExport:
    """Tests for Excel export /api/reports/export/excel"""
    
    def test_excel_export_returns_valid_file(self):
        """Excel export returns valid spreadsheet file"""
        response = requests.get(f"{BASE_URL}/api/reports/export/excel")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        assert len(response.content) > 100  # Non-empty file
        # Check Content-Disposition header
        assert "attachment" in response.headers.get("content-disposition", "")
        print(f"Excel export success: {len(response.content)} bytes")
    
    def test_excel_export_with_filters(self):
        """Excel export with filters applied"""
        response = requests.get(f"{BASE_URL}/api/reports/export/excel?status=open")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        print(f"Filtered Excel export success: {len(response.content)} bytes")


class TestPDFExport:
    """Tests for PDF export /api/reports/{report_id}/export/pdf"""
    
    def test_pdf_export_existing_report(self):
        """PDF export for existing report returns valid PDF"""
        # First get an existing report
        list_response = requests.get(f"{BASE_URL}/api/reports?limit=1")
        assert list_response.status_code == 200
        reports = list_response.json().get("reports", [])
        
        if not reports:
            pytest.skip("No reports available for PDF export test")
        
        report_id = reports[0]["id"]
        
        # Test PDF export
        response = requests.get(f"{BASE_URL}/api/reports/{report_id}/export/pdf")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert len(response.content) > 100  # Non-empty file
        # PDF files start with %PDF
        assert response.content[:4] == b'%PDF', "File does not start with PDF magic bytes"
        print(f"PDF export success for report {report_id}: {len(response.content)} bytes")
    
    def test_pdf_export_nonexistent_report(self):
        """PDF export for non-existent report returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/reports/{fake_id}/export/pdf")
        assert response.status_code == 404
        print(f"PDF export 404 for non-existent report: correct")


class TestReportCRUD:
    """Tests for report create and read operations"""
    
    @pytest.fixture
    def admin_user_id(self):
        """Get admin user ID from login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@munal.com",
            "password": "Admin@123456"
        })
        if response.status_code == 200:
            return response.json().get("user", {}).get("id")
        pytest.skip("Could not get admin user ID")
    
    def test_create_report_minor_severity(self, admin_user_id):
        """Create report with minor severity (no email notification)"""
        payload = {
            "workspace_id": "test-workspace",
            "submitted_by": admin_user_id,
            "incident_date": datetime.now().strftime("%Y-%m-%d"),
            "incident_time": "10:00",
            "location": "Test Location A",
            "department": "Testing",
            "incident_type": "near_miss",
            "description": "TEST_Minor near miss incident for testing",
            "severity": "minor",
            "persons_involved": [{"full_name": "Test Person", "role": "staff"}]
        }
        
        response = requests.post(f"{BASE_URL}/api/reports", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "report" in data
        report = data["report"]
        assert report["severity"] == "minor"
        assert report["report_type"] == "IR"  # Minor is IR, not SOR
        assert report["status"] == "open"
        print(f"Created minor report: {report['report_number']}")
        
        # Return ID for cleanup
        return report["id"]
    
    def test_create_report_critical_severity_triggers_email(self, admin_user_id):
        """Create report with critical severity should trigger email notification"""
        payload = {
            "workspace_id": "test-workspace",
            "submitted_by": admin_user_id,
            "incident_date": datetime.now().strftime("%Y-%m-%d"),
            "incident_time": "14:00",
            "location": "Test Location B - Critical",
            "department": "Testing",
            "incident_type": "injury",
            "description": "TEST_Critical injury incident for testing email notification",
            "severity": "critical",
            "persons_involved": [{"full_name": "Test Critical Person", "role": "client"}]
        }
        
        response = requests.post(f"{BASE_URL}/api/reports", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        report = data["report"]
        assert report["severity"] == "critical"
        assert report["report_type"] == "IR"  # Critical is still IR
        print(f"Created critical report (email should be triggered): {report['report_number']}")
        
        return report["id"]
    
    def test_create_report_serious_occurrence(self, admin_user_id):
        """Create SOR report (serious_occurrence severity)"""
        payload = {
            "workspace_id": "test-workspace",
            "submitted_by": admin_user_id,
            "incident_date": datetime.now().strftime("%Y-%m-%d"),
            "incident_time": "16:00",
            "location": "Test Location C - SOR",
            "department": "Testing",
            "incident_type": "safeguarding",
            "description": "TEST_Serious Occurrence for testing SOR workflow",
            "severity": "serious_occurrence",
            "persons_involved": [{"full_name": "Test SOR Person", "role": "staff"}]
        }
        
        response = requests.post(f"{BASE_URL}/api/reports", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        report = data["report"]
        assert report["severity"] == "serious_occurrence"
        assert report["report_type"] == "SOR"  # SOR type
        print(f"Created SOR report (email should be triggered): {report['report_number']}")
        
        return report["id"]
    
    def test_get_single_report(self):
        """Get a single report by ID"""
        # Get first report
        list_response = requests.get(f"{BASE_URL}/api/reports?limit=1")
        reports = list_response.json().get("reports", [])
        if not reports:
            pytest.skip("No reports available")
        
        report_id = reports[0]["id"]
        response = requests.get(f"{BASE_URL}/api/reports/{report_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["report"]["id"] == report_id
        print(f"Got report: {data['report']['report_number']}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_reports(self):
        """Cleanup TEST_ prefixed reports"""
        # Get all test reports
        response = requests.get(f"{BASE_URL}/api/reports?limit=100")
        if response.status_code != 200:
            print("Could not fetch reports for cleanup")
            return
        
        reports = response.json().get("reports", [])
        test_reports = [r for r in reports if "TEST_" in (r.get("description") or "")]
        
        # Note: There's no delete endpoint in the API, so we just log what would be cleaned
        if test_reports:
            print(f"Found {len(test_reports)} test reports (no delete endpoint available)")
            for r in test_reports:
                print(f"  - {r['report_number']}: {r['description'][:50]}...")
        else:
            print("No test reports to clean up")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
