"""Rate limiting en memoria para el login.

Alcanza para una única instancia y desarrollo. Con varias instancias haría
falta un backend compartido. Las claves usan hash del email para no retener
direcciones en texto plano.
"""

from __future__ import annotations

import hashlib
import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request, status

from app.core.config import settings

_WINDOW_SECONDS = 60
_MAX_BUCKETS = 10_000
_buckets: dict[str, deque[float]] = defaultdict(deque)


def reset_rate_limits() -> None:
    """Limpia el estado en memoria. Se usa en pruebas."""
    _buckets.clear()


def _consume(key: str, limit: int) -> None:
    now = time.monotonic()
    bucket = _buckets[key]
    while bucket and now - bucket[0] > _WINDOW_SECONDS:
        bucket.popleft()

    if len(bucket) >= limit:
        retry_after = max(1, int(_WINDOW_SECONDS - (now - bucket[0])))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Demasiados intentos de inicio de sesión. Esperá un minuto y volvé a probar.",
            headers={"Retry-After": str(retry_after)},
        )

    bucket.append(now)

    if len(_buckets) > _MAX_BUCKETS:
        for stale_key in [name for name, entries in _buckets.items() if not entries]:
            del _buckets[stale_key]


def check_login_rate_limit(request: Request, email: str) -> None:
    if not settings.rate_limit_enabled:
        return

    client_ip = request.client.host if request.client else "unknown"
    email_digest = hashlib.sha256(email.strip().lower().encode("utf-8")).hexdigest()[:16]
    _consume(f"login:ip:{client_ip}", settings.rate_limit_login_per_ip)
    _consume(f"login:email:{email_digest}", settings.rate_limit_login_per_email)
