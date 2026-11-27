"""Selección del provider de WhatsApp."""

from __future__ import annotations

from app.core.config import Settings, get_settings
from app.providers.whatsapp.base import (
    SendResult,
    WhatsAppProvider,
    WhatsAppProviderError,
)
from app.providers.whatsapp.console import ConsoleWhatsAppProvider
from app.providers.whatsapp.meta import MetaWhatsAppProvider


def get_whatsapp_provider(settings: Settings | None = None) -> WhatsAppProvider:
    settings = settings or get_settings()
    if settings.whatsapp_configured:
        return MetaWhatsAppProvider(
            access_token=settings.whatsapp_access_token,
            phone_number_id=settings.whatsapp_phone_number_id,
            api_version=settings.whatsapp_api_version,
            timeout=settings.whatsapp_timeout_seconds,
        )
    return ConsoleWhatsAppProvider()


__all__ = [
    "ConsoleWhatsAppProvider",
    "MetaWhatsAppProvider",
    "SendResult",
    "WhatsAppProvider",
    "WhatsAppProviderError",
    "get_whatsapp_provider",
]
