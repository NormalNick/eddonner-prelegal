"""SQLite connection and schema initialization.

We use the stdlib ``sqlite3`` module directly. The schema is small enough
that an ORM would be overhead. Each request gets its own connection via
:func:`get_db`.
"""

from __future__ import annotations

import sqlite3
from collections.abc import Iterator

from .config import settings

SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def _connect() -> sqlite3.Connection:
    conn = sqlite3.connect(settings.db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    """Wipe the DB file when configured, then create tables if missing."""
    path = settings.db_path
    if settings.wipe_db and path.exists():
        path.unlink()
    path.parent.mkdir(parents=True, exist_ok=True)
    with _connect() as conn:
        conn.executescript(SCHEMA)


def get_db() -> Iterator[sqlite3.Connection]:
    """FastAPI dependency: yields a connection per request."""
    conn = _connect()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
