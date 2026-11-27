"""Esquemas de meta (provincias y rubros)."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict


class ProvinceRead(BaseModel):
    code: str
    name: str


class SectorRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str
    synonyms: list[str]
    keywords: list[str]
    is_active: bool
