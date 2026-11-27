"""Esquemas de búsquedas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class SearchRunCreate(BaseModel):
    province_code: str = Field(min_length=2, max_length=10)
    sector_slugs: list[str] = Field(default_factory=list)
    keywords: str | None = Field(default=None, max_length=200)
    limit: int = Field(default=50, ge=1, le=200)
    campaign_id: int | None = Field(default=None, gt=0)


class SearchRunRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    campaign_id: int | None
    provider: str
    query: str
    location: str
    sector: str
    status: str
    records_found: int
    new_companies: int
    duplicates: int
    errors: list[str]
    search_config: dict[str, Any] | None
    limit: int
    started_at: datetime | None
    finished_at: datetime | None
