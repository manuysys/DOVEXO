"""Persistencia de trabajos."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Job
from app.utils import utcnow


def enqueue_job(
    db: Session,
    job_type: str,
    *,
    payload: dict[str, Any] | None = None,
    priority: int = 0,
    max_attempts: int = 3,
    scheduled_at: datetime | None = None,
) -> Job:
    job = Job(
        job_type=job_type,
        payload=payload or {},
        status="pending",
        priority=priority,
        max_attempts=max_attempts,
        scheduled_at=scheduled_at or utcnow(),
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(db: Session, job_id: int) -> Job | None:
    return db.get(Job, job_id)


def list_recent_jobs(db: Session, *, limit: int = 20) -> list[Job]:
    stmt = select(Job).order_by(Job.created_at.desc(), Job.id.desc()).limit(limit)
    return list(db.scalars(stmt))
