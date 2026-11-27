from fastapi.testclient import TestClient


def test_health_is_public(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "ARVOKTA Sales Agent"


def test_ready_checks_schema(client: TestClient) -> None:
    response = client.get("/api/v1/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_protected_endpoint_requires_session(client: TestClient) -> None:
    response = client.get("/api/v1/products")
    assert response.status_code == 401
    assert response.json()["detail"] == "No autenticado."
