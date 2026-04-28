"""Chat endpoint tests. The litellm.completion call is monkeypatched so
tests never hit the network or require an API key."""

from __future__ import annotations

from types import SimpleNamespace


def _fake_completion_response(content: str):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


CANNED_REPLY = (
    '{"reply": "Got it, the purpose is set. Who are the two parties?",'
    ' "fieldsPatch": {"purpose": "Evaluating a partnership."}}'
)


def _stub_completion(monkeypatch, content: str = CANNED_REPLY):
    captured: dict = {}

    def fake(**kwargs):
        captured["kwargs"] = kwargs
        return _fake_completion_response(content)

    import app.chat.router as chat_router_module

    monkeypatch.setattr(chat_router_module, "completion", fake)
    return captured


def _empty_request_body() -> dict:
    return {
        "messages": [{"role": "user", "content": "Help me draft an NDA."}],
        "currentFields": {
            "purpose": "",
            "effectiveDate": "",
            "ndaTermKind": "years",
            "ndaTermYears": 1,
            "confidentialityKind": "years",
            "confidentialityYears": 1,
            "governingLawState": "",
            "jurisdiction": "",
            "modifications": "",
            "party1": {
                "company": "",
                "printName": "",
                "title": "",
                "noticeAddress": "",
            },
            "party2": {
                "company": "",
                "printName": "",
                "title": "",
                "noticeAddress": "",
            },
        },
    }


def _signup(client, email: str = "alice@example.com", password: str = "passw0rd!") -> None:
    res = client.post("/api/auth/signup", json={"email": email, "password": password})
    assert res.status_code == 201, res.text


def test_chat_requires_auth(client, monkeypatch):
    _stub_completion(monkeypatch)
    res = client.post("/api/chat", json=_empty_request_body())
    assert res.status_code == 401


def test_chat_returns_reply_and_patch(client, monkeypatch):
    captured = _stub_completion(monkeypatch)
    _signup(client)

    res = client.post("/api/chat", json=_empty_request_body())
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["reply"].startswith("Got it")
    assert body["fieldsPatch"]["purpose"] == "Evaluating a partnership."
    assert body["fieldsPatch"]["effectiveDate"] is None

    kwargs = captured["kwargs"]
    assert kwargs["model"] == "openrouter/openai/gpt-oss-120b"
    assert kwargs["extra_body"] == {"provider": {"order": ["cerebras"]}}
    assert kwargs["messages"][0]["role"] == "system"
    assert kwargs["messages"][-1]["content"] == "Help me draft an NDA."
