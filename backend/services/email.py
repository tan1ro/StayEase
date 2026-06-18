from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType

from config import settings

logger = logging.getLogger(__name__)

TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "templates" / "emails"


def _mail_config() -> ConnectionConfig:
    return ConnectionConfig(
        MAIL_USERNAME=settings.MAIL_USERNAME,
        MAIL_PASSWORD=settings.MAIL_PASSWORD,
        MAIL_FROM=settings.MAIL_FROM,
        MAIL_PORT=settings.MAIL_PORT,
        MAIL_SERVER=settings.MAIL_SERVER,
        MAIL_STARTTLS=settings.MAIL_USE_TLS,
        MAIL_SSL_TLS=False,
        USE_CREDENTIALS=True,
        VALIDATE_CERTS=True,
        TEMPLATE_FOLDER=TEMPLATE_DIR,
    )


async def send_template_email(
    *,
    to: str,
    subject: str,
    template_name: str,
    context: dict[str, Any],
    attachments: list | None = None,
) -> bool:
    if not settings.MAIL_USERNAME or not settings.MAIL_FROM:
        return False
    body = {**context, "FRONTEND_URL": settings.FRONTEND_URL.rstrip("/")}
    message = MessageSchema(
        subject=subject,
        recipients=[to],
        template_body=body,
        subtype=MessageType.html,
        attachments=attachments or [],
    )
    fm = FastMail(_mail_config())
    try:
        await fm.send_message(message, template_name=template_name)
        return True
    except Exception as exc:
        logger.warning("Failed to send email to %s (%s): %s", to, subject, exc)
        return False
