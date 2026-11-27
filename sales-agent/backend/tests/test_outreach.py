from __future__ import annotations

from fastapi.testclient import TestClient


def _company_with_whatsapp(client: TestClient, name: str = "Clima Mensajes") -> dict:
    company = client.post(
        "/api/v1/companies",
        json={
            "name": name,
            "website": "clima-mensajes.com.ar",
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


def _lead(client: TestClient, company_id: int) -> dict:
    return client.post(f"/api/v1/companies/{company_id}/leads", json={}).json()


def test_generate_approve_send_console_and_mark_sent(auth_client: TestClient) -> None:
    company = _company_with_whatsapp(auth_client)
    lead = _lead(auth_client, company["id"])

    generated = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "first_contact"},
    )
    assert generated.status_code == 201, generated.text
    message = generated.json()
    assert message["status"] == "pending_approval"
    assert "Juan Manuel" in message["generated_text"]
    assert "ARVOKTA" in message["generated_text"]
    assert "DOVEXO" in message["generated_text"]
    assert "BAJA" in message["generated_text"]
    assert "revolucionamos" not in message["generated_text"].lower()
    assert message["metadata"]["whatsapp_contact_available"] is True

    not_approved = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert not_approved.status_code == 409

    approved = auth_client.post(f"/api/v1/messages/{message['id']}/approve")
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"
    assert approved.json()["approved_at"] is not None
    assert auth_client.get(f"/api/v1/leads/{lead['id']}").json()["status"] == "approved"

    sent = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert sent.status_code == 200, sent.text
    delivery = sent.json()["delivery"]
    assert delivery["status"] == "simulated"
    assert delivery["provider"] == "console"
    assert delivery["text"] == message["generated_text"]
    sent_message = sent.json()["message"]
    assert sent_message["status"] == "approved"
    assert sent_message["delivery_status"] == "simulated"
    assert sent_message["sent_at"] is None
    assert sent_message["simulated"] is True
    assert sent_message["sent_via"] == "console"
    assert sent_message["contact_id"] is not None

    marked = auth_client.post(f"/api/v1/messages/{message['id']}/mark-sent")
    assert marked.status_code == 200
    assert marked.json()["status"] == "sent"
    assert marked.json()["delivery_status"] == "manual"
    assert marked.json()["sent_at"] is not None
    assert auth_client.get(f"/api/v1/leads/{lead['id']}").json()["status"] == "contacted"

    assert auth_client.post(f"/api/v1/messages/{message['id']}/send").status_code == 409

    messages = auth_client.get(f"/api/v1/leads/{lead['id']}/messages").json()
    assert len(messages) == 1


def test_edit_message_requires_reapproval(auth_client: TestClient) -> None:
    company = _company_with_whatsapp(auth_client)
    lead = _lead(auth_client, company["id"])
    message = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "follow_up"},
    ).json()

    edited = auth_client.patch(
        f"/api/v1/messages/{message['id']}",
        json={"edited_text": "Hola, soy Juan Manuel. ¿Retomamos la conversación?"},
    )
    assert edited.status_code == 200
    assert edited.json()["edited_text"].startswith("Hola")
    assert edited.json()["status"] == "pending_approval"

    assert auth_client.post(f"/api/v1/messages/{message['id']}/approve").status_code == 200
    assert auth_client.post(f"/api/v1/messages/{message['id']}/mark-sent").status_code == 200
    blocked_edit = auth_client.patch(
        f"/api/v1/messages/{message['id']}", json={"edited_text": "Otro texto"}
    )
    assert blocked_edit.status_code == 409


def test_message_without_whatsapp_contact_cannot_be_sent(auth_client: TestClient) -> None:
    company = auth_client.post(
        "/api/v1/companies",
        json={"name": "Sin WhatsApp", "sector_slugs": ["hvac"]},
    ).json()
    lead = _lead(auth_client, company["id"])
    message = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "first_contact"},
    ).json()
    assert message["contact_id"] is None
    assert message["metadata"]["whatsapp_contact_available"] is False
    assert auth_client.post(f"/api/v1/messages/{message['id']}/approve").status_code == 200
    blocked = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert blocked.status_code == 409
    assert "WhatsApp" in blocked.json()["detail"]


def test_send_resolves_contact_and_updates_metadata(auth_client: TestClient) -> None:
    company = auth_client.post(
        "/api/v1/companies",
        json={"name": "Contacto Tardío", "sector_slugs": ["hvac"]},
    ).json()
    lead = _lead(auth_client, company["id"])
    message = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "first_contact"},
    ).json()
    assert message["contact_id"] is None
    assert message["metadata"]["whatsapp_contact_available"] is False

    contact = auth_client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={
            "contact_type": "whatsapp",
            "value": "https://wa.me/5493515551234",
            "verification_status": "published",
        },
    )
    assert contact.status_code == 201

    assert auth_client.post(f"/api/v1/messages/{message['id']}/approve").status_code == 200
    sent = auth_client.post(f"/api/v1/messages/{message['id']}/send")
    assert sent.status_code == 200, sent.text

    sent_message = sent.json()["message"]
    assert sent_message["contact_id"] == contact.json()["id"]
    assert sent_message["metadata"]["whatsapp_contact_available"] is True
    assert sent_message["delivery_status"] == "simulated"
    assert sent_message["simulated"] is True
    assert sent_message["sent_via"] == "console"
    assert sent_message["status"] != "sent"
    assert sent_message["sent_at"] is None


def test_suppression_blocks_generation_until_removed(auth_client: TestClient) -> None:
    company = _company_with_whatsapp(auth_client)
    lead = _lead(auth_client, company["id"])

    suppression = auth_client.post(
        "/api/v1/suppressions",
        json={"phone": "+54 9 351 555-1234", "reason": "Pidió no recibir mensajes"},
    )
    assert suppression.status_code == 201
    assert suppression.json()["normalized_contact"] == "+5493515551234"

    blocked = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "first_contact"},
    )
    assert blocked.status_code == 409

    assert auth_client.delete(f"/api/v1/suppressions/{suppression.json()['id']}").status_code == 204
    generated = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "demo_invite"},
    )
    assert generated.status_code == 201
    assert "demo" in generated.json()["generated_text"].lower()


def test_company_suppression_blocks_generation(auth_client: TestClient) -> None:
    company = _company_with_whatsapp(auth_client)
    lead = _lead(auth_client, company["id"])
    suppression = auth_client.post(
        "/api/v1/suppressions",
        json={"company_id": company["id"], "reason": "No contactar"},
    )
    assert suppression.status_code == 201
    assert suppression.json()["normalized_contact"] == f"company:{company['id']}"

    blocked = auth_client.post(
        f"/api/v1/leads/{lead['id']}/messages/generate",
        json={"channel": "whatsapp", "message_type": "first_contact"},
    )
    assert blocked.status_code == 409
