"""Servicios de campañas: validación, arranque, pausa y cancelación."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import PROVINCE_CODES, PROVINCE_NAME_BY_CODE, PROVINCES
from app.models import Campaign, Job, SearchRun, Sector
from app.utils import utcnow


class CampaignValidationError(ValueError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class CampaignStateError(ValueError):
    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


def validate_filters(
    db: Session,
    *,
    province_filters: list[str],
    sector_filters: list[str],
) -> None:
    unknown_provinces = sorted(set(province_filters) - PROVINCE_CODES)
    if unknown_provinces:
        raise CampaignValidationError(f"Provincias desconocidas: {', '.join(unknown_provinces)}")

    if sector_filters:
        active_slugs = set(db.scalars(select(Sector.slug).where(Sector.is_active.is_(True))))
        unknown_sectors = sorted(set(sector_filters) - active_slugs)
        if unknown_sectors:
            raise CampaignValidationError(f"Rubros desconocidos: {', '.join(unknown_sectors)}")


def start_campaign(db: Session, campaign: Campaign) -> tuple[Campaign, list[SearchRun], int]:
    """Crea una búsqueda provincial por cada provincia de la campaña.

    Los proveedores no se ejecutan en el request. Cada búsqueda queda `pending`
    con su propio job para que el worker las procese secuencialmente.
    """
    if campaign.status == "cancelled":
        raise CampaignStateError("La campaña está cancelada y no se puede iniciar.")
    if campaign.status == "active":
        raise CampaignStateError("La campaña ya está activa.")

    if not campaign.sector_filters:
        raise CampaignValidationError("Configurá al menos un rubro antes de iniciar.")

    validate_filters(
        db,
        province_filters=campaign.province_filters,
        sector_filters=campaign.sector_filters,
    )

    existing_run = db.scalar(
        select(SearchRun)
        .where(
            SearchRun.campaign_id == campaign.id,
            SearchRun.status.in_(("pending", "running")),
        )
        .limit(1)
    )
    if existing_run is not None:
        raise CampaignStateError("La campaña ya tiene una búsqueda pendiente o en ejecución.")

    config = campaign.search_config or {}
    raw_limit = config.get("limit", 50)
    try:
        limit = int(raw_limit)
    except (TypeError, ValueError) as exc:
        raise CampaignValidationError("El límite configurado no es válido.") from exc
    if not 1 <= limit <= 200:
        raise CampaignValidationError("El límite debe estar entre 1 y 200.")

    raw_keywords = config.get("keywords")
    keywords = raw_keywords.strip() if isinstance(raw_keywords, str) else ""
    keywords = keywords or None

    provinces = list(
        dict.fromkeys(campaign.province_filters or [province["code"] for province in PROVINCES])
    )
    sector_slugs = list(dict.fromkeys(campaign.sector_filters))

    runs: list[SearchRun] = []
    for province_code in provinces:
        run = SearchRun(
            campaign_id=campaign.id,
            provider="overpass",
            query=keywords or f"Prospección por campaña: {campaign.name}",
            location=PROVINCE_NAME_BY_CODE[province_code],
            sector=",".join(sector_slugs),
            status="pending",
            search_config={
                "province_code": province_code,
                "sector_slugs": sector_slugs,
                "keywords": keywords,
                "limit": limit,
                "campaign_id": campaign.id,
            },
            limit=limit,
        )
        db.add(run)
        db.flush()
        db.add(
            Job(
                job_type="search_run",
                payload={
                    "campaign_id": campaign.id,
                    "search_run_id": run.id,
                },
                status="pending",
            )
        )
        runs.append(run)

    campaign.status = "active"
    db.commit()
    for run in runs:
        db.refresh(run)
    db.refresh(campaign)
    return campaign, runs, len(runs)


def _cancel_unfinished_runs(
    db: Session,
    campaign_id: int,
    *,
    include_running: bool,
) -> None:
    statuses = ["pending", "running"] if include_running else ["pending"]
    for run in db.scalars(
        select(SearchRun).where(
            SearchRun.campaign_id == campaign_id,
            SearchRun.status.in_(statuses),
        )
    ):
        run.status = "cancelled"
        run.finished_at = utcnow()

    for job in db.scalars(
        select(Job).where(
            Job.job_type == "search_run",
            Job.status.in_(statuses),
        )
    ):
        if (job.payload or {}).get("campaign_id") == campaign_id:
            job.status = "cancelled"
            job.finished_at = utcnow()


def pause_campaign(db: Session, campaign: Campaign) -> Campaign:
    if campaign.status != "active":
        raise CampaignStateError("Solo se puede pausar una campaña activa.")
    campaign.status = "paused"
    _cancel_unfinished_runs(db, campaign.id, include_running=False)
    db.commit()
    db.refresh(campaign)
    return campaign


def cancel_campaign(db: Session, campaign: Campaign) -> Campaign:
    if campaign.status == "cancelled":
        raise CampaignStateError("La campaña ya está cancelada.")
    campaign.status = "cancelled"
    _cancel_unfinished_runs(db, campaign.id, include_running=True)
    db.commit()
    db.refresh(campaign)
    return campaign
