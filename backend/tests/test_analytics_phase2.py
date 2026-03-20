"""
Test Approvals Phase 2: Analytics Dashboard & AI Insights
- GET /api/approvals/analytics - Enhanced analytics with delegation_stats, by_month, by_priority, bottlenecks
- GET /api/approvals/ai-insights - GPT-5.2 powered AI insights
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin user from test credentials
ADMIN_USER_ID = "3fe4c41c-4f43-4683-98dc-db6de39b842c"


class TestAnalyticsEnhancedEndpoint:
    """Enhanced Analytics API Tests - Phase 2"""
    
    def test_analytics_returns_200(self):
        """Verify analytics endpoint accessible"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Analytics endpoint returns 200")
    
    def test_analytics_returns_summary(self):
        """Verify summary contains all required fields including new Phase 2 fields"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "summary" in data, "Missing 'summary' in response"
        summary = data["summary"]
        
        # Phase 2 enhanced summary fields
        required_fields = [
            "total", "approved", "rejected", "pending", 
            "approval_rate", "avg_time_hours", "delegation_rate", "cancelled"
        ]
        for field in required_fields:
            assert field in summary, f"Summary missing '{field}'"
        
        print(f"✓ Summary contains all required fields: {list(summary.keys())}")
    
    def test_analytics_returns_by_category(self):
        """Verify by_category pie chart data"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "by_category" in data, "Missing 'by_category'"
        by_category = data["by_category"]
        assert isinstance(by_category, list), "by_category should be a list"
        
        # Verify structure
        for item in by_category:
            assert "name" in item, "by_category item missing 'name'"
            assert "value" in item, "by_category item missing 'value'"
        
        print(f"✓ by_category has {len(by_category)} categories")
    
    def test_analytics_returns_by_priority(self):
        """Verify by_priority distribution data"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "by_priority" in data, "Missing 'by_priority'"
        by_priority = data["by_priority"]
        assert isinstance(by_priority, list), "by_priority should be a list"
        
        # Verify structure
        for item in by_priority:
            assert "name" in item, "by_priority item missing 'name'"
            assert "value" in item, "by_priority item missing 'value'"
        
        print(f"✓ by_priority has {len(by_priority)} priority levels")
    
    def test_analytics_returns_by_month(self):
        """Verify by_month trend data (6 months)"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "by_month" in data, "Missing 'by_month'"
        by_month = data["by_month"]
        assert isinstance(by_month, list), "by_month should be a list"
        assert len(by_month) == 6, f"Expected 6 months of data, got {len(by_month)}"
        
        # Verify structure
        for item in by_month:
            assert "month" in item, "by_month item missing 'month'"
            assert "total" in item, "by_month item missing 'total'"
            assert "approved" in item, "by_month item missing 'approved'"
            assert "rejected" in item, "by_month item missing 'rejected'"
        
        print(f"✓ by_month has 6 months of data: {[m['month'] for m in by_month]}")
    
    def test_analytics_returns_bottlenecks(self):
        """Verify bottlenecks (approver response times) data"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "bottlenecks" in data, "Missing 'bottlenecks'"
        bottlenecks = data["bottlenecks"]
        assert isinstance(bottlenecks, list), "bottlenecks should be a list"
        
        # Verify structure (approver stats leaderboard format)
        for b in bottlenecks:
            assert "name" in b, "bottleneck item missing 'name'"
            assert "avg_response_hours" in b, "bottleneck item missing 'avg_response_hours'"
            assert "total_actions" in b, "bottleneck item missing 'total_actions'"
            assert "pending_count" in b, "bottleneck item missing 'pending_count'"
        
        print(f"✓ bottlenecks has {len(bottlenecks)} approvers (max 10)")
    
    def test_analytics_returns_delegation_stats(self):
        """Verify delegation_stats in response"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "delegation_stats" in data, "Missing 'delegation_stats'"
        ds = data["delegation_stats"]
        
        required_fields = ["total_delegated", "delegate_acted", "delegation_rate"]
        for field in required_fields:
            assert field in ds, f"delegation_stats missing '{field}'"
        
        # Verify types
        assert isinstance(ds["total_delegated"], (int, float)), "total_delegated should be numeric"
        assert isinstance(ds["delegate_acted"], (int, float)), "delegate_acted should be numeric"
        assert isinstance(ds["delegation_rate"], (int, float)), "delegation_rate should be numeric"
        
        print(f"✓ delegation_stats: total={ds['total_delegated']}, acted={ds['delegate_acted']}, rate={ds['delegation_rate']}%")
    
    def test_analytics_volume_trend(self):
        """Verify volume_trend 30-day data"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "volume_trend" in data, "Missing 'volume_trend'"
        vt = data["volume_trend"]
        assert len(vt) == 30, f"Expected 30 days, got {len(vt)}"
        
        for point in vt:
            assert "date" in point
            assert "created" in point
            assert "resolved" in point
        
        print(f"✓ volume_trend has 30 days of data")


class TestAIInsightsEndpoint:
    """AI Insights API Tests - GPT-5.2 Integration"""
    
    def test_ai_insights_returns_200(self):
        """Verify AI insights endpoint accessible"""
        response = requests.get(f"{BASE_URL}/api/approvals/ai-insights?user_id={ADMIN_USER_ID}", timeout=30)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ AI insights endpoint returns 200")
    
    def test_ai_insights_returns_text(self):
        """Verify AI insights returns text content"""
        response = requests.get(f"{BASE_URL}/api/approvals/ai-insights?user_id={ADMIN_USER_ID}", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        assert "insights" in data, "Missing 'insights' in response"
        insights = data["insights"]
        assert isinstance(insights, str), "insights should be a string"
        assert len(insights) > 50, f"insights too short: {len(insights)} chars"
        
        print(f"✓ AI insights returned {len(insights)} chars of text")
    
    def test_ai_insights_content_quality(self):
        """Verify AI insights contains meaningful content"""
        response = requests.get(f"{BASE_URL}/api/approvals/ai-insights?user_id={ADMIN_USER_ID}", timeout=30)
        assert response.status_code == 200
        data = response.json()
        
        insights = data.get("insights", "")
        
        # Should contain actionable content (not just error message)
        assert "error" not in insights.lower() or "Unable to generate" not in insights, \
            f"AI insights returned an error: {insights[:200]}"
        
        # Should contain some analytical keywords
        analysis_keywords = ["pending", "approved", "workflow", "recommendation", "bottleneck", 
                           "approver", "health", "backlog", "rate", "delegation"]
        found_keywords = [kw for kw in analysis_keywords if kw.lower() in insights.lower()]
        assert len(found_keywords) >= 2, f"AI insights lacks analytical content. Keywords found: {found_keywords}"
        
        print(f"✓ AI insights contains quality content. Keywords found: {found_keywords}")
    
    def test_ai_insights_without_user_id_fails(self):
        """Verify AI insights requires user_id parameter"""
        response = requests.get(f"{BASE_URL}/api/approvals/ai-insights", timeout=10)
        # FastAPI validation returns 422 for missing required query params
        assert response.status_code == 422, f"Expected 422 for missing user_id, got {response.status_code}"
        print("✓ AI insights requires user_id (returns 422 without it)")


class TestAnalyticsDataIntegrity:
    """Data Integrity Tests for Analytics"""
    
    def test_approval_rate_calculation(self):
        """Verify approval_rate is correctly calculated"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        summary = data["summary"]
        approved = summary.get("approved", 0)
        rejected = summary.get("rejected", 0)
        
        if approved + rejected > 0:
            expected_rate = round((approved / (approved + rejected)) * 100, 1)
            assert summary["approval_rate"] == expected_rate, \
                f"Approval rate mismatch: expected {expected_rate}, got {summary['approval_rate']}"
        
        print(f"✓ Approval rate correctly calculated: {summary['approval_rate']}%")
    
    def test_delegation_rate_calculation(self):
        """Verify delegation_rate is correctly calculated"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        ds = data["delegation_stats"]
        summary = data["summary"]
        total = summary.get("total", 0)
        
        if total > 0:
            expected_rate = round((ds["total_delegated"] / total) * 100, 1)
            assert ds["delegation_rate"] == expected_rate, \
                f"Delegation rate mismatch: expected {expected_rate}, got {ds['delegation_rate']}"
        
        print(f"✓ Delegation rate correctly calculated: {ds['delegation_rate']}%")
    
    def test_summary_totals_match_status_breakdown(self):
        """Verify summary counts match status_breakdown"""
        response = requests.get(f"{BASE_URL}/api/approvals/analytics?user_id={ADMIN_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        
        summary = data["summary"]
        status_breakdown = data["status_breakdown"]
        
        # Sum up status breakdown
        status_total = sum(s["count"] for s in status_breakdown)
        
        # Should match summary total
        assert summary["total"] == status_total or summary["total_requests"] == status_total, \
            f"Total mismatch: summary={summary.get('total', summary.get('total_requests'))}, status_breakdown={status_total}"
        
        print(f"✓ Summary totals match status breakdown: {status_total}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
