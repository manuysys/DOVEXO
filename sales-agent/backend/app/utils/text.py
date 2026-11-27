"""Normalización de texto."""

from __future__ import annotations

import re
import unicodedata


def fold_text(value: str) -> str:
    """Minúsculas sin acentos ni signos, con espacios simples."""
    normalized = unicodedata.normalize("NFKD", value)
    ascii_value = normalized.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", ascii_value.lower()).strip()


def slugify(value: str) -> str:
    folded = fold_text(value)
    return folded.replace(" ", "-")
