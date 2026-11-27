"""Consultas de conversaciones de WhatsApp."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Company, Lead, WhatsAppMessage, WhatsAppThread


def list_threads(
    db: Session,
    *,
    company_id: int | None = None,
    lead_id: int | None = None,
    phone: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[tuple[WhatsAppThread, str | None, str | None]]:
    conditions = []
    if company_id is not None:
        conditions.append(WhatsAppThread.company_id == company_id)
    if lead_id is not None:
        conditions.append(WhatsAppThread.lead_id == lead_id)
    if phone:
        conditions.append(WhatsAppThread.phone == phone)

    rows = db.execute(
        select(WhatsAppThread, Company.name, Lead.status)
        .outerjoin(Company, Company.id == WhatsAppThread.company_id)
        .outerjoin(Lead, Lead.id == WhatsAppThread.lead_id)
        .where(*conditions)
        .order_by(
            WhatsAppThread.last_message_at.desc().nullslast(),
            WhatsAppThread.id.desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    return [(thread, company_name, lead_status) for thread, company_name, lead_status in rows]


def message_counts(db: Session, thread_ids: list[int]) -> dict[int, int]:
    if not thread_ids:
        return {}
    counts: dict[int, int] = defaultdict(int)
    for thread_id, count in db.execute(
        select(WhatsAppMessage.thread_id, func.count())
        .where(WhatsAppMessage.thread_id.in_(thread_ids))
        .group_by(WhatsAppMessage.thread_id)
    ):
        counts[thread_id] = int(count)
    return counts


def get_thread(db: Session, thread_id: int) -> WhatsAppThread | None:
    return db.get(WhatsAppThread, thread_id)


def get_thread_messages(db: Session, thread_id: int) -> list[WhatsAppMessage]:
    return list(
        db.scalars(
            select(WhatsAppMessage)
            .where(WhatsAppMessage.thread_id == thread_id)
            .order_by(WhatsAppMessage.created_at.asc(), WhatsAppMessage.id.asc())
        )
    )


def last_messages(db: Session, thread_ids: list[int]) -> dict[int, str]:
    result: dict[int, str] = {}
    if not thread_ids:
        return result
    for message in db.scalars(
        select(WhatsAppMessage)
        .where(WhatsAppMessage.thread_id.in_(thread_ids))
        .order_by(WhatsAppMessage.created_at.desc(), WhatsAppMessage.id.desc())
    ):
        result.setdefault(message.thread_id, message.body)
    return result
