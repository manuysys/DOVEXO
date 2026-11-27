"""Proveedores simulados para pruebas. No acceden a internet."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.providers.discovery.base import CompanyDiscoveryProvider, DiscoveredCompany
from app.providers.whatsapp.base import SendResult, WhatsAppProvider


@dataclass
class FakeDiscoveryProvider(CompanyDiscoveryProvider):
    results: list[DiscoveredCompany]
    calls: list[dict[str, object]] = field(default_factory=list)

    def search(
        self,
        *,
        province_code: str,
        sector_slugs: list[str],
        keywords: str | None = None,
        limit: int = 50,
    ) -> list[DiscoveredCompany]:
        self.calls.append(
            {
                "province_code": province_code,
                "sector_slugs": sector_slugs,
                "keywords": keywords,
                "limit": limit,
            }
        )
        return list(self.results)[:limit]


@dataclass
class FakeWhatsAppProvider(WhatsAppProvider):
    """Provider en memoria que registra textos y plantillas enviados."""

    status: str = "simulated"
    provider: str = "fake"
    text_calls: list[dict[str, Any]] = field(default_factory=list)
    template_calls: list[dict[str, Any]] = field(default_factory=list)

    def send_text(self, *, to: str, body: str) -> SendResult:
        self.text_calls.append({"to": to, "body": body})
        return SendResult(status=self.status, provider=self.provider, payload={"to": to})

    def send_template(
        self,
        *,
        to: str,
        template_name: str,
        language: str,
        parameters: list[str],
    ) -> SendResult:
        self.template_calls.append(
            {
                "to": to,
                "template_name": template_name,
                "language": language,
                "parameters": list(parameters),
            }
        )
        return SendResult(
            status=self.status,
            provider=self.provider,
            payload={"to": to, "template": template_name},
        )


def osm_company(
    *,
    osm_id: int,
    name: str,
    longitude: float = -64.18,
    latitude: float = -31.42,
    **kwargs: object,
) -> DiscoveredCompany:
    return DiscoveredCompany(
        name=name,
        province="Córdoba",
        source_url=f"https://www.openstreetmap.org/node/{osm_id}",
        osm_type="node",
        osm_id=osm_id,
        longitude=longitude,
        latitude=latitude,
        **kwargs,  # type: ignore[arg-type]
    )
