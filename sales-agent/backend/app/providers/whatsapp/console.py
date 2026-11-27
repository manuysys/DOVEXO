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

    def send_template(
        self,
        *,
        to: str,
        template_name: str,
        language: str,
        parameters: list[str],
    ) -> SendResult:
        logger.info(
            "WhatsApp simulado (plantilla %s/%s) a %s con %s parámetros",
            template_name,
            language,
            to,
            len(parameters),
        )
        return SendResult(
            status="simulated",
            provider="console",
            provider_message_id=None,
            payload={
                "to": to,
                "mode": "console",
                "type": "template",
                "template": {
                    "name": template_name,
                    "language": language,
                    "parameters": list(parameters),
                },
            },
        )
