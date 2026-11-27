import { apiRequest } from "./client";
import { normalizeActivities, normalizeActivity } from "./normalize";
import type { Activity, ActivityInput } from "./types";

export async function listLeadActivities(
  leadId: string,
): Promise<Activity[]> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(leadId)}/activities`,
  );
  return normalizeActivities(payload);
}

export async function createLeadActivity(
  leadId: string,
  input: ActivityInput,
): Promise<Activity> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(leadId)}/activities`,
    {
      method: "POST",
      body: {
        activity_type: input.activity_type,
        description: input.description,
        ...(input.next_action_at
          ? { next_action_at: input.next_action_at }
          : {}),
      },
    },
  );
  return normalizeActivity(payload);
}

export async function listActivities(
  params: { limit?: number; offset?: number } = {},
): Promise<Activity[]> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.offset !== undefined) query.set("offset", String(params.offset));
  const qs = query.toString();
  const payload = await apiRequest<unknown>(
    `/activities${qs.length > 0 ? `?${qs}` : ""}`,
  );
  return normalizeActivities(payload);
}
