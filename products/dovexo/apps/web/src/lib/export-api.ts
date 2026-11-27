import { readBlobOrThrow, sessionFetch } from "@/lib/api-session";
import {
  exportPath,
  fallbackExportFilename,
  filenameFromContentDisposition,
  type ExportKind,
} from "@/lib/export-utils";

export type ExportFile = {
  blob: Blob;
  filename: string;
};

/*
 * Fallback vacío: si el backend no envía `detail`, el ApiError queda con "" y
 * `exportErrorMessage` elige el mensaje correcto. Igual que en import-api.ts.
 */
const NO_DETAIL = "";

/**
 * Descarga el CSV del tenant activo. El backend valida rol y tenant; el frontend solo envía la
 * cookie de sesión y `X-Tenant-ID`. Si la cabecera `Content-Disposition` no es legible (CORS sin
 * `Access-Control-Expose-Headers`), se usa un nombre de respaldo con fecha.
 */
export async function downloadExport(
  tenantId: string,
  kind: ExportKind,
  now: Date = new Date(),
): Promise<ExportFile> {
  const response = await sessionFetch(exportPath(kind), { method: "GET", tenantId });
  const blob = await readBlobOrThrow(response, NO_DETAIL);
  const filename =
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    fallbackExportFilename(kind, now);
  return { blob, filename };
}
