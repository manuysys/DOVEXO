from __future__ import annotations

import hashlib
import hmac
import json

from fastapi.testclient import TestClient

from app.core.config import settings
from app.providers.whatsapp.base import SendResult


def _company_with_whatsapp(client: TestClient, phone: str = "5493515551234") -> dict:
    company = client.post(
        "/api/v1/companies",
        json={
            "name": "Clima WhatsApp",
            "website": "clima-whatsapp.com.ar",
            "province": "AR-X",
            "locality": "Córdoba",
            "sector_slugs": ["hvac"],
        },
    ).json()
    client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={
            "contact_type": "whatsapp",
            "value": phone,
            "label": "Ventas",
            "is_primary": True,
            "verification_status": "published",
        },
    )
    return company


def _signature(raw: bytes, secret: str) -> str:
    return "sha256=" + hmac.new(secret.encode(), raw, hashlib.sha256).hexdigest()


def _webhook_payload(
    *,
    phone: str = "5493515551234",
    wa_id: str = "wamid.1",
    text: str = "Hola, necesito service de aire",
    name: str = "Ana",
) -> bytes:
    return json.dumps(
        {
            "entry": [
                {
                    "changes": [
                        {
                            "value": {
                                "contacts": [{"wa_id": phone, "profile": {"name": name}}],
                                "messages": [
                                    {
                                        "from": phone,
                                        "id": wa_id,
                                        "type": "text",
                                        "text": {"body": text},
                                    }
                                ],
                            }
                        }
                    ]
                }
            ]
        }
    ).encode()


def test_whatsapp_status_console_and_meta(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "")
    monkeypatch.setattr(settings, "whatsapp_sender_phone", "")
    monkeypatch.setattr(settings, "founder_phone", "")
    status_response = auth_client.get("/api/v1/whatsapp/status")
    assert status_response.status_code == 200
    assert status_response.json() == {
        "configured": False,
        "mode": "console",
        "sender_phone": None,
        "founder_phone_set": False,
    }

    monkeypatch.setattr(settings, "whatsapp_access_token", "token")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "123")
    monkeypatch.setattr(settings, "whatsapp_sender_phone", "+5493510000000")
    meta_status = auth_client.get("/api/v1/whatsapp/status").json()
    assert meta_status["configured"] is True
    assert meta_status["mode"] == "meta"
    assert meta_status["sender_phone"] == "+5493510000000"


def test_simulate_inbound_unknown_sender_and_thread_detail(
    auth_client: TestClient,
) -> None:
    response = auth_client.post(
        "/api/v1/whatsapp/simulate/inbound",
        json={"phone": "5493515559999", "name": "Cliente Desconocido", "text": "Hola"},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["thread"]["company_id"] is None
    assert body["thread"]["display_name"] == "Cliente Desconocido"
    assert body["reply"]["direction"] == "out"
    assert body["reply"]["status"] == "simulated"
    assert "ARVOKTA" in body["reply"]["body"]
    assert "persona del equipo" in body["reply"]["body"]
    assert body["founder_notified"] is False

    threads = auth_client.get("/api/v1/whatsapp/threads").json()
    assert len(threads) == 1
    assert threads[0]["message_count"] == 2

    detail = auth_client.get(f"/api/v1/whatsapp/threads/{body['thread']['id']}").json()
    assert [message["direction"] for message in detail["messages"]] == ["in", "out"]
    alias = auth_client.get(f"/api/v1/threads/{body['thread']['id']}")
    assert alias.status_code == 200
    assert alias.json()["id"] == body["thread"]["id"]


def test_simulate_inbound_links_company_and_lead(auth_client: TestClient) -> None:
    company = _company_with_whatsapp(auth_client)
    lead = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={}).json()
    auth_client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "contacted"})

    response = auth_client.post(
        "/api/v1/whatsapp/simulate/inbound",
        json={"phone": "5493515551234", "text": "Sí, me interesa"},
    )
    assert response.status_code == 200
    thread = response.json()["thread"]
    assert thread["company_id"] == company["id"]
    assert thread["lead_id"] == lead["id"]

    stored_lead = auth_client.get(f"/api/v1/leads/{lead['id']}").json()
    assert stored_lead["status"] == "replied"
    activities = auth_client.get(f"/api/v1/leads/{lead['id']}/activities").json()
    assert any(activity["activity_type"] == "whatsapp_inbound" for activity in activities)


def test_inbound_suppression_keeps_message_without_reply(
    auth_client: TestClient,
) -> None:
    company = _company_with_whatsapp(auth_client)
    auth_client.post(
        "/api/v1/suppressions",
        json={"company_id": company["id"], "reason": "No contactar"},
    )

    response = auth_client.post(
        "/api/v1/whatsapp/simulate/inbound",
        json={"phone": "5493515551234", "text": "Hola"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reply"] is None
    assert len(body["thread"]["messages"]) == 1
    assert body["thread"]["messages"][0]["direction"] == "in"


def test_founder_notification_uses_provider(auth_client: TestClient, monkeypatch) -> None:
    calls: list[tuple[str, str]] = []

    class FakeProvider:
        def send_text(self, *, to: str, body: str) -> SendResult:
            calls.append((to, body))
            return SendResult(status="simulated", provider="fake", payload={"to": to})

    monkeypatch.setattr("app.services.whatsapp.get_whatsapp_provider", lambda: FakeProvider())
    monkeypatch.setattr(settings, "founder_phone", "+5493510000000")

    response = auth_client.post(
        "/api/v1/whatsapp/simulate/inbound",
        json={"phone": "5493515559999", "name": "Ana", "text": "Consulta"},
    )
    assert response.status_code == 200
    assert response.json()["founder_notified"] is True
    assert len(calls) == 2
    assert calls[1][0] == "+5493510000000"
    assert "Ana" in calls[1][1]


def test_webhook_verification(auth_client: TestClient, monkeypatch) -> None:
    client = auth_client
    monkeypatch.setattr(settings, "whatsapp_verify_token", "")
    assert client.get("/api/v1/webhooks/whatsapp").status_code == 503

    monkeypatch.setattr(settings, "whatsapp_verify_token", "verify-token")
    assert (
        client.get(
            "/api/v1/webhooks/whatsapp",
            params={"hub.mode": "subscribe", "hub.verify_token": "mal", "hub.challenge": "x"},
        ).status_code
        == 403
    )
    ok = client.get(
        "/api/v1/webhooks/whatsapp",
        params={
            "hub.mode": "subscribe",
            "hub.verify_token": "verify-token",
            "hub.challenge": "challenge-123",
        },
    )
    assert ok.status_code == 200
    assert ok.text == "challenge-123"


def test_webhook_signature_and_idempotency(auth_client: TestClient, monkeypatch) -> None:
    client = auth_client
    monkeypatch.setattr(settings, "whatsapp_app_secret", "")
    raw = _webhook_payload()
    assert client.post("/api/v1/webhooks/whatsapp", content=raw).status_code == 503

    monkeypatch.setattr(settings, "whatsapp_app_secret", "test-secret")
    assert (
        client.post(
            "/api/v1/webhooks/whatsapp",
            content=raw,
            headers={"X-Hub-Signature-256": "sha256=invalid"},
        ).status_code
        == 403
    )

    signature = _signature(raw, "test-secret")
    first = client.post(
        "/api/v1/webhooks/whatsapp",
        content=raw,
        headers={"X-Hub-Signature-256": signature},
    )
    assert first.status_code == 200, first.text
    assert first.json()["received"] == 1
    assert first.json()["duplicates"] == 0
    assert first.json()["replies"][0]["status"] == "simulated"

    second = client.post(
        "/api/v1/webhooks/whatsapp",
        content=raw,
        headers={"X-Hub-Signature-256": signature},
    )
    assert second.status_code == 200
    assert second.json()["received"] == 0
    assert second.json()["duplicates"] == 1

    threads = client.get("/api/v1/whatsapp/threads").json()
    assert len(threads) == 1
    assert threads[0]["message_count"] == 2


def test_webhook_rejects_oversized_payload(auth_client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(settings, "whatsapp_app_secret", "test-secret")
    response = auth_client.post(
        "/api/v1/webhooks/whatsapp",
        content=b"x" * (1024 * 1024 + 1),
        headers={"X-Hub-Signature-256": "sha256=x"},
    )
    assert response.status_code == 413
