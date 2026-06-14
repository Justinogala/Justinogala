"""Admin Trash (Recycle Bin) API tests — iteration 141."""
import os
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"
USER_EMAIL = "previewtest@munal.ai"
USER_PASSWORD = "Test@12345"

RESOURCE_TYPES = [
    "users", "workspaces", "organizations", "approvals", "approval_templates",
    "incident_reports", "ir_sor_templates", "shifts", "meetings",
    "documents", "presentations", "sheets", "form_templates",
]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login?skip_2fa=true",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    token = data.get("token") or data.get("access_token")
    assert token, f"No token in admin login response: {data}"
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def standard_token():
    # try login; user may be soft-deleted
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": USER_EMAIL, "password": USER_PASSWORD}, timeout=30)
    if r.status_code != 200:
        return None
    data = r.json()
    return data.get("token") or data.get("access_token")


# ── Summary ──
def test_summary_returns_all_categories(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/trash/summary", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "summary" in d and "total" in d
    summary = d["summary"]
    for rtype in RESOURCE_TYPES:
        assert rtype in summary, f"Missing {rtype} in summary"
        assert isinstance(summary[rtype], int)
    assert d["total"] == sum(summary.values())


def test_summary_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/trash/summary", timeout=30)
    assert r.status_code in (401, 403)


def test_summary_non_admin_forbidden(standard_token):
    if not standard_token:
        pytest.skip("standard user not available")
    r = requests.get(f"{BASE_URL}/api/admin/trash/summary",
                     headers={"Authorization": f"Bearer {standard_token}"}, timeout=30)
    assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"


# ── List items ──
def test_list_users_trash(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/trash/users?limit=100", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "items" in d and "total" in d
    assert isinstance(d["items"], list)
    if d["items"]:
        first = d["items"][0]
        for k in ("id", "name", "type", "type_label", "deleted_at", "extra", "raw"):
            assert k in first, f"Missing key {k}"
        assert first["type"] == "users"


def test_list_documents_trash(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/trash/documents?limit=100", headers=admin_headers, timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    assert "items" in d and "total" in d
    if d["items"]:
        assert d["items"][0]["type"] == "documents"


def test_list_unknown_resource_type_400(admin_headers):
    r = requests.get(f"{BASE_URL}/api/admin/trash/unknown_type", headers=admin_headers, timeout=30)
    assert r.status_code == 400


def test_list_no_mongodb_id_leak(admin_headers):
    """Ensure raw _id is not leaked in items."""
    for rtype in ("users", "documents", "presentations"):
        r = requests.get(f"{BASE_URL}/api/admin/trash/{rtype}?limit=5", headers=admin_headers, timeout=30)
        assert r.status_code == 200
        for it in r.json().get("items", []):
            assert "_id" not in it
            assert "_id" not in it.get("raw", {})


# ── Restore (full round-trip on a trashed user) ──
def test_restore_user_round_trip(admin_headers):
    # list trashed users
    r = requests.get(f"{BASE_URL}/api/admin/trash/users?limit=100", headers=admin_headers, timeout=30)
    assert r.status_code == 200
    users = r.json().get("items", [])
    if not users:
        pytest.skip("no trashed users to restore")
    # pick previewtest if exists, else first one
    target = next((u for u in users if u.get("raw", {}).get("email") == USER_EMAIL), users[0])
    uid = target["id"]
    email = target.get("raw", {}).get("email")

    # Restore
    r2 = requests.post(f"{BASE_URL}/api/admin/trash/users/{uid}/restore", headers=admin_headers, timeout=30)
    assert r2.status_code == 200, r2.text
    assert r2.json().get("success") is True

    # Verify removed from trash
    r3 = requests.get(f"{BASE_URL}/api/admin/trash/users?limit=200", headers=admin_headers, timeout=30)
    ids_now = [u["id"] for u in r3.json().get("items", [])]
    assert uid not in ids_now, f"User {uid} still in trash after restore"

    # Re-soft-delete if it's not the previewtest user we may have just restored intentionally? 
    # Leave it restored (test data state intentionally kept consistent).
    print(f"Restored user {uid} ({email})")


def test_restore_unknown_resource_400(admin_headers):
    r = requests.post(f"{BASE_URL}/api/admin/trash/bogus/abc/restore", headers=admin_headers, timeout=30)
    assert r.status_code == 400


def test_restore_missing_item_404(admin_headers):
    r = requests.post(f"{BASE_URL}/api/admin/trash/users/non-existent-id-xyz/restore",
                      headers=admin_headers, timeout=30)
    assert r.status_code == 404


# ── Permanent delete (test on a doc we create or skip if no safe target) ──
def test_permanent_delete_missing_404(admin_headers):
    r = requests.delete(f"{BASE_URL}/api/admin/trash/users/non-existent-id-xyz",
                        headers=admin_headers, timeout=30)
    assert r.status_code == 404


# ── Empty all (route ordering critical) ──
def test_empty_all_route_ordering_form_templates(admin_headers):
    """form_templates has 0 items per context note. Verifies empty/all is matched
    before {item_id} route — must return 200 with deleted_count, NOT 404."""
    r = requests.delete(f"{BASE_URL}/api/admin/trash/form_templates/empty/all",
                        headers=admin_headers, timeout=30)
    assert r.status_code == 200, f"Route ordering broken — got {r.status_code}: {r.text}"
    d = r.json()
    assert d.get("success") is True
    assert "deleted_count" in d
    assert isinstance(d["deleted_count"], int)


def test_empty_all_unknown_resource_400(admin_headers):
    r = requests.delete(f"{BASE_URL}/api/admin/trash/bogus_type/empty/all",
                        headers=admin_headers, timeout=30)
    assert r.status_code == 400


# ── Auth guards ──
def test_list_requires_auth():
    r = requests.get(f"{BASE_URL}/api/admin/trash/users", timeout=30)
    assert r.status_code in (401, 403)


def test_restore_non_admin_forbidden(standard_token):
    if not standard_token:
        pytest.skip("no standard user")
    r = requests.post(f"{BASE_URL}/api/admin/trash/users/some-id/restore",
                      headers={"Authorization": f"Bearer {standard_token}"}, timeout=30)
    assert r.status_code == 403
