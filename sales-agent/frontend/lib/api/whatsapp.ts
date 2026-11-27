import { apiRequest } from "./client";
import {
  normalizeSimulatedInbound,
  normalizeWhatsAppStatus,
  normalizeWhatsAppThreadDetail,
  normalizeWhatsAppThreads,
} from "./normalize";
import type {
  SimulatedInbound,
  WhatsAppStatus,
  WhatsAppThread,
  WhatsAppThreadDetail,
} from "./types";

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const payload = await apiRequest<unknown>("/whatsapp/status");
  return normalizeWhatsAppStatus(payload);
}

export async function listWhatsAppThreads(): Promise<WhatsAppThread[]> {
  const payload = await apiRequest<unknown>("/whatsapp/threads");
  return normalizeWhatsAppThreads(payload);
}

export async function getWhatsAppThread(
  id: string,
): Promise<WhatsAppThreadDetail> {
  const payload = await apiRequest<unknown>(
    `/whatsapp/threads/${encodeURIComponent(id)}`,
  );
  return normalizeWhatsAppThreadDetail(payload);
}

/** Simula un mensaje entrante para probar el bot sin WhatsApp real. */
export async function simulateInbound(input: {
  phone: string;
  name?: string;
  text: string;
}): Promise<SimulatedInbound> {
  const payload = await apiRequest<unknown>("/whatsapp/simulate/inbound", {
    method: "POST",
    body: {
      phone: input.phone,
      text: input.text,
      ...(input.name ? { name: input.name } : {}),
    },
  });
  return normalizeSimulatedInbound(payload);
}
