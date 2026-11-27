from __future__ import annotations

from fastapi.testclient import TestClient

HEADER = "nombre,web,telefono,email,provincia,localidad,direccion,rubros\n"


def _upload(client: TestClient, text: str, filename: str = "empresas.csv"):
    return client.post(
        "/api/v1/imports/preview",
        files={"file": (filename, text.encode("utf-8"), "text/csv")},
    )


def test_preview_detects_valid_invalid_and_duplicate_rows(auth_client: TestClient) -> None:
    csv_text = HEADER + (
        "Frío Norte,frio-norte.com.ar,0351 455-6677,hola@frio-norte.com.ar,"
        "Córdoba,Córdoba,San Martín 10,hvac; electronic_security\n"
        "Empresa Inválida,,,,AR-XX,,,hvac\n"
        "Frío Norte Duplicado,https://www.frio-norte.com.ar/contacto,,,,Córdoba,,hvac\n"
        "Sin Rubro,,,,,,,\n"
    )

    response = _upload(auth_client, csv_text)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["filename"] == "empresas.csv"
    assert body["total_rows"] == 4
    assert body["valid_rows"] == 1
    assert body["invalid_rows"] == 2
    assert body["duplicates"] == 1

    statuses = [row["status"] for row in body["preview"]]
    assert statuses == ["valid", "invalid", "duplicate", "invalid"]
    assert body["preview"][0]["sectors"] == ["hvac", "electronic_security"]
    assert body["preview"][0]["province"] == "Córdoba"
    assert {error["row_number"] for error in body["errors"]} == {3, 5}

    # El preview no crea empresas.
    assert auth_client.get("/api/v1/companies").json()["total"] == 0

    detail = auth_client.get(f"/api/v1/imports/{body['batch_id']}").json()
    assert detail["status"] == "preview"
    assert detail["valid_rows"] == 1
    assert detail["duplicate_rows"] == 1
    assert detail["mapping"]["name"] == "nombre"
    assert detail["mapping"]["sectors"] == "rubros"

    imports = auth_client.get("/api/v1/imports").json()
    assert any(batch["id"] == body["batch_id"] for batch in imports)


def test_confirm_creates_companies_and_is_idempotent(auth_client: TestClient) -> None:
    csv_text = HEADER + (
        "Frío Uno,frio-uno.com.ar,0351 455-6677,uno@frio.com.ar,Córdoba,Córdoba,,hvac\n"
        "Frío Dos,,0351 455-6688,,Córdoba,Villa María,,it_support\n"
    )
    preview = _upload(auth_client, csv_text).json()
    assert preview["valid_rows"] == 2

    confirm = auth_client.post(f"/api/v1/imports/{preview['batch_id']}/confirm")
    assert confirm.status_code == 200, confirm.text
    assert confirm.json() == {
        "batch_id": preview["batch_id"],
        "created": 2,
        "skipped": 0,
        "errors": [],
    }

    companies = auth_client.get("/api/v1/companies").json()
    assert companies["total"] == 2
    first = next(c for c in companies["items"] if c["name"] == "Frío Uno")
    assert first["discovery_status"] == "imported"
    assert first["primary_phone"] == "+543514556677"
    assert first["primary_email"] == "uno@frio.com.ar"
    assert [sector["slug"] for sector in first["sectors"]] == ["hvac"]

    detail = auth_client.get(f"/api/v1/companies/{first['id']}").json()
    assert detail["sources"][0]["source_type"] == "csv_import"
    assert detail["sources"][0]["search_run_id"] is None
    assert "empresas.csv" in (detail["sources"][0]["source_url"] or "") or detail["sources"][0][
        "source_url"
    ].startswith("https://frio-uno.com.ar")

    # Idempotente: no duplica empresas ni cambia el informe.
    second = auth_client.post(f"/api/v1/imports/{preview['batch_id']}/confirm")
    assert second.status_code == 200
    assert second.json()["created"] == 2
    assert second.json()["skipped"] == 0
    assert auth_client.get("/api/v1/companies").json()["total"] == 2

    batch = auth_client.get(f"/api/v1/imports/{preview['batch_id']}").json()
    assert batch["status"] == "confirmed"
    assert batch["confirmed_at"] is not None
    assert batch["successful_rows"] == 2


def test_confirm_skips_database_duplicates(auth_client: TestClient) -> None:
    existing = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Empresa Existente",
            "website": "existente.com.ar",
            "sector_slugs": ["hvac"],
        },
    ).json()

    preview = _upload(
        auth_client,
        HEADER + "Otra Empresa,https://www.existente.com.ar/contacto,,,,Córdoba,,hvac\n",
    ).json()
    assert preview["duplicates"] == 1
    assert preview["valid_rows"] == 0

    confirm = auth_client.post(f"/api/v1/imports/{preview['batch_id']}/confirm")
    assert confirm.status_code == 200
    assert confirm.json()["created"] == 0
    assert confirm.json()["skipped"] == 1
    assert auth_client.get("/api/v1/companies").json()["total"] == 1
    assert auth_client.get(f"/api/v1/companies/{existing['id']}").status_code == 200


def test_preview_accepts_semicolon_and_bom(auth_client: TestClient) -> None:
    csv_text = (
        "\ufeffnombre;web;telefono;email;provincia;localidad;direccion;rubros\n"
        "Empresa Punto;empresa-punto.com.ar;;;Córdoba;Córdoba;;hvac\n"
    )
    response = auth_client.post(
        "/api/v1/imports/preview",
        files={"file": ("empresas.csv", csv_text.encode("utf-8"), "text/csv")},
    )
    assert response.status_code == 201, response.text
    assert response.json()["valid_rows"] == 1
    assert response.json()["preview"][0]["name"] == "Empresa Punto"


def test_preview_rejects_invalid_files(auth_client: TestClient) -> None:
    no_name = auth_client.post(
        "/api/v1/imports/preview",
        files={"file": ("empresas.csv", b"web,telefono\nx.com,123\n", "text/csv")},
    )
    assert no_name.status_code == 400

    bad_encoding = auth_client.post(
        "/api/v1/imports/preview",
        files={"file": ("empresas.csv", b"\xff\xfe\x00", "text/csv")},
    )
    assert bad_encoding.status_code == 400

    empty = auth_client.post(
        "/api/v1/imports/preview",
        files={"file": ("empresas.csv", b"", "text/csv")},
    )
    assert empty.status_code == 400

    too_many_rows = HEADER + "".join(
        f"Empresa {index},empresa-{index}.com.ar,,,,,hvac\n" for index in range(501)
    )
    too_many = _upload(auth_client, too_many_rows)
    assert too_many.status_code == 400
    assert "500" in too_many.json()["detail"]

    too_large = auth_client.post(
        "/api/v1/imports/preview",
        files={"file": ("empresas.csv", b"x" * (2 * 1024 * 1024 + 1), "text/csv")},
    )
    assert too_large.status_code == 413


def test_import_errors_and_permissions(auth_client: TestClient, client: TestClient) -> None:
    preview = _upload(auth_client, HEADER + "Solo Inválida,,,,AR-XX,,,hvac\n").json()
    assert preview["valid_rows"] == 0
    confirm = auth_client.post(f"/api/v1/imports/{preview['batch_id']}/confirm")
    assert confirm.status_code == 200
    assert confirm.json()["created"] == 0
    assert confirm.json()["skipped"] == 1

    assert auth_client.post("/api/v1/imports/9999/confirm").status_code == 404

    auth_client.post("/api/v1/auth/logout")
    assert (
        client.post(
            "/api/v1/imports/preview",
            files={"file": ("empresas.csv", HEADER.encode("utf-8"), "text/csv")},
        ).status_code
        == 401
    )
    assert client.get("/api/v1/imports").status_code == 401
