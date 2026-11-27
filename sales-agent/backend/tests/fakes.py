"""Proveedores simulados para pruebas. No acceden a internet."""

from __future__ import annotations

from dataclasses import dataclass, field

from app.providers.discovery.base import CompanyDiscoveryProvider, DiscoveredCompany


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
