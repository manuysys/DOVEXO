from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def _company(client: TestClient, name: str = "Frío CRM") -> dict:
    response = client.post(
        "/api/v1/companies",
        json={
            "name": name,
            "website": "frio-crm.com.ar",
            "province": "AR-X",
            "locality": "Córdoba",
            "address": "Av. Colón 123",
            "phone": "0351 455-6677",
            "email": "contacto@frio-crm.com.ar",
            "sector_slugs": ["hvac"],
        },
    )
    assert response.status_code == 201, response.text
    company = response.json()
    patched = client.patch(
        f"/api/v1/companies/{company['id']}",
        json={"description": "Servicio de mantenimiento y reparación de equipos."},
    )
    assert patched.status_code == 200
    return patched.json()


def _dovexo_id(client: TestClient) -> int:
    return next(
        product["id"]
        for product in client.get("/api/v1/products").json()
        if product["slug"] == "dovexo"
    )


def test_create_lead_is_unique_and_defaults_to_dovexo(auth_client: TestClient) -> None:
    company = _company(auth_client)
    first = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={})
    assert first.status_code == 201, first.text
    lead = first.json()
    assert lead["status"] == "new"
    assert lead["product_id"] == _dovexo_id(auth_client)

    second = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={})
    assert second.status_code == 200
    assert second.json()["id"] == lead["id"]

    listing = auth_client.get("/api/v1/leads").json()
    assert listing["total"] == 1
    item = listing["items"][0]
    assert item["company_name"] == "Frío CRM"
    assert item["product_name"] == "DOVEXO"
    assert item["company_locality"] == "Córdoba"
    assert item["company_province"] == "Córdoba"
    assert item["company_website"] == "https://frio-crm.com.ar"
    assert item["company_phone"] == "+543514556677"
    assert item["company_email"] == "contacto@frio-crm.com.ar"
    assert item["company_whatsapp"] is None


def test_lead_list_includes_company_contact_data(auth_client: TestClient) -> None:
    with_contacts = _company(auth_client, name="Empresa Con Contactos")
    whatsapp = auth_client.post(
        f"/api/v1/companies/{with_contacts['id']}/contacts",
        json={
            "contact_type": "whatsapp",
            "value": "https://wa.me/5493515551234",
            "verification_status": "published",
            "is_primary": True,
        },
    )
    assert whatsapp.status_code == 201

    without_contacts = auth_client.post(
        "/api/v1/companies",
        json={"name": "Empresa Sin Contactos", "sector_slugs": ["hvac"]},
    ).json()

    auth_client.post(f"/api/v1/companies/{with_contacts['id']}/leads", json={})
    auth_client.post(f"/api/v1/companies/{without_contacts['id']}/leads", json={})

    items = auth_client.get("/api/v1/leads").json()["items"]
    by_name = {item["company_name"]: item for item in items}

    full = by_name["Empresa Con Contactos"]
    assert full["company_phone"] == "+543514556677"
    assert full["company_email"] == "contacto@frio-crm.com.ar"
    assert full["company_whatsapp"] == "+5493515551234"

    empty = by_name["Empresa Sin Contactos"]
    assert empty["company_locality"] is None
    assert empty["company_province"] is None
    assert empty["company_website"] is None
    assert empty["company_phone"] is None
    assert empty["company_email"] is None
    assert empty["company_whatsapp"] is None


def test_lead_list_filters_and_pagination(auth_client: TestClient) -> None:
    company = _company(auth_client)
    lead = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={}).json()

    assert auth_client.get("/api/v1/leads", params={"status": "new"}).json()["total"] == 1
    assert auth_client.get("/api/v1/leads", params={"status": "approved"}).json()["total"] == 0
    assert (
        auth_client.get("/api/v1/leads", params={"company_id": company["id"]}).json()["total"] == 1
    )
    assert (
        auth_client.get("/api/v1/leads", params={"product_id": lead["product_id"]}).json()["total"]
        == 1
    )
    page = auth_client.get("/api/v1/leads", params={"limit": 1, "offset": 0}).json()
    assert page["limit"] == 1
    assert len(page["items"]) == 1

    invalid = auth_client.get("/api/v1/leads", params={"status": "no-existe"})
    assert invalid.status_code == 400


def test_lead_patch_and_activity_history(auth_client: TestClient) -> None:
    company = _company(auth_client)
    lead = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={}).json()
    next_follow_up = (datetime.now(UTC) + timedelta(days=3)).isoformat()

    response = auth_client.patch(
        f"/api/v1/leads/{lead['id']}",
        json={
            "status": "pending_review",
            "assigned_notes": "Llamar por la mañana.",
            "next_follow_up_at": next_follow_up,
        },
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["status"] == "pending_review"
    assert updated["assigned_notes"] == "Llamar por la mañana."
    assert updated["next_follow_up_at"] is not None

    invalid = auth_client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "no-existe"})
    assert invalid.status_code == 422

    activities = auth_client.get(f"/api/v1/leads/{lead['id']}/activities").json()
    types = {activity["activity_type"] for activity in activities}
    assert "opportunity_created" in types
    assert "status_changed" in types
    assert "follow_up_scheduled" in types

    detail = auth_client.get(f"/api/v1/leads/{lead['id']}").json()
    assert detail["company"]["name"] == "Frío CRM"
    assert detail["company"]["sectors"][0]["slug"] == "hvac"
    assert detail["product"]["slug"] == "dovexo"
    assert detail["activities"]


def test_score_lead_is_deterministic_and_keeps_history(auth_client: TestClient) -> None:
    company = _company(auth_client)
    lead = auth_client.post(f"/api/v1/companies/{company['id']}/leads", json={}).json()

    first = auth_client.post(f"/api/v1/leads/{lead['id']}/score")
    assert first.status_code == 200, first.text
    result = first.json()
    assert 0 <= result["score"] <= 100
    assert 0 <= result["confidence"] <= 100
    assert result["score"] > 0
    assert result["confidence"] > 0
    assert result["reasons"]
    assert any("Afinidad del rubro" in reason for reason in result["reasons"])
    assert result["breakdown"]["factors"]
    assert result["breakdown"]["total_max_points"] == 100

    stored = auth_client.get(f"/api/v1/leads/{lead['id']}").json()
    assert stored["compatibility_score"] == result["score"]
    assert stored["information_confidence"] == result["confidence"]

    second = auth_client.post(f"/api/v1/leads/{lead['id']}/score")
    assert second.status_code == 200
    evaluations = auth_client.get(f"/api/v1/leads/{lead['id']}/evaluations").json()
    assert len(evaluations) == 2
    assert evaluations[0]["evaluation_method"] == "deterministic"

    sparse = auth_client.post(
        "/api/v1/companies",
        json={"name": "Empresa Sin Datos", "sector_slugs": ["hvac"]},
    ).json()
    sparse_lead = auth_client.post(f"/api/v1/companies/{sparse['id']}/leads", json={}).json()
    sparse_score = auth_client.post(f"/api/v1/leads/{sparse_lead['id']}/score").json()
    assert sparse_score["confidence"] < result["confidence"]
