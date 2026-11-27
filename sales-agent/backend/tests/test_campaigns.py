from fastapi.testclient import TestClient

from app.database.session import SessionLocal
from app.models import Job, SearchRun


def _dovexo_id(client: TestClient) -> int:
    products = client.get("/api/v1/products").json()
    return next(product["id"] for product in products if product["slug"] == "dovexo")


def test_create_campaign_and_start_enqueues_run(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña Córdoba HVAC",
            "description": "Prueba",
            "province_filters": ["AR-X"],
            "sector_filters": ["hvac"],
            "search_config": {"provider": "manual"},
        },
    )
    assert response.status_code == 201, response.text
    campaign = response.json()
    assert campaign["status"] == "draft"
    assert campaign["product_name"] == "DOVEXO"

    started = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start")
    assert started.status_code == 200, started.text
    body = started.json()
    assert body["campaign"]["status"] == "active"
    assert body["search_run_id"] > 0
    assert body["job_id"] > 0

    with SessionLocal() as db:
        search_run = db.get(SearchRun, body["search_run_id"])
        assert search_run is not None
        assert search_run.status == "pending"
        assert search_run.campaign_id == campaign["id"]

        job = db.get(Job, body["job_id"])
        assert job is not None
        assert job.status == "pending"
        assert job.job_type == "search_run"
        assert job.payload["search_run_id"] == body["search_run_id"]


def test_start_twice_returns_conflict(auth_client: TestClient) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña doble start",
            "province_filters": ["AR-C"],
            "sector_filters": ["it_support"],
        },
    ).json()

    first = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start")
    assert first.status_code == 200
    second = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start")
    assert second.status_code == 409


def test_pause_and_cancel_transitions(auth_client: TestClient) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña con estados",
            "province_filters": ["AR-B"],
            "sector_filters": ["electrical_installations"],
        },
    ).json()

    assert auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start").status_code == 200
    paused = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/pause")
    assert paused.status_code == 200
    assert paused.json()["status"] == "paused"

    cancelled = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    assert auth_client.post(f"/api/v1/campaigns/{campaign['id']}/pause").status_code == 409
    assert auth_client.post(f"/api/v1/campaigns/{campaign['id']}/cancel").status_code == 409
    assert auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start").status_code == 409


def test_unknown_province_is_rejected(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña inválida",
            "province_filters": ["AR-XX"],
            "sector_filters": ["hvac"],
        },
    )
    assert response.status_code == 400


def test_unknown_sector_is_rejected(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña inválida 2",
            "province_filters": ["AR-C"],
            "sector_filters": ["no-existe"],
        },
    )
    assert response.status_code == 400


def test_inactive_product_cannot_be_used(auth_client: TestClient) -> None:
    product_id = _dovexo_id(auth_client)
    assert auth_client.delete(f"/api/v1/products/{product_id}").status_code == 200

    response = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": product_id,
            "name": "Campaña con producto inactivo",
            "province_filters": ["AR-C"],
            "sector_filters": ["hvac"],
        },
    )
    assert response.status_code == 409
