from fastapi.testclient import TestClient


def _dovexo_id(client: TestClient) -> int:
    products = client.get("/api/v1/products").json()
    return next(product["id"] for product in products if product["slug"] == "dovexo")


def test_create_update_and_deactivate_product(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/products",
        json={
            "name": "Producto Prueba",
            "description": "Descripción",
            "pain_points": ["Problema uno"],
            "target_sectors": ["hvac"],
            "keywords": ["prueba"],
            "scoring_config": {"factors": []},
            "messaging_config": {"sender_name": "Test"},
        },
    )
    assert response.status_code == 201, response.text
    product = response.json()
    assert product["slug"] == "producto-prueba"
    assert product["is_active"] is True

    updated = auth_client.patch(
        f"/api/v1/products/{product['id']}",
        json={"description": "Otra descripción", "is_active": True},
    )
    assert updated.status_code == 200
    assert updated.json()["description"] == "Otra descripción"

    deactivated = auth_client.delete(f"/api/v1/products/{product['id']}")
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False

    active_slugs = {item["slug"] for item in auth_client.get("/api/v1/products").json()}
    assert "producto-prueba" not in active_slugs
    assert "dovexo" in active_slugs

    inactive_slugs = {
        item["slug"]
        for item in auth_client.get("/api/v1/products", params={"include_inactive": "true"}).json()
    }
    assert "producto-prueba" in inactive_slugs


def test_get_product_by_id(auth_client: TestClient) -> None:
    product_id = _dovexo_id(auth_client)
    response = auth_client.get(f"/api/v1/products/{product_id}")
    assert response.status_code == 200
    assert response.json()["slug"] == "dovexo"


def test_unknown_product_returns_404(auth_client: TestClient) -> None:
    assert auth_client.get("/api/v1/products/9999").status_code == 404
    assert auth_client.delete("/api/v1/products/9999").status_code == 404


def test_duplicate_slug_returns_409(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/products",
        json={"name": "DOVEXO duplicado", "slug": "dovexo"},
    )
    assert response.status_code == 409


def test_unknown_sector_returns_422(auth_client: TestClient) -> None:
    response = auth_client.post(
        "/api/v1/products",
        json={"name": "Producto raro", "target_sectors": ["no-existe"]},
    )
    assert response.status_code == 422


def test_product_mutations_require_session(client: TestClient) -> None:
    assert client.post("/api/v1/products", json={"name": "Sin sesión"}).status_code == 401
