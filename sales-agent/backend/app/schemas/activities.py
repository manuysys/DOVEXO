"""Esquemas de actividades."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.schemas.dashboard import ActivityRead


class ActivityCreate(BaseModel):
    activity_type: str = Field(min_length=2, max_length=60)
    description: str = Field(default="", max_length=5000)
    metadata: dict[str, Any] = Field(default_factory=dict)
    occurred_at: datetime | None = None
    next_action_at: datetime | None = None


class ActivityListResponse(BaseModel):
    items: list[ActivityRead]
    total: int
    limit: int
    offset: int
