"""Esquemas del dashboard."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, Field


class DashboardMetrics(BaseModel):
    companies: int = 0
    new_companies: int = 0
    investigated_companies: int = 0
    leads_pending_review: int = 0
    published_contacts: int = 0
    published_whatsapp: int = 0
    approved_leads: int = 0
    contacted_leads: int = 0
    responses: int = 0
    meetings: int = 0
    products: int = 0
    campaigns: int = 0
    jobs_pending: int = 0
    jobs_running: int = 0
    jobs_failed: int = 0


class ActivityRead(BaseModel):
    id: int
    lead_id: int | None
    activity_type: str
    description: str
    metadata: dict[str, Any] = Field(
        default_factory=dict, validation_alias=AliasChoices("metadata_json", "metadata")
    )
    occurred_at: datetime
    next_action_at: datetime | None
