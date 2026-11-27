"""Servicios de autenticación."""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.logging import get_logger
from app.core.security import hash_password, verify_password
from app.models import User

logger = get_logger(__name__)


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def authenticate(db: Session, email: str, password: str) -> User | None:
    user = get_user_by_email(db, email)
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


def ensure_initial_admin(db: Session, settings: Settings) -> User | None:
    """Crea el admin inicial solo si la tabla `users` está vacía."""
    user_count = int(db.scalar(select(func.count()).select_from(User)) or 0)
    if user_count > 0:
        return None

    email = settings.initial_admin_email.strip()
    password = settings.initial_admin_password
    if not email or not password:
        logger.warning(
            "No hay usuarios y faltan INITIAL_ADMIN_EMAIL/INITIAL_ADMIN_PASSWORD: "
            "no se creó el admin inicial."
        )
        return None

    if len(password) < 8:
        logger.warning(
            "INITIAL_ADMIN_PASSWORD tiene menos de 8 caracteres; no se creó el admin inicial."
        )
        return None

    admin = User(
        email=email.lower(),
        password_hash=hash_password(password),
        role="admin",
        is_active=True,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    logger.info("Admin inicial creado: %s", admin.email)
    return admin
