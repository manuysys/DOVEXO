import type { TechnicianWorkOrder } from "@/lib/api";
import { ARGENTINA_TIME_ZONE, formatDateOnly } from "@/lib/utils";

/**
 * La vista de técnico del backend agrega los datos mínimos del cliente.
 * El tipo generado todavía no los declara, así que se extiende acá sin `any`.
 */
export type TechnicianWorkOrderWithAddress = TechnicianWorkOrder & {
  customer_address?: string | null;
  customer_city?: string | null;
  customer_province?: string | null;
  customer_postal_code?: string | null;
};

export const ROLE_LABELS: Record<string, string> = {
  owner: "propietario",
  admin: "administrador",
  dispatcher: "coordinador",
  technician: "técnico",
  viewer: "consulta",
};

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ARGENTINA_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: ARGENTINA_TIME_ZONE,
});

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: ARGENTINA_TIME_ZONE,
});

const shortDayFormatter = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  timeZone: ARGENTINA_TIME_ZONE,
});

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function dayKey(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return dayFormatter.format(date);
}

export function isToday(value: string | Date): boolean {
  return dayKey(value) === dayKey(new Date());
}

export function isTomorrow(value: string | Date): boolean {
  return dayKey(value) === dayKey(new Date(Date.now() + 86_400_000));
}

export function formatTime(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return timeFormatter.format(date);
}

export function formatLongDate(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = longDateFormatter.format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatShortDay(value: string | Date): string {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return shortDayFormatter.format(date);
}

export function scheduleDayLabel(value: string | Date): string {
  if (isToday(value)) return "Hoy";
  if (isTomorrow(value)) return "Mañana";
  return formatShortDay(value);
}

export function formatSchedule(value: string | null): string {
  if (!value) return "Sin programar";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin programar";
  if (isToday(date)) return `Hoy ${formatTime(date)}`;
  if (isTomorrow(date)) return `Mañana ${formatTime(date)}`;
  return `${formatDateOnly(date)} ${formatTime(date)}`;
}

export function formatRelative(value: string | Date): string {
  const date = toDate(value);
  const diffMs = Date.now() - date.getTime();
  if (Number.isNaN(diffMs)) return "";
  if (diffMs < 60_000) return "recién";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function scheduledTime(order: TechnicianWorkOrder): number {
  if (!order.scheduled_at) return Number.POSITIVE_INFINITY;
  const time = new Date(order.scheduled_at).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

export function compareWorkOrders(a: TechnicianWorkOrder, b: TechnicianWorkOrder): number {
  const rank: Record<string, number> = {
    in_progress: 0,
    waiting: 1,
    scheduled: 2,
    new: 3,
    finished: 4,
    cancelled: 5,
  };
  const rankDiff = (rank[a.operational_status] ?? 9) - (rank[b.operational_status] ?? 9);
  if (rankDiff !== 0) return rankDiff;
  const timeDiff = scheduledTime(a) - scheduledTime(b);
  if (Number.isFinite(timeDiff) && timeDiff !== 0) return timeDiff;
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

/**
 * Elige el trabajo que el técnico debe ver primero: el que está en ejecución o,
 * si no hay ninguno, la próxima visita programada. Se calcula acá y no en el
 * componente para no leer el reloj durante el render.
 */
export function pickNextOrder(orders: TechnicianWorkOrder[]): {
  order: TechnicianWorkOrder | undefined;
  label: string;
} {
  const bySchedule = (a: TechnicianWorkOrder, b: TechnicianWorkOrder) =>
    scheduledTime(a) - scheduledTime(b);

  const active = [...orders]
    .filter((order) => order.operational_status === "in_progress")
    .sort(bySchedule)
    .at(0);
  if (active) return { order: active, label: "En curso" };

  const scheduled = orders.filter(
    (order) =>
      ["scheduled", "waiting", "new"].includes(order.operational_status) && order.scheduled_at,
  );
  const now = Date.now();
  const future = scheduled.filter((order) => scheduledTime(order) >= now);
  const pool = future.length > 0 ? future : scheduled;

  return { order: [...pool].sort(bySchedule).at(0), label: "Próximo trabajo" };
}

export function statusVariant(
  status: string,
): "neutral" | "success" | "warning" | "danger" | "info" | "teal" {
  switch (status) {
    case "scheduled":
      return "info";
    case "in_progress":
      return "warning";
    case "waiting":
      return "teal";
    case "finished":
      return "success";
    case "cancelled":
      return "danger";
    default:
      return "neutral";
  }
}

export function formatAddress(order: TechnicianWorkOrderWithAddress): string | null {
  const parts = [
    order.customer_address,
    order.customer_city,
    order.customer_province,
    order.customer_postal_code,
  ]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(", ") : null;
}

export function phoneHref(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.length >= 6 ? `tel:${digits}` : null;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.charAt(0) ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.charAt(0) ?? "") : "";
  return `${first}${last}`.toUpperCase() || "?";
}
