import { apiRequest, apiRequestFile } from "./client";
import {
  normalizeCompany,
  normalizeCompanyPage,
  normalizeContact,
} from "./normalize";
import type {
  Company,
  CompanyContact,
  CompanyContactInput,
  CompanyFilters,
  CompanyInput,
  CompanyPage,
  CompanyUpdateInput,
} from "./types";

function appendFilters(
  params: URLSearchParams,
  filters: CompanyFilters,
): void {
  if (filters.search_run_id) params.set("search_run_id", filters.search_run_id);
  if (filters.query && filters.query.trim().length > 0) {
    params.set("query", filters.query.trim());
  }
  if (filters.province) params.set("province", filters.province);
  if (filters.sector) params.set("sector", filters.sector);
  if (filters.discovery_status) {
    params.set("discovery_status", filters.discovery_status);
  }
}

function buildQuery(filters: CompanyFilters): string {
  const params = new URLSearchParams();
  appendFilters(params, filters);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) {
    params.set("offset", String(filters.offset));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function listCompanies(
  filters: CompanyFilters = {},
): Promise<CompanyPage> {
  const payload = await apiRequest<unknown>(`/companies${buildQuery(filters)}`);
  return normalizeCompanyPage(payload);
}

export async function getCompany(id: string): Promise<Company> {
  const payload = await apiRequest<unknown>(
    `/companies/${encodeURIComponent(id)}`,
  );
  return normalizeCompany(payload);
}

/** El alta manual omite los campos vacíos para no enviar cadenas en blanco. */
function toPayload(input: CompanyInput): Record<string, unknown> {
  const payload: Record<string, unknown> = { name: input.name.trim() };
  const optional: Array<[string, string | undefined]> = [
    ["website", input.website],
    ["province", input.province],
    ["locality", input.locality],
    ["address", input.address],
    ["phone", input.phone],
    ["email", input.email],
  ];
  for (const [key, value] of optional) {
    if (value && value.trim().length > 0) payload[key] = value.trim();
  }
  if (input.sector_slugs.length > 0) {
    payload.sector_slugs = input.sector_slugs;
  }
  return payload;
}

export async function createCompany(input: CompanyInput): Promise<Company> {
  const payload = await apiRequest<unknown>("/companies", {
    method: "POST",
    body: toPayload(input),
  });
  return normalizeCompany(payload);
}

/** Correcciones y cambios de estado (`PATCH /companies/{id}`). */
export async function updateCompany(
  id: string,
  input: CompanyUpdateInput,
): Promise<Company> {
  const payload = await apiRequest<unknown>(
    `/companies/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  return normalizeCompany(payload);
}

/**
 * Agrega un contacto a la empresa. Se usa para confirmar manualmente un
 * WhatsApp: el 409 del backend indica que ese contacto ya existe.
 */
export async function createCompanyContact(
  companyId: string,
  input: CompanyContactInput,
): Promise<CompanyContact> {
  const body: Record<string, unknown> = {
    contact_type: input.contact_type,
    value: input.value.trim(),
  };
  if (input.label) body.label = input.label;
  if (input.is_primary !== undefined) body.is_primary = input.is_primary;
  if (input.verification_status) {
    body.verification_status = input.verification_status;
  }

  const payload = await apiRequest<unknown>(
    `/companies/${encodeURIComponent(companyId)}/contacts`,
    { method: "POST", body },
  );
  return normalizeContact(payload);
}

/** Ruta de exportación con los mismos filtros de la tabla, sin paginación. */
export function companiesExportPath(filters: CompanyFilters = {}): string {
  const params = new URLSearchParams();
  appendFilters(params, filters);
  const query = params.toString();
  return `/companies/export.csv${query.length > 0 ? `?${query}` : ""}`;
}

function filenameFromDisposition(value: string | null): string | null {
  if (!value) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(value);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const plain = /filename="?([^";]+)"?/i.exec(value);
  return plain?.[1] ?? null;
}

export interface ExportedFile {
  blob: Blob;
  filename: string;
}

/**
 * Descarga el CSV de empresas respetando los filtros activos. El navegador
 * envía la cookie de sesión, igual que el resto de las llamadas.
 */
export async function exportCompaniesCsv(
  filters: CompanyFilters = {},
): Promise<ExportedFile> {
  const response = await apiRequestFile(companiesExportPath(filters));
  const blob = await response.blob();
  const filename =
    filenameFromDisposition(response.headers.get("content-disposition")) ??
    `empresas-${new Date().toISOString().slice(0, 10)}.csv`;
  return { blob, filename };
}
