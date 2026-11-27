"""Pruebas de los hallazgos de la auditoría de seguridad (bloque 2026-11-18).

Cubre: IP de cliente y lockout, validación de Origin, rol y rate limit del
asistente, webhook de WhatsApp, suscripción al crear empresa, tokens de
dispositivo, adjuntos del técnico, totales de uso de IA y rotación de refresh.
"""

import asyncio
import hashlib
import hmac
import json
import re
from decimal import Decimal
from uuid import UUID

import pytest
from fastapi import HTTPException
from httpx import AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import settings
from app.core.rate_limit import reset_rate_limits
from app.models import (
    AIUsageLog,
    DeviceToken,
    Membership,
    Plan,
    RefreshToken,
    Subscription,
    WhatsAppMessage,
)
from app.services import auth_service

PASSWORD = "super-secret-123"  # noqa: S105 - contraseña de prueba
_IMAGE_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xd9"

WHATSAPP_CONFIG = {
    "phone_number_id": "123456789012345",
    "business_account_id": "987654321098765",
    "access_token": "test-access-token",
    "verify_token": "webhook-verify-token",
    "app_secret": "test-app-secret",
    "active": True,
}


async def _register(client: AsyncClient, email: str, company: str) -> tuple[str, str, str]:
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": PASSWORD,
            "full_name": "Test User",
            "company_name": company,
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    token = body["access_token"]
    tenant_id = body["tenants"][0]["id"]
    me = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id},
    )
    assert me.status_code == 200, me.text
    return token, tenant_id, me.json()["user"]["id"]


def _headers(token: str, tenant_id: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}", "X-Tenant-ID": tenant_id}


async def _add_membership(
    db_session: AsyncSession, tenant_id: str, user_id: str, role: str
) -> None:
    db_session.add(Membership(tenant_id=UUID(tenant_id), user_id=UUID(user_id), role=role))
    await db_session.commit()


def _inbound_payload(phone_number_id: str) -> dict[str, object]:
    return {
        "object": "whatsapp_business_account",
        "entry": [
            {
                "id": "BUSINESS_ID",
                "changes": [
                    {
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "15550001234",
                                "phone_number_id": phone_number_id,
                            },
                            "messages": [
                                {
                                    "from": "+5491112345678",
                                    "id": "wamid.hardening.1",
                                    "timestamp": "1234567890",
                                    "text": {"body": "Hola"},
                                    "type": "text",
                                }
                            ],
                        },
                        "field": "messages",
                    }
                ],
            }
        ],
    }


# --- Hallazgo 2: X-Real-IP falsificable -------------------------------------


async def test_lockout_not_bypassed_by_rotated_real_ip_header(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "lockout_max_attempts", 3)
    monkeypatch.setattr(settings, "trust_proxy_headers", False)

    # Emails distintos y header rotado: sin confiar en el proxy el lockout por
    # IP debe aplicarse igual.
    for index in range(3):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": f"rotated-{index}@example.com", "password": "wrong-password-123"},
            headers={"X-Real-IP": f"203.0.113.{index}"},
        )
        assert response.status_code == 401, response.text

    blocked = await client.post(
        "/api/v1/auth/login",
        json={"email": "rotated-new@example.com", "password": "wrong-password-123"},
        headers={"X-Real-IP": "203.0.113.200"},
    )
    assert blocked.status_code == 429
    assert "demasiados intentos" in blocked.json()["detail"].lower()


async def test_lockout_uses_proxy_header_only_when_trusted(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "lockout_max_attempts", 3)
    monkeypatch.setattr(settings, "trust_proxy_headers", True)

    for index in range(3):
        response = await client.post(
            "/api/v1/auth/login",
            json={"email": f"trusted-{index}@example.com", "password": "wrong-password-123"},
            headers={"X-Real-IP": f"198.51.100.{index}"},
        )
        assert response.status_code == 401, response.text

    # Con proxy confiable cada IP es un cubo distinto: el cuarto intento con otra
    # IP no está bloqueado (documenta la dependencia de TRUST_PROXY_HEADERS).
    allowed = await client.post(
        "/api/v1/auth/login",
        json={"email": "trusted-new@example.com", "password": "wrong-password-123"},
        headers={"X-Real-IP": "198.51.100.250"},
    )
    assert allowed.status_code == 401


# --- Hallazgo 3: origen por prefijo ----------------------------------------


async def test_cookie_origin_prefix_is_rejected(
    client: AsyncClient, register_payload: dict[str, str], monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "api_cors_origins", ["http://localhost:3000"])
    reg = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201

    prefix_origin = await client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "http://localhost:3000.evil.example"},
    )
    assert prefix_origin.status_code == 403

    prefix_port = await client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "http://localhost:30001"},
    )
    assert prefix_port.status_code == 403

    evil_referer = await client.post(
        "/api/v1/auth/refresh",
        headers={"Referer": "http://localhost:3000.evil.example/login"},
    )
    assert evil_referer.status_code == 403

    # Un origen exacto y un Referer del mismo origen con path sí se aceptan.
    allowed = await client.post(
        "/api/v1/auth/refresh",
        headers={"Referer": "http://localhost:3000/dashboard"},
    )
    assert allowed.status_code == 200

    allowed_origin = await client.post(
        "/api/v1/auth/refresh",
        headers={"Origin": "http://localhost:3000"},
    )
    assert allowed_origin.status_code == 200


# --- Hallazgo 4: /ai/chat sin rol ni rate limit -----------------------------


async def test_ai_chat_requires_operational_role(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    owner_token, tenant_id, _ = await _register(
        client, "owner-ai-role@example.com", "Empresa AI Rol"
    )
    tech_token, _, tech_id = await _register(client, "tech-ai-role@example.com", "Tech AI Rol")
    viewer_token, _, viewer_id = await _register(
        client, "viewer-ai-role@example.com", "Viewer AI Rol"
    )
    await _add_membership(db_session, tenant_id, tech_id, "technician")
    await _add_membership(db_session, tenant_id, viewer_id, "viewer")

    tech_response = await client.post(
        "/api/v1/ai/chat",
        json={"message": "hola"},
        headers=_headers(tech_token, tenant_id),
    )
    assert tech_response.status_code == 403, tech_response.text

    viewer_response = await client.post(
        "/api/v1/ai/chat",
        json={"message": "hola"},
        headers=_headers(viewer_token, tenant_id),
    )
    assert viewer_response.status_code == 403, viewer_response.text

    owner_response = await client.post(
        "/api/v1/ai/chat",
        json={"message": "hola"},
        headers=_headers(owner_token, tenant_id),
    )
    assert owner_response.status_code == 200, owner_response.text


async def test_ai_chat_is_rate_limited_per_user(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    token, tenant_id, _ = await _register(client, "owner-ai-limit@example.com", "Empresa AI Limit")
    headers = _headers(token, tenant_id)

    # Se habilita después del registro para que solo el chat pase por el
    # limitador de la ruta (el middleware de auth usa otro pool de conexiones).
    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "rate_limit_ai_chat_per_minute", 1)
    reset_rate_limits()

    first = await client.post("/api/v1/ai/chat", json={"message": "hola"}, headers=headers)
    assert first.status_code == 200, first.text

    second = await client.post("/api/v1/ai/chat", json={"message": "hola"}, headers=headers)
    assert second.status_code == 429, second.text
    assert second.headers["retry-after"].isdigit()

    reset_rate_limits()


async def test_ai_chat_rate_limit_buckets_are_per_user_and_tenant(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    user1_token, tenant1, user1_id = await _register(
        client, "owner-bucket-1@example.com", "Empresa Bucket 1"
    )
    user2_token, tenant2, _ = await _register(
        client, "owner-bucket-2@example.com", "Empresa Bucket 2"
    )
    await _add_membership(db_session, tenant2, user1_id, "admin")

    monkeypatch.setattr(settings, "rate_limit_enabled", True)
    monkeypatch.setattr(settings, "rate_limit_ai_chat_per_minute", 1)
    reset_rate_limits()

    first = await client.post(
        "/api/v1/ai/chat", json={"message": "hola"}, headers=_headers(user1_token, tenant1)
    )
    assert first.status_code == 200, first.text

    blocked = await client.post(
        "/api/v1/ai/chat", json={"message": "hola"}, headers=_headers(user1_token, tenant1)
    )
    assert blocked.status_code == 429, blocked.text

    # Mismo usuario en otro tenant: cubo distinto.
    other_tenant = await client.post(
        "/api/v1/ai/chat", json={"message": "hola"}, headers=_headers(user1_token, tenant2)
    )
    assert other_tenant.status_code == 200, other_tenant.text

    # Otro usuario en el mismo tenant: cubo distinto.
    other_user = await client.post(
        "/api/v1/ai/chat", json={"message": "hola"}, headers=_headers(user2_token, tenant2)
    )
    assert other_user.status_code == 200, other_user.text

    reset_rate_limits()


# --- Hallazgo 5: webhook de WhatsApp --------------------------------------


async def test_webhook_get_returns_503_without_verify_token(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_verify_token", "")
    response = await client.get(
        "/api/v1/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=anything&hub.challenge=12345"
    )
    assert response.status_code == 503


async def test_webhook_rejects_oversized_payload(client: AsyncClient) -> None:
    body = b"{" + b"x" * (1024 * 1024)
    response = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=body,
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413


async def _stream_chunks(data: bytes, size: int = 8192):
    for start in range(0, len(data), size):
        yield data[start : start + size]


async def test_webhook_rejects_oversized_chunked_payload(client: AsyncClient) -> None:
    # Sin Content-Length (transfer-encoding: chunked) el tope se aplica igual.
    oversized = b"{" + b"x" * (1024 * 1024)
    response = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=_stream_chunks(oversized),
        headers={"Content-Type": "application/json"},
    )
    assert response.status_code == 413


async def test_webhook_verifies_signature_over_chunked_body(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_app_secret", "chunked-secret")
    raw_body = json.dumps(_inbound_payload("999999999999999")).encode("utf-8")
    signature = "sha256=" + hmac.new(b"chunked-secret", raw_body, hashlib.sha256).hexdigest()

    accepted = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=_stream_chunks(raw_body),
        headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"},
    )
    assert accepted.status_code == 200, accepted.text

    rejected = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=_stream_chunks(raw_body + b" "),
        headers={"X-Hub-Signature-256": signature, "Content-Type": "application/json"},
    )
    assert rejected.status_code == 403


async def test_webhook_verifies_signature_before_parsing(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_app_secret", "global-app-secret")
    invalid_json = b"not-json{"

    bad_signature = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=invalid_json,
        headers={"X-Hub-Signature-256": "sha256=deadbeef"},
    )
    # Firma inválida gana al body inválido: se valida antes de parsear.
    assert bad_signature.status_code == 403

    signature = "sha256=" + hmac.new(b"global-app-secret", invalid_json, hashlib.sha256).hexdigest()
    valid_signature = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=invalid_json,
        headers={"X-Hub-Signature-256": signature},
    )
    assert valid_signature.status_code == 400


async def test_webhook_global_secret_stores_message_and_ignores_unknown_number(
    client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_encryption_key", "test-encryption-key-32-bytes-long")
    monkeypatch.setattr(settings, "whatsapp_app_secret", WHATSAPP_CONFIG["app_secret"])
    token, tenant_id, _ = await _register(client, "owner-wa-hard@example.com", "WA Hardening")
    put = await client.put(
        "/api/v1/whatsapp/config",
        json=WHATSAPP_CONFIG,
        headers=_headers(token, tenant_id),
    )
    assert put.status_code == 200, put.text

    secret = WHATSAPP_CONFIG["app_secret"]
    raw_body = json.dumps(_inbound_payload(WHATSAPP_CONFIG["phone_number_id"])).encode("utf-8")
    signature = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    headers = {"X-Hub-Signature-256": signature, "Content-Type": "application/json"}

    stored = await client.post("/api/v1/webhooks/whatsapp", content=raw_body, headers=headers)
    assert stored.status_code == 200, stored.text

    count = await db_session.scalar(
        select(func.count())
        .select_from(WhatsAppMessage)
        .where(WhatsAppMessage.tenant_id == UUID(tenant_id))
    )
    assert count == 1

    unknown_body = json.dumps(_inbound_payload("999999999999999")).encode("utf-8")
    unknown_signature = (
        "sha256=" + hmac.new(secret.encode(), unknown_body, hashlib.sha256).hexdigest()
    )
    unknown = await client.post(
        "/api/v1/webhooks/whatsapp",
        content=unknown_body,
        headers={"X-Hub-Signature-256": unknown_signature},
    )
    assert unknown.status_code == 200

    count_after = await db_session.scalar(
        select(func.count())
        .select_from(WhatsAppMessage)
        .where(WhatsAppMessage.tenant_id == UUID(tenant_id))
    )
    assert count_after == 1


# --- Hallazgo 6: POST /tenants sin suscripción ----------------------------


async def test_create_tenant_creates_trial_subscription(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    db_session.add(
        Plan(
            code="starter",
            name="Starter",
            price_ars=Decimal("10000.00"),
            billing_period="monthly",
            limits={"max_users": 5, "max_technicians": 5, "max_orders_per_month": 100},
            active=True,
        )
    )
    await db_session.commit()

    token, tenant_id, _ = await _register(client, "owner-newtenant@example.com", "Empresa Base")

    created = await client.post(
        "/api/v1/tenants",
        json={"name": "Empresa Secundaria"},
        headers=_headers(token, tenant_id),
    )
    assert created.status_code == 201, created.text
    new_tenant_id = created.json()["id"]

    subscription = await db_session.scalar(
        select(Subscription).where(Subscription.tenant_id == UUID(new_tenant_id))
    )
    assert subscription is not None
    assert subscription.status == "trialing"

    detail = await client.get("/api/v1/subscription", headers=_headers(token, new_tenant_id))
    assert detail.status_code == 200, detail.text
    body = detail.json()
    assert body["subscription"]["status"] == "trialing"
    assert body["subscription"]["plan"]["code"] == "starter"


async def test_tenant_without_subscription_uses_minimum_plan_limits(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    db_session.add(
        Plan(
            code="starter",
            name="Starter",
            price_ars=Decimal("10000.00"),
            billing_period="monthly",
            limits={"max_users": 1, "max_technicians": 1},
            active=True,
        )
    )
    await db_session.commit()

    token, tenant_id, _ = await _register(client, "owner-nosub@example.com", "Empresa Sin Sub")

    # Simula un tenant sin fila de suscripción (por ejemplo, alta manual previa).
    subscription = await db_session.scalar(
        select(Subscription).where(Subscription.tenant_id == UUID(tenant_id))
    )
    assert subscription is not None
    await db_session.delete(subscription)
    await db_session.commit()

    blocked = await client.post(
        "/api/v1/team/invitations",
        json={"email": "segundo@example.com", "role": "viewer"},
        headers=_headers(token, tenant_id),
    )
    assert blocked.status_code == 403, blocked.text
    # El mensaje distingue el cupo de oficina ("usuario(s) de oficina").
    assert "usuario" in blocked.json()["detail"]


async def test_work_order_limit_applies_without_subscription(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    db_session.add(
        Plan(
            code="starter",
            name="Starter",
            price_ars=Decimal("10000.00"),
            billing_period="monthly",
            limits={"max_orders_per_month": 1},
            active=True,
        )
    )
    await db_session.commit()

    token, tenant_id, _ = await _register(
        client, "owner-nosub-orders@example.com", "Empresa Sin Sub Ordenes"
    )

    subscription = await db_session.scalar(
        select(Subscription).where(Subscription.tenant_id == UUID(tenant_id))
    )
    assert subscription is not None
    await db_session.delete(subscription)
    await db_session.commit()

    headers = _headers(token, tenant_id)
    customer = await client.post(
        "/api/v1/customers", json={"name": "Cliente Sin Sub"}, headers=headers
    )
    assert customer.status_code == 201, customer.text
    customer_id = customer.json()["id"]

    first = await client.post(
        "/api/v1/work-orders",
        json={"customer_id": customer_id, "title": "Primera orden"},
        headers=headers,
    )
    assert first.status_code == 201, first.text

    second = await client.post(
        "/api/v1/work-orders",
        json={"customer_id": customer_id, "title": "Segunda orden"},
        headers=headers,
    )
    assert second.status_code == 403, second.text
    assert "1 órdenes por mes" in second.json()["detail"]


# --- Hallazgo 7: device token global -------------------------------------


async def test_device_token_is_not_reassigned_between_tenants(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token_a, tenant_a, user_a = await _register(
        client, "owner-device-a@example.com", "Empresa Device A"
    )
    token_b, tenant_b, _user_b = await _register(
        client, "owner-device-b@example.com", "Empresa Device B"
    )
    shared_token = "ExponentPushToken[shared-hardening]"  # noqa: S105 - token de prueba

    first = await client.post(
        "/api/v1/notifications/devices",
        json={"token": shared_token, "platform": "android"},
        headers=_headers(token_a, tenant_a),
    )
    assert first.status_code == 204, first.text

    stolen = await client.post(
        "/api/v1/notifications/devices",
        json={"token": shared_token, "platform": "android"},
        headers=_headers(token_b, tenant_b),
    )
    assert stolen.status_code == 204, stolen.text

    rows = list(
        (await db_session.execute(select(DeviceToken).where(DeviceToken.token == shared_token)))
        .scalars()
        .all()
    )
    assert len(rows) == 1
    assert rows[0].tenant_id == UUID(tenant_a)
    assert rows[0].user_id == UUID(user_a)

    other_tenant_count = await db_session.scalar(
        select(func.count()).select_from(DeviceToken).where(DeviceToken.tenant_id == UUID(tenant_b))
    )
    assert other_tenant_count == 0

    # El dueño sí puede actualizar la plataforma sin duplicar el token.
    update = await client.post(
        "/api/v1/notifications/devices",
        json={"token": shared_token, "platform": "ios"},
        headers=_headers(token_a, tenant_a),
    )
    assert update.status_code == 204, update.text

    db_session.expire_all()
    rows_after = list(
        (await db_session.execute(select(DeviceToken).where(DeviceToken.token == shared_token)))
        .scalars()
        .all()
    )
    assert len(rows_after) == 1
    assert rows_after[0].platform == "ios"


# --- Hallazgo 8: adjuntos ------------------------------------------------


async def _prepare_assigned_order(
    client: AsyncClient, db_session: AsyncSession, prefix: str
) -> tuple[str, str, str]:
    owner_token, tenant_id, _ = await _register(
        client, f"owner-{prefix}@example.com", f"Empresa {prefix}"
    )
    tech_token, _, tech_user_id = await _register(
        client, f"tech-{prefix}@example.com", f"Tech {prefix}"
    )
    await _add_membership(db_session, tenant_id, tech_user_id, "technician")
    customer = await client.post(
        "/api/v1/customers",
        json={"name": f"Cliente {prefix}", "phone": "+54 11 5555-4000"},
        headers=_headers(owner_token, tenant_id),
    )
    assert customer.status_code == 201, customer.text
    order = await client.post(
        "/api/v1/work-orders",
        json={
            "customer_id": customer.json()["id"],
            "title": f"Orden {prefix}",
            "assigned_user_id": tech_user_id,
        },
        headers=_headers(owner_token, tenant_id),
    )
    assert order.status_code == 201, order.text
    return tech_token, tenant_id, order.json()["id"]


async def test_attachment_filename_is_sanitized_and_download_is_safe(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    tech_token, tenant_id, order_id = await _prepare_assigned_order(client, db_session, "adjunto")
    headers = _headers(tech_token, tenant_id)

    upload = await client.post(
        f"/api/v1/technician/work-orders/{order_id}/attachments",
        files={"file": ("..\\..\\evil <script>.jpg", _IMAGE_BYTES, "image/jpeg")},
        headers=headers,
    )
    assert upload.status_code == 201, upload.text
    filename = upload.json()["filename"]
    assert re.fullmatch(r"[A-Za-z0-9._-]+", filename), filename
    assert ".." not in filename
    assert "<" not in filename

    download = await client.get(
        f"/api/v1/technician/work-orders/{order_id}/attachments/{upload.json()['id']}",
        headers=headers,
    )
    assert download.status_code == 200, download.text
    assert download.content == _IMAGE_BYTES
    assert download.headers["x-content-type-options"] == "nosniff"
    disposition = download.headers["content-disposition"]
    assert disposition.startswith("inline; filename=")
    assert "filename*=UTF-8''" in disposition
    assert "<" not in disposition


async def test_attachment_over_size_limit_is_rejected_without_persisting(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    tech_token, tenant_id, order_id = await _prepare_assigned_order(client, db_session, "tamano")
    headers = _headers(tech_token, tenant_id)

    oversized = b"x" * (5 * 1024 * 1024 + 1)
    upload = await client.post(
        f"/api/v1/technician/work-orders/{order_id}/attachments",
        files={"file": ("grande.jpg", oversized, "image/jpeg")},
        headers=headers,
    )
    assert upload.status_code == 422, upload.text

    listing = await client.get(
        f"/api/v1/technician/work-orders/{order_id}/attachments", headers=headers
    )
    assert listing.status_code == 200, listing.text
    assert listing.json() == []


# --- Hallazgo 9: totales de /ai/usage ------------------------------------


async def test_ai_usage_totals_cover_more_than_fifty_records(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token, tenant_id, user_id = await _register(client, "owner-ai-usage@example.com", "Empresa Uso")

    for _ in range(60):
        db_session.add(
            AIUsageLog(
                tenant_id=UUID(tenant_id),
                user_id=UUID(user_id),
                provider="deterministic",
                model="deterministic",
                feature="chat",
                input_tokens=2,
                output_tokens=1,
                estimated_cost=Decimal("0.01"),
            )
        )
    await db_session.commit()

    response = await client.get("/api/v1/ai/usage", headers=_headers(token, tenant_id))
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["items"]) == 50
    assert body["total_tokens"] == 60 * 3
    assert Decimal(body["total_cost"]) == Decimal("0.60")


async def test_ai_usage_totals_exclude_other_tenants(
    client: AsyncClient, db_session: AsyncSession
) -> None:
    token_a, tenant_a, user_a = await _register(
        client, "owner-usage-a@example.com", "Empresa Uso A"
    )
    _token_b, tenant_b, user_b = await _register(
        client, "owner-usage-b@example.com", "Empresa Uso B"
    )

    for _ in range(3):
        db_session.add(
            AIUsageLog(
                tenant_id=UUID(tenant_a),
                user_id=UUID(user_a),
                provider="deterministic",
                model="deterministic",
                feature="chat",
                input_tokens=2,
                output_tokens=1,
                estimated_cost=Decimal("0.10"),
            )
        )
    for _ in range(7):
        db_session.add(
            AIUsageLog(
                tenant_id=UUID(tenant_b),
                user_id=UUID(user_b),
                provider="deterministic",
                model="deterministic",
                feature="chat",
                input_tokens=100,
                output_tokens=100,
                estimated_cost=Decimal("9.99"),
            )
        )
    await db_session.commit()

    response = await client.get("/api/v1/ai/usage", headers=_headers(token_a, tenant_a))
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["items"]) == 3
    assert body["total_tokens"] == 3 * 3
    assert Decimal(body["total_cost"]) == Decimal("0.30")


# --- Hallazgo 10: rotación de refresh con lock --------------------------


async def test_concurrent_refresh_rotation_keeps_successor_valid(
    client: AsyncClient, register_payload: dict[str, str], db_session: AsyncSession
) -> None:
    reg = await client.post("/api/v1/auth/register", json=register_payload)
    assert reg.status_code == 201
    raw_token = reg.cookies.get("refresh_token")
    assert raw_token

    # Engine propio con NullPool: dos conexiones reales en el mismo event loop,
    # sin reutilizar el pool de la app entre loops de prueba.
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    session_factory = async_sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
    )

    async def rotate(token: str) -> tuple[object, str, int, str]:
        async with session_factory() as session:
            return await auth_service.rotate_refresh_token(session, token)

    try:
        results = await asyncio.gather(rotate(raw_token), rotate(raw_token), return_exceptions=True)

        successes = [result for result in results if isinstance(result, tuple)]
        failures = [result for result in results if isinstance(result, HTTPException)]
        assert len(successes) == 1, results
        assert len(failures) == 1, results
        assert failures[0].status_code == 401

        # La rotación perdedora no debe revocar la familia: el sucesor sigue vivo.
        successor = str(successes[0][3])
        third = await rotate(successor)
    finally:
        await engine.dispose()

    assert isinstance(third, tuple)
    assert third[3] and third[3] != successor

    body = reg.json()
    me = await client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {body['access_token']}",
            "X-Tenant-ID": body["tenants"][0]["id"],
        },
    )
    assert me.status_code == 200, me.text
    user_id = UUID(me.json()["user"]["id"])
    active = await db_session.scalar(
        select(func.count())
        .select_from(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
    )
    assert active == 1
