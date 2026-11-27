"""Ejecución de búsquedas y persistencia de resultados OSM.

Las búsquedas se ejecutan por provincia y rubro. Un fallo del proveedor deja la
búsqueda en `failed`; nunca se generan empresas a partir de errores.
"""

from __future__ import annotations

import hashlib
import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import PROVINCE_CODES
from app.core.logging import get_logger
from app.models import Company, CompanySector, CompanySource, Contact, SearchRun, Sector
from app.providers.discovery import get_discovery_provider
from app.providers.discovery.base import (
    CompanyDiscoveryProvider,
    DiscoveredCompany,
    DiscoveryProviderError,
)
from app.services.contacts import normalize_contact_value, normalize_domain, normalize_website
from app.services.deduplication import find_duplicate, normalize_name
from app.utils import utcnow

logger = get_logger(__name__)


class DiscoveryConfigurationError(RuntimeError):
    """La búsqueda no tiene parámetros ejecutables en Fase 2A."""


def _source_payload(
    company_id: int,
    result: DiscoveredCompany,
    run_id: int,
) -> CompanySource:
    tags_json = json.dumps(result.tags, sort_keys=True, ensure_ascii=False)
    return CompanySource(
        company_id=company_id,
        source_type="openstreetmap",
        source_url=result.source_url,
        title=result.name,
        evidence_excerpt=tags_json[:2000],
        collected_at=utcnow(),
        confidence=None,
        content_hash=hashlib.sha256(tags_json.encode("utf-8")).hexdigest(),
        search_run_id=run_id,
    )


def _link_existing_company(
    db: Session,
    company_id: int,
    result: DiscoveredCompany,
    run_id: int,
) -> None:
    existing = db.scalar(
        select(CompanySource).where(
            CompanySource.company_id == company_id,
            CompanySource.source_url == result.source_url,
            CompanySource.search_run_id == run_id,
        )
    )
    if existing is None:
        db.add(_source_payload(company_id, result, run_id))


def _add_result_contact(
    db: Session,
    *,
    company_id: int,
    source_id: int,
    contact_type: str,
    value: str | None,
    errors: list[str],
    company_name: str,
) -> None:
    if not value or not value.strip():
        return
    try:
        normalized = normalize_contact_value(contact_type, value)
    except ValueError as exc:
        errors.append(f"{company_name}: contacto {contact_type} inválido ({exc})")
        return

    exists = db.scalar(
        select(Contact.id).where(
            Contact.company_id == company_id,
            Contact.contact_type == contact_type,
            Contact.normalized_value == normalized,
        )
    )
    if exists is not None:
        return

    already_primary = db.scalar(
        select(Contact.id).where(
            Contact.company_id == company_id,
            Contact.contact_type == contact_type,
        )
    )
    db.add(
        Contact(
            company_id=company_id,
            contact_type=contact_type,
            original_value=value.strip(),
            normalized_value=normalized,
            label="OpenStreetMap",
            is_primary=already_primary is None,
            verification_status="published",
            source_id=source_id,
            do_not_contact=False,
        )
    )


def _persist_result(
    db: Session,
    *,
    result: DiscoveredCompany,
    run_id: int,
    sectors_by_slug: dict[str, Sector],
    errors: list[str],
) -> str:
    """Guarda una empresa. Devuelve created, duplicate o possible_duplicate."""
    duplicate = find_duplicate(
        db,
        name=result.name,
        website=result.website,
        phone=result.phone,
        provider_source_url=result.source_url,
        locality=result.locality,
        province=result.province,
    )
    if duplicate is not None and duplicate.is_exact:
        _link_existing_company(db, duplicate.company_id, result, run_id)
        return "duplicate"

    try:
        website = normalize_website(result.website) if result.website else None
    except ValueError:
        website = None

    company = Company(
        name=result.name.strip(),
        normalized_name=normalize_name(result.name),
        description=(result.description or "").strip()[:2000],
        website=website,
        normalized_domain=normalize_domain(website),
        province=result.province,
        locality=(result.locality or "").strip() or None,
        address=(result.address or "").strip() or None,
        country="Argentina",
        discovery_status="possible_duplicate" if duplicate else "discovered",
    )
    db.add(company)
    db.flush()

    source = _source_payload(company.id, result, run_id)
    db.add(source)
    db.flush()

    for slug in result.sector_slugs:
        sector = sectors_by_slug.get(slug)
        if sector is None:
            continue
        db.add(
            CompanySector(
                company_id=company.id,
                sector_id=sector.id,
                confidence=None,
                source_id=source.id,
            )
        )

    _add_result_contact(
        db,
        company_id=company.id,
        source_id=source.id,
        contact_type="phone",
        value=result.phone,
        errors=errors,
        company_name=result.name,
    )
    _add_result_contact(
        db,
        company_id=company.id,
        source_id=source.id,
        contact_type="email",
        value=result.email,
        errors=errors,
        company_name=result.name,
    )
    _add_result_contact(
        db,
        company_id=company.id,
        source_id=source.id,
        contact_type="whatsapp",
        value=result.whatsapp,
        errors=errors,
        company_name=result.name,
    )

    return "possible_duplicate" if duplicate else "created"


def _current_run(db: Session, run_id: int) -> SearchRun | None:
    current = db.get(SearchRun, run_id)
    if current is not None:
        db.refresh(current)
    return current


def execute_search(
    db: Session,
    run: SearchRun,
    provider: CompanyDiscoveryProvider,
) -> SearchRun:
    refreshed = _current_run(db, run.id)
    if refreshed is None:
        return run
    run = refreshed
    if run.status == "cancelled":
        return run

    config = run.search_config or {}
    province_code = str(config.get("province_code") or "").strip().upper()
    sector_slugs = [str(slug) for slug in (config.get("sector_slugs") or []) if slug]
    keywords = config.get("keywords")
    limit = int(run.limit or config.get("limit") or 50)

    if province_code not in PROVINCE_CODES:
        raise DiscoveryConfigurationError(
            "La búsqueda no tiene una provincia válida. La Fase 2A solo ejecuta "
            "búsquedas provinciales; las campañas nacionales quedan pendientes."
        )
    if not sector_slugs and not keywords:
        raise DiscoveryConfigurationError("La búsqueda no tiene rubros ni palabras clave.")

    run_id = run.id
    run.status = "running"
    run.started_at = utcnow()
    run.finished_at = None
    run.errors = []
    db.commit()

    results = provider.search(
        province_code=province_code,
        sector_slugs=sector_slugs,
        keywords=keywords,
        limit=limit,
    )
    results = results[:limit]

    current = _current_run(db, run_id)
    if current is None or current.status == "cancelled":
        return current or run

    sectors_by_slug = {sector.slug: sector for sector in db.scalars(select(Sector))}
    errors: list[str] = []
    created = 0
    duplicates = 0

    for result in results:
        current = _current_run(db, run_id)
        if current is None or current.status == "cancelled":
            return current or run

        try:
            outcome = _persist_result(
                db,
                result=result,
                run_id=run_id,
                sectors_by_slug=sectors_by_slug,
                errors=errors,
            )
            db.commit()
        except Exception as exc:
            db.rollback()
            errors.append(f"{result.name}: no se pudo guardar ({exc.__class__.__name__})")
            logger.warning("No se pudo guardar %s: %s", result.name, exc)
            continue

        if outcome == "duplicate":
            duplicates += 1
        else:
            created += 1

    current = _current_run(db, run_id)
    if current is None:
        return run
    if current.status == "cancelled":
        return current

    current.records_found = len(results)
    current.new_companies = created
    current.duplicates = duplicates
    current.errors = errors[:100]
    current.status = "completed"
    current.finished_at = utcnow()
    db.commit()
    db.refresh(current)
    return current


def _fail_run(db: Session, run_id: int, message: str) -> None:
    db.rollback()
    run = db.get(SearchRun, run_id)
    if run is None or run.status == "cancelled":
        return
    run.status = "failed"
    run.errors = [message[:1000]]
    run.finished_at = utcnow()
    db.commit()


def process_search_run_job(
    db: Session,
    payload: dict[str, Any],
    provider: CompanyDiscoveryProvider | None = None,
) -> dict[str, Any]:
    try:
        run_id = int(payload.get("search_run_id", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError("El job no tiene un search_run_id válido.") from exc

    run = db.get(SearchRun, run_id)
    if run is None:
        raise ValueError(f"La búsqueda {run_id} no existe.")

    if run.status == "cancelled":
        return {"search_run_id": run_id, "status": "cancelled"}

    provider = provider or get_discovery_provider(str(payload.get("provider", "overpass")))

    try:
        run = execute_search(db, run, provider)
    except DiscoveryConfigurationError as exc:
        _fail_run(db, run_id, str(exc))
        return {"search_run_id": run_id, "status": "failed", "error": str(exc)}
    except DiscoveryProviderError as exc:
        _fail_run(db, run_id, str(exc))
        raise
    except Exception as exc:
        logger.exception("Error inesperado en la búsqueda %s", run_id)
        _fail_run(db, run_id, f"Error inesperado: {exc.__class__.__name__}")
        raise

    return {
        "search_run_id": run_id,
        "status": run.status,
        "records_found": run.records_found,
        "new_companies": run.new_companies,
        "duplicates": run.duplicates,
        "errors": run.errors,
    }
