import type { BadgeVariant } from "@/components/ui/badge";
import type { MessageStatus, MessageType } from "@/lib/api/types";

export const MESSAGE_STATUS_LABELS: Record<
  Exclude<MessageStatus, "unknown">,
  string
> = {
  draft: "Borrador",
  pending_approval: "Pendiente de aprobación",
  approved: "Aprobado",
  rejected: "Rechazado",
  sent: "Enviado",
  replied: "Respondido",
  archived: "Archivado",
};

const MESSAGE_STATUS_VARIANTS: Record<
  Exclude<MessageStatus, "unknown">,
  BadgeVariant
> = {
  draft: "neutral",
  pending_approval: "warning",
  approved: "info",
  rejected: "danger",
  sent: "success",
  replied: "success",
  archived: "neutral",
};

export function messageStatusLabel(status: MessageStatus | string): string {
  const key = status.trim().toLowerCase();
  return (
    MESSAGE_STATUS_LABELS[key as Exclude<MessageStatus, "unknown">] ??
    (key.length > 0 ? status : "Sin estado")
  );
}

export function messageStatusVariant(
  status: MessageStatus | string,
): BadgeVariant {
  return (
    MESSAGE_STATUS_VARIANTS[status as Exclude<MessageStatus, "unknown">] ??
    "neutral"
  );
}

export const MESSAGE_TYPE_LABELS: Record<string, string> = {
  first_contact: "Primer contacto",
  follow_up: "Seguimiento",
  demo_invite: "Invitación a demo",
  presentation: "Presentación comercial",
  research: "Investigación de procesos",
  meeting_proposal: "Propuesta de reunión",
  reply_suggestion: "Respuesta sugerida",
};

/** Tipos que acepta el contrato actual del backend. */
export const MESSAGE_TYPES_FOR_UI: MessageType[] = [
  "first_contact",
  "follow_up",
  "demo_invite",
];

export function messageTypeLabel(type: string): string {
  return MESSAGE_TYPE_LABELS[type] ?? (type.length > 0 ? type : "Mensaje");
}

/** Modos del proveedor en los que el envío no llega a WhatsApp real. */
export function isSimulatedWhatsAppMode(mode: string | null | undefined): boolean {
  const normalized = (mode ?? "").trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized === "console" ||
    normalized === "simulated" ||
    normalized === "log" ||
    normalized === "disabled"
  );
}

export function whatsappModeLabel(
  configured: boolean,
  mode: string,
): string {
  if (!configured) return "Sin proveedor configurado";
  const normalized = mode.trim().toLowerCase();
  if (normalized === "console" || normalized === "simulated") {
    return "Modo simulado (console)";
  }
  if (normalized === "api" || normalized === "cloud" || normalized === "live") {
    return "WhatsApp Cloud API";
  }
  return normalized.length > 0 ? mode : "Modo desconocido";
}
