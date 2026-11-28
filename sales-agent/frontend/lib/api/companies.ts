import { apiRequest, apiRequestFile } from "./client";
import {
  normalizeCompany,
  normalizeCompanyEnrichBatch,
  normalizeCompanyEnrichJob,
  normalizeCompanyEnrichJobs,
  normalizeCompanyEnrichment,
  normalizeCompanyPage,
  normalizeContact,
} from "./normalize";
import type {
  Company,
  CompanyContact,
  CompanyContactInput,
  CompanyEnrichBatchResult,
  CompanyEnrichJob,
  CompanyEnrichResult,
  CompanyFilters,
  CompanyInput,
  CompanyPage,
  CompanyUpdateInput,
} from "./types";

/** Máximo de empresas que acepta `POST /companies/enrich` por lote. */
export const ENRICH_BATCH_LIMIT = 50;

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
  if (filters.has_website !== undefined) {
    params.set("has_website", filters.has_website ? "true" : "false");
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

/**
 * Investiga el sitio web de la empresa (`POST /companies/{id}/enrich`).
 * El backend valida rol admin/owner, la URL y la red; nunca se llama a otra
 * fuente por nuestra cuenta. La respuesta se normaliza porque puede faltar
 * algún campo según el estado de la investigación.
 */
export async function enrichCompany(id: string): Promise<CompanyEnrichResult> {
  const payload = await apiRequest<unknown>(
    `/companies/${encodeURIComponent(id)}/enrich`,
    { method: "POST" },
  );
  return normalizeCompanyEnrichment(payload);
}

/**
 * Encola la investigación de varias empresas (`POST /companies/enrich`).
 * El backend acepta como máximo 50 ids por lote; se valida localmente para no
 * mandar una solicitud que va a terminar en 422.
 */
export async function enrichCompanies(
  companyIds: readonly string[],
): Promise<CompanyEnrichBatchResult> {
  const ids = companyIds.map((value) => Number(value));
  if (ids.length === 0) {
    throw new Error("Elegí al menos una empresa para enriquecer.");
  }
  if (ids.some((value) => !Number.isInteger(value) || value <= 0)) {
    throw new Error(
      "Hay identificadores de empresa inválidos en la selección. Recargá la lista e intentá de nuevo.",
    );
  }
  if (ids.length > ENRICH_BATCH_LIMIT) {
    throw new Error(
      `Se pueden enriquecer hasta ${ENRICH_BATCH_LIMIT} empresas por lote.`,
    );
  }
  const payload = await apiRequest<unknown>("/companies/enrich", {
    method: "POST",
    body: { company_ids: ids },
  });
  return normalizeCompanyEnrichBatch(payload);
}

/** Trabajos recientes, con el límite que admite `GET /companies/enrich/jobs`. */
export async function listEnrichJobs(
  limit: number = ENRICH_BATCH_LIMIT,
): Promise<CompanyEnrichJob[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const payload = await apiRequest<unknown>(
    `/companies/enrich/jobs?${params.toString()}`,
  );
  return normalizeCompanyEnrichJobs(payload);
}

/** Detalle de un trabajo (`GET /companies/enrich/jobs/{id}`). */
export async function getEnrichJob(id: string): Promise<CompanyEnrichJob> {
  const payload = await apiRequest<unknown>(
    `/companies/enrich/jobs/${encodeURIComponent(id)}`,
  );
  return normalizeCompanyEnrichJob(payload);
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
