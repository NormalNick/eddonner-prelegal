"""AI Addendum chat endpoint tests."""

from __future__ import annotations

from .test_chat import _signup, _stub_completion


CANNED_AI_ADDENDUM_REPLY = (
    '{"mode": "draft",'
    ' "reply": "Got it, training is permitted on deidentified inputs.",'
    ' "fieldsPatch": {"trainingData": "Deidentified inputs only.",'
    '                  "trainingPurposes": "Improving the AI System."},'
    ' "suggestedSlug": null}'
)


def _empty_ai_addendum_fields() -> dict:
    return {
        "customer": "",
        "provider": "",
        "effectiveDate": "",
        "parentAgreement": "",
        "trainingData": "",
        "trainingPurposes": "",
        "trainingRestrictions": "",
        "improvementRestrictions": "",
    }


def _ai_addendum_request_body() -> dict:
    return {
        "templateSlug": "ai-addendum",
        "messages": [{"role": "user", "content": "Draft an AI addendum."}],
        "currentFields": _empty_ai_addendum_fields(),
    }


def test_ai_addendum_returns_reply_and_patch(client, monkeypatch):
    captured = _stub_completion(monkeypatch, CANNED_AI_ADDENDUM_REPLY)
    _signup(client)

    res = client.post("/api/chat", json=_ai_addendum_request_body())
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["mode"] == "draft"
    assert body["fieldsPatch"]["trainingData"] == "Deidentified inputs only."
    assert body["fieldsPatch"]["trainingPurposes"] == "Improving the AI System."
    # Patch keys not mentioned by the model are returned as null.
    assert body["fieldsPatch"]["customer"] is None

    kwargs = captured["kwargs"]
    # Confirm the AI Addendum prompt drove this call, not the NDA prompt.
    assert "AI Addendum" in kwargs["messages"][0]["content"]


def test_ai_addendum_requires_auth(client, monkeypatch):
    _stub_completion(monkeypatch, CANNED_AI_ADDENDUM_REPLY)
    res = client.post("/api/chat", json=_ai_addendum_request_body())
    assert res.status_code == 401
