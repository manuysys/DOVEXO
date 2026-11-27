"""Actividades comerciales globales."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models import User
from app.repositories.leads import list_activities
from app.schemas.dashboard import ActivityRead

router = APIRouter(prefix="/activities", tags=["activities"])


@router.get("", response_model=list[ActivityRead])
def list_activities_endpoint(
    lead_id: int | None = Query(default=None, ge=1),
    activity_type: str | None = Query(default=None, max_length=60),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ActivityRead]:
    items, _total = list_activities(
        db,
        lead_id=lead_id,
        activity_type=activity_type,
        limit=limit,
        offset=offset,
    )
    return [ActivityRead.model_validate(activity, from_attributes=True) for activity in items]
