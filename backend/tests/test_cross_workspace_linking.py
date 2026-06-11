"""
Tests for:
- Meeting Summary -> Sheet endpoint (POST /api/sheets/from-meeting/{meeting_id})
- Cross-Workspace Linking for sheets, documents and presentations
- Workspace-scoped listing returning both owned + linked items
"""
import os
import sys
import uuid
import pytest
import requests
from datetime import datetime, timezone
from pymongo import MongoClient

BASE_URL = "https://new-user-welcome-2.preview.emergentagent.com".rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL") or "mongodb+srv://justinoo2001_db_user:T8H0xkIcmK2Qorae@cluster0.t5u88mk.mongodb.net/?retryWrites=true&w=majority"
DB_NAME = os.environ.get("DB_NAME") or "munal_db"

@pytest.fixture(scope="module")
def mongo_db():
    client = MongoClient(MONGO_URL)
    return client[DB_NAME]


@pytest.fixture(scope="module")
def auth_data():
    """Register a fresh user and return (token, user_id, email)."""
    email = f"TEST_xwslink_{uuid.uuid4().hex[:8]}@example.com"
    password = "TestPass@1234"
    reg = requests.post(f"{BASE_URL}/api/auth/register",
                        json={"email": email, "password": password,
                              "name": "X-Workspace Tester", "full_name": "X-Workspace Tester"},
                        timeout=30)
    assert reg.status_code in (200, 201), f"register failed: {reg.status_code} {reg.text}"
    data = reg.json()
    token = data.get("token") or data.get("access_token")
    # try to extract user id
    uid = None
    user_obj = data.get("user") or {}
    uid = user_obj.get("id") or data.get("user_id") or data.get("id")
    if not uid and token:
        try:
            import jwt as _jwt
            decoded = _jwt.decode(token, options={"verify_signature": False})
            uid = decoded.get("user_id") or decoded.get("sub")
        except Exception:
            pass
    assert token and uid, f"missing token or uid; data={data}"
    return {"token": token, "user_id": uid, "email": email}


@pytest.fixture(scope="module")
def auth_token(auth_data):
    return auth_data["token"]


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def user_id(auth_data):
    return auth_data["user_id"]


@pytest.fixture(scope="module")
def workspaces(headers, user_id, mongo_db):
    """Use mock workspace IDs. Insert as workspace docs for cleanup safety; endpoints
    don't enforce FK, so plain UUIDs are fine for link tests."""
    created = [{"id": f"TEST_WS_A_{uuid.uuid4().hex[:8]}"},
               {"id": f"TEST_WS_B_{uuid.uuid4().hex[:8]}"}]
    yield created


@pytest.fixture(scope="module")
def mock_meeting_transcript(mongo_db, user_id):
    """Insert a mock completed meeting transcript with insights."""
    mid = f"TEST_meet_{uuid.uuid4()}"
    doc = {
        "id": mid,
        "user_id": user_id,
        "created_by": user_id,
        "title": "TEST Strategy Sync",
        "status": "completed",
        "duration_seconds": 1800,
        "participants": ["Alice", "Bob", "Carol"],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "insights": {
            "summary": "Discussed Q1 roadmap and resource allocation.",
            "sentiment": "positive",
            "key_decisions": [
                {"decision": "Adopt new sprint cadence", "context": "Engineering wants 2-week sprints"}
            ],
            "action_items": [
                {"task": "Draft new sprint policy", "assignee": "Alice", "priority": "high"},
                {"task": "Schedule planning meeting", "assignee": "Bob", "priority": "medium"}
            ],
            "topics_discussed": [
                {"topic": "Roadmap", "duration_estimate": "10 min", "key_points": ["Launch", "Hiring"]}
            ],
            "follow_ups": [
                {"item": "Send minutes to team", "due": "Friday"}
            ]
        }
    }
    mongo_db.meeting_transcripts.insert_one(doc)
    yield mid
    mongo_db.meeting_transcripts.delete_one({"id": mid})


# ── 1. Meeting -> Sheet ──

class TestMeetingToSheet:
    def test_create_sheet_from_meeting(self, headers, mock_meeting_transcript, workspaces, mongo_db):
        ws_a = workspaces[0]["id"]
        r = requests.post(
            f"{BASE_URL}/api/sheets/from-meeting/{mock_meeting_transcript}",
            headers=headers,
            json={"workspace_id": ws_a},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        sheet = r.json()
        assert sheet["title"] == "TEST Strategy Sync - Summary"
        assert sheet["workspace_id"] == ws_a
        assert sheet["source_meeting_id"] == mock_meeting_transcript
        assert isinstance(sheet["data"], list) and len(sheet["data"]) == 1
        celldata = sheet["data"][0]["celldata"]
        # Check some expected headers/values present
        cell_values = [c["v"]["v"] for c in celldata if c.get("v")]
        assert "MEETING OVERVIEW" in cell_values
        assert "SUMMARY" in cell_values
        assert "KEY DECISIONS" in cell_values
        assert "ACTION ITEMS" in cell_values
        assert "TOPICS DISCUSSED" in cell_values
        assert "FOLLOW-UPS" in cell_values
        # cleanup
        mongo_db.sheets.delete_one({"id": sheet["id"]})

    def test_from_meeting_not_found(self, headers):
        r = requests.post(
            f"{BASE_URL}/api/sheets/from-meeting/nonexistent-meeting-xyz",
            headers=headers, json={}, timeout=15,
        )
        assert r.status_code == 404

    def test_from_meeting_requires_completed(self, headers, mongo_db, user_id):
        mid = f"TEST_meet_pending_{uuid.uuid4()}"
        mongo_db.meeting_transcripts.insert_one({
            "id": mid, "user_id": user_id, "title": "Pending",
            "status": "processing", "insights": {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            r = requests.post(f"{BASE_URL}/api/sheets/from-meeting/{mid}",
                              headers=headers, json={}, timeout=15)
            assert r.status_code == 400
        finally:
            mongo_db.meeting_transcripts.delete_one({"id": mid})


# ── 2. Sheet cross-workspace linking ──

class TestSheetCrossWorkspace:
    def test_sheet_link_unlink_and_list_includes_linked(self, headers, workspaces):
        ws_a, ws_b = workspaces[0]["id"], workspaces[1]["id"]
        # create a sheet in ws_a
        r = requests.post(f"{BASE_URL}/api/sheets", headers=headers,
                          json={"title": "TEST_xlink_sheet", "workspace_id": ws_a},
                          timeout=30)
        assert r.status_code in (200, 201), r.text
        sheet = r.json()
        sid = sheet["id"]

        try:
            # link to ws_b
            r2 = requests.post(f"{BASE_URL}/api/sheets/{sid}/link-workspace",
                               headers=headers, json={"workspace_id": ws_b},
                               timeout=15)
            assert r2.status_code == 200, r2.text
            assert r2.json()["status"] == "linked"

            # idempotent
            r3 = requests.post(f"{BASE_URL}/api/sheets/{sid}/link-workspace",
                               headers=headers, json={"workspace_id": ws_b}, timeout=15)
            assert r3.status_code == 200
            assert r3.json()["status"] == "already_linked"

            # list by ws_b includes the linked sheet
            r4 = requests.get(f"{BASE_URL}/api/sheets?workspace_id={ws_b}",
                              headers=headers, timeout=15)
            assert r4.status_code == 200
            ids = [s["id"] for s in r4.json()]
            assert sid in ids, f"linked sheet not present in ws_b list: {ids}"

            # list by ws_a still includes it (owner workspace)
            r5 = requests.get(f"{BASE_URL}/api/sheets?workspace_id={ws_a}",
                              headers=headers, timeout=15)
            assert r5.status_code == 200
            assert sid in [s["id"] for s in r5.json()]

            # unlink
            r6 = requests.delete(f"{BASE_URL}/api/sheets/{sid}/unlink-workspace/{ws_b}",
                                 headers=headers, timeout=15)
            assert r6.status_code == 200
            assert r6.json()["status"] == "unlinked"

            # verify removed from ws_b
            r7 = requests.get(f"{BASE_URL}/api/sheets?workspace_id={ws_b}",
                              headers=headers, timeout=15)
            assert sid not in [s["id"] for s in r7.json()]
        finally:
            requests.delete(f"{BASE_URL}/api/sheets/{sid}", headers=headers, timeout=15)

    def test_sheet_link_404(self, headers, workspaces):
        r = requests.post(f"{BASE_URL}/api/sheets/nonexistent-sheet/link-workspace",
                          headers=headers, json={"workspace_id": workspaces[0]["id"]},
                          timeout=15)
        assert r.status_code == 404


# ── 3. Document cross-workspace linking ──

class TestDocumentCrossWorkspace:
    def test_doc_link_unlink_and_list(self, headers, workspaces):
        ws_a, ws_b = workspaces[0]["id"], workspaces[1]["id"]
        r = requests.post(f"{BASE_URL}/api/documents", headers=headers,
                          json={"title": "TEST_xlink_doc", "workspace_id": ws_a,
                                "content": "<p>hi</p>"}, timeout=30)
        assert r.status_code in (200, 201), r.text
        doc = r.json()
        did = doc["id"]
        try:
            r2 = requests.post(f"{BASE_URL}/api/documents/{did}/link-workspace",
                               headers=headers, json={"workspace_id": ws_b}, timeout=15)
            assert r2.status_code == 200, r2.text
            assert r2.json()["status"] == "linked"

            r3 = requests.get(f"{BASE_URL}/api/documents?workspace_id={ws_b}",
                              headers=headers, timeout=15)
            assert r3.status_code == 200
            assert did in [d["id"] for d in r3.json()]

            r4 = requests.delete(f"{BASE_URL}/api/documents/{did}/unlink-workspace/{ws_b}",
                                 headers=headers, timeout=15)
            assert r4.status_code == 200

            r5 = requests.get(f"{BASE_URL}/api/documents?workspace_id={ws_b}",
                              headers=headers, timeout=15)
            assert did not in [d["id"] for d in r5.json()]
        finally:
            requests.delete(f"{BASE_URL}/api/documents/{did}", headers=headers, timeout=15)

    def test_doc_link_400_missing_workspace(self, headers):
        r = requests.post(f"{BASE_URL}/api/documents/some/link-workspace",
                          headers=headers, json={}, timeout=15)
        assert r.status_code == 400


# ── 4. Presentation cross-workspace linking ──

class TestPresentationCrossWorkspace:
    def test_pres_link_unlink_and_list(self, headers, workspaces):
        ws_a, ws_b = workspaces[0]["id"], workspaces[1]["id"]
        r = requests.post(f"{BASE_URL}/api/presentations", headers=headers,
                          json={"title": "TEST_xlink_pres", "workspace_id": ws_a},
                          timeout=30)
        assert r.status_code in (200, 201), r.text
        pres = r.json()
        pid = pres["id"]
        try:
            r2 = requests.post(f"{BASE_URL}/api/presentations/{pid}/link-workspace",
                               headers=headers, json={"workspace_id": ws_b}, timeout=15)
            assert r2.status_code == 200, r2.text
            assert r2.json()["status"] == "linked"

            r3 = requests.get(f"{BASE_URL}/api/presentations?workspace_id={ws_b}",
                              headers=headers, timeout=15)
            assert r3.status_code == 200
            assert pid in [p["id"] for p in r3.json()]

            r4 = requests.delete(f"{BASE_URL}/api/presentations/{pid}/unlink-workspace/{ws_b}",
                                 headers=headers, timeout=15)
            assert r4.status_code == 200
        finally:
            requests.delete(f"{BASE_URL}/api/presentations/{pid}", headers=headers, timeout=15)

    def test_pres_link_400_missing_workspace(self, headers):
        r = requests.post(f"{BASE_URL}/api/presentations/some/link-workspace",
                          headers=headers, json={}, timeout=15)
        assert r.status_code == 400


# ── 5. Auth required ──

class TestAuth:
    def test_link_requires_auth(self):
        r = requests.post(f"{BASE_URL}/api/sheets/x/link-workspace", json={"workspace_id": "y"}, timeout=15)
        assert r.status_code == 401
        r = requests.post(f"{BASE_URL}/api/documents/x/link-workspace", json={"workspace_id": "y"}, timeout=15)
        assert r.status_code == 401
        r = requests.post(f"{BASE_URL}/api/presentations/x/link-workspace", json={"workspace_id": "y"}, timeout=15)
        assert r.status_code == 401
