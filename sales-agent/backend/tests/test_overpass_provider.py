from __future__ import annotations

from urllib.parse import parse_qs

import httpx
import pytest

from app.providers.discovery.base import DiscoveryProviderError
from app.providers.discovery.overpass import OverpassProvider


def _sent_query(request: httpx.Request) -> str:
    return parse_qs(request.content.decode())["data"][0]


def _provider(handler, *, retries: int = 0, backoff: float = 0.0) -> OverpassProvider:
    client = httpx.Client(transport=httpx.MockTransport(handler))
    return OverpassProvider(
        client=client,
        timeout=5,
        max_retries=retries,
        backoff_seconds=backoff,
        request_delay_seconds=0,
    )


def test_overpass_maps_results_and_builds_province_query() -> None:
    queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        body = _sent_query(request)
        queries.append(body)
        return httpx.Response(
            200,
            json={
                "elements": [
                    {
                        "type": "node",
                        "id": 101,
                        "lat": -31.42,
                        "lon": -64.18,
                        "tags": {
                            "name": "Frío Córdoba",
                            "craft": "hvac",
                            "website": "frio-cordoba.com.ar",
                            "phone": "+54 351 555 1234",
                            "email": "contacto@frio-cordoba.com.ar",
                            "contact:whatsapp": "https://wa.me/5493515551234",
                            "addr:street": "Av. Colón",
                            "addr:housenumber": "123",
                            "addr:city": "Córdoba",
                            "description": "Refrigeración comercial",
                        },
                    },
                    {
                        "type": "way",
                        "id": 202,
                        "center": {"lat": -31.4, "lon": -64.2},
                        "tags": {"name": "Clima Sur", "shop": "hvac"},
                    },
                    {
                        "type": "node",
                        "id": 303,
                        "lat": -31.4,
                        "lon": -64.2,
                        "tags": {"craft": "hvac"},
                    },
                ]
            },
        )

    provider = _provider(handler)
    results = provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=10)

    assert len(queries) == 1
    assert 'area["ISO3166-2"="AR-X"]' in queries[0]
    assert 'nwr["craft"="hvac"]' in queries[0]
    assert 'nwr["shop"="hvac"]' in queries[0]

    assert len(results) == 2
    first = results[0]
    assert first.name == "Frío Córdoba"
    assert first.province == "Córdoba"
    assert first.source_url == "https://www.openstreetmap.org/node/101"
    assert first.website == "frio-cordoba.com.ar"
    assert first.phone == "+54 351 555 1234"
    assert first.email == "contacto@frio-cordoba.com.ar"
    assert first.whatsapp == "https://wa.me/5493515551234"
    assert first.address == "Av. Colón 123"
    assert first.locality == "Córdoba"
    assert first.latitude == -31.42
    assert first.sector_slugs == ("hvac",)

    second = results[1]
    assert second.osm_type == "way"
    assert second.address is None
    assert second.latitude == -31.4


def test_overpass_respects_limit() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json={
                "elements": [
                    {
                        "type": "node",
                        "id": index,
                        "tags": {"name": f"Empresa {index}", "craft": "hvac"},
                    }
                    for index in range(10)
                ]
            },
        )

    provider = _provider(handler)
    results = provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=3)
    assert len(results) == 3


def test_overpass_keywords_add_name_query() -> None:
    queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        queries.append(_sent_query(request))
        return httpx.Response(200, json={"elements": []})

    provider = _provider(handler)
    provider.search(
        province_code="AR-X",
        sector_slugs=["hvac"],
        keywords="aire acondicionado",
        limit=5,
    )
    assert len(queries) == 2
    assert 'nwr["name"~"aire acondicionado",i]' in queries[1]


def test_overpass_empty_result_is_empty_list() -> None:
    provider = _provider(lambda _request: httpx.Response(200, json={"elements": []}))
    assert provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=5) == []


def test_overpass_retries_with_backoff_then_succeeds() -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        if calls < 3:
            return httpx.Response(503, text="unavailable")
        return httpx.Response(
            200,
            json={"elements": [{"type": "node", "id": 1, "tags": {"name": "OK", "craft": "hvac"}}]},
        )

    provider = _provider(handler, retries=2)
    results = provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=5)
    assert calls == 3
    assert [company.name for company in results] == ["OK"]


def test_overpass_raises_after_retries() -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(500, text="boom")

    provider = _provider(handler, retries=2)
    with pytest.raises(DiscoveryProviderError):
        provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=5)
    assert calls == 3


def test_overpass_does_not_retry_client_error() -> None:
    calls = 0

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(400, text="bad query")

    provider = _provider(handler, retries=2)
    with pytest.raises(DiscoveryProviderError):
        provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=5)
    assert calls == 1


def test_overpass_raises_on_remark_error() -> None:
    provider = _provider(
        lambda _request: httpx.Response(
            200,
            json={"elements": [], "remark": "runtime error: Query timed out"},
        )
    )
    with pytest.raises(DiscoveryProviderError):
        provider.search(province_code="AR-X", sector_slugs=["hvac"], limit=5)


def test_overpass_queries_once_per_sector() -> None:
    queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        queries.append(_sent_query(request))
        return httpx.Response(200, json={"elements": []})

    provider = _provider(handler)
    provider.search(province_code="AR-X", sector_slugs=["hvac", "it_support"], limit=5)
    assert len(queries) == 2
    assert 'nwr["craft"="hvac"]' in queries[0]
    assert 'nwr["office"="it"]' in queries[1]
    assert 'nwr["craft"="hvac"]' not in queries[1]


def test_overpass_rejects_unknown_province_and_sector() -> None:
    provider = _provider(lambda _request: httpx.Response(200, json={"elements": []}))
    with pytest.raises(ValueError):
        provider.search(province_code="AR-XX", sector_slugs=["hvac"])
    with pytest.raises(ValueError):
        provider.search(province_code="AR-X", sector_slugs=["no-existe"])
