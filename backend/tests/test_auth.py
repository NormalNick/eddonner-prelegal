CREDS = {"email": "user@example.com", "password": "hunter2-very-secret"}


def test_signup_creates_user_and_session(client):
    r = client.post("/api/auth/signup", json=CREDS)
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == CREDS["email"]
    assert isinstance(body["id"], int)
    assert "session" in r.cookies


def test_signup_duplicate_email_returns_409(client):
    client.post("/api/auth/signup", json=CREDS)
    r = client.post("/api/auth/signup", json=CREDS)
    assert r.status_code == 409


def test_login_with_correct_password(client):
    client.post("/api/auth/signup", json=CREDS)
    client.cookies.clear()
    r = client.post("/api/auth/login", json=CREDS)
    assert r.status_code == 200
    assert r.json()["email"] == CREDS["email"]
    assert "session" in r.cookies


def test_login_with_wrong_password(client):
    client.post("/api/auth/signup", json=CREDS)
    client.cookies.clear()
    r = client.post("/api/auth/login", json={**CREDS, "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_email(client):
    r = client.post("/api/auth/login", json=CREDS)
    assert r.status_code == 401


def test_me_without_cookie_returns_401(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_with_cookie_returns_user(client):
    client.post("/api/auth/signup", json=CREDS)
    r = client.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == CREDS["email"]


def test_logout_clears_session(client):
    client.post("/api/auth/signup", json=CREDS)
    r = client.post("/api/auth/logout")
    assert r.status_code == 204
    r2 = client.get("/api/auth/me")
    assert r2.status_code == 401


def test_email_is_lowercased(client):
    r = client.post(
        "/api/auth/signup",
        json={"email": "MIXED@Example.com", "password": CREDS["password"]},
    )
    assert r.status_code == 201
    assert r.json()["email"] == "mixed@example.com"
    client.cookies.clear()
    r2 = client.post(
        "/api/auth/login",
        json={"email": "mixed@EXAMPLE.com", "password": CREDS["password"]},
    )
    assert r2.status_code == 200
