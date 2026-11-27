"""Endpoints de búsquedas provinciales."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import SearchRun, User
from app.schemas.search_run import SearchRunCreate, SearchRunRead
from app.services.search_runs import (
    SearchRunStateError,
    SearchRunValidationError,
    cancel_search_run,
    create_search_run,
    retry_search_run,
)

router = APIRouter(prefix="/search-runs", tags=["search-runs"])


def _get_search_run_or_404(db: Session, search_run_id: int) -> SearchRun:
    run = db.get(SearchRun, search_run_id)
    if run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Búsqueda no encontrada.",
        )
    return run


@router.post("", response_model=SearchRunRead, status_code=status.HTTP_201_CREATED)
def create_search_run_endpoint(
    payload: SearchRunCreate,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SearchRunRead:
    try:
        run = create_search_run(
            db,
            province_code=payload.province_code,
            sector_slugs=payload.sector_slugs,
            keywords=payload.keywords,
            limit=payload.limit,
            campaign_id=payload.campaign_id,
        )
    except SearchRunValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return SearchRunRead.model_validate(run)


@router.get("", response_model=list[SearchRunRead])
def list_search_runs_endpoint(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SearchRunRead]:
    runs = db.scalars(select(SearchRun).order_by(SearchRun.id.desc()).offset(offset).limit(limit))
    return [SearchRunRead.model_validate(run) for run in runs]


@router.get("/{search_run_id}", response_model=SearchRunRead)
def get_search_run_endpoint(
    search_run_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchRunRead:
    return SearchRunRead.model_validate(_get_search_run_or_404(db, search_run_id))


@router.post("/{search_run_id}/retry", response_model=SearchRunRead)
def retry_search_run_endpoint(
    search_run_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SearchRunRead:
    run = _get_search_run_or_404(db, search_run_id)
    try:
        run = retry_search_run(db, run)
    except SearchRunStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return SearchRunRead.model_validate(run)


@router.post("/{search_run_id}/cancel", response_model=SearchRunRead)
def cancel_search_run_endpoint(
    search_run_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SearchRunRead:
    run = _get_search_run_or_404(db, search_run_id)
    try:
        run = cancel_search_run(db, run)
    except SearchRunStateError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return SearchRunRead.model_validate(run)
