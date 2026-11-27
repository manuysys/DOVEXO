"""Provider de WhatsApp Cloud API de Meta."""

from __future__ import annotations

from typing import Any

import httpx

from app.providers.whatsapp.base import (
    SendResult,
    WhatsAppProvider,
    WhatsAppProviderError,
)


class MetaWhatsAppProvider(WhatsAppProvider):
    def __init__(
        self,
        *,
        access_token: str,
        phone_number_id: str,
        api_version: str = "v23.0",
        timeout: float = 30.0,
        client: httpx.Client | None = None,
    ) -> None:
        self.access_token = access_token
        self.phone_number_id = phone_number_id
        self.api_version = api_version
        self.timeout = timeout
        self._client = client

    @property
    def url(self) -> str:
        return f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"

    def send_text(self, *, to: str, body: str) -> SendResult:
        payload: dict[str, Any] = {
            "messaging_product": "whatsapp",
            "to": to,
            "type": "text",
            "text": {"body": body},
        }
        headers = {"Authorization": f"Bearer {self.access_token}"}
        try:
            with self._http_client() as client:
                response = client.post(self.url, json=payload, headers=headers)
        except httpx.HTTPError as exc:
            raise WhatsAppProviderError(
                f"No se pudo contactar a Meta ({exc.__class__.__name__})."
            ) from exc

        if response.status_code >= 400:
            detail = response.text[:300]
            raise WhatsAppProviderError(
                f"Meta rechazó el envío (HTTP {response.status_code}): {detail}"
            )

        try:
            data = response.json()
            provider_message_id = data["messages"][0]["id"]
        except (ValueError, KeyError, IndexError, TypeError) as exc:
            raise WhatsAppProviderError("Meta devolvió una respuesta inválida.") from exc

        return SendResult(
            status="sent",
            provider="meta",
            provider_message_id=str(provider_message_id),
            payload=data if isinstance(data, dict) else {},
        )

    def _http_client(self):
        if self._client is not None:
            return _ExistingClient(self._client)
        return httpx.Client(timeout=self.timeout, follow_redirects=True)


class _ExistingClient:
    def __init__(self, client: httpx.Client) -> None:
        self._client = client

    def __enter__(self) -> httpx.Client:
        return self._client

    def __exit__(self, *args: object) -> None:
        return None
