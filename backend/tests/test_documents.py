"""Document CRUD endpoint tests."""

from __future__ import annotations

ALICE = {"email": "alice@example.com", "password": "passw0rd!alice"}
BOB = {"email": "bob@example.com", "password": "passw0rd!bob"}


def _signup(client, creds: dict[str, str]) -> None:
    res = client.post("/api/auth/signup", json=creds)
    assert res.status_code == 201, res.text


def _login(client, creds: dict[str, str]) -> None:
    res = client.post("/api/auth/login", json=creds)
    assert res.status_code == 200, res.text


def _doc_payload(title: str = "My NDA") -> dict:
    return {
        "templateSlug": "mutual-nda",
        "title": title,
        "fields": {"purpose": "Evaluating a partnership.", "ndaTermYears": 1},
        "messages": [
            {"role": "assistant", "content": "Hi! What's the purpose?"},
            {"role": "user", "content": "Evaluating a partnership."},
        ],
    }


def test_list_requires_auth(client):
    res = client.get("/api/documents")
    assert res.status_code == 401


def test_create_requires_auth(client):
    res = client.post("/api/documents", json=_doc_payload())
    assert res.status_code == 401


def test_create_returns_detail(client):
    _signup(client, ALICE)
    res = client.post("/api/documents", json=_doc_payload())
    assert res.status_code == 201, res.text
    body = res.json()
    assert isinstance(body["id"], int)
    assert body["templateSlug"] == "mutual-nda"
    assert body["title"] == "My NDA"
    assert body["fields"]["purpose"] == "Evaluating a partnership."
    assert len(body["messages"]) == 2
    assert body["messages"][1]["role"] == "user"


def test_list_returns_user_documents_newest_first(client):
    _signup(client, ALICE)
    first = client.post("/api/documents", json=_doc_payload("Doc one")).json()
    second = client.post("/api/documents", json=_doc_payload("Doc two")).json()

    res = client.get("/api/documents")
    assert res.status_code == 200
    body = res.json()
    assert [d["id"] for d in body] == [second["id"], first["id"]]
    # Summary shape: no fields/messages payload
    assert "fields" not in body[0]
    assert "messages" not in body[0]


def test_get_returns_full_detail(client):
    _signup(client, ALICE)
    created = client.post("/api/documents", json=_doc_payload()).json()

    res = client.get(f"/api/documents/{created['id']}")
    assert res.status_code == 200
    body = res.json()
    assert body["id"] == created["id"]
    assert body["fields"]["purpose"] == "Evaluating a partnership."
    assert body["messages"][0]["content"] == "Hi! What's the purpose?"


def test_update_replaces_title_fields_and_messages(client):
    _signup(client, ALICE)
    created = client.post("/api/documents", json=_doc_payload()).json()

    update = {
        "title": "Renamed",
        "fields": {"purpose": "Evaluating an acquisition."},
        "messages": [
            {"role": "assistant", "content": "Hi!"},
            {"role": "user", "content": "Updated."},
        ],
    }
    res = client.put(f"/api/documents/{created['id']}", json=update)
    assert res.status_code == 200
    body = res.json()
    assert body["title"] == "Renamed"
    assert body["fields"] == {"purpose": "Evaluating an acquisition."}
    assert body["messages"][1]["content"] == "Updated."


def test_delete_removes_document(client):
    _signup(client, ALICE)
    created = client.post("/api/documents", json=_doc_payload()).json()

    res = client.delete(f"/api/documents/{created['id']}")
    assert res.status_code == 204

    follow_up = client.get(f"/api/documents/{created['id']}")
    assert follow_up.status_code == 404


def test_get_returns_404_for_unknown_id(client):
    _signup(client, ALICE)
    res = client.get("/api/documents/99999")
    assert res.status_code == 404


def test_users_cannot_access_other_users_documents(client):
    _signup(client, ALICE)
    alice_doc = client.post("/api/documents", json=_doc_payload("Alice")).json()

    client.post("/api/auth/logout")
    client.cookies.clear()
    _signup(client, BOB)

    # Bob cannot read Alice's doc.
    res = client.get(f"/api/documents/{alice_doc['id']}")
    assert res.status_code == 404

    # Bob cannot update Alice's doc.
    res = client.put(
        f"/api/documents/{alice_doc['id']}",
        json={
            "title": "Hijacked",
            "fields": {},
            "messages": [],
        },
    )
    assert res.status_code == 404

    # Bob cannot delete Alice's doc.
    res = client.delete(f"/api/documents/{alice_doc['id']}")
    assert res.status_code == 404

    # Bob's list is empty.
    res = client.get("/api/documents")
    assert res.json() == []

    # Alice's doc is still there for Alice.
    client.post("/api/auth/logout")
    client.cookies.clear()
    _login(client, ALICE)
    res = client.get(f"/api/documents/{alice_doc['id']}")
    assert res.status_code == 200
    assert res.json()["title"] == "Alice"
