"""Lista de no contacto y verificación de supresiones."""

from __future__ import annotations

import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Company, SuppressionEntry
from app.services.contacts import normalize_email, normalize_phone


def company_suppression_key(company_id: int) -> str:
    return f"company:{company_id}"


def is_company_suppressed(db: Session, company_id: int | None) -> bool:
    if company_id is None:
        return False
    return (
        db.scalar(
            select(SuppressionEntry.id)
            .where(
                SuppressionEntry.company_id == company_id,
                SuppressionEntry.normalized_contact == company_suppression_key(company_id),
            )
            .limit(1)
        )
        is not None
    )


def is_contact_suppressed(db: Session, normalized_contact: str | None) -> bool:
    if not normalized_contact:
        return False
    return (
        db.scalar(
            select(SuppressionEntry.id)
            .where(SuppressionEntry.normalized_contact == normalized_contact)
            .limit(1)
        )
        is not None
    )


def is_blocked(
    db: Session,
    *,
    company_id: int | None = None,
    phone: str | None = None,
    email: str | None = None,
) -> bool:
    if is_company_suppressed(db, company_id):
        return True
    if phone and is_contact_suppressed(db, phone):
        return True
    return bool(email and is_contact_suppressed(db, email))


def create_suppression(
    db: Session,
    *,
    reason: str = "",
    company_id: int | None = None,
    phone: str | None = None,
    email: str | None = None,
    normalized_contact: str | None = None,
) -> tuple[SuppressionEntry, bool]:
    if company_id is not None and db.get(Company, company_id) is None:
        raise ValueError("La empresa indicada no existe.")

    provided = [value for value in (phone, email, normalized_contact) if value and value.strip()]
    if len(provided) > 1:
        raise ValueError("Indicá solo un teléfono, email o contacto normalizado.")

    if phone and phone.strip():
        normalized = normalize_phone(phone)
    elif email and email.strip():
        normalized = normalize_email(email)
    elif normalized_contact and normalized_contact.strip():
        raw = normalized_contact.strip()
        if "@" in raw:
            normalized = normalize_email(raw)
        elif re.fullmatch(r"[+\d\s().-]{6,}", raw):
            normalized = normalize_phone(raw)
        else:
            normalized = raw.lower()
    elif company_id is not None:
        normalized = company_suppression_key(company_id)
    else:
        raise ValueError("Indicá una empresa, teléfono, email o contacto.")

    existing = db.scalar(
        select(SuppressionEntry).where(SuppressionEntry.normalized_contact == normalized)
    )
    if existing is not None:
        return existing, False

    entry = SuppressionEntry(
        company_id=company_id,
        normalized_contact=normalized,
        reason=(reason or "").strip()[:500],
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry, True
