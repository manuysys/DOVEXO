import { apiRequest } from "./client";
import {
  normalizeSuppression,
  normalizeSuppressions,
} from "./normalize";
import type { Suppression, SuppressionInput } from "./types";

export async function listSuppressions(): Promise<Suppression[]> {
  const payload = await apiRequest<unknown>("/suppressions");
  return normalizeSuppressions(payload);
}

export async function createSuppression(
  input: SuppressionInput,
): Promise<Suppression> {
  const payload = await apiRequest<unknown>("/suppressions", {
    method: "POST",
    body: {
      normalized_contact: input.normalized_contact,
      reason: input.reason,
    },
  });
  return normalizeSuppression(payload);
}

export async function deleteSuppression(id: string): Promise<void> {
  await apiRequest<unknown>(`/suppressions/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
