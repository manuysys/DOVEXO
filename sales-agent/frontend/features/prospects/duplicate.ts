import { isApiError } from "@/lib/api/client";
import { isRecord, readString } from "@/lib/api/normalize";

/** Empresa existente detectada por el backend al rechazar un duplicado. */
export interface DuplicateCompany {
  id: string | null;
  name: string | null;
  message: string;
}

function readId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim().length > 0) return value.trim();
  return null;
}

/**
 * La API responde 409 `{ detail, duplicate_of }` cuando el alta manual coincide
 * con una empresa existente. `duplicate_of` puede ser un id o un objeto con
 * `{ id, name }`, y puede venir anidado dentro de `detail`.
 */
export function readDuplicateCompany(error: unknown): DuplicateCompany | null {
  if (!isApiError(error) || error.status !== 409) return null;

  const root = isRecord(error.detail) ? error.detail : {};
  const inner = isRecord(root.detail) ? root.detail : root;
  const raw =
    inner.duplicate_of ??
    root.duplicate_of ??
    inner.duplicateOf ??
    root.duplicateOf;

  let id: string | null = null;
  let name: string | null = null;

  if (isRecord(raw)) {
    id = readId(raw.id);
    const candidateName = readString(raw, ["name"]);
    if (candidateName.trim().length > 0) name = candidateName;
  } else {
    id = readId(raw);
  }

  if (!name) {
    const candidateName = readString(inner, ["company_name", "companyName"]) || readString(root, ["company_name", "companyName"]);
    if (candidateName.trim().length > 0) name = candidateName;
  }

  const detailMessage =
    typeof inner.message === "string" && inner.message.trim().length > 0
      ? inner.message
      : "";

  return {
    id,
    name,
    message: detailMessage || error.message,
  };
}
