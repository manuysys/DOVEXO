"""Consultas de empresas, contactos y fuentes."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Company, CompanySector, CompanySource, Contact, Sector
from app.utils.text import fold_text


def _company_conditions(
    *,
    search_run_id: int | None,
    query: str | None,
    province: str | None,
    sector: str | None,
    discovery_status: str | None = None,
    has_website: bool | None = None,
) -> list[object]:
    conditions: list[object] = []

    if has_website is True:
        conditions.append(Company.website.is_not(None))
        conditions.append(Company.website != "")
    elif has_website is False:
        conditions.append(or_(Company.website.is_(None), Company.website == ""))

    if discovery_status:
        conditions.append(Company.discovery_status == discovery_status)

    if search_run_id is not None:
        conditions.append(
            Company.id.in_(
                select(CompanySource.company_id).where(CompanySource.search_run_id == search_run_id)
            )
        )

    if sector:
        conditions.append(
            Company.id.in_(
                select(CompanySector.company_id)
                .join(Sector, Sector.id == CompanySector.sector_id)
                .where(Sector.slug == sector)
            )
        )

    if province:
        conditions.append(func.lower(Company.province) == province.strip().lower())

    term = (query or "").strip()
    if term:
        folded = fold_text(term)
        conditions.append(
            or_(
                Company.name.like(f"%{term}%"),
                Company.normalized_name.like(f"%{folded}%") if folded else Company.id.is_(None),
            )
        )

    return conditions


def list_companies(
    db: Session,
    *,
    search_run_id: int | None = None,
    query: str | None = None,
    province: str | None = None,
    sector: str | None = None,
    discovery_status: str | None = None,
    has_website: bool | None = None,
    limit: int | None = 20,
    offset: int = 0,
) -> tuple[list[Company], int]:
    conditions = _company_conditions(
        search_run_id=search_run_id,
        query=query,
        province=province,
        sector=sector,
        discovery_status=discovery_status,
        has_website=has_website,
    )

    total = int(db.scalar(select(func.count()).select_from(Company).where(*conditions)) or 0)
    stmt = (
        select(Company)
        .where(*conditions)
        .order_by(Company.created_at.desc(), Company.id.desc())
        .offset(offset)
    )
    if limit is not None:
        stmt = stmt.limit(limit)
    return list(db.scalars(stmt)), total


def get_company(db: Session, company_id: int) -> Company | None:
    return db.get(Company, company_id)


def get_company_sources(db: Session, company_id: int) -> list[CompanySource]:
    return list(
        db.scalars(
            select(CompanySource)
            .where(CompanySource.company_id == company_id)
            .order_by(CompanySource.collected_at.desc(), CompanySource.id.desc())
        )
    )


def get_company_contacts(db: Session, company_id: int) -> list[Contact]:
    return list(
        db.scalars(
            select(Contact)
            .where(Contact.company_id == company_id)
            .order_by(Contact.is_primary.desc(), Contact.id)
        )
    )


def get_company_sectors(db: Session, company_id: int) -> list[Sector]:
    return list(
        db.scalars(
            select(Sector)
            .join(CompanySector, CompanySector.sector_id == Sector.id)
            .where(CompanySector.company_id == company_id)
            .order_by(Sector.name)
        )
    )


def load_company_relations(
    db: Session,
    company_ids: list[int],
) -> tuple[
    dict[int, list[Contact]],
    dict[int, list[Sector]],
    dict[int, int],
]:
    contacts: dict[int, list[Contact]] = defaultdict(list)
    sectors: dict[int, list[Sector]] = defaultdict(list)
    source_counts: dict[int, int] = defaultdict(int)

    if not company_ids:
        return contacts, sectors, source_counts

    for contact in db.scalars(
        select(Contact)
        .where(Contact.company_id.in_(company_ids))
        .order_by(Contact.is_primary.desc(), Contact.id)
    ):
        contacts[contact.company_id].append(contact)

    for company_sector, sector in db.execute(
        select(CompanySector, Sector)
        .join(Sector, Sector.id == CompanySector.sector_id)
        .where(CompanySector.company_id.in_(company_ids))
    ):
        sectors[company_sector.company_id].append(sector)

    for company_id, count in db.execute(
        select(CompanySource.company_id, func.count())
        .where(CompanySource.company_id.in_(company_ids))
        .group_by(CompanySource.company_id)
    ):
        source_counts[company_id] = int(count)

    for company_id in sectors:
        sectors[company_id].sort(key=lambda sector: sector.name)

    return contacts, sectors, source_counts


def load_company_sources(
    db: Session,
    company_ids: list[int],
) -> dict[int, list[CompanySource]]:
    sources: dict[int, list[CompanySource]] = defaultdict(list)
    if not company_ids:
        return sources
    for source in db.scalars(
        select(CompanySource)
        .where(CompanySource.company_id.in_(company_ids))
        .order_by(CompanySource.collected_at.desc(), CompanySource.id.desc())
    ):
        sources[source.company_id].append(source)
    return sources
