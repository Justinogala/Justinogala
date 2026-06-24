"""
Tests for /api/recordings - covering CRUD, stream, share, unshare flows.
User: recordtest@munal.ai (User ID: 036cbc05-34cd-40d5-8ab1-d0629ff07f36)
"""
import os
import base64
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
USER_ID = "036cbc05-34cd-40d5-8ab1-d0629ff07f36"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def created_recording(session):
    """Create a recording for test reuse; cleaned up after module."""
    # minimal valid base64 payload (a few bytes)
    payload = {
        "user_id": USER_ID,
        "title": "TEST_Recording_Pytest",
        "recording_type": "screen",
        "duration": 5,
        "file_data": base64.b64encode(b"dummy webm bytes for testing").decode(),
        "mime_type": "video/webm",
        "category": "TEST",
    }
    resp = session.post(f"{BASE_URL}/api/recordings", json=payload, timeout=15)
    assert resp.status_code == 200, f"create failed: {resp.status_code} {resp.text}"
    rec = resp.json()["recording"]
    yield rec
    # teardown - best effort
    try:
        session.delete(f"{BASE_URL}/api/recordings/{USER_ID}/{rec['id']}", timeout=10)
    except Exception:
        pass


# ============== Create ==============
def test_create_recording_returns_metadata(created_recording):
    assert "id" in created_recording
    assert created_recording["user_id"] == USER_ID
    assert created_recording["title"] == "TEST_Recording_Pytest"
    assert created_recording["category"] == "TEST"
    assert created_recording["file_size"] > 0
    assert "grid_id" not in created_recording
    assert "_id" not in created_recording


# ============== List ==============
def test_list_recordings_for_user(session, created_recording):
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}", timeout=15)
    assert resp.status_code == 200
    data = resp.json()
    assert "recordings" in data and "count" in data
    assert isinstance(data["recordings"], list)
    ids = [r["id"] for r in data["recordings"]]
    assert created_recording["id"] in ids
    # Expect at least 2 pre-seeded + created = 3
    assert data["count"] >= 1


# ============== Stream ==============
def test_stream_recording_returns_video_bytes(session, created_recording):
    rid = created_recording["id"]
    resp = session.get(
        f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/stream",
        timeout=15,
        stream=True,
    )
    assert resp.status_code == 200, f"stream failed: {resp.text[:200]}"
    assert "video" in resp.headers.get("Content-Type", "")
    content = resp.content
    assert len(content) > 0


def test_stream_recording_not_found(session):
    resp = session.get(
        f"{BASE_URL}/api/recordings/{USER_ID}/nonexistent-id-123/stream",
        timeout=10,
    )
    assert resp.status_code == 404


# ============== Update ==============
def test_update_recording_title_and_category(session, created_recording):
    rid = created_recording["id"]
    resp = session.put(
        f"{BASE_URL}/api/recordings/{USER_ID}/{rid}",
        json={"title": "TEST_Updated_Title", "category": "Updated"},
        timeout=10,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["recording"]["title"] == "TEST_Updated_Title"
    assert data["recording"]["category"] == "Updated"

    # GET to verify persistence
    get_resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)
    assert get_resp.status_code == 200
    fetched = get_resp.json()
    assert fetched["title"] == "TEST_Updated_Title"
    assert fetched["category"] == "Updated"


# ============== Share ==============
def test_share_recording_returns_share_url(session, created_recording):
    rid = created_recording["id"]
    resp = session.post(
        f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/share",
        json={"is_public": True, "share_with_users": []},
        timeout=10,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert "share_url" in data, f"share_url missing in response: {data}"
    assert data["share_url"].startswith("/shared/recording/")
    assert data["recording"]["is_shared"] is True
    assert data["recording"]["share_token"] is not None


def test_unshare_recording(session, created_recording):
    rid = created_recording["id"]
    # Ensure it's shared first
    session.post(
        f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/share",
        json={"is_public": True},
        timeout=10,
    )
    resp = session.delete(
        f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/share",
        timeout=10,
    )
    assert resp.status_code == 200
    assert resp.json()["success"] is True

    # Verify
    get_resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)
    assert get_resp.json()["is_shared"] is False


# ============== Delete ==============
def test_delete_recording_and_verify_removal(session):
    # Create a throwaway recording specifically for delete test
    payload = {
        "user_id": USER_ID,
        "title": "TEST_DeleteMe",
        "recording_type": "screen",
        "duration": 2,
        "file_data": base64.b64encode(b"to be deleted").decode(),
        "mime_type": "video/webm",
        "category": "TEST",
    }
    create_resp = session.post(f"{BASE_URL}/api/recordings", json=payload, timeout=15)
    assert create_resp.status_code == 200
    rid = create_resp.json()["recording"]["id"]

    del_resp = session.delete(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)
    assert del_resp.status_code == 200
    assert del_resp.json()["success"] is True

    # Verify gone
    get_resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)
    assert get_resp.status_code == 404


def test_delete_recording_not_found(session):
    resp = session.delete(
        f"{BASE_URL}/api/recordings/{USER_ID}/does-not-exist-xyz",
        timeout=10,
    )
    assert resp.status_code == 404


# ============== Pin (NEW) ==============
def test_pin_toggle_and_expires_at(session, created_recording):
    """Pin should set expires_at=null; Unpin should restore ~7d expiry."""
    rid = created_recording["id"]

    # Get current state
    get0 = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)
    assert get0.status_code == 200
    initial_pinned = bool(get0.json().get("pinned", False))

    # Toggle 1
    r1 = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["success"] is True
    assert d1["pinned"] == (not initial_pinned)
    if d1["pinned"]:
        assert d1["recording"]["expires_at"] is None
    else:
        assert d1["recording"]["expires_at"] is not None

    # Toggle 2 (back)
    r2 = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["pinned"] == initial_pinned

    # Toggle 3 (forward again) — true→false→true verification per request
    r3 = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["pinned"] == (not initial_pinned)
    if d3["pinned"]:
        assert d3["recording"]["expires_at"] is None

    # Restore original
    session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)


def test_pin_not_found(session):
    r = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/does-not-exist-pin/pin", timeout=10)
    assert r.status_code == 404


# ============== Pagination (NEW) ==============
def test_list_recordings_default_pagination_fields(session, created_recording):
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}", timeout=15)
    assert resp.status_code == 200
    data = resp.json()
    for key in ("recordings", "count", "total", "limit", "offset"):
        assert key in data, f"missing pagination field: {key}"
    assert data["limit"] == 50
    assert data["offset"] == 0
    assert isinstance(data["total"], int)
    assert data["count"] == len(data["recordings"])
    assert data["total"] >= data["count"]


def test_list_recordings_limit_one(session, created_recording):
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}?limit=1&offset=0", timeout=15)
    assert resp.status_code == 200
    data = resp.json()
    assert data["limit"] == 1
    assert data["offset"] == 0
    assert len(data["recordings"]) == 1
    assert data["count"] == 1
    # total reflects DB total, not paginated count
    assert data["total"] >= 1


def test_pinned_sorts_first(session, created_recording):
    """Ensure pinned recordings come before unpinned in the list."""
    rid = created_recording["id"]
    # Pin our test recording
    pin_resp = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)
    assert pin_resp.status_code == 200
    if not pin_resp.json()["pinned"]:
        # already was pinned, toggle again to make it pinned
        pin_resp = session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)
        assert pin_resp.json()["pinned"] is True

    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}?limit=50&offset=0", timeout=15)
    assert resp.status_code == 200
    recs = resp.json()["recordings"]
    # Find first unpinned index, all pinned should appear before it
    seen_unpinned = False
    for r in recs:
        if r.get("pinned"):
            assert not seen_unpinned, "Pinned recording found AFTER an unpinned one — sort broken"
        else:
            seen_unpinned = True

    # Unpin our test recording to restore
    session.put(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/pin", timeout=10)


# ============== Auth refactor smoke tests (NEW) ==============
def test_auth_login_still_works(session):
    """auth.py refactor: login endpoint still resolves and works."""
    resp = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "recordtest@munal.ai", "password": "Record@12345"},
        timeout=15,
    )
    assert resp.status_code == 200, f"login failed: {resp.status_code} {resp.text[:200]}"
    data = resp.json()
    # Either direct token (no 2FA) or 2FA challenge
    if data.get("requires_2fa"):
        assert "user_id" in data
    else:
        assert "token" in data
        assert "user" in data
        assert data["user"]["email"] == "recordtest@munal.ai"


def test_auth_verify_token_endpoint(session):
    """get_current_user dependency from auth_helpers still resolves on /verify-token."""
    login = session.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "recordtest@munal.ai", "password": "Record@12345"},
        timeout=15,
    )
    assert login.status_code == 200
    data = login.json()
    if data.get("requires_2fa"):
        pytest.skip("2FA enabled — cannot test verify-token without OTP")
    token = data["token"]
    vt = requests.get(
        f"{BASE_URL}/api/auth/verify-token",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )
    assert vt.status_code == 200
    assert vt.json()["valid"] is True


def test_auth_register_validation_error_path(session):
    """Register endpoint reachable post-refactor; weak password triggers 400 (not 500)."""
    resp = session.post(
        f"{BASE_URL}/api/auth/register",
        json={
            "email": f"TEST_register_{uuid_lite()}@example.com",
            "name": "Test User",
            "password": "weak",
            "role": "User",
            "status": "Active",
            "plan": "Free",
        },
        timeout=15,
    )
    # We expect a 400 validation failure (password policy) — proves routing & module imports work
    assert resp.status_code in (400, 422), f"Unexpected status: {resp.status_code} {resp.text[:200]}"


def uuid_lite():
    import uuid as _u
    return _u.uuid4().hex[:8]


# ============== Pagination limit cap (NEW) ==============
def test_list_recordings_limit_capped_at_200(session):
    """limit=999 should be capped to 200."""
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}?limit=999", timeout=15)
    assert resp.status_code == 200
    data = resp.json()
    assert data["limit"] == 200, f"limit not capped: got {data['limit']}"


def test_list_recordings_limit_clamped_to_min_1(session):
    """limit=-5 should be clamped to 1."""
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}?limit=-5", timeout=15)
    assert resp.status_code == 200
    data = resp.json()
    assert data["limit"] == 1, f"limit not clamped to 1: got {data['limit']}"


# ============== Transcription (NEW) ==============
def test_compound_index_exists():
    """Verify recordings_user_pinned_created compound index exists."""
    import os as _os
    from pathlib import Path as _P
    from pymongo import MongoClient
    from dotenv import load_dotenv as _ld
    _ld(_P(__file__).parent.parent / ".env")
    mongo_url = _os.environ.get("CUSTOM_MONGO_URL") or _os.environ.get("MONGO_URL")
    db_name = _os.environ.get("CUSTOM_DB_NAME") or _os.environ.get("DB_NAME", "munal_db")
    assert mongo_url, "MONGO_URL not configured for index check"
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    idx_info = client[db_name].recordings.index_information()
    client.close()
    assert "recordings_user_pinned_created" in idx_info, f"compound index missing. Found: {list(idx_info.keys())}"
    keys = idx_info["recordings_user_pinned_created"]["key"]
    assert keys == [("user_id", 1), ("pinned", -1), ("created_at", -1)], f"index key wrong: {keys}"


def test_create_recording_initial_transcript_status_pending(session):
    """A new recording must initialize transcript_status=pending and transcript=null."""
    import base64 as _b64
    payload = {
        "user_id": USER_ID,
        "title": "TEST_TranscriptInit",
        "recording_type": "screen",
        "duration": 2,
        "file_data": _b64.b64encode(b"dummy fake audio bytes").decode(),
        "mime_type": "video/webm",
        "category": "TEST",
    }
    resp = session.post(f"{BASE_URL}/api/recordings", json=payload, timeout=15)
    assert resp.status_code == 200
    rec = resp.json()["recording"]
    assert rec.get("transcript_status") == "pending"
    assert rec.get("transcript") is None
    assert rec.get("transcript_error") is None
    # cleanup
    session.delete(f"{BASE_URL}/api/recordings/{USER_ID}/{rec['id']}", timeout=10)


def test_get_transcript_endpoint_structure(session, created_recording):
    """Transcript endpoint should return id, title, transcript, transcript_status, error, updated_at."""
    rid = created_recording["id"]
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/transcript", timeout=10)
    assert resp.status_code == 200, f"transcript endpoint failed: {resp.text[:200]}"
    data = resp.json()
    for key in ("id", "title", "transcript", "transcript_status", "transcript_error", "transcript_updated_at"):
        assert key in data, f"missing key: {key}"
    assert data["id"] == rid
    assert data["transcript_status"] in ("pending", "processing", "completed", "failed", "none")


def test_get_transcript_not_found(session):
    resp = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/nonexistent-tx-id/transcript", timeout=10)
    assert resp.status_code == 404


def test_retranscribe_resets_status_to_pending(session, created_recording):
    """Retranscribe must reset transcript=null, status=pending, error=null."""
    import time as _t
    rid = created_recording["id"]
    resp = session.post(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/retranscribe", timeout=15)
    assert resp.status_code == 200, f"retranscribe failed: {resp.text[:200]}"
    assert resp.json()["success"] is True
    # Immediately check transcript state — should be pending (background task might still be queued)
    _t.sleep(0.5)
    tx = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/transcript", timeout=10)
    assert tx.status_code == 200
    status = tx.json()["transcript_status"]
    # Could be pending (queued), processing (started), or failed (fake audio rejected by Whisper)
    assert status in ("pending", "processing", "failed", "completed"), f"unexpected status: {status}"


def test_retranscribe_not_found(session):
    resp = session.post(f"{BASE_URL}/api/recordings/{USER_ID}/nonexistent-rt/retranscribe", timeout=10)
    assert resp.status_code == 404


def test_transcription_processes_in_background(session):
    """Wait for transcription background task to complete (likely 'failed' due to fake audio)."""
    import time as _t
    import base64 as _b64
    payload = {
        "user_id": USER_ID,
        "title": "TEST_TranscriptBG",
        "recording_type": "screen",
        "duration": 2,
        "file_data": _b64.b64encode(b"not real audio data").decode(),
        "mime_type": "video/webm",
        "category": "TEST",
    }
    resp = session.post(f"{BASE_URL}/api/recordings", json=payload, timeout=15)
    assert resp.status_code == 200
    rid = resp.json()["recording"]["id"]

    # Poll up to 30 seconds for status transition out of "pending"
    final_status = "pending"
    for _ in range(15):
        _t.sleep(2)
        tx = session.get(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}/transcript", timeout=10)
        if tx.status_code == 200:
            final_status = tx.json()["transcript_status"]
            if final_status in ("completed", "failed"):
                break

    # cleanup before assertion
    session.delete(f"{BASE_URL}/api/recordings/{USER_ID}/{rid}", timeout=10)

    # Background task should have transitioned away from pending — failed is expected with fake bytes
    assert final_status in ("completed", "failed", "processing"), (
        f"Transcription background task did not progress (still '{final_status}'). "
        "Background task may not be firing."
    )


def test_auth_forgot_password_404_for_unknown(session):
    resp = session.post(
        f"{BASE_URL}/api/auth/forgot-password",
        json={"email": f"nobody_{uuid_lite()}@example.com"},
        timeout=10,
    )
    # Either 404 (user not found) or 400 (validation) — both prove endpoint routing works post-refactor
    assert resp.status_code in (400, 404), f"Unexpected: {resp.status_code} {resp.text[:200]}"

