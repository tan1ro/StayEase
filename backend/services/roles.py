from __future__ import annotations

from typing import Literal

Role = Literal["tourist", "host", "admin"]
LegacyRole = Literal["guest", "tourist", "host", "admin"]

HOST_SIGNUP_EMAILS = frozenset(
    email.lower()
    for email in (
        "host@stayease.com",
        "rahul@stayease.com",
        "ananya@stayease.com",
        "vikram@stayease.com",
        "lakshmi@stayease.com",
    )
)


def normalize_role(role: str | None) -> Role:
    if role == "guest":
        return "tourist"
    if role in ("tourist", "host", "admin"):
        return role
    return "tourist"


def is_tourist_role(role: str | None) -> bool:
    return normalize_role(role) == "tourist"


def is_host_role(role: str | None) -> bool:
    return normalize_role(role) in ("host", "admin")


def can_book_stays(role: str | None) -> bool:
    return normalize_role(role) in ("tourist", "host", "admin")


def resolve_registration_role(*, email: str, as_host: bool = False) -> Role:
    if as_host or email.strip().lower() in HOST_SIGNUP_EMAILS:
        return "host"
    return "tourist"
