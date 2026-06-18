from __future__ import annotations

import asyncio
import logging

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from config import settings

logger = logging.getLogger(__name__)


def _configure() -> None:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image(file: UploadFile) -> dict[str, str]:
    _configure()
    content = await file.read()
    result = cloudinary.uploader.upload(content, folder="stayease/images")
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_video(file: UploadFile) -> dict[str, str]:
    _configure()
    content = await file.read()
    result = cloudinary.uploader.upload(
        content, folder="stayease/videos", resource_type="video"
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


def _upload_pdf_sync(content: bytes, public_id: str) -> dict[str, str]:
    _configure()
    result = cloudinary.uploader.upload(
        content, folder="stayease/invoices", public_id=public_id, resource_type="raw"
    )
    return {"url": result["secure_url"], "public_id": result["public_id"]}


async def upload_pdf(content: bytes, public_id: str) -> dict[str, str]:
    return await asyncio.to_thread(_upload_pdf_sync, content, public_id)


async def upload_pdf_optional(content: bytes, public_id: str) -> str | None:
    try:
        uploaded = await upload_pdf(content, public_id)
        return uploaded["url"]
    except Exception as exc:
        logger.warning("PDF upload failed for %s: %s", public_id, exc)
        return None


def delete_asset(public_id: str, resource_type: str = "image") -> None:
    _configure()
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)
