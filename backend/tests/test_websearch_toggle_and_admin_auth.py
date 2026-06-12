"""
Tests for the 3 iteration-140 fixes:
1. Admin auth guard on GET/PUT /api/admin/search-api (401/403)
2. Web search toggle (web_search=false) suppresses 'Searching the web...' status
3. Web search toggle (web_search=true) emits 'Searching the web...' status on a current-events query
"""
import os
import json
import time
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
USER_EMAIL = "chattest@munal.ai"
USER_PASSWORD = "Test@12345"


@pytest.fixture(scope="module")
def user_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": USER_EMAIL, "password": USER_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    return data.get("access_token") or data.get("token")


@pytest.fixture(scope="module")
def user_headers(user_token):
    return {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}


# ── Admin Auth Guard ──

class TestAdminAuthGuard:
    def test_unauth_get_search_api_returns_401(self):
        r = requests.get(f"{BASE_URL}/api/admin/search-api", timeout=15)
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_unauth_put_search_api_returns_401(self):
        r = requests.put(
            f"{BASE_URL}/api/admin/search-api",
            json={"provider": "duckduckgo", "api_key": ""},
            timeout=15,
        )
        assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}: {r.text}"

    def test_nonadmin_get_search_api_returns_403(self, user_headers):
        r = requests.get(f"{BASE_URL}/api/admin/search-api", headers=user_headers, timeout=15)
        assert r.status_code == 403, f"Expected 403 for non-admin, got {r.status_code}: {r.text}"

    def test_nonadmin_put_search_api_returns_403(self, user_headers):
        r = requests.put(
            f"{BASE_URL}/api/admin/search-api",
            headers=user_headers,
            json={"provider": "duckduckgo", "api_key": ""},
            timeout=15,
        )
        assert r.status_code == 403, f"Expected 403 for non-admin, got {r.status_code}: {r.text}"


# ── Web Search Toggle (flag in send-message body) ──

def _create_conversation(headers):
    r = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers, timeout=15)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _send_and_collect_events(conv_id, headers, content, web_search, timeout=30):
    """Send a message and return list of parsed SSE events."""
    url = f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages"
    events = []
    with requests.post(
        url,
        headers=headers,
        json={"content": content, "attachments": [], "web_search": web_search},
        stream=True,
        timeout=timeout,
    ) as resp:
        assert resp.status_code == 200, f"Stream failed: {resp.status_code} {resp.text}"
        start = time.time()
        for line in resp.iter_lines(decode_unicode=True):
            if not line:
                continue
            if line.startswith("data: "):
                try:
                    ev = json.loads(line[6:])
                    events.append(ev)
                    if ev.get("type") == "done":
                        break
                except json.JSONDecodeError:
                    pass
            if time.time() - start > timeout:
                break
    return events


class TestWebSearchToggle:
    def test_web_search_false_no_search_status(self, user_headers):
        conv_id = _create_conversation(user_headers)
        events = _send_and_collect_events(
            conv_id,
            user_headers,
            content="What is the latest news on AI today?",
            web_search=False,
            timeout=45,
        )
        statuses = [e.get("content", "") for e in events if e.get("type") == "status"]
        searching = [s for s in statuses if "Searching the web" in s]
        assert not searching, f"Expected NO 'Searching the web...' status when web_search=false, got: {statuses}"
        done = [e for e in events if e.get("type") == "done"]
        assert done, "No done event received"
        # Ensure no sources field returned
        assert not done[0].get("sources"), f"Expected no sources when web_search=false, got: {done[0].get('sources')}"

    def test_web_search_true_emits_search_status(self, user_headers):
        conv_id = _create_conversation(user_headers)
        events = _send_and_collect_events(
            conv_id,
            user_headers,
            content="What is the latest news today about AI? Search the web.",
            web_search=True,
            timeout=60,
        )
        statuses = [e.get("content", "") for e in events if e.get("type") == "status"]
        searching = [s for s in statuses if "Searching the web" in s]
        # We assert that EITHER searching happened OR the LLM didn't trigger it (flaky model behaviour)
        # Per problem statement we expect it to fire. Mark flaky if not.
        assert searching, f"Expected 'Searching the web...' status when web_search=true, got statuses={statuses}"
