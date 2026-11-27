"""Esquemas de importación CSV."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ImportRowError(BaseModel):
    row_number: int
    message: str


class ImportPreviewRow(BaseModel):
    row_number: int
    status: str
    name: str | None = None
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    province: str | None = None
    locality: str | None = None
    address: str | None = None
    sectors: list[str] = Field(default_factory=list)
    possible_duplicate: bool = False
    message: str | None = None


class ImportPreviewResponse(BaseModel):
    batch_id: int
    filename: str
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicates: int
    preview: list[ImportPreviewRow]
    errors: list[ImportRowError]


class ImportConfirmResponse(BaseModel):
    batch_id: int
    created: int
    skipped: int
    errors: list[ImportRowError]


class ImportBatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    filename: str
    status: str
    imported_at: datetime
    confirmed_at: datetime | None
    total_rows: int
    valid_rows: int
    invalid_rows: int
    duplicate_rows: int
    successful_rows: int
    skipped_rows: int
    mapping: dict[str, Any] | None
    errors: list[ImportRowError]
    created_by: int | None
