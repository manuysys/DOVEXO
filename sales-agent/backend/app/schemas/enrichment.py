"""Esquemas del enriquecimiento web de empresas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class EnrichmentEvidence(BaseModel):
    source_url: str
    title: str | None = None
    excerpt: str | None = None


class EnrichmentResultRead(BaseModel):
    company_id: int
    status: str
    fields_updated: list[str] = Field(default_factory=list)
    contacts_added: int = 0
    facts_added: int = 0
    sources_added: int = 0
    evidence: list[EnrichmentEvidence] = Field(default_factory=list)
    error: str | None = None


class EnrichmentBatchRequest(BaseModel):
    company_ids: list[int] | None = Field(default=None, max_length=50)
    limit: int | None = Field(default=None, ge=1, le=50)
    search_run_id: int | None = Field(default=None, ge=1)
    province: str | None = Field(default=None, max_length=120)
    sector: str | None = Field(default=None, max_length=80)
    query: str | None = Field(default=None, max_length=200)


class EnrichmentJobRef(BaseModel):
    id: int
    company_id: int | None
    status: str


class EnrichmentBatchResponse(BaseModel):
    queued: int
    skipped: int
    jobs: list[EnrichmentJobRef] = Field(default_factory=list)
    candidates: int


class EnrichmentJobRead(BaseModel):
    id: int
    company_id: int | None
    company_name: str | None
    status: str
    attempts: int
    max_attempts: int
    error_message: str | None
    result: dict[str, Any] | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
