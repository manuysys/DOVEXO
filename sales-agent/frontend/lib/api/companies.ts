import { apiRequest } from "./client";
import { normalizeCompany, normalizeCompanyPage } from "./normalize";
import type {
  Company,
  CompanyFilters,
  CompanyInput,
  CompanyPage,
} from "./types";

function buildQuery(filters: CompanyFilters): string {
  const params = new URLSearchParams();
  if (filters.search_run_id) params.set("search_run_id", filters.search_run_id);
  if (filters.query && filters.query.trim().length > 0) {
    params.set("query", filters.query.trim());
  }
  if (filters.province) params.set("province", filters.province);
  if (filters.sector) params.set("sector", filters.sector);
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
