/** Límites visibles de la importación CSV (Fase 2B). */
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 500;

const ROW_STATUS_LABELS: Record<string, string> = {
  valid: "Válida",
  ok: "Válida",
  new: "Válida",
  ready: "Válida",
  duplicate: "Duplicada",
  duplicated: "Duplicada",
  possible_duplicate: "Posible duplicado",
  "possible-duplicate": "Posible duplicado",
  invalid: "Con errores",
  error: "Con errores",
  skipped: "Omitida",
};

const ROW_STATUS_VARIANTS: Record<
  string,
  "neutral" | "success" | "warning" | "danger"
> = {
  valid: "success",
  ok: "success",
  new: "success",
  ready: "success",
  duplicate: "warning",
  duplicated: "warning",
  possible_duplicate: "warning",
  "possible-duplicate": "warning",
  invalid: "danger",
  error: "danger",
  skipped: "neutral",
};

export function importRowStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  return ROW_STATUS_LABELS[key] ?? (key.length > 0 ? status : "Sin estado");
}

export function importRowStatusVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" {
  return ROW_STATUS_VARIANTS[status.trim().toLowerCase()] ?? "neutral";
}

const BATCH_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  preview: "Previsualizada",
  previewed: "Previsualizada",
  confirmed: "Confirmada",
  completed: "Completada",
  imported: "Importada",
  failed: "Fallida",
  cancelled: "Cancelada",
};

export function importBatchStatusLabel(status: string): string {
  const key = status.trim().toLowerCase();
  return BATCH_STATUS_LABELS[key] ?? (key.length > 0 ? status : "Sin estado");
}

export function importBatchStatusVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "info" {
  const key = status.trim().toLowerCase();
  if (key === "confirmed" || key === "completed" || key === "imported") {
    return "success";
  }
  if (key === "failed") return "danger";
  if (key === "cancelled") return "warning";
  if (key === "pending" || key === "preview" || key === "previewed") {
    return "info";
  }
  return "neutral";
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    const mb = bytes / (1024 * 1024);
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export interface ImportFileCheck {
  ok: boolean;
  message: string | null;
}

/** Valida extensión y tamaño antes de subir nada al backend. */
export function checkImportFile(file: File): ImportFileCheck {
  if (!/\.csv$/i.test(file.name)) {
    return { ok: false, message: "El archivo debe ser .csv." };
  }
  if (file.size === 0) {
    return { ok: false, message: "El archivo está vacío." };
  }
  if (file.size > IMPORT_MAX_BYTES) {
    return {
      ok: false,
      message: `El archivo supera el máximo de ${formatBytes(IMPORT_MAX_BYTES)}.`,
    };
  }
  return { ok: true, message: null };
}

/**
 * Cuenta las filas de datos del CSV (sin el encabezado) para avisar antes de
 * subir. Si el archivo no se puede leer, devuelve `null` y el backend valida.
 */
export async function countCsvDataRows(file: File): Promise<number | null> {
  try {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return Math.max(lines.length - 1, 0);
  } catch {
    return null;
  }
}
