"""Empresas, sus rubros y las fuentes que respaldan cada dato."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base, TimestampMixin
from app.utils import utcnow


class Company(Base, TimestampMixin):
    __tablename__ = "companies"
    __table_args__ = (Index("ix_companies_name_locality", "normalized_name", "locality"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    legal_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    normalized_domain: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    province: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    locality: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    country: Mapped[str] = mapped_column(String(80), nullable=False, default="Argentina")
    company_size_estimate: Mapped[str | None] = mapped_column(String(60), nullable=True)
    discovery_status: Mapped[str] = mapped_column(
        String(40), nullable=False, default="discovered", index=True
    )
    last_enriched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class CompanySource(Base):
    __tablename__ = "company_sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_type: Mapped[str] = mapped_column(String(60), nullable=False)
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    evidence_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    content_hash: Mapped[str | None] = mapped_column(String(128), nullable=True, index=True)
    search_run_id: Mapped[int | None] = mapped_column(
        ForeignKey("search_runs.id", ondelete="SET NULL"), nullable=True, index=True
    )


class CompanyFact(Base):
    """Hecho extraído de una fuente, con la evidencia que lo respalda.

    Un mismo valor puede aparecer en varias páginas: cada URL conserva su
    propia fila porque la evidencia es distinta. `confidence` es orientativa y
    nunca convierte una hipótesis en dato verificado.
    """

    __tablename__ = "company_facts"
    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "fact_type",
            "normalized_value",
            "source_url",
            name="uq_company_facts_company_type_value_url",
        ),
        Index("ix_company_facts_company_type", "company_id", "fact_type"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    fact_type: Mapped[str] = mapped_column(String(40), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    source_id: Mapped[int | None] = mapped_column(
        ForeignKey("company_sources.id", ondelete="SET NULL"), nullable=True
    )
    source_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    source_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    evidence_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    collected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class CompanySector(Base):
    __tablename__ = "company_sectors"
    __table_args__ = (
        UniqueConstraint("company_id", "sector_id", name="uq_company_sectors_company_sector"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    sector_id: Mapped[int] = mapped_column(
        ForeignKey("sectors.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    source_id: Mapped[int | None] = mapped_column(
        ForeignKey("company_sources.id", ondelete="SET NULL"), nullable=True
    )
