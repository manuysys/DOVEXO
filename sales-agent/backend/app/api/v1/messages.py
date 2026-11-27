"""Edición, aprobación y envío de mensajes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import get_db
from app.models import OutreachMessage, User
from app.providers.whatsapp.base import WhatsAppProviderError
from app.schemas.outreach import (
    MessageDeliveryRead,
    MessageSendResponse,
    MessageUpdate,
    OutreachMessageRead,
)
from app.services.outreach import (
    MessageBlockedError,
    MessageStateError,
    OutreachError,
    approve_message,
    edit_message,
    mark_message_sent,
    send_message,
)

router = APIRouter(prefix="/messages", tags=["messages"])


def _message_or_404(db: Session, message_id: int) -> OutreachMessage:
    message = db.get(OutreachMessage, message_id)
    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mensaje no encontrado.",
        )
    return message


@router.patch("/{message_id}", response_model=OutreachMessageRead)
def edit_message_endpoint(
    message_id: int,
    payload: MessageUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OutreachMessageRead:
    message = _message_or_404(db, message_id)
    try:
        message = edit_message(db, message, payload.edited_text)
    except MessageStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except OutreachError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return OutreachMessageRead.model_validate(message)


@router.post("/{message_id}/approve", response_model=OutreachMessageRead)
def approve_message_endpoint(
    message_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OutreachMessageRead:
    message = _message_or_404(db, message_id)
    try:
        message = approve_message(db, message)
    except MessageStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return OutreachMessageRead.model_validate(message)


@router.post("/{message_id}/send", response_model=MessageSendResponse)
def send_message_endpoint(
    message_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> MessageSendResponse:
    message = _message_or_404(db, message_id)
    try:
        message, result = send_message(db, message)
    except MessageStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except MessageBlockedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except OutreachError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except WhatsAppProviderError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    return MessageSendResponse(
        status=result.status,
        text=message.edited_text or message.generated_text,
        message=OutreachMessageRead.model_validate(message),
        delivery=MessageDeliveryRead(
            status=result.status,
            provider=result.provider,
            provider_message_id=result.provider_message_id,
            text=message.edited_text or message.generated_text,
        ),
    )


@router.post("/{message_id}/mark-sent", response_model=OutreachMessageRead)
def mark_sent_endpoint(
    message_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OutreachMessageRead:
    message = _message_or_404(db, message_id)
    try:
        message = mark_message_sent(db, message)
    except MessageStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except MessageBlockedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return OutreachMessageRead.model_validate(message)
