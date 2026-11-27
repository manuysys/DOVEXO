import { apiRequest } from "./client";
import {
  normalizeLead,
  normalizeLeadEvaluations,
  normalizeLeadPage,
  normalizeLeadScoreResult,
} from "./normalize";
import type {
  Lead,
  LeadEvaluation,
  LeadFilters,
  LeadPage,
  LeadScoreResult,
  LeadUpdateInput,
} from "./types";

/**
 * Máximo de oportunidades por consulta que acepta `GET /leads`
 * (el backend responde 422 con límites mayores).
 */
export const LEADS_PAGE_LIMIT = 100;

function buildQuery(filters: LeadFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.product_id) params.set("product_id", filters.product_id);
  if (filters.company_id) params.set("company_id", filters.company_id);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) {
    params.set("offset", String(filters.offset));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export async function listLeads(filters: LeadFilters = {}): Promise<LeadPage> {
  const payload = await apiRequest<unknown>(`/leads${buildQuery(filters)}`);
  return normalizeLeadPage(payload);
}

export async function getLead(id: string): Promise<Lead> {
  const payload = await apiRequest<unknown>(`/leads/${encodeURIComponent(id)}`);
  return normalizeLead(payload);
}

/** Crea la oportunidad de una empresa para un producto (DOVEXO por defecto). */
export async function createLead(
  companyId: string,
  input: { product_id?: string } = {},
): Promise<Lead> {
  const body: Record<string, unknown> = {};
  if (input.product_id) body.product_id = input.product_id;
  const payload = await apiRequest<unknown>(
    `/companies/${encodeURIComponent(companyId)}/leads`,
    { method: "POST", body },
  );
  return normalizeLead(payload);
}

export async function updateLead(
  id: string,
  input: LeadUpdateInput,
): Promise<Lead> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  return normalizeLead(payload);
}

/** Calcula compatibilidad y confianza con el motor del backend. */
export async function scoreLead(id: string): Promise<LeadScoreResult> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(id)}/score`,
    { method: "POST" },
  );
  return normalizeLeadScoreResult(payload);
}

export async function listLeadEvaluations(
  id: string,
): Promise<LeadEvaluation[]> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(id)}/evaluations`,
  );
  return normalizeLeadEvaluations(payload);
}
