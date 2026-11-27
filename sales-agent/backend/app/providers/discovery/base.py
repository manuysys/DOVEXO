"""Contrato de descubrimiento de empresas."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


class DiscoveryProviderError(RuntimeError):
    """El proveedor externo falló o devolvió datos inválidos."""


@dataclass(slots=True)
class DiscoveredCompany:
    """Registro normalizado de una fuente externa.

    Solo contiene datos publicados por la fuente. Los campos que no estén
    presentes quedan en `None`; no se completan por inferencia.
    """

    name: str
    province: str
    source_url: str
    osm_type: str
    osm_id: int
    sector_slugs: tuple[str, ...] = ()
    website: str | None = None
    phone: str | None = None
    email: str | None = None
    whatsapp: str | None = None
    address: str | None = None
    locality: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    tags: dict[str, str] = field(default_factory=dict)


class CompanyDiscoveryProvider(ABC):
    @abstractmethod
    def search(
        self,
        *,
        province_code: str,
        sector_slugs: list[str],
        keywords: str | None = None,
        limit: int = 50,
    ) -> list[DiscoveredCompany]:
        """Busca empresas y devuelve solo resultados reales del proveedor."""
