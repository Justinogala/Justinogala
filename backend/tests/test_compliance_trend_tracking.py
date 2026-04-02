"""
Test suite for Compliance Score Trend Tracking Feature
Tests:
- GET /api/admin/compliance-score (with auto-seed)
- GET /api/admin/compliance-score/history (snapshots, trend, count)
- POST /api/admin/compliance-score/snapshot (manual snapshot)
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestComplianceScoreEndpoint:
    """Tests for GET /api/admin/compliance-score"""

    def test_compliance_score_returns_200(self):
        """Test that compliance score endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/admin/compliance-score returns 200")

    def test_compliance_score_has_required_fields(self):
        """Test that response contains score, grade, breakdown, computed_at"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        assert "score" in data, "Missing 'score' field"
        assert "grade" in data, "Missing 'grade' field"
        assert "breakdown" in data, "Missing 'breakdown' field"
        assert "computed_at" in data, "Missing 'computed_at' field"
        print(f"✓ Response has all required fields: score={data['score']}, grade={data['grade']}")


class TestComplianceHistoryEndpoint:
    """Tests for GET /api/admin/compliance-score/history"""

    def test_history_returns_200(self):
        """Test that history endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ GET /api/admin/compliance-score/history returns 200")

    def test_history_has_required_fields(self):
        """Test that history response contains snapshots, trend, count"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        
        assert "snapshots" in data, "Missing 'snapshots' field"
        assert "trend" in data, "Missing 'trend' field"
        assert "count" in data, "Missing 'count' field"
        print(f"✓ History response has required fields: count={data['count']}")

    def test_snapshots_is_array(self):
        """Test that snapshots is an array"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        
        assert isinstance(data["snapshots"], list), "snapshots should be a list"
        print(f"✓ Snapshots is array with {len(data['snapshots'])} items")

    def test_snapshots_ordered_oldest_first(self):
        """Test that snapshots are ordered oldest first (for chart rendering)"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        snapshots = data["snapshots"]
        
        if len(snapshots) >= 2:
            # Check that dates are in ascending order
            dates = [s["taken_at"] for s in snapshots]
            assert dates == sorted(dates), "Snapshots should be ordered oldest first"
            print(f"✓ Snapshots ordered oldest first: {dates[0]} → {dates[-1]}")
        else:
            print(f"✓ Only {len(snapshots)} snapshot(s), ordering check skipped")

    def test_snapshot_has_required_fields(self):
        """Test that each snapshot has score, grade, taken_at"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        snapshots = data["snapshots"]
        
        if len(snapshots) > 0:
            snapshot = snapshots[0]
            assert "score" in snapshot, "Snapshot missing 'score'"
            assert "grade" in snapshot, "Snapshot missing 'grade'"
            assert "taken_at" in snapshot, "Snapshot missing 'taken_at'"
            print(f"✓ Snapshot has required fields: score={snapshot['score']}, grade={snapshot['grade']}")
        else:
            print("✓ No snapshots to validate (empty history)")

    def test_trend_object_structure(self):
        """Test that trend object has direction and change when >= 2 snapshots"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        
        if data["count"] >= 2:
            trend = data["trend"]
            assert trend is not None, "Trend should not be None with >= 2 snapshots"
            assert "direction" in trend, "Trend missing 'direction'"
            assert "change" in trend, "Trend missing 'change'"
            assert trend["direction"] in ["up", "down", "flat"], f"Invalid direction: {trend['direction']}"
            assert isinstance(trend["change"], (int, float)), "change should be numeric"
            print(f"✓ Trend: direction={trend['direction']}, change={trend['change']}")
        else:
            # With < 2 snapshots, trend should be None
            assert data["trend"] is None, "Trend should be None with < 2 snapshots"
            print("✓ Trend is None (< 2 snapshots)")

    def test_count_matches_snapshots_length(self):
        """Test that count matches the length of snapshots array"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        
        assert data["count"] == len(data["snapshots"]), \
            f"Count mismatch: count={data['count']}, len(snapshots)={len(data['snapshots'])}"
        print(f"✓ Count matches snapshots length: {data['count']}")


class TestManualSnapshotEndpoint:
    """Tests for POST /api/admin/compliance-score/snapshot"""

    def test_manual_snapshot_returns_200(self):
        """Test that manual snapshot endpoint returns 200 OK"""
        response = requests.post(f"{BASE_URL}/api/admin/compliance-score/snapshot")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ POST /api/admin/compliance-score/snapshot returns 200")

    def test_manual_snapshot_returns_success(self):
        """Test that manual snapshot returns success: true"""
        response = requests.post(f"{BASE_URL}/api/admin/compliance-score/snapshot")
        data = response.json()
        
        assert "success" in data, "Missing 'success' field"
        assert data["success"] is True, f"Expected success=True, got {data['success']}"
        print("✓ Manual snapshot returns success: true")

    def test_manual_snapshot_returns_snapshot_data(self):
        """Test that manual snapshot returns snapshot object with score, grade, taken_at"""
        response = requests.post(f"{BASE_URL}/api/admin/compliance-score/snapshot")
        data = response.json()
        
        assert "snapshot" in data, "Missing 'snapshot' field"
        snapshot = data["snapshot"]
        
        assert "score" in snapshot, "Snapshot missing 'score'"
        assert "grade" in snapshot, "Snapshot missing 'grade'"
        assert "taken_at" in snapshot, "Snapshot missing 'taken_at'"
        assert "breakdown" in snapshot, "Snapshot missing 'breakdown'"
        print(f"✓ Snapshot data: score={snapshot['score']}, grade={snapshot['grade']}")

    def test_manual_snapshot_persists_in_history(self):
        """Test that manual snapshot appears in history after creation"""
        # Get current history count
        history_before = requests.get(f"{BASE_URL}/api/admin/compliance-score/history").json()
        count_before = history_before["count"]
        
        # Create a new snapshot
        snapshot_response = requests.post(f"{BASE_URL}/api/admin/compliance-score/snapshot")
        assert snapshot_response.status_code == 200
        
        # Small delay to ensure DB write completes
        time.sleep(0.5)
        
        # Get updated history
        history_after = requests.get(f"{BASE_URL}/api/admin/compliance-score/history").json()
        count_after = history_after["count"]
        
        assert count_after == count_before + 1, \
            f"History count should increase by 1: before={count_before}, after={count_after}"
        print(f"✓ Snapshot persisted: history count {count_before} → {count_after}")


class TestTrendCalculation:
    """Tests for trend calculation logic"""

    def test_trend_direction_calculation(self):
        """Test that trend direction is calculated correctly from last two snapshots"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score/history")
        data = response.json()
        
        if data["count"] >= 2:
            snapshots = data["snapshots"]
            last_score = snapshots[-1]["score"]
            prev_score = snapshots[-2]["score"]
            diff = last_score - prev_score
            
            expected_direction = "up" if diff > 0 else ("down" if diff < 0 else "flat")
            expected_change = round(abs(diff), 1)
            
            trend = data["trend"]
            assert trend["direction"] == expected_direction, \
                f"Direction mismatch: expected {expected_direction}, got {trend['direction']}"
            assert abs(trend["change"] - expected_change) < 0.2, \
                f"Change mismatch: expected {expected_change}, got {trend['change']}"
            print(f"✓ Trend calculation correct: {prev_score} → {last_score} = {trend['direction']} {trend['change']}")
        else:
            print("✓ Skipped trend calculation test (< 2 snapshots)")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
