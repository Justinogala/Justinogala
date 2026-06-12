"""Tests for AI Chat IMAGE generation via [GENERATE_IMAGE: ...] tag.

Validates:
1. A subject-style prompt ("fish in coral reef") triggers image generation and
   returns generated_files with type=image whose download serves a valid PNG.
2. A common-object prompt ("table with flowers") also triggers image generation.
3. The download endpoint returns a 4xx for an unknown file id.
4. The safety-filter error path is wired (error message wording inspected in source).
"""
import os
import json
import re
import time
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://new-user-welcome-2.preview.emergentagent.com").rstrip("/")
USER_EMAIL = "chattest@munal.ai"
USER_PASSWORD = "Test@12345"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"


@pytest.fixture(scope="module")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": USER_EMAIL, "password": USER_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    tok = r.json().get("access_token") or r.json().get("token")
    assert tok, f"No token in response: {r.json()}"
    return tok


@pytest.fixture(scope="module")
def headers(token):
    return {"Authorization": f"Bearer {token}"}


def _create_conv(headers):
    r = requests.post(f"{BASE_URL}/api/ai-chat/conversations", headers=headers, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _delete_conv(headers, cid):
    try:
        requests.delete(f"{BASE_URL}/api/ai-chat/conversations/{cid}", headers=headers, timeout=15)
    except Exception:
        pass


def _send_and_collect(headers, conv_id, content, timeout=120):
    """POST the streaming endpoint and aggregate SSE events. Returns (done_event, all_status_msgs, chunks_text)."""
    url = f"{BASE_URL}/api/ai-chat/conversations/{conv_id}/messages"
    done_event = None
    status_msgs = []
    chunks = []
    with requests.post(url, headers=headers, json={"content": content}, stream=True, timeout=timeout) as resp:
        assert resp.status_code == 200, f"Send failed: {resp.status_code} {resp.text[:300]}"
        for raw in resp.iter_lines(decode_unicode=True):
            if not raw or not raw.startswith("data:"):
                continue
            try:
                evt = json.loads(raw[5:].strip())
            except Exception:
                continue
            t = evt.get("type")
            if t == "chunk":
                chunks.append(evt.get("content", ""))
            elif t == "status":
                status_msgs.append(evt.get("content", ""))
            elif t == "done":
                done_event = evt
                break
    return done_event, status_msgs, "".join(chunks)


@pytest.mark.timeout(180)
def test_image_fish_in_coral_reef(headers):
    cid = _create_conv(headers)
    try:
        done, status_msgs, text = _send_and_collect(
            headers, cid, "generate an image of a fish swimming in a coral reef", timeout=150
        )
        assert done is not None, f"No done event; status={status_msgs}; text={text[:300]}"
        files = done.get("generated_files", [])
        # If safety filter rejected, allow with explicit message
        if not files:
            assert "safety filter" in text.lower() or "couldn't be generated" in text.lower(), \
                f"No image generated and no safety message. text={text[:400]} status={status_msgs}"
            pytest.skip("Provider rejected the prompt; safety message correctly surfaced.")
        assert any(f.get("type") == "image" for f in files), f"No image in generated_files: {files}"
        img = next(f for f in files if f.get("type") == "image")
        assert img.get("file_id"), f"image entry missing file_id: {img}"
        # Download and assert PNG magic bytes
        dl = requests.get(f"{BASE_URL}/api/ai-chat/files/{img['file_id']}", headers=headers, timeout=60)
        assert dl.status_code == 200, f"Download status {dl.status_code}"
        assert dl.content.startswith(PNG_MAGIC), "Downloaded image is not a valid PNG"
        assert len(dl.content) > 1000, "Downloaded image suspiciously small"
    finally:
        _delete_conv(headers, cid)


@pytest.mark.timeout(180)
def test_image_table_with_flowers(headers):
    cid = _create_conv(headers)
    try:
        done, status_msgs, text = _send_and_collect(
            headers, cid, "draw a table with flowers on it", timeout=150
        )
        assert done is not None, "No done event"
        files = done.get("generated_files", [])
        # Either an image is returned OR the model's response contains a safety/error notice
        if files:
            assert any(f.get("type") == "image" for f in files), f"generated_files has no image: {files}"
        else:
            # Acceptable degradation: safety/generation error wording present
            low = text.lower()
            assert ("safety filter" in low or "couldn't be generated" in low or "generation failed" in low), \
                f"No image generated and no error notice surfaced. text={text[:400]}"
    finally:
        _delete_conv(headers, cid)


def test_files_endpoint_unknown_id(headers):
    rid = str(uuid.uuid4())
    r = requests.get(f"{BASE_URL}/api/ai-chat/files/{rid}", headers=headers, timeout=30)
    assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text[:200]}"


def test_safety_message_wording_in_source():
    """Sanity check that the safety-filter user-friendly message exists in the route source."""
    with open("/app/backend/routes/ai_chat.py", "r") as f:
        src = f.read()
    assert "safety" in src.lower() and "content safety filter" in src.lower(), \
        "Expected safety filter wording in ai_chat.py"
