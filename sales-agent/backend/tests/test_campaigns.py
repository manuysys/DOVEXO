from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.constants import PROVINCES
from app.database.session import SessionLocal
from app.models import Job, SearchRun
from app.workers.queue import run_once
from tests.fakes import FakeDiscoveryProvider, osm_company


def _dovexo_id(client: TestClient) -> int:
    products = client.get("/api/v1/products").json()
    return next(product["id"] for product in products if product["slug"] == "dovexo")


def test_create_campaign_and_start_enqueues_one_run(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña Córdoba HVAC",
            "description": "Prueba",
            "province_filters": ["AR-X"],
            "sector_filters": ["hvac"],
            "search_config": {"limit": 10},
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
    assert body["total_jobs"] == 1
    assert len(body["search_runs"]) == 1
    assert body["search_runs"][0]["province_code"] == "AR-X"
    assert body["search_runs"][0]["status"] == "pending"

    run_id = body["search_runs"][0]["id"]
    with SessionLocal() as db:
        search_run = db.get(SearchRun, run_id)
        assert search_run is not None
        assert search_run.status == "pending"
        assert search_run.campaign_id == campaign["id"]
        assert search_run.limit == 10
        assert search_run.search_config["province_code"] == "AR-X"
        assert search_run.search_config["sector_slugs"] == ["hvac"]

        job = db.scalar(select(Job).where(Job.job_type == "search_run"))
        assert job is not None
        assert job.status == "pending"
        assert job.payload["search_run_id"] == run_id
        assert job.payload["campaign_id"] == campaign["id"]


def test_national_campaign_creates_one_run_per_province(auth_client: TestClient) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña nacional",
            "province_filters": [],
            "sector_filters": ["hvac", "it_support"],
            "search_config": {"limit": 5},
        },
    ).json()

    started = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start")
    assert started.status_code == 200, started.text
    body = started.json()
    assert body["total_jobs"] == 24
    assert len(body["search_runs"]) == 24
    assert {run["province_code"] for run in body["search_runs"]} == {
        province["code"] for province in PROVINCES
    }

    with SessionLocal() as db:
        jobs = list(db.scalars(select(Job).where(Job.job_type == "search_run")))
        assert len(jobs) == 24
        assert all(job.status == "pending" for job in jobs)
        assert (
            auth_client.get(
                "/api/v1/companies", params={"search_run_id": body["search_runs"][0]["id"]}
            ).json()["total"]
            == 0
        )

    filtered = auth_client.get("/api/v1/search-runs", params={"campaign_id": campaign["id"]}).json()
    assert len(filtered) == 24
    assert {run["limit"] for run in filtered} == {5}


def test_campaign_detail_includes_run_counts(auth_client: TestClient) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña con conteos",
            "province_filters": ["AR-X", "AR-B"],
            "sector_filters": ["hvac"],
        },
    ).json()
    assert auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start").status_code == 200

    detail = auth_client.get(f"/api/v1/campaigns/{campaign['id']}").json()
    assert detail["search_runs_total"] == 2
    assert detail["search_runs_pending"] == 2
    assert detail["search_runs_completed"] == 0


def test_campaign_run_is_processed_by_worker(auth_client: TestClient, monkeypatch) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Campaña procesable",
            "province_filters": ["AR-X"],
            "sector_filters": ["hvac"],
        },
    ).json()
    started = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start").json()
    run_id = started["search_runs"][0]["id"]

    fake = FakeDiscoveryProvider(
        [
            osm_company(
                osm_id=9001,
                name="Clima de Campaña",
                sector_slugs=("hvac",),
                locality="Córdoba",
            )
        ]
    )
    monkeypatch.setattr("app.workers.queue.get_discovery_provider", lambda name="overpass": fake)

    with SessionLocal() as db:
        processed = run_once(db)
    assert processed is not None
    assert processed.status == "completed"

    run = auth_client.get(f"/api/v1/search-runs/{run_id}").json()
    assert run["status"] == "completed"
    assert run["new_companies"] == 1
    assert (
        auth_client.get("/api/v1/companies", params={"search_run_id": run_id}).json()["total"] == 1
    )


def test_campaign_start_requires_sectors_and_valid_limit(auth_client: TestClient) -> None:
    no_sector = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Sin rubros",
            "province_filters": ["AR-X"],
        },
    ).json()
    assert auth_client.post(f"/api/v1/campaigns/{no_sector['id']}/start").status_code == 400

    bad_limit = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": _dovexo_id(auth_client),
            "name": "Límite inválido",
            "province_filters": ["AR-X"],
            "sector_filters": ["hvac"],
            "search_config": {"limit": 0},
        },
    ).json()
    assert auth_client.post(f"/api/v1/campaigns/{bad_limit['id']}/start").status_code == 400


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

    paused_run = auth_client.get(
        "/api/v1/search-runs", params={"campaign_id": campaign["id"]}
    ).json()[0]
    assert paused_run["status"] == "cancelled"

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
