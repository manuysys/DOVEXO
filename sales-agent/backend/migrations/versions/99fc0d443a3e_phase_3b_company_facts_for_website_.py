"""phase 3b company facts for website enrichment

Revision ID: 99fc0d443a3e
Revises: 6bc3b83ae212
Create Date: 2026-11-27 23:56:12.152549

Agrega `company_facts`: hechos extraídos del sitio web de una empresa con su
evidencia (URL, título, extracto y confianza). Es compatible con SQLite porque
solo crea una tabla nueva; el `downgrade` la elimina por completo.
"""

from __future__ import annotations

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "99fc0d443a3e"
down_revision: str | None = "6bc3b83ae212"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "company_facts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("fact_type", sa.String(length=40), nullable=False),
        sa.Column("value", sa.String(length=500), nullable=False),
        sa.Column("normalized_value", sa.String(length=500), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("source_url", sa.String(length=1000), nullable=False),
        sa.Column("source_title", sa.String(length=300), nullable=True),
        sa.Column("evidence_excerpt", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("collected_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["company_id"],
            ["companies.id"],
            name=op.f("fk_company_facts_company_id_companies"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["source_id"],
            ["company_sources.id"],
            name=op.f("fk_company_facts_source_id_company_sources"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_company_facts")),
        sa.UniqueConstraint(
            "company_id",
            "fact_type",
            "normalized_value",
            "source_url",
            name="uq_company_facts_company_type_value_url",
        ),
    )
    with op.batch_alter_table("company_facts", schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f("ix_company_facts_company_id"), ["company_id"], unique=False
        )
        batch_op.create_index(
            "ix_company_facts_company_type", ["company_id", "fact_type"], unique=False
        )
        batch_op.create_index(
            batch_op.f("ix_company_facts_normalized_value"), ["normalized_value"], unique=False
        )


def downgrade() -> None:
    with op.batch_alter_table("company_facts", schema=None) as batch_op:
        batch_op.drop_index(batch_op.f("ix_company_facts_normalized_value"))
        batch_op.drop_index("ix_company_facts_company_type")
        batch_op.drop_index(batch_op.f("ix_company_facts_company_id"))

    op.drop_table("company_facts")
