"""Creación y control de búsquedas."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import PROVINCE_CODES, PROVINCE_NAME_BY_CODE
from app.models import Campaign, Job, SearchRun, Sector
from app.utils import utcnow


class SearchRunValidationError(ValueError):
    pass


class SearchRunStateError(Exception):
    pass


def validate_search_request(
    db: Session,
    *,
    province_code: str,
    sector_slugs: list[str],
    campaign_id: int | None,
) -> list[Sector]:
    code = province_code.strip().upper()
    if code not in PROVINCE_CODES:
        raise SearchRunValidationError(f"Provincia desconocida: {province_code}")

    unique_slugs = list(dict.fromkeys(slug.strip() for slug in sector_slugs if slug.strip()))
    if not unique_slugs:
        raise SearchRunValidationError("Indicá al menos un rubro.")

    sectors = list(
        db.scalars(
            select(Sector).where(
                Sector.slug.in_(unique_slugs),
                Sector.is_active.is_(True),
            )
        )
    )
    found = {sector.slug for sector in sectors}
    unknown = sorted(set(unique_slugs) - found)
    if unknown:
        raise SearchRunValidationError(f"Rubros desconocidos: {', '.join(unknown)}")

    if campaign_id is not None and db.get(Campaign, campaign_id) is None:
        raise SearchRunValidationError("La campaña indicada no existe.")

    return sectors


def create_search_run(
    db: Session,
    *,
    province_code: str,
    sector_slugs: list[str],
    keywords: str | None = None,
    limit: int = 50,
    campaign_id: int | None = None,
) -> SearchRun:
    sectors = validate_search_request(
        db,
        province_code=province_code,
        sector_slugs=sector_slugs,
        campaign_id=campaign_id,
    )
    code = province_code.strip().upper()
    clean_keywords = (keywords or "").strip() or None
    clean_slugs = [sector.slug for sector in sectors]

    search_config = {
        "province_code": code,
        "sector_slugs": clean_slugs,
        "keywords": clean_keywords,
        "limit": limit,
    }
    run = SearchRun(
        campaign_id=campaign_id,
        provider="overpass",
        query=clean_keywords or f"Rubros: {', '.join(clean_slugs)}",
        location=PROVINCE_NAME_BY_CODE[code],
        sector=",".join(clean_slugs),
        status="pending",
        search_config=search_config,
        limit=limit,
    )
    db.add(run)
    db.flush()

    db.add(
        Job(
            job_type="search_run",
            payload={"search_run_id": run.id},
            status="pending",
        )
    )
    db.commit()
    db.refresh(run)
    return run


def retry_search_run(db: Session, run: SearchRun) -> SearchRun:
    if run.status in {"pending", "running"}:
        raise SearchRunStateError("La búsqueda ya está pendiente o en ejecución.")

    for job in db.scalars(select(Job).where(Job.job_type == "search_run", Job.status == "pending")):
        if (job.payload or {}).get("search_run_id") == run.id:
            job.status = "cancelled"
            job.finished_at = utcnow()

    run.status = "pending"
    run.records_found = 0
    run.new_companies = 0
    run.duplicates = 0
    run.errors = []
    run.started_at = None
    run.finished_at = None
    db.add(
        Job(
            job_type="search_run",
            payload={"search_run_id": run.id},
            status="pending",
        )
    )
    db.commit()
    db.refresh(run)
    return run


def cancel_search_run(db: Session, run: SearchRun) -> SearchRun:
    if run.status in {"completed", "failed", "cancelled"}:
        raise SearchRunStateError("La búsqueda ya finalizó y no se puede cancelar.")

    run.status = "cancelled"
    run.finished_at = utcnow()

    for job in db.scalars(select(Job).where(Job.job_type == "search_run", Job.status == "pending")):
        if (job.payload or {}).get("search_run_id") == run.id:
            job.status = "cancelled"
            job.finished_at = utcnow()

    db.commit()
    db.refresh(run)
    return run
