"""Esquemas de campañas."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class CampaignCreate(BaseModel):
    product_id: int = Field(gt=0)
    name: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=5000)
    country: str = Field(default="Argentina", min_length=2, max_length=80)
    province_filters: list[str] = Field(default_factory=list)
    locality_filters: list[str] = Field(default_factory=list)
    sector_filters: list[str] = Field(default_factory=list)
    search_config: dict[str, Any] = Field(default_factory=dict)


class CampaignUpdate(BaseModel):
    product_id: int | None = Field(default=None, gt=0)
    name: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    country: str | None = Field(default=None, min_length=2, max_length=80)
    province_filters: list[str] | None = None
    locality_filters: list[str] | None = None
    sector_filters: list[str] | None = None
    search_config: dict[str, Any] | None = None


class CampaignRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str = ""
    name: str
    description: str
    country: str
    province_filters: list[str]
    locality_filters: list[str]
    sector_filters: list[str]
    search_config: dict[str, Any]
    status: str
    created_at: datetime
    updated_at: datetime


class CampaignRunSummary(BaseModel):
    id: int
    province_code: str
    status: str


class CampaignStartResponse(BaseModel):
    campaign: CampaignRead
    search_runs: list[CampaignRunSummary]
    total_jobs: int


class CampaignDetailRead(CampaignRead):
    search_runs_total: int = 0
    search_runs_pending: int = 0
    search_runs_running: int = 0
    search_runs_completed: int = 0
    search_runs_failed: int = 0
    search_runs_cancelled: int = 0
