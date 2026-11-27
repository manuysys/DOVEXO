from fastapi.testclient import TestClient
from sqlalchemy import func, select

from app.database.seed import bootstrap_database
from app.database.session import SessionLocal
from app.models import Campaign, Product, Sector, User
from tests.conftest import ADMIN_EMAIL


def test_provinces_catalog(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/meta/provinces")
    assert response.status_code == 200
    provinces = response.json()
    assert len(provinces) == 24
    codes = {province["code"] for province in provinces}
    assert "AR-C" in codes
    assert "AR-T" in codes


def test_sectors_catalog(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/meta/sectors")
    assert response.status_code == 200
    sectors = response.json()
    assert len(sectors) == 7
    assert {sector["slug"] for sector in sectors} == {
        "hvac",
        "it_support",
        "electronic_security",
        "industrial_maintenance",
        "gates_automation",
        "appliance_repair",
        "electrical_installations",
    }


def test_dovexo_seed_is_complete(client: TestClient) -> None:
    login = client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": "Arvokta12345!"},
    )
    assert login.status_code == 200

    products = client.get("/api/v1/products").json()
    dovexo = next(product for product in products if product["slug"] == "dovexo")
    assert dovexo["name"] == "DOVEXO"
    assert len(dovexo["target_sectors"]) == 7
    assert len(dovexo["pain_points"]) == 10
    factors = dovexo["scoring_config"]["factors"]
    assert sum(factor["max_points"] for factor in factors) == 100
    assert dovexo["messaging_config"]["sender_company"] == "ARVOKTA"
    assert dovexo["messaging_config"]["requires_human_approval"] is True


def test_initial_campaign_seed(auth_client: TestClient) -> None:
    campaigns = auth_client.get("/api/v1/campaigns").json()
    assert len(campaigns) == 1
    campaign = campaigns[0]
    assert campaign["name"] == "DOVEXO — Argentina — Prospección inicial"
    assert campaign["status"] == "active"
    assert len(campaign["province_filters"]) == 24
    assert len(campaign["sector_filters"]) == 7


def test_bootstrap_is_idempotent(auth_client: TestClient) -> None:
    with SessionLocal() as db:
        before = (
            db.scalar(select(func.count()).select_from(User)),
            db.scalar(select(func.count()).select_from(Product)),
            db.scalar(select(func.count()).select_from(Sector)),
            db.scalar(select(func.count()).select_from(Campaign)),
        )
        summary = bootstrap_database(db)
        after = (
            db.scalar(select(func.count()).select_from(User)),
            db.scalar(select(func.count()).select_from(Product)),
            db.scalar(select(func.count()).select_from(Sector)),
            db.scalar(select(func.count()).select_from(Campaign)),
        )

    assert before == after == (1, 1, 7, 1)
    assert summary["schema_ready"] is True
    assert summary["admin_created"] is False
    assert summary["sectors_added"] == 0
    assert summary["product_created"] is False
    assert summary["campaign_created"] is False
