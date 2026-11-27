"""Lista de no contacto."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import SuppressionEntry, User
from app.schemas.suppressions import SuppressionCreate, SuppressionRead
from app.services.suppressions import create_suppression

router = APIRouter(prefix="/suppressions", tags=["suppressions"])


@router.get("", response_model=list[SuppressionRead])
def list_suppressions_endpoint(
    company_id: int | None = Query(default=None, ge=1),
    normalized_contact: str | None = Query(default=None, max_length=500),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SuppressionRead]:
    conditions = []
    if company_id is not None:
        conditions.append(SuppressionEntry.company_id == company_id)
    if normalized_contact:
        conditions.append(SuppressionEntry.normalized_contact == normalized_contact.strip().lower())
    entries = db.scalars(
        select(SuppressionEntry)
        .where(*conditions)
        .order_by(SuppressionEntry.created_at.desc(), SuppressionEntry.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return [SuppressionRead.model_validate(entry) for entry in entries]


@router.post("", response_model=SuppressionRead, status_code=status.HTTP_201_CREATED)
def create_suppression_endpoint(
    payload: SuppressionCreate,
    response: Response,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> SuppressionRead:
    try:
        entry, created = create_suppression(
            db,
            reason=payload.reason,
            company_id=payload.company_id,
            phone=payload.phone,
            email=payload.email,
            normalized_contact=payload.normalized_contact,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail=str(exc)
        ) from exc
    if not created:
        response.status_code = status.HTTP_200_OK
    return SuppressionRead.model_validate(entry)


@router.delete("/{suppression_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_suppression_endpoint(
    suppression_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Response:
    entry = db.get(SuppressionEntry, suppression_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrada de supresión no encontrada.",
        )
    db.delete(entry)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
