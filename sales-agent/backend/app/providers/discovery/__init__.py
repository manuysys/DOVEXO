"""Proveedores de descubrimiento disponibles."""

from __future__ import annotations

from collections.abc import Callable

from app.providers.discovery.base import (
    CompanyDiscoveryProvider,
    DiscoveredCompany,
    DiscoveryProviderError,
)
from app.providers.discovery.overpass import OverpassProvider

_FACTORIES: dict[str, Callable[[], CompanyDiscoveryProvider]] = {
    "overpass": OverpassProvider,
}


def get_discovery_provider(name: str = "overpass") -> CompanyDiscoveryProvider:
    factory = _FACTORIES.get(name)
    if factory is None:
        raise ValueError(f"Proveedor de descubrimiento desconocido: {name}")
    return factory()


__all__ = [
    "CompanyDiscoveryProvider",
    "DiscoveredCompany",
    "DiscoveryProviderError",
    "OverpassProvider",
    "get_discovery_provider",
]
