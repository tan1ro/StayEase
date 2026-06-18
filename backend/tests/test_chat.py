from __future__ import annotations

import pytest

from services.chatbot import resolve_chat_intent


def test_greeting_for_guest():
    reply = resolve_chat_intent("hello", {"is_authenticated": False})
    assert "StayEase Assistant" in reply.reply
    assert any(action.path == "/" for action in reply.actions)


def test_bookings_requires_login():
    reply = resolve_chat_intent("show my bookings", {"is_authenticated": False})
    assert "Sign in" in reply.reply
    assert any(action.path == "/login" for action in reply.actions)


def test_bookings_navigation_for_user():
    reply = resolve_chat_intent(
        "my upcoming trip",
        {"is_authenticated": True, "booking_count": 2},
    )
    assert any(action.path == "/bookings" for action in reply.actions)
    assert "2 bookings" in reply.reply


def test_host_listing_navigation():
    reply = resolve_chat_intent(
        "manage my listings", {"is_authenticated": True, "is_host": True}
    )
    assert any(action.path == "/host/rooms" for action in reply.actions)


@pytest.mark.asyncio
async def test_chat_message_endpoint(client):
    response = await client.post(
        "/api/chat/message",
        json={"message": "help centre", "current_path": "/"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"]
    assert "Help Centre" in data["reply"]
    assert any(action["path"] == "/help" for action in data["actions"])
    assert len(data["messages"]) == 2


@pytest.mark.asyncio
async def test_chat_history_endpoint(client):
    sent = await client.post("/api/chat/message", json={"message": "hello"})
    session_id = sent.json()["session_id"]

    history = await client.get("/api/chat/history", params={"session_id": session_id})
    assert history.status_code == 200
    payload = history.json()
    assert payload["session_id"] == session_id
    assert len(payload["messages"]) == 2
