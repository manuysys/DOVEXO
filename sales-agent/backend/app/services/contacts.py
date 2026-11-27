"""Normalización de contactos y sitios.

Se conserva siempre el valor original en `contacts.original_value`; el valor
normalizado se usa solo para comparar y deduplicar. Un teléfono nunca se
convierte en WhatsApp por su formato.
"""

from __future__ import annotations

import re
from urllib.parse import parse_qs, urlparse

import phonenumbers
from phonenumbers import NumberParseException, PhoneNumberFormat

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
_WA_HOSTS = frozenset(
    {
        "wa.me",
        "www.wa.me",
        "api.whatsapp.com",
        "www.api.whatsapp.com",
        "whatsapp.com",
        "www.whatsapp.com",
    }
)


def normalize_email(value: str) -> str:
    cleaned = value.strip()
    if cleaned.lower().startswith("mailto:"):
        cleaned = cleaned[7:]
    cleaned = cleaned.strip().lower()
    if not _EMAIL_RE.match(cleaned):
        raise ValueError("Email inválido")
    return cleaned


def normalize_phone(value: str, default_region: str = "AR") -> str:
    cleaned = value.strip()
    if cleaned.lower().startswith("tel:"):
        cleaned = cleaned[4:].strip()

    # Algunos tags de OSM publican varios números separados; se conserva el
    # primero y el valor original completo queda en `original_value`.
    cleaned = re.split(r"[;,/]|\bint\.?\b", cleaned, maxsplit=1)[0].strip()

    if cleaned:
        try:
            parsed = phonenumbers.parse(cleaned, default_region)
            if phonenumbers.is_possible_number(parsed):
                return phonenumbers.format_number(parsed, PhoneNumberFormat.E164)
        except NumberParseException:
            pass

    digits = re.sub(r"\D", "", cleaned)
    if len(digits) < 6:
        raise ValueError("Teléfono inválido")
    return f"+{digits}" if len(digits) >= 10 else digits


def extract_whatsapp_number(value: str) -> str:
    """Extrae el número de un enlace wa.me/api.whatsapp o normaliza un número."""
    cleaned = value.strip()
    parsed = urlparse(cleaned if "://" in cleaned else f"https://{cleaned}")
    if parsed.netloc.lower() in _WA_HOSTS:
        query_phone = parse_qs(parsed.query).get("phone")
        if query_phone:
            return normalize_phone(query_phone[0])
        path_digits = re.sub(r"\D", "", parsed.path)
        if path_digits:
            return normalize_phone(f"+{path_digits}")
    return normalize_phone(cleaned)


def normalize_website(value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("Sitio web vacío")
    if "://" not in cleaned:
        cleaned = f"https://{cleaned}"

    parsed = urlparse(cleaned)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Sitio web inválido")
    return cleaned


def normalize_domain(value: str | None) -> str | None:
    if not value:
        return None
    try:
        host = urlparse(normalize_website(value)).hostname or ""
    except ValueError:
        return None
    host = host.lower().strip(".")
    if host.startswith("www."):
        host = host[4:]
    return host or None


def normalize_contact_value(contact_type: str, value: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise ValueError("El contacto está vacío")
    if contact_type in {"phone", "whatsapp"}:
        if contact_type == "whatsapp":
            return extract_whatsapp_number(cleaned)
        return normalize_phone(cleaned)
    if contact_type == "email":
        return normalize_email(cleaned)
    return cleaned
