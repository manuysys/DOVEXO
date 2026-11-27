import { apiRequest } from "./client";
import { normalizeSearchRun, normalizeSearchRuns } from "./normalize";
import type {
  SearchRun,
  SearchRunFilters,
  SearchRunInput,
} from "./types";

/** Payload del POST: no se envían claves vacías ni `null`. */
function toPayload(input: SearchRunInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    province_code: input.province_code,
    sector_slugs: input.sector_slugs,
    limit: input.limit ?? 50,
  };
  if (input.keywords && input.keywords.trim().length > 0) {
    payload.keywords = input.keywords.trim();
  }
  if (input.campaign_id) {
    payload.campaign_id = input.campaign_id;
  }
  return payload;
}

export async function listSearchRuns(
  filters: SearchRunFilters = {},
): Promise<SearchRun[]> {
  const params = new URLSearchParams();
  if (filters.campaign_id) params.set("campaign_id", filters.campaign_id);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) {
    params.set("offset", String(filters.offset));
  }
  const query = params.toString();
  const payload = await apiRequest<unknown>(
    `/search-runs${query.length > 0 ? `?${query}` : ""}`,
  );
  return normalizeSearchRuns(payload);
}

export async function getSearchRun(id: string): Promise<SearchRun> {
  const payload = await apiRequest<unknown>(
    `/search-runs/${encodeURIComponent(id)}`,
  );
  return normalizeSearchRun(payload);
}

export async function createSearchRun(
  input: SearchRunInput,
): Promise<SearchRun> {
  const payload = await apiRequest<unknown>("/search-runs", {
    method: "POST",
    body: toPayload(input),
  });
  return normalizeSearchRun(payload);
}

export type SearchRunAction = "retry" | "cancel";

export async function runSearchRunAction(
  id: string,
  action: SearchRunAction,
): Promise<SearchRun> {
  const payload = await apiRequest<unknown>(
    `/search-runs/${encodeURIComponent(id)}/${action}`,
    { method: "POST" },
  );
  return normalizeSearchRun(payload);
}
