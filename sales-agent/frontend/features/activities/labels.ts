export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  note: "Nota",
  status_change: "Cambio de estado",
  status: "Cambio de estado",
  message_generated: "Mensaje generado",
  message_sent: "Mensaje enviado",
  message_approved: "Mensaje aprobado",
  reply: "Respuesta",
  meeting: "Reunión",
  call: "Llamada",
  email: "Email",
  follow_up: "Seguimiento",
  whatsapp_inbound: "WhatsApp recibido",
  whatsapp_outbound: "WhatsApp enviado",
  scoring: "Scoring",
  other: "Otro",
};

/** Tipos que se pueden registrar a mano desde el CRM. */
export const ACTIVITY_TYPES_FOR_UI = [
  "note",
  "follow_up",
  "meeting",
  "call",
  "email",
  "other",
] as const;

export function activityTypeLabel(type: string): string {
  return ACTIVITY_TYPE_LABELS[type] ?? (type.length > 0 ? type : "Actividad");
}
