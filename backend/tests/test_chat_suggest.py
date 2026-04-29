"""Tests for the unsupported-template short-circuit. Picker may surface
an unsupported slug; the backend returns a deterministic suggest reply
without calling the LLM."""

from __future__ import annotations

from .test_chat import _signup, _stub_completion


def _suggest_request(slug: str) -> dict:
    return {
        "templateSlug": slug,
        "messages": [{"role": "user", "content": "draft this"}],
        "currentFields": {},
    }


def test_unsupported_known_slug_returns_suggest(client, monkeypatch):
    captured = _stub_completion(monkeypatch)
    _signup(client)

    res = client.post("/api/chat", json=_suggest_request("baa"))
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["mode"] == "suggest"
    assert body["suggestedSlug"] == "mutual-nda"
    assert body["fieldsPatch"] is None
    assert "Business Associate Agreement" in body["reply"]
    # No LLM call should be made for unsupported slugs.
    assert "kwargs" not in captured


def test_unknown_slug_returns_suggest(client, monkeypatch):
    captured = _stub_completion(monkeypatch)
    _signup(client)

    res = client.post("/api/chat", json=_suggest_request("nonexistent-template"))
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["mode"] == "suggest"
    assert body["suggestedSlug"] == "mutual-nda"
    assert "kwargs" not in captured


def test_suggest_requires_auth(client, monkeypatch):
    _stub_completion(monkeypatch)
    res = client.post("/api/chat", json=_suggest_request("baa"))
    assert res.status_code == 401
