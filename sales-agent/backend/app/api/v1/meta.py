"""Catálogos de referencia: provincias y rubros."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.constants import PROVINCES
from app.database.session import get_db
from app.models import Sector, User
from app.schemas.meta import ProvinceRead, SectorRead

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/provinces", response_model=list[ProvinceRead])
def list_provinces(_user: User = Depends(get_current_user)) -> list[ProvinceRead]:
    return [ProvinceRead(**province) for province in PROVINCES]


@router.get("/sectors", response_model=list[SectorRead])
def list_sectors(
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SectorRead]:
    stmt = select(Sector).where(Sector.is_active.is_(True)).order_by(Sector.id)
    return [SectorRead.model_validate(sector) for sector in db.scalars(stmt)]
