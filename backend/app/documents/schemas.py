"""Document request/response schemas.

Fields and messages are arbitrary JSON owned by the frontend (per template
shape). The backend treats them as opaque blobs and only enforces ownership
plus basic shape (`fields` is an object, `messages` is a list of role/content
turns).
"""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class DocumentMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class DocumentCreate(BaseModel):
    templateSlug: str = Field(min_length=1, max_length=100)
    title: str = Field(min_length=1, max_length=200)
    fields: dict[str, Any]
    messages: list[DocumentMessage]


class DocumentUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    fields: dict[str, Any]
    messages: list[DocumentMessage]


class DocumentSummary(BaseModel):
    id: int
    templateSlug: str
    title: str
    createdAt: str
    updatedAt: str


class DocumentDetail(DocumentSummary):
    fields: dict[str, Any]
    messages: list[DocumentMessage]
