import { apiRequest } from "./client";
import {
  normalizeJobs,
  normalizeMetrics,
  normalizeProvinces,
  normalizeSectors,
} from "./normalize";
import type {
  DashboardJob,
  DashboardMetrics,
  ProvinceOption,
  Sector,
} from "./types";

export async function getDashboardMetrics(
  productId?: string,
): Promise<DashboardMetrics> {
  const query = productId
    ? `?product_id=${encodeURIComponent(productId)}`
    : "";
  const payload = await apiRequest<unknown>(`/dashboard/metrics${query}`);
  return normalizeMetrics(payload);
}

export async function getDashboardJobs(): Promise<DashboardJob[]> {
  const payload = await apiRequest<unknown>("/dashboard/jobs");
  return normalizeJobs(payload);
}

/** Rubros configurados en la base (`GET /meta/sectors`). */
export async function listSectors(): Promise<Sector[]> {
  const payload = await apiRequest<unknown>("/meta/sectors");
  return normalizeSectors(payload);
}

/** Provincias de referencia (`GET /meta/provinces`). */
export async function listProvinces(): Promise<ProvinceOption[]> {
  const payload = await apiRequest<unknown>("/meta/provinces");
  return normalizeProvinces(payload);
}
