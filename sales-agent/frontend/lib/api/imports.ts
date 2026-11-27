import { apiRequest, apiUpload } from "./client";
import {
  normalizeImportBatch,
  normalizeImportConfirm,
  normalizeImports,
  normalizeImportPreview,
} from "./normalize";
import type { ImportBatch, ImportConfirmResult, ImportPreview } from "./types";

/** Sube el CSV y devuelve la previsualización sin guardar empresas. */
export async function previewImport(file: File): Promise<ImportPreview> {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const payload = await apiUpload<unknown>("/imports/preview", formData);
  return normalizeImportPreview(payload);
}

export async function confirmImport(
  batchId: string,
): Promise<ImportConfirmResult> {
  const payload = await apiRequest<unknown>(
    `/imports/${encodeURIComponent(batchId)}/confirm`,
    { method: "POST" },
  );
  return normalizeImportConfirm(payload);
}

export async function listImports(): Promise<ImportBatch[]> {
  const payload = await apiRequest<unknown>("/imports");
  return normalizeImports(payload);
}

export async function getImport(id: string): Promise<ImportBatch> {
  const payload = await apiRequest<unknown>(
    `/imports/${encodeURIComponent(id)}`,
  );
  return normalizeImportBatch(payload);
}
