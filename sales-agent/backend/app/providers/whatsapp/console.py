"""Provider de WhatsApp para desarrollo: no sale a la red."""

from __future__ import annotations

from app.core.logging import get_logger
from app.providers.whatsapp.base import SendResult, WhatsAppProvider

logger = get_logger(__name__)


class ConsoleWhatsAppProvider(WhatsAppProvider):
    def send_text(self, *, to: str, body: str) -> SendResult:
        logger.info("WhatsApp simulado a %s (%s caracteres)", to, len(body))
        return SendResult(
            status="simulated",
            provider="console",
            provider_message_id=None,
            payload={"to": to, "text": body, "mode": "console"},
        )
