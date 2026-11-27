"""Campañas: CRUD y transiciones de estado."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import Campaign, User
from app.repositories.campaigns import (
    count_campaign_runs,
    create_campaign,
    get_campaign,
    list_campaigns,
    update_campaign,
)
from app.repositories.products import get_product
from app.schemas.campaign import (
    CampaignCreate,
    CampaignDetailRead,
    CampaignRead,
    CampaignRunSummary,
    CampaignStartResponse,
    CampaignUpdate,
)
from app.services.campaigns import (
    CampaignStateError,
    CampaignValidationError,
    cancel_campaign,
    pause_campaign,
    start_campaign,
    validate_filters,
)

router = APIRouter(prefix="/campaigns", tags=["campaigns"])


def _get_campaign_or_404(db: Session, campaign_id: int) -> Campaign:
    campaign = get_campaign(db, campaign_id)
    if campaign is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaña no encontrada.",
        )
    return campaign


def _campaign_detail(db: Session, campaign: Campaign) -> CampaignDetailRead:
    counts = count_campaign_runs(db, campaign.id)
    base = CampaignRead.model_validate(campaign)
    return CampaignDetailRead(
        **base.model_dump(),
        search_runs_total=sum(counts.values()),
        search_runs_pending=counts.get("pending", 0),
        search_runs_running=counts.get("running", 0),
        search_runs_completed=counts.get("completed", 0),
        search_runs_failed=counts.get("failed", 0),
        search_runs_cancelled=counts.get("cancelled", 0),
    )


def _ensure_product_available(db: Session, product_id: int) -> None:
    product = get_product(db, product_id)
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="El producto indicado no existe.",
        )
    if not product.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El producto está desactivado.",
        )


def _validate_filters_or_400(
    db: Session,
    province_filters: list[str],
    sector_filters: list[str],
) -> None:
    try:
        validate_filters(
            db,
            province_filters=province_filters,
            sector_filters=sector_filters,
        )
    except CampaignValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc


@router.get("", response_model=list[CampaignRead])
def list_campaigns_endpoint(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CampaignRead]:
    return [CampaignRead.model_validate(campaign) for campaign in list_campaigns(db)]


@router.post("", response_model=CampaignRead, status_code=status.HTTP_201_CREATED)
def create_campaign_endpoint(
    payload: CampaignCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CampaignRead:
    _ensure_product_available(db, payload.product_id)
    _validate_filters_or_400(db, payload.province_filters, payload.sector_filters)
    campaign = create_campaign(db, payload.model_dump())
    return CampaignRead.model_validate(campaign)


@router.get("/{campaign_id}", response_model=CampaignDetailRead)
def get_campaign_endpoint(
    campaign_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CampaignDetailRead:
    return _campaign_detail(db, _get_campaign_or_404(db, campaign_id))


@router.patch("/{campaign_id}", response_model=CampaignRead)
def update_campaign_endpoint(
    campaign_id: int,
    payload: CampaignUpdate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CampaignRead:
    campaign = _get_campaign_or_404(db, campaign_id)
    changes = payload.model_dump(exclude_unset=True)

    if "product_id" in changes:
        _ensure_product_available(db, changes["product_id"])

    province_filters = changes.get("province_filters", campaign.province_filters)
    sector_filters = changes.get("sector_filters", campaign.sector_filters)
    _validate_filters_or_400(db, province_filters, sector_filters)

    campaign = update_campaign(db, campaign, changes)
    return CampaignRead.model_validate(campaign)


@router.post("/{campaign_id}/start", response_model=CampaignStartResponse)
def start_campaign_endpoint(
    campaign_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CampaignStartResponse:
    campaign = _get_campaign_or_404(db, campaign_id)
    try:
        campaign, runs, total_jobs = start_campaign(db, campaign)
    except CampaignStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc
    except CampaignValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=exc.message) from exc

    return CampaignStartResponse(
        campaign=CampaignRead.model_validate(campaign),
        search_runs=[
            CampaignRunSummary(
                id=run.id,
                province_code=str((run.search_config or {}).get("province_code", "")),
                status=run.status,
            )
            for run in runs
        ],
        total_jobs=total_jobs,
    )


@router.post("/{campaign_id}/pause", response_model=CampaignRead)
def pause_campaign_endpoint(
    campaign_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CampaignRead:
    campaign = _get_campaign_or_404(db, campaign_id)
    try:
        campaign = pause_campaign(db, campaign)
    except CampaignStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc
    return CampaignRead.model_validate(campaign)


@router.post("/{campaign_id}/cancel", response_model=CampaignRead)
def cancel_campaign_endpoint(
    campaign_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> CampaignRead:
    campaign = _get_campaign_or_404(db, campaign_id)
    try:
        campaign = cancel_campaign(db, campaign)
    except CampaignStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=exc.message) from exc
    return CampaignRead.model_validate(campaign)
