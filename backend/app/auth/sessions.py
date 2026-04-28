"""Signed-cookie session handling.

A session is just a signed JSON blob ``{user_id, email}`` stored in an
HttpOnly cookie. itsdangerous handles signing and TTL enforcement.
"""

from __future__ import annotations

from typing import TypedDict

from fastapi import Request, Response
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer

from ..config import settings


class SessionData(TypedDict):
    user_id: int
    email: str


_serializer = URLSafeTimedSerializer(settings.secret_key, salt="prelegal-session")


def issue_session(response: Response, data: SessionData) -> None:
    token = _serializer.dumps(dict(data))
    response.set_cookie(
        key=settings.session_cookie_name,
        value=token,
        max_age=settings.session_max_age_seconds,
        httponly=True,
        samesite="lax",
        secure=False,
        path="/",
    )


def clear_session(response: Response) -> None:
    response.delete_cookie(
        key=settings.session_cookie_name,
        path="/",
    )


def read_session(request: Request) -> SessionData | None:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        return None
    try:
        payload = _serializer.loads(token, max_age=settings.session_max_age_seconds)
    except (BadSignature, SignatureExpired):
        return None
    return SessionData(user_id=int(payload["user_id"]), email=str(payload["email"]))
