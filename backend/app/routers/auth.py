from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import User
from ..schemas import LoginIn, TokenOut
from ..security import ROLES, create_token, current_user, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/roles")
def roles() -> list[str]:
    return ROLES


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.get(User, body.email.lower())
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if body.role and body.role != user.role:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"This account is not a '{body.role}'")
    return TokenOut(access_token=create_token(user), role=user.role, name=user.name)


@router.get("/me")
def me(user: User = Depends(current_user)):
    return {"email": user.email, "role": user.role, "name": user.name}
