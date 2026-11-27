"""Esquemas de trabajos."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    job_type: str
    payload: dict[str, Any]
    status: str
    attempts: int
    max_attempts: int
    priority: int
    scheduled_at: datetime
    started_at: datetime | None
    finished_at: datetime | None
    error_message: str | None
    result: dict[str, Any] | None
    created_at: datetime


class NoopJobRequest(BaseModel):
    payload: dict[str, Any] = Field(default_factory=dict)
