"""Persistencia de campañas."""

from __future__ import annotations

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Campaign, SearchRun


def list_campaigns(db: Session) -> list[Campaign]:
    return list(db.scalars(select(Campaign).order_by(Campaign.created_at.desc(), Campaign.id)))


def get_campaign(db: Session, campaign_id: int) -> Campaign | None:
    return db.get(Campaign, campaign_id)


def get_campaign_by_name(db: Session, name: str) -> Campaign | None:
    return db.scalar(select(Campaign).where(Campaign.name == name))


def create_campaign(db: Session, data: dict[str, Any]) -> Campaign:
    campaign = Campaign(**data)
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


def update_campaign(db: Session, campaign: Campaign, changes: dict[str, Any]) -> Campaign:
    for field, value in changes.items():
        setattr(campaign, field, value)
    db.commit()
    db.refresh(campaign)
    return campaign


def count_campaign_runs(db: Session, campaign_id: int) -> dict[str, int]:
    rows = db.execute(
        select(SearchRun.status, func.count())
        .where(SearchRun.campaign_id == campaign_id)
        .group_by(SearchRun.status)
    )
    return {status: int(count) for status, count in rows}
