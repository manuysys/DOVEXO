"""Resolución de la IP del cliente para rate limiting, lockout y auditoría.

`X-Real-IP` y `X-Forwarded-For` los puede enviar cualquier cliente. Solo se
confían cuando la aplicación corre detrás de un proxy que los sobrescribe, es
decir cuando `TRUST_PROXY_HEADERS` está activo. Sin esa configuración se usa la
IP de la conexión (`request.client.host`), que no es falsificable.
"""

from __future__ import annotations

from fastapi import Request

from app.core.config import settings


def resolve_client_ip(request: Request) -> str | None:
    if settings.trust_proxy_headers:
        real_ip = request.headers.get("x-real-ip")
        if real_ip and real_ip.strip():
            return real_ip.strip()
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # Último hop: el agregado por el proxy más cercano, no el primero,
            # que el cliente puede falsificar.
            last_hop = forwarded.split(",")[-1].strip()
            if last_hop:
                return last_hop
    if request.client is not None:
        return request.client.host
    return None
