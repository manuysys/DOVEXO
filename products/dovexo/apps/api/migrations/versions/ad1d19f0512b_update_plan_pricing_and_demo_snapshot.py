"""update plan pricing and demo subscription snapshot

Revision ID: ad1d19f0512b
Revises: e5f6a7b8c9d0
Create Date: 2026-11-24 12:52:26.708254

Ajusta precios y límites de los planes (sin `ai_monthly_tokens`, que pasa a
aplicarse con un límite global) y el snapshot de precio de la suscripción del
tenant demo. La actualización de la suscripción es un no-op si el tenant demo
no tiene suscripción `professional`.
"""

import json
from collections.abc import Sequence
from decimal import Decimal

from alembic import op
import sqlalchemy as sa

revision: str = "ad1d19f0512b"
down_revision: str | None = "e5f6a7b8c9d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

# Precios y límites nuevos (upgrade) y viejos (downgrade). Los límites se
# serializan con `json.dumps` y se castean a JSONB en SQL; ningún dato viaja
# interpolado en la consulta.
NEW_PLANS = {
    "starter": {
        "price_ars": Decimal("19900.00"),
        "limits": {
            "max_users": 1,
            "max_technicians": 1,
            "max_orders_per_month": 100,
        },
    },
    "professional": {
        "price_ars": Decimal("39900.00"),
        "limits": {
            "max_users": 3,
            "max_technicians": 5,
            "max_orders_per_month": 1000,
        },
    },
    "business": {
        "price_ars": Decimal("64900.00"),
        "limits": {
            "max_users": 5,
            "max_technicians": 20,
            "max_orders_per_month": 10000,
        },
    },
}

OLD_PLANS = {
    "starter": {
        "price_ars": Decimal("29900.00"),
        "limits": {
            "max_users": 1,
            "max_technicians": 1,
            "max_orders_per_month": 100,
            "ai_monthly_tokens": 50000,
        },
    },
    "professional": {
        "price_ars": Decimal("59900.00"),
        "limits": {
            "max_users": 5,
            "max_technicians": 5,
            "max_orders_per_month": 1000,
            "ai_monthly_tokens": 200000,
        },
    },
    "business": {
        "price_ars": Decimal("99900.00"),
        "limits": {
            "max_users": 20,
            "max_technicians": 20,
            "max_orders_per_month": 10000,
            "ai_monthly_tokens": 1000000,
        },
    },
}

_UPDATE_PLAN_SQL = sa.text(
    """
    UPDATE plans
    SET price_ars = :price_ars,
        limits = CAST(:limits AS jsonb),
        updated_at = now()
    WHERE code = :code
    """
)

# Solo demo: se actualiza el snapshot de la suscripción del tenant
# `servicios-demo` al plan `professional`. Si no existe esa suscripción, el
# UPDATE no afecta filas (no-op). No se tocan otras suscripciones.
_UPDATE_DEMO_SNAPSHOT_SQL = sa.text(
    """
    UPDATE subscriptions AS s
    SET price_snapshot = :snapshot,
        updated_at = now()
    FROM tenants AS t,
         plans AS p
    WHERE s.tenant_id = t.id
      AND s.plan_id = p.id
      AND t.slug = :slug
      AND p.code = :plan_code
    """
)

DEMO_SLUG = "servicios-demo"
DEMO_PLAN_CODE = "professional"
NEW_DEMO_SNAPSHOT = Decimal("39900.00")
OLD_DEMO_SNAPSHOT = Decimal("59900.00")


def _apply_plans(plans: dict[str, dict[str, object]]) -> None:
    for code, values in plans.items():
        op.execute(
            _UPDATE_PLAN_SQL.bindparams(
                code=code,
                price_ars=values["price_ars"],
                limits=json.dumps(values["limits"]),
            )
        )


def upgrade() -> None:
    _apply_plans(NEW_PLANS)
    op.execute(
        _UPDATE_DEMO_SNAPSHOT_SQL.bindparams(
            slug=DEMO_SLUG,
            plan_code=DEMO_PLAN_CODE,
            snapshot=NEW_DEMO_SNAPSHOT,
        )
    )


def downgrade() -> None:
    _apply_plans(OLD_PLANS)
    op.execute(
        _UPDATE_DEMO_SNAPSHOT_SQL.bindparams(
            slug=DEMO_SLUG,
            plan_code=DEMO_PLAN_CODE,
            snapshot=OLD_DEMO_SNAPSHOT,
        )
    )
