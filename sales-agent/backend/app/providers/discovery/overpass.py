"""Proveedor de descubrimiento OpenStreetMap / Overpass.

Mapeo conservador de etiquetas OSM por rubro. Se priorizan etiquetas con uso
comprobado en OSM; las dudas se documentan en `backend/README.md`.
"""

from __future__ import annotations

import contextlib
import re
import time
from collections.abc import Iterator
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.constants import PROVINCES
from app.core.logging import get_logger
from app.providers.discovery.base import (
    CompanyDiscoveryProvider,
    DiscoveredCompany,
    DiscoveryProviderError,
)

logger = get_logger(__name__)

# Etiquetas usadas por rubro. Cada tupla es (clave, valor) de OSM.
SECTOR_OSM_TAGS: dict[str, tuple[tuple[str, str], ...]] = {
    "hvac": (("craft", "hvac"), ("shop", "hvac")),
    "it_support": (("office", "it"), ("shop", "computer")),
    "electronic_security": (("shop", "security"),),
    "industrial_maintenance": (("industrial", "machine_shop"),),
    "gates_automation": (("shop", "doors"),),
    "appliance_repair": (("craft", "electronics_repair"),),
    "electrical_installations": (("craft", "electrician"),),
}

PROVINCE_NAME_BY_CODE = {province["code"]: province["name"] for province in PROVINCES}

_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})
_MAX_KEYWORD_CLAUSES = 4


def _safe_regex(value: str) -> str:
    """Deja solo texto seguro para una expresión regular de Overpass."""
    cleaned = re.sub(r"[^\w\sáéíóúÁÉÍÓÚñÑüÜ-]", " ", value, flags=re.UNICODE)
    return re.sub(r"\s+", " ", cleaned).strip()


def _address_from_tags(tags: dict[str, str]) -> str | None:
    if tags.get("addr:full"):
        return tags["addr:full"]

    street = " ".join(
        part for part in (tags.get("addr:street"), tags.get("addr:housenumber")) if part
    ).strip()
    return street or None


def _locality_from_tags(tags: dict[str, str]) -> str | None:
    for key in ("addr:city", "addr:town", "addr:village", "addr:suburb"):
        if tags.get(key):
            return tags[key]
    return None


def infer_sector_slugs(tags: dict[str, str]) -> tuple[str, ...]:
    """Infiere rubros a partir de etiquetas explícitas de OSM."""
    found: list[str] = []
    for slug, pairs in SECTOR_OSM_TAGS.items():
        if any(tags.get(key) == value for key, value in pairs):
            found.append(slug)
    return tuple(found)


class OverpassProvider(CompanyDiscoveryProvider):
    def __init__(
        self,
        *,
        url: str | None = None,
        timeout: float | None = None,
        max_retries: int | None = None,
        user_agent: str | None = None,
        backoff_seconds: float = 1.0,
        request_delay_seconds: float | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        settings = get_settings()
        self.url = url or settings.overpass_url
        self.timeout = timeout if timeout is not None else settings.overpass_timeout_seconds
        self.max_retries = max_retries if max_retries is not None else settings.overpass_max_retries
        self.user_agent = user_agent or settings.overpass_user_agent
        self.backoff_seconds = backoff_seconds
        self.request_delay_seconds = (
            request_delay_seconds
            if request_delay_seconds is not None
            else settings.overpass_request_delay_seconds
        )
        self._client = client

    def search(
        self,
        *,
        province_code: str,
        sector_slugs: list[str],
        keywords: str | None = None,
        limit: int = 50,
    ) -> list[DiscoveredCompany]:
        if province_code not in PROVINCE_NAME_BY_CODE:
            raise ValueError(f"Provincia desconocida: {province_code}")
        if limit < 1:
            raise ValueError("El límite debe ser mayor que cero")

        unknown = [slug for slug in sector_slugs if slug not in SECTOR_OSM_TAGS]
        if unknown:
            raise ValueError(f"Rubros sin mapeo OSM: {', '.join(sorted(unknown))}")
        if not sector_slugs and not (keywords and keywords.strip()):
            raise ValueError("Indicá al menos un rubro o palabras clave")

        collected: dict[tuple[str, int], DiscoveredCompany] = {}
        sent_queries = 0

        for sector_slug in sector_slugs:
            if len(collected) >= limit:
                break
            if sent_queries and self.request_delay_seconds > 0:
                time.sleep(self.request_delay_seconds)
            clauses = [
                f'nwr["{key}"="{value}"](area.searchArea);'
                for key, value in SECTOR_OSM_TAGS[sector_slug]
            ]
            query = self._build_query(province_code, clauses, limit)
            self._collect(query, province_code, collected, [sector_slug], limit)
            sent_queries += 1

        keyword = _safe_regex(keywords or "")
        if keyword and len(collected) < limit:
            if sent_queries and self.request_delay_seconds > 0:
                time.sleep(self.request_delay_seconds)
            escaped = keyword.replace('"', "").replace("\\", "")
            clauses = [
                f'nwr["name"~"{escaped}",i]["{key}"](area.searchArea);'
                for key in ("craft", "shop", "office", "industrial")
            ]
            query = self._build_query(province_code, clauses, limit)
            self._collect(query, province_code, collected, [], limit)

        return list(collected.values())[:limit]

    def _build_query(self, province_code: str, clauses: list[str], limit: int) -> str:
        timeout = max(1, int(self.timeout))
        joined = "\n  ".join(clauses)
        return (
            f"[out:json][timeout:{timeout}];\n"
            f'area["ISO3166-2"="{province_code}"]["boundary"="administrative"]->.searchArea;\n'
            "(\n"
            f"  {joined}\n"
            ");\n"
            f"out center {max(1, min(limit, 500))};\n"
        )

    def _collect(
        self,
        query: str,
        province_code: str,
        collected: dict[tuple[str, int], DiscoveredCompany],
        sector_slugs: list[str],
        limit: int,
    ) -> None:
        payload = self._post(query)
        province_name = PROVINCE_NAME_BY_CODE[province_code]

        for element in payload.get("elements") or []:
            if not isinstance(element, dict):
                continue
            if len(collected) >= limit:
                return
            parsed = self._parse_element(element, province_name, sector_slugs)
            if parsed is None:
                continue

            key = (parsed.osm_type, parsed.osm_id)
            existing = collected.get(key)
            if existing is None:
                collected[key] = parsed
                continue

            merged_sectors = tuple(dict.fromkeys((*existing.sector_slugs, *parsed.sector_slugs)))
            existing.sector_slugs = merged_sectors
            for attribute in (
                "website",
                "phone",
                "email",
                "whatsapp",
                "address",
                "locality",
                "description",
            ):
                if getattr(existing, attribute) is None:
                    setattr(existing, attribute, getattr(parsed, attribute))

    def _parse_element(
        self,
        element: dict[str, Any],
        province_name: str,
        searched_sectors: list[str],
    ) -> DiscoveredCompany | None:
        osm_type = element.get("type")
        osm_id = element.get("id")
        if osm_type not in {"node", "way", "relation"} or not isinstance(osm_id, int):
            return None

        raw_tags = element.get("tags") or {}
        tags = {str(key): str(value) for key, value in raw_tags.items()}
        name = tags.get("name", "").strip()
        if not name:
            # Sin nombre no hay empresa identificable; no se inventa.
            return None

        center = element.get("center") or {}
        latitude = element.get("lat", center.get("lat"))
        longitude = element.get("lon", center.get("lon"))
        sectors = set(searched_sectors) | set(infer_sector_slugs(tags))

        return DiscoveredCompany(
            name=name,
            province=province_name,
            source_url=f"https://www.openstreetmap.org/{osm_type}/{osm_id}",
            osm_type=osm_type,
            osm_id=osm_id,
            sector_slugs=tuple(sorted(sectors)),
            website=tags.get("website") or tags.get("contact:website"),
            phone=tags.get("phone") or tags.get("contact:phone"),
            email=tags.get("email") or tags.get("contact:email"),
            whatsapp=tags.get("contact:whatsapp") or tags.get("whatsapp"),
            address=_address_from_tags(tags),
            locality=_locality_from_tags(tags),
            latitude=float(latitude) if latitude is not None else None,
            longitude=float(longitude) if longitude is not None else None,
            description=tags.get("description"),
            tags=tags,
        )

    def _post(self, query: str) -> dict[str, Any]:
        attempts = self.max_retries + 1
        last_error: str | None = None

        for attempt in range(attempts):
            try:
                with self._http_client() as client:
                    response = client.post(self.url, data={"data": query})
            except httpx.HTTPError as exc:
                last_error = f"error de red: {exc.__class__.__name__}"
            else:
                if response.status_code == 200:
                    try:
                        payload = response.json()
                    except ValueError as exc:
                        raise DiscoveryProviderError(
                            "Overpass devolvió una respuesta que no es JSON."
                        ) from exc
                    if not isinstance(payload, dict):
                        raise DiscoveryProviderError(
                            "Overpass devolvió una respuesta con formato inesperado."
                        )
                    remark = payload.get("remark")
                    if remark:
                        raise DiscoveryProviderError(
                            f"Overpass informó un error: {str(remark)[:200]}"
                        )
                    if not isinstance(payload.get("elements"), list):
                        raise DiscoveryProviderError("Overpass no devolvió una lista de elementos.")
                    return payload

                last_error = f"HTTP {response.status_code}"
                if response.status_code not in _RETRYABLE_STATUS:
                    raise DiscoveryProviderError(f"Overpass rechazó la consulta ({last_error}).")

            if attempt < attempts - 1:
                delay = self.backoff_seconds * (2**attempt)
                logger.warning(
                    "Overpass falló (%s); reintento %s/%s en %.1fs",
                    last_error,
                    attempt + 1,
                    self.max_retries,
                    delay,
                )
                time.sleep(delay)

        raise DiscoveryProviderError(
            f"No se pudo consultar Overpass después de {attempts} intentos ({last_error})."
        )

    @contextlib.contextmanager
    def _http_client(self) -> Iterator[httpx.Client]:
        if self._client is not None:
            yield self._client
            return
        with httpx.Client(
            timeout=self.timeout,
            headers={"User-Agent": self.user_agent},
            follow_redirects=True,
        ) as client:
            yield client
