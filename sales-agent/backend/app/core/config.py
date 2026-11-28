"""Configuración de la aplicación.

Los valores se leen de variables de entorno y, si no están definidas, de
`backend/.env`. Las rutas SQLite relativas (`sqlite:///./...`) se resuelven
contra `backend/`, no contra el directorio desde donde se lanza el proceso.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]

_DEV_JWT_SECRET = "dev-only-insecure-secret-change-me-32-chars"  # noqa: S105


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "ARVOKTA Sales Agent"
    app_env: str = "development"
    log_level: str = "INFO"

    database_url: str = "sqlite:///./data/arvokta.db"

    jwt_secret: str = _DEV_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_hours: int = 8
    auth_cookie_name: str = "arvokta_access"

    cors_origins: str = "http://localhost:3001"

    initial_admin_email: str = ""
    initial_admin_password: str = ""

    rate_limit_enabled: bool = True
    rate_limit_login_per_ip: int = 10
    rate_limit_login_per_email: int = 5

    # IA local opcional; no se usa en Fase 1.
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = ""

    # WhatsApp (opcional). Sin token/phone id se usa el provider de consola.
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = ""
    whatsapp_app_secret: str = ""
    whatsapp_sender_phone: str = ""
    whatsapp_api_version: str = "v23.0"
    whatsapp_timeout_seconds: float = 30.0
    founder_phone: str = ""
    # Plantilla aprobada de Meta para el primer contacto (fuera de la ventana de
    # atención solo se puede enviar una plantilla, no texto libre). Vacío =
    # el primer contacto por Meta falla con un error de configuración.
    whatsapp_first_contact_template: str = ""
    whatsapp_template_language: str = "es_AR"

    # Descubrimiento con OpenStreetMap/Overpass (Fase 2A).
    overpass_url: str = "https://overpass-api.de/api/interpreter"
    overpass_timeout_seconds: float = 60.0
    overpass_max_retries: int = 2
    overpass_request_delay_seconds: float = 0.5
    overpass_user_agent: str = "ARVOKTA-Sales-Agent/0.1 (internal prospecting tool)"

    # Enriquecimiento web de empresas (Fase 3). Solo HTTP/HTTPS públicos, sin
    # APIs pagas ni navegador headless.
    enrichment_user_agent: str = (
        "ARVOKTA-Sales-Agent/0.1 (internal company research; +https://arvokta.local)"
    )
    enrichment_timeout_seconds: float = 10.0
    enrichment_max_page_bytes: int = 1_048_576
    enrichment_max_pages: int = 5
    enrichment_max_redirects: int = 3
    enrichment_page_delay_seconds: float = 1.0
    enrichment_job_delay_seconds: float = 1.0
    enrichment_batch_limit: int = 20

    @field_validator("log_level")
    @classmethod
    def _normalize_log_level(cls, value: str) -> str:
        return value.strip().upper()

    @property
    def is_production(self) -> bool:
        return self.app_env.strip().lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cookie_secure(self) -> bool:
        return self.is_production

    @property
    def uses_dev_jwt_secret(self) -> bool:
        return self.jwt_secret == _DEV_JWT_SECRET

    @property
    def whatsapp_configured(self) -> bool:
        return bool(self.whatsapp_access_token and self.whatsapp_phone_number_id)

    @property
    def whatsapp_mode(self) -> str:
        return "meta" if self.whatsapp_configured else "console"

    @property
    def whatsapp_first_contact_template_name(self) -> str:
        return self.whatsapp_first_contact_template.strip()

    @property
    def whatsapp_template_configured(self) -> bool:
        return bool(self.whatsapp_first_contact_template_name)


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.is_production and len(settings.jwt_secret) < 32:
        raise ValueError("JWT_SECRET debe tener al menos 32 caracteres en producción")
    if settings.is_production and settings.uses_dev_jwt_secret:
        raise ValueError("JWT_SECRET no puede ser el valor de desarrollo en producción")
    return settings


settings = get_settings()
