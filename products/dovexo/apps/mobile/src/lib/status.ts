import type { IconName } from "@/src/components/ui";

export type BadgeTone = "neutral" | "primary" | "teal" | "success" | "warning" | "danger";

export type StatusMeta = {
  label: string;
  tone: BadgeTone;
  icon: IconName;
};

const fallback = (status: string): StatusMeta => ({
  label: status,
  tone: "neutral",
  icon: "ellipse-outline",
});

export const workOrderStatuses: Record<string, StatusMeta> = {
  new: { label: "Nueva", tone: "neutral", icon: "ellipse-outline" },
  scheduled: { label: "Programada", tone: "primary", icon: "calendar-outline" },
  in_progress: { label: "En ejecución", tone: "warning", icon: "construct-outline" },
  waiting: { label: "En espera", tone: "teal", icon: "pause-circle-outline" },
  finished: { label: "Finalizada", tone: "success", icon: "checkmark-circle-outline" },
  cancelled: { label: "Cancelada", tone: "danger", icon: "close-circle-outline" },
};

export function workOrderStatusMeta(status: string): StatusMeta {
  return workOrderStatuses[status] ?? fallback(status);
}

export const quoteStatuses: Record<string, StatusMeta> = {
  draft: { label: "Borrador", tone: "neutral", icon: "document-outline" },
  sent: { label: "Pendiente", tone: "warning", icon: "hourglass-outline" },
  approved: { label: "Aprobado", tone: "success", icon: "checkmark-circle-outline" },
  rejected: { label: "Rechazado", tone: "danger", icon: "close-circle-outline" },
  expired: { label: "Vencido", tone: "neutral", icon: "time-outline" },
};

export function quoteStatusMeta(status: string): StatusMeta {
  return quoteStatuses[status] ?? fallback(status);
}

export const appointmentStatuses: Record<string, StatusMeta> = {
  scheduled: { label: "Programado", tone: "primary", icon: "calendar-outline" },
  completed: { label: "Completado", tone: "success", icon: "checkmark-circle-outline" },
  cancelled: { label: "Cancelado", tone: "danger", icon: "close-circle-outline" },
  no_show: { label: "No asistió", tone: "warning", icon: "alert-circle-outline" },
};

export function appointmentStatusMeta(status: string): StatusMeta {
  return appointmentStatuses[status] ?? fallback(status);
}

export const paymentStatuses: Record<string, StatusMeta> = {
  registered: { label: "Registrado", tone: "success", icon: "checkmark-circle-outline" },
  voided: { label: "Anulado", tone: "danger", icon: "close-circle-outline" },
};

export function paymentStatusMeta(status: string): StatusMeta {
  return paymentStatuses[status] ?? fallback(status);
}

export const paymentMethods: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  mercadopago: "Mercado Pago",
  other: "Otro",
};

export const priorities: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

export const requestStatuses: Record<string, StatusMeta> = {
  new: { label: "Recibida", tone: "primary", icon: "mail-unread-outline" },
  open: { label: "Abierta", tone: "primary", icon: "mail-unread-outline" },
  in_progress: { label: "En revisión", tone: "warning", icon: "hourglass-outline" },
  converted: { label: "Convertida en orden", tone: "success", icon: "checkmark-circle-outline" },
  closed: { label: "Cerrada", tone: "neutral", icon: "archive-outline" },
  cancelled: { label: "Cancelada", tone: "danger", icon: "close-circle-outline" },
};

export function requestStatusMeta(status: string): StatusMeta {
  return requestStatuses[status] ?? fallback(status);
}

export type TechTransition = {
  to: string;
  label: string;
  shortLabel: string;
  icon: IconName;
  tone: BadgeTone;
  confirmTitle: string;
  confirmMessage: string;
};

/**
 * Transiciones disponibles para el técnico según el estado operativo.
 * La primera es la acción principal (barra inferior fija).
 */
export const techTransitions: Record<string, TechTransition[]> = {
  scheduled: [
    {
      to: "in_progress",
      label: "Iniciar trabajo",
      shortLabel: "Iniciar",
      icon: "play",
      tone: "primary",
      confirmTitle: "¿Iniciar el trabajo?",
      confirmMessage: "Se registra el inicio en el historial de la orden.",
    },
  ],
  in_progress: [
    {
      to: "finished",
      label: "Finalizar trabajo",
      shortLabel: "Finalizar",
      icon: "checkmark-done",
      tone: "success",
      confirmTitle: "¿Finalizar el trabajo?",
      confirmMessage: "Se registra el cierre en el historial de la orden.",
    },
    {
      to: "waiting",
      label: "Poner en espera",
      shortLabel: "En espera",
      icon: "pause",
      tone: "warning",
      confirmTitle: "¿Poner el trabajo en espera?",
      confirmMessage: "Queda registrado que la visita sigue pendiente.",
    },
  ],
  waiting: [
    {
      to: "in_progress",
      label: "Reanudar trabajo",
      shortLabel: "Reanudar",
      icon: "play",
      tone: "primary",
      confirmTitle: "¿Reanudar el trabajo?",
      confirmMessage: "Se retoma la visita y queda registrado en el historial.",
    },
  ],
};

export const workOrderFilters = [
  { value: "", label: "Todas" },
  { value: "scheduled", label: "Programadas" },
  { value: "in_progress", label: "En ejecución" },
  { value: "waiting", label: "En espera" },
  { value: "finished", label: "Finalizadas" },
] as const;