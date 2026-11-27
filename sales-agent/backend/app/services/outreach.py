"""Generación determinística de mensajes y aprobación humana."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Company, Contact, Lead, OutreachMessage, Product, Sector
from app.models.company import CompanySector
from app.providers.whatsapp import (
    MetaWhatsAppProvider,
    SendResult,
    WhatsAppProvider,
    get_whatsapp_provider,
)
from app.providers.whatsapp.base import WhatsAppProviderError
from app.services.leads import record_activity
from app.services.suppressions import is_blocked
from app.utils import utcnow

MESSAGE_TYPES = {"first_contact", "follow_up", "demo_invite"}
MESSAGE_LABELS = {
    "first_contact": "Primer contacto",
    "follow_up": "Seguimiento",
    "demo_invite": "Invitación a demo",
}

MISSING_TEMPLATE_ERROR = (
    "El primer contacto por Meta requiere una plantilla aprobada: configurá "
    "WHATSAPP_FIRST_CONTACT_TEMPLATE. Fuera de la ventana de atención no se envía "
    "texto libre."
)


class OutreachError(ValueError):
    pass


class MessageBlockedError(OutreachError):
    pass


class MessageStateError(OutreachError):
    pass


def get_whatsapp_contact(db: Session, company_id: int) -> Contact | None:
    return db.scalar(
        select(Contact)
        .where(
            Contact.company_id == company_id,
            Contact.contact_type == "whatsapp",
            Contact.do_not_contact.is_(False),
            Contact.verification_status != "invalid",
        )
        .order_by(Contact.is_primary.desc(), Contact.id)
        .limit(1)
    )


def _company_sectors(db: Session, company_id: int) -> list[Sector]:
    return list(
        db.scalars(
            select(Sector)
            .join(CompanySector, CompanySector.sector_id == Sector.id)
            .where(CompanySector.company_id == company_id)
            .order_by(Sector.name)
        )
    )


def _ensure_not_blocked(
    db: Session,
    *,
    lead: Lead,
    company_id: int,
    contact: Contact | None,
) -> None:
    if lead.status in {"do_not_contact", "not_interested", "invalid"}:
        raise MessageBlockedError("El lead está marcado para no contactar.")
    if contact is not None and contact.do_not_contact:
        raise MessageBlockedError("El contacto está marcado para no contactar.")
    phone = contact.normalized_value if contact is not None else None
    if is_blocked(db, company_id=company_id, phone=phone):
        raise MessageBlockedError("La empresa o el contacto están en la lista de no contacto.")


def build_message_text(
    *,
    company: Company,
    product: Product,
    sectors: list[Sector],
    message_type: str,
) -> tuple[str, bool, list[str]]:
    used_fields = ["company_name", "product_name"]
    sector_names = [sector.name for sector in sectors]
    if sector_names:
        used_fields.append("sectors")
    if company.locality:
        used_fields.append("locality")
    if company.province:
        used_fields.append("province")

    general = not sector_names or not company.locality

    if message_type == "follow_up":
        opener = "Hola, soy Juan Manuel, de ARVOKTA. Te escribo para retomar el contacto."
    elif message_type == "demo_invite":
        opener = "Hola, soy Juan Manuel, de ARVOKTA. Quería invitarte a una demo breve."
    else:
        opener = "Hola, ¿cómo va? Soy Juan Manuel, de ARVOKTA."

    facts = f"Vi la ficha de {company.name}"
    if company.locality:
        facts += f" en {company.locality}"
        if company.province:
            facts += f", {company.province}"
    if sector_names:
        facts += f", en el rubro {', '.join(sector_names[:2])}"
    facts += "."
    if general:
        facts += " No tengo más datos públicos cargados, así que prefiero no asumir nada."

    value = (product.value_proposition or "").strip().rstrip(".")
    if value:
        used_fields.append("value_proposition")
        if len(value) > 220:
            value = value[:217].rstrip() + "..."
        product_line = f"{product.name}: {value}."
    else:
        product_line = f"Trabajo en {product.name}, de ARVOKTA."

    if message_type == "demo_invite":
        ask = "¿Tenés 15 minutos para que te muestre cómo funciona?"
    elif message_type == "follow_up":
        ask = "¿Sigue abierta la posibilidad de conversar sobre cómo ordenar la operación?"
    else:
        ask = "¿Te interesa que te cuente cómo lo resuelve?"

    opt_out = "Si preferís no recibir más mensajes, respondé BAJA."

    text = "\n\n".join(part for part in (opener, facts, product_line, ask, opt_out) if part).strip()
    return text[:1200], general, used_fields


def generate_message(
    db: Session,
    lead: Lead,
    *,
    channel: str,
    message_type: str,
) -> OutreachMessage:
    if channel != "whatsapp":
        raise OutreachError("Por ahora los mensajes se generan solo para WhatsApp.")
    if message_type not in MESSAGE_TYPES:
        raise OutreachError(f"Tipo de mensaje inválido: {message_type}")

    company = db.get(Company, lead.company_id)
    product = db.get(Product, lead.product_id)
    if company is None or product is None:
        raise OutreachError("El lead no tiene empresa o producto válido.")

    contact = get_whatsapp_contact(db, company.id)
    _ensure_not_blocked(db, lead=lead, company_id=company.id, contact=contact)

    text, general, used_fields = build_message_text(
        company=company,
        product=product,
        sectors=_company_sectors(db, company.id),
        message_type=message_type,
    )

    message = OutreachMessage(
        lead_id=lead.id,
        contact_id=contact.id if contact is not None else None,
        channel=channel,
        message_type=message_type,
        generated_text=text,
        status="pending_approval",
        metadata_json={
            "general": general,
            "used_fields": used_fields,
            "whatsapp_contact_available": contact is not None,
        },
    )
    db.add(message)
    record_activity(
        db,
        lead,
        activity_type="message_generated",
        description=f"{MESSAGE_LABELS[message_type]} generado para WhatsApp.",
        metadata={"message_type": message_type, "channel": channel, "general": general},
        commit=False,
    )
    db.commit()
    db.refresh(message)
    return message


def edit_message(db: Session, message: OutreachMessage, text: str) -> OutreachMessage:
    if message.status == "sent":
        raise MessageStateError("Un mensaje enviado no se puede editar.")
    clean = text.strip()
    if not clean:
        raise OutreachError("El mensaje no puede quedar vacío.")

    message.edited_text = clean
    if message.status in {"approved", "rejected"}:
        message.status = "pending_approval"
        message.approved_at = None

    lead = db.get(Lead, message.lead_id)
    if lead is not None:
        record_activity(
            db,
            lead,
            activity_type="message_edited",
            description="Mensaje editado; requiere nueva aprobación.",
            metadata={"message_id": message.id},
            commit=False,
        )
    db.commit()
    db.refresh(message)
    return message


def approve_message(db: Session, message: OutreachMessage) -> OutreachMessage:
    if message.status not in {"draft", "pending_approval"}:
        raise MessageStateError("Solo se puede aprobar un mensaje pendiente.")
    message.status = "approved"
    message.approved_at = utcnow()

    lead = db.get(Lead, message.lead_id)
    if lead is not None:
        if lead.status in {"new", "researched", "pending_review"}:
            lead.status = "approved"
        record_activity(
            db,
            lead,
            activity_type="message_approved",
            description="Mensaje aprobado para envío manual.",
            metadata={"message_id": message.id},
            commit=False,
        )
    db.commit()
    db.refresh(message)
    return message


def _message_text(message: OutreachMessage) -> str:
    return (message.edited_text or message.generated_text).strip()


def _resolve_send_contact(db: Session, message: OutreachMessage) -> Contact:
    contact = db.get(Contact, message.contact_id) if message.contact_id else None
    if contact is None:
        lead = db.get(Lead, message.lead_id)
        if lead is not None:
            contact = get_whatsapp_contact(db, lead.company_id)
    if contact is None or contact.contact_type != "whatsapp":
        raise MessageBlockedError("No hay un contacto de WhatsApp publicado para esta empresa.")
    if contact.verification_status == "invalid":
        raise MessageBlockedError("El contacto de WhatsApp está marcado como inválido.")
    return contact


def send_message(
    db: Session,
    message: OutreachMessage,
    provider: WhatsAppProvider | None = None,
) -> tuple[OutreachMessage, SendResult]:
    if message.status != "approved":
        raise MessageStateError("El mensaje debe estar aprobado antes de enviarse.")

    lead = db.get(Lead, message.lead_id)
    if lead is None:
        raise OutreachError("El lead del mensaje no existe.")
    company = db.get(Company, lead.company_id)
    if company is None:
        raise OutreachError("La empresa del lead no existe.")

    contact = _resolve_send_contact(db, message)
    if contact.company_id != company.id:
        raise MessageBlockedError("El contacto no pertenece a la empresa del lead.")
    _ensure_not_blocked(db, lead=lead, company_id=company.id, contact=contact)

    message.contact_id = contact.id
    metadata = dict(message.metadata_json or {})
    metadata["whatsapp_contact_available"] = True
    message.metadata_json = metadata

    provider = provider or get_whatsapp_provider()
    uses_template = message.message_type == "first_contact" and isinstance(
        provider, MetaWhatsAppProvider
    )
    template_name = settings.whatsapp_first_contact_template_name
    if uses_template and not template_name:
        # Primer contacto real: Meta solo acepta plantillas aprobadas fuera de la
        # ventana de atención. No se degrada a texto libre.
        raise WhatsAppProviderError(MISSING_TEMPLATE_ERROR)

    template_parameters: list[str] = []
    if uses_template:
        product = db.get(Product, lead.product_id)
        if product is None:
            raise OutreachError("El lead no tiene un producto válido para la plantilla.")
        # La plantilla aprobada debe declarar dos variables en el body:
        # {{1}} = nombre de la empresa, {{2}} = nombre del producto.
        template_parameters = [company.name, product.name]

    try:
        if uses_template:
            result = provider.send_template(
                to=contact.normalized_value,
                template_name=template_name,
                language=settings.whatsapp_template_language,
                parameters=template_parameters,
            )
        else:
            result = provider.send_text(to=contact.normalized_value, body=_message_text(message))
    except WhatsAppProviderError as exc:
        message.delivery_status = "failed"
        message.delivery_error = str(exc)[:1000]
        record_activity(
            db,
            lead,
            activity_type="message_send_failed",
            description="Falló el envío del mensaje.",
            metadata={"message_id": message.id, "error": str(exc)[:500]},
            commit=False,
        )
        db.commit()
        raise

    message.delivery_status = result.status
    message.provider_message_id = result.provider_message_id
    message.delivery_error = None
    metadata = dict(message.metadata_json or {})
    delivery: dict[str, Any] = {
        "status": result.status,
        "provider": result.provider,
        "provider_message_id": result.provider_message_id,
        "kind": "template" if uses_template else "text",
    }
    if uses_template:
        delivery["template"] = {
            "name": template_name,
            "language": settings.whatsapp_template_language,
            "parameters": template_parameters,
        }
    metadata["delivery"] = delivery
    message.metadata_json = metadata

    if result.status == "sent":
        message.status = "sent"
        message.sent_at = utcnow()
        if lead.status in {"new", "researched", "pending_review", "approved"}:
            lead.status = "contacted"
        record_activity(
            db,
            lead,
            activity_type="message_sent",
            description="Mensaje enviado por el canal configurado.",
            metadata={"message_id": message.id, "provider": result.provider},
            commit=False,
        )
    else:
        record_activity(
            db,
            lead,
            activity_type="message_simulated",
            description="Mensaje generado en modo consola; no se envió realmente.",
            metadata={"message_id": message.id, "provider": result.provider},
            commit=False,
        )

    db.commit()
    db.refresh(message)
    return message, result


def mark_message_sent(db: Session, message: OutreachMessage) -> OutreachMessage:
    if message.status == "sent":
        raise MessageStateError("El mensaje ya está marcado como enviado.")
    if message.status != "approved":
        raise MessageStateError("El mensaje debe estar aprobado antes de marcarse como enviado.")

    lead = db.get(Lead, message.lead_id)
    if lead is not None:
        company = db.get(Company, lead.company_id)
        contact = db.get(Contact, message.contact_id) if message.contact_id else None
        if contact is None and company is not None:
            contact = get_whatsapp_contact(db, company.id)
        if contact is not None and contact.verification_status == "invalid":
            raise MessageBlockedError("El contacto está marcado como inválido.")
        if company is not None and contact is not None and contact.company_id != company.id:
            raise MessageBlockedError("El contacto no pertenece a la empresa del lead.")
        if company is not None:
            _ensure_not_blocked(db, lead=lead, company_id=company.id, contact=contact)

    message.status = "sent"
    message.sent_at = utcnow()
    message.delivery_status = "manual"
    message.provider_message_id = None

    if lead is not None:
        if lead.status in {"new", "researched", "pending_review", "approved"}:
            lead.status = "contacted"
        record_activity(
            db,
            lead,
            activity_type="message_sent_manually",
            description="Mensaje marcado como enviado manualmente.",
            metadata={"message_id": message.id},
            commit=False,
        )
    db.commit()
    db.refresh(message)
    return message
