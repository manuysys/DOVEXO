"""Importación CSV de empresas.

El archivo se procesa en memoria y nunca se persiste completo. Del lote se
guardan el mapeo detectado, las filas válidas normalizadas (necesarias para
confirmar) y los errores por fila. El `POST /confirm` es idempotente.
"""

from __future__ import annotations

import csv
import io
import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import ImportBatch, Sector
from app.services.companies import (
    CompanyValidationError,
    DuplicateCompanyError,
    canonical_province,
    create_manual_company,
)
from app.services.contacts import (
    normalize_contact_value,
    normalize_domain,
    normalize_phone,
    normalize_website,
)
from app.services.deduplication import find_duplicate, normalize_locality, normalize_name
from app.utils import utcnow
from app.utils.text import fold_text

MAX_FILE_BYTES = 2 * 1024 * 1024
MAX_ROWS = 500

COLUMN_ALIASES: dict[str, set[str]] = {
    "name": {
        "name",
        "nombre",
        "empresa",
        "nombre_empresa",
        "razon_social",
        "business_name",
        "organizacion",
    },
    "website": {
        "website",
        "web",
        "sitio",
        "sitio_web",
        "pagina_web",
        "url",
        "dominio",
    },
    "phone": {
        "phone",
        "telefono",
        "tel",
        "celular",
        "movil",
        "telefono_empresa",
    },
    "email": {
        "email",
        "correo",
        "correo_electronico",
        "e_mail",
        "mail",
        "email_empresa",
    },
    "province": {"province", "provincia", "estado"},
    "locality": {"locality", "localidad", "ciudad", "municipio"},
    "address": {"address", "direccion", "domicilio", "calle"},
    "sectors": {
        "sectors",
        "sector",
        "rubro",
        "rubros",
        "sector_slugs",
        "categorias",
    },
}


class ImportValidationError(ValueError):
    pass


def _header_key(value: str) -> str:
    return re.sub(r"_+", "_", fold_text(value).replace(" ", "_"))


def _decode_content(content: bytes) -> str:
    if len(content) > MAX_FILE_BYTES:
        raise ImportValidationError("El archivo supera el máximo de 2 MB.")
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise ImportValidationError("El CSV debe estar codificado en UTF-8.") from exc
    if not text.strip():
        raise ImportValidationError("El archivo está vacío.")
    return text


def _detect_mapping(headers: list[str]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    normalized_headers = {_header_key(header): header for header in headers if header}

    for field, aliases in COLUMN_ALIASES.items():
        for alias in aliases:
            if alias in normalized_headers:
                mapping[field] = normalized_headers[alias]
                break

    if "name" not in mapping:
        raise ImportValidationError(
            "Falta una columna de nombre (name, nombre, empresa o razón social)."
        )
    return mapping


def _row_value(row: dict[str, Any], mapping: dict[str, str], field: str) -> str:
    header = mapping.get(field)
    if not header:
        return ""
    value = row.get(header)
    return str(value).strip() if value is not None else ""


def _sector_lookup(db: Session) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for sector in db.scalars(select(Sector).where(Sector.is_active.is_(True))):
        for candidate in (sector.slug, sector.name, *sector.synonyms):
            key = fold_text(candidate)
            if key:
                lookup.setdefault(key, sector.slug)
    return lookup


def _parse_sectors(raw: str, lookup: dict[str, str]) -> list[str]:
    tokens = [token.strip() for token in re.split(r"[;,|/]", raw) if token.strip()]
    if not tokens:
        raise ValueError("Indicá al menos un rubro en la columna sectors.")

    slugs: list[str] = []
    unknown: list[str] = []
    for token in tokens:
        slug = lookup.get(fold_text(token))
        if slug is None:
            unknown.append(token)
        elif slug not in slugs:
            slugs.append(slug)

    if unknown:
        raise ValueError(f"Rubros desconocidos: {', '.join(sorted(unknown))}")
    return slugs


def _parse_province(raw: str) -> str | None:
    if not raw:
        return None
    return canonical_province(raw)


def _parse_row(
    row: dict[str, Any],
    mapping: dict[str, str],
    lookup: dict[str, str],
) -> dict[str, Any]:
    name = _row_value(row, mapping, "name")
    if not name:
        raise ValueError("Falta el nombre de la empresa.")
    if len(name) > 255:
        raise ValueError("El nombre supera los 255 caracteres.")

    raw_website = _row_value(row, mapping, "website")
    website = normalize_website(raw_website) if raw_website else None
    if website and len(website) > 500:
        raise ValueError("El sitio web supera los 500 caracteres.")

    raw_phone = _row_value(row, mapping, "phone")
    phone = normalize_phone(raw_phone) if raw_phone else None

    raw_email = _row_value(row, mapping, "email")
    email = normalize_contact_value("email", raw_email) if raw_email else None
    if email and len(email) > 320:
        raise ValueError("El email supera los 320 caracteres.")

    province = _parse_province(_row_value(row, mapping, "province"))
    locality = _row_value(row, mapping, "locality") or None
    address = _row_value(row, mapping, "address") or None
    if locality and len(locality) > 160:
        raise ValueError("La localidad supera los 160 caracteres.")
    if address and len(address) > 500:
        raise ValueError("La dirección supera los 500 caracteres.")

    sectors = _parse_sectors(_row_value(row, mapping, "sectors"), lookup)

    return {
        "name": name,
        "website": website,
        "phone": phone,
        "email": email,
        "province": province,
        "locality": locality,
        "address": address,
        "sector_slugs": sectors,
    }


class _FileIndex:
    def __init__(self) -> None:
        self.domains: dict[str, int] = {}
        self.phones: dict[str, int] = {}
        self.names: dict[tuple[str, str], int] = {}

    def find(self, data: dict[str, Any]) -> int | None:
        domain = normalize_domain(data.get("website"))
        if domain and domain in self.domains:
            return self.domains[domain]
        phone = data.get("phone")
        if phone and phone in self.phones:
            return self.phones[phone]
        locality = normalize_locality(data.get("locality"))
        if locality:
            key = (normalize_name(data["name"]), locality)
            if key in self.names:
                return self.names[key]
        return None

    def add(self, data: dict[str, Any], row_number: int) -> None:
        domain = normalize_domain(data.get("website"))
        if domain:
            self.domains.setdefault(domain, row_number)
        if data.get("phone"):
            self.phones.setdefault(data["phone"], row_number)
        locality = normalize_locality(data.get("locality"))
        if locality:
            self.names.setdefault((normalize_name(data["name"]), locality), row_number)


def _preview_item(
    row_number: int,
    status: str,
    data: dict[str, Any] | None,
    *,
    message: str | None = None,
    possible_duplicate: bool = False,
) -> dict[str, Any]:
    data = data or {}
    return {
        "row_number": row_number,
        "status": status,
        "name": data.get("name"),
        "website": data.get("website"),
        "phone": data.get("phone"),
        "email": data.get("email"),
        "province": data.get("province"),
        "locality": data.get("locality"),
        "address": data.get("address"),
        "sectors": data.get("sector_slugs", []),
        "possible_duplicate": possible_duplicate,
        "message": message,
    }


def preview_import(
    db: Session,
    *,
    filename: str,
    content: bytes,
    created_by_id: int | None = None,
) -> tuple[ImportBatch, list[dict[str, Any]]]:
    text = _decode_content(content)

    sample = text[:8192]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel

    reader = csv.DictReader(io.StringIO(text), dialect=dialect)
    headers = [header for header in (reader.fieldnames or []) if header]
    if not headers:
        raise ImportValidationError("El CSV no tiene encabezados.")

    mapping = _detect_mapping(headers)
    lookup = _sector_lookup(db)
    file_index = _FileIndex()

    total_rows = 0
    valid_rows = 0
    invalid_rows = 0
    duplicate_rows = 0
    preview: list[dict[str, Any]] = []
    valid_store: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    try:
        for index, row in enumerate(reader, start=2):
            if not any(str(value or "").strip() for value in row.values() if value is not None):
                continue
            total_rows += 1
            if total_rows > MAX_ROWS:
                raise ImportValidationError("El CSV supera el máximo de 500 filas.")

            try:
                data = _parse_row(row, mapping, lookup)
            except (ValueError, CompanyValidationError) as exc:
                invalid_rows += 1
                errors.append({"row_number": index, "message": str(exc)})
                preview.append(_preview_item(index, "invalid", None, message=str(exc)))
                continue

            duplicate_row = file_index.find(data)
            if duplicate_row is not None:
                duplicate_rows += 1
                preview.append(
                    _preview_item(
                        index,
                        "duplicate",
                        data,
                        message=f"Duplicado dentro del archivo (fila {duplicate_row}).",
                    )
                )
                continue

            match = find_duplicate(
                db,
                name=data["name"],
                website=data["website"],
                phone=data["phone"],
                locality=data["locality"],
                province=data["province"],
            )
            if match is not None and match.is_exact:
                duplicate_rows += 1
                preview.append(
                    _preview_item(
                        index,
                        "duplicate",
                        data,
                        message=f"Ya existe en la base (empresa {match.company_id}).",
                    )
                )
                continue

            file_index.add(data, index)
            valid_rows += 1
            possible = match is not None and not match.is_exact
            preview.append(
                _preview_item(
                    index,
                    "valid",
                    data,
                    possible_duplicate=possible,
                )
            )
            valid_store.append(
                {
                    "row_number": index,
                    **data,
                    "possible_duplicate": possible,
                }
            )
    except csv.Error as exc:
        raise ImportValidationError(f"CSV inválido: {exc}") from exc

    if total_rows == 0:
        raise ImportValidationError("El CSV no tiene filas de datos.")

    batch = ImportBatch(
        filename=filename[:300],
        status="preview",
        total_rows=total_rows,
        valid_rows=valid_rows,
        invalid_rows=invalid_rows,
        duplicate_rows=duplicate_rows,
        mapping=mapping,
        preview_rows=valid_store,
        errors=errors,
        created_by=created_by_id,
    )
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch, preview


def confirm_import(db: Session, batch: ImportBatch) -> ImportBatch:
    if batch.status == "confirmed":
        return batch
    if batch.status != "preview":
        raise ImportValidationError("El lote no está en estado de vista previa.")

    batch_id = batch.id
    rows = list(batch.preview_rows or [])
    errors = list(batch.errors or [])
    created = 0

    for row in rows:
        try:
            create_manual_company(
                db,
                name=row["name"],
                website=row.get("website"),
                province=row.get("province"),
                locality=row.get("locality"),
                address=row.get("address"),
                sector_slugs=list(row.get("sector_slugs") or []),
                phone=row.get("phone"),
                email=row.get("email"),
                source_type="csv_import",
                source_label=f"Importación CSV: {batch.filename}"[:300],
                source_reference=batch.filename,
            )
        except DuplicateCompanyError:
            continue
        except Exception as exc:
            db.rollback()
            errors.append(
                {
                    "row_number": int(row.get("row_number") or 0),
                    "message": str(exc)[:500],
                }
            )
            continue
        created += 1

    batch = db.get(ImportBatch, batch_id)
    if batch is None:
        raise ImportValidationError("El lote ya no existe.")
    batch.status = "confirmed"
    batch.confirmed_at = utcnow()
    batch.successful_rows = created
    batch.skipped_rows = max(batch.total_rows - created, 0)
    batch.errors = errors
    db.commit()
    db.refresh(batch)
    return batch
