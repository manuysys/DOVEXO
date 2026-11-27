"""Alta, corrección y contactos de empresas."""

from __future__ import annotations

import hashlib
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.constants import (
    COMPANY_DISCOVERY_STATUSES,
    CONTACT_TYPES,
    CONTACT_VERIFICATION_STATUSES,
    PROVINCE_NAME_BY_CODE,
    PROVINCES,
)
from app.models import Company, CompanySector, CompanySource, Contact, Sector
from app.services.contacts import (
    normalize_contact_value,
    normalize_domain,
    normalize_phone,
    normalize_website,
)
from app.services.deduplication import DuplicateMatch, find_duplicate, normalize_name
from app.utils import utcnow
from app.utils.text import fold_text

MANUAL_SOURCE_URL = "manual://alta-manual"


class CompanyValidationError(ValueError):
    pass


class DuplicateCompanyError(Exception):
    def __init__(self, match: DuplicateMatch) -> None:
        super().__init__("Ya existe una empresa con los mismos datos.")
        self.match = match


class ContactConflictError(Exception):
    pass


def canonical_province(value: str | None) -> str | None:
    if value is None:
        return None
    raw = value.strip()
    if not raw:
        return None
    if raw.upper() in PROVINCE_NAME_BY_CODE:
        return PROVINCE_NAME_BY_CODE[raw.upper()]

    folded = fold_text(raw)
    for province in PROVINCES:
        if fold_text(province["name"]) == folded:
            return province["name"]
    raise CompanyValidationError(f"Provincia desconocida: {value}")


def resolve_sectors(db: Session, slugs: list[str]) -> list[Sector]:
    unique = list(dict.fromkeys(slug.strip() for slug in slugs if slug.strip()))
    if not unique:
        raise CompanyValidationError("Indicá al menos un rubro.")

    sectors = list(
        db.scalars(
            select(Sector).where(
                Sector.slug.in_(unique),
                Sector.is_active.is_(True),
            )
        )
    )
    found = {sector.slug for sector in sectors}
    unknown = sorted(set(unique) - found)
    if unknown:
        raise CompanyValidationError(f"Rubros desconocidos: {', '.join(unknown)}")
    return sectors


def _manual_source(
    company: Company,
    website: str | None,
    *,
    source_type: str = "manual",
    source_label: str = "Alta manual",
    source_reference: str | None = None,
) -> CompanySource:
    if website:
        source_url = website
    elif source_reference:
        source_url = f"import:{source_reference}"
    else:
        source_url = MANUAL_SOURCE_URL

    evidence = (
        f"Datos importados desde {source_reference}."
        if source_reference
        else "Datos ingresados manualmente desde la API."
    )
    return CompanySource(
        company_id=company.id,
        source_type=source_type,
        source_url=source_url,
        title=source_label[:300],
        evidence_excerpt=evidence,
        collected_at=utcnow(),
        confidence=None,
        content_hash=hashlib.sha256(
            f"{source_type}|{company.id}|{company.name}".encode()
        ).hexdigest(),
    )


def create_manual_company(
    db: Session,
    *,
    name: str,
    sector_slugs: list[str],
    website: str | None = None,
    province: str | None = None,
    locality: str | None = None,
    address: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    source_type: str = "manual",
    source_label: str = "Alta manual",
    source_reference: str | None = None,
) -> tuple[Company, DuplicateMatch | None]:
    clean_name = name.strip()
    if len(clean_name) < 2:
        raise CompanyValidationError("El nombre de la empresa es demasiado corto.")

    clean_website = normalize_website(website) if website and website.strip() else None
    clean_province = canonical_province(province)
    clean_locality = (locality or "").strip() or None
    clean_address = (address or "").strip() or None

    sectors = resolve_sectors(db, sector_slugs)

    normalized_phone: str | None = None
    if phone and phone.strip():
        normalized_phone = normalize_phone(phone)

    normalized_email: str | None = None
    if email and email.strip():
        normalized_email = normalize_contact_value("email", email)

    duplicate = find_duplicate(
        db,
        name=clean_name,
        website=clean_website,
        phone=normalized_phone,
        locality=clean_locality,
        province=clean_province,
    )
    if duplicate is not None and duplicate.is_exact:
        raise DuplicateCompanyError(duplicate)

    company = Company(
        name=clean_name,
        normalized_name=normalize_name(clean_name),
        description="",
        website=clean_website,
        normalized_domain=normalize_domain(clean_website),
        province=clean_province,
        locality=clean_locality,
        address=clean_address,
        country="Argentina",
        discovery_status=(
            "possible_duplicate"
            if duplicate
            else ("imported" if source_type == "csv_import" else "manual")
        ),
    )
    db.add(company)
    db.flush()

    source = _manual_source(
        company,
        clean_website,
        source_type=source_type,
        source_label=source_label,
        source_reference=source_reference,
    )
    db.add(source)
    db.flush()

    for sector in sectors:
        db.add(
            CompanySector(
                company_id=company.id,
                sector_id=sector.id,
                confidence=None,
                source_id=source.id,
            )
        )

    if normalized_phone:
        db.add(
            Contact(
                company_id=company.id,
                contact_type="phone",
                original_value=phone.strip(),
                normalized_value=normalized_phone,
                label=source_label,
                is_primary=True,
                verification_status="unverified",
                source_id=source.id,
                do_not_contact=False,
            )
        )
    if normalized_email:
        db.add(
            Contact(
                company_id=company.id,
                contact_type="email",
                original_value=email.strip(),
                normalized_value=normalized_email,
                label=source_label,
                is_primary=True,
                verification_status="unverified",
                source_id=source.id,
                do_not_contact=False,
            )
        )

    db.commit()
    db.refresh(company)
    return company, duplicate


def update_company(
    db: Session,
    company: Company,
    changes: dict[str, Any],
) -> Company:
    if "name" in changes:
        clean_name = str(changes["name"]).strip()
        if len(clean_name) < 2:
            raise CompanyValidationError("El nombre de la empresa es demasiado corto.")
        company.name = clean_name
        company.normalized_name = normalize_name(clean_name)

    if "website" in changes:
        website = changes["website"]
        website = website.strip() if isinstance(website, str) else None
        company.website = normalize_website(website) if website else None
        company.normalized_domain = normalize_domain(company.website)

    if "province" in changes:
        company.province = canonical_province(changes["province"])

    for field in ("locality", "address", "legal_name", "description", "company_size_estimate"):
        if field in changes:
            value = changes[field]
            text = value.strip() if isinstance(value, str) else None
            if field == "description":
                company.description = text or ""
            else:
                setattr(company, field, text or None)

    if "discovery_status" in changes:
        status_value = str(changes["discovery_status"]).strip()
        if status_value not in COMPANY_DISCOVERY_STATUSES:
            raise CompanyValidationError(f"Estado de descubrimiento inválido: {status_value}")
        company.discovery_status = status_value

    if "sector_slugs" in changes:
        sectors = resolve_sectors(db, list(changes["sector_slugs"]))
        db.execute(delete(CompanySector).where(CompanySector.company_id == company.id))
        for sector in sectors:
            db.add(
                CompanySector(
                    company_id=company.id,
                    sector_id=sector.id,
                    confidence=None,
                    source_id=None,
                )
            )

    db.commit()
    db.refresh(company)
    return company


def add_contact(
    db: Session,
    company: Company,
    *,
    contact_type: str,
    value: str,
    label: str | None = None,
    is_primary: bool = False,
    verification_status: str = "unverified",
) -> Contact:
    if contact_type not in CONTACT_TYPES:
        raise CompanyValidationError(f"Tipo de contacto inválido: {contact_type}")
    if verification_status not in CONTACT_VERIFICATION_STATUSES:
        raise CompanyValidationError(f"Estado de verificación inválido: {verification_status}")

    normalized = normalize_contact_value(contact_type, value)
    existing = db.scalar(
        select(Contact).where(
            Contact.company_id == company.id,
            Contact.contact_type == contact_type,
            Contact.normalized_value == normalized,
        )
    )
    if existing is not None:
        raise ContactConflictError("Ese contacto ya existe para la empresa.")

    if is_primary:
        for contact in db.scalars(
            select(Contact).where(
                Contact.company_id == company.id,
                Contact.contact_type == contact_type,
            )
        ):
            contact.is_primary = False

    contact = Contact(
        company_id=company.id,
        contact_type=contact_type,
        original_value=value.strip(),
        normalized_value=normalized,
        label=(label or "").strip() or None,
        is_primary=is_primary,
        verification_status=verification_status,
        source_id=None,
        do_not_contact=False,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact
