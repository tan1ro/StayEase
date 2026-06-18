from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Literal

ActionType = Literal["navigate", "external"]


@dataclass
class ChatAction:
    label: str
    path: str
    type: ActionType = "navigate"


@dataclass
class ChatbotReply:
    reply: str
    actions: list[ChatAction] = field(default_factory=list)
    quick_replies: list[str] = field(default_factory=list)


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def _contains_any(text: str, *phrases: str) -> bool:
    return any(phrase in text for phrase in phrases)


def _default_quick_replies(context: dict[str, Any]) -> list[str]:
    if context.get("is_host"):
        return ["Host dashboard", "My listings", "Guest messages", "Help centre"]
    if context.get("is_authenticated"):
        return ["Browse stays", "My bookings", "Wishlist", "Help centre"]
    return ["Browse stays", "Find my room", "Sign in", "Help centre"]


def _greeting_reply(context: dict[str, Any]) -> ChatbotReply:
    name = context.get("user_name") or "there"
    if context.get("is_host"):
        reply = (
            f"Hi {name}! I'm StayEase Assistant. I can help you manage listings, "
            "bookings, payouts, and hosting policies."
        )
        actions = [
            ChatAction("Open host dashboard", "/host"),
            ChatAction("Manage listings", "/host/rooms"),
        ]
    elif context.get("is_authenticated"):
        reply = (
            f"Hi {name}! I'm StayEase Assistant. Ask me about bookings, cancellations, "
            "fees, or say where you'd like to go."
        )
        actions = [
            ChatAction("Browse stays", "/"),
            ChatAction("My bookings", "/bookings"),
        ]
    else:
        reply = (
            "Hi! I'm StayEase Assistant. I can help you find stays, explain policies, "
            "and guide you around the app. What would you like to do?"
        )
        actions = [
            ChatAction("Browse stays", "/"),
            ChatAction("Sign in", "/login"),
        ]

    return ChatbotReply(
        reply=reply,
        actions=actions,
        quick_replies=_default_quick_replies(context),
    )


def _navigation_reply(
    label: str, path: str, message: str, context: dict[str, Any]
) -> ChatbotReply:
    return ChatbotReply(
        reply=message,
        actions=[ChatAction(f"Go to {label}", path)],
        quick_replies=_default_quick_replies(context),
    )


def resolve_chat_intent(
    message: str, context: dict[str, Any] | None = None
) -> ChatbotReply:
    context = context or {}
    text = _normalize(message)
    if not text:
        return ChatbotReply(
            reply="Please type a question or pick one of the suggestions below.",
            quick_replies=_default_quick_replies(context),
        )

    # Exact quick-reply matches
    quick_map = {
        "browse stays": _navigation_reply(
            "home", "/", "Taking you to explore stays across India.", context
        ),
        "find my room": _navigation_reply(
            "Find My Room",
            "/find-my-room",
            "Open Find My Room to locate your booked property with your confirmation details.",
            context,
        ),
        "my bookings": _navigation_reply(
            "bookings",
            "/bookings",
            "You can view upcoming trips, receipts, and cancellation options in My bookings.",
            context,
        ),
        "wishlist": _navigation_reply(
            "wishlist",
            "/wishlist",
            "Your saved stays are in Wishlist. You can compare rooms from there too.",
            context,
        ),
        "help centre": _navigation_reply(
            "Help Centre",
            "/help",
            "The Help Centre covers bookings, fees, local laws, and support contacts.",
            context,
        ),
        "sign in": _navigation_reply(
            "login",
            "/login",
            "Sign in to access bookings, messages, and your profile.",
            context,
        ),
        "create account": _navigation_reply(
            "register",
            "/register",
            "Create a free StayEase account to book stays and message hosts.",
            context,
        ),
        "host dashboard": _navigation_reply(
            "host dashboard",
            "/host",
            "Your host dashboard shows earnings, calendar, and listing performance.",
            context,
        ),
        "my listings": _navigation_reply(
            "listings",
            "/host/rooms",
            "Manage your room listings, photos, pricing, and availability here.",
            context,
        ),
        "guest messages": _navigation_reply(
            "messages",
            "/host/messages" if context.get("is_host") else "/messages",
            "Open Messages to read inquiries from guests before they book.",
            context,
        ),
        "become a host": _navigation_reply(
            "list your room",
            "/host/rooms/add",
            "Start listing your room on StayEase. The setup wizard walks you through each step.",
            context,
        ),
        "account settings": _navigation_reply(
            "settings",
            "/settings",
            "Update your profile, password, notifications, and identity verification in Settings.",
            context,
        ),
        "service fees": _navigation_reply(
            "service fees",
            "/help/service-fees",
            "StayEase service fees and GST are explained on the Service fees page.",
            context,
        ),
        "cancellation policy": _navigation_reply(
            "cancellation policy",
            "/terms#cancellation",
            "Cancellation rules depend on the listing. See the full policy in Terms.",
            context,
        ),
        "contact support": ChatbotReply(
            reply=(
                "Email support@stayease.com for booking help, or privacy@stayease.com "
                "for account and data requests. We typically respond within one business day."
            ),
            actions=[
                ChatAction("Help Centre", "/help"),
                ChatAction("Terms & policies", "/terms"),
            ],
            quick_replies=["My bookings", "Cancellation policy", "Service fees"],
        ),
    }
    if text in quick_map:
        return quick_map[text]

    if _contains_any(
        text, "hi", "hello", "hey", "good morning", "good evening", "namaste"
    ):
        return _greeting_reply(context)

    if _contains_any(text, "thank", "thanks", "thx"):
        return ChatbotReply(
            reply="You're welcome! Let me know if you need anything else on StayEase.",
            quick_replies=_default_quick_replies(context),
        )

    if _contains_any(text, "bye", "goodbye", "see you"):
        return ChatbotReply(
            reply="Goodbye! I'm here whenever you need help navigating StayEase.",
            quick_replies=["Browse stays", "Help centre"],
        )

    # Navigation intents
    if _contains_any(text, "book", "booking", "reservation", "trip", "upcoming"):
        if not context.get("is_authenticated"):
            return ChatbotReply(
                reply="Sign in to view your bookings, download receipts, and manage cancellations.",
                actions=[
                    ChatAction("Sign in", "/login"),
                    ChatAction("Create account", "/register"),
                ],
                quick_replies=["Browse stays", "Help centre"],
            )
        booking_count = context.get("booking_count", 0)
        suffix = (
            f" You have {booking_count} booking{'s' if booking_count != 1 else ''} on your account."
            if booking_count
            else ""
        )
        return _navigation_reply(
            "bookings",
            "/bookings",
            f"Open My bookings to see trip details, receipts, and cancellation options.{suffix}",
            context,
        )

    if _contains_any(text, "wishlist", "saved", "favourite", "favorite", "heart"):
        path = "/wishlist"
        if not context.get("is_authenticated"):
            return ChatbotReply(
                reply="Sign in to save stays to your wishlist and compare rooms.",
                actions=[ChatAction("Sign in", "/login")],
                quick_replies=["Browse stays", "Create account"],
            )
        return _navigation_reply(
            "wishlist", path, "Your saved stays live in Wishlist.", context
        )

    if _contains_any(text, "message", "inbox", "chat with host", "contact host"):
        path = "/host/messages" if context.get("is_host") else "/messages"
        if not context.get("is_authenticated"):
            return ChatbotReply(
                reply="Sign in to message hosts from listing pages or view your inbox.",
                actions=[ChatAction("Sign in", "/login")],
                quick_replies=["Browse stays", "Help centre"],
            )
        label = "host messages" if context.get("is_host") else "messages"
        return _navigation_reply(
            label, path, "Open Messages to view inquiries and replies.", context
        )

    if _contains_any(text, "profile", "my account", "account"):
        if not context.get("is_authenticated"):
            return _navigation_reply(
                "login", "/login", "Sign in to access your StayEase profile.", context
            )
        return _navigation_reply(
            "profile", "/settings", "View and edit your profile details here.", context
        )

    if _contains_any(text, "setting", "password", "notification pref"):
        if not context.get("is_authenticated"):
            return ChatbotReply(
                reply="Sign in first, then open Account settings to change your password or notifications.",
                actions=[ChatAction("Sign in", "/login")],
                quick_replies=["Forgot password", "Create account"],
            )
        return _navigation_reply(
            "settings",
            "/settings",
            "Manage password, phone, and preferences in Settings.",
            context,
        )

    if _contains_any(
        text, "forgot password", "reset password", "can't login", "cannot login"
    ):
        return _navigation_reply(
            "forgot password",
            "/forgot-password",
            "Use Forgot password to receive a reset link at your registered email.",
            context,
        )

    if _contains_any(text, "login", "log in", "sign in", "signin"):
        return _navigation_reply(
            "login", "/login", "Head to Sign in with your email and password.", context
        )

    if _contains_any(
        text, "register", "sign up", "signup", "create account", "new account"
    ):
        return _navigation_reply(
            "register",
            "/register",
            "Create a StayEase account to book and message hosts.",
            context,
        )

    if _contains_any(
        text,
        "search",
        "explore",
        "find stay",
        "find room",
        "browse",
        "hotel",
        "homestay",
    ):
        if _contains_any(text, "confirmation", "booking id", "reservation number"):
            return _navigation_reply(
                "Find My Room",
                "/find-my-room",
                "Use Find My Room with your booking reference to locate your property.",
                context,
            )
        return _navigation_reply(
            "home",
            "/",
            "Explore stays by city, dates, and guests on the home page.",
            context,
        )

    if _contains_any(
        text, "host", "listing", "list my", "list your", "publish", "earn"
    ):
        if context.get("is_host"):
            if _contains_any(text, "dashboard", "earning", "insight", "analytics"):
                return _navigation_reply(
                    "host dashboard",
                    "/host",
                    "Your host dashboard shows performance and earnings.",
                    context,
                )
            if _contains_any(text, "calendar", "availability"):
                return _navigation_reply(
                    "calendar",
                    "/host/calendar",
                    "Manage availability and blocked dates on your calendar.",
                    context,
                )
            if _contains_any(text, "payout", "payment", "withdraw"):
                return _navigation_reply(
                    "payouts",
                    "/host/payouts",
                    "Track payouts and settlement details here.",
                    context,
                )
            if _contains_any(text, "offer", "discount", "promo"):
                return _navigation_reply(
                    "offers",
                    "/host/offers",
                    "Create and manage promotional offers for your listings.",
                    context,
                )
            return _navigation_reply(
                "listings",
                "/host/rooms",
                "Manage your listings from the host rooms page.",
                context,
            )
        return _navigation_reply(
            "list your room",
            "/host/rooms/add",
            "Anyone can become a host on StayEase. Start with List your room to set up your first listing.",
            context,
        )

    if _contains_any(text, "help", "support", "faq", "assist"):
        return _navigation_reply(
            "Help Centre",
            "/help",
            "The Help Centre has guides on bookings, fees, laws, and how to contact support.",
            context,
        )

    if _contains_any(text, "cancel", "refund"):
        return ChatbotReply(
            reply=(
                "Cancellation and refund eligibility depend on the listing policy and how close "
                "check-in is. Open My bookings to cancel, or read the full policy in Terms."
            ),
            actions=[
                ChatAction("My bookings", "/bookings"),
                ChatAction("Cancellation policy", "/terms#cancellation"),
            ],
            quick_replies=["Contact support", "Service fees"],
        )

    if _contains_any(text, "fee", "gst", "tax", "charge", "invoice", "receipt"):
        return ChatbotReply(
            reply=(
                "StayEase shows a full price breakdown including room rate, service fee, and GST "
                "before you pay. Download receipts from My bookings after confirmation."
            ),
            actions=[
                ChatAction("Service fees", "/help/service-fees"),
                ChatAction("My bookings", "/bookings"),
            ],
            quick_replies=["Cancellation policy", "Help centre"],
        )

    if _contains_any(text, "privacy", "data", "cookie"):
        path = (
            "/privacy-policy"
            if "privacy" in text or "data" in text
            else "/cookie-policy"
        )
        label = "privacy policy" if path == "/privacy-policy" else "cookie policy"
        return _navigation_reply(
            label, path, f"Read our {label.replace('-', ' ')} for details.", context
        )

    if _contains_any(text, "term", "policy", "rule", "law"):
        if _contains_any(text, "local"):
            return _navigation_reply(
                "local laws",
                "/help/local-laws",
                "Local hosting laws vary by state and city.",
                context,
            )
        if _contains_any(text, "discrim"):
            return _navigation_reply(
                "nondiscrimination",
                "/help/nondiscrimination",
                "Our nondiscrimination policy explains inclusive hosting standards.",
                context,
            )
        return _navigation_reply(
            "terms",
            "/terms",
            "Terms of Service cover guest and host responsibilities.",
            context,
        )

    if _contains_any(text, "notification", "alert"):
        if not context.get("is_authenticated"):
            return ChatbotReply(
                reply="Sign in to view booking updates and account notifications.",
                actions=[ChatAction("Sign in", "/login")],
                quick_replies=["Browse stays"],
            )
        return _navigation_reply(
            "notifications",
            "/notifications",
            "See booking and account alerts in Notifications.",
            context,
        )

    if _contains_any(text, "where am i", "current page", "this page"):
        current_path = context.get("current_path") or "/"
        return ChatbotReply(
            reply=f"You're currently on {current_path}. Tell me where you'd like to go and I'll guide you.",
            quick_replies=_default_quick_replies(context),
        )

    return ChatbotReply(
        reply=(
            "I'm not sure about that yet. Try asking about bookings, wishlist, hosting, "
            "cancellations, fees, or say 'help' to browse support topics."
        ),
        actions=[ChatAction("Help Centre", "/help")],
        quick_replies=_default_quick_replies(context),
    )


def serialize_reply(reply: ChatbotReply) -> dict[str, Any]:
    return {
        "reply": reply.reply,
        "actions": [
            {"label": action.label, "path": action.path, "type": action.type}
            for action in reply.actions
        ],
        "quick_replies": reply.quick_replies,
    }
