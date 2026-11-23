"""Rota la contraseña de un usuario y revoca sus refresh tokens.

Uso local:
    uv run --project apps/api python scripts/rotate_password.py --email demo@saasgestion.com

Uso contra producción:
    $env:DATABASE_URL = "postgresql+asyncpg://..."
    uv run --project apps/api python scripts/rotate_password.py --email founder@...

La contraseña se pide por consola y nunca se imprime ni se pasa por argumentos.
"""

from __future__ import annotations

import argparse
import asyncio
import getpass
import sys
from datetime import UTC, datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
API_ROOT = REPO_ROOT / "apps" / "api"
sys.path.insert(0, str(API_ROOT))

from sqlalchemy import select, update  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.models import RefreshToken, User  # noqa: E402


def _read_password() -> str:
    password = getpass.getpass("Nueva contraseña (mínimo 12 caracteres): ")
    if len(password) < 12:
        raise SystemExit("La contraseña debe tener al menos 12 caracteres.")
    confirm = getpass.getpass("Repetir contraseña: ")
    if password != confirm:
        raise SystemExit("Las contraseñas no coinciden.")
    return password


async def _rotate(email: str, password: str) -> None:
    engine = create_async_engine(settings.database_url, echo=False, future=True)
    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    try:
        async with session_factory() as session:
            user = await session.scalar(select(User).where(User.email == email.lower()))
            if user is None:
                raise SystemExit(f"No existe un usuario con email {email}.")

            user.password_hash = hash_password(password)
            now = datetime.now(UTC)
            await session.execute(
                update(RefreshToken)
                .where(
                    RefreshToken.user_id == user.id,
                    RefreshToken.revoked_at.is_(None),
                )
                .values(revoked_at=now)
            )
            await session.commit()
            print(f"Contraseña rotada para {user.email} ({user.id}); sesiones revocadas.")
    finally:
        await engine.dispose()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", required=True, help="Email del usuario a rotar")
    args = parser.parse_args()
    password = _read_password()
    asyncio.run(_rotate(args.email, password))


if __name__ == "__main__":
    main()
