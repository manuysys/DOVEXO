"""Endpoints de trabajos para probar la cola."""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.database.session import get_db
from app.models import User
from app.repositories.jobs import enqueue_job
from app.schemas.job import JobRead, NoopJobRequest

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/noop", response_model=JobRead, status_code=status.HTTP_201_CREATED)
def enqueue_noop_job(
    payload: NoopJobRequest | None = None,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> JobRead:
    job = enqueue_job(db, "noop", payload=(payload.payload if payload else {}))
    return JobRead.model_validate(job)
