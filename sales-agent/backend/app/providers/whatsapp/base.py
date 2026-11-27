"""Contrato de envío de WhatsApp."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


class WhatsAppProviderError(RuntimeError):
    pass


@dataclass(slots=True)
class SendResult:
    status: str
    provider: str
    provider_message_id: str | None = None
    payload: dict[str, Any] = field(default_factory=dict)


class WhatsAppProvider(ABC):
    @abstractmethod
    def send_text(self, *, to: str, body: str) -> SendResult:
        """Envía un texto. Puede ser simulado en desarrollo."""

    @abstractmethod
    def send_template(
        self,
        *,
        to: str,
        template_name: str,
        language: str,
        parameters: list[str],
    ) -> SendResult:
        """Envía una plantilla aprobada.

        Fuera de la ventana de atención de 24 h, Meta solo acepta plantillas
        aprobadas; el texto libre se rechaza. Puede ser simulado en desarrollo.
        """
