"""Validaciones de límites del plan contratado.

El objetivo es no prometer en la landing más de lo que el backend permite.
Se aplican límites de órdenes por mes, usuarios de oficina y técnicos. Los dos
últimos son cupos independientes: un técnico no consume cupo de oficina.
"""

from datetime import UTC, datetime
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import raiseload

from app.core.roles import OFFICE_ROLES, TECHNICIAN_ROLE
from app.models import Invitation, Membership, Plan, Subscription
from app.repositories import billing as billing_repo

_MINIMUM_PLAN_CODE = "starter"


def _office_users_label(limit: int) -> str:
    """Etiqueta legible del cupo de oficina (1 usuario / N usuarios)."""
    noun = "usuario de oficina" if limit == 1 else "usuarios de oficina"
    return f"{limit} {noun}"


def _limit_value(limits: dict[str, object] | None, key: str) -> int | None:
    if not limits:
        return None
    raw = limits.get(key)
    if raw is None:
        return None
    if isinstance(raw, bool):
        return None
    if isinstance(raw, int):
        return raw
    if isinstance(raw, str) and raw.isdigit():
        return int(raw)
    return None


async def _lock_subscription(db: AsyncSession, tenant_id: UUID) -> Subscription | None:
    """Adquiere un lock pesimista sobre la suscripción del tenant."""
    result = await db.execute(
        select(Subscription)
        .where(Subscription.tenant_id == tenant_id)
        .options(raiseload(Subscription.plan))
        .with_for_update()
    )
    return result.scalar_one_or_none()


async def _resolve_plan(db: AsyncSession, tenant_id: UUID) -> Plan | None:
    """Plan aplicable al tenant.

    Si el tenant no tiene suscripción se usa el plan mínimo (starter) como
    fallback: un tenant sin fila de suscripción no debe quedar sin límites.
    """
    row = await billing_repo.get_subscription_with_plan(db, tenant_id)
    if row is not None:
        return row[1]
    return await billing_repo.get_active_plan_by_code(db, _MINIMUM_PLAN_CODE)


async def _resolve_plan_for_update(db: AsyncSession, tenant_id: UUID) -> Plan | None:
    """Igual que `_resolve_plan`, pero bloqueando la suscripción si existe."""
    subscription = await _lock_subscription(db, tenant_id)
    if subscription is None:
        return await billing_repo.get_active_plan_by_code(db, _MINIMUM_PLAN_CODE)
    return await db.get(Plan, subscription.plan_id)


async def _count_active_office_users(db: AsyncSession, tenant_id: UUID) -> int:
    """Membresías activas que consumen cupo de oficina (incluye al dueño)."""
    result = await db.scalar(
        select(func.count())
        .select_from(Membership)
        .where(
            Membership.tenant_id == tenant_id,
            Membership.status == "active",
            Membership.role.in_(OFFICE_ROLES),
        )
    )
    return int(result or 0)


async def _count_active_technicians(db: AsyncSession, tenant_id: UUID) -> int:
    result = await db.scalar(
        select(func.count())
        .select_from(Membership)
        .where(
            Membership.tenant_id == tenant_id,
            Membership.status == "active",
            Membership.role == TECHNICIAN_ROLE,
        )
    )
    return int(result or 0)


async def _count_pending_office_invitations(db: AsyncSession, tenant_id: UUID) -> int:
    now = datetime.now(UTC)
    result = await db.scalar(
        select(func.count())
        .select_from(Invitation)
        .where(
            Invitation.tenant_id == tenant_id,
            Invitation.role.in_(OFFICE_ROLES),
            Invitation.accepted_at.is_(None),
            Invitation.revoked_at.is_(None),
            Invitation.expires_at > now,
        )
    )
    return int(result or 0)


async def _count_pending_technician_invitations(db: AsyncSession, tenant_id: UUID) -> int:
    now = datetime.now(UTC)
    result = await db.scalar(
        select(func.count())
        .select_from(Invitation)
        .where(
            Invitation.tenant_id == tenant_id,
            Invitation.role == TECHNICIAN_ROLE,
            Invitation.accepted_at.is_(None),
            Invitation.revoked_at.is_(None),
            Invitation.expires_at > now,
        )
    )
    return int(result or 0)


async def assert_can_create_work_order(db: AsyncSession, *, tenant_id: UUID) -> None:
    plan = await _resolve_plan(db, tenant_id)
    if plan is None:
        return

    limit = _limit_value(plan.limits, "max_orders_per_month")
    if limit is None:
        limit = _limit_value(plan.limits, "orders_per_month")
    if limit is None or limit <= 0:
        return

    used = await billing_repo.count_work_orders_this_month(db, tenant_id)
    if used >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"El plan {plan.name} permite {limit} órdenes por mes. "
                "Cambiá de plan para crear más."
            ),
        )


async def assert_can_invite_user(db: AsyncSession, *, tenant_id: UUID) -> None:
    """Valida que el tenant no haya alcanzado el límite de usuarios de oficina.

    El cálculo incluye membresías activas de oficina (owner, admin, dispatcher,
    viewer) más invitaciones pendientes a esos roles. Los técnicos no consumen
    este cupo.
    """
    plan = await _resolve_plan_for_update(db, tenant_id)
    if plan is None:
        return

    limit = _limit_value(plan.limits, "max_users")
    if limit is None or limit <= 0:
        return

    active = await _count_active_office_users(db, tenant_id)
    pending = await _count_pending_office_invitations(db, tenant_id)
    if active + pending >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"El plan {plan.name} permite hasta {_office_users_label(limit)}. "
                "Cambiá de plan o revocá invitaciones pendientes."
            ),
        )


async def assert_can_invite_technician(db: AsyncSession, *, tenant_id: UUID) -> None:
    """Valida que el tenant no haya alcanzado el límite de técnicos.

    El cálculo incluye técnicos activos más invitaciones pendientes a técnicos.
    """
    plan = await _resolve_plan_for_update(db, tenant_id)
    if plan is None:
        return

    limit = _limit_value(plan.limits, "max_technicians")
    if limit is None or limit <= 0:
        return

    active = await _count_active_technicians(db, tenant_id)
    pending = await _count_pending_technician_invitations(db, tenant_id)
    if active + pending >= limit:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"El plan {plan.name} permite hasta {limit} técnicos. "
                "Cambiá de plan o revocá invitaciones pendientes."
            ),
        )
