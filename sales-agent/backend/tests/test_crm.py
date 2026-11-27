from __future__ import annotations

from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def _lead(client: TestClient, name: str = "Empresa CRM") -> tuple[dict, dict]:
    company = client.post(
        "/api/v1/companies",
        json={
            "name": name,
            "province": "AR-X",
            "locality": "Córdoba",
            "sector_slugs": ["hvac"],
        },
    ).json()
    lead = client.post(f"/api/v1/companies/{company['id']}/leads", json={}).json()
    return company, lead


def test_activities_create_and_global_filters(auth_client: TestClient) -> None:
    _, lead = _lead(auth_client)
    next_action = (datetime.now(UTC) + timedelta(days=2)).isoformat()

    response = auth_client.post(
        f"/api/v1/leads/{lead['id']}/activities",
        json={
            "activity_type": "call",
            "description": "Llamada realizada",
            "metadata": {"resultado": "sin respuesta"},
            "next_action_at": next_action,
        },
    )
    assert response.status_code == 201, response.text
    activity = response.json()
    assert activity["activity_type"] == "call"
    assert activity["metadata"] == {"resultado": "sin respuesta"}

    stored = auth_client.get(f"/api/v1/leads/{lead['id']}").json()
    assert stored["next_follow_up_at"] is not None

    lead_activities = auth_client.get(f"/api/v1/leads/{lead['id']}/activities").json()
    assert any(item["activity_type"] == "call" for item in lead_activities)

    global_list = auth_client.get(
        "/api/v1/activities", params={"lead_id": lead["id"], "activity_type": "call"}
    ).json()
    assert len(global_list) == 1
    assert global_list[0]["description"] == "Llamada realizada"

    empty = auth_client.get("/api/v1/activities", params={"activity_type": "otro"}).json()
    assert empty == []


def test_suppressions_crud_and_idempotency(auth_client: TestClient) -> None:
    company, _ = _lead(auth_client)

    created = auth_client.post(
        "/api/v1/suppressions",
        json={"phone": "0351 455-6677", "reason": "No contactar"},
    )
    assert created.status_code == 201
    entry = created.json()
    assert entry["normalized_contact"] == "+543514556677"

    duplicate = auth_client.post(
        "/api/v1/suppressions",
        json={"phone": "+54 351 455-6677", "reason": "Otra razón"},
    )
    assert duplicate.status_code == 200
    assert duplicate.json()["id"] == entry["id"]

    company_entry = auth_client.post(
        "/api/v1/suppressions",
        json={"company_id": company["id"], "reason": "Bloqueo empresa"},
    )
    assert company_entry.status_code == 201
    assert company_entry.json()["normalized_contact"] == f"company:{company['id']}"

    listing = auth_client.get("/api/v1/suppressions").json()
    assert len(listing) == 2
    by_company = auth_client.get(
        "/api/v1/suppressions", params={"company_id": company["id"]}
    ).json()
    assert len(by_company) == 1

    assert auth_client.delete(f"/api/v1/suppressions/{entry['id']}").status_code == 204
    assert auth_client.delete(f"/api/v1/suppressions/{entry['id']}").status_code == 404

    invalid = auth_client.post("/api/v1/suppressions", json={"reason": "Sin datos"})
    assert invalid.status_code == 422


def test_dashboard_counts_leads_pipeline(auth_client: TestClient) -> None:
    _, lead = _lead(auth_client)

    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["leads_total"] == 1
    assert metrics["contacted_leads"] == 0
    assert metrics["responses"] == 0
    assert metrics["meetings"] == 0

    auth_client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "contacted"})
    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["contacted_leads"] == 1
    assert metrics["responses"] == 0

    auth_client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "replied"})
    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["responses"] == 1
    assert metrics["meetings"] == 0

    auth_client.patch(f"/api/v1/leads/{lead['id']}", json={"status": "meeting_scheduled"})
    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["meetings"] == 1
    assert metrics["responses"] == 1
    assert metrics["contacted_leads"] == 1
