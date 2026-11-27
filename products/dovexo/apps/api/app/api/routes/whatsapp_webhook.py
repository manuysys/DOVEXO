from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.services import whatsapp_service

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

_MAX_WEBHOOK_BYTES = 1024 * 1024
_READ_CHUNK_BYTES = 64 * 1024


async def _read_limited_body(request: Request) -> bytes:
    """Lee el body con un tope duro antes de acumularlo en memoria."""
    content_length = request.headers.get("content-length")
    if content_length is not None:
        try:
            declared = int(content_length)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Content-Length",
            ) from exc
        if declared > _MAX_WEBHOOK_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Webhook payload too large",
            )

    body = bytearray()
    async for chunk in request.stream():
        body.extend(chunk)
        if len(body) > _MAX_WEBHOOK_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="Webhook payload too large",
            )
    return bytes(body)


@router.get("/whatsapp")
async def verify_webhook(
    mode: str = Query(..., alias="hub.mode"),
    token: str = Query(..., alias="hub.verify_token"),
    challenge: str = Query(..., alias="hub.challenge"),
) -> int:
    return await whatsapp_service.verify_webhook(mode, token, challenge)


@router.post("/whatsapp")
async def handle_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    raw_body = await _read_limited_body(request)
    signature = request.headers.get("X-Hub-Signature-256")
    return await whatsapp_service.handle_webhook(db, raw_body, signature)
