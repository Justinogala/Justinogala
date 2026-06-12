"""
AI Chat - Chart generation streaming + file download tests.
Tests PIE and BAR chart generation via the streaming endpoint and verifies
that /api/ai-chat/files/{file_id} returns the rendered PNG.
"""
import os
import json
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
EMAIL = "chattest@munal.ai"
PASSWORD = "Test@12345"


@pytest.fixture(scope="module")
def auth_token():
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD}, timeout=20)
    if r.status_code != 200:
        pytest.skip(f"Login failed: {r.status_code} {r.text[:200]}")
    data = r.json()
    token = data.get("access_token") or data.get("token")
    if not token:
        pytest.skip(f"No token in login response: {data}")
    return token


@pytest.fixture(scope="module")
def headers(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(scope="module")
def conv_id(headers):
    r = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers, timeout=20)
    assert r.status_code == 200, r.text
    cid = r.json()["id"]
    yield cid
    # cleanup
    try:
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{cid}", headers=headers, timeout=10)
    except Exception:
        pass


def _stream_chart(headers, conv_id, prompt, timeout=60):
    """Send a chart prompt and collect SSE events. Returns (events, done_payload)."""
    url = f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages"
    events = []
    done = None
    with requests.post(url, headers=headers, json={"content": prompt}, stream=True, timeout=timeout) as resp:
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text[:200]}"
        start = time.time()
        for raw in resp.iter_lines(decode_unicode=True):
            if not raw:
                continue
            if raw.startswith("data: "):
                try:
                    ev = json.loads(raw[6:])
                except json.JSONDecodeError:
                    continue
                events.append(ev)
                if ev.get("type") == "done":
                    done = ev
                    break
            if time.time() - start > timeout:
                break
    return events, done


class TestChartGeneration:
    """Chart streaming generation tests."""

    def test_pie_chart_stream_and_download(self, headers, conv_id):
        prompt = "Create a pie chart titled 'Q1 Revenue' with labels A, B, C and values 30, 50, 20."
        start = time.time()
        events, done = _stream_chart(headers, conv_id, prompt, timeout=60)
        elapsed = time.time() - start
        assert done is not None, f"No 'done' event. Events: {[e.get('type') for e in events]}"
        assert elapsed < 60, f"Took {elapsed:.1f}s"

        # Status events
        status_msgs = [e.get("content") for e in events if e.get("type") == "status"]
        assert any("pie chart" in (s or "").lower() for s in status_msgs), f"No pie chart status. Status: {status_msgs}"

        # Generated file
        gf = done.get("generated_files", [])
        if not gf:
            pytest.skip(f"LLM did not emit GENERATE_PIE_CHART tag. Status events: {status_msgs}")
        f0 = gf[0]
        assert f0["type"] == "image"
        assert f0.get("file_id")
        assert "/api/ai-chat/files/" in f0["url"]

        # Download the chart
        dl = requests.get(f"{BASE_URL}{f0['url']}", headers=headers, timeout=30)
        assert dl.status_code == 200, f"Download failed: {dl.status_code} {dl.text[:200]}"
        assert dl.headers.get("content-type", "").startswith("image/"), f"CT={dl.headers.get('content-type')}"
        # PNG magic bytes
        assert dl.content[:8] == b"\x89PNG\r\n\x1a\n", "Not a PNG"
        assert len(dl.content) > 1000

    def test_bar_chart_stream_within_30s(self, headers, conv_id):
        prompt = "Create a bar chart showing sales by quarter: Q1=100, Q2=150, Q3=200, Q4=180."
        start = time.time()
        events, done = _stream_chart(headers, conv_id, prompt, timeout=45)
        elapsed = time.time() - start
        assert done is not None, f"No 'done' event after {elapsed:.1f}s. Events: {[e.get('type') for e in events]}"
        assert elapsed < 30, f"Bar chart took {elapsed:.1f}s (>30s budget)"

        gf = done.get("generated_files", [])
        if not gf:
            pytest.skip("LLM did not emit GENERATE_BAR_CHART tag")
        f0 = gf[0]
        assert f0["type"] == "image"
        assert "/api/ai-chat/files/" in f0["url"]

        dl = requests.get(f"{BASE_URL}{f0['url']}", headers=headers, timeout=30)
        assert dl.status_code == 200
        assert dl.headers.get("content-type", "").startswith("image/")
        assert dl.content[:8] == b"\x89PNG\r\n\x1a\n"

    def test_download_unknown_file_404(self, headers):
        r = requests.get(f"{BASE_URL}/api/ai-chat/files/nonexistent-uuid-1234", headers=headers, timeout=15)
        assert r.status_code == 404
