import type { Customer } from "@/lib/api";
import { OPERATIONAL_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

/** Orden de columnas del tablero y del filtro de estado. */
export const BOARD_STATUS_SEQUENCE = [
  "new",
  "scheduled",
  "in_progress",
  "waiting",
  "finished",
] as const;

/** Todos los estados operativos, incluido `cancelled`. */
export const ORDER_STATUS_SEQUENCE = [...BOARD_STATUS_SEQUENCE, "cancelled"] as const;

export const STATUS_TONES: Record<string, BadgeTone> = {
  new: "neutral",
  scheduled: "info",
  in_progress: "warning",
  waiting: "teal",
  finished: "success",
  cancelled: "danger",
};

export const PRIORITY_TONES: Record<string, BadgeTone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

/** Rango de prioridad para ordenar: urgente primero. */
export const PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

/** Rango de estado para ordenar según el recorrido operativo. */
export const STATUS_ORDER: Record<string, number> = ORDER_STATUS_SEQUENCE.reduce<Record<string, number>>(
  (accumulator, status, index) => {
    accumulator[status] = index;
    return accumulator;
  },
  {},
);

export function orderStatusLabel(status: string): string {
  return OPERATIONAL_STATUS_LABELS[status] ?? status;
}

/**
 * Transiciones que el backend habilita para el rol `technician`
 * (`TECHNICIAN_TRANSITIONS` en `app/core/statuses.py`).
 */
export function technicianTransitions(status: string): string[] {
  const map: Record<string, string[]> = {
    scheduled: ["in_progress"],
    in_progress: ["waiting", "finished"],
    waiting: ["in_progress"],
  };
  return map[status] ?? [];
}

export function priorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

/** Estado comercial de la orden (`COMMERCIAL_STATUSES` en el backend). */
export const COMMERCIAL_STATUS_LABELS: Record<string, string> = {
  draft: "Sin presupuesto",
  sent: "Presupuesto enviado",
  approved: "Aprobado",
  rejected: "Rechazado",
};

export const COMMERCIAL_STATUS_TONES: Record<string, BadgeTone> = {
  draft: "neutral",
  sent: "warning",
  approved: "success",
  rejected: "danger",
};

/** Estado de pago de la orden (`PAYMENT_STATUSES` en el backend). */
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pago pendiente",
  partial: "Pago parcial",
  paid: "Pagada",
  not_applicable: "No aplica",
};

export const PAYMENT_STATUS_TONES: Record<string, BadgeTone> = {
  pending: "warning",
  partial: "info",
  paid: "success",
  not_applicable: "neutral",
};

export function commercialStatusLabel(status: string): string {
  return COMMERCIAL_STATUS_LABELS[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS[status] ?? status;
}

/**
 * La API devuelve `address`, `city`, `province` y `postal_code`
 * (`CustomerResponse` en el backend), pero el tipo `Customer` del cliente
 * todavía no los declara. Se leen de forma defensiva, sin `any`.
 */
type CustomerLocationFields = {
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
};

/** Dirección legible del cliente o `null` si no hay datos cargados. */
export function customerAddress(customer: Customer | null | undefined): string | null {
  if (!customer) {
    return null;
  }
  const location = customer as Customer & CustomerLocationFields;
  const parts = [location.address, location.city, location.province, location.postal_code]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter((part) => part.length > 0);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** Texto relativo corto para "última actualización"; cae a fecha absoluta. */
export function formatRelativeTime(value: string, now: number = Date.now()): string {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return "—";
  }
  const minutes = Math.round((now - timestamp) / 60000);
  if (minutes < 1) {
    return "recién";
  }
  if (minutes < 60) {
    return `hace ${minutes} min`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `hace ${hours} h`;
  }
  const days = Math.round(hours / 24);
  if (days < 30) {
    return `hace ${days} d`;
  }
  return formatDate(value);
}
