from __future__ import annotations

from collections.abc import AsyncGenerator
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import aliased

from app.models import Customer, Payment, Quote, User, WorkOrder

_CHUNK_SIZE = 500


async def iter_customers(
    db: AsyncSession,
    tenant_id: UUID,
    chunk_size: int = _CHUNK_SIZE,
) -> AsyncGenerator[Customer, None]:
    """Clientes activos del tenant, en bloques."""
    offset = 0
    while True:
        result = await db.execute(
            select(Customer)
            .where(
                Customer.tenant_id == tenant_id,
                Customer.deleted_at.is_(None),
            )
            .order_by(Customer.created_at.desc())
            .limit(chunk_size)
            .offset(offset)
        )
        rows = list(result.scalars().all())
        for customer in rows:
            yield customer
        if len(rows) < chunk_size:
            break
        offset += chunk_size


async def iter_work_orders(
    db: AsyncSession,
    tenant_id: UUID,
    chunk_size: int = _CHUNK_SIZE,
) -> AsyncGenerator[tuple[WorkOrder, str | None, str | None], None]:
    """Órdenes de trabajo con nombre de cliente y técnico asignado."""
    technician = aliased(User)
    offset = 0
    while True:
        result = await db.execute(
            select(WorkOrder, Customer.name, technician.full_name)
            .join(Customer, WorkOrder.customer_id == Customer.id)
            .outerjoin(technician, WorkOrder.assigned_user_id == technician.id)
            .where(WorkOrder.tenant_id == tenant_id)
            .order_by(WorkOrder.created_at.desc())
            .limit(chunk_size)
            .offset(offset)
        )
        rows = list(result.all())
        for order, customer_name, technician_name in rows:
            yield order, customer_name, technician_name
        if len(rows) < chunk_size:
            break
        offset += chunk_size


async def iter_quotes(
    db: AsyncSession,
    tenant_id: UUID,
    chunk_size: int = _CHUNK_SIZE,
) -> AsyncGenerator[tuple[Quote, str | None, str | None], None]:
    """Presupuestos con nombre de cliente y código de orden asociada."""
    offset = 0
    while True:
        result = await db.execute(
            select(Quote, Customer.name, WorkOrder.code)
            .join(Customer, Quote.customer_id == Customer.id)
            .outerjoin(WorkOrder, Quote.work_order_id == WorkOrder.id)
            .where(Quote.tenant_id == tenant_id)
            .order_by(Quote.created_at.desc())
            .limit(chunk_size)
            .offset(offset)
        )
        rows = list(result.all())
        for quote, customer_name, work_order_code in rows:
            yield quote, customer_name, work_order_code
        if len(rows) < chunk_size:
            break
        offset += chunk_size


async def iter_payments(
    db: AsyncSession,
    tenant_id: UUID,
    chunk_size: int = _CHUNK_SIZE,
) -> AsyncGenerator[tuple[Payment, str | None, str | None, str | None], None]:
    """Pagos con código de orden, nombre de cliente y número de presupuesto."""
    offset = 0
    while True:
        result = await db.execute(
            select(Payment, WorkOrder.code, Customer.name, Quote.number)
            .join(WorkOrder, Payment.work_order_id == WorkOrder.id)
            .join(Customer, WorkOrder.customer_id == Customer.id)
            .outerjoin(Quote, Payment.quote_id == Quote.id)
            .where(Payment.tenant_id == tenant_id)
            .order_by(Payment.paid_at.desc())
            .limit(chunk_size)
            .offset(offset)
        )
        rows = list(result.all())
        for payment, work_order_code, customer_name, quote_number in rows:
            yield payment, work_order_code, customer_name, quote_number
        if len(rows) < chunk_size:
            break
        offset += chunk_size
