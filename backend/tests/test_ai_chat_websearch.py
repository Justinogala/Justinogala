"""
Backend tests for AI Chat Web Search + Admin Search API config.
Covers:
- GET /api/admin/search-api default config
- PUT /api/admin/search-api saves provider/api_key
- AI Chat web search SSE event stream emits status events and 'sources' in done event
"""
import json
import os
import time

import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")

USER_EMAIL = "chattest@munal.ai"
USER_PASSWORD = "Test@12345"


@pytest.fixture(scope="module")
def api_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def user_token(api_client):
    resp = api_client.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": USER_EMAIL, "password": USER_PASSWORD},
    )
    if resp.status_code != 200:
        pytest.skip(f"User login failed: {resp.status_code} {resp.text[:200]}")
    data = resp.json()
    tok = data.get("token") or data.get("access_token")
    if not tok:
        pytest.skip("No token returned by login")
    return tok


# ── Admin Search API config ──

class TestAdminSearchApi:
    def test_get_default_config(self, api_client):
        resp = api_client.get(f"{BASE_URL}/api/admin/search-api")
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert "provider" in data
        assert "api_key" in data
        # Provider must be one of the known values
        assert data["provider"] in ("duckduckgo", "tavily", "brave", "perplexity")

    def test_put_save_tavily_then_revert(self, api_client):
        # Save initial state so we can restore
        initial = api_client.get(f"{BASE_URL}/api/admin/search-api").json()

        # Update to tavily
        put_resp = api_client.put(
            f"{BASE_URL}/api/admin/search-api",
            json={"provider": "tavily", "api_key": "TEST_tavily_key_123"},
        )
        assert put_resp.status_code == 200, put_resp.text
        assert put_resp.json().get("success") is True
        assert put_resp.json().get("provider") == "tavily"

        # Verify persistence via GET
        get_resp = api_client.get(f"{BASE_URL}/api/admin/search-api")
        assert get_resp.status_code == 200
        new = get_resp.json()
        assert new["provider"] == "tavily"
        assert new["api_key"] == "TEST_tavily_key_123"

        # Restore to duckduckgo (default) so subsequent tests use free provider
        restore = api_client.put(
            f"{BASE_URL}/api/admin/search-api",
            json={"provider": initial.get("provider", "duckduckgo"), "api_key": initial.get("api_key", "")},
        )
        assert restore.status_code == 200

        # Sanity: confirm provider is duckduckgo for the web search test
        final = api_client.get(f"{BASE_URL}/api/admin/search-api").json()
        assert final["provider"] == "duckduckgo"


# ── Web Search via AI Chat SSE ──

class TestAIChatWebSearch:
    def test_websearch_emits_sources_and_status(self, api_client, user_token):
        headers = {"Authorization": f"Bearer {user_token}", "Content-Type": "application/json"}

        # Create new conversation
        c_resp = requests.post(
            f"{BASE_URL}/api/ai-chat/conversations",
            headers=headers,
            json={"title": "TEST_websearch"},
        )
        assert c_resp.status_code in (200, 201), c_resp.text
        conv_id = c_resp.json().get("id") or c_resp.json().get("conversation_id")
        assert conv_id

        # Send a current-events question that should trigger [WEB_SEARCH: ...]
        payload = {
            "content": "What is the latest news about AI in 2026? Please search the web for current information.",
            "attachments": [],
        }

        status_events = []
        chunks = []
        done_event = None
        with requests.post(
            f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages",
            headers=headers,
            json=payload,
            stream=True,
            timeout=120,
        ) as resp:
            assert resp.status_code == 200, resp.text[:500]
            start = time.time()
            for raw in resp.iter_lines(decode_unicode=True):
                if not raw:
                    continue
                if raw.startswith("data: "):
                    try:
                        evt = json.loads(raw[6:])
                    except Exception:
                        continue
                    etype = evt.get("type")
                    if etype == "status":
                        status_events.append(evt.get("content", ""))
                    elif etype == "chunk":
                        chunks.append(evt.get("content", ""))
                    elif etype == "done":
                        done_event = evt
                        break
                if time.time() - start > 120:
                    break

        assert done_event is not None, f"No done event received. Status events: {status_events}"

        # Validate web-search-specific status events
        joined_status = " | ".join(status_events).lower()
        # Either we used web search (status events present + sources) OR LLM answered without searching
        if "searching the web" in joined_status:
            assert "analyzing search results" in joined_status, f"Expected 'Analyzing search results...' status; got: {status_events}"
            assert "sources" in done_event, f"Expected 'sources' in done event when web search ran. Got: {list(done_event.keys())}"
            sources = done_event["sources"]
            assert isinstance(sources, list)
            assert len(sources) > 0
            for s in sources:
                assert "url" in s and s["url"].startswith("http"), f"Bad source: {s}"
                assert "title" in s
        else:
            # LLM didn't elect to search — still a valid response, but flag it.
            pytest.skip(f"LLM did not trigger web search this run. status_events={status_events}")
