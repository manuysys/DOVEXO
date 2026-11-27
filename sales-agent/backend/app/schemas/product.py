"""Esquemas de productos."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.utils.text import slugify

_SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"


class ProductBase(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str = Field(default="", max_length=5000)
    value_proposition: str = Field(default="", max_length=5000)
    target_profile: str = Field(default="", max_length=5000)
    pain_points: list[str] = Field(default_factory=list)
    target_sectors: list[str] = Field(default_factory=list)
    keywords: list[str] = Field(default_factory=list)
    scoring_config: dict[str, Any] = Field(default_factory=dict)
    messaging_config: dict[str, Any] = Field(default_factory=dict)
    is_active: bool = True


class ProductCreate(ProductBase):
    slug: str | None = Field(default=None, max_length=80, pattern=_SLUG_PATTERN)

    @model_validator(mode="after")
    def _fill_slug(self) -> ProductCreate:
        if not self.slug:
            generated = slugify(self.name)
            if not generated:
                raise ValueError("No se pudo generar un slug a partir del nombre")
            self.slug = generated
        return self


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    slug: str | None = Field(default=None, max_length=80, pattern=_SLUG_PATTERN)
    description: str | None = Field(default=None, max_length=5000)
    value_proposition: str | None = Field(default=None, max_length=5000)
    target_profile: str | None = Field(default=None, max_length=5000)
    pain_points: list[str] | None = None
    target_sectors: list[str] | None = None
    keywords: list[str] | None = None
    scoring_config: dict[str, Any] | None = None
    messaging_config: dict[str, Any] | None = None
    is_active: bool | None = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    value_proposition: str
    target_profile: str
    pain_points: list[str]
    target_sectors: list[str]
    keywords: list[str]
    scoring_config: dict[str, Any]
    messaging_config: dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime
