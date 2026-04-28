"""Password hashing helpers.

Uses the ``bcrypt`` package directly (passlib is unmaintained vs. bcrypt 4.x).
bcrypt has a hard 72-byte input limit; we truncate to match historical
behaviour so callers don't have to think about it.
"""

import bcrypt


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
