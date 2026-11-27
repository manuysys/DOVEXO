from __future__ import annotations

import csv
import io
import logging
from collections.abc import AsyncGenerator, Callable
from datetime import datetime
from decimal import Decimal
from typing import cast
from uuid import UUID
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Customer, Payment, Quote, WorkOrder
from app.repositories import exports
from app.services import audit_service

_ARGENTINA_TZ = ZoneInfo("America/Argentina/Buenos_Aires")
_BOM = b"\xef\xbb\xbf"
_BUFFER_FLUSH_BYTES = 65536

logger = logging.getLogger(__name__)

_CUSTOMER_HEADERS = [
    "ID",
    "Nombre",
    "Teléfono",
    "Email",
    "Dirección",
    "Ciudad",
    "Provincia",
    "Código postal",
    "Notas",
    "Estado",
    "Fecha de alta",
]
_WORK_ORDER_HEADERS = [
    "ID",
    "Código",
    "Cliente",
    "Título",
    "Descripción",
    "Prioridad",
    "Estado operativo",
    "Estado comercial",
    "Estado de pago",
    "Técnico asignado",
    "Fecha programada",
    "Fecha de inicio",
    "Fecha de finalización",
    "Fecha de alta",
]
_QUOTE_HEADERS = [
    "ID",
    "Número",
    "Cliente",
    "Orden de trabajo",
    "Estado",
    "Moneda",
    "Subtotal",
    "Descuento",
    "Impuestos",
    "Total",
    "Válido hasta",
    "Enviado el",
    "Aprobado el",
    "Rechazado el",
    "Fecha de alta",
]
_PAYMENT_HEADERS = [
    "ID",
    "Orden de trabajo",
    "Cliente",
    "Presupuesto",
    "Monto",
    "Moneda",
    "Método",
    "Estado",
    "Fecha de pago",
    "Referencia",
    "Notas",
    "Fecha de alta",
]


def _neutralize_csv_value(value: str) -> str:
    """Prefija celdas que podrían interpretarse como fórmulas en hojas de cálculo.

    La neutralización se aplica únicamente a la salida CSV; los datos
    persistidos no se modifican.
    """
    if value and value[0] in {"=", "+", "-", "@", "\t", "\r", "\n"}:
        return "'" + value
    return value


def _format_datetime(value: datetime | None) -> str:
    """Convierte una fecha UTC al huso horario de Argentina."""
    if value is None:
        return ""
    if value.tzinfo is None:
        value = value.replace(tzinfo=ZoneInfo("UTC"))
    return value.astimezone(_ARGENTINA_TZ).strftime("%Y-%m-%d %H:%M:%S")


def _format_decimal(value: Decimal | None) -> str:
    """Formatea montos con dos decimales sin usar float."""
    if value is None:
        return ""
    return f"{value:.2f}"


def _filename(resource_label: str, at: datetime | None = None) -> str:
    """Nombre de archivo con formato `<recurso>-YYYY-MM-DD.csv`."""
    reference = at or datetime.now(_ARGENTINA_TZ)
    return f"{resource_label}-{reference:%Y-%m-%d}.csv"


def _customer_row(item: object) -> list[str]:
    customer = cast(Customer, item)
    return [
        str(customer.id),
        customer.name or "",
        customer.phone or "",
        customer.email or "",
        customer.address or "",
        customer.city or "",
        customer.province or "",
        customer.postal_code or "",
        customer.notes or "",
        customer.status or "",
        _format_datetime(customer.created_at),
    ]


def _work_order_row(item: object) -> list[str]:
    order, customer_name, technician_name = cast(tuple[WorkOrder, str | None, str | None], item)
    return [
        str(order.id),
        order.code,
        customer_name or "",
        order.title,
        order.description or "",
        order.priority,
        order.operational_status,
        order.commercial_status,
        order.payment_status,
        technician_name or "",
        _format_datetime(order.scheduled_at),
        _format_datetime(order.started_at),
        _format_datetime(order.finished_at),
        _format_datetime(order.created_at),
    ]


def _quote_row(item: object) -> list[str]:
    quote, customer_name, work_order_code = cast(tuple[Quote, str | None, str | None], item)
    return [
        str(quote.id),
        quote.number,
        customer_name or "",
        work_order_code or "",
        quote.status,
        quote.currency,
        _format_decimal(quote.subtotal),
        _format_decimal(quote.discount_total),
        _format_decimal(quote.tax_total),
        _format_decimal(quote.total),
        _format_datetime(quote.valid_until),
        _format_datetime(quote.sent_at),
        _format_datetime(quote.approved_at),
        _format_datetime(quote.rejected_at),
        _format_datetime(quote.created_at),
    ]


def _payment_row(item: object) -> list[str]:
    payment, work_order_code, customer_name, quote_number = cast(
        tuple[Payment, str | None, str | None, str | None], item
    )
    return [
        str(payment.id),
        work_order_code or "",
        customer_name or "",
        quote_number or "",
        _format_decimal(payment.amount),
        payment.currency,
        payment.method,
        payment.status,
        _format_datetime(payment.paid_at),
        payment.reference or "",
        payment.notes or "",
        _format_datetime(payment.created_at),
    ]


async def _csv_stream(
    db: AsyncSession,
    iter_fn: Callable[[AsyncSession, UUID], AsyncGenerator[object, None]],
    row_fn: Callable[[object], list[str]],
    headers: list[str],
    tenant_id: UUID,
    actor_user_id: UUID,
    ip: str | None,
    user_agent: str | None,
    resource: str,
) -> AsyncGenerator[bytes, None]:
    """Genera el CSV por bloques y registra auditoría al finalizar."""
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([_neutralize_csv_value(header) for header in headers])
    yield _BOM
    yield buffer.getvalue().encode("utf-8")
    buffer.seek(0)
    buffer.truncate(0)

    row_count = 0
    try:
        async for item in iter_fn(db, tenant_id):
            writer.writerow([_neutralize_csv_value(value) for value in row_fn(item)])
            row_count += 1
            if buffer.tell() > _BUFFER_FLUSH_BYTES:
                yield buffer.getvalue().encode("utf-8")
                buffer.seek(0)
                buffer.truncate(0)

        remaining = buffer.getvalue()
        if remaining:
            yield remaining.encode("utf-8")
    except Exception:
        raise
    else:
        try:
            await audit_service.record(
                db,
                action="export_downloaded",
                entity_type="export",
                entity_id=resource,
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                metadata={
                    "resource": resource,
                    "format": "csv",
                    "row_count": row_count,
                },
                ip=ip,
                user_agent=user_agent,
            )
            await db.commit()
        except Exception:
            # La auditoría no debe romper la descarga.
            logger.exception("export_audit_failed", extra={"resource": resource})


async def export_customers_csv(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor_user_id: UUID,
    ip: str | None,
    user_agent: str | None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Exporta los clientes activos del tenant a CSV."""
    stream = _csv_stream(
        db,
        cast(Callable[[AsyncSession, UUID], AsyncGenerator[object, None]], exports.iter_customers),
        _customer_row,
        _CUSTOMER_HEADERS,
        tenant_id,
        actor_user_id,
        ip,
        user_agent,
        resource="customers",
    )
    return stream, _filename("clientes")


async def export_work_orders_csv(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor_user_id: UUID,
    ip: str | None,
    user_agent: str | None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Exporta las órdenes de trabajo del tenant a CSV."""
    stream = _csv_stream(
        db,
        cast(
            Callable[[AsyncSession, UUID], AsyncGenerator[object, None]], exports.iter_work_orders
        ),
        _work_order_row,
        _WORK_ORDER_HEADERS,
        tenant_id,
        actor_user_id,
        ip,
        user_agent,
        resource="work_orders",
    )
    return stream, _filename("ordenes")


async def export_quotes_csv(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor_user_id: UUID,
    ip: str | None,
    user_agent: str | None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Exporta los presupuestos del tenant a CSV."""
    stream = _csv_stream(
        db,
        cast(Callable[[AsyncSession, UUID], AsyncGenerator[object, None]], exports.iter_quotes),
        _quote_row,
        _QUOTE_HEADERS,
        tenant_id,
        actor_user_id,
        ip,
        user_agent,
        resource="quotes",
    )
    return stream, _filename("presupuestos")


async def export_payments_csv(
    db: AsyncSession,
    *,
    tenant_id: UUID,
    actor_user_id: UUID,
    ip: str | None,
    user_agent: str | None,
) -> tuple[AsyncGenerator[bytes, None], str]:
    """Exporta los pagos del tenant a CSV."""
    stream = _csv_stream(
        db,
        cast(Callable[[AsyncSession, UUID], AsyncGenerator[object, None]], exports.iter_payments),
        _payment_row,
        _PAYMENT_HEADERS,
        tenant_id,
        actor_user_id,
        ip,
        user_agent,
        resource="payments",
    )
    return stream, _filename("pagos")
