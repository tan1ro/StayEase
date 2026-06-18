from __future__ import annotations

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from config import settings
from database import database
from models.common import PyObjectId, serialize_doc, utc_now
from services.auth import bearer_scheme
from services.chatbot import resolve_chat_intent, serialize_reply
from services.roles import normalize_role


router = APIRouter(prefix="/api/chat", tags=["chat"])

MAX_MESSAGES = 100


class ChatMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: str | None = Field(default=None, max_length=64)
    current_path: str | None = Field(default=None, max_length=200)


class ChatActionResponse(BaseModel):
    label: str
    path: str
    type: str = "navigate"


class ChatMessageResponse(BaseModel):
    session_id: str
    reply: str
    actions: list[ChatActionResponse] = Field(default_factory=list)
    quick_replies: list[str] = Field(default_factory=list)
    messages: list[dict[str, Any]] = Field(default_factory=list)


async def _optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict[str, Any] | None:
    if creds is None or not creds.credentials:
        return None
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=["HS256"])
        sub = payload.get("sub")
        if not sub:
            return None
    except JWTError:
        return None

    user = await database.collection("users").find_one({"_id": PyObjectId(sub)})
    if not user:
        return None
    user["role"] = normalize_role(user.get("role"))
    return user


async def _build_context(user: dict[str, Any] | None, current_path: str | None) -> dict[str, Any]:
    context: dict[str, Any] = {
        "current_path": current_path or "/",
        "is_authenticated": user is not None,
        "is_host": False,
        "user_name": None,
        "booking_count": 0,
    }
    if not user:
        return context

    role = normalize_role(user.get("role"))
    context["is_host"] = role == "host"
    context["user_name"] = (user.get("name") or "").split()[0] or None

    booking_count = await database.collection("bookings").count_documents(
        {"guest_id": str(user["_id"]), "status": {"$nin": ["cancelled", "rejected"]}}
    )
    context["booking_count"] = booking_count
    return context


async def _get_or_create_session(session_id: str | None, user: dict[str, Any] | None) -> tuple[str, dict[str, Any]]:
    sessions = database.collection("chat_sessions")
    user_id = str(user["_id"]) if user else None

    if session_id:
        query: dict[str, Any] = {"session_id": session_id}
        if user_id:
            query["$or"] = [{"user_id": user_id}, {"user_id": None}]
        else:
            query["user_id"] = None
        existing = await sessions.find_one(query)
        if existing:
            if user_id and not existing.get("user_id"):
                await sessions.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"user_id": user_id, "updated_at": utc_now()}},
                )
                existing["user_id"] = user_id
            return session_id, existing

    new_session_id = session_id or str(uuid.uuid4())
    doc = {
        "session_id": new_session_id,
        "user_id": user_id,
        "messages": [],
        "created_at": utc_now(),
        "updated_at": utc_now(),
    }
    await sessions.insert_one(doc)
    return new_session_id, doc


def _append_message(session: dict[str, Any], role: str, content: str) -> list[dict[str, Any]]:
    messages = list(session.get("messages") or [])
    messages.append({"role": role, "content": content, "at": utc_now().isoformat()})
    if len(messages) > MAX_MESSAGES:
        messages = messages[-MAX_MESSAGES:]
    return messages


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    user: dict[str, Any] | None = Depends(_optional_user),
):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=422, detail="Message cannot be empty")

    session_id, session = await _get_or_create_session(payload.session_id, user)
    context = await _build_context(user, payload.current_path)
    bot = resolve_chat_intent(message, context)
    bot_data = serialize_reply(bot)

    messages = _append_message(session, "user", message)
    messages = messages + [{"role": "assistant", "content": bot.reply, "at": utc_now().isoformat()}]

    await database.collection("chat_sessions").update_one(
        {"session_id": session_id},
        {"$set": {"messages": messages, "updated_at": utc_now()}},
    )

    return ChatMessageResponse(
        session_id=session_id,
        reply=bot.reply,
        actions=[ChatActionResponse(**action) for action in bot_data["actions"]],
        quick_replies=bot_data["quick_replies"],
        messages=messages,
    )


@router.get("/history")
async def get_chat_history(
    session_id: str = Query(..., min_length=8, max_length=64),
    user: dict[str, Any] | None = Depends(_optional_user),
):
    query: dict[str, Any] = {"session_id": session_id}
    if user:
        query["$or"] = [{"user_id": str(user["_id"])}, {"user_id": None}]
    else:
        query["user_id"] = None

    session = await database.collection("chat_sessions").find_one(query)
    if not session:
        return {"session_id": session_id, "messages": []}

    return {
        "session_id": session_id,
        "messages": serialize_doc(session).get("messages") or [],
    }
