import { apiRequest } from "./client";
import { normalizeMessage, normalizeMessages } from "./normalize";
import type { GenerateMessageInput, OutreachMessage } from "./types";

export async function listLeadMessages(
  leadId: string,
): Promise<OutreachMessage[]> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(leadId)}/messages`,
  );
  return normalizeMessages(payload);
}

/** Genera un borrador; nunca lo envía. */
export async function generateMessage(
  leadId: string,
  input: GenerateMessageInput,
): Promise<OutreachMessage> {
  const payload = await apiRequest<unknown>(
    `/leads/${encodeURIComponent(leadId)}/messages/generate`,
    {
      method: "POST",
      body: { channel: input.channel, message_type: input.message_type },
    },
  );
  return normalizeMessage(payload);
}

export async function updateMessage(
  id: string,
  input: { edited_text: string },
): Promise<OutreachMessage> {
  const payload = await apiRequest<unknown>(
    `/messages/${encodeURIComponent(id)}`,
    { method: "PATCH", body: input },
  );
  return normalizeMessage(payload);
}

export async function approveMessage(id: string): Promise<OutreachMessage> {
  const payload = await apiRequest<unknown>(
    `/messages/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
  );
  return normalizeMessage(payload);
}

/** Intento de envío por el proveedor configurado (puede ser modo consola). */
export async function sendMessage(id: string): Promise<OutreachMessage> {
  const payload = await apiRequest<unknown>(
    `/messages/${encodeURIComponent(id)}/send`,
    { method: "POST" },
  );
  return normalizeMessage(payload);
}

/** Registro manual: la persona envió el mensaje desde su propio WhatsApp. */
export async function markMessageSent(id: string): Promise<OutreachMessage> {
  const payload = await apiRequest<unknown>(
    `/messages/${encodeURIComponent(id)}/mark-sent`,
    { method: "POST" },
  );
  return normalizeMessage(payload);
}
