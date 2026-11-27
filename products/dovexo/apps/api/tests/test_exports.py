from __future__ import annotations

import csv
import io
import re
import uuid
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import pytest
from httpx import AsyncClient, Response
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import AuditLog, Customer


async def _register(
    client: AsyncClient,
    email: str,
    company: str,
) -> tuple[str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "super-secret-123",
            "full_name": "Test User",
            "company_name": company,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    return body["access_token"], body["tenants"][0]["id"]


def _headers(token: str, tenant_id: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id}


async def _invite_and_login(
    client: AsyncClient,
    owner_token: str,
    tenant_id: str,
    email: str,
    role: str,
) -> str:
    invite_response = await client.post(
        "/api/v1/team/invitations",
        json={"email": email, "role": role, "full_name": "Invited User"},
        headers=_headers(owner_token, tenant_id),
    )
    assert invite_response.status_code == 201, invite_response.text
    invitation_url = invite_response.json()["invitation_url"]
    token = urlparse(invitation_url).path.split("/")[-1]

    accept_response = await client.post(
        f"/api/v1/public/invitations/{token}/accept",
        json={"full_name": "Invited User", "password": "super-secret-123"},
    )
    assert accept_response.status_code == 200, accept_response.text
    return accept_response.json()["access_token"]


async def _create_customer(
    client: AsyncClient,
    token: str,
    tenant_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    payload = {
        "name": "Cliente Ejemplo",
        "email": "cliente@example.com",
        "phone": "+54 11 5555-1234",
    }
    payload.update(kwargs)
    response = await client.post(
        "/api/v1/customers",
        json=payload,
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_work_order(
    client: AsyncClient,
    token: str,
    tenant_id: str,
    customer_id: str,
    **kwargs: Any,
) -> dict[str, Any]:
    payload = {
        "customer_id": customer_id,
        "title": "Orden de prueba",
        "priority": "normal",
    }
    payload.update(kwargs)
    response = await client.post(
        "/api/v1/work-orders",
        json=payload,
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_quote(
    client: AsyncClient,
    token: str,
    tenant_id: str,
    customer_id: str,
    work_order_id: str | None = None,
) -> dict[str, Any]:
    payload = {
        "customer_id": customer_id,
        "work_order_id": work_order_id,
        "items": [
            {
                "description": "Diagnóstico",
                "quantity": "1",
                "unit_price": "15000.00",
            }
        ],
    }
    response = await client.post(
        "/api/v1/quotes",
        json=payload,
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_payment(
    client: AsyncClient,
    token: str,
    tenant_id: str,
    work_order_id: str,
    amount: str = "5000.00",
) -> dict[str, Any]:
    payload = {"work_order_id": work_order_id, "amount": amount, "method": "cash"}
    response = await client.post(
        "/api/v1/payments",
        json=payload,
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 201, response.text
    return response.json()


def _allowed_cors_origin() -> str:
    """Primer origen explícito configurado en CORS (nunca el comodín).

    Se lee de la configuración real para que la prueba valide el middleware tal
    como quedó construido al importar la app, sin hardcodear orígenes.
    """
    origins = [origin for origin in settings.api_cors_origins if origin.strip() != "*"]
    if not origins:
        pytest.skip("CORS no define orígenes explícitos en esta configuración")
    return origins[0]


def _exposed_headers(response: Response) -> set[str]:
    raw = response.headers.get("access-control-expose-headers", "")
    return {token.strip().lower() for token in raw.split(",") if token.strip()}


def _parse_csv(content: bytes) -> tuple[list[str], list[list[str]]]:
    text = content.decode("utf-8-sig")
    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    assert len(rows) >= 1, "El CSV no tiene encabezados"
    return rows[0], rows[1:]


@pytest.mark.parametrize("endpoint", ["customers", "orders", "quotes", "payments"])
async def test_export_requires_authentication(client: AsyncClient, endpoint: str) -> None:
    response = await client.get(f"/api/v1/exports/{endpoint}.csv")
    assert response.status_code == 401


async def test_export_customers_csv_happy(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-owner@example.com", "Export Co")
    customer = await _create_customer(
        client,
        token,
        tenant_id,
        name="Carlos Gómez",
        email="carlos@example.com",
        phone="+54 11 5555-1234",
        address="Av. Corrientes 1234",
    )

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200, response.text
    assert "text/csv" in response.headers["content-type"]
    disposition = response.headers["content-disposition"]
    assert re.search(r'filename="clientes-\d{4}-\d{2}-\d{2}\.csv"', disposition)

    assert response.content.startswith(b"\xef\xbb\xbf")
    headers, rows = _parse_csv(response.content)
    assert headers[0] == "ID"
    assert "Nombre" in headers
    assert "Email" in headers
    assert len(rows) == 1
    row = rows[0]
    assert row[headers.index("Nombre")] == "Carlos Gómez"
    assert row[headers.index("Email")] == "carlos@example.com"
    assert row[headers.index("Dirección")] == "Av. Corrientes 1234"
    assert row[headers.index("ID")] == str(customer["id"])


async def test_export_work_orders_csv_happy(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-orders@example.com", "Export Orders Co")
    customer = await _create_customer(client, token, tenant_id, name="Carlos Gómez")
    order = await _create_work_order(
        client,
        token,
        tenant_id,
        customer["id"],
        title="Reparación de aire",
        description="Cambio de filtro",
    )

    response = await client.get(
        "/api/v1/exports/orders.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200, response.text
    headers, rows = _parse_csv(response.content)
    assert "Código" in headers
    assert "Cliente" in headers
    assert "Título" in headers
    assert len(rows) == 1
    row = rows[0]
    assert row[headers.index("Código")] == order["code"]
    assert row[headers.index("Cliente")] == "Carlos Gómez"
    assert row[headers.index("Título")] == "Reparación de aire"


async def test_export_quotes_csv_happy(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-quotes@example.com", "Export Quotes Co")
    customer = await _create_customer(client, token, tenant_id, name="Carlos Gómez")
    order = await _create_work_order(client, token, tenant_id, customer["id"])
    quote = await _create_quote(client, token, tenant_id, customer["id"], order["id"])

    response = await client.get(
        "/api/v1/exports/quotes.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200, response.text
    headers, rows = _parse_csv(response.content)
    assert "Número" in headers
    assert "Cliente" in headers
    assert "Total" in headers
    assert len(rows) == 1
    row = rows[0]
    assert row[headers.index("Número")] == quote["number"]
    assert row[headers.index("Cliente")] == "Carlos Gómez"
    assert row[headers.index("Total")] == "15000.00"


async def test_export_payments_csv_happy(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-payments@example.com", "Export Payments Co")
    customer = await _create_customer(client, token, tenant_id, name="Carlos Gómez")
    order = await _create_work_order(client, token, tenant_id, customer["id"])
    payment = await _create_payment(client, token, tenant_id, order["id"], amount="7500.50")

    response = await client.get(
        "/api/v1/exports/payments.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200, response.text
    headers, rows = _parse_csv(response.content)
    assert "Monto" in headers
    assert "Orden de trabajo" in headers
    assert "Cliente" in headers
    assert len(rows) == 1
    row = rows[0]
    assert row[headers.index("Monto")] == "7500.50"
    assert row[headers.index("Orden de trabajo")] == order["code"]
    assert row[headers.index("Cliente")] == "Carlos Gómez"
    assert row[headers.index("ID")] == str(payment["id"])


@pytest.mark.parametrize("role", ["technician", "viewer"])
async def test_export_forbidden_to_non_export_roles(client: AsyncClient, role: str) -> None:
    owner_token, tenant_id = await _register(
        client, "export-perms-owner@example.com", "Export Perms Co"
    )
    forbidden_token = await _invite_and_login(
        client, owner_token, tenant_id, f"export-{role}@example.com", role
    )

    for endpoint in ("customers", "orders", "quotes", "payments"):
        response = await client.get(
            f"/api/v1/exports/{endpoint}.csv",
            headers=_headers(forbidden_token, tenant_id),
        )
        assert response.status_code == 403, f"{endpoint} debería rechazar {role}"


async def test_dispatcher_can_export(client: AsyncClient) -> None:
    owner_token, tenant_id = await _register(
        client, "export-dispatcher-owner@example.com", "Export Dispatcher Co"
    )
    dispatcher_token = await _invite_and_login(
        client, owner_token, tenant_id, "export-dispatcher@example.com", "dispatcher"
    )

    for endpoint in ("customers", "orders", "quotes", "payments"):
        response = await client.get(
            f"/api/v1/exports/{endpoint}.csv",
            headers=_headers(dispatcher_token, tenant_id),
        )
        assert response.status_code == 200, f"{endpoint} debería permitir dispatcher"


async def test_export_tenant_isolation(client: AsyncClient) -> None:
    token_a, tenant_a = await _register(client, "iso-owner-a@example.com", "Empresa A")
    token_b, tenant_b = await _register(client, "iso-owner-b@example.com", "Empresa B")

    await _create_customer(client, token_a, tenant_a, name="Cliente A")
    await _create_customer(client, token_b, tenant_b, name="Cliente B")

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token_a, tenant_a),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert len(rows) == 1
    assert rows[0][headers.index("Nombre")] == "Cliente A"
    assert "Cliente B" not in response.text


async def test_export_customers_csv_empty_includes_headers(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-empty@example.com", "Export Empty Co")

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert headers == [
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
    assert rows == []


async def test_export_customers_csv_formula_neutralization(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    token, tenant_id = await _register(client, "export-formula@example.com", "Export Formula Co")
    customer = Customer(
        tenant_id=uuid.UUID(tenant_id),
        name="=cmd|' /C calc'!A0",
        phone="+54 11 5555-1234",
        email="formula@example.com",
        address="@calle",
        city="\tabc",
        province="\nprovincia",
        notes="-nota",
    )
    db_session.add(customer)
    await db_session.commit()

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert len(rows) == 1
    row = rows[0]
    assert row[headers.index("Nombre")].startswith("'")
    assert row[headers.index("Teléfono")].startswith("'")
    assert row[headers.index("Dirección")].startswith("'")
    assert row[headers.index("Ciudad")].startswith("'")
    assert row[headers.index("Provincia")].startswith("'")
    assert row[headers.index("Notas")].startswith("'")
    # El email no comienza con carácter de riesgo.
    assert row[headers.index("Email")] == "formula@example.com"


async def test_export_customers_csv_quoting_and_escaping(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-quote@example.com", "Export Quote Co")
    await _create_customer(
        client,
        token,
        tenant_id,
        name='Gómez, Carlos "El Pro"',
        email="carlos@example.com",
    )

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert len(rows) == 1
    assert rows[0][headers.index("Nombre")] == 'Gómez, Carlos "El Pro"'


async def test_export_payments_csv_decimal_formatting(client: AsyncClient) -> None:
    token, tenant_id = await _register(client, "export-decimal@example.com", "Export Decimal Co")
    customer = await _create_customer(client, token, tenant_id)
    order = await _create_work_order(client, token, tenant_id, customer["id"])
    await _create_payment(client, token, tenant_id, order["id"], amount="123.5")

    response = await client.get(
        "/api/v1/exports/payments.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert rows[0][headers.index("Monto")] == "123.50"


async def test_export_customers_csv_timezone_conversion(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    token, tenant_id = await _register(client, "export-tz@example.com", "Export TZ Co")
    customer = await _create_customer(client, token, tenant_id, name="Carlos TZ")
    customer_id = customer["id"]

    utc_dt = datetime(2026, 1, 15, 12, 0, 0, tzinfo=UTC)
    await db_session.execute(
        update(Customer).where(Customer.id == uuid.UUID(customer_id)).values(created_at=utc_dt)
    )
    await db_session.commit()

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200
    headers, rows = _parse_csv(response.content)
    assert rows[0][headers.index("Fecha de alta")] == "2026-01-15 09:00:00"


async def test_export_customers_csv_audit_log_recorded(
    client: AsyncClient,
    db_session: AsyncSession,
) -> None:
    token, tenant_id = await _register(client, "export-audit@example.com", "Export Audit Co")
    await _create_customer(client, token, tenant_id, name="Carlos Audit")

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers=_headers(token, tenant_id),
    )
    assert response.status_code == 200

    result = await db_session.execute(
        select(AuditLog)
        .where(
            AuditLog.tenant_id == uuid.UUID(tenant_id),
            AuditLog.action == "export_downloaded",
        )
        .order_by(AuditLog.created_at.desc())
    )
    log = result.scalar_one()
    assert log.entity_type == "export"
    assert log.entity_id == "customers"
    assert log.details is not None
    assert log.details["resource"] == "customers"
    assert log.details["format"] == "csv"
    assert log.details["row_count"] == 1


@pytest.mark.parametrize("endpoint", ["customers", "orders", "quotes", "payments"])
async def test_export_exposes_content_disposition_to_allowed_origin(
    client: AsyncClient, endpoint: str
) -> None:
    origin = _allowed_cors_origin()
    token, tenant_id = await _register(
        client, f"export-cors-{endpoint}@example.com", "Export Cors Co"
    )

    response = await client.get(
        f"/api/v1/exports/{endpoint}.csv",
        headers={**_headers(token, tenant_id), "Origin": origin},
    )
    assert response.status_code == 200, response.text
    assert response.headers["access-control-allow-origin"] == origin
    # Solo se expone Content-Disposition; nada de comodines ni headers extra.
    assert response.headers["access-control-expose-headers"] == "Content-Disposition"
    assert _exposed_headers(response) == {"content-disposition"}
    assert response.headers["content-disposition"].startswith("attachment; filename=")


async def test_export_does_not_expose_headers_to_disallowed_origin(
    client: AsyncClient,
) -> None:
    token, tenant_id = await _register(
        client, "export-cors-evil@example.com", "Export Cors Evil Co"
    )
    await _create_customer(client, token, tenant_id, name="Cliente CORS")

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers={**_headers(token, tenant_id), "Origin": "https://evil.example"},
    )
    assert response.status_code == 200, response.text
    # El origen no permitido no obtiene `Access-Control-Allow-Origin`, así que el
    # navegador bloquea la lectura de la respuesta y el header expuesto es
    # irrelevante: el límite real es la ausencia de allow-origin.
    assert "access-control-allow-origin" not in response.headers
    assert "origin" in response.headers.get("vary", "").lower()


async def test_export_forbidden_role_still_403_with_allowed_origin(
    client: AsyncClient,
) -> None:
    origin = _allowed_cors_origin()
    owner_token, tenant_id = await _register(
        client, "export-cors-perms-owner@example.com", "Export Cors Perms Co"
    )
    viewer_token = await _invite_and_login(
        client, owner_token, tenant_id, "export-cors-viewer@example.com", "viewer"
    )

    for endpoint in ("customers", "orders", "quotes", "payments"):
        response = await client.get(
            f"/api/v1/exports/{endpoint}.csv",
            headers={**_headers(viewer_token, tenant_id), "Origin": origin},
        )
        assert response.status_code == 403, f"{endpoint} debería seguir rechazando viewer"
        assert response.headers["access-control-allow-origin"] == origin


async def test_export_tenant_isolation_with_allowed_origin(client: AsyncClient) -> None:
    origin = _allowed_cors_origin()
    token_a, tenant_a = await _register(client, "cors-iso-a@example.com", "CORS Empresa A")
    token_b, tenant_b = await _register(client, "cors-iso-b@example.com", "CORS Empresa B")

    await _create_customer(client, token_a, tenant_a, name="Cliente CORS A")
    await _create_customer(client, token_b, tenant_b, name="Cliente CORS B")

    response = await client.get(
        "/api/v1/exports/customers.csv",
        headers={**_headers(token_a, tenant_a), "Origin": origin},
    )
    assert response.status_code == 200, response.text
    headers, rows = _parse_csv(response.content)
    assert len(rows) == 1
    assert rows[0][headers.index("Nombre")] == "Cliente CORS A"
    assert "Cliente CORS B" not in response.text
