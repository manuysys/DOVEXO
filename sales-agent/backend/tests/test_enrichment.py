"""Pruebas del enriquecimiento web.

Ninguna prueba sale a internet: el fetcher usa `httpx.MockTransport` y un
resolver de DNS simulado que devuelve una IP pública.
"""

from __future__ import annotations

from collections.abc import Callable

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.database.session import SessionLocal
from app.models import Company, CompanyFact, CompanySource, Contact, Job, User
from app.services.contacts import normalize_domain
from app.services.deduplication import normalize_name
from app.services.enrichment import (
    EnrichmentUnsafeUrl,
    EnrichmentValidationError,
    WebsiteFetcher,
    enqueue_enrichment_batch,
    enrich_company,
    parse_page,
)
from app.utils import utcnow
from app.workers.queue import run_once

PUBLIC_IP = "93.184.216.34"

HOME = "https://frio-cordoba.com.ar/"

HOME_HTML = """
<html>
  <head>
    <title>Frío Córdoba | Refrigeración</title>
    <meta name="description"
          content="Instalación y reparación de aire acondicionado en Córdoba." />
  </head>
  <body>
    <h1>Frío Córdoba</h1>
    <h2>Servicios</h2>
    <ul>
      <li>Instalación de aire acondicionado split</li>
      <li>Reparación de heladeras y lavarropas</li>
      <li>Mantenimiento de cámaras frigoríficas</li>
    </ul>
    <p>Cobertura en Córdoba y Gran Buenos Aires.</p>
    <p>Somos una empresa dedicada a la refrigeración comercial.</p>
    <a href="mailto:ventas@frio-cordoba.com.ar">Escribinos</a>
    <a href="tel:+54 351 455-6677">Llamanos</a>
    <a href="https://wa.me/5493515551234">WhatsApp</a>
    <a href="/contacto">Contacto</a>
    <a href="/servicios">Servicios</a>
    <a href="/cobertura">Zonas de cobertura</a>
    <a href="/nosotros">Nosotros</a>
    <a href="https://otro-sitio.com/">Sitio externo</a>
  </body>
</html>
"""

CONTACT_HTML = """
<html>
  <head><title>Contacto | Frío Córdoba</title></head>
  <body>
    <h1>Contacto</h1>
    <p>También podés escribirnos a info@frio-cordoba.com.ar</p>
    <form><input name="email" /><button>Enviar</button></form>
  </body>
</html>
"""


def _html(body: str, status_code: int = 200) -> httpx.Response:
    return httpx.Response(status_code, html=body)


class FakeSite:
    """Sitio simulado: mapea URL a respuesta y registra los pedidos."""

    def __init__(self, pages: dict[str, httpx.Response | Callable[[], httpx.Response]]) -> None:
        self.pages = pages
        self.requested: list[str] = []

    def handler(self, request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        self.requested.append(url)
        page = self.pages.get(url) or self.pages.get(url.rstrip("/"))
        if page is None:
            return httpx.Response(404, html="<html><body>No encontrado</body></html>")
        return page() if callable(page) else page

    def fetcher(self, **kwargs: object) -> WebsiteFetcher:
        return WebsiteFetcher(
            client=httpx.Client(transport=httpx.MockTransport(self.handler)),
            resolver=lambda _host: [PUBLIC_IP],
            page_delay_seconds=0.0,
            **kwargs,
        )


def _make_company(
    db: Session,
    *,
    name: str = "Frío Córdoba",
    website: str | None = HOME,
    description: str = "",
) -> Company:
    company = Company(
        name=name,
        normalized_name=normalize_name(name),
        description=description,
        website=website,
        normalized_domain=normalize_domain(website),
        country="Argentina",
    )
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@pytest.fixture()
def db(client: TestClient):
    with SessionLocal() as session:
        yield session


def _count(db: Session, model: type) -> int:
    return len(list(db.scalars(select(model))))


def broken_fetcher() -> WebsiteFetcher:
    """Fetcher que siempre falla por red (para probar reintentos)."""

    def _raise(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("sin red", request=request)

    return WebsiteFetcher(
        client=httpx.Client(transport=httpx.MockTransport(_raise)),
        resolver=lambda _host: [PUBLIC_IP],
        page_delay_seconds=0.0,
    )


# ---------------------------------------------------------------------------
# Parseo
# ---------------------------------------------------------------------------


def test_parse_page_extracts_contacts_meta_and_facts() -> None:
    page = parse_page(HOME, HOME_HTML)

    assert page.title == "Frío Córdoba | Refrigeración"
    assert page.meta_description is not None
    assert "Instalación y reparación" in page.meta_description
    assert "ventas@frio-cordoba.com.ar" in page.emails
    assert page.phones == ["+543514556677"]
    assert page.whatsapp_numbers == ["+5493515551234"]

    service_values = {fact.value for fact in page.facts if fact.fact_type == "service"}
    assert "Instalación de aire acondicionado split" in service_values
    assert "Reparación de heladeras y lavarropas" in service_values

    coverage_values = [fact.value for fact in page.facts if fact.fact_type == "coverage"]
    assert any("Cobertura en Córdoba" in value for value in coverage_values)

    localities = {fact.value for fact in page.facts if fact.fact_type == "locality"}
    assert "Córdoba" in localities
    assert "Gran Buenos Aires" in localities
    # "Gran Buenos Aires" no se duplica como "Buenos Aires".
    assert "Buenos Aires" not in localities

    # Todos los hechos guardan el extracto que los respalda.
    assert all(fact.excerpt for fact in page.facts)

    # Solo enlaces internos del mismo host y relevantes.
    assert f"{HOME}contacto" in page.internal_links
    assert all("otro-sitio.com" not in link for link in page.internal_links)
    assert page.is_contact_page is False


def test_parse_page_detects_contact_page_and_no_invented_facts() -> None:
    page = parse_page(f"{HOME}contacto", CONTACT_HTML)

    assert page.is_contact_page is True
    assert "info@frio-cordoba.com.ar" in page.emails

    empty = parse_page(HOME, "<html><body><p>Hola</p></body></html>")
    assert empty.facts == []
    assert empty.emails == []
    assert empty.phones == []
    assert empty.whatsapp_numbers == []


def test_parse_page_normalizes_only_published_whatsapp_numbers() -> None:
    body = """
    <html><body>
      <a href="https://wa.me/+5491133546107?text=Hola">WhatsApp</a>
      <a href="https://api.whatsapp.com/send?phone=5491133546107">Escribinos</a>
      <a href="https://api.whatsapp.com/send/?phone=%2B5491166022832">Ventas</a>
      <a href="https://wa.me/message/ABCDEF123456789">Enlace corto sin número</a>
      <a href="whatsapp://send?phone=5491122334455">App</a>
      <a href="https://wa.me/">Sin destino</a>
    </body></html>
    """
    page = parse_page(HOME, body)

    # Se deduplica por teléfono y se descartan los enlaces sin número.
    assert page.whatsapp_numbers == [
        "+5491133546107",
        "+5491166022832",
        "+5491122334455",
    ]


def test_negated_service_is_not_saved_as_a_fact() -> None:
    body = """
    <html><body>
      <p>This is not a service; avoid relying on it for testing.</p>
      <p>No realizamos instalaciones fuera de la provincia.</p>
      <p>Reparación de heladeras a domicilio.</p>
    </body></html>
    """
    page = parse_page(HOME, body)

    services = [fact.value for fact in page.facts if fact.fact_type == "service"]
    assert services == ["Reparación de heladeras a domicilio."]


# ---------------------------------------------------------------------------
# Fetching y SSRF
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "url",
    [
        "http://localhost/admin",
        "http://127.0.0.1/",
        "http://10.0.0.5/",
        "http://192.168.1.10/",
        "http://169.254.169.254/latest/meta-data/",
        "http://[::1]/",
        "ftp://frio-cordoba.com.ar/",
    ],
)
def test_validate_url_blocks_private_and_metadata_targets(url: str) -> None:
    fetcher = WebsiteFetcher(
        client=httpx.Client(transport=httpx.MockTransport(lambda _r: _html("<html/>"))),
        resolver=lambda _host: [PUBLIC_IP],
    )
    with pytest.raises(EnrichmentUnsafeUrl):
        fetcher.validate_url(url)


def test_validate_url_blocks_hostname_resolving_to_private_ip() -> None:
    fetcher = WebsiteFetcher(
        client=httpx.Client(transport=httpx.MockTransport(lambda _r: _html("<html/>"))),
        resolver=lambda _host: ["10.0.0.5"],
    )
    with pytest.raises(EnrichmentUnsafeUrl):
        fetcher.validate_url("https://interno.frio-cordoba.com.ar/")


def test_redirect_to_private_host_is_blocked(db: Session) -> None:
    site = FakeSite({HOME: httpx.Response(302, headers={"location": "http://127.0.0.1/secreto"})})
    company = _make_company(db)

    result = enrich_company(db, company, fetcher=site.fetcher())

    assert result.status == "unsafe"
    assert "privada" in (result.error or "")
    assert company.last_enriched_at is None
    assert _count(db, CompanySource) == 0


def test_non_html_response_and_http_errors_are_fetch_errors(db: Session) -> None:
    pdf_site = FakeSite(
        {
            HOME: httpx.Response(
                200,
                content=b"%PDF-1.4",
                headers={"content-type": "application/pdf"},
            )
        }
    )
    company = _make_company(db, name="Empresa PDF")
    result = enrich_company(db, company, fetcher=pdf_site.fetcher())
    assert result.status == "fetch_error"
    assert "HTML" in (result.error or "")

    error_site = FakeSite({HOME: _html("<html><body>Error</body></html>", status_code=500)})
    result = enrich_company(db, company, fetcher=error_site.fetcher())
    assert result.status == "fetch_error"
    assert "HTTP 500" in (result.error or "")


def test_timeout_is_fetch_error(db: Session) -> None:
    def _timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timeout", request=request)

    fetcher = WebsiteFetcher(
        client=httpx.Client(transport=httpx.MockTransport(_timeout)),
        resolver=lambda _host: [PUBLIC_IP],
        page_delay_seconds=0.0,
    )
    company = _make_company(db)

    result = enrich_company(db, company, fetcher=fetcher)

    assert result.status == "fetch_error"
    assert "tiempo máximo" in (result.error or "")


def test_fetcher_reads_at_most_five_pages(db: Session) -> None:
    links = "\n".join(f'<a href="/servicio-{index}">Servicios {index}</a>' for index in range(10))
    site = FakeSite(
        {
            HOME: _html(f"<html><body><h1>Inicio</h1>{links}</body></html>"),
            **{
                f"{HOME}servicio-{index}": _html(f"<html><body>Servicio {index}</body></html>")
                for index in range(10)
            },
        }
    )
    company = _make_company(db)

    result = enrich_company(db, company, fetcher=site.fetcher())

    assert result.status == "ok"
    assert len(site.requested) == 5
    assert len(result.evidence) == 5


def test_fetcher_keeps_only_one_megabyte(db: Session) -> None:
    body = "<html><body><p>" + ("a" * 5000) + "</p></body></html>"
    site = FakeSite({HOME: _html(body)})

    fetcher = site.fetcher(max_bytes=1024)
    page = fetcher.fetch(HOME)

    assert page.truncated is True
    assert len(page.html.encode("utf-8")) <= 1024


# ---------------------------------------------------------------------------
# Enriquecimiento completo
# ---------------------------------------------------------------------------


def test_enrich_persists_sources_contacts_and_facts(db: Session) -> None:
    site = FakeSite({HOME: _html(HOME_HTML), f"{HOME}contacto": _html(CONTACT_HTML)})
    company = _make_company(db)

    result = enrich_company(db, company, fetcher=site.fetcher())

    assert result.status == "ok"
    assert result.sources_added == 2
    assert result.contacts_added == 4  # 2 emails + teléfono + WhatsApp publicado
    assert result.facts_added > 0
    assert {item["source_url"] for item in result.evidence} == {
        HOME,
        f"{HOME}contacto",
    }
    assert company.last_enriched_at is not None
    assert company.description.startswith("Instalación y reparación")

    contacts = list(db.scalars(select(Contact)))
    by_value = {(contact.contact_type, contact.normalized_value): contact for contact in contacts}
    assert len(contacts) == 4
    assert ("email", "ventas@frio-cordoba.com.ar") in by_value
    assert ("email", "info@frio-cordoba.com.ar") in by_value
    assert ("phone", "+543514556677") in by_value
    assert ("whatsapp", "+5493515551234") in by_value
    assert by_value[("whatsapp", "+5493515551234")].label == "Enlace de WhatsApp publicado"
    assert all(contact.verification_status == "published" for contact in contacts)
    assert all(contact.verified_at is None for contact in contacts)
    assert all(contact.source_id is not None for contact in contacts)

    facts = list(db.scalars(select(CompanyFact)))
    assert {fact.fact_type for fact in facts} >= {"service", "coverage", "locality", "description"}
    assert any(fact.fact_type == "contact_page" for fact in facts)
    assert all(fact.evidence_excerpt for fact in facts if fact.fact_type != "description")
    assert all(fact.collected_at is not None for fact in facts)

    contact_source = next(
        source
        for source in db.scalars(select(CompanySource))
        if source.source_url == f"{HOME}contacto"
    )
    assert contact_source.evidence_excerpt is not None
    assert "<html" not in contact_source.evidence_excerpt
    assert "Contacto" in contact_source.evidence_excerpt
    assert contact_source.confidence is not None


def test_whatsapp_requires_a_published_link(db: Session) -> None:
    body = """
    <html><body>
      <h2>Contacto</h2>
      <a href="tel:+543514556677">Llamanos</a>
      <p>Escribinos a ventas@frio-cordoba.com.ar</p>
    </body></html>
    """
    site = FakeSite({HOME: _html(body)})
    company = _make_company(db)

    result = enrich_company(db, company, fetcher=site.fetcher())

    assert result.status == "ok"
    types = {contact.contact_type for contact in db.scalars(select(Contact))}
    assert types == {"phone", "email"}


def test_enrich_without_website_does_not_fetch(db: Session) -> None:
    company = _make_company(db, name="Empresa sin sitio", website=None)

    result = enrich_company(db, company)

    assert result.status == "no_website"
    assert result.error is None
    assert company.last_enriched_at is None


def test_enrich_stores_whatsapp_as_phone_and_excludes_company_name(db: Session) -> None:
    """Caso real de profinstalaciones.com.ar: `wa.me/+549...` y h1 = nombre."""
    body = """
    <html>
      <head><title>Prof Instalaciones | Ingeniería eléctrica</title></head>
      <body>
        <h1>Prof Instalaciones</h1>
        <h2>Soluciones Integrales en Ingeniería Eléctrica y Automatización</h2>
        <h2>Instalaciones Eléctricas, de Controles y Sistemas Especiales</h2>
        <a href="https://wa.me/+5491133546107?text=Hola">WhatsApp</a>
        <a href="https://api.whatsapp.com/send?phone=5491133546107">Escribinos</a>
        <a href="https://wa.me/message/ABCDEF123456789">Enlace corto</a>
      </body>
    </html>
    """
    company = _make_company(db, name="Prof Instalaciones")

    result = enrich_company(db, company, fetcher=FakeSite({HOME: _html(body)}).fetcher())

    assert result.status == "ok"
    whatsapp = list(db.scalars(select(Contact).where(Contact.contact_type == "whatsapp")))
    assert len(whatsapp) == 1
    contact = whatsapp[0]
    assert contact.original_value == "+5491133546107"
    assert contact.normalized_value == "+5491133546107"
    assert contact.label == "Enlace de WhatsApp publicado"
    assert contact.verification_status == "published"
    assert contact.verified_at is None
    source = db.get(CompanySource, contact.source_id)
    assert source is not None
    assert source.source_url == HOME

    facts = list(db.scalars(select(CompanyFact)))
    service_values = {
        fact.normalized_value for fact in facts if fact.fact_type in {"service", "activity"}
    }
    assert "prof instalaciones" not in service_values
    # Una frase con servicio real no se descarta.
    assert any("instalaciones electricas" in value for value in service_values)

    # Reintentar el enriquecimiento no duplica el WhatsApp.
    again = enrich_company(db, company, fetcher=FakeSite({HOME: _html(body)}).fetcher())
    assert again.contacts_added == 0
    assert len(list(db.scalars(select(Contact).where(Contact.contact_type == "whatsapp")))) == 1


def test_legacy_whatsapp_url_contact_is_fixed_without_duplicating(db: Session) -> None:
    company = _make_company(db)
    source = CompanySource(
        company_id=company.id,
        source_type="website",
        source_url=HOME,
        title="Sitio web",
        evidence_excerpt="Contacto",
        collected_at=company.created_at,
    )
    db.add(source)
    db.flush()
    db.add(
        Contact(
            company_id=company.id,
            contact_type="whatsapp",
            original_value="https://wa.me/+5491133546107",
            normalized_value="https://wa.me/+5491133546107",
            label="Enlace de WhatsApp publicado",
            is_primary=True,
            verification_status="published",
            source_id=source.id,
            do_not_contact=False,
        )
    )
    db.commit()

    body = '<html><body><a href="https://wa.me/5491133546107">WhatsApp</a></body></html>'
    result = enrich_company(db, company, fetcher=FakeSite({HOME: _html(body)}).fetcher())

    assert result.status == "ok"
    assert result.contacts_added == 0
    whatsapp = list(db.scalars(select(Contact).where(Contact.contact_type == "whatsapp")))
    assert len(whatsapp) == 1
    assert whatsapp[0].original_value == "+5491133546107"
    assert whatsapp[0].normalized_value == "+5491133546107"
    assert "contacts_whatsapp_normalized" in result.fields_updated


def test_verified_whatsapp_is_never_overwritten(db: Session) -> None:
    company = _make_company(db)
    db.add(
        Contact(
            company_id=company.id,
            contact_type="whatsapp",
            original_value="+5491133546107",
            normalized_value="+5491133546107",
            label="Confirmado por teléfono",
            is_primary=True,
            verification_status="verified",
            source_id=None,
            do_not_contact=False,
        )
    )
    db.commit()

    body = '<html><body><a href="https://wa.me/+5491133546107">WhatsApp</a></body></html>'
    result = enrich_company(db, company, fetcher=FakeSite({HOME: _html(body)}).fetcher())

    assert result.status == "ok"
    whatsapp = list(db.scalars(select(Contact).where(Contact.contact_type == "whatsapp")))
    assert len(whatsapp) == 1
    assert whatsapp[0].verification_status == "verified"
    assert whatsapp[0].label == "Confirmado por teléfono"
    assert whatsapp[0].source_id is None


def test_existing_description_is_not_overwritten(db: Session) -> None:
    site = FakeSite({HOME: _html(HOME_HTML)})
    company = _make_company(db, name="Frío Propio", description="Descripción propia")

    result = enrich_company(db, company, fetcher=site.fetcher())

    assert result.status == "ok"
    assert company.description == "Descripción propia"
    assert "description" not in result.fields_updated
    descriptions = [
        fact for fact in db.scalars(select(CompanyFact)) if fact.fact_type == "description"
    ]
    assert descriptions == []


# ---------------------------------------------------------------------------
# Deduplicación y no degradación
# ---------------------------------------------------------------------------


def test_enrichment_is_idempotent(db: Session) -> None:
    company = _make_company(db)
    enrich_company(db, company, fetcher=FakeSite({HOME: _html(HOME_HTML)}).fetcher())
    facts_first = _count(db, CompanyFact)
    sources_first = _count(db, CompanySource)

    result = enrich_company(db, company, fetcher=FakeSite({HOME: _html(HOME_HTML)}).fetcher())

    assert result.status == "ok"
    assert result.facts_added == 0
    assert result.contacts_added == 0
    assert result.sources_added == 0
    assert _count(db, CompanyFact) == facts_first
    assert _count(db, CompanySource) == sources_first


def test_published_and_verified_contacts_are_not_downgraded(db: Session) -> None:
    company = _make_company(db)
    manual = CompanySource(
        company_id=company.id,
        source_type="manual",
        source_url="manual://alta-manual",
        title="Alta manual",
        collected_at=company.created_at,
    )
    db.add(manual)
    db.flush()

    db.add_all(
        [
            Contact(
                company_id=company.id,
                contact_type="phone",
                original_value="0351 455-6677",
                normalized_value="+543514556677",
                label="Verificado a mano",
                is_primary=True,
                verification_status="verified",
                source_id=manual.id,
                do_not_contact=False,
            ),
            Contact(
                company_id=company.id,
                contact_type="email",
                original_value="info@frio-cordoba.com.ar",
                normalized_value="info@frio-cordoba.com.ar",
                label="Carga manual",
                is_primary=True,
                verification_status="unverified",
                source_id=manual.id,
                do_not_contact=False,
            ),
            Contact(
                company_id=company.id,
                contact_type="email",
                original_value="baja@frio-cordoba.com.ar",
                normalized_value="baja@frio-cordoba.com.ar",
                label="No contactar",
                is_primary=False,
                verification_status="unverified",
                source_id=manual.id,
                do_not_contact=True,
            ),
        ]
    )
    db.commit()

    body = """
    <html><body>
      <a href="tel:+543514556677">Llamanos</a>
      <a href="mailto:info@frio-cordoba.com.ar">Info</a>
      <a href="mailto:baja@frio-cordoba.com.ar">Baja</a>
    </body></html>
    """
    result = enrich_company(db, company, fetcher=FakeSite({HOME: _html(body)}).fetcher())

    assert result.status == "ok"
    contacts = {
        (contact.contact_type, contact.normalized_value): contact
        for contact in db.scalars(select(Contact))
    }
    assert len(contacts) == 3

    verified = contacts[("phone", "+543514556677")]
    assert verified.verification_status == "verified"
    assert verified.source_id == manual.id
    assert verified.label == "Verificado a mano"

    upgraded = contacts[("email", "info@frio-cordoba.com.ar")]
    assert upgraded.verification_status == "published"
    assert upgraded.source_id != manual.id

    suppressed = contacts[("email", "baja@frio-cordoba.com.ar")]
    assert suppressed.verification_status == "unverified"
    assert suppressed.source_id == manual.id
    assert suppressed.do_not_contact is True


def test_facts_keep_the_best_confidence_per_value(db: Session) -> None:
    company = _make_company(db)
    db.add(
        CompanyFact(
            company_id=company.id,
            fact_type="service",
            value="Instalación de aire acondicionado split",
            normalized_value="instalacion de aire acondicionado split",
            source_url="https://catalogo.example/servicios",
            evidence_excerpt="Instalación de aire acondicionado split",
            confidence=0.9,
            collected_at=company.created_at,
        )
    )
    db.commit()

    enrich_company(db, company, fetcher=FakeSite({HOME: _html(HOME_HTML)}).fetcher())

    same_fact = [
        fact
        for fact in db.scalars(select(CompanyFact))
        if fact.normalized_value == "instalacion de aire acondicionado split"
    ]
    assert len(same_fact) == 1
    assert same_fact[0].confidence == 0.9
    assert same_fact[0].source_url == "https://catalogo.example/servicios"


def test_same_fact_from_another_url_is_separate_evidence(db: Session) -> None:
    company = _make_company(db)
    db.add(
        CompanyFact(
            company_id=company.id,
            fact_type="service",
            value="Instalación de aire acondicionado split",
            normalized_value="instalacion de aire acondicionado split",
            source_url="https://catalogo.example/servicios",
            evidence_excerpt="Instalación de aire acondicionado split",
            confidence=0.3,
            collected_at=company.created_at,
        )
    )
    db.commit()

    enrich_company(db, company, fetcher=FakeSite({HOME: _html(HOME_HTML)}).fetcher())

    same_fact = [
        fact
        for fact in db.scalars(select(CompanyFact))
        if fact.normalized_value == "instalacion de aire acondicionado split"
    ]
    assert len(same_fact) == 2
    assert {fact.source_url for fact in same_fact} == {
        "https://catalogo.example/servicios",
        HOME,
    }


# ---------------------------------------------------------------------------
# API
# ---------------------------------------------------------------------------


def _create_company(
    client: TestClient,
    *,
    name: str,
    website: str | None = None,
    description: str | None = None,
) -> dict:
    payload: dict[str, object] = {"name": name, "sector_slugs": ["hvac"]}
    if website:
        payload["website"] = website
    if description is not None:
        payload["description"] = description
    response = client.post("/api/v1/companies", json=payload)
    assert response.status_code == 201, response.text
    return response.json()


def test_enrich_endpoint_returns_result_and_detail_has_facts(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    company = _create_company(auth_client, name="Frío Endpoint", website=HOME)
    site = FakeSite({HOME: _html(HOME_HTML), f"{HOME}contacto": _html(CONTACT_HTML)})
    monkeypatch.setattr("app.api.v1.companies.get_website_fetcher", site.fetcher)

    response = auth_client.post(f"/api/v1/companies/{company['id']}/enrich")

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["status"] == "ok"
    assert body["company_id"] == company["id"]
    assert body["contacts_added"] == 4
    assert body["sources_added"] == 2
    assert body["evidence"][0]["source_url"] == HOME
    assert body["error"] is None

    detail = auth_client.get(f"/api/v1/companies/{company['id']}").json()
    assert detail["last_enriched_at"] is not None
    assert detail["facts"]
    fact = detail["facts"][0]
    assert fact["source_url"]
    assert fact["collected_at"] is not None
    assert "normalized_value" in fact

    contact = next(item for item in detail["contacts"] if item["contact_type"] == "email")
    assert contact["source_url"] == HOME
    assert contact["source_title"]
    assert contact["source_collected_at"] is not None
    assert contact["source_confidence"] is not None
    assert contact["verified_at"] is None
    assert contact["verification_status"] == "published"

    whatsapp = next(item for item in detail["contacts"] if item["contact_type"] == "whatsapp")
    # El contacto guarda el teléfono; la URL queda en la fuente, no en el valor.
    assert whatsapp["value"] == "+5493515551234"
    assert whatsapp["normalized_value"] == "+5493515551234"
    assert whatsapp["label"] == "Enlace de WhatsApp publicado"
    assert whatsapp["verification_status"] == "published"
    assert whatsapp["verified_at"] is None
    assert whatsapp["source_url"] == HOME


def test_enrich_endpoint_errors_are_explicit(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    assert auth_client.post("/api/v1/companies/9999/enrich").status_code == 404

    no_site = _create_company(auth_client, name="Sin Sitio Endpoint")
    response = auth_client.post(f"/api/v1/companies/{no_site['id']}/enrich")
    assert response.status_code == 400
    assert "sitio web" in response.json()["detail"]

    unsafe = _create_company(auth_client, name="Sitio Interno", website="http://127.0.0.1/")
    response = auth_client.post(f"/api/v1/companies/{unsafe['id']}/enrich")
    assert response.status_code == 400
    assert "no se puede visitar" in response.json()["detail"]

    broken = _create_company(auth_client, name="Sitio Roto", website=HOME)

    def _timeout(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("timeout", request=request)

    monkeypatch.setattr(
        "app.api.v1.companies.get_website_fetcher",
        lambda: WebsiteFetcher(
            client=httpx.Client(transport=httpx.MockTransport(_timeout)),
            resolver=lambda _host: [PUBLIC_IP],
            page_delay_seconds=0.0,
        ),
    )
    response = auth_client.post(f"/api/v1/companies/{broken['id']}/enrich")
    assert response.status_code == 502
    assert "No se pudo leer el sitio web" in response.json()["detail"]


def test_enrich_endpoint_requires_admin(client: TestClient) -> None:
    with SessionLocal() as db:
        company = _make_company(db, name="Frío Permisos")
        company_id = company.id
        db.add(
            User(
                email="analista@arvokta.local",
                password_hash=hash_password("Analista12345!"),
                role="analyst",
                is_active=True,
            )
        )
        db.commit()

    login = client.post(
        "/api/v1/auth/login",
        json={"email": "analista@arvokta.local", "password": "Analista12345!"},
    )
    assert login.status_code == 200, login.text

    response = client.post(f"/api/v1/companies/{company_id}/enrich")
    assert response.status_code == 403
    assert client.get("/api/v1/companies/enrich/jobs").status_code == 403


def test_batch_service_rejects_more_than_50_companies(db: Session) -> None:
    with pytest.raises(EnrichmentValidationError, match="hasta 50"):
        enqueue_enrichment_batch(db, company_ids=list(range(1, 52)))

    with pytest.raises(EnrichmentValidationError, match="al menos una empresa"):
        enqueue_enrichment_batch(db, company_ids=[])


def test_batch_service_defaults_to_companies_with_website(db: Session) -> None:
    _make_company(db, name="Con Sitio Lote", website=HOME)
    _make_company(db, name="Sin Sitio Lote", website=None)

    summary = enqueue_enrichment_batch(db, limit=10)

    assert summary["queued"] == 1
    assert summary["candidates"] == 1
    assert summary["jobs"][0]["company_id"] == 1


def test_has_website_filter(auth_client: TestClient) -> None:
    _create_company(auth_client, name="Con Sitio", website=HOME)
    _create_company(auth_client, name="Sin Sitio Filtro")

    with_site = auth_client.get("/api/v1/companies", params={"has_website": "true"}).json()
    assert with_site["total"] == 1
    assert with_site["items"][0]["name"] == "Con Sitio"

    without_site = auth_client.get("/api/v1/companies", params={"has_website": "false"}).json()
    assert without_site["total"] == 1
    assert without_site["items"][0]["name"] == "Sin Sitio Filtro"


def test_batch_enqueue_skips_without_website_and_rejects_oversized_batches(
    auth_client: TestClient,
) -> None:
    first = _create_company(auth_client, name="Lote Uno", website=HOME)
    second = _create_company(auth_client, name="Lote Dos", website="https://frio-dos.com.ar/")
    without_site = _create_company(auth_client, name="Lote Sin Sitio")

    response = auth_client.post(
        "/api/v1/companies/enrich",
        json={"company_ids": [first["id"], second["id"], without_site["id"]]},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["queued"] == 2
    assert body["skipped"] == 1
    assert body["candidates"] == 3
    assert {job["status"] for job in body["jobs"]} == {"pending"}
    assert {job["company_id"] for job in body["jobs"]} == {first["id"], second["id"]}

    too_many = auth_client.post(
        "/api/v1/companies/enrich",
        json={"company_ids": list(range(1, 52))},
    )
    assert too_many.status_code == 422


def test_batch_does_not_duplicate_active_jobs(auth_client: TestClient) -> None:
    company = _create_company(auth_client, name="Lote Duplicado", website=HOME)

    first = auth_client.post("/api/v1/companies/enrich", json={"company_ids": [company["id"]]})
    assert first.json()["queued"] == 1

    second = auth_client.post("/api/v1/companies/enrich", json={"company_ids": [company["id"]]})
    assert second.status_code == 200
    assert second.json()["queued"] == 0
    assert second.json()["skipped"] == 1

    with SessionLocal() as db:
        jobs = list(db.scalars(select(Job).where(Job.job_type == "enrich_company")))
    assert len(jobs) == 1
    assert jobs[0].payload == {"company_id": company["id"]}
    assert jobs[0].max_attempts == 3


def test_batch_by_filters_respects_limit(auth_client: TestClient) -> None:
    for index in range(3):
        _create_company(
            auth_client, name=f"Filtro Sitio {index}", website=f"https://sitio{index}.com.ar/"
        )

    response = auth_client.post(
        "/api/v1/companies/enrich",
        json={"query": "Filtro Sitio", "limit": 2},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["queued"] == 2
    assert body["candidates"] == 2


def test_enrich_jobs_listing_and_detail(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    company = _create_company(auth_client, name="Frío Jobs", website=HOME)
    queued = auth_client.post(
        "/api/v1/companies/enrich", json={"company_ids": [company["id"]]}
    ).json()
    job_id = queued["jobs"][0]["id"]

    listing = auth_client.get("/api/v1/companies/enrich/jobs").json()
    assert [job["id"] for job in listing] == [job_id]
    assert listing[0]["company_name"] == "Frío Jobs"
    assert listing[0]["status"] == "pending"
    assert listing[0]["attempts"] == 0
    assert listing[0]["max_attempts"] == 3
    assert listing[0]["result"] is None

    detail = auth_client.get(f"/api/v1/companies/enrich/jobs/{job_id}").json()
    assert detail["company_id"] == company["id"]

    assert auth_client.get("/api/v1/companies/enrich/jobs/9999").status_code == 404

    monkeypatch.setattr(
        "app.workers.queue.get_website_fetcher",
        lambda: FakeSite({HOME: _html(HOME_HTML)}).fetcher(),
    )
    with SessionLocal() as db:
        job = run_once(db)
    assert job is not None and job.status == "completed"

    done = auth_client.get(f"/api/v1/companies/enrich/jobs/{job_id}").json()
    assert done["status"] == "completed"
    assert done["finished_at"] is not None
    assert done["result"]["status"] == "ok"
    assert done["result"]["contacts_added"] == 3
    assert done["error_message"] is None


# ---------------------------------------------------------------------------
# Worker
# ---------------------------------------------------------------------------


def test_worker_enrich_job_completes_and_stores_result(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    company = _create_company(auth_client, name="Frío Worker", website=HOME)
    auth_client.post("/api/v1/companies/enrich", json={"company_ids": [company["id"]]})

    site = FakeSite({HOME: _html(HOME_HTML)})
    monkeypatch.setattr("app.workers.queue.get_website_fetcher", lambda: site.fetcher())

    with SessionLocal() as db:
        job = run_once(db)

    assert job is not None
    assert job.status == "completed"
    assert job.attempts == 1
    assert job.result is not None
    assert job.result["status"] == "ok"
    assert job.result["sources_added"] == 1

    detail = auth_client.get(f"/api/v1/companies/{company['id']}").json()
    assert detail["facts"]
    assert detail["last_enriched_at"] is not None


def test_worker_retries_when_the_site_cannot_be_read(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    company = _create_company(auth_client, name="Frío Retry", website=HOME)
    auth_client.post("/api/v1/companies/enrich", json={"company_ids": [company["id"]]})

    monkeypatch.setattr("app.workers.queue.get_website_fetcher", broken_fetcher)

    with SessionLocal() as db:
        job = run_once(db)

    assert job is not None
    assert job.status == "pending"  # queda para reintento con backoff
    assert job.attempts == 1
    assert job.max_attempts == 3
    assert "Error de red" in (job.error_message or "")

    detail = auth_client.get(f"/api/v1/companies/{company['id']}").json()
    assert detail["facts"] == []
    assert detail["last_enriched_at"] is None


def test_worker_marks_job_failed_after_max_attempts(
    auth_client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    company = _create_company(auth_client, name="Frío Fallo", website=HOME)
    auth_client.post("/api/v1/companies/enrich", json={"company_ids": [company["id"]]})

    monkeypatch.setattr("app.workers.queue.get_website_fetcher", broken_fetcher)

    with SessionLocal() as db:
        job = run_once(db)
        assert job is not None
        job.attempts = job.max_attempts  # simula los reintentos agotados
        job.status = "pending"
        job.scheduled_at = utcnow()
        db.commit()

        job = run_once(db)

    assert job is not None
    assert job.status == "failed"
    assert job.finished_at is not None
