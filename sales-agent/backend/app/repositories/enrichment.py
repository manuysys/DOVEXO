"""Consultas de hechos, procedencia de contactos y trabajos de enriquecimiento."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import CompanyFact, CompanySource, Contact, Job

ACTIVE_JOB_STATUSES: tuple[str, ...] = ("pending", "running")
ENRICH_JOB_TYPE = "enrich_company"


def get_company_facts(db: Session, company_id: int) -> list[CompanyFact]:
    return list(
        db.scalars(
            select(CompanyFact)
            .where(CompanyFact.company_id == company_id)
            .order_by(CompanyFact.fact_type, CompanyFact.id)
        )
    )


def load_contact_sources(
    db: Session,
    contacts: list[Contact],
) -> dict[int, CompanySource]:
    """Fuentes de los contactos, en una sola consulta (evita N+1)."""
    source_ids = {contact.source_id for contact in contacts if contact.source_id is not None}
    if not source_ids:
        return {}
    sources: dict[int, CompanySource] = {}
    for source in db.scalars(select(CompanySource).where(CompanySource.id.in_(source_ids))):
        sources[source.id] = source
    return sources


def get_source_by_url(
    db: Session,
    *,
    company_id: int,
    source_url: str,
    source_type: str = "website",
) -> CompanySource | None:
    return db.scalar(
        select(CompanySource).where(
            CompanySource.company_id == company_id,
            CompanySource.source_url == source_url,
            CompanySource.source_type == source_type,
        )
    )


def get_contact_by_value(
    db: Session,
    *,
    company_id: int,
    contact_type: str,
    normalized_value: str,
) -> Contact | None:
    return db.scalar(
        select(Contact).where(
            Contact.company_id == company_id,
            Contact.contact_type == contact_type,
            Contact.normalized_value == normalized_value,
        )
    )


def has_contact_of_type(db: Session, *, company_id: int, contact_type: str) -> bool:
    return (
        db.scalar(
            select(Contact.id)
            .where(
                Contact.company_id == company_id,
                Contact.contact_type == contact_type,
            )
            .limit(1)
        )
        is not None
    )


def list_contacts_by_type(
    db: Session,
    *,
    company_id: int,
    contact_type: str,
) -> list[Contact]:
    return list(
        db.scalars(
            select(Contact).where(
                Contact.company_id == company_id,
                Contact.contact_type == contact_type,
            )
        )
    )


def get_fact(
    db: Session,
    *,
    company_id: int,
    fact_type: str,
    normalized_value: str,
    source_url: str,
) -> CompanyFact | None:
    return db.scalar(
        select(CompanyFact).where(
            CompanyFact.company_id == company_id,
            CompanyFact.fact_type == fact_type,
            CompanyFact.normalized_value == normalized_value,
            CompanyFact.source_url == source_url,
        )
    )


def max_fact_confidence(
    db: Session,
    *,
    company_id: int,
    fact_type: str,
    normalized_value: str,
) -> float:
    """Confianza máxima ya registrada para ese hecho, sin importar la URL."""
    values = db.scalars(
        select(CompanyFact.confidence).where(
            CompanyFact.company_id == company_id,
            CompanyFact.fact_type == fact_type,
            CompanyFact.normalized_value == normalized_value,
        )
    )
    return max((value for value in values if value is not None), default=0.0)


def list_enrichment_jobs(db: Session, *, limit: int = 50) -> list[Job]:
    return list(
        db.scalars(
            select(Job).where(Job.job_type == ENRICH_JOB_TYPE).order_by(Job.id.desc()).limit(limit)
        )
    )


def get_enrichment_job(db: Session, job_id: int) -> Job | None:
    job = db.get(Job, job_id)
    if job is None or job.job_type != ENRICH_JOB_TYPE:
        return None
    return job


def list_active_enrichment_jobs(db: Session) -> list[Job]:
    return list(
        db.scalars(
            select(Job).where(
                Job.job_type == ENRICH_JOB_TYPE,
                Job.status.in_(ACTIVE_JOB_STATUSES),
            )
        )
    )


def active_enrichment_company_ids(db: Session) -> dict[int, Job]:
    """Empresas con un trabajo de enriquecimiento pendiente o en ejecución.

    El payload es JSON; se filtra en Python porque la cantidad de trabajos
    activos es chica y así la consulta funciona igual en SQLite y PostgreSQL.
    """
    active: dict[int, Job] = {}
    for job in list_active_enrichment_jobs(db):
        try:
            company_id = int((job.payload or {}).get("company_id", 0))
        except (TypeError, ValueError):
            continue
        active.setdefault(company_id, job)
    return active


def load_job_company_names(db: Session, jobs: list[Job]) -> dict[int, str]:
    from app.models import Company  # import local para evitar ciclos

    company_ids = set()
    for job in jobs:
        try:
            company_ids.add(int((job.payload or {}).get("company_id", 0)))
        except (TypeError, ValueError):
            continue
    company_ids.discard(0)
    if not company_ids:
        return {}
    names: dict[int, str] = defaultdict(str)
    for company_id, name in db.execute(
        select(Company.id, Company.name).where(Company.id.in_(company_ids))
    ):
        names[int(company_id)] = str(name)
    return dict(names)
