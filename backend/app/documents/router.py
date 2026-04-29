"""Document CRUD endpoints. Auth-gated; all queries scoped to the session user."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request, status

from ..auth.sessions import SessionData, read_session
from ..db import get_db
from . import storage
from .schemas import (
    DocumentCreate,
    DocumentDetail,
    DocumentSummary,
    DocumentUpdate,
)

router = APIRouter(prefix="/documents", tags=["documents"])


def _require_session(request: Request) -> SessionData:
    session = read_session(request)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return session


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    request: Request,
    db: sqlite3.Connection = Depends(get_db),
) -> list[DocumentSummary]:
    session = _require_session(request)
    rows = storage.list_for_user(db, session["user_id"])
    return [DocumentSummary(**r) for r in rows]


@router.post(
    "",
    response_model=DocumentDetail,
    status_code=status.HTTP_201_CREATED,
)
def create_document(
    body: DocumentCreate,
    request: Request,
    db: sqlite3.Connection = Depends(get_db),
) -> DocumentDetail:
    session = _require_session(request)
    detail = storage.create_for_user(
        db,
        user_id=session["user_id"],
        template_slug=body.templateSlug,
        title=body.title,
        fields=body.fields,
        messages=body.messages,
    )
    return DocumentDetail(**detail)


@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(
    doc_id: int,
    request: Request,
    db: sqlite3.Connection = Depends(get_db),
) -> DocumentDetail:
    session = _require_session(request)
    detail = storage.get_for_user(db, session["user_id"], doc_id)
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return DocumentDetail(**detail)


@router.put("/{doc_id}", response_model=DocumentDetail)
def update_document(
    doc_id: int,
    body: DocumentUpdate,
    request: Request,
    db: sqlite3.Connection = Depends(get_db),
) -> DocumentDetail:
    session = _require_session(request)
    detail = storage.update_for_user(
        db,
        user_id=session["user_id"],
        doc_id=doc_id,
        title=body.title,
        fields=body.fields,
        messages=body.messages,
    )
    if detail is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return DocumentDetail(**detail)


@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(
    doc_id: int,
    request: Request,
    db: sqlite3.Connection = Depends(get_db),
) -> None:
    session = _require_session(request)
    if not storage.delete_for_user(db, session["user_id"], doc_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
