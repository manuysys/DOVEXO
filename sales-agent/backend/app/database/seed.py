"""Semillas idempotentes y arranque de la base.

Las semillas crean datos solo si faltan. No sobrescriben cambios hechos por el
usuario desde la API.
"""

from __future__ import annotations

from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.constants import DOVEXO_PRODUCT, INITIAL_CAMPAIGN, SECTORS
from app.core.logging import get_logger
from app.models import Campaign, Product, Sector
from app.repositories.campaigns import get_campaign_by_name
from app.repositories.products import get_product_by_slug
from app.services.auth import ensure_initial_admin

logger = get_logger(__name__)

REQUIRED_TABLES = ("users", "products", "campaigns", "sectors", "jobs")


def seed_sectors(db: Session) -> int:
    existing = set(db.scalars(select(Sector.slug)))
    added = 0
    for sector_data in SECTORS:
        if sector_data["slug"] in existing:
            continue
        db.add(Sector(**sector_data))
        added += 1
    if added:
        db.commit()
    return added


def seed_dovexo_product(db: Session) -> Product | None:
    existing = get_product_by_slug(db, DOVEXO_PRODUCT["slug"])
    if existing is not None:
        return existing

    product = Product(**DOVEXO_PRODUCT)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def seed_initial_campaign(db: Session) -> Campaign | None:
    existing = get_campaign_by_name(db, INITIAL_CAMPAIGN["name"])
    if existing is not None:
        return existing

    product = get_product_by_slug(db, DOVEXO_PRODUCT["slug"])
    if product is None:
        logger.warning("No se encontró el producto DOVEXO; no se creó la campaña inicial.")
        return None

    campaign = Campaign(product_id=product.id, **INITIAL_CAMPAIGN)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def bootstrap_database(
    db: Session,
    settings: Settings | None = None,
) -> dict[str, int | bool]:
    """Aplica semillas si el esquema existe. Devuelve un resumen para logs/tests."""
    settings = settings or get_settings()
    summary: dict[str, int | bool] = {
        "schema_ready": False,
        "admin_created": False,
        "sectors_added": 0,
        "product_created": False,
        "campaign_created": False,
    }

    inspector = inspect(db.get_bind())
    missing = [table for table in REQUIRED_TABLES if not inspector.has_table(table)]
    if missing:
        logger.error(
            "Faltan tablas (%s). Ejecutá `uv run alembic upgrade head` antes de iniciar.",
            ", ".join(missing),
        )
        return summary

    summary["schema_ready"] = True

    admin = ensure_initial_admin(db, settings)
    summary["admin_created"] = admin is not None
    summary["sectors_added"] = seed_sectors(db)

    product_was_missing = get_product_by_slug(db, DOVEXO_PRODUCT["slug"]) is None
    product = seed_dovexo_product(db)
    summary["product_created"] = product_was_missing and product is not None

    campaign_was_missing = get_campaign_by_name(db, INITIAL_CAMPAIGN["name"]) is None
    campaign = seed_initial_campaign(db)
    summary["campaign_created"] = campaign_was_missing and campaign is not None

    return summary
