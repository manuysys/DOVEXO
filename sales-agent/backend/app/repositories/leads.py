"""Consultas de oportunidades, evaluaciones y actividades."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Activity, Company, CompanySector, Lead, LeadEvaluation, Product, Sector


def list_leads(
    db: Session,
    *,
    status: str | None = None,
    product_id: int | None = None,
    company_id: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[tuple[Lead, Company, Product]], int]:
    conditions = []
    if status:
        conditions.append(Lead.status == status)
    if product_id is not None:
        conditions.append(Lead.product_id == product_id)
    if company_id is not None:
        conditions.append(Lead.company_id == company_id)

    total = int(db.scalar(select(func.count()).select_from(Lead).where(*conditions)) or 0)
    rows = db.execute(
        select(Lead, Company, Product)
        .join(Company, Company.id == Lead.company_id)
        .join(Product, Product.id == Lead.product_id)
        .where(*conditions)
        .order_by(Lead.updated_at.desc(), Lead.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return [(lead, company, product) for lead, company, product in rows], total


def get_evaluations(db: Session, lead_id: int, *, limit: int = 50) -> list[LeadEvaluation]:
    return list(
        db.scalars(
            select(LeadEvaluation)
            .where(LeadEvaluation.lead_id == lead_id)
            .order_by(LeadEvaluation.evaluated_at.desc(), LeadEvaluation.id.desc())
            .limit(limit)
        )
    )


def get_lead_activities(db: Session, lead_id: int, *, limit: int = 100) -> list[Activity]:
    return list(
        db.scalars(
            select(Activity)
            .where(Activity.lead_id == lead_id)
            .order_by(Activity.occurred_at.desc(), Activity.id.desc())
            .limit(limit)
        )
    )


def list_activities(
    db: Session,
    *,
    lead_id: int | None = None,
    activity_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Activity], int]:
    conditions = []
    if lead_id is not None:
        conditions.append(Activity.lead_id == lead_id)
    if activity_type:
        conditions.append(Activity.activity_type == activity_type)

    total = int(db.scalar(select(func.count()).select_from(Activity).where(*conditions)) or 0)
    items = list(
        db.scalars(
            select(Activity)
            .where(*conditions)
            .order_by(Activity.occurred_at.desc(), Activity.id.desc())
            .offset(offset)
            .limit(limit)
        )
    )
    return items, total


def company_sectors(db: Session, company_id: int) -> list[Sector]:
    return list(
        db.scalars(
            select(Sector)
            .join(CompanySector, CompanySector.sector_id == Sector.id)
            .where(CompanySector.company_id == company_id)
            .order_by(Sector.name)
        )
    )
