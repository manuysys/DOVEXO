"""Esquemas de lista de no contacto."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SuppressionCreate(BaseModel):
    company_id: int | None = Field(default=None, gt=0)
    phone: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=320)
    normalized_contact: str | None = Field(default=None, max_length=500)
    reason: str = Field(default="", max_length=500)


class SuppressionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int | None
    normalized_contact: str
    reason: str
    created_at: datetime
