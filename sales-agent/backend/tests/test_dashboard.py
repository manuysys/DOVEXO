from fastapi.testclient import TestClient

from app.database.session import SessionLocal
from app.models import Activity
from app.workers.queue import run_once


def wait_for_test_client(client: TestClient) -> None:
    assert client.get("/api/v1/health").status_code == 200


def test_dashboard_metrics_without_data_is_zero(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/dashboard/metrics")
    assert response.status_code == 200
    metrics = response.json()

    assert metrics["companies"] == 0
    assert metrics["new_companies"] == 0
    assert metrics["investigated_companies"] == 0
    assert metrics["leads_pending_review"] == 0
    assert metrics["published_contacts"] == 0
    assert metrics["published_whatsapp"] == 0
    assert metrics["approved_leads"] == 0
    assert metrics["contacted_leads"] == 0
    assert metrics["responses"] == 0
    assert metrics["meetings"] == 0
    assert metrics["jobs_pending"] == 0
    assert metrics["jobs_running"] == 0
    assert metrics["jobs_failed"] == 0

    # Solo existen los datos de semilla.
    assert metrics["products"] == 1
    assert metrics["campaigns"] == 1


def test_dashboard_activity_starts_empty(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/dashboard/activity")
    assert response.status_code == 200
    assert response.json() == []


def test_dashboard_activity_returns_real_rows(auth_client: TestClient) -> None:
    with SessionLocal() as db:
        db.add(
            Activity(
                activity_type="note",
                description="Nota de prueba",
                metadata_json={"origen": "test"},
            )
        )
        db.commit()

    response = auth_client.get("/api/v1/dashboard/activity")
    assert response.status_code == 200
    activities = response.json()
    assert len(activities) == 1
    assert activities[0]["activity_type"] == "note"
    assert activities[0]["description"] == "Nota de prueba"
    assert activities[0]["metadata"] == {"origen": "test"}
    assert activities[0]["lead_id"] is None


def test_noop_job_is_queued_and_processed(auth_client: TestClient) -> None:
    created = auth_client.post("/api/v1/jobs/noop", json={"payload": {"origen": "test"}})
    assert created.status_code == 201
    job = created.json()
    assert job["status"] == "pending"
    assert job["job_type"] == "noop"

    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["jobs_pending"] == 1

    with SessionLocal() as db:
        processed = run_once(db)
        assert processed is not None
        assert processed.id == job["id"]
        assert processed.status == "completed"
        assert processed.attempts == 1
        assert processed.result["acknowledged"] is True
        assert processed.result["payload"] == {"origen": "test"}

        assert run_once(db) is None

    jobs = auth_client.get("/api/v1/dashboard/jobs").json()
    assert len(jobs) == 1
    assert jobs[0]["status"] == "completed"

    metrics = auth_client.get("/api/v1/dashboard/metrics").json()
    assert metrics["jobs_pending"] == 0
    assert metrics["jobs_failed"] == 0


def test_campaign_search_run_fails_without_province(auth_client: TestClient) -> None:
    product_id = auth_client.get("/api/v1/products").json()[0]["id"]
    campaign = auth_client.post(
        "/api/v1/campaigns",
        json={
            "product_id": product_id,
            "name": "Campaña worker",
            "province_filters": ["AR-C"],
            "sector_filters": ["hvac"],
        },
    ).json()
    started = auth_client.post(f"/api/v1/campaigns/{campaign['id']}/start")
    assert started.status_code == 200
    job_id = started.json()["job_id"]
    search_run_id = started.json()["search_run_id"]

    with SessionLocal() as db:
        job = run_once(db)
        assert job is not None
        assert job.id == job_id
        # La búsqueda de campaña no tiene provincia única: falla sin inventar.
        assert job.status == "completed"
        assert job.result is not None
        assert job.result["status"] == "failed"

    run = auth_client.get(f"/api/v1/search-runs/{search_run_id}").json()
    assert run["status"] == "failed"
    assert run["errors"]
    assert run["records_found"] == 0
    assert auth_client.get("/api/v1/companies").json()["total"] == 0


def test_noop_endpoint_requires_session(client: TestClient) -> None:
    wait_for_test_client(client)
    assert client.post("/api/v1/jobs/noop").status_code == 401
