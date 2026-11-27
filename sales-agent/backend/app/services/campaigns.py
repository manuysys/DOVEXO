"""Servicios de campañas: validación, arranque, pausa y cancelación."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.constants import PROVINCE_CODES, PROVINCES
from app.models import Campaign, Job, SearchRun, Sector


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


def start_campaign(db: Session, campaign: Campaign) -> tuple[SearchRun, int]:
    """Encola una búsqueda sin ejecutarla.

    En Fase 1 no hay proveedores de descubrimiento: el `search_run` queda
    pendiente y el job `search_run` espera a la Fase 2. No se inventan
    resultados ni se marca nada como completado.
    """
    if campaign.status == "cancelled":
        raise CampaignStateError("La campaña está cancelada y no se puede iniciar.")

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

    provinces = campaign.province_filters or [province["code"] for province in PROVINCES]
    search_run = SearchRun(
        campaign_id=campaign.id,
        provider=str(campaign.search_config.get("provider", "manual")),
        query="Prospección por campaña",
        location="Argentina" if len(provinces) == len(PROVINCES) else ",".join(provinces),
        sector=",".join(campaign.sector_filters),
        status="pending",
    )
    db.add(search_run)
    db.flush()

    job = Job(
        job_type="search_run",
        payload={
            "campaign_id": campaign.id,
            "search_run_id": search_run.id,
            "province_filters": provinces,
            "sector_filters": campaign.sector_filters,
        },
        status="pending",
    )
    db.add(job)

    campaign.status = "active"
    db.commit()
    db.refresh(search_run)
    db.refresh(campaign)
    return search_run, job.id


def pause_campaign(db: Session, campaign: Campaign) -> Campaign:
    if campaign.status != "active":
        raise CampaignStateError("Solo se puede pausar una campaña activa.")
    campaign.status = "paused"
    db.commit()
    db.refresh(campaign)
    return campaign


def cancel_campaign(db: Session, campaign: Campaign) -> Campaign:
    if campaign.status == "cancelled":
        raise CampaignStateError("La campaña ya está cancelada.")
    campaign.status = "cancelled"
    db.commit()
    db.refresh(campaign)
    return campaign
