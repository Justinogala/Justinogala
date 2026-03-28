"""
Time Clock Reports API Tests
Tests for GET /api/time-clock/reports/{workspace_id} with daily/weekly/monthly/yearly periods
and GET /api/time-clock/reports/{workspace_id}/export for HTML export
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test workspace and user IDs from test credentials
TEST_WORKSPACE_ID = "b3478da2-7782-425a-9fa7-2dbc4f22d047"
TEST_USER_ID = "a62dcea6-6392-4e42-91f6-09671f9b15f4"


class TestTimeClockReportsAPI:
    """Time Clock Reports endpoint tests"""

    def test_daily_report(self):
        """Test GET /api/time-clock/reports/{workspace_id}?period=daily"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "daily", "date": "2026-03-28"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("period") == "daily"
        assert "start_date" in data
        assert "end_date" in data
        assert "total_entries" in data
        assert "total_minutes" in data
        assert "total_hours" in data
        assert "user_summary" in data
        assert "daily_chart" in data
        assert isinstance(data["user_summary"], list)
        assert isinstance(data["daily_chart"], list)
        print(f"Daily report: {data['total_entries']} entries, {data['total_hours']}h total")

    def test_weekly_report(self):
        """Test GET /api/time-clock/reports/{workspace_id}?period=weekly"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "weekly", "date": "2026-03-28"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("period") == "weekly"
        assert "start_date" in data
        assert "end_date" in data
        assert "total_entries" in data
        assert "total_hours" in data
        assert "user_summary" in data
        assert "daily_chart" in data
        
        # Weekly should span 7 days
        from datetime import datetime
        start = datetime.strptime(data["start_date"], "%Y-%m-%d")
        end = datetime.strptime(data["end_date"], "%Y-%m-%d")
        assert (end - start).days == 6, "Weekly report should span 7 days (Mon-Sun)"
        print(f"Weekly report: {data['start_date']} to {data['end_date']}, {data['total_entries']} entries")

    def test_monthly_report(self):
        """Test GET /api/time-clock/reports/{workspace_id}?period=monthly"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "monthly", "date": "2026-03-01"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("period") == "monthly"
        assert "start_date" in data
        assert "end_date" in data
        assert "total_entries" in data
        assert "total_hours" in data
        assert "user_summary" in data
        assert "daily_chart" in data
        
        # Monthly should start on 1st
        assert data["start_date"].endswith("-01"), "Monthly report should start on 1st"
        print(f"Monthly report: {data['start_date']} to {data['end_date']}, {data['total_entries']} entries")

    def test_yearly_report(self):
        """Test GET /api/time-clock/reports/{workspace_id}?period=yearly"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "yearly", "date": "2026-01-01"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("period") == "yearly"
        assert "start_date" in data
        assert "end_date" in data
        assert "total_entries" in data
        assert "total_hours" in data
        assert "user_summary" in data
        assert "daily_chart" in data
        
        # Yearly should start on Jan 1
        assert data["start_date"] == "2026-01-01", "Yearly report should start on Jan 1"
        print(f"Yearly report: {data['start_date']} to {data['end_date']}, {data['total_entries']} entries")

    def test_report_with_user_filter(self):
        """Test GET /api/time-clock/reports/{workspace_id}?user_id=xxx"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "weekly", "date": "2026-03-28", "user_id": TEST_USER_ID}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") is True
        # When filtered by user, user_summary should only contain that user (or be empty)
        for user in data.get("user_summary", []):
            assert user.get("user_id") == TEST_USER_ID, "Filtered report should only contain specified user"
        print(f"User-filtered report: {len(data.get('user_summary', []))} users")

    def test_invalid_period(self):
        """Test GET /api/time-clock/reports/{workspace_id}?period=invalid"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "invalid"}
        )
        
        assert response.status_code == 400, f"Expected 400 for invalid period, got {response.status_code}"
        print("Invalid period correctly returns 400")

    def test_export_report_html(self):
        """Test GET /api/time-clock/reports/{workspace_id}/export returns HTML"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}/export",
            params={"period": "monthly", "date": "2026-03-01"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Check content type is HTML
        content_type = response.headers.get("content-type", "")
        assert "text/html" in content_type, f"Expected text/html, got {content_type}"
        
        # Check HTML content
        html = response.text
        assert "<!DOCTYPE html>" in html or "<html" in html, "Response should be HTML"
        assert "Time Clock Report" in html, "HTML should contain report title"
        print(f"Export HTML: {len(html)} bytes")

    def test_export_report_with_different_periods(self):
        """Test export works for all period types"""
        for period in ["daily", "weekly", "monthly", "yearly"]:
            response = requests.get(
                f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}/export",
                params={"period": period}
            )
            
            assert response.status_code == 200, f"Export failed for period={period}: {response.status_code}"
            assert "text/html" in response.headers.get("content-type", "")
            print(f"Export {period}: OK")

    def test_user_summary_structure(self):
        """Test user_summary contains expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "weekly", "date": "2026-03-28"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # If there are users in summary, check structure
        if data.get("user_summary"):
            user = data["user_summary"][0]
            assert "user_id" in user
            assert "user_name" in user
            assert "total_minutes" in user
            assert "total_hours" in user
            assert "total_entries" in user
            assert "active_entries" in user
            assert "entries" in user
            print(f"User summary structure verified: {user['user_name']}")
        else:
            print("No users in summary (empty report)")

    def test_daily_chart_structure(self):
        """Test daily_chart contains expected fields"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "weekly", "date": "2026-03-28"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # If there are chart entries, check structure
        if data.get("daily_chart"):
            chart_entry = data["daily_chart"][0]
            assert "date" in chart_entry
            assert "minutes" in chart_entry
            assert "hours" in chart_entry
            print(f"Daily chart structure verified: {chart_entry['date']}")
        else:
            print("No chart data (empty report)")


class TestTimeClockReportsEdgeCases:
    """Edge case tests for Time Clock Reports"""

    def test_nonexistent_workspace(self):
        """Test report for non-existent workspace"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/nonexistent-workspace-id",
            params={"period": "daily"}
        )
        
        # Should return 200 with empty data (not 404)
        assert response.status_code == 200
        data = response.json()
        assert data.get("total_entries") == 0
        print("Non-existent workspace returns empty report")

    def test_future_date(self):
        """Test report for future date"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "daily", "date": "2030-01-01"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("total_entries") == 0
        print("Future date returns empty report")

    def test_default_date(self):
        """Test report without date parameter (should default to today)"""
        response = requests.get(
            f"{BASE_URL}/api/time-clock/reports/{TEST_WORKSPACE_ID}",
            params={"period": "daily"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        print(f"Default date report: {data['start_date']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
