"""Estado de WhatsApp, simulación y conversaciones."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.config import settings
from app.database.session import get_db
from app.models import Company, Lead, User, WhatsAppMessage, WhatsAppThread
from app.repositories.whatsapp import (
    get_thread,
    get_thread_messages,
    last_messages,
    list_threads,
    message_counts,
)
from app.schemas.whatsapp import (
    SimulateInbound,
    SimulateInboundResponse,
    ThreadDetailRead,
    ThreadListItem,
    WhatsAppMessageRead,
    WhatsAppStatus,
)
from app.services.whatsapp import (
    normalize_whatsapp_phone,
    process_inbound,
    simulation_wa_id,
)

router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])


def _thread_item(
    thread: WhatsAppThread,
    company_name: str | None,
    lead_status: str | None,
    count: int,
    last_text: str = "",
) -> ThreadListItem:
    name = thread.display_name or company_name
    return ThreadListItem(
        id=thread.id,
        phone=thread.phone,
        name=name,
        display_name=thread.display_name,
        company_id=thread.company_id,
        company_name=company_name,
        contact_id=thread.contact_id,
        lead_id=thread.lead_id,
        lead_status=lead_status,
        status=thread.status,
        last_message_at=thread.last_message_at,
        last_message_text=last_text,
        unread=0,
        message_count=count,
        created_at=thread.created_at,
    )


def _thread_detail(db: Session, thread_id: int) -> ThreadDetailRead | None:
    thread = get_thread(db, thread_id)
    if thread is None:
        return None
    company = db.get(Company, thread.company_id) if thread.company_id else None
    lead = db.get(Lead, thread.lead_id) if thread.lead_id else None
    messages = get_thread_messages(db, thread.id)
    base = _thread_item(
        thread,
        company.name if company else None,
        lead.status if lead else None,
        len(messages),
        messages[-1].body if messages else "",
    )
    return ThreadDetailRead(
        **base.model_dump(),
        thread=base,
        messages=[WhatsAppMessageRead.model_validate(message) for message in messages],
    )


@router.get("/status", response_model=WhatsAppStatus)
def whatsapp_status_endpoint(_user: User = Depends(get_current_user)) -> WhatsAppStatus:
    return WhatsAppStatus(
        configured=settings.whatsapp_configured,
        mode=settings.whatsapp_mode,
        sender_phone=settings.whatsapp_sender_phone or None,
        founder_phone_set=bool(settings.founder_phone.strip()),
    )


@router.post("/simulate/inbound", response_model=SimulateInboundResponse)
def simulate_inbound_endpoint(
    payload: SimulateInbound,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SimulateInboundResponse:
    try:
        result = process_inbound(
            db,
            phone=payload.phone,
            body=payload.text,
            wa_message_id=simulation_wa_id(),
            display_name=payload.name,
            raw_payload={"simulated": True, "text": payload.text},
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc

    detail = _thread_detail(db, result.thread_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo recuperar la conversación.",
        )
    reply = db.get(WhatsAppMessage, result.reply_id) if result.reply_id else None
    return SimulateInboundResponse(
        thread_id=result.thread_id,
        text=result.reply_text,
        thread=detail,
        reply=WhatsAppMessageRead.model_validate(reply) if reply else None,
        duplicate=result.duplicate,
        founder_notified=result.founder_notified,
    )


@router.get("/threads", response_model=list[ThreadListItem])
def list_threads_endpoint(
    company_id: int | None = Query(default=None, ge=1),
    lead_id: int | None = Query(default=None, ge=1),
    phone: str | None = Query(default=None, max_length=40),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ThreadListItem]:
    normalized_phone = None
    if phone:
        try:
            normalized_phone = normalize_whatsapp_phone(phone)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    rows = list_threads(
        db,
        company_id=company_id,
        lead_id=lead_id,
        phone=normalized_phone,
        limit=limit,
        offset=offset,
    )
    counts = message_counts(db, [thread.id for thread, _, _ in rows])
    last_texts = last_messages(db, [thread.id for thread, _, _ in rows])
    return [
        _thread_item(
            thread,
            company_name,
            lead_status,
            counts.get(thread.id, 0),
            last_texts.get(thread.id, ""),
        )
        for thread, company_name, lead_status in rows
    ]


@router.get("/threads/{thread_id}", response_model=ThreadDetailRead)
def get_thread_endpoint(
    thread_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ThreadDetailRead:
    detail = _thread_detail(db, thread_id)
    if detail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversación no encontrada.",
        )
    return detail


threads_router = APIRouter(prefix="/threads", tags=["whatsapp"])


@threads_router.get("/{thread_id}", response_model=ThreadDetailRead)
def get_thread_alias_endpoint(
    thread_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ThreadDetailRead:
    return get_thread_endpoint(thread_id, _user, db)
