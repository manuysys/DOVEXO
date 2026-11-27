from __future__ import annotations

from fastapi.testclient import TestClient


def _create(client: TestClient, **overrides: object) -> dict:
    payload = {
        "name": "Empresa de Prueba",
        "province": "AR-X",
        "locality": "Córdoba",
        "sector_slugs": ["hvac"],
    }
    payload.update(overrides)
    response = client.post("/api/v1/companies", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_manual_company_create_and_detail(auth_client: TestClient) -> None:
    company = _create(
        auth_client,
        name="Frío Manual",
        website="frio-manual.com.ar",
        phone="0351 455-6677",
        email="Hola@Frio-Manual.com.ar",
        address="San Martín 100",
    )
    assert company["discovery_status"] == "manual"
    assert company["normalized_domain"] == "frio-manual.com.ar"
    assert company["primary_phone"] == "+543514556677"
    assert company["primary_email"] == "hola@frio-manual.com.ar"
    assert company["source_count"] == 1
    assert company["sources"][0]["source_type"] == "manual"
    assert {contact["contact_type"] for contact in company["contacts"]} == {
        "phone",
        "email",
    }
    assert company["sectors"][0]["slug"] == "hvac"

    detail = auth_client.get(f"/api/v1/companies/{company['id']}")
    assert detail.status_code == 200
    assert detail.json()["name"] == "Frío Manual"
    assert auth_client.get("/api/v1/companies/9999").status_code == 404


def test_manual_company_duplicate_domain_returns_409(auth_client: TestClient) -> None:
    first = _create(auth_client, name="Empresa Dominio", website="empresa-dominio.com.ar")

    duplicate = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Otra Empresa",
            "website": "https://www.empresa-dominio.com.ar/contacto",
            "sector_slugs": ["hvac"],
        },
    )
    assert duplicate.status_code == 409
    body = duplicate.json()
    assert body["detail"] == "Ya existe una empresa con esos datos."
    assert body["duplicate_of"] == first["id"]
    assert body["reason"] == "domain"


def test_manual_company_duplicate_phone_returns_409(auth_client: TestClient) -> None:
    first = _create(auth_client, name="Empresa Teléfono", phone="351 455 6677")

    duplicate = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Empresa Teléfono Dos",
            "phone": "0351 455-6677",
            "sector_slugs": ["hvac"],
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["duplicate_of"] == first["id"]
    assert duplicate.json()["reason"] == "phone"


def test_manual_company_duplicate_name_and_locality_returns_409(
    auth_client: TestClient,
) -> None:
    first = _create(
        auth_client,
        name="Empresa Nombre",
        locality="Villa María",
        province="AR-X",
    )

    duplicate = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Empresa Nombre S.R.L.",
            "locality": "Villa María",
            "province": "AR-X",
            "sector_slugs": ["hvac"],
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["duplicate_of"] == first["id"]
    assert duplicate.json()["reason"] == "name_locality"


def test_manual_company_fuzzy_match_is_saved_as_possible_duplicate(
    auth_client: TestClient,
) -> None:
    _create(auth_client, name="Refrigeración del Sur", locality="Córdoba")

    fuzzy = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Refrigeraciones del Sur",
            "locality": "Córdoba",
            "province": "AR-X",
            "sector_slugs": ["hvac"],
        },
    )
    assert fuzzy.status_code == 201
    assert fuzzy.json()["discovery_status"] == "possible_duplicate"


def test_manual_company_validation(auth_client: TestClient) -> None:
    unknown_province = auth_client.post(
        "/api/v1/companies",
        json={
            "name": "Empresa Inválida",
            "province": "AR-XX",
            "sector_slugs": ["hvac"],
        },
    )
    assert unknown_province.status_code == 422

    unknown_sector = auth_client.post(
        "/api/v1/companies",
        json={"name": "Empresa Inválida", "sector_slugs": ["no-existe"]},
    )
    assert unknown_sector.status_code == 422

    no_sector = auth_client.post(
        "/api/v1/companies", json={"name": "Empresa Inválida", "sector_slugs": []}
    )
    assert no_sector.status_code == 422

    bad_phone = auth_client.post(
        "/api/v1/companies",
        json={"name": "Empresa Inválida", "sector_slugs": ["hvac"], "phone": "abc"},
    )
    assert bad_phone.status_code == 422


def test_patch_company_updates_normalized_fields(auth_client: TestClient) -> None:
    company = _create(auth_client, name="Empresa Patch")

    response = auth_client.patch(
        f"/api/v1/companies/{company['id']}",
        json={
            "name": "Empresa Patch Renombrada",
            "website": "https://www.patch.com.ar/contacto",
            "sector_slugs": ["it_support"],
            "description": "Soporte IT para empresas",
        },
    )
    assert response.status_code == 200, response.text
    updated = response.json()
    assert updated["name"] == "Empresa Patch Renombrada"
    assert updated["normalized_domain"] == "patch.com.ar"
    assert updated["description"] == "Soporte IT para empresas"
    assert [sector["slug"] for sector in updated["sectors"]] == ["it_support"]

    invalid = auth_client.patch(f"/api/v1/companies/{company['id']}", json={"province": "AR-XX"})
    assert invalid.status_code == 422


def test_contacts_endpoints_normalize_and_avoid_whatsapp_assumption(
    auth_client: TestClient,
) -> None:
    company = _create(auth_client, name="Empresa Contactos", phone="0351 455-6677")

    contacts = auth_client.get(f"/api/v1/companies/{company['id']}/contacts").json()
    assert [contact["contact_type"] for contact in contacts] == ["phone"]
    assert contacts[0]["normalized_value"] == "+543514556677"

    added = auth_client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={"contact_type": "phone", "value": "351 455-6677", "label": "Recepción"},
    )
    assert added.status_code == 409

    whatsapp = auth_client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={
            "contact_type": "whatsapp",
            "value": "https://wa.me/5493515551234",
            "label": "Ventas",
            "is_primary": True,
            "verification_status": "published",
        },
    )
    assert whatsapp.status_code == 201
    assert whatsapp.json()["normalized_value"] == "+5493515551234"
    assert whatsapp.json()["verification_status"] == "published"

    invalid = auth_client.post(
        f"/api/v1/companies/{company['id']}/contacts",
        json={"contact_type": "email", "value": "no-es-email"},
    )
    assert invalid.status_code == 422

    detail = auth_client.get(f"/api/v1/companies/{company['id']}").json()
    assert detail["whatsapp"] == "+5493515551234"


def test_companies_filters_and_pagination(auth_client: TestClient) -> None:
    alfa = _create(
        auth_client,
        name="Empresa Alfa",
        province="AR-X",
        locality="Córdoba",
        sector_slugs=["hvac"],
    )
    _create(
        auth_client,
        name="Empresa Beta",
        province="AR-X",
        locality="Córdoba",
        sector_slugs=["it_support"],
    )
    _create(
        auth_client,
        name="Empresa Gamma",
        province="AR-B",
        locality="La Plata",
        sector_slugs=["hvac"],
    )

    first_page = auth_client.get("/api/v1/companies", params={"limit": 1, "offset": 0}).json()
    assert first_page["total"] == 3
    assert first_page["limit"] == 1
    assert len(first_page["items"]) == 1

    second_page = auth_client.get("/api/v1/companies", params={"limit": 1, "offset": 1}).json()
    assert second_page["items"][0]["id"] != first_page["items"][0]["id"]

    by_province = auth_client.get("/api/v1/companies", params={"province": "AR-X"}).json()
    assert by_province["total"] == 2

    by_sector = auth_client.get("/api/v1/companies", params={"sector": "hvac"}).json()
    assert by_sector["total"] == 2

    combined = auth_client.get(
        "/api/v1/companies", params={"province": "Córdoba", "sector": "it_support"}
    ).json()
    assert combined["total"] == 1

    by_query = auth_client.get("/api/v1/companies", params={"query": "alfa"}).json()
    assert by_query["total"] == 1
    assert by_query["items"][0]["id"] == alfa["id"]

    bad_province = auth_client.get("/api/v1/companies", params={"province": "AR-XX"})
    assert bad_province.status_code == 400


def test_companies_require_session(client: TestClient) -> None:
    assert client.get("/api/v1/companies").status_code == 401
    assert client.post("/api/v1/companies", json={"name": "Sin sesión"}).status_code == 401
