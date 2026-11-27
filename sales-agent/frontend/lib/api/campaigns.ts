import { apiRequest } from "./client";
import { normalizeCampaign, normalizeCampaigns } from "./normalize";
import type { Campaign, CampaignInput } from "./types";

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

type CampaignAction = "start" | "pause" | "cancel";

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
