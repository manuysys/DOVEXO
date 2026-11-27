"""Oportunidades (leads), evaluación y actividades comerciales."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.constants import LEAD_STATUSES
from app.models import Activity, Company, Lead, LeadEvaluation, Product
from app.services.scoring import score_lead as calculate_score
from app.utils import utcnow


class LeadValidationError(ValueError):
    pass


def resolve_product(db: Session, product_id: int | None = None) -> Product:
    if product_id is None:
        product = db.scalar(select(Product).where(Product.slug == "dovexo"))
    else:
        product = db.get(Product, product_id)

    if product is None:
        raise LeadValidationError("El producto indicado no existe.")
    if not product.is_active:
        raise LeadValidationError("El producto está desactivado.")
    return product


def record_activity(
    db: Session,
    lead: Lead | None,
    *,
    activity_type: str,
    description: str,
    metadata: dict[str, Any] | None = None,
    occurred_at: Any = None,
    next_action_at: Any = None,
    commit: bool = True,
) -> Activity:
    activity = Activity(
        lead_id=lead.id if lead is not None else None,
        activity_type=activity_type[:60],
        description=description[:5000],
        metadata_json=metadata or {},
        occurred_at=occurred_at or utcnow(),
        next_action_at=next_action_at,
    )
    db.add(activity)
    if lead is not None:
        lead.last_activity_at = activity.occurred_at
        if next_action_at is not None:
            lead.next_follow_up_at = next_action_at
    if commit:
        db.commit()
        db.refresh(activity)
    return activity


def get_or_create_lead(db: Session, company: Company, product: Product) -> tuple[Lead, bool]:
    lead = db.scalar(
        select(Lead).where(
            Lead.company_id == company.id,
            Lead.product_id == product.id,
        )
    )
    if lead is not None:
        return lead, False

    lead = Lead(
        company_id=company.id,
        product_id=product.id,
        status="new",
        assigned_notes="",
    )
    db.add(lead)
    db.flush()
    record_activity(
        db,
        lead,
        activity_type="opportunity_created",
        description=f"Oportunidad creada para {company.name} y {product.name}.",
        metadata={"company_id": company.id, "product_id": product.id},
        commit=False,
    )
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.scalar(
            select(Lead).where(
                Lead.company_id == company.id,
                Lead.product_id == product.id,
            )
        )
        if existing is not None:
            return existing, False
        raise
    db.refresh(lead)
    return lead, True


def update_lead(db: Session, lead: Lead, changes: dict[str, Any]) -> Lead:
    if "status" in changes:
        new_status = str(changes["status"])
        if new_status not in LEAD_STATUSES:
            raise LeadValidationError(f"Estado de lead inválido: {new_status}")
        if new_status != lead.status:
            previous = lead.status
            lead.status = new_status
            record_activity(
                db,
                lead,
                activity_type="status_changed",
                description=f"Estado cambiado de {previous} a {new_status}.",
                metadata={"from": previous, "to": new_status},
                commit=False,
            )

    if "assigned_notes" in changes:
        notes = str(changes["assigned_notes"] or "").strip()
        if notes != lead.assigned_notes:
            lead.assigned_notes = notes
            record_activity(
                db,
                lead,
                activity_type="note_updated",
                description="Notas internas actualizadas.",
                commit=False,
            )

    if "next_follow_up_at" in changes:
        next_follow_up = changes["next_follow_up_at"]
        lead.next_follow_up_at = next_follow_up
        record_activity(
            db,
            lead,
            activity_type="follow_up_scheduled",
            description="Próximo seguimiento actualizado.",
            next_action_at=next_follow_up,
            metadata={"next_follow_up_at": next_follow_up.isoformat() if next_follow_up else None},
            commit=False,
        )

    db.commit()
    db.refresh(lead)
    return lead


def evaluate_lead(db: Session, lead: Lead, product: Product) -> LeadEvaluation:
    result = calculate_score(db, lead, product)
    lead.compatibility_score = result.score
    lead.information_confidence = result.confidence

    evaluation = LeadEvaluation(
        lead_id=lead.id,
        score=result.score,
        confidence=result.confidence,
        score_breakdown=result.breakdown,
        reasons=result.reasons,
        evidence_ids=result.evidence_ids,
        evaluation_method="deterministic",
        model_name=None,
    )
    db.add(evaluation)
    record_activity(
        db,
        lead,
        activity_type="lead_scored",
        description=(
            f"Scoring determinístico: compatibilidad {result.score}/100, "
            f"confianza {result.confidence}/100."
        ),
        metadata={"score": result.score, "confidence": result.confidence},
        commit=False,
    )
    db.commit()
    db.refresh(evaluation)
    db.refresh(lead)
    return evaluation
