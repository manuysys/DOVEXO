"""Deduplicación de empresas.

Orden de comparación del SPEC §8: dominio, teléfono, ID de proveedor, nombre
normalizado + localidad y, por último, similitud difusa. Las coincidencias
exactas se omiten; las difusas se guardan como `possible_duplicate` para
revisión humana y nunca se fusionan automáticamente.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from rapidfuzz import fuzz
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Company, CompanySource, Contact
from app.services.contacts import normalize_domain, normalize_phone
from app.utils.text import fold_text

FUZZY_THRESHOLD = 90.0
FUZZY_CANDIDATE_LIMIT = 200

_LEGAL_SUFFIXES = frozenset(
    {
        "sa",
        "srl",
        "sas",
        "ltda",
        "sociedad",
        "anonima",
        "sh",
        "co",
        "company",
        "empresa",
    }
)


@dataclass(frozen=True, slots=True)
class DuplicateMatch:
    company_id: int
    company_name: str
    reason: str
    is_exact: bool
    similarity: float | None = None


def _fold(value: str) -> str:
    return fold_text(value)


def normalize_name(value: str) -> str:
    tokens = fold_text(re.sub(r"\.", "", value)).split()
    while tokens and tokens[-1] in _LEGAL_SUFFIXES:
        tokens.pop()
    return " ".join(tokens)


def normalize_locality(value: str | None) -> str:
    return _fold(value or "")


def find_duplicate(
    db: Session,
    *,
    name: str,
    website: str | None = None,
    phone: str | None = None,
    provider_source_url: str | None = None,
    locality: str | None = None,
    province: str | None = None,
    exclude_company_id: int | None = None,
) -> DuplicateMatch | None:
    normalized_name = normalize_name(name)
    if not normalized_name:
        return None

    def _company_conditions():
        conditions = []
        if exclude_company_id is not None:
            conditions.append(Company.id != exclude_company_id)
        return conditions

    domain = normalize_domain(website)
    if domain:
        company = db.scalar(
            select(Company)
            .where(Company.normalized_domain == domain, *_company_conditions())
            .limit(1)
        )
        if company is not None:
            return DuplicateMatch(company.id, company.name, "domain", True)

    if phone:
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError:
            normalized_phone = ""
        if normalized_phone:
            company = db.scalar(
                select(Company)
                .join(Contact, Contact.company_id == Company.id)
                .where(
                    Contact.contact_type.in_(("phone", "whatsapp")),
                    Contact.normalized_value == normalized_phone,
                    *_company_conditions(),
                )
                .limit(1)
            )
            if company is not None:
                return DuplicateMatch(company.id, company.name, "phone", True)

    if provider_source_url:
        company = db.scalar(
            select(Company)
            .join(CompanySource, CompanySource.company_id == Company.id)
            .where(
                CompanySource.source_type == "openstreetmap",
                CompanySource.source_url == provider_source_url,
                *_company_conditions(),
            )
            .limit(1)
        )
        if company is not None:
            return DuplicateMatch(company.id, company.name, "provider_id", True)

    normalized_locality = normalize_locality(locality)
    if normalized_locality:
        candidates = db.scalars(
            select(Company)
            .where(Company.normalized_name == normalized_name, *_company_conditions())
            .limit(100)
        )
        for company in candidates:
            if normalize_locality(company.locality) == normalized_locality:
                return DuplicateMatch(company.id, company.name, "name_locality", True)

    if not normalized_locality:
        return None

    candidates = db.scalars(
        select(Company)
        .where(Company.normalized_name != normalized_name, *_company_conditions())
        .order_by(Company.id)
        .limit(FUZZY_CANDIDATE_LIMIT)
    )

    best: DuplicateMatch | None = None
    best_score = 0.0
    for candidate in candidates:
        if normalize_locality(candidate.locality) != normalized_locality:
            continue
        if (
            province
            and candidate.province
            and normalize_name(candidate.province) != normalize_name(province)
        ):
            continue
        score = float(fuzz.WRatio(normalized_name, candidate.normalized_name))
        if score >= FUZZY_THRESHOLD and score > best_score:
            best_score = score
            best = DuplicateMatch(
                candidate.id,
                candidate.name,
                "fuzzy_name_locality",
                False,
                round(score, 1),
            )
    return best
