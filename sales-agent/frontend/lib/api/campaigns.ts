import { apiRequest } from "./client";
import {
  normalizeCampaign,
  normalizeCampaignStart,
  normalizeCampaigns,
} from "./normalize";
import type {
  Campaign,
  CampaignInput,
  CampaignStartResult,
} from "./types";

export async function listCampaigns(): Promise<Campaign[]> {
  const payload = await apiRequest<unknown>("/campaigns");
  return normalizeCampaigns(payload);
}

export async function getCampaign(id: string): Promise<Campaign> {
  const payload = await apiRequest<unknown>(
    `/campaigns/${encodeURIComponent(id)}`,
  );
  return normalizeCampaign(payload);
}

export async function createCampaign(
  input: CampaignInput,
): Promise<Campaign> {
  const payload = await apiRequest<unknown>("/campaigns", {
    method: "POST",
    body: input,
  });
  return normalizeCampaign(payload);
}

/**
 * `POST /campaigns/{id}/start` crea una corrida por provincia y devuelve
 * `{ campaign, search_runs, total_jobs }`.
 */
export async function startCampaign(id: string): Promise<CampaignStartResult> {
  const payload = await apiRequest<unknown>(
    `/campaigns/${encodeURIComponent(id)}/start`,
    { method: "POST" },
  );
  return normalizeCampaignStart(payload);
}

export type CampaignAction = "pause" | "cancel";

export async function runCampaignAction(
  id: string,
  action: CampaignAction,
): Promise<Campaign> {
  const payload = await apiRequest<unknown>(
    `/campaigns/${encodeURIComponent(id)}/${action}`,
    { method: "POST" },
  );
  return normalizeCampaign(payload);
}
