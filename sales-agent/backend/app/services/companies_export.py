"""Exportación CSV de empresas para Excel."""

from __future__ import annotations

import csv
import io
from collections.abc import Iterable

from app.models import Company, CompanySource, Contact, Sector

EXPORT_HEADERS = (
    "ID",
    "Nombre",
    "Descripción",
    "Sitio web",
    "Provincia",
    "Localidad",
    "Dirección",
    "Estado",
    "Rubros",
    "Teléfono principal",
    "Email principal",
    "WhatsApp",
    "Fuente",
    "Creada",
)

_DANGEROUS_PREFIXES = ("=", "+", "-", "@", "\t", "\r", "\n")


def neutralize_cell(value: object) -> str:
    """Evita que Excel interprete un dato como fórmula, sin tocar la base."""
    text = "" if value is None else str(value)
    candidate = text.lstrip(" \t\r\n")
    if candidate.startswith(_DANGEROUS_PREFIXES):
        return f"'{text}"
    return text


def _primary_contact(contacts: Iterable[Contact], contact_type: str) -> str:
    for contact in contacts:
        if contact.contact_type == contact_type and not contact.do_not_contact:
            return contact.normalized_value
    return ""


def build_rows(
    companies: list[Company],
    *,
    contacts: dict[int, list[Contact]],
    sectors: dict[int, list[Sector]],
    sources: dict[int, list[CompanySource]],
) -> list[list[str]]:
    rows: list[list[str]] = []
    for company in companies:
        company_contacts = contacts.get(company.id, [])
        company_sources = sources.get(company.id, [])
        source = company_sources[0] if company_sources else None
        rows.append(
            [
                neutralize_cell(company.id),
                neutralize_cell(company.name),
                neutralize_cell(company.description),
                neutralize_cell(company.website),
                neutralize_cell(company.province),
                neutralize_cell(company.locality),
                neutralize_cell(company.address),
                neutralize_cell(company.discovery_status),
                neutralize_cell("; ".join(sector.name for sector in sectors.get(company.id, []))),
                neutralize_cell(_primary_contact(company_contacts, "phone")),
                neutralize_cell(_primary_contact(company_contacts, "email")),
                neutralize_cell(_primary_contact(company_contacts, "whatsapp")),
                neutralize_cell(
                    f"{source.source_type}: {source.source_url}" if source is not None else ""
                ),
                neutralize_cell(company.created_at.isoformat() if company.created_at else ""),
            ]
        )
    return rows


def render_csv(rows: list[list[str]]) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow(EXPORT_HEADERS)
    writer.writerows(rows)
    return "\ufeff" + buffer.getvalue()
