"""Esquemas de empresas, fuentes y contactos."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SectorRef(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    name: str


class ContactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    contact_type: str
    value: str = Field(validation_alias="original_value")
    normalized_value: str
    label: str | None
    is_primary: bool
    verification_status: str
    do_not_contact: bool
    # Procedencia: de qué página salió el dato y cuándo se recolectó. Un
    # contacto `published` aparece en el sitio; no está verificado por una
    # persona salvo que `verification_status` sea `verified`.
    source_url: str | None = None
    source_title: str | None = None
    source_collected_at: datetime | None = None
    source_confidence: float | None = None
    verified_at: datetime | None = None


class CompanyFactRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    fact_type: str
    value: str
    normalized_value: str
    source_url: str | None
    source_title: str | None
    evidence_excerpt: str | None
    confidence: float | None
    collected_at: datetime


class CompanySourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source_type: str
    source_url: str
    title: str | None
    evidence_excerpt: str | None
    collected_at: datetime
    confidence: float | None
    search_run_id: int | None


class CompanyListItem(BaseModel):
    id: int
    name: str
    description: str
    website: str | None
    province: str | None
    locality: str | None
    address: str | None
    discovery_status: str
    sectors: list[SectorRef]
    contacts: list[ContactRead]
    primary_phone: str | None
    primary_email: str | None
    whatsapp: str | None
    source_count: int
    created_at: datetime


class CompanyListResponse(BaseModel):
    items: list[CompanyListItem]
    total: int
    limit: int
    offset: int


class CompanyDetailRead(CompanyListItem):
    legal_name: str | None
    normalized_domain: str | None
    country: str
    company_size_estimate: str | None
    last_enriched_at: datetime | None
    updated_at: datetime
    sources: list[CompanySourceRead]
    facts: list[CompanyFactRead] = Field(default_factory=list)


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    province: str | None = Field(default=None, max_length=120)
    locality: str | None = Field(default=None, max_length=160)
    address: str | None = Field(default=None, max_length=500)
    sector_slugs: list[str] = Field(default_factory=list)
    phone: str | None = Field(default=None, max_length=100)
    email: str | None = Field(default=None, max_length=320)


class CompanyUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=255)
    website: str | None = Field(default=None, max_length=500)
    province: str | None = Field(default=None, max_length=120)
    locality: str | None = Field(default=None, max_length=160)
    address: str | None = Field(default=None, max_length=500)
    legal_name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=5000)
    company_size_estimate: str | None = Field(default=None, max_length=60)
    discovery_status: str | None = Field(default=None, max_length=40)
    sector_slugs: list[str] | None = None


class ContactCreate(BaseModel):
    contact_type: str = Field(min_length=3, max_length=30)
    value: str = Field(min_length=1, max_length=500)
    label: str | None = Field(default=None, max_length=120)
    is_primary: bool = False
    verification_status: str = Field(default="unverified", max_length=30)
