"""Scoring determinístico de oportunidades.

Solo se usan datos guardados: sectores, contactos, fuentes, web y descripción.
La compatibilidad y la confianza son valores distintos: una empresa puede ser
muy compatible con información escasa y, por eso, tener baja confianza.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Company, CompanySector, CompanySource, Contact, Lead, Product, Sector
from app.utils.text import fold_text

DEFAULT_FACTORS: tuple[dict[str, Any], ...] = (
    {"key": "sector_affinity", "label": "Afinidad del rubro", "max_points": 30},
    {
        "key": "field_services_evidence",
        "label": "Evidencia de trabajo de campo e instalaciones",
        "max_points": 20,
    },
    {"key": "repairs_maintenance", "label": "Reparaciones y mantenimiento", "max_points": 15},
    {
        "key": "budget_and_scheduling",
        "label": "Gestión de presupuestos, visitas o servicios",
        "max_points": 15,
    },
    {
        "key": "recurring_clients",
        "label": "Señales de operaciones con clientes recurrentes",
        "max_points": 10,
    },
    {
        "key": "commercial_evidence_quality",
        "label": "Calidad de la evidencia comercial",
        "max_points": 10,
    },
)

_REPAIR_TERMS = ("repar", "mantenim", "service", "instalac")
_BUDGET_TERMS = ("presupuesto", "visita", "turno", "agenda", "coordin", "solicitud")
_RECURRING_TERMS = ("cliente", "abono", "contrato", "mensual", "recurrent")


@dataclass(slots=True)
class ScoreResult:
    score: int
    confidence: int
    breakdown: dict[str, Any]
    reasons: list[str]
    evidence_ids: list[int]


def _factor_config(product: Product) -> list[dict[str, Any]]:
    factors = (product.scoring_config or {}).get("factors")
    if not isinstance(factors, list) or not factors:
        return [dict(factor) for factor in DEFAULT_FACTORS]

    cleaned: list[dict[str, Any]] = []
    for factor in factors:
        if not isinstance(factor, dict):
            continue
        key = str(factor.get("key") or "").strip()
        label = str(factor.get("label") or key).strip()
        try:
            max_points = int(factor.get("max_points") or 0)
        except (TypeError, ValueError):
            max_points = 0
        if key and max_points > 0:
            cleaned.append({"key": key, "label": label, "max_points": max_points})
    return cleaned or [dict(factor) for factor in DEFAULT_FACTORS]


def _matches(text: str, terms: tuple[str, ...]) -> list[str]:
    folded = fold_text(text)
    return [term for term in terms if term in folded]


def _company_text(company: Company, sources: list[CompanySource]) -> str:
    parts = [company.description or ""]
    parts.extend(source.evidence_excerpt or "" for source in sources)
    parts.extend(source.title or "" for source in sources)
    return "\n".join(parts)


def _confidence_components(
    company: Company,
    sectors: list[Sector],
    contacts: list[Contact],
    sources: list[CompanySource],
) -> tuple[int, list[dict[str, Any]]]:
    has_contact = any(
        contact.contact_type in {"phone", "whatsapp", "email"} for contact in contacts
    )
    has_published = any(
        contact.verification_status in {"published", "verified"} for contact in contacts
    )
    components = [
        ("Nombre", 10, bool(company.name), "Nombre disponible"),
        ("Provincia", 10, bool(company.province), "Provincia disponible"),
        ("Localidad", 10, bool(company.locality), "Localidad disponible"),
        ("Rubros", 15, bool(sectors), "Rubro disponible"),
        ("Sitio web", 10, bool(company.website), "Sitio web publicado"),
        ("Contacto", 10, has_contact, "Teléfono o email publicado"),
        ("Descripción", 10, bool(company.description), "Descripción disponible"),
        ("Fuentes", 15, bool(sources), "Fuente registrada"),
        ("Contacto verificado", 10, has_published, "Contacto con estado publicado/verificado"),
    ]

    confidence = 0
    breakdown: list[dict[str, Any]] = []
    for label, points, present, reason in components:
        if present:
            confidence += points
        breakdown.append(
            {
                "label": label,
                "points": points if present else 0,
                "max_points": points,
                "reason": reason if present else f"Sin {label.lower()}",
            }
        )

    return min(100, confidence), breakdown


def score_lead(db: Session, lead: Lead, product: Product) -> ScoreResult:
    company = db.get(Company, lead.company_id)
    if company is None:
        raise ValueError("La empresa del lead ya no existe.")

    sectors = list(
        db.scalars(
            select(Sector)
            .join(CompanySector, CompanySector.sector_id == Sector.id)
            .where(CompanySector.company_id == company.id)
            .order_by(Sector.name)
        )
    )
    contacts = list(
        db.scalars(select(Contact).where(Contact.company_id == company.id).order_by(Contact.id))
    )
    sources = list(
        db.scalars(
            select(CompanySource)
            .where(CompanySource.company_id == company.id)
            .order_by(CompanySource.id)
        )
    )

    sector_slugs = {sector.slug for sector in sectors}
    target_slugs = {str(slug) for slug in (product.target_sectors or []) if isinstance(slug, str)}
    matched_slugs = sector_slugs & target_slugs
    evidence_text = _company_text(company, sources)
    source_ids = [source.id for source in sources]

    has_website = bool(company.website)
    has_address = bool(company.address)
    has_locality = bool(company.locality)
    has_phone = any(contact.contact_type in {"phone", "whatsapp"} for contact in contacts)
    has_email = any(contact.contact_type == "email" for contact in contacts)
    has_published = any(
        contact.verification_status in {"published", "verified"} for contact in contacts
    )

    factors: list[dict[str, Any]] = []
    reasons: list[str] = []
    factor_evidence: set[int] = set()

    for config in _factor_config(product):
        key = config["key"]
        label = config["label"]
        max_points = int(config["max_points"])
        points = 0
        reason = "Sin evidencia para este factor."

        if key == "sector_affinity":
            if matched_slugs:
                points = max_points
                names = ", ".join(sector.name for sector in sectors if sector.slug in matched_slugs)
                reason = f"Rubro compatible: {names}."
            elif sectors:
                reason = "El rubro registrado no coincide con el perfil del producto."
            else:
                reason = "La empresa no tiene rubro registrado."

        elif key == "field_services_evidence":
            components = [
                (0.25, has_website, "web publicada"),
                (0.15, has_address or has_locality, "dirección o localidad"),
                (0.20, has_phone, "teléfono publicado"),
                (0.10, has_email, "email publicado"),
                (0.30, bool(sources), "fuente registrada"),
            ]
            ratio = sum(weight for weight, present, _ in components if present)
            points = round(max_points * ratio)
            present = [label for _, active, label in components if active]
            reason = (
                f"Evidencia disponible: {', '.join(present)}."
                if present
                else "No hay web, contacto ni fuente que respalden la actividad."
            )

        elif key in {"repairs_maintenance", "budget_and_scheduling", "recurring_clients"}:
            terms = {
                "repairs_maintenance": _REPAIR_TERMS,
                "budget_and_scheduling": _BUDGET_TERMS,
                "recurring_clients": _RECURRING_TERMS,
            }[key]
            matches = _matches(evidence_text, terms)
            if matches:
                unique = list(dict.fromkeys(matches))
                ratio = 1.0 if len(unique) >= 2 else 0.5
                points = round(max_points * ratio)
                reason = f"Se mencionan indicios de {', '.join(unique)}."
                factor_evidence.update(source_ids)
            else:
                reason = "No hay texto que mencione este tipo de actividad."

        elif key == "commercial_evidence_quality":
            ratio = (
                (0.30 if has_website else 0)
                + (0.30 if has_published else 0)
                + (0.20 if sources else 0)
                + (0.20 if has_address else 0)
            )
            points = round(max_points * ratio)
            if points:
                reason = "Hay canales comerciales y fuentes que respaldan los datos."
            else:
                reason = "La evidencia comercial es escasa o no está registrada."

        else:
            reason = "El producto configura un factor sin regla determinística."

        points = max(0, min(max_points, points))
        factors.append(
            {
                "key": key,
                "label": label,
                "points": points,
                "max_points": max_points,
                "reason": reason,
            }
        )
        reasons.append(f"{label}: {reason}")

    total_max = sum(factor["max_points"] for factor in factors)
    raw = sum(factor["points"] for factor in factors)
    score = round(raw * 100 / total_max) if total_max else 0
    score = max(0, min(100, score))

    confidence, confidence_components = _confidence_components(company, sectors, contacts, sources)
    missing = [
        component["label"] for component in confidence_components if component["points"] == 0
    ]
    if missing:
        reasons.append(f"Confianza: faltan datos de {', '.join(missing).lower()}.")
    else:
        reasons.append("Confianza: la ficha tiene datos completos y fuentes registradas.")

    breakdown = {
        "score": score,
        "confidence": confidence,
        "factors": factors,
        "confidence_components": confidence_components,
        "total_max_points": total_max,
    }
    return ScoreResult(
        score=score,
        confidence=confidence,
        breakdown=breakdown,
        reasons=reasons,
        evidence_ids=sorted(factor_evidence),
    )
