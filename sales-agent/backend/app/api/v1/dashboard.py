"""Dashboard: métricas reales, actividad y trabajos."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.database.session import get_db
from app.models import User
from app.repositories.dashboard import get_metrics, list_recent_activities
from app.repositories.jobs import list_recent_jobs
from app.schemas.dashboard import ActivityRead, DashboardMetrics
from app.schemas.job import JobRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def metrics_endpoint(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardMetrics:
    return get_metrics(db)


@router.get("/activity", response_model=list[ActivityRead])
def activity_endpoint(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ActivityRead]:
    return [
        ActivityRead.model_validate(activity, from_attributes=True)
        for activity in list_recent_activities(db)
    ]


@router.get("/jobs", response_model=list[JobRead])
def jobs_endpoint(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[JobRead]:
    return [JobRead.model_validate(job) for job in list_recent_jobs(db)]
