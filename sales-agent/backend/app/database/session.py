"""Engine, sesiones y PRAGMAs de SQLite.

SQLite se usa con `journal_mode=WAL`, `foreign_keys=ON` y `busy_timeout` para
que el worker y la API puedan compartir el archivo sin bloquearse de forma
permanente. Las transacciones deben ser cortas.
"""

from __future__ import annotations

from collections.abc import Generator
from pathlib import Path

from sqlalchemy import Engine, create_engine, event
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import BASE_DIR, get_settings

_SQLITE_PREFIX = "sqlite:///"


def normalize_database_url(url: str) -> str:
    """Resuelve rutas SQLite relativas contra `backend/`."""
    if not url.startswith(_SQLITE_PREFIX):
        return url

    raw_path = url[len(_SQLITE_PREFIX) :]
    if raw_path in {"", ":memory:"} or raw_path.startswith("/"):
        return url

    if raw_path.startswith("./"):
        raw_path = raw_path[2:]

    absolute_path = (BASE_DIR / raw_path).resolve()
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    return f"{_SQLITE_PREFIX}{absolute_path.as_posix()}"


def build_engine(url: str) -> Engine:
    normalized = normalize_database_url(url)
    if not normalized.startswith("sqlite"):
        return create_engine(normalized, pool_pre_ping=True)

    engine = create_engine(
        normalized,
        connect_args={"check_same_thread": False},
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection: object, _record: object) -> None:
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

    return engine


def sqlite_database_path(url: str) -> Path | None:
    normalized = normalize_database_url(url)
    if not normalized.startswith(_SQLITE_PREFIX):
        return None
    return Path(normalized[len(_SQLITE_PREFIX) :])


settings = get_settings()
engine = build_engine(settings.database_url)
SessionLocal = sessionmaker(bind=engine, class_=Session, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
