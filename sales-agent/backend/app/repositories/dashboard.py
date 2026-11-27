"""Consultas agregadas del dashboard.

Definiciones usadas:
- `new_companies`: empresas creadas en los últimos 7 días.
- `investigated_companies`: empresas con `last_enriched_at` registrado.
- `published_contacts`: contactos en estado publicado o verificado y no
  bloqueados. `published_whatsapp` aplica el mismo criterio a WhatsApp.
- Los conteos de pipeline incluyen el estado indicado y los estados posteriores
  (por ejemplo, `contacted_leads` incluye respondidos y reuniones).
"""

from __future__ import annotations

from datetime import timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.constants import (
    LEAD_APPROVED_STATUSES,
    LEAD_CONTACTED_STATUSES,
    LEAD_MEETING_STATUSES,
    LEAD_RESPONSE_STATUSES,
    PUBLISHED_CONTACT_STATUSES,
)
from app.models import Activity, Campaign, Company, Contact, Job, Lead, Product
from app.schemas.dashboard import DashboardMetrics
from app.utils import utcnow


def _count(db: Session, stmt: object) -> int:
    return int(db.scalar(stmt) or 0)  # type: ignore[arg-type]


def get_metrics(db: Session) -> DashboardMetrics:
    published = Contact.verification_status.in_(PUBLISHED_CONTACT_STATUSES)
    not_blocked = Contact.do_not_contact.is_(False)

    return DashboardMetrics(
        companies=_count(db, select(func.count()).select_from(Company)),
        new_companies=_count(
            db,
            select(func.count())
            .select_from(Company)
            .where(Company.created_at >= utcnow() - timedelta(days=7)),
        ),
        investigated_companies=_count(
            db,
            select(func.count()).select_from(Company).where(Company.last_enriched_at.is_not(None)),
        ),
        leads_pending_review=_count(
            db,
            select(func.count()).select_from(Lead).where(Lead.status == "pending_review"),
        ),
        published_contacts=_count(
            db, select(func.count()).select_from(Contact).where(published, not_blocked)
        ),
        published_whatsapp=_count(
            db,
            select(func.count())
            .select_from(Contact)
            .where(Contact.contact_type == "whatsapp", published, not_blocked),
        ),
        approved_leads=_count(
            db,
            select(func.count()).select_from(Lead).where(Lead.status.in_(LEAD_APPROVED_STATUSES)),
        ),
        contacted_leads=_count(
            db,
            select(func.count()).select_from(Lead).where(Lead.status.in_(LEAD_CONTACTED_STATUSES)),
        ),
        responses=_count(
            db,
            select(func.count()).select_from(Lead).where(Lead.status.in_(LEAD_RESPONSE_STATUSES)),
        ),
        meetings=_count(
            db,
            select(func.count()).select_from(Lead).where(Lead.status.in_(LEAD_MEETING_STATUSES)),
        ),
        products=_count(db, select(func.count()).select_from(Product)),
        campaigns=_count(db, select(func.count()).select_from(Campaign)),
        jobs_pending=_count(
            db, select(func.count()).select_from(Job).where(Job.status == "pending")
        ),
        jobs_running=_count(
            db, select(func.count()).select_from(Job).where(Job.status == "running")
        ),
        jobs_failed=_count(db, select(func.count()).select_from(Job).where(Job.status == "failed")),
    )


def list_recent_activities(db: Session, *, limit: int = 20) -> list[Activity]:
    stmt = select(Activity).order_by(Activity.occurred_at.desc(), Activity.id.desc()).limit(limit)
    return list(db.scalars(stmt))
