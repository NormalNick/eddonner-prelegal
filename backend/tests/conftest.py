"""Test fixtures: each test gets a fresh SQLite file in a tmp dir."""

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch) -> Iterator[TestClient]:
    monkeypatch.setenv("DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("WIPE_DB", "true")
    monkeypatch.setenv("SECRET_KEY", "test-secret")

    # Reload modules so settings pick up the patched env vars.
    import importlib

    from app import config as config_module
    importlib.reload(config_module)
    from app import db as db_module
    importlib.reload(db_module)
    from app.auth import sessions as sessions_module
    importlib.reload(sessions_module)
    from app.auth import router as auth_router_module
    importlib.reload(auth_router_module)
    from app import main as main_module
    importlib.reload(main_module)

    with TestClient(main_module.app) as c:
        yield c
