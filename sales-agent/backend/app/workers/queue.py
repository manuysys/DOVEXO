"""Cola persistente de trabajos.

El claim es un `UPDATE` condicional: si dos workers eligen el mismo job, solo
uno cambia el estado y el otro vuelve a intentar. Las transacciones son cortas
para no bloquear la API con SQLite en modo WAL.
"""

from __future__ import annotations

from collections.abc import Callable
from datetime import timedelta
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models import Job
from app.utils import utcnow

logger = get_logger(__name__)

# En Fase 1 solo se procesa `noop`. Los `search_run` quedan pendientes para la
# Fase 2 y no se reclaman, para no simular resultados.
SUPPORTED_JOB_TYPES: tuple[str, ...] = ("noop",)


def _handle_noop(_db: Session, job: Job) -> dict[str, Any]:
    return {
        "acknowledged": True,
        "payload": job.payload or {},
        "processed_at": utcnow().isoformat(),
    }


HANDLERS: dict[str, Callable[[Session, Job], dict[str, Any]]] = {
    "noop": _handle_noop,
}


def claim_next_job(db: Session) -> Job | None:
    now = utcnow()
    job_id = db.scalar(
        select(Job.id)
        .where(
            Job.status == "pending",
            Job.job_type.in_(SUPPORTED_JOB_TYPES),
            Job.scheduled_at <= now,
        )
        .order_by(Job.priority.desc(), Job.id.asc())
        .limit(1)
    )
    if job_id is None:
        return None

    result = db.execute(
        update(Job)
        .where(Job.id == job_id, Job.status == "pending")
        .values(status="running", started_at=now, attempts=Job.attempts + 1)
        .execution_options(synchronize_session=False)
    )
    db.commit()

    if result.rowcount != 1:
        db.rollback()
        return None

    job = db.get(Job, job_id)
    if job is not None:
        db.refresh(job)
    return job


def process_job(db: Session, job: Job) -> Job:
    handler = HANDLERS.get(job.job_type)
    if handler is None:
        raise ValueError(f"Tipo de trabajo no soportado: {job.job_type}")

    job_id = job.id
    try:
        result = handler(db, job)
    except Exception as exc:
        db.rollback()
        failed_job = db.get(Job, job_id)
        if failed_job is None:
            raise
        logger.exception("Job %s falló en el intento %s", job_id, failed_job.attempts)
        failed_job.error_message = str(exc)[:2000]
        if failed_job.attempts < failed_job.max_attempts:
            failed_job.status = "pending"
            failed_job.scheduled_at = utcnow() + timedelta(
                seconds=min(300, 30 * failed_job.attempts)
            )
        else:
            failed_job.status = "failed"
            failed_job.finished_at = utcnow()
        db.commit()
        db.refresh(failed_job)
        return failed_job

    job.status = "completed"
    job.finished_at = utcnow()
    job.error_message = None
    job.result = result
    db.commit()
    db.refresh(job)
    logger.info("Job %s (%s) completado", job.id, job.job_type)
    return job


def run_once(db: Session) -> Job | None:
    job = claim_next_job(db)
    if job is None:
        return None
    return process_job(db, job)
