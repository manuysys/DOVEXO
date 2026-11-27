"""Contactos, leads, evaluaciones, mensajes, actividades e importaciones."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.constants import (
    CONTACT_TYPES,
    CONTACT_VERIFICATION_STATUSES,
    LEAD_STATUSES,
)
from app.database.base import Base, TimestampMixin
from app.utils import utcnow


def _quoted(values: tuple[str, ...]) -> str:
    return "(" + ", ".join(f"'{value}'" for value in values) + ")"


class Contact(Base, TimestampMixin):
    __tablename__ = "contacts"
    __table_args__ = (
        CheckConstraint(f"contact_type IN {_quoted(CONTACT_TYPES)}", name="type_valid"),
        CheckConstraint(
            f"verification_status IN {_quoted(CONTACT_VERIFICATION_STATUSES)}",
            name="verification_status_valid",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_type: Mapped[str] = mapped_column(String(30), nullable=False)
    original_value: Mapped[str] = mapped_column(String(500), nullable=False)
    normalized_value: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="unverified", index=True
    )
    source_id: Mapped[int | None] = mapped_column(
        ForeignKey("company_sources.id", ondelete="SET NULL"), nullable=True
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    do_not_contact: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Lead(Base, TimestampMixin):
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("company_id", "product_id", name="uq_leads_company_product"),
        CheckConstraint(f"status IN {_quoted(LEAD_STATUSES)}", name="status_valid"),
        CheckConstraint(
            "compatibility_score IS NULL OR compatibility_score BETWEEN 0 AND 100",
            name="compatibility_score_range",
        ),
        CheckConstraint(
            "information_confidence IS NULL OR information_confidence BETWEEN 0 AND 100",
            name="information_confidence_range",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="new", index=True)
    compatibility_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    information_confidence: Mapped[int | None] = mapped_column(Integer, nullable=True)
    assigned_notes: Mapped[str] = mapped_column(Text, nullable=False, default="")
    last_activity_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )


class CampaignLead(Base):
    __tablename__ = "campaign_leads"
    __table_args__ = (
        UniqueConstraint("campaign_id", "lead_id", name="uq_campaign_leads_campaign_lead"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    campaign_id: Mapped[int] = mapped_column(
        ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False, index=True
    )
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class LeadEvaluation(Base):
    __tablename__ = "lead_evaluations"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[int] = mapped_column(Integer, nullable=False)
    score_breakdown: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False, default=dict)
    reasons: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    evidence_ids: Mapped[list[int]] = mapped_column(JSON, nullable=False, default=list)
    evaluation_method: Mapped[str] = mapped_column(String(60), nullable=False)
    model_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    evaluated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class OutreachMessage(Base):
    __tablename__ = "outreach_messages"
    __table_args__ = (
        CheckConstraint("channel IN ('whatsapp', 'email', 'phone', 'other')", name="channel_valid"),
        CheckConstraint(
            "status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent')",
            name="status_valid",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=False, index=True
    )
    contact_id: Mapped[int | None] = mapped_column(
        ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True
    )
    campaign_id: Mapped[int | None] = mapped_column(
        ForeignKey("campaigns.id", ondelete="SET NULL"), nullable=True
    )
    channel: Mapped[str] = mapped_column(String(30), nullable=False)
    message_type: Mapped[str] = mapped_column(String(60), nullable=False)
    generated_text: Mapped[str] = mapped_column(Text, nullable=False)
    edited_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="draft", index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    lead_id: Mapped[int | None] = mapped_column(
        ForeignKey("leads.id", ondelete="CASCADE"), nullable=True, index=True
    )
    activity_type: Mapped[str] = mapped_column(String(60), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    metadata_json: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSON, nullable=False, default=dict
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, index=True
    )
    next_action_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class SuppressionEntry(Base):
    __tablename__ = "suppression_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int | None] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"), nullable=True, index=True
    )
    normalized_contact: Mapped[str] = mapped_column(
        String(500), nullable=False, unique=True, index=True
    )
    reason: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )


class ImportBatch(Base):
    __tablename__ = "import_batches"

    id: Mapped[int] = mapped_column(primary_key=True)
    filename: Mapped[str] = mapped_column(String(300), nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="preview", server_default="preview", index=True
    )
    imported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    valid_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    invalid_rows: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    duplicate_rows: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    successful_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    skipped_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    mapping: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    preview_rows: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    errors: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False, default=list)
    created_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
