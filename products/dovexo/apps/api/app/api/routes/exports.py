from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.responses import StreamingResponse

from app.api.deps import get_client_ip, require_roles
from app.core.db import get_db
from app.models import Membership
from app.services import export_service

router = APIRouter(prefix="/exports", tags=["exports"])

EXPORT_ROLES = ("owner", "admin", "dispatcher")


@router.get("/customers.csv")
async def export_customers_csv(
    request: Request,
    membership: Membership = Depends(require_roles(*EXPORT_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Descarga CSV con los clientes activos del tenant actual."""
    stream, filename = await export_service.export_customers_csv(
        db,
        tenant_id=membership.tenant_id,
        actor_user_id=membership.user_id,
        ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return StreamingResponse(
        stream,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/orders.csv")
async def export_work_orders_csv(
    request: Request,
    membership: Membership = Depends(require_roles(*EXPORT_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Descarga CSV con las órdenes de trabajo del tenant actual."""
    stream, filename = await export_service.export_work_orders_csv(
        db,
        tenant_id=membership.tenant_id,
        actor_user_id=membership.user_id,
        ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return StreamingResponse(
        stream,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/quotes.csv")
async def export_quotes_csv(
    request: Request,
    membership: Membership = Depends(require_roles(*EXPORT_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Descarga CSV con los presupuestos del tenant actual."""
    stream, filename = await export_service.export_quotes_csv(
        db,
        tenant_id=membership.tenant_id,
        actor_user_id=membership.user_id,
        ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return StreamingResponse(
        stream,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/payments.csv")
async def export_payments_csv(
    request: Request,
    membership: Membership = Depends(require_roles(*EXPORT_ROLES)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    """Descarga CSV con los pagos del tenant actual."""
    stream, filename = await export_service.export_payments_csv(
        db,
        tenant_id=membership.tenant_id,
        actor_user_id=membership.user_id,
        ip=get_client_ip(request),
        user_agent=request.headers.get("user-agent"),
    )
    return StreamingResponse(
        stream,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
