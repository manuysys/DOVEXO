from fastapi.testclient import TestClient
from sqlalchemy import select

from app.database.session import SessionLocal
from app.models import Campaign, Job, SearchRun


def _run_jobs(run_id: int) -> list[Job]:
    with SessionLocal() as db:
        jobs = db.scalars(select(Job).where(Job.job_type == "search_run").order_by(Job.id))
        return [job for job in jobs if (job.payload or {}).get("search_run_id") == run_id]


def test_create_search_run_creates_pending_run_and_job(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/search-runs",
        json={
            "province_code": "AR-X",
            "sector_slugs": ["hvac", "it_support"],
            "keywords": "aire acondicionado",
            "limit": 25,
        },
    )
    assert response.status_code == 201, response.text
    run = response.json()
    assert run["status"] == "pending"
    assert run["provider"] == "overpass"
    assert run["location"] == "Córdoba"
    assert run["limit"] == 25
    assert run["search_config"] == {
        "province_code": "AR-X",
        "sector_slugs": ["hvac", "it_support"],
        "keywords": "aire acondicionado",
        "limit": 25,
    }
    assert run["records_found"] == 0

    jobs = _run_jobs(run["id"])
    assert len(jobs) == 1
    assert jobs[0].status == "pending"
    assert jobs[0].payload == {"search_run_id": run["id"]}


def test_create_search_run_with_campaign(auth_client: TestClient) -> None:
    campaign_id = auth_client.get("/api/v1/campaigns").json()[0]["id"]
    response = auth_client.post(
        "/api/v1/search-runs",
        json={
            "province_code": "AR-C",
            "sector_slugs": ["electronic_security"],
            "campaign_id": campaign_id,
        },
    )
    assert response.status_code == 201
    assert response.json()["campaign_id"] == campaign_id
    assert response.json()["limit"] == 50


def test_create_search_run_validation(auth_client: TestClient) -> None:
    base = {"province_code": "AR-X", "sector_slugs": ["hvac"]}

    unknown_province = auth_client.post(
        "/api/v1/search-runs", json={**base, "province_code": "AR-XX"}
    )
    assert unknown_province.status_code == 400

    unknown_sector = auth_client.post(
        "/api/v1/search-runs", json={**base, "sector_slugs": ["no-existe"]}
    )
    assert unknown_sector.status_code == 400

    no_sector = auth_client.post("/api/v1/search-runs", json={**base, "sector_slugs": []})
    assert no_sector.status_code == 400

    no_campaign = auth_client.post("/api/v1/search-runs", json={**base, "campaign_id": 9999})
    assert no_campaign.status_code == 400

    invalid_limit = auth_client.post("/api/v1/search-runs", json={**base, "limit": 999})
    assert invalid_limit.status_code == 422


def test_list_and_get_search_runs(auth_client: TestClient) -> None:
    created = auth_client.post(
        "/api/v1/search-runs",
        json={"province_code": "AR-B", "sector_slugs": ["hvac"]},
    ).json()

    listing = auth_client.get("/api/v1/search-runs")
    assert listing.status_code == 200
    assert any(run["id"] == created["id"] for run in listing.json())

    detail = auth_client.get(f"/api/v1/search-runs/{created['id']}")
    assert detail.status_code == 200
    assert detail.json()["id"] == created["id"]

    assert auth_client.get("/api/v1/search-runs/9999").status_code == 404


def test_cancel_and_retry_search_run(auth_client: TestClient) -> None:
    run = auth_client.post(
        "/api/v1/search-runs",
        json={"province_code": "AR-X", "sector_slugs": ["hvac"]},
    ).json()

    cancelled = auth_client.post(f"/api/v1/search-runs/{run['id']}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert cancelled.json()["finished_at"] is not None

    jobs = _run_jobs(run["id"])
    assert jobs[0].status == "cancelled"

    assert auth_client.post(f"/api/v1/search-runs/{run['id']}/cancel").status_code == 409

    retried = auth_client.post(f"/api/v1/search-runs/{run['id']}/retry")
    assert retried.status_code == 200
    assert retried.json()["status"] == "pending"
    assert retried.json()["records_found"] == 0

    jobs = _run_jobs(run["id"])
    assert [job.status for job in jobs] == ["cancelled", "pending"]


def test_retry_rejects_pending_run(auth_client: TestClient) -> None:
    run = auth_client.post(
        "/api/v1/search-runs",
        json={"province_code": "AR-X", "sector_slugs": ["hvac"]},
    ).json()
    assert auth_client.post(f"/api/v1/search-runs/{run['id']}/retry").status_code == 409


def test_search_runs_require_session(client: TestClient) -> None:
    assert client.get("/api/v1/search-runs").status_code == 401
    assert (
        client.post(
            "/api/v1/search-runs",
            json={"province_code": "AR-X", "sector_slugs": ["hvac"]},
        ).status_code
        == 401
    )


def test_search_run_can_reference_campaign_in_db(auth_client: TestClient) -> None:
    campaign_id = auth_client.get("/api/v1/campaigns").json()[0]["id"]
    run = auth_client.post(
        "/api/v1/search-runs",
        json={
            "province_code": "AR-X",
            "sector_slugs": ["hvac"],
            "campaign_id": campaign_id,
        },
    ).json()

    with SessionLocal() as db:
        stored = db.get(SearchRun, run["id"])
        assert stored is not None
        assert stored.campaign_id == campaign_id
        assert db.get(Campaign, campaign_id) is not None


def test_search_runs_filters(auth_client: TestClient) -> None:
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": auth_client.get("/api/v1/products").json()[0]["id"],
            "name": "Campaña filtros",
            "province_filters": ["AR-X", "AR-B"],
            "sector_filters": ["hvac"],
        },
    ).json()
    started = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start").json()

    by_campaign = auth_client.get(
        "/api/v1/search-runs", params={"campaign_id": campaign["id"]}
    ).json()
    assert len(by_campaign) == 2
    assert {run["id"] for run in by_campaign} == {run["id"] for run in started["search_runs"]}

    by_province = auth_client.get("/api/v1/search-runs", params={"province_code": "AR-X"}).json()
    assert len(by_province) == 1
    assert by_province[0]["search_config"]["province_code"] == "AR-X"

    by_status = auth_client.get("/api/v1/search-runs", params={"status": "pending"}).json()
    assert len(by_status) == 2

    invalid_status = auth_client.get("/api/v1/search-runs", params={"status": "no-existe"})
    assert invalid_status.status_code == 400

    invalid_province = auth_client.get("/api/v1/search-runs", params={"province_code": "AR-XX"})
    assert invalid_province.status_code == 400
