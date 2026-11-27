from __future__ import annotations

import csv
import io

import pytest
from fastapi.testclient import TestClient

from app.database.session import SessionLocal
from app.providers.discovery.base import CompanyDiscoveryProvider, DiscoveryProviderError
from app.workers.queue import run_once
from tests.fakes import FakeDiscoveryProvider, osm_company


class FailingProvider(CompanyDiscoveryProvider):
    def search(self, *, province_code, sector_slugs, keywords=None, limit=50):  # type: ignore[override]
        raise DiscoveryProviderError("Overpass no disponible")


def _create_run(client: TestClient, *, limit: int = 10) -> dict:
    response = client.post(
        "/api/v1/search-runs",
        json={
            "province_code": "AR-X",
            "sector_slugs": ["hvac"],
            "limit": limit,
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


def _use_provider(monkeypatch: pytest.MonkeyPatch, provider: CompanyDiscoveryProvider) -> None:
    monkeypatch.setattr(
        "app.workers.queue.get_discovery_provider",
        lambda name="overpass": provider,
    )


def test_worker_saves_companies_sources_contacts_and_sectors(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake = FakeDiscoveryProvider(
        [
            osm_company(
                osm_id=1001,
                name="Frío Córdoba",
                sector_slugs=("hvac",),
                website="frio-cordoba.com.ar",
                phone="0351 455-6677",
                email="Contacto@Frio-Cordoba.com.ar",
                whatsapp="https://wa.me/5493515551234",
                address="Av. Colón 123",
                locality="Córdoba",
                description="Refrigeración comercial",
            ),
            osm_company(
                osm_id=1002,
                name="Frío Córdoba Sucursal",
                sector_slugs=("hvac",),
                website="https://www.frio-cordoba.com.ar/contacto",
                locality="Córdoba",
            ),
        ]
    )
    _use_provider(monkeypatch, fake)
    run = _create_run(auth_client)

    with SessionLocal() as db:
        job = run_once(db)
    assert job is not None
    assert job.status == "completed"
    assert fake.calls == [
        {
            "province_code": "AR-X",
            "sector_slugs": ["hvac"],
            "keywords": None,
            "limit": 10,
        }
    ]

    stored = auth_client.get(f"/api/v1/search-runs/{run['id']}").json()
    assert stored["status"] == "completed"
    assert stored["records_found"] == 2
    assert stored["new_companies"] == 1
    assert stored["duplicates"] == 1
    assert stored["errors"] == []

    listing = auth_client.get("/api/v1/companies", params={"search_run_id": run["id"]}).json()
    assert listing["total"] == 1
    company = listing["items"][0]
    assert company["name"] == "Frío Córdoba"
    assert company["province"] == "Córdoba"
    assert company["locality"] == "Córdoba"
    assert company["discovery_status"] == "discovered"
    assert company["sectors"] == [
        {"id": company["sectors"][0]["id"], "slug": "hvac", "name": "Refrigeración y climatización"}
    ]
    assert company["primary_phone"] == "+543514556677"
    assert company["primary_email"] == "contacto@frio-cordoba.com.ar"
    assert company["whatsapp"] == "+5493515551234"
    assert company["source_count"] == 2
    assert {contact["contact_type"] for contact in company["contacts"]} == {
        "phone",
        "email",
        "whatsapp",
    }

    detail = auth_client.get(f"/api/v1/companies/{company['id']}").json()
    assert len(detail["sources"]) == 2
    assert {source["source_type"] for source in detail["sources"]} == {"openstreetmap"}
    assert {source["search_run_id"] for source in detail["sources"]} == {run["id"]}
    assert all(
        source["source_url"].startswith("https://www.openstreetmap.org/")
        for source in detail["sources"]
    )

    exported = auth_client.get("/api/v1/companies/export.csv", params={"search_run_id": run["id"]})
    exported_rows = list(csv.reader(io.StringIO(exported.content.decode("utf-8-sig"))))
    assert len(exported_rows) == 2
    assert exported_rows[1][1] == "Frío Córdoba"


def test_worker_marks_fuzzy_match_as_possible_duplicate(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    first = FakeDiscoveryProvider(
        [
            osm_company(
                osm_id=2001,
                name="Refrigeración del Sur",
                sector_slugs=("hvac",),
                locality="Córdoba",
            )
        ]
    )
    _use_provider(monkeypatch, first)
    _create_run(auth_client)
    with SessionLocal() as db:
        assert run_once(db) is not None

    second = FakeDiscoveryProvider(
        [
            osm_company(
                osm_id=2002,
                name="Refrigeraciones del Sur",
                sector_slugs=("hvac",),
                locality="Córdoba",
            )
        ]
    )
    _use_provider(monkeypatch, second)
    run2 = _create_run(auth_client)
    with SessionLocal() as db:
        assert run_once(db) is not None

    stored = auth_client.get(f"/api/v1/search-runs/{run2['id']}").json()
    assert stored["status"] == "completed"
    assert stored["new_companies"] == 1
    assert stored["duplicates"] == 0

    companies = auth_client.get("/api/v1/companies").json()
    assert companies["total"] == 2
    statuses = {company["name"]: company["discovery_status"] for company in companies["items"]}
    assert statuses["Refrigeración del Sur"] == "discovered"
    assert statuses["Refrigeraciones del Sur"] == "possible_duplicate"


def test_worker_provider_failure_then_retry(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    run = _create_run(auth_client)
    _use_provider(monkeypatch, FailingProvider())

    with SessionLocal() as db:
        job = run_once(db)
    assert job is not None
    assert job.status == "pending"  # queda para reintento
    assert "Overpass no disponible" in (job.error_message or "")

    stored = auth_client.get(f"/api/v1/search-runs/{run['id']}").json()
    assert stored["status"] == "failed"
    assert stored["errors"] == ["Overpass no disponible"]
    assert stored["finished_at"] is not None

    retried = auth_client.post(f"/api/v1/search-runs/{run['id']}/retry")
    assert retried.status_code == 200
    assert retried.json()["status"] == "pending"

    _use_provider(
        monkeypatch,
        FakeDiscoveryProvider(
            [
                osm_company(
                    osm_id=3001,
                    name="Clima Retry",
                    sector_slugs=("hvac",),
                    locality="Córdoba",
                )
            ]
        ),
    )
    with SessionLocal() as db:
        job = run_once(db)
    assert job is not None
    assert job.status == "completed"

    stored = auth_client.get(f"/api/v1/search-runs/{run['id']}").json()
    assert stored["status"] == "completed"
    assert stored["new_companies"] == 1
    assert auth_client.get("/api/v1/companies").json()["total"] == 1


def test_cancelled_run_is_not_processed(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    fake = FakeDiscoveryProvider([])
    _use_provider(monkeypatch, fake)
    run = _create_run(auth_client)
    assert auth_client.post(f"/api/v1/search-runs/{run['id']}/cancel").status_code == 200

    with SessionLocal() as db:
        assert run_once(db) is None
    assert fake.calls == []
    assert auth_client.get(f"/api/v1/search-runs/{run['id']}").json()["status"] == "cancelled"
