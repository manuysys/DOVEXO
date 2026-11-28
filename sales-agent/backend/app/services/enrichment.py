"""Enriquecimiento web de empresas con evidencia.

El servicio investiga únicamente páginas publicadas por la propia empresa:

- valida la URL y cada redirección (bloquea loopback, redes privadas,
  link-local y metadatos de cloud) para evitar SSRF;
- limita páginas, tamaño y tiempo;
- extrae contactos y datos con un léxico determinístico y guarda el extracto
  que respalda cada hecho.

Nunca se marca un contacto como `verified`: eso solo lo hace una persona. Un
teléfono publicado tampoco se convierte en WhatsApp: el WhatsApp existe solo si
el sitio publica un enlace `wa.me`, `api.whatsapp.com` o `whatsapp://`.
"""

from __future__ import annotations

import contextlib
import hashlib
import ipaddress
import re
import socket
import time
from collections.abc import Callable, Iterator
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import parse_qs, unquote, urljoin, urlparse

import httpx
import phonenumbers
from bs4 import BeautifulSoup
from phonenumbers import NumberParseException, PhoneNumberFormat, PhoneNumberMatcher
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.constants import PROVINCES
from app.core.logging import get_logger
from app.models import Company, CompanyFact, CompanySource, Contact
from app.repositories.companies import list_companies
from app.repositories.enrichment import (
    active_enrichment_company_ids,
    get_contact_by_value,
    get_fact,
    get_source_by_url,
    has_contact_of_type,
    list_contacts_by_type,
    max_fact_confidence,
)
from app.services.contacts import normalize_contact_value, normalize_phone
from app.utils import utcnow
from app.utils.text import fold_text

logger = get_logger(__name__)

FACT_TYPES: tuple[str, ...] = (
    "service",
    "activity",
    "locality",
    "coverage",
    "contact_page",
    "description",
)

MAX_PAGES = 5
MAX_BATCH_COMPANIES = 50

_REDIRECT_STATUS = frozenset({301, 302, 303, 307, 308})
_HTML_CONTENT_TYPES = ("text/html", "application/xhtml+xml")
_BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "ip6-localhost",
        "ip6-loopback",
        "metadata",
        "metadata.google.internal",
        "instance-data",
    }
)
_METADATA_IPS = frozenset(
    {
        "169.254.169.254",
        "169.254.170.2",
        "100.100.100.200",
        "fd00:ec2::254",
    }
)

_EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
_EMAIL_NOISE = (
    "example.",
    "dominio.com",
    "sentry.io",
    "wixpress.com",
    "noreply@",
    "no-reply@",
    "godaddy.com",
)
_ASSET_SUFFIXES = (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".bmp", ".ico")

_WHATSAPP_HOSTS = frozenset(
    {"wa.me", "www.wa.me", "api.whatsapp.com", "www.api.whatsapp.com", "whatsapp.com"}
)

# Un teléfono publicado puede venir con `+`, sin él, con separadores o con el
# prefijo internacional. Se acepta solo el número, nunca un token de enlace.
_WHATSAPP_PHONE_RE = re.compile(r"^\+?\d{8,15}$")

# Sufijos societarios y artículos que no distinguen el nombre de una empresa.
_COMPANY_NAME_NOISE = frozenset(
    {
        "sa",
        "sas",
        "srl",
        "sh",
        "sc",
        "sociedad",
        "anonima",
        "responsabilidad",
        "limitada",
        "cia",
        "co",
        "the",
        "de",
        "del",
        "la",
        "el",
        "los",
        "las",
    }
)

# Léxico determinístico de servicios técnicos. Se compara sobre texto sin
# acentos y en minúsculas; el valor guardado es la frase publicada, no el
# término del léxico.
SERVICE_LEXICON: tuple[str, ...] = (
    "instalacion",
    "reparacion",
    "mantenimiento",
    "service",
    "aire acondicionado",
    "aires acondicionados",
    "refrigeracion",
    "refrigeracion industrial",
    "camara frigorifica",
    "climatizacion",
    "calefaccion",
    "split",
    "electricidad",
    "electricista",
    "tablero electrico",
    "tableros electricos",
    "puesta a tierra",
    "camaras de seguridad",
    "camara de seguridad",
    "cctv",
    "videovigilancia",
    "alarmas",
    "alarma",
    "cercos electricos",
    "cerco electrico",
    "control de acceso",
    "portones automaticos",
    "porton automatico",
    "automatizacion de portones",
    "redes",
    "servidores",
    "informatica",
    "computadoras",
    "soporte tecnico",
    "electrodomesticos",
    "heladeras",
    "lavarropas",
    "lavavajillas",
    "servicio tecnico",
    "reparaciones",
)

ACTIVITY_MARKERS: tuple[str, ...] = (
    "nos dedicamos",
    "nos especializamos",
    "somos una empresa",
    "empresa dedicada",
    "ofrecemos",
    "brindamos",
    "prestamos servicios",
)

COVERAGE_MARKERS: tuple[str, ...] = (
    "cobertura",
    "atendemos",
    "trabajamos en",
    "cubrimos",
    "zonas de",
    "zona de",
    "nos trasladamos",
    "servicio a domicilio",
    "servicios a domicilio",
    "toda la provincia",
    "todo el pais",
)

# Provincias de `PROVINCES` más alias de uso comercial en Argentina.
_LOCATION_ALIASES: dict[str, str] = {}
for _province in PROVINCES:
    _LOCATION_ALIASES[fold_text(_province["name"])] = _province["name"]
_LOCATION_ALIASES.update(
    {
        "caba": "Ciudad Autónoma de Buenos Aires",
        "capital federal": "Ciudad Autónoma de Buenos Aires",
        "capital": "Ciudad Autónoma de Buenos Aires",
        "gba": "Gran Buenos Aires",
        "gran buenos aires": "Gran Buenos Aires",
        "amba": "AMBA",
        "conurbano": "Gran Buenos Aires",
    }
)

CONTACT_LINK_KEYWORDS = ("contacto", "contact", "comunicate", "escribinos", "consulta")
SERVICE_LINK_KEYWORDS = ("servicio", "especialidad", "soluciones", "trabajos")
COVERAGE_LINK_KEYWORDS = ("cobertura", "zonas", "donde trabajamos", "areas")
ABOUT_LINK_KEYWORDS = ("nosotros", "empresa", "quienes somos", "about", "institucional")

_MAX_SERVICE_FACTS = 8
_MAX_ACTIVITY_FACTS = 3
_MAX_LOCALITY_FACTS = 5
_MAX_COVERAGE_FACTS = 5
_MAX_EXCERPT = 500


class EnrichmentError(Exception):
    """Error base del enriquecimiento."""


class EnrichmentUnsafeUrl(EnrichmentError):
    """La URL apunta a un destino que no se puede visitar (SSRF)."""


class EnrichmentFetchError(EnrichmentError):
    """No se pudo obtener la página (red, timeout, HTTP o contenido no HTML)."""


class EnrichmentValidationError(ValueError):
    """El pedido de enriquecimiento no es válido."""


# ---------------------------------------------------------------------------
# Fetching con guardas de red
# ---------------------------------------------------------------------------


def _is_blocked_ip(value: str) -> bool:
    try:
        address = ipaddress.ip_address(value)
    except ValueError:
        return True
    if value in _METADATA_IPS:
        return True
    return not address.is_global


def _resolve_host(host: str) -> list[str]:
    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except OSError as exc:
        raise EnrichmentFetchError(f"No se pudo resolver el host {host}.") from exc
    return sorted({info[4][0] for info in infos})


@dataclass(frozen=True)
class FetchedPage:
    url: str
    status_code: int
    html: str
    truncated: bool = False


@dataclass(frozen=True)
class _RawResponse:
    status_code: int
    headers: dict[str, str]
    body: bytes
    truncated: bool
    encoding: str


class WebsiteFetcher:
    """Cliente HTTP acotado para leer páginas públicas.

    El cliente y el resolver son inyectables para que las pruebas usen
    `httpx.MockTransport` y una resolución de DNS simulada, sin internet.

    La validación de red se hace antes de cada pedido y de cada redirección.
    No protege contra DNS rebinding entre la validación y la conexión: el
    destino final lo resuelve httpx. Es un riesgo aceptado para una herramienta
    interna que solo recibe URLs cargadas por administradores.
    """

    def __init__(
        self,
        *,
        client: httpx.Client | None = None,
        resolver: Callable[[str], list[str]] | None = None,
        timeout: float | None = None,
        max_bytes: int | None = None,
        max_redirects: int | None = None,
        max_pages: int = MAX_PAGES,
        page_delay_seconds: float | None = None,
        user_agent: str | None = None,
    ) -> None:
        settings = get_settings()
        self._client = client
        self._resolver = resolver or _resolve_host
        self.timeout = timeout if timeout is not None else settings.enrichment_timeout_seconds
        self.max_bytes = max_bytes if max_bytes is not None else settings.enrichment_max_page_bytes
        self.max_redirects = (
            max_redirects if max_redirects is not None else settings.enrichment_max_redirects
        )
        self.max_pages = max(1, min(max_pages, MAX_PAGES))
        self.page_delay_seconds = (
            page_delay_seconds
            if page_delay_seconds is not None
            else settings.enrichment_page_delay_seconds
        )
        self.user_agent = user_agent or settings.enrichment_user_agent
        self.pages_fetched = 0

    # -- API pública -----------------------------------------------------

    def can_fetch_more(self) -> bool:
        return self.pages_fetched < self.max_pages

    def validate_url(self, url: str) -> str:
        cleaned = (url or "").strip()
        if not cleaned:
            raise EnrichmentUnsafeUrl("La URL está vacía.")
        parsed = urlparse(cleaned)
        if parsed.scheme not in {"http", "https"}:
            raise EnrichmentUnsafeUrl("Solo se permiten URLs http o https.")
        host = (parsed.hostname or "").strip().lower().rstrip(".")
        if not host:
            raise EnrichmentUnsafeUrl("La URL no tiene un host válido.")
        if host in _BLOCKED_HOSTNAMES or host.endswith(".localhost"):
            raise EnrichmentUnsafeUrl("La URL apunta a localhost.")
        for address in self._addresses(host):
            if _is_blocked_ip(address):
                raise EnrichmentUnsafeUrl(
                    "La URL apunta a una red privada, reservada o a metadatos de cloud."
                )
        return cleaned

    def fetch(self, url: str) -> FetchedPage:
        if not self.can_fetch_more():
            raise EnrichmentFetchError("Se alcanzó el máximo de páginas por empresa.")

        target = self.validate_url(url)
        hops = 0
        while True:
            raw = self._request(target)
            if raw.status_code in _REDIRECT_STATUS:
                location = raw.headers.get("location")
                if not location:
                    raise EnrichmentFetchError("La redirección no informa destino.")
                hops += 1
                if hops > self.max_redirects:
                    raise EnrichmentFetchError("La página redirige demasiadas veces.")
                target = self.validate_url(urljoin(target, location))
                continue
            if raw.status_code >= 400:
                raise EnrichmentFetchError(f"El sitio respondió HTTP {raw.status_code}.")
            if raw.status_code != 200:
                raise EnrichmentFetchError(
                    f"El sitio respondió un estado inesperado ({raw.status_code})."
                )
            self.pages_fetched += 1
            return FetchedPage(
                url=target,
                status_code=raw.status_code,
                html=_decode_body(raw.body, raw.encoding),
                truncated=raw.truncated,
            )

    # -- Internos --------------------------------------------------------

    def _addresses(self, host: str) -> list[str]:
        try:
            ipaddress.ip_address(host)
        except ValueError:
            pass
        else:
            return [host]
        return self._resolver(host)

    def _request(self, url: str) -> _RawResponse:
        try:
            with (
                self._http_client() as client,
                client.stream(
                    "GET",
                    url,
                    follow_redirects=False,
                    headers={"User-Agent": self.user_agent, "Accept": "text/html,*/*;q=0.5"},
                ) as response,
            ):
                headers = {key.lower(): value for key, value in response.headers.items()}
                content_type = headers.get("content-type", "").split(";")[0].strip().lower()
                if response.status_code == 200 and content_type not in _HTML_CONTENT_TYPES:
                    raise EnrichmentFetchError(
                        f"El sitio no devolvió HTML ({content_type or 'sin content-type'})."
                    )
                body, truncated = _read_limited(response, self.max_bytes)
                encoding = response.encoding or "utf-8"
                return _RawResponse(
                    status_code=response.status_code,
                    headers=headers,
                    body=body,
                    truncated=truncated,
                    encoding=encoding,
                )
        except httpx.TimeoutException as exc:
            raise EnrichmentFetchError("El sitio no respondió dentro del tiempo máximo.") from exc
        except httpx.HTTPError as exc:
            raise EnrichmentFetchError(
                f"Error de red al leer el sitio ({exc.__class__.__name__})."
            ) from exc

    @contextlib.contextmanager
    def _http_client(self) -> Iterator[httpx.Client]:
        if self._client is not None:
            yield self._client
            return
        with httpx.Client(timeout=self.timeout, follow_redirects=False) as client:
            yield client


def _decode_body(body: bytes, encoding: str) -> str:
    for candidate in (encoding, "utf-8"):
        try:
            return body.decode(candidate, errors="ignore")
        except LookupError:
            continue
    return body.decode("utf-8", errors="ignore")


def _read_limited(response: httpx.Response, max_bytes: int) -> tuple[bytes, bool]:
    chunks: list[bytes] = []
    total = 0
    for chunk in response.iter_bytes():
        remaining = max_bytes - total
        if remaining <= 0:
            return b"".join(chunks), True
        if len(chunk) > remaining:
            chunks.append(chunk[:remaining])
            return b"".join(chunks), True
        chunks.append(chunk)
        total += len(chunk)
    return b"".join(chunks), False


def get_website_fetcher() -> WebsiteFetcher:
    """Fetcher por defecto; las pruebas lo reemplazan por uno simulado."""
    return WebsiteFetcher()


# ---------------------------------------------------------------------------
# Parseo
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ExtractedFact:
    fact_type: str
    value: str
    normalized_value: str
    excerpt: str | None = None
    confidence: float | None = None


@dataclass
class ParsedPage:
    url: str
    title: str | None = None
    meta_description: str | None = None
    text_excerpt: str | None = None
    emails: list[str] = field(default_factory=list)
    phones: list[str] = field(default_factory=list)
    whatsapp_numbers: list[str] = field(default_factory=list)
    facts: list[ExtractedFact] = field(default_factory=list)
    internal_links: list[str] = field(default_factory=list)
    is_contact_page: bool = False


def _clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def _clean_excerpt(value: str) -> str:
    return _clean_text(value)[:_MAX_EXCERPT]


def _normalized(value: str) -> str:
    return fold_text(value)[:500] or value.strip().lower()[:500]


def _is_valid_email(value: str) -> bool:
    lowered = value.lower()
    if len(lowered) > 120 or any(lowered.endswith(suffix) for suffix in _ASSET_SUFFIXES):
        return False
    return not any(noise in lowered for noise in _EMAIL_NOISE)


def _extract_emails(soup: BeautifulSoup, text: str) -> list[str]:
    found: list[str] = []
    for anchor in soup.select("a[href]"):
        href = str(anchor.get("href") or "")
        if not href.lower().startswith("mailto:"):
            continue
        address = href[7:].split("?")[0].strip()
        if _is_valid_email(address):
            found.append(address)
    for match in _EMAIL_RE.finditer(text):
        if _is_valid_email(match.group(0)):
            found.append(match.group(0))
    unique: list[str] = []
    seen: set[str] = set()
    for address in found:
        key = address.lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append(address)
    return unique[:10]


def _extract_phones(soup: BeautifulSoup, text: str) -> list[str]:
    candidates: list[str] = []
    for anchor in soup.select("a[href]"):
        href = str(anchor.get("href") or "")
        if href.lower().startswith("tel:"):
            candidates.append(href[4:].strip())
    for match in PhoneNumberMatcher(text, "AR"):
        try:
            if phonenumbers.is_possible_number(match.number):
                candidates.append(phonenumbers.format_number(match.number, PhoneNumberFormat.E164))
        except NumberParseException:
            continue

    unique: list[str] = []
    seen: set[str] = set()
    for candidate in candidates:
        if not candidate:
            continue
        try:
            normalized = normalize_phone(candidate)
        except ValueError:
            continue
        if len(re.sub(r"\D", "", normalized)) < 8 or normalized in seen:
            continue
        seen.add(normalized)
        unique.append(normalized)
    return unique[:10]


def _extract_whatsapp_numbers(soup: BeautifulSoup) -> list[str]:
    """Números publicados en enlaces de WhatsApp, normalizados.

    Solo se aceptan enlaces que incluyan un teléfono explícito (`wa.me/<número>`,
    `api.whatsapp.com/send?phone=...`, `whatsapp://send?phone=...`). Un enlace
    corto sin número (`wa.me/message/...`) no genera contacto: no se inventa.
    """
    found: list[str] = []
    for anchor in soup.select("a[href]"):
        number = whatsapp_number_from_link(str(anchor.get("href") or ""))
        if number is not None and number not in found:
            found.append(number)
    return found[:5]


def whatsapp_number_from_link(href: str) -> str | None:
    """Devuelve el teléfono E.164 de un enlace de WhatsApp publicado.

    Devuelve `None` si el enlace no apunta a WhatsApp o no trae un número
    parseable; nunca deduce el número escaneando dígitos de la URL.
    """
    cleaned = href.strip()
    if not cleaned:
        return None
    parsed = urlparse(cleaned if "://" in cleaned else f"https://{cleaned}")
    scheme = parsed.scheme.lower()
    host = (parsed.hostname or "").lower()
    is_whatsapp = scheme == "whatsapp" or (scheme in {"http", "https"} and host in _WHATSAPP_HOSTS)
    if not is_whatsapp:
        return None

    query = parse_qs(parsed.query)
    candidate = (query.get("phone") or [None])[0]
    if not candidate:
        segments = [segment for segment in parsed.path.split("/") if segment]
        first = unquote(segments[0]) if segments else ""
        if not _WHATSAPP_PHONE_RE.match(first):
            return None
        candidate = first
    candidate = unquote(candidate).strip().replace(" ", "")
    if not _WHATSAPP_PHONE_RE.match(candidate):
        return None
    try:
        return normalize_phone(candidate)
    except ValueError:
        return None


def _text_elements(soup: BeautifulSoup) -> list[tuple[str, str]]:
    """Devuelve (etiqueta, texto) de los elementos donde buscar frases."""
    found: list[tuple[str, str]] = []
    for tag in soup.find_all(["h1", "h2", "h3", "h4", "li", "p"]):
        text = _clean_text(tag.get_text(" ", strip=True))
        if not text or len(text) > 300:
            continue
        found.append((tag.name, text))
    return found


def _service_confidence(tag: str) -> float:
    if tag in {"h1", "h2", "h3", "h4"}:
        return 0.6
    if tag == "li":
        return 0.5
    return 0.45


def _has_service_keyword(folded: str) -> bool:
    return any(keyword in folded for keyword in SERVICE_LEXICON)


def _name_tokens(value: str) -> tuple[str, ...]:
    return tuple(token for token in fold_text(value).split() if token not in _COMPANY_NAME_NOISE)


def is_company_name_only(value: str, company_names: list[str]) -> bool:
    """Indica si el texto es solo el nombre de la empresa (o una variante trivial).

    "Prof Instalaciones" como `h1` no es un servicio aunque contenga
    "instalaciones". Una frase que además describe un servicio real
    ("Prof Instalaciones — instalación de aires") no coincide y se conserva.
    """
    tokens = _name_tokens(value)
    if not tokens:
        return False
    for name in company_names:
        if not name or not name.strip():
            continue
        name_tokens = _name_tokens(name)
        if name_tokens and tokens == name_tokens:
            return True
    return False


_NEGATION_RE = re.compile(r"\b(no|not|sin|ningun|ninguna|nunca|tampoco)\b")


def _service_keyword_is_negated(folded: str) -> bool:
    """Evita guardar como servicio una frase que lo niega.

    Se mira el primer término del léxico que aparece y los 30 caracteres
    previos: "no realizamos instalaciones" no es un hecho de servicio.
    """
    for keyword in SERVICE_LEXICON:
        index = folded.find(keyword)
        if index < 0:
            continue
        window = folded[max(0, index - 30) : index]
        return bool(_NEGATION_RE.search(window))
    return False


def _locations_in(folded: str) -> list[str]:
    """Provincias y alias de cobertura mencionados, sin solapamientos.

    Se buscan primero los alias más largos para que "Gran Buenos Aires" no
    genere además un dato de "Buenos Aires".
    """
    matched: list[tuple[int, int, str]] = []
    for alias, canonical in sorted(_LOCATION_ALIASES.items(), key=lambda item: -len(item[0])):
        start = 0
        while True:
            index = folded.find(alias, start)
            if index < 0:
                break
            end = index + len(alias)
            before = folded[index - 1] if index > 0 else " "
            after = folded[end] if end < len(folded) else " "
            within_word = before.isalnum() or after.isalnum()
            overlaps = any(
                index < used_end and used_start < end for used_start, used_end, _ in matched
            )
            if not within_word and not overlaps:
                matched.append((index, end, canonical))
            start = index + 1

    ordered: list[str] = []
    for _index, _end, canonical in sorted(matched):
        if canonical not in ordered:
            ordered.append(canonical)
    return ordered


def _extract_facts(soup: BeautifulSoup) -> list[ExtractedFact]:
    facts: list[ExtractedFact] = []
    counters = {
        "service": 0,
        "activity": 0,
        "locality": 0,
        "coverage": 0,
    }
    limits = {
        "service": _MAX_SERVICE_FACTS,
        "activity": _MAX_ACTIVITY_FACTS,
        "locality": _MAX_LOCALITY_FACTS,
        "coverage": _MAX_COVERAGE_FACTS,
    }
    seen: set[tuple[str, str]] = set()

    def add(fact_type: str, value: str, excerpt: str, confidence: float) -> None:
        cleaned = _clean_text(value)
        if not cleaned or len(cleaned) < 3:
            return
        if counters[fact_type] >= limits[fact_type]:
            return
        normalized = _normalized(cleaned)
        key = (fact_type, normalized)
        if key in seen:
            return
        seen.add(key)
        counters[fact_type] += 1
        facts.append(
            ExtractedFact(
                fact_type=fact_type,
                value=cleaned[:500],
                normalized_value=normalized,
                excerpt=_clean_excerpt(excerpt) or None,
                confidence=confidence,
            )
        )

    for tag, text in _text_elements(soup):
        folded = fold_text(text)
        if (
            len(text) >= 4
            and _has_service_keyword(folded)
            and not _service_keyword_is_negated(folded)
        ):
            add("service", text, text, _service_confidence(tag))
        if any(marker in folded for marker in ACTIVITY_MARKERS):
            add("activity", text, text, 0.4)
        if any(marker in folded for marker in COVERAGE_MARKERS):
            add("coverage", text, text, 0.55)
        for canonical in _locations_in(folded):
            add("locality", canonical, text, 0.5)

    return facts


def _internal_link_candidates(base_url: str, soup: BeautifulSoup) -> list[str]:
    base_host = (urlparse(base_url).hostname or "").lower()
    base_host = base_host[4:] if base_host.startswith("www.") else base_host
    scored: list[tuple[int, int, str]] = []
    for order, anchor in enumerate(soup.select("a[href]")):
        href = str(anchor.get("href") or "").strip()
        if not href or href.startswith(("#", "mailto:", "tel:", "javascript:", "whatsapp:")):
            continue
        absolute = urljoin(base_url, href)
        parsed = urlparse(absolute)
        if parsed.scheme not in {"http", "https"}:
            continue
        host = (parsed.hostname or "").lower()
        host = host[4:] if host.startswith("www.") else host
        if not host or host != base_host:
            continue
        if absolute.split("#")[0] == base_url.split("#")[0]:
            continue

        haystack = fold_text(f"{anchor.get_text(' ', strip=True)} {parsed.path}")
        priority = 0
        if any(keyword in haystack for keyword in CONTACT_LINK_KEYWORDS):
            priority = 3
        elif any(keyword in haystack for keyword in SERVICE_LINK_KEYWORDS + COVERAGE_LINK_KEYWORDS):
            priority = 2
        elif any(keyword in haystack for keyword in ABOUT_LINK_KEYWORDS):
            priority = 1
        if priority == 0:
            continue
        clean_url = absolute.split("#")[0]
        scored.append((-priority, order, clean_url))

    links: list[str] = []
    for _priority, _order, link in sorted(scored):
        if link not in links:
            links.append(link)
    return links[: MAX_PAGES - 1]


def parse_page(url: str, html: str) -> ParsedPage:
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "noscript", "template", "svg"]):
        tag.decompose()

    title = _clean_text(soup.title.get_text(" ", strip=True)) if soup.title else ""
    description_tag = soup.find("meta", attrs={"name": "description"}) or soup.find(
        "meta", attrs={"property": "og:description"}
    )
    meta_description = ""
    if description_tag is not None:
        meta_description = _clean_text(str(description_tag.get("content") or ""))

    text = _clean_text(soup.get_text(" ", strip=True))
    headings = " ".join(
        fold_text(tag.get_text(" ", strip=True)) for tag in soup.find_all(["h1", "h2"])
    )
    path = fold_text(urlparse(url).path)
    is_contact_page = (
        any(keyword in path for keyword in ("contacto", "contact"))
        or "contacto" in headings
        or soup.find("form") is not None
    )

    return ParsedPage(
        url=url,
        title=title[:300] or None,
        meta_description=meta_description[:500] or None,
        text_excerpt=text[:300] or None,
        emails=_extract_emails(soup, text),
        phones=_extract_phones(soup, text),
        whatsapp_numbers=_extract_whatsapp_numbers(soup),
        facts=_extract_facts(soup),
        internal_links=_internal_link_candidates(url, soup),
        is_contact_page=is_contact_page,
    )


# ---------------------------------------------------------------------------
# Resultado del enriquecimiento
# ---------------------------------------------------------------------------


@dataclass
class EnrichmentResult:
    company_id: int
    status: str
    fields_updated: list[str] = field(default_factory=list)
    contacts_added: int = 0
    facts_added: int = 0
    sources_added: int = 0
    evidence: list[dict[str, Any]] = field(default_factory=list)
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        data: dict[str, Any] = {
            "company_id": self.company_id,
            "status": self.status,
            "fields_updated": list(dict.fromkeys(self.fields_updated)),
            "contacts_added": self.contacts_added,
            "facts_added": self.facts_added,
            "sources_added": self.sources_added,
            "evidence": list(self.evidence),
        }
        if self.error:
            data["error"] = self.error
        return data


# ---------------------------------------------------------------------------
# Persistencia
# ---------------------------------------------------------------------------


def _upsert_source(
    db: Session,
    company: Company,
    page: FetchedPage,
    parsed: ParsedPage,
    result: EnrichmentResult,
) -> CompanySource:
    existing = get_source_by_url(
        db,
        company_id=company.id,
        source_url=page.url,
        source_type="website",
    )
    excerpt = parsed.meta_description or parsed.text_excerpt
    content_hash = hashlib.sha256(page.html.encode("utf-8", errors="ignore")).hexdigest()
    if existing is not None:
        existing.title = parsed.title or existing.title
        existing.evidence_excerpt = excerpt or existing.evidence_excerpt
        existing.collected_at = utcnow()
        existing.confidence = 0.6
        existing.content_hash = content_hash
        return existing

    source = CompanySource(
        company_id=company.id,
        source_type="website",
        source_url=page.url,
        title=parsed.title,
        evidence_excerpt=excerpt,
        collected_at=utcnow(),
        confidence=0.6,
        content_hash=content_hash,
    )
    db.add(source)
    db.flush()
    result.sources_added += 1
    return source


def _source_type_of(db: Session, source_id: int | None) -> str | None:
    if source_id is None:
        return None
    found = db.get(CompanySource, source_id)
    return found.source_type if found is not None else None


def _upsert_contact(
    db: Session,
    company: Company,
    *,
    contact_type: str,
    value: str,
    label: str,
    source: CompanySource,
    result: EnrichmentResult,
) -> None:
    try:
        normalized = normalize_contact_value(contact_type, value)
    except ValueError as exc:
        logger.debug("Contacto %s inválido en %s: %s", contact_type, company.name, exc)
        return

    existing = get_contact_by_value(
        db,
        company_id=company.id,
        contact_type=contact_type,
        normalized_value=normalized,
    )
    if existing is not None:
        if existing.do_not_contact:
            return
        if existing.verification_status == "verified":
            return
        if existing.verification_status == "published":
            # Ya publicado: se refresca la procedencia solo si no vino de una
            # carga manual o de una importación.
            if existing.source_id == source.id:
                return
            if _source_type_of(db, existing.source_id) in {"manual", "csv_import"}:
                return
            existing.source_id = source.id
            existing.label = existing.label or label
            if "contacts_provenance" not in result.fields_updated:
                result.fields_updated.append("contacts_provenance")
            return
        # `unverified` / `pending` / `invalid` publicado en el sitio: se mejora
        # a `published`, nunca a `verified`.
        existing.verification_status = "published"
        existing.source_id = source.id
        existing.label = existing.label or label
        result.fields_updated.append("contacts_verification")
        return

    legacy = _legacy_whatsapp_contact(db, company.id, contact_type, normalized)
    if legacy is not None:
        # Filas viejas guardaron la URL del enlace en lugar del teléfono. Se
        # corrigen en el lugar para no duplicar el mismo WhatsApp.
        if legacy.do_not_contact or legacy.verification_status == "verified":
            return
        legacy.original_value = normalized
        legacy.normalized_value = normalized
        if _source_type_of(db, legacy.source_id) not in {"manual", "csv_import"}:
            legacy.source_id = source.id
            legacy.label = label
        if legacy.verification_status != "published":
            legacy.verification_status = "published"
        if "contacts_whatsapp_normalized" not in result.fields_updated:
            result.fields_updated.append("contacts_whatsapp_normalized")
        return

    db.add(
        Contact(
            company_id=company.id,
            contact_type=contact_type,
            original_value=(value.strip()[:500] or normalized)[:500],
            normalized_value=normalized,
            label=label,
            is_primary=not has_contact_of_type(
                db, company_id=company.id, contact_type=contact_type
            ),
            verification_status="published",
            source_id=source.id,
            do_not_contact=False,
        )
    )
    db.flush()
    result.contacts_added += 1


def _legacy_whatsapp_contact(
    db: Session,
    company_id: int,
    contact_type: str,
    normalized: str,
) -> Contact | None:
    """Busca un contacto guardado con la URL de un enlace de WhatsApp.

    Corrige el defecto de versiones anteriores: si la URL publicada apunta al
    mismo teléfono, se reutiliza esa fila en lugar de crear otra.
    """
    if contact_type != "whatsapp":
        return None
    for contact in list_contacts_by_type(db, company_id=company_id, contact_type="whatsapp"):
        stored = (contact.normalized_value or "").strip().lower()
        if not stored.startswith(("http://", "https://", "whatsapp:")):
            continue
        if whatsapp_number_from_link(contact.normalized_value) == normalized:
            return contact
    return None


def _upsert_fact(
    db: Session,
    company: Company,
    *,
    fact: ExtractedFact,
    source: CompanySource,
    result: EnrichmentResult,
) -> None:
    existing = get_fact(
        db,
        company_id=company.id,
        fact_type=fact.fact_type,
        normalized_value=fact.normalized_value,
        source_url=source.source_url,
    )
    if existing is not None:
        if fact.confidence is not None and (existing.confidence or 0.0) < fact.confidence:
            existing.confidence = fact.confidence
            existing.value = fact.value
            existing.evidence_excerpt = fact.excerpt or existing.evidence_excerpt
            existing.collected_at = utcnow()
        return

    best = max_fact_confidence(
        db,
        company_id=company.id,
        fact_type=fact.fact_type,
        normalized_value=fact.normalized_value,
    )
    if fact.confidence is not None and fact.confidence < best:
        # Ya hay evidencia más confiable para el mismo hecho: no se degrada.
        return

    db.add(
        CompanyFact(
            company_id=company.id,
            fact_type=fact.fact_type,
            value=fact.value[:500],
            normalized_value=fact.normalized_value[:500],
            source_id=source.id,
            source_url=source.source_url,
            source_title=source.title,
            evidence_excerpt=fact.excerpt,
            confidence=fact.confidence,
            collected_at=utcnow(),
        )
    )
    db.flush()
    result.facts_added += 1


def _evidence(page: FetchedPage, parsed: ParsedPage) -> dict[str, Any]:
    return {
        "source_url": page.url,
        "title": parsed.title,
        "excerpt": parsed.meta_description,
    }


def enrich_company(
    db: Session,
    company: Company,
    fetcher: WebsiteFetcher | None = None,
) -> EnrichmentResult:
    """Investiga el sitio de la empresa y guarda datos con evidencia.

    `last_enriched_at` se actualiza solo cuando la investigación terminó con
    datos leídos: un error de red o una URL bloqueada no cuentan como hechos
    recolectados.
    """
    result = EnrichmentResult(company_id=company.id, status="ok")

    if not company.website:
        result.status = "no_website"
        return result

    active_fetcher = fetcher or get_website_fetcher()
    pages: list[tuple[FetchedPage, ParsedPage]] = []
    company_names = [company.name, company.legal_name or ""]

    try:
        home = active_fetcher.fetch(company.website)
    except EnrichmentUnsafeUrl as exc:
        result.status = "unsafe"
        result.error = str(exc)
        return result
    except EnrichmentFetchError as exc:
        result.status = "fetch_error"
        result.error = str(exc)
        return result

    parsed_home = parse_page(home.url, home.html)
    pages.append((home, parsed_home))

    for link in parsed_home.internal_links[: MAX_PAGES - 1]:
        if not active_fetcher.can_fetch_more():
            break
        if active_fetcher.page_delay_seconds > 0:
            time.sleep(active_fetcher.page_delay_seconds)
        try:
            page = active_fetcher.fetch(link)
        except EnrichmentError as exc:
            logger.info("Página interna omitida (%s): %s", link, exc)
            continue
        pages.append((page, parse_page(page.url, page.html)))

    for page, parsed in pages:
        source = _upsert_source(db, company, page, parsed, result)
        for email in parsed.emails:
            _upsert_contact(
                db,
                company,
                contact_type="email",
                value=email,
                label="Sitio web",
                source=source,
                result=result,
            )
        for phone in parsed.phones:
            _upsert_contact(
                db,
                company,
                contact_type="phone",
                value=phone,
                label="Sitio web",
                source=source,
                result=result,
            )
        for whatsapp in parsed.whatsapp_numbers:
            _upsert_contact(
                db,
                company,
                contact_type="whatsapp",
                value=whatsapp,
                label="Enlace de WhatsApp publicado",
                source=source,
                result=result,
            )
        for extracted in parsed.facts:
            if extracted.fact_type in {"service", "activity"} and is_company_name_only(
                extracted.value, company_names
            ):
                # El nombre de la empresa no es un servicio: no se inventa.
                continue
            _upsert_fact(db, company, fact=extracted, source=source, result=result)
        if parsed.is_contact_page:
            _upsert_fact(
                db,
                company,
                fact=ExtractedFact(
                    fact_type="contact_page",
                    value=page.url[:500],
                    normalized_value=page.url[:500].lower(),
                    excerpt=parsed.title,
                    confidence=0.6,
                ),
                source=source,
                result=result,
            )

    if not (company.description or "").strip() and parsed_home.meta_description:
        primary_source = get_source_by_url(
            db, company_id=company.id, source_url=pages[0][0].url, source_type="website"
        )
        company.description = parsed_home.meta_description[:2000]
        result.fields_updated.append("description")
        if primary_source is not None:
            _upsert_fact(
                db,
                company,
                fact=ExtractedFact(
                    fact_type="description",
                    value=parsed_home.meta_description[:500],
                    normalized_value=_normalized(parsed_home.meta_description),
                    excerpt=parsed_home.meta_description,
                    confidence=0.5,
                ),
                source=primary_source,
                result=result,
            )

    company.last_enriched_at = utcnow()
    result.fields_updated.append("last_enriched_at")
    result.evidence = [_evidence(page, parsed) for page, parsed in pages[:10]]

    db.commit()
    db.refresh(company)
    return result


def process_enrich_company_job(
    db: Session,
    payload: dict[str, Any],
    fetcher: WebsiteFetcher | None = None,
) -> dict[str, Any]:
    """Handler del worker. Los errores de lectura se reintentan con la cola."""
    try:
        company_id = int(payload.get("company_id", 0))
    except (TypeError, ValueError) as exc:
        raise ValueError("El job no tiene un company_id válido.") from exc

    company = db.get(Company, company_id)
    if company is None:
        raise ValueError(f"La empresa {company_id} no existe.")

    result = enrich_company(db, company, fetcher=fetcher)
    if result.status == "fetch_error":
        raise EnrichmentFetchError(result.error or "No se pudo leer el sitio web.")
    return result.to_dict()


# ---------------------------------------------------------------------------
# Encolado de lotes
# ---------------------------------------------------------------------------


def _clamp_limit(limit: int | None) -> int:
    settings = get_settings()
    default = min(max(1, settings.enrichment_batch_limit), MAX_BATCH_COMPANIES)
    if limit is None:
        return default
    return max(1, min(limit, MAX_BATCH_COMPANIES))


def enqueue_enrichment_batch(
    db: Session,
    *,
    company_ids: list[int] | None = None,
    limit: int | None = None,
    search_run_id: int | None = None,
    province: str | None = None,
    sector: str | None = None,
    query: str | None = None,
) -> dict[str, Any]:
    """Encola enriquecimientos sin duplicar trabajos activos."""
    from app.repositories.jobs import enqueue_job

    if company_ids is not None:
        unique_ids = list(dict.fromkeys(company_ids))
        if not unique_ids:
            raise EnrichmentValidationError("Indicá al menos una empresa.")
        if len(unique_ids) > MAX_BATCH_COMPANIES:
            raise EnrichmentValidationError(
                f"El lote admite hasta {MAX_BATCH_COMPANIES} empresas por pedido."
            )
        companies = list(
            db.scalars(select(Company).where(Company.id.in_(unique_ids)).order_by(Company.id))
        )
        missing = len(unique_ids) - len(companies)
        skipped = missing
        candidates = len(companies)
    else:
        size = _clamp_limit(limit)
        companies, _total = list_companies(
            db,
            search_run_id=search_run_id,
            query=query,
            province=province,
            sector=sector,
            has_website=True,
            limit=size,
        )
        skipped = 0
        candidates = len(companies)

    active = active_enrichment_company_ids(db)
    jobs: list[dict[str, Any]] = []
    queued = 0
    for company in companies:
        if not (company.website or "").strip():
            skipped += 1
            continue
        if company.id in active:
            skipped += 1
            continue
        job = enqueue_job(
            db,
            "enrich_company",
            payload={"company_id": company.id},
            max_attempts=3,
        )
        queued += 1
        jobs.append({"id": job.id, "company_id": company.id, "status": job.status})

    return {
        "queued": queued,
        "skipped": skipped,
        "jobs": jobs,
        "candidates": candidates,
    }
