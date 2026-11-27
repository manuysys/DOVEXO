"""WhatsApp: inbound, bot determinístico, notificación al fundador y threads."""

from __future__ import annotations

import re
import uuid
from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import get_logger
from app.models import Contact, Lead, WhatsAppMessage, WhatsAppThread
from app.providers.whatsapp import WhatsAppProvider, get_whatsapp_provider
from app.providers.whatsapp.base import WhatsAppProviderError
from app.services.contacts import normalize_phone
from app.services.leads import record_activity
from app.services.suppressions import is_blocked
from app.utils import utcnow

logger = get_logger(__name__)

BOT_REPLY = (
    "Gracias por escribir a ARVOKTA. ¿Qué servicio o consulta necesitás? "
    "Si preferís, te derivo con una persona del equipo."
)


@dataclass(slots=True)
class InboundResult:
    thread_id: int
    inbound_id: int | None
    reply_id: int | None
    reply_text: str | None
    delivery_status: str | None
    duplicate: bool
    founder_notified: bool


def normalize_whatsapp_phone(value: str) -> str:
    cleaned = value.strip()
    digits = re.sub(r"\D", "", cleaned)
    if not digits:
        raise ValueError("Teléfono inválido")
    if cleaned.startswith("+") or not digits.startswith("54"):
        return normalize_phone(cleaned)
    try:
        return normalize_phone(f"+{digits}")
    except ValueError:
        return normalize_phone(cleaned)


def _find_contact(db: Session, phone: str) -> Contact | None:
    return db.scalar(
        select(Contact)
        .where(
            Contact.normalized_value == phone,
            Contact.contact_type.in_(("phone", "whatsapp")),
        )
        .order_by(Contact.is_primary.desc(), Contact.id)
        .limit(1)
    )


def _latest_lead(db: Session, company_id: int) -> Lead | None:
    return db.scalar(
        select(Lead)
        .where(Lead.company_id == company_id)
        .order_by(Lead.updated_at.desc(), Lead.id.desc())
        .limit(1)
    )


def _get_or_create_thread(
    db: Session,
    *,
    phone: str,
    display_name: str | None,
) -> WhatsAppThread:
    contact = _find_contact(db, phone)
    lead = _latest_lead(db, contact.company_id) if contact is not None else None
    thread = db.scalar(select(WhatsAppThread).where(WhatsAppThread.phone == phone))

    if thread is None:
        thread = WhatsAppThread(
            phone=phone,
            display_name=display_name,
            company_id=contact.company_id if contact is not None else None,
            contact_id=contact.id if contact is not None else None,
            lead_id=lead.id if lead is not None else None,
        )
        db.add(thread)
    else:
        if display_name and not thread.display_name:
            thread.display_name = display_name
        if contact is not None:
            thread.contact_id = thread.contact_id or contact.id
            thread.company_id = thread.company_id or contact.company_id
        if lead is not None:
            thread.lead_id = thread.lead_id or lead.id
    db.flush()
    return thread


def _bot_reply_for(display_name: str | None) -> str:
    if display_name:
        return (
            f"Gracias por escribir a ARVOKTA, {display_name}. "
            "¿Qué servicio o consulta necesitás? Si preferís, te derivo con una "
            "persona del equipo."
        )
    return BOT_REPLY


def _notify_founder(
    provider: WhatsAppProvider,
    *,
    sender_phone: str,
    display_name: str | None,
    body: str,
) -> bool:
    founder = (settings.founder_phone or "").strip()
    if not founder:
        return False
    try:
        founder_phone = normalize_whatsapp_phone(founder)
    except ValueError:
        logger.warning("FOUNDER_PHONE no es válido; no se notifica.")
        return False
    if founder_phone == sender_phone:
        return False

    label = display_name or sender_phone
    try:
        provider.send_text(
            to=founder_phone,
            body=f"Nuevo WhatsApp de {label}: {body[:300]}",
        )
    except WhatsAppProviderError:
        logger.warning("No se pudo notificar al fundador por WhatsApp.")
        return False
    return True


def process_inbound(
    db: Session,
    *,
    phone: str,
    body: str,
    wa_message_id: str | None,
    display_name: str | None = None,
    raw_payload: dict[str, Any] | None = None,
    provider: WhatsAppProvider | None = None,
) -> InboundResult:
    normalized_phone = normalize_whatsapp_phone(phone)

    if wa_message_id:
        existing = db.scalar(
            select(WhatsAppMessage).where(WhatsAppMessage.wa_message_id == wa_message_id)
        )
        if existing is not None:
            return InboundResult(
                thread_id=existing.thread_id,
                inbound_id=existing.id,
                reply_id=None,
                reply_text=None,
                delivery_status=None,
                duplicate=True,
                founder_notified=False,
            )

    thread = _get_or_create_thread(db, phone=normalized_phone, display_name=display_name)
    contact = db.get(Contact, thread.contact_id) if thread.contact_id else None
    lead = db.get(Lead, thread.lead_id) if thread.lead_id else None

    inbound = WhatsAppMessage(
        thread_id=thread.id,
        direction="in",
        wa_message_id=wa_message_id,
        body=body.strip(),
        status="received",
        raw_payload=raw_payload or {},
    )
    db.add(inbound)
    thread.last_message_at = utcnow()

    if lead is not None:
        if lead.status not in {"customer", "not_interested", "invalid", "do_not_contact"}:
            lead.status = "replied"
        record_activity(
            db,
            lead,
            activity_type="whatsapp_inbound",
            description="Mensaje entrante de WhatsApp.",
            metadata={"thread_id": thread.id, "wa_message_id": wa_message_id},
            commit=False,
        )
    db.commit()
    db.refresh(inbound)
    db.refresh(thread)

    blocked = (lead is not None and lead.status == "do_not_contact") or (
        contact is not None and contact.do_not_contact
    )
    if not blocked:
        blocked = is_blocked(db, company_id=thread.company_id, phone=normalized_phone)

    if blocked:
        return InboundResult(
            thread_id=thread.id,
            inbound_id=inbound.id,
            reply_id=None,
            reply_text=None,
            delivery_status=None,
            duplicate=False,
            founder_notified=False,
        )

    provider = provider or get_whatsapp_provider()
    reply_text = _bot_reply_for(thread.display_name or display_name)
    delivery_status: str | None = None
    reply_id: int | None = None

    try:
        result = provider.send_text(to=normalized_phone, body=reply_text)
    except WhatsAppProviderError as exc:
        reply = WhatsAppMessage(
            thread_id=thread.id,
            direction="out",
            body=reply_text,
            status="failed",
            raw_payload={"error": str(exc)[:500]},
        )
        db.add(reply)
        db.commit()
        db.refresh(reply)
        reply_id = reply.id
        delivery_status = "failed"
    else:
        reply = WhatsAppMessage(
            thread_id=thread.id,
            direction="out",
            wa_message_id=result.provider_message_id,
            body=reply_text,
            status=result.status,
            raw_payload=result.payload,
            sent_at=utcnow() if result.status == "sent" else None,
        )
        db.add(reply)
        delivery_status = result.status
        thread.last_message_at = utcnow()
        if lead is not None:
            record_activity(
                db,
                lead,
                activity_type="whatsapp_reply_simulated"
                if result.status == "simulated"
                else "whatsapp_reply_sent",
                description="Respuesta automática de WhatsApp generada.",
                metadata={"thread_id": thread.id, "provider": result.provider},
                commit=False,
            )
        db.commit()
        db.refresh(reply)
        reply_id = reply.id

    founder_notified = _notify_founder(
        provider,
        sender_phone=normalized_phone,
        display_name=thread.display_name or display_name,
        body=body,
    )
    db.refresh(thread)
    return InboundResult(
        thread_id=thread.id,
        inbound_id=inbound.id,
        reply_id=reply_id,
        reply_text=reply_text,
        delivery_status=delivery_status,
        duplicate=False,
        founder_notified=founder_notified,
    )


def extract_webhook_messages(payload: dict[str, Any]) -> list[dict[str, Any]]:
    extracted: list[dict[str, Any]] = []
    for entry in payload.get("entry") or []:
        if not isinstance(entry, dict):
            continue
        for change in entry.get("changes") or []:
            if not isinstance(change, dict):
                continue
            value = change.get("value") or {}
            if not isinstance(value, dict):
                continue
            profiles = {
                str(item.get("wa_id")): ((item.get("profile") or {}).get("name"))
                for item in (value.get("contacts") or [])
                if isinstance(item, dict)
            }
            for message in value.get("messages") or []:
                if not isinstance(message, dict):
                    continue
                phone = str(message.get("from") or "").strip()
                wa_message_id = str(message.get("id") or "").strip() or None
                if not phone:
                    continue
                text = ((message.get("text") or {}).get("body") or "").strip()
                if not text:
                    text = "[mensaje no textual]"
                extracted.append(
                    {
                        "phone": phone,
                        "body": text,
                        "wa_message_id": wa_message_id,
                        "display_name": profiles.get(phone),
                        "raw": message,
                    }
                )
    return extracted


def process_webhook(
    db: Session,
    payload: dict[str, Any],
    provider: WhatsAppProvider | None = None,
) -> dict[str, Any]:
    provider = provider or get_whatsapp_provider()
    messages = extract_webhook_messages(payload)
    received = 0
    duplicates = 0
    replies: list[dict[str, Any]] = []

    for item in messages:
        try:
            result = process_inbound(
                db,
                phone=item["phone"],
                body=item["body"],
                wa_message_id=item["wa_message_id"],
                display_name=item["display_name"],
                raw_payload=item["raw"],
                provider=provider,
            )
        except ValueError:
            logger.warning("Mensaje de WhatsApp con teléfono inválido; se omite.")
            continue
        if result.duplicate:
            duplicates += 1
            continue
        received += 1
        replies.append(
            {
                "thread_id": result.thread_id,
                "message_id": result.reply_id,
                "text": result.reply_text,
                "status": result.delivery_status,
            }
        )

    return {"received": received, "duplicates": duplicates, "replies": replies}


def simulation_wa_id() -> str:
    return f"sim-{uuid.uuid4().hex}"
