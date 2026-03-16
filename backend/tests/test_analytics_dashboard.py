"""
Test suite for Incident Analytics Dashboard
Tests the GET /api/reports/analytics endpoint and its data structure
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestAnalyticsEndpoint:
    """Tests for GET /api/reports/analytics endpoint"""

    def test_analytics_endpoint_returns_200(self):
        """Analytics endpoint should return 200 status"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Analytics endpoint returns 200")

    def test_analytics_returns_valid_json(self):
        """Analytics endpoint should return valid JSON with success field"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        assert "success" in data, "Response missing 'success' field"
        assert data["success"] == True, "success field should be True"
        print("✓ Analytics endpoint returns valid JSON with success=True")

    def test_analytics_has_required_fields(self):
        """Analytics response should contain all required data fields"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        assert data["success"] == True

        analytics = data.get("analytics", {})
        required_fields = ["severity_trend", "type_breakdown", "response_times", "monthly_summary"]

        for field in required_fields:
            assert field in analytics, f"Analytics missing required field: {field}"

        print("✓ Analytics has all required fields: severity_trend, type_breakdown, response_times, monthly_summary")


class TestSeverityTrend:
    """Tests for severity_trend data structure"""

    def test_severity_trend_is_list(self):
        """severity_trend should be a list"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        severity_trend = analytics.get("severity_trend", [])

        assert isinstance(severity_trend, list), "severity_trend should be a list"
        print(f"✓ severity_trend is a list with {len(severity_trend)} month(s)")

    def test_severity_trend_entry_structure(self):
        """Each severity_trend entry should have month and severity counts"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        severity_trend = analytics.get("severity_trend", [])

        if len(severity_trend) > 0:
            entry = severity_trend[0]
            assert "month" in entry, "severity_trend entry missing 'month'"
            # Check for severity keys
            severity_keys = ["minor", "moderate", "major", "critical", "serious_occurrence"]
            for sev in severity_keys:
                assert sev in entry, f"severity_trend entry missing '{sev}' key"
            print(f"✓ severity_trend entries have proper structure with month and all severity keys")
        else:
            print("⚠ severity_trend is empty (expected if no reports)")


class TestTypeBreakdown:
    """Tests for type_breakdown data structure"""

    def test_type_breakdown_is_list(self):
        """type_breakdown should be a list"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        type_breakdown = analytics.get("type_breakdown", [])

        assert isinstance(type_breakdown, list), "type_breakdown should be a list"
        print(f"✓ type_breakdown is a list with {len(type_breakdown)} type(s)")

    def test_type_breakdown_entry_structure(self):
        """Each type_breakdown entry should have type and count"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        type_breakdown = analytics.get("type_breakdown", [])

        if len(type_breakdown) > 0:
            entry = type_breakdown[0]
            assert "type" in entry, "type_breakdown entry missing 'type'"
            assert "count" in entry, "type_breakdown entry missing 'count'"
            assert isinstance(entry["count"], int), "count should be integer"
            print(f"✓ type_breakdown entries have 'type' and 'count' fields")
        else:
            print("⚠ type_breakdown is empty (expected if no reports)")

    def test_type_breakdown_counts_match_stats(self):
        """type_breakdown total should match stats.total"""
        analytics_res = requests.get(f"{BASE_URL}/api/reports/analytics")
        stats_res = requests.get(f"{BASE_URL}/api/reports/stats")

        analytics_data = analytics_res.json()
        stats_data = stats_res.json()

        type_breakdown = analytics_data.get("analytics", {}).get("type_breakdown", [])
        total_from_breakdown = sum(entry["count"] for entry in type_breakdown)
        total_from_stats = stats_data.get("stats", {}).get("total", 0)

        assert total_from_breakdown == total_from_stats, \
            f"type_breakdown total ({total_from_breakdown}) doesn't match stats.total ({total_from_stats})"
        print(f"✓ type_breakdown total ({total_from_breakdown}) matches stats.total ({total_from_stats})")


class TestResponseTimes:
    """Tests for response_times data structure"""

    def test_response_times_is_list(self):
        """response_times should be a list"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        response_times = analytics.get("response_times", [])

        assert isinstance(response_times, list), "response_times should be a list"
        print(f"✓ response_times is a list with {len(response_times)} severity level(s)")

    def test_response_times_entry_structure(self):
        """Each response_times entry should have severity, avg_hours, count"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        response_times = analytics.get("response_times", [])

        expected_severities = {"minor", "moderate", "major", "critical", "serious_occurrence"}
        found_severities = set()

        for entry in response_times:
            assert "severity" in entry, "response_times entry missing 'severity'"
            assert "avg_hours" in entry, "response_times entry missing 'avg_hours'"
            assert "count" in entry, "response_times entry missing 'count'"
            found_severities.add(entry["severity"])

        assert expected_severities == found_severities, \
            f"response_times missing severities: {expected_severities - found_severities}"
        print("✓ response_times has entries for all 5 severity levels with proper structure")


class TestMonthlySummary:
    """Tests for monthly_summary data structure"""

    def test_monthly_summary_is_dict(self):
        """monthly_summary should be a dictionary"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        monthly_summary = analytics.get("monthly_summary", {})

        assert isinstance(monthly_summary, dict), "monthly_summary should be a dict"
        print("✓ monthly_summary is a dictionary")

    def test_monthly_summary_has_required_fields(self):
        """monthly_summary should have all required fields"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})
        monthly_summary = analytics.get("monthly_summary", {})

        required_fields = ["current_month", "current_count", "prev_count", "change_pct", "closure_rate", "escalated"]

        for field in required_fields:
            assert field in monthly_summary, f"monthly_summary missing field: {field}"

        print(f"✓ monthly_summary has all required fields: {', '.join(required_fields)}")

    def test_monthly_summary_current_count_matches_severity_trend(self):
        """monthly_summary.current_count should match current month in severity_trend"""
        response = requests.get(f"{BASE_URL}/api/reports/analytics")
        data = response.json()
        analytics = data.get("analytics", {})

        monthly_summary = analytics.get("monthly_summary", {})
        severity_trend = analytics.get("severity_trend", [])

        current_count = monthly_summary.get("current_count", 0)
        current_month = monthly_summary.get("current_month", "")

        # Find current month in severity_trend
        trend_entry = next((e for e in severity_trend if e.get("month") == current_month), None)

        if trend_entry:
            trend_total = sum(trend_entry.get(sev, 0) for sev in ["minor", "moderate", "major", "critical", "serious_occurrence"])
            assert current_count == trend_total, \
                f"monthly_summary.current_count ({current_count}) doesn't match severity_trend total ({trend_total})"
            print(f"✓ monthly_summary.current_count ({current_count}) matches severity_trend for {current_month}")
        else:
            print(f"⚠ Current month {current_month} not found in severity_trend (may be no data)")


class TestAnalyticsDataConsistency:
    """Tests for data consistency between analytics and stats endpoints"""

    def test_severity_counts_match_stats(self):
        """severity_trend totals should match stats.by_severity"""
        analytics_res = requests.get(f"{BASE_URL}/api/reports/analytics")
        stats_res = requests.get(f"{BASE_URL}/api/reports/stats")

        analytics_data = analytics_res.json()
        stats_data = stats_res.json()

        severity_trend = analytics_data.get("analytics", {}).get("severity_trend", [])
        by_severity = stats_data.get("stats", {}).get("by_severity", {})

        # Sum up all severities from trend
        trend_totals = {}
        for entry in severity_trend:
            for sev in ["minor", "moderate", "major", "critical", "serious_occurrence"]:
                trend_totals[sev] = trend_totals.get(sev, 0) + entry.get(sev, 0)

        # Compare with stats
        for sev, count in by_severity.items():
            trend_count = trend_totals.get(sev, 0)
            assert trend_count == count, \
                f"Severity '{sev}' count mismatch: trend={trend_count}, stats={count}"

        print("✓ severity_trend counts match stats.by_severity for all severity levels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
