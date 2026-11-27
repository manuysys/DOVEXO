"""Campañas de prospección y ejecuciones de búsqueda."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base, TimestampMixin
from app.models.product import Product

_CAMPAIGN_STATUSES = "('draft', 'active', 'paused', 'cancelled')"
_SEARCH_RUN_STATUSES = "('pending', 'running', 'completed', 'failed', 'cancelled')"


class Campaign(Base, TimestampMixin):
    __tablename__ = "campaigns"
    __table_args__ = (CheckConstraint(f"status IN {_CAMPAIGN_STATUSES}", name="status_valid"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    country: Mapped[str] = mapped_column(String(80), nullable=False, default="Argentina")
    province_filters: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    locality_filters: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    sector_filters: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    search_config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="draft", index=True)

    product: Mapped[Product] = relationship(lazy="joined")

    @property
    def product_name(self) -> str:
        return self.product.name if self.product is not None else ""


class SearchRun(Base):
    __tablename__ = "search_runs"
    __table_args__ = (CheckConstraint(f"status IN {_SEARCH_RUN_STATUSES}", name="status_valid"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int | None] = mapped_column(
        ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True, index=True
    )
    provider: Mapped[str] = mapped_column(String(80), nullable=False, default="manual")
    query: Mapped[str] = mapped_column(Text, nullable=False, default="")
    location: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    sector: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    records_found: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    new_companies: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    duplicates: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    errors: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    search_config: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    limit: Mapped[int] = mapped_column(Integer, nullable=False, default=50, server_default="50")
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
