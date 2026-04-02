"""
Test suite for Compliance Score API
Tests the GET /api/admin/compliance-score endpoint
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestComplianceScoreAPI:
    """Tests for the compliance score endpoint"""

    def test_compliance_score_returns_200(self):
        """Test that compliance score endpoint returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Compliance score endpoint returns 200")

    def test_compliance_score_has_required_fields(self):
        """Test that response contains score, grade, and breakdown"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        assert "score" in data, "Missing 'score' field"
        assert "grade" in data, "Missing 'grade' field"
        assert "breakdown" in data, "Missing 'breakdown' field"
        assert "computed_at" in data, "Missing 'computed_at' field"
        print("✓ Response has all required top-level fields")

    def test_score_is_valid_number(self):
        """Test that score is a valid number between 0 and 100"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        score = data["score"]
        assert isinstance(score, (int, float)), f"Score should be numeric, got {type(score)}"
        assert 0 <= score <= 100, f"Score should be 0-100, got {score}"
        print(f"✓ Score is valid: {score}")

    def test_grade_is_valid(self):
        """Test that grade is one of A, B, C, D, F"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        grade = data["grade"]
        valid_grades = ["A", "B", "C", "D", "F"]
        assert grade in valid_grades, f"Grade should be one of {valid_grades}, got {grade}"
        print(f"✓ Grade is valid: {grade}")

    def test_breakdown_has_tfa_subscore(self):
        """Test that breakdown contains tfa sub-score with required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        breakdown = data["breakdown"]
        
        assert "tfa" in breakdown, "Missing 'tfa' in breakdown"
        tfa = breakdown["tfa"]
        
        assert "score" in tfa, "Missing 'score' in tfa"
        assert "weight" in tfa, "Missing 'weight' in tfa"
        assert "enabled" in tfa, "Missing 'enabled' in tfa"
        assert "total" in tfa, "Missing 'total' in tfa"
        
        assert tfa["weight"] == 40, f"TFA weight should be 40, got {tfa['weight']}"
        assert isinstance(tfa["enabled"], int), "tfa.enabled should be int"
        assert isinstance(tfa["total"], int), "tfa.total should be int"
        print(f"✓ TFA breakdown valid: {tfa['enabled']}/{tfa['total']} enabled, score={tfa['score']}")

    def test_breakdown_has_password_subscore(self):
        """Test that breakdown contains password sub-score with required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        breakdown = data["breakdown"]
        
        assert "password" in breakdown, "Missing 'password' in breakdown"
        password = breakdown["password"]
        
        assert "score" in password, "Missing 'score' in password"
        assert "weight" in password, "Missing 'weight' in password"
        assert "strong" in password, "Missing 'strong' in password"
        assert "weak" in password, "Missing 'weak' in password"
        
        assert password["weight"] == 30, f"Password weight should be 30, got {password['weight']}"
        assert isinstance(password["strong"], int), "password.strong should be int"
        assert isinstance(password["weak"], int), "password.weak should be int"
        print(f"✓ Password breakdown valid: {password['strong']} strong, {password['weak']} weak, score={password['score']}")

    def test_breakdown_has_login_subscore(self):
        """Test that breakdown contains login sub-score with required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        breakdown = data["breakdown"]
        
        assert "login" in breakdown, "Missing 'login' in breakdown"
        login = breakdown["login"]
        
        assert "score" in login, "Missing 'score' in login"
        assert "weight" in login, "Missing 'weight' in login"
        assert "locked_accounts" in login, "Missing 'locked_accounts' in login"
        assert "high_fail_users" in login, "Missing 'high_fail_users' in login"
        assert "suspicious_events" in login, "Missing 'suspicious_events' in login"
        
        assert login["weight"] == 30, f"Login weight should be 30, got {login['weight']}"
        assert isinstance(login["locked_accounts"], int), "login.locked_accounts should be int"
        assert isinstance(login["high_fail_users"], int), "login.high_fail_users should be int"
        assert isinstance(login["suspicious_events"], int), "login.suspicious_events should be int"
        print(f"✓ Login breakdown valid: {login['locked_accounts']} locked, {login['high_fail_users']} high-fail, {login['suspicious_events']} events, score={login['score']}")

    def test_composite_score_calculation(self):
        """Test that composite score is calculated correctly from sub-scores"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        score = data["score"]
        breakdown = data["breakdown"]
        
        # Calculate expected composite: tfa*0.4 + password*0.3 + login*0.3
        expected = round(
            breakdown["tfa"]["score"] * 0.4 +
            breakdown["password"]["score"] * 0.3 +
            breakdown["login"]["score"] * 0.3,
            1
        )
        
        # Allow small floating point tolerance
        assert abs(score - expected) < 0.2, f"Composite score mismatch: got {score}, expected {expected}"
        print(f"✓ Composite score calculation correct: {score} ≈ {expected}")

    def test_grade_matches_score(self):
        """Test that grade corresponds to score range"""
        response = requests.get(f"{BASE_URL}/api/admin/compliance-score")
        data = response.json()
        
        score = data["score"]
        grade = data["grade"]
        
        # Grade thresholds: A>=90, B>=75, C>=60, D>=40, F<40
        if score >= 90:
            expected_grade = "A"
        elif score >= 75:
            expected_grade = "B"
        elif score >= 60:
            expected_grade = "C"
        elif score >= 40:
            expected_grade = "D"
        else:
            expected_grade = "F"
        
        assert grade == expected_grade, f"Grade mismatch: score={score}, got grade={grade}, expected={expected_grade}"
        print(f"✓ Grade matches score: {score} → {grade}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
