"""Oportunidades, scoring, mensajes y actividades del lead."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.core.constants import LEAD_STATUSES
from app.database.session import get_db
from app.models import (
    Company,
    Contact,
    Lead,
    OutreachMessage,
    Product,
    User,
)
from app.repositories.companies import get_company_contacts
from app.repositories.leads import (
    company_sectors,
    get_evaluations,
    get_lead_activities,
    list_leads,
)
from app.schemas.activities import ActivityCreate
from app.schemas.company import SectorRef
from app.schemas.dashboard import ActivityRead
from app.schemas.leads import (
    LeadCompanyRead,
    LeadCreate,
    LeadDetailRead,
    LeadEvaluationRead,
    LeadListItem,
    LeadListResponse,
    LeadProductRead,
    LeadRead,
    LeadScoreResponse,
    LeadUpdate,
)
from app.schemas.outreach import MessageGenerate, OutreachMessageRead
from app.services.leads import (
    LeadValidationError,
    evaluate_lead,
    get_or_create_lead,
    record_activity,
    resolve_product,
    update_lead,
)
from app.services.outreach import (
    MessageBlockedError,
    MessageStateError,
    OutreachError,
    generate_message,
)

router = APIRouter(tags=["leads"])


def _lead_or_404(db: Session, lead_id: int) -> Lead:
    lead = db.get(Lead, lead_id)
    if lead is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Oportunidad no encontrada.",
        )
    return lead


def _contact_value(
    contacts: list[Contact],
    contact_type: str,
    *,
    exclude_invalid: bool = False,
) -> str | None:
    for contact in contacts:
        if contact.contact_type != contact_type or contact.do_not_contact:
            continue
        if exclude_invalid and contact.verification_status == "invalid":
            continue
        return contact.normalized_value
    return None


def _lead_detail(db: Session, lead: Lead) -> LeadDetailRead:
    company = db.get(Company, lead.company_id)
    product = db.get(Product, lead.product_id)
    if company is None or product is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El lead tiene empresa o producto inexistente.",
        )
    sectors = [SectorRef.model_validate(sector) for sector in company_sectors(db, company.id)]
    contacts = get_company_contacts(db, company.id)
    evaluations = [
        LeadEvaluationRead.model_validate(evaluation) for evaluation in get_evaluations(db, lead.id)
    ]
    activities = [
        ActivityRead.model_validate(activity, from_attributes=True)
        for activity in get_lead_activities(db, lead.id)
    ]

    def _primary(contact_type: str) -> str | None:
        return _contact_value(
            contacts,
            contact_type,
            exclude_invalid=contact_type == "whatsapp",
        )

    latest = evaluations[0] if evaluations else None
    breakdown = []
    if latest is not None and isinstance(latest.score_breakdown.get("factors"), list):
        breakdown = latest.score_breakdown["factors"]

    return LeadDetailRead(
        **LeadRead.model_validate(lead).model_dump(),
        company=LeadCompanyRead(
            id=company.id,
            name=company.name,
            description=company.description,
            website=company.website,
            province=company.province,
            locality=company.locality,
            address=company.address,
            discovery_status=company.discovery_status,
            sectors=sectors,
            primary_phone=_primary("phone"),
            primary_email=_primary("email"),
            whatsapp=_primary("whatsapp"),
        ),
        product=LeadProductRead(
            id=product.id,
            name=product.name,
            slug=product.slug,
            value_proposition=product.value_proposition,
        ),
        evaluations=evaluations,
        activities=activities,
        reasons=latest.reasons if latest is not None else [],
        breakdown=breakdown,
    )


@router.post(
    "/companies/{company_id}/leads",
    response_model=LeadRead,
    status_code=status.HTTP_201_CREATED,
)
def create_lead_endpoint(
    company_id: int,
    response: Response,
    payload: LeadCreate | None = None,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> LeadRead:
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empresa no encontrada.",
        )
    product_id = payload.product_id if payload else None
    try:
        product = resolve_product(db, product_id)
    except LeadValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc

    lead, created = get_or_create_lead(db, company, product)
    if not created:
        response.status_code = status.HTTP_200_OK
    return LeadRead.model_validate(lead)


@router.get("/leads", response_model=LeadListResponse)
def list_leads_endpoint(
    status_filter: str | None = Query(default=None, alias="status", max_length=30),
    product_id: int | None = Query(default=None, ge=1),
    company_id: int | None = Query(default=None, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadListResponse:
    if status_filter is not None and status_filter not in LEAD_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Estado de lead inválido: {status_filter}",
        )

    rows, total = list_leads(
        db,
        status=status_filter,
        product_id=product_id,
        company_id=company_id,
        limit=limit,
        offset=offset,
    )
    items: list[LeadListItem] = []
    contacts_cache: dict[int, list[Contact]] = {}
    for lead, company, product in rows:
        contacts = contacts_cache.get(company.id)
        if contacts is None:
            contacts = get_company_contacts(db, company.id)
            contacts_cache[company.id] = contacts

        items.append(
            LeadListItem(
                **LeadRead.model_validate(lead).model_dump(),
                company_name=company.name,
                product_name=product.name,
                company_locality=company.locality,
                company_province=company.province,
                company_website=company.website,
                company_phone=_contact_value(contacts, "phone"),
                company_email=_contact_value(contacts, "email"),
                company_whatsapp=_contact_value(contacts, "whatsapp", exclude_invalid=True),
            )
        )
    return LeadListResponse(items=items, total=total, limit=limit, offset=offset)


@router.get("/leads/{lead_id}", response_model=LeadDetailRead)
def get_lead_endpoint(
    lead_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> LeadDetailRead:
    return _lead_detail(db, _lead_or_404(db, lead_id))


@router.patch("/leads/{lead_id}", response_model=LeadRead)
def update_lead_endpoint(
    lead_id: int,
    payload: LeadUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> LeadRead:
    lead = _lead_or_404(db, lead_id)
    try:
        lead = update_lead(db, lead, payload.model_dump(exclude_unset=True))
    except LeadValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    return LeadRead.model_validate(lead)


@router.post("/leads/{lead_id}/score", response_model=LeadScoreResponse)
def score_lead_endpoint(
    lead_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> LeadScoreResponse:
    lead = _lead_or_404(db, lead_id)
    product = db.get(Product, lead.product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El producto del lead no existe.",
        )
    evaluation = evaluate_lead(db, lead, product)
    evaluation_read = LeadEvaluationRead.model_validate(evaluation)
    return LeadScoreResponse(
        evaluation_id=evaluation.id,
        lead_id=lead.id,
        score=evaluation.score,
        confidence=evaluation.confidence,
        reasons=evaluation.reasons,
        breakdown=evaluation.score_breakdown,
        evaluated_at=evaluation.evaluated_at,
        lead=LeadRead.model_validate(lead),
        evaluation=evaluation_read,
    )


@router.get("/leads/{lead_id}/evaluations", response_model=list[LeadEvaluationRead])
def list_evaluations_endpoint(
    lead_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[LeadEvaluationRead]:
    lead = _lead_or_404(db, lead_id)
    return [
        LeadEvaluationRead.model_validate(evaluation) for evaluation in get_evaluations(db, lead.id)
    ]


@router.get("/leads/{lead_id}/activities", response_model=list[ActivityRead])
def list_lead_activities_endpoint(
    lead_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ActivityRead]:
    lead = _lead_or_404(db, lead_id)
    return [
        ActivityRead.model_validate(activity, from_attributes=True)
        for activity in get_lead_activities(db, lead.id)
    ]


@router.post(
    "/leads/{lead_id}/activities",
    response_model=ActivityRead,
    status_code=status.HTTP_201_CREATED,
)
def create_lead_activity_endpoint(
    lead_id: int,
    payload: ActivityCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ActivityRead:
    lead = _lead_or_404(db, lead_id)
    activity = record_activity(
        db,
        lead,
        activity_type=payload.activity_type,
        description=payload.description,
        metadata=payload.metadata,
        occurred_at=payload.occurred_at,
        next_action_at=payload.next_action_at,
    )
    return ActivityRead.model_validate(activity, from_attributes=True)


@router.post(
    "/leads/{lead_id}/messages/generate",
    response_model=OutreachMessageRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_message_endpoint(
    lead_id: int,
    payload: MessageGenerate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> OutreachMessageRead:
    lead = _lead_or_404(db, lead_id)
    try:
        message = generate_message(
            db,
            lead,
            channel=payload.channel,
            message_type=payload.message_type,
        )
    except MessageBlockedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    except (OutreachError, MessageStateError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return OutreachMessageRead.model_validate(message)


@router.get("/leads/{lead_id}/messages", response_model=list[OutreachMessageRead])
def list_messages_endpoint(
    lead_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[OutreachMessageRead]:
    lead = _lead_or_404(db, lead_id)
    messages = db.scalars(
        select(OutreachMessage)
        .where(OutreachMessage.lead_id == lead.id)
        .order_by(OutreachMessage.created_at.desc(), OutreachMessage.id.desc())
    )
    return [OutreachMessageRead.model_validate(message) for message in messages]
