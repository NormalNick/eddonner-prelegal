"""SQLite operations for the documents table.

Every query is keyed by both `id` and `user_id`, so cross-user reads/writes
naturally return None / 0-row updates without leaking which IDs exist for
other users.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any

from .schemas import DocumentMessage


def _row_to_summary(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": int(row["id"]),
        "templateSlug": row["template_slug"],
        "title": row["title"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def _row_to_detail(row: sqlite3.Row) -> dict[str, Any]:
    summary = _row_to_summary(row)
    summary["fields"] = json.loads(row["fields_json"])
    summary["messages"] = json.loads(row["messages_json"])
    return summary


def list_for_user(db: sqlite3.Connection, user_id: int) -> list[dict[str, Any]]:
    rows = db.execute(
        """
        SELECT id, template_slug, title, created_at, updated_at
        FROM documents
        WHERE user_id = ?
        ORDER BY updated_at DESC, id DESC
        """,
        (user_id,),
    ).fetchall()
    return [_row_to_summary(r) for r in rows]


def get_for_user(
    db: sqlite3.Connection, user_id: int, doc_id: int
) -> dict[str, Any] | None:
    row = db.execute(
        """
        SELECT id, template_slug, title, fields_json, messages_json,
               created_at, updated_at
        FROM documents
        WHERE id = ? AND user_id = ?
        """,
        (doc_id, user_id),
    ).fetchone()
    return _row_to_detail(row) if row is not None else None


def create_for_user(
    db: sqlite3.Connection,
    user_id: int,
    template_slug: str,
    title: str,
    fields: dict[str, Any],
    messages: list[DocumentMessage],
) -> dict[str, Any]:
    cursor = db.execute(
        """
        INSERT INTO documents (user_id, template_slug, title, fields_json, messages_json)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            user_id,
            template_slug,
            title,
            json.dumps(fields),
            json.dumps([m.model_dump() for m in messages]),
        ),
    )
    doc_id = int(cursor.lastrowid)
    detail = get_for_user(db, user_id, doc_id)
    assert detail is not None
    return detail


def update_for_user(
    db: sqlite3.Connection,
    user_id: int,
    doc_id: int,
    title: str,
    fields: dict[str, Any],
    messages: list[DocumentMessage],
) -> dict[str, Any] | None:
    cursor = db.execute(
        """
        UPDATE documents
        SET title = ?, fields_json = ?, messages_json = ?,
            updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
        """,
        (
            title,
            json.dumps(fields),
            json.dumps([m.model_dump() for m in messages]),
            doc_id,
            user_id,
        ),
    )
    if cursor.rowcount == 0:
        return None
    return get_for_user(db, user_id, doc_id)


def delete_for_user(db: sqlite3.Connection, user_id: int, doc_id: int) -> bool:
    cursor = db.execute(
        "DELETE FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, user_id),
    )
    return cursor.rowcount > 0
