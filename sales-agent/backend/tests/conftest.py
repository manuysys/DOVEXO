"""Configuración de pruebas.

La base de datos de test es un archivo SQLite temporal. Las variables de
entorno se definen antes de importar `app` para que la configuración las tome.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

_TEST_DIR = Path(tempfile.mkdtemp(prefix="arvokta-sales-agent-tests-"))

os.environ["APP_ENV"] = "test"
os.environ["DATABASE_URL"] = f"sqlite:///{(_TEST_DIR / 'test.db').as_posix()}"
os.environ["JWT_SECRET"] = "test-secret-with-at-least-32-characters-long"
os.environ["INITIAL_ADMIN_EMAIL"] = "admin@arvokta.local"
os.environ["INITIAL_ADMIN_PASSWORD"] = "Arvokta12345!"
os.environ["CORS_ORIGINS"] = "http://localhost:3001"
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.rate_limit import reset_rate_limits  # noqa: E402
from app.database.base import Base  # noqa: E402
from app.database.session import engine  # noqa: E402
from app.main import app  # noqa: E402

ADMIN_EMAIL = os.environ["INITIAL_ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["INITIAL_ADMIN_PASSWORD"]


@pytest.fixture()
def client() -> TestClient:
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    reset_rate_limits()
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def auth_client(client: TestClient) -> TestClient:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    assert response.status_code == 200, response.text
    return client
