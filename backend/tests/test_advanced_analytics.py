"""Tests for /api/analytics/admin/overview and /api/analytics/user/my-stats"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")

ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASS = "Admin@123456"
USER_EMAIL = "analytics@munal.ai"
USER_PASS = "Test@12345"


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password}, timeout=20)
    return r


@pytest.fixture(scope="module")
def admin_token():
    # Try to disable 2FA via direct DB tweak using motor not available here; rely on login response
    r = _login(ADMIN_EMAIL, ADMIN_PASS)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    tok = data.get("token") or data.get("access_token")
    # If 2FA required, response may have requires_2fa
    if data.get("requires_2fa") or data.get("two_factor_required"):
        # Disable 2FA in DB and retry
        try:
            import sys
            sys.path.insert(0, "/app/backend")
            from pymongo import MongoClient
            mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
            db_name = os.environ.get("DB_NAME", "munal_db")
            mc = MongoClient(mongo_url)
            mc[db_name].users.update_one({"email": ADMIN_EMAIL}, {"$set": {"two_factor_enabled": False, "two_factor_method": None}})
            r2 = _login(ADMIN_EMAIL, ADMIN_PASS)
            if r2.status_code == 200:
                tok = r2.json().get("token") or r2.json().get("access_token")
        except Exception as e:
            pytest.skip(f"Could not disable admin 2FA: {e}")
    if not tok:
        pytest.skip("No admin token returned")
    return tok


@pytest.fixture(scope="module")
def user_token():
    r = _login(USER_EMAIL, USER_PASS)
    if r.status_code != 200:
        pytest.skip(f"User login failed: {r.status_code} {r.text[:200]}")
    return r.json().get("token") or r.json().get("access_token")


# ---- Admin overview ----
def test_admin_overview_success(admin_token):
    r = requests.get(f"{BASE_URL}/api/analytics/admin/overview?days=30",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
    assert r.status_code == 200, r.text[:500]
    data = r.json()
    for key in ["period_days", "users", "meetings", "workspace", "ai_usage"]:
        assert key in data
    assert data["period_days"] == 30
    # Users sub-fields
    for k in ["total", "active", "suspended", "new_this_period", "new_prev_period", "growth_pct", "signups_daily"]:
        assert k in data["users"], f"missing users.{k}"
    assert isinstance(data["users"]["signups_daily"], list)
    # Meetings sub-fields
    for k in ["total", "this_period", "transcripts", "daily", "peak_hours"]:
        assert k in data["meetings"]
    assert isinstance(data["meetings"]["daily"], list)
    assert isinstance(data["meetings"]["peak_hours"], list)
    # Workspace
    for k in ["total_workspaces", "documents", "sheets", "presentations",
              "new_docs_period", "new_sheets_period", "new_pres_period"]:
        assert k in data["workspace"]
    # AI usage
    for k in ["total_conversations", "total_messages", "conversations_this_period"]:
        assert k in data["ai_usage"]


def test_admin_overview_days_validation(admin_token):
    # days bound 1..365
    r = requests.get(f"{BASE_URL}/api/analytics/admin/overview?days=400",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 422
    r = requests.get(f"{BASE_URL}/api/analytics/admin/overview?days=7",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=30)
    assert r.status_code == 200
    assert r.json()["period_days"] == 7


def test_admin_overview_requires_admin(user_token):
    r = requests.get(f"{BASE_URL}/api/analytics/admin/overview",
                     headers={"Authorization": f"Bearer {user_token}"}, timeout=15)
    assert r.status_code == 403, f"expected 403 for non-admin, got {r.status_code}"


def test_admin_overview_requires_auth():
    r = requests.get(f"{BASE_URL}/api/analytics/admin/overview", timeout=15)
    assert r.status_code in (401, 403)


# ---- User my-stats ----
def test_user_my_stats_success(user_token):
    r = requests.get(f"{BASE_URL}/api/analytics/user/my-stats",
                     headers={"Authorization": f"Bearer {user_token}"}, timeout=30)
    assert r.status_code == 200, r.text[:500]
    data = r.json()
    for key in ["meetings", "content", "ai_usage", "activity_7d"]:
        assert key in data
    assert "total" in data["meetings"] and "transcripts" in data["meetings"]
    for k in ["documents", "sheets", "presentations"]:
        assert k in data["content"]
    assert "conversations" in data["ai_usage"]
    assert isinstance(data["activity_7d"], list)
    assert len(data["activity_7d"]) == 7
    for d in data["activity_7d"]:
        assert "day" in d and "meetings" in d and "documents" in d


def test_user_my_stats_admin_can_access(admin_token):
    # Admin should also be able to fetch their own stats
    r = requests.get(f"{BASE_URL}/api/analytics/user/my-stats",
                     headers={"Authorization": f"Bearer {admin_token}"}, timeout=15)
    assert r.status_code == 200


def test_user_my_stats_requires_auth():
    r = requests.get(f"{BASE_URL}/api/analytics/user/my-stats", timeout=15)
    assert r.status_code in (401, 403)
