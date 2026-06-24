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
