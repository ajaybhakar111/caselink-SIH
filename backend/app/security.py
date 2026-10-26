"""Authentication (JWT) and role-based access control (RBAC).

Passwords are hashed with PBKDF2-HMAC-SHA256 from the standard library.
Demo users are seeded for every role; password for all of them is "password".
"""
import base64
import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .db import get_db
from .models import User

ROLES = [
    "RB Officer",
    "PGRC Officer",
    "Regional Office Official",
    "Senior Management",
    "Administrator",
]
# Roles allowed to record an overlap verdict / change a case
REVIEWERS = {"RB Officer", "PGRC Officer", "Senior Management", "Administrator"}
ACTORS = REVIEWERS | {"Regional Office Official"}

_ITER = 120_000
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITER)
    return base64.b64encode(salt + dk).decode()


def verify_password(password: str, stored: str) -> bool:
    raw = base64.b64decode(stored.encode())
    salt, dk = raw[:16], raw[16:]
    cand = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITER)
    return hmac.compare_digest(dk, cand)


def create_token(user: User) -> str:
    exp = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user.email, "role": user.role, "name": user.name, "exp": exp}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        data = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = db.get(User, data.get("sub"))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Unknown user")
    return user


def require_roles(*allowed: str):
    """Dependency factory: server-side RBAC (the UI hiding a button is not security)."""
    allowed_set = set(allowed)

    def checker(user: User = Depends(current_user)) -> User:
        if user.role not in allowed_set:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Role '{user.role}' may not perform this action")
        return user

    return checker


def mask_case(case: dict, role: str) -> dict:
    """Masked cross-Bureau view: a Regional Office official sees limited detail on other Bureaus' cases."""
    if role == "Regional Office Official" and case.get("bureau") != "Regional Office":
        case = dict(case)
        case["officer"] = "Restricted"
        case["description"] = "Details restricted for your role. Contact the owning Bureau/Cell."
    return case
