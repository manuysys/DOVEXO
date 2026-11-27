from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.rate_limit import reset_rate_limits
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


def test_login_sets_http_only_cookie(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["email"] == ADMIN_EMAIL
    assert body["user"]["role"] == "admin"
    assert "password" not in response.text

    cookie = response.headers["set-cookie"]
    assert "arvokta_access=" in cookie
    assert "HttpOnly" in cookie
    assert "SameSite=lax" in cookie.replace("samesite", "SameSite")


def test_login_rejects_wrong_password(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": "wrong-password"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos."


def test_login_rejects_unknown_user_with_same_message(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nadie@arvokta.local", "password": "whatever"},
    )
    assert response.status_code == 401
    assert response.json()["detail"] == "Email o contraseña incorrectos."


def test_me_requires_cookie_and_returns_user(auth_client: TestClient) -> None:
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json() == {"id": 1, "email": ADMIN_EMAIL, "role": "admin"}


def test_logout_clears_cookie(auth_client: TestClient) -> None:
    response = auth_client.post("/api/v1/auth/logout")
    assert response.status_code == 204

    me = auth_client.get("/api/v1/auth/me")
    assert me.status_code == 401


def test_login_rate_limit_returns_429(client: TestClient) -> None:
    original_enabled = settings.rate_limit_enabled
    original_ip_limit = settings.rate_limit_login_per_ip
    original_email_limit = settings.rate_limit_login_per_email
    settings.rate_limit_enabled = True
    settings.rate_limit_login_per_ip = 2
    settings.rate_limit_login_per_email = 2
    reset_rate_limits()
    try:
        for _ in range(2):
            response = client.post(
                "/api/v1/auth/login",
                json={"email": ADMIN_EMAIL, "password": "wrong"},
            )
            assert response.status_code == 401

        limited = client.post(
            "/api/v1/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrong"},
        )
        assert limited.status_code == 429
        assert "Retry-After" in limited.headers
    finally:
        settings.rate_limit_enabled = original_enabled
        settings.rate_limit_login_per_ip = original_ip_limit
        settings.rate_limit_login_per_email = original_email_limit
        reset_rate_limits()


def test_validation_error_is_422(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "no-es-email", "password": ""},
    )
    assert response.status_code == 422
