"""Endpoints de importación CSV."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_admin
from app.database.session import get_db
from app.models import ImportBatch, User
from app.schemas.imports import (
    ImportBatchRead,
    ImportConfirmResponse,
    ImportPreviewResponse,
    ImportPreviewRow,
    ImportRowError,
)
from app.services.imports import (
    MAX_FILE_BYTES,
    ImportValidationError,
    confirm_import,
    preview_import,
)

router = APIRouter(prefix="/imports", tags=["imports"])


def _get_batch_or_404(db: Session, batch_id: int) -> ImportBatch:
    batch = db.get(ImportBatch, batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Lote de importación no encontrado.",
        )
    return batch


@router.post("/preview", response_model=ImportPreviewResponse, status_code=status.HTTP_201_CREATED)
async def preview_import_endpoint(
    file: UploadFile = File(...),
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ImportPreviewResponse:
    content = await file.read(MAX_FILE_BYTES + 1)
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="El archivo supera el máximo de 2 MB.",
        )

    filename = Path(file.filename or "import.csv").name
    try:
        batch, preview = preview_import(
            db,
            filename=filename,
            content=content,
            created_by_id=admin.id,
        )
    except ImportValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return ImportPreviewResponse(
        batch_id=batch.id,
        filename=batch.filename,
        total_rows=batch.total_rows,
        valid_rows=batch.valid_rows,
        invalid_rows=batch.invalid_rows,
        duplicates=batch.duplicate_rows,
        preview=[ImportPreviewRow(**row) for row in preview],
        errors=[ImportRowError(**row) for row in batch.errors],
    )


@router.post("/{batch_id}/confirm", response_model=ImportConfirmResponse)
def confirm_import_endpoint(
    batch_id: int,
    _admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> ImportConfirmResponse:
    batch = _get_batch_or_404(db, batch_id)
    try:
        batch = confirm_import(db, batch)
    except ImportValidationError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return ImportConfirmResponse(
        batch_id=batch.id,
        created=batch.successful_rows,
        skipped=batch.skipped_rows,
        errors=[ImportRowError(**row) for row in batch.errors],
    )


@router.get("", response_model=list[ImportBatchRead])
def list_imports_endpoint(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ImportBatchRead]:
    batches = db.scalars(
        select(ImportBatch)
        .order_by(ImportBatch.imported_at.desc(), ImportBatch.id.desc())
        .offset(offset)
        .limit(limit)
    )
    return [ImportBatchRead.model_validate(batch) for batch in batches]


@router.get("/{batch_id}", response_model=ImportBatchRead)
def get_import_endpoint(
    batch_id: int,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImportBatchRead:
    return ImportBatchRead.model_validate(_get_batch_or_404(db, batch_id))
