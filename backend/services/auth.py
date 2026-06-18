from __future__ import annotations

import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from config import settings
from database import database
from models.common import PyObjectId

bearer_scheme = HTTPBearer(auto_error=False)

from services.roles import Role, normalize_role


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            password_hash.encode("utf-8"),
        )
    except (ValueError, TypeError):
        return False


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(*, subject: str, role: str) -> str:
    expire = _utc_now() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub": subject,
        "role": normalize_role(role),
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def generate_referral_code(length: int = 8) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


async def generate_unique_referral_code() -> str:
    users = database.collection("users")
    for _ in range(25):
        code = generate_referral_code()
        exists = await users.find_one({"referral_code": code}, {"_id": 1})
        if not exists:
            return code
    raise RuntimeError("Failed to generate unique referral code")


async def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any]:
    if creds is None or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated"
        )

    token = creds.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
            )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        ) from e

    users = database.collection("users")
    user = await users.find_one({"_id": PyObjectId(sub)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    return user


def require_role(*allowed: Role):
    allowed_normalized = {normalize_role(r) for r in allowed}

    async def _dep(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        role = normalize_role(user.get("role"))
        if role not in allowed_normalized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden"
            )
        return user

    return _dep
