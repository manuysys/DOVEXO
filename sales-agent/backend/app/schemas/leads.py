"""Esquemas de oportunidades, scoring y CRM."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import AliasChoices, BaseModel, ConfigDict, Field, computed_field

from app.schemas.company import SectorRef
from app.schemas.dashboard import ActivityRead


class LeadCreate(BaseModel):
    product_id: int | None = Field(default=None, gt=0)


class LeadUpdate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    status: str | None = Field(default=None, max_length=30)
    assigned_notes: str | None = Field(default=None, max_length=5000)
    next_follow_up_at: datetime | None = Field(
        default=None,
        validation_alias=AliasChoices("next_follow_up_at", "next_action_at"),
    )


class LeadRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    product_id: int
    status: str
    compatibility_score: int | None
    information_confidence: int | None
    assigned_notes: str
    last_activity_at: datetime | None
    next_follow_up_at: datetime | None
    created_at: datetime
    updated_at: datetime

    @computed_field
    @property
    def next_action_at(self) -> datetime | None:
        """Alias de lectura usado por el frontend."""
        return self.next_follow_up_at


class LeadListItem(LeadRead):
    company_name: str
    product_name: str
    company_locality: str | None = None
    company_province: str | None = None
    company_website: str | None = None
    company_phone: str | None = None
    company_email: str | None = None
    company_whatsapp: str | None = None


class LeadListResponse(BaseModel):
    items: list[LeadListItem]
    total: int
    limit: int
    offset: int


class LeadCompanyRead(BaseModel):
    id: int
    name: str
    description: str
    website: str | None
    province: str | None
    locality: str | None
    address: str | None
    discovery_status: str
    sectors: list[SectorRef]
    primary_phone: str | None = None
    primary_email: str | None = None
    whatsapp: str | None = None


class LeadProductRead(BaseModel):
    id: int
    name: str
    slug: str
    value_proposition: str


class LeadEvaluationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    score: int
    confidence: int
    score_breakdown: dict[str, Any]
    reasons: list[str]
    evidence_ids: list[int]
    evaluation_method: str
    model_name: str | None
    evaluated_at: datetime


class LeadDetailRead(LeadRead):
    company: LeadCompanyRead
    product: LeadProductRead
    evaluations: list[LeadEvaluationRead]
    activities: list[ActivityRead]
    reasons: list[str] = Field(default_factory=list)
    breakdown: list[dict[str, Any]] = Field(default_factory=list)


class LeadScoreResponse(BaseModel):
    evaluation_id: int
    lead_id: int
    score: int
    confidence: int
    reasons: list[str]
    breakdown: dict[str, Any]
    evaluated_at: datetime
    lead: LeadRead | None = None
    evaluation: LeadEvaluationRead | None = None
