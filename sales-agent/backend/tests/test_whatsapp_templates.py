"""Plantilla aprobada de Meta para el primer contacto.

Cubre el provider (payload, éxito, error HTTP, respuesta inválida, error de red)
y la regla de negocio: el primer contacto por Meta se envía como plantilla y no
como texto libre; el modo consola sigue simulado.
"""

from __future__ import annotations

import json
from typing import Any

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.providers.whatsapp.base import WhatsAppProviderError
from app.providers.whatsapp.meta import MetaWhatsAppProvider
from tests.fakes import FakeWhatsAppProvider

TEMPLATE_NAME = "arvokta_primer_contacto"
PRODUCT_NAME = "DOVEXO"


def _provider(handler) -> MetaWhatsAppProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return MetaWhatsAppProvider(
        access_token="test-token",
        phone_number_id="123456",
        api_version="v23.0",
        timeout=5,
        client=client,
    )


def _meta_provider(requests: list[httpx.Request], *, message_id: str = "wamid.template-1"):
    def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"messages": [{"id": message_id}]})

    return _provider(handler)


def _sent_payload(requests: list[httpx.Request]) -> dict[str, Any]:
    assert len(requests) == 1
    payload = json.loads(requests[0].content)
    assert isinstance(payload, dict)
    return payload


# --- Provider Meta -----------------------------------------------------------


def test_meta_send_template_payload_and_success() -> None:
    requests: list[httpx.Request] = []
    provider = _meta_provider(requests, message_id="wamid.template-1")

    result = provider.send_template(
        to="5493515551234",
        template_name=TEMPLATE_NAME,
        language="es_AR",
        parameters=["Clima Sur", PRODUCT_NAME],
    )

    assert result.status == "sent"
    assert result.provider == "meta"
    assert result.provider_message_id == "wamid.template-1"

    assert len(requests) == 1
    request = requests[0]
    assert request.url.path == "/v23.0/123456/messages"
    assert request.headers["Authorization"] == "Bearer test-token"

    payload = _sent_payload(requests)
    assert payload == {
        "messaging_product": "whatsapp",
        "to": "5493515551234",
        "type": "template",
        "template": {
            "name": TEMPLATE_NAME,
            "language": {"code": "es_AR"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": "Clima Sur"},
                        {"type": "text", "text": PRODUCT_NAME},
                    ],
                }
            ],
        },
    }
    assert "text" not in payload


def test_meta_send_template_http_error() -> None:
    provider = _provider(
        lambda request: httpx.Response(400, json={"error": {"message": "Template not found"}})
    )

    with pytest.raises(WhatsAppProviderError) as excinfo:
        provider.send_template(
            to="5493515551234",
            template_name=TEMPLATE_NAME,
            language="es_AR",
            parameters=["Clima Sur", PRODUCT_NAME],
        )

    assert "HTTP 400" in str(excinfo.value)


def test_meta_send_template_invalid_response() -> None:
    provider = _provider(lambda request: httpx.Response(200, json={"messages": []}))

    with pytest.raises(WhatsAppProviderError) as excinfo:
        provider.send_template(
            to="5493515551234",
            template_name=TEMPLATE_NAME,
            language="es_AR",
            parameters=["Clima Sur", PRODUCT_NAME],
        )

    assert "respuesta inválida" in str(excinfo.value)


def test_meta_send_template_transport_error() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("sin red", request=request)

    provider = _provider(handler)

    with pytest.raises(WhatsAppProviderError) as excinfo:
        provider.send_template(
            to="5493515551234",
            template_name=TEMPLATE_NAME,
            language="es_AR",
            parameters=["Clima Sur", PRODUCT_NAME],
        )

    assert "No se pudo contactar a Meta" in str(excinfo.value)


# --- Envío del primer contacto ----------------------------------------------


def _company_with_whatsapp(client: TestClient, name: str = "Clima Meta") -> dict:
    company = client.post(
        "/api/v1/companies",
        json={
            "name": name,
            "website": "clima-meta.com.ar",
            "province": "AR-X",
            "locality": "Córdoba",
            "sector_slugs": ["hvac"],
        },
    ).json()
    contact = client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={
            "contact_type": "whatsapp",
            "value": "https://wa.me/5493515551234",
            "label": "Ventas",
            "is_primary": True,
            "verification_status": "published",
        },
    )
    assert contact.status_code == 201, contact.text
    return company


def _approved_message(
    client: TestClient,
    company_id: int,
    message_type: str = "first_contact",
) -> dict:
    lead = client.post(f"/api/v1/companies/{company_id}/leads", json={}).json()
    message = client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": message_type},
    ).json()
    approved = client.post(f"/api/v1/messages/{message['id']}/approve")
    assert approved.status_code == 200, approved.text
    return approved.json()


def test_first_contact_meta_uses_approved_template(auth_client: TestClient, monkeypatch) -> None:
    requests: list[httpx.Request] = []
    monkeypatch.setattr(
        "app.services.outreach.get_whatsapp_provider", lambda: _meta_provider(requests)
    )
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", TEMPLATE_NAME)
    monkeypatch.setattr(settings, "whatsapp_template_language", "es_AR")

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "first_contact")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["status"] == "sent"
    assert body["delivery"]["provider"] == "meta"
    assert body["delivery"]["provider_message_id"] == "wamid.template-1"

    sent = body["message"]
    assert sent["status"] == "sent"
    assert sent["delivery_status"] == "sent"
    assert sent["sent_at"] is not None
    assert sent["simulated"] is False
    delivery_meta = sent["metadata"]["delivery"]
    assert delivery_meta["kind"] == "template"
    assert delivery_meta["template"] == {
        "name": TEMPLATE_NAME,
        "language": "es_AR",
        "parameters": [company["name"], PRODUCT_NAME],
    }

    payload = _sent_payload(requests)
    assert payload["type"] == "template"
    assert "text" not in payload
    assert payload["template"]["name"] == TEMPLATE_NAME
    assert payload["template"]["language"] == {"code": "es_AR"}
    assert payload["template"]["components"][0]["parameters"] == [
        {"type": "text", "text": company["name"]},
        {"type": "text", "text": PRODUCT_NAME},
    ]

    lead = auth_client.get(f"/api/v1/leads/{message['lead_id']}").json()
    assert lead["status"] == "contacted"


def test_first_contact_meta_without_template_fails_without_sending(
    auth_client: TestClient, monkeypatch
) -> None:
    requests: list[httpx.Request] = []
    monkeypatch.setattr(
        "app.services.outreach.get_whatsapp_provider", lambda: _meta_provider(requests)
    )
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", "")

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "first_contact")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 502, response.text
    assert "WHATSAPP_FIRST_CONTACT_TEMPLATE" in response.json()["detail"]

    # Sin llamada al provider: no se envía texto libre ni plantilla vacía.
    assert requests == []

    stored = auth_client.get(f"/api/v1/leads/{message['lead_id']}/messages").json()[0]
    assert stored["status"] == "approved"
    assert stored["delivery_status"] is None
    assert stored["sent_at"] is None


def test_first_contact_console_still_simulated_without_template(
    auth_client: TestClient, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "")
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", "")

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "first_contact")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["status"] == "simulated"
    assert body["delivery"]["provider"] == "console"
    assert body["message"]["metadata"]["delivery"]["kind"] == "text"
    assert body["message"]["status"] == "approved"
    assert body["message"]["delivery_status"] == "simulated"
    assert body["message"]["sent_at"] is None
    assert body["message"]["simulated"] is True


def test_first_contact_console_ignores_template_setting(
    auth_client: TestClient, monkeypatch
) -> None:
    monkeypatch.setattr(settings, "whatsapp_access_token", "")
    monkeypatch.setattr(settings, "whatsapp_phone_number_id", "")
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", TEMPLATE_NAME)

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "first_contact")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 200, response.text
    assert response.json()["delivery"]["provider"] == "console"
    assert response.json()["message"]["metadata"]["delivery"]["kind"] == "text"


def test_first_contact_fake_provider_uses_text(auth_client: TestClient, monkeypatch) -> None:
    fake = FakeWhatsAppProvider(status="sent")
    monkeypatch.setattr("app.services.outreach.get_whatsapp_provider", lambda: fake)
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", "")

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "first_contact")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 200, response.text

    assert len(fake.text_calls) == 1
    assert fake.text_calls[0]["to"] == "+5493515551234"
    assert fake.template_calls == []
    assert response.json()["message"]["status"] == "sent"


def test_follow_up_meta_keeps_using_text(auth_client: TestClient, monkeypatch) -> None:
    requests: list[httpx.Request] = []
    monkeypatch.setattr(
        "app.services.outreach.get_whatsapp_provider", lambda: _meta_provider(requests)
    )
    monkeypatch.setattr(settings, "whatsapp_first_contact_template", "")

    company = _company_with_whatsapp(auth_client)
    message = _approved_message(auth_client, company["id"], "follow_up")

    response = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "sent"
    assert body["message"]["metadata"]["delivery"]["kind"] == "text"

    payload = _sent_payload(requests)
    assert payload["type"] == "text"
    assert payload["text"]["body"] == message["text"]
    assert "template" not in payload
