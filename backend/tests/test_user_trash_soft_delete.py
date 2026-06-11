"""
Backend tests for User Soft-Delete (Trash) feature.

Covers:
- DELETE /api/users/{id}      → soft delete (move to trash)
- GET    /api/admin/users/trash → list trashed users
- POST   /api/admin/users/{id}/restore → restore user
- DELETE /api/admin/users/{id}/permanent → permanent removal
- GET    /api/admin/users      → excludes trashed users
- GET    /api/users            → excludes trashed users
- POST   /api/auth/login       → rejects deleted users w/ specific message
- Restored users can log in again
"""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
ADMIN_EMAIL = "admin@munal.ai"
ADMIN_PASSWORD = "Admin@123456"


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    data = r.json()
    token = data.get("token") or data.get("access_token")
    if not token:
        pytest.skip(f"Admin login returned no token: {data}")
    return token


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


def _create_user_via_admin(admin_headers):
    """Create a fresh test user via admin POST /api/users (no rate limit)."""
    uniq = uuid.uuid4().hex[:8]
    email = f"trashtest-{uniq}@munal.ai"
    password = "TrashTest@123"
    payload = {
        "email": email,
        "password": password,
        "name": "Trash Tester",
        "role": "User",
        "status": "Active",
        "plan": "Free",
    }
    r = requests.post(f"{BASE_URL}/api/users", headers=admin_headers, json=payload, timeout=30)
    assert r.status_code in (200, 201), f"Create user failed: {r.status_code} {r.text}"
    data = r.json()
    uid = data.get("id")
    assert uid, f"Created user missing id: {data}"
    return {"email": email, "password": password, "id": uid}


@pytest.fixture
def fresh_user(admin_headers):
    return _create_user_via_admin(admin_headers)


# ---------- Tests ----------

class TestSoftDelete:
    def test_delete_user_moves_to_trash(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        r = requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"Soft-delete failed: {r.status_code} {r.text}"
        body = r.json()
        assert "trash" in (body.get("message") or "").lower()

        # Verify user is still retrievable (not hard-deleted) and marked deleted
        r2 = requests.get(f"{BASE_URL}/api/users/{uid}", timeout=30)
        assert r2.status_code == 200, f"User should still exist post soft-delete, got {r2.status_code}"
        u = r2.json()
        assert u.get("deleted") is True, f"Expected deleted=True, got {u.get('deleted')}"
        assert u.get("status") == "Deleted", f"Expected status=Deleted, got {u.get('status')}"
        assert u.get("deleted_at"), "Expected deleted_at timestamp to be set"

        # Cleanup: permanently delete after test
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_trashed_user_appears_in_trash_endpoint(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        r = requests.get(f"{BASE_URL}/api/admin/users/trash", headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"GET trash failed: {r.status_code} {r.text}"
        data = r.json()
        users = data.get("users", [])
        ids = [u.get("id") for u in users]
        assert uid in ids, f"Soft-deleted user {uid} not present in trash list"
        # check deleted_at on entry
        entry = next(u for u in users if u.get("id") == uid)
        assert entry.get("deleted_at"), "Trash entry must include deleted_at"
        assert entry.get("deleted") is True

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_trashed_user_excluded_from_admin_users(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        r = requests.get(f"{BASE_URL}/api/admin/users?limit=1000", headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"GET /api/admin/users failed: {r.text}"
        data = r.json()
        ids = [u.get("id") for u in data.get("users", [])]
        assert uid not in ids, "Soft-deleted user must NOT appear in /api/admin/users"

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_trashed_user_excluded_from_public_users(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        r = requests.get(f"{BASE_URL}/api/users?limit=1000", headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"GET /api/users failed: {r.text}"
        users = r.json() if isinstance(r.json(), list) else r.json().get("users", [])
        ids = [u.get("id") for u in users]
        assert uid not in ids, "Soft-deleted user must NOT appear in /api/users"

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_deleted_user_cannot_login(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": fresh_user["email"], "password": fresh_user["password"]},
                          timeout=30)
        assert r.status_code == 401, f"Deleted login expected 401, got {r.status_code}: {r.text}"
        detail = (r.json().get("detail") or "").lower()
        assert "deleted" in detail, f"Expected 'deleted' in detail message, got: {detail}"

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)


class TestRestore:
    def test_restore_user_brings_back_to_active(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        # Soft delete first
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        # Restore
        r = requests.post(f"{BASE_URL}/api/admin/users/{uid}/restore",
                          headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"Restore failed: {r.status_code} {r.text}"
        body = r.json()
        assert body.get("success") is True

        # GET the user, should be deleted=False and not status=Deleted
        r2 = requests.get(f"{BASE_URL}/api/users/{uid}", timeout=30)
        assert r2.status_code == 200
        u = r2.json()
        assert u.get("deleted") in (False, None), f"After restore, deleted should be False, got {u.get('deleted')}"
        assert u.get("status") != "Deleted", f"After restore, status should not be 'Deleted', got {u.get('status')}"
        assert u.get("deleted_at") in (None, ""), "deleted_at should be cleared on restore"

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_restored_user_can_login_again(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)
        requests.post(f"{BASE_URL}/api/admin/users/{uid}/restore", headers=admin_headers, timeout=30)

        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": fresh_user["email"], "password": fresh_user["password"]},
                          timeout=30)
        assert r.status_code == 200, f"Restored user should be able to log in. Got {r.status_code}: {r.text}"
        data = r.json()
        assert data.get("token") or data.get("access_token") or data.get("requires_2fa") is not None

        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent", headers=admin_headers, timeout=30)

    def test_restore_nonexistent_user_returns_404(self, admin_headers):
        fake_id = str(uuid.uuid4())
        r = requests.post(f"{BASE_URL}/api/admin/users/{fake_id}/restore",
                          headers=admin_headers, timeout=30)
        assert r.status_code == 404


class TestPermanentDelete:
    def test_permanent_delete_removes_user(self, fresh_user, admin_headers):
        uid = fresh_user["id"]
        # Soft delete first
        requests.delete(f"{BASE_URL}/api/users/{uid}", headers=admin_headers, timeout=30)

        # Permanent delete
        r = requests.delete(f"{BASE_URL}/api/admin/users/{uid}/permanent",
                            headers=admin_headers, timeout=30)
        assert r.status_code == 200, f"Permanent delete failed: {r.status_code} {r.text}"
        assert r.json().get("success") is True

        # GET user → 404
        r2 = requests.get(f"{BASE_URL}/api/users/{uid}", timeout=30)
        assert r2.status_code == 404, f"User should be gone, got {r2.status_code}"

        # Should not be in trash anymore
        r3 = requests.get(f"{BASE_URL}/api/admin/users/trash", headers=admin_headers, timeout=30)
        ids = [u.get("id") for u in r3.json().get("users", [])]
        assert uid not in ids, "Permanently deleted user must not appear in trash"

    def test_permanent_delete_nonexistent_returns_404(self, admin_headers):
        fake_id = str(uuid.uuid4())
        r = requests.delete(f"{BASE_URL}/api/admin/users/{fake_id}/permanent",
                            headers=admin_headers, timeout=30)
        assert r.status_code == 404
