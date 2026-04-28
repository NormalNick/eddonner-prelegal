"""Auth endpoints: signup, login, logout, me."""

from __future__ import annotations

import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from ..db import get_db
from .passwords import hash_password, verify_password
from .schemas import Credentials, UserOut
from .sessions import SessionData, clear_session, issue_session, read_session

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(
    creds: Credentials,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
) -> UserOut:
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (creds.email.lower(), hash_password(creds.password)),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )
    user_id = int(cursor.lastrowid)
    issue_session(response, SessionData(user_id=user_id, email=creds.email.lower()))
    return UserOut(id=user_id, email=creds.email.lower())


@router.post("/login", response_model=UserOut)
def login(
    creds: Credentials,
    response: Response,
    db: sqlite3.Connection = Depends(get_db),
) -> UserOut:
    row = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (creds.email.lower(),),
    ).fetchone()
    if row is None or not verify_password(creds.password, row["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    issue_session(response, SessionData(user_id=int(row["id"]), email=row["email"]))
    return UserOut(id=int(row["id"]), email=row["email"])


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response) -> Response:
    clear_session(response)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", response_model=UserOut)
def me(request: Request) -> UserOut:
    session = read_session(request)
    if session is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return UserOut(id=session["user_id"], email=session["email"])
