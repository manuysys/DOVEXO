/**
 * Etiquetas y utilidades de presentación del portal del cliente.
 *
 * Se mantienen fuera de `lib/order-status.ts` para no mezclar el vocabulario
 * interno del panel con el que ve el cliente final.
 */
import { ARGENTINA_TIME_ZONE } from "@/lib/utils";

export type PortalTone = "neutral" | "success" | "warning" | "danger" | "info" | "teal";

export type PortalTab = "home" | "requests" | "orders" | "appointments" | "quotes" | "payments";

type PortalStatus = { label: string; tone: PortalTone };

const REQUEST_STATUS: Record<string, PortalStatus> = {
  new: { label: "Recibida", tone: "info" },
  triaged: { label: "En revisión", tone: "warning" },
  converted: { label: "En curso", tone: "success" },
  closed: { label: "Cerrada", tone: "neutral" },
};

const ORDER_STATUS: Record<string, PortalStatus> = {
  new: { label: "Recibida", tone: "info" },
  scheduled: { label: "Programada", tone: "info" },
  in_progress: { label: "En ejecución", tone: "warning" },
  waiting: { label: "En espera", tone: "warning" },
  finished: { label: "Finalizada", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

const APPOINTMENT_STATUS: Record<string, PortalStatus> = {
  scheduled: { label: "Agendada", tone: "info" },
  completed: { label: "Realizada", tone: "success" },
  cancelled: { label: "Cancelada", tone: "neutral" },
};

const QUOTE_STATUS: Record<string, PortalStatus> = {
  draft: { label: "En preparación", tone: "neutral" },
  sent: { label: "Pendiente de respuesta", tone: "warning" },
  approved: { label: "Aprobado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
  expired: { label: "Vencido", tone: "neutral" },
};

const PAYMENT_STATUS: Record<string, PortalStatus> = {
  registered: { label: "Registrado", tone: "success" },
  voided: { label: "Anulado", tone: "danger" },
};

const PAYMENT_METHOD: Record<string, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  mercadopago: "Mercado Pago",
  other: "Otro",
};

const PRIORITY: Record<string, string> = {
  low: "Prioridad baja",
  normal: "Prioridad normal",
  high: "Prioridad alta",
  urgent: "Urgente",
};

function resolve(map: Record<string, PortalStatus>, status: string): PortalStatus {
  return map[status] ?? { label: status, tone: "neutral" };
}

export function portalRequestStatus(status: string) {
  return resolve(REQUEST_STATUS, status);
}

export function portalOrderStatus(status: string) {
  return resolve(ORDER_STATUS, status);
}

export function portalAppointmentStatus(status: string) {
  return resolve(APPOINTMENT_STATUS, status);
}

export function portalQuoteStatus(status: string) {
  return resolve(QUOTE_STATUS, status);
}

export function portalPaymentStatus(status: string) {
  return resolve(PAYMENT_STATUS, status);
}

export function portalPaymentMethod(method: string) {
  return PAYMENT_METHOD[method] ?? method;
}

export function portalPriorityLabel(priority: string) {
  return PRIORITY[priority] ?? priority;
}

/** Un trabajo sigue activo mientras no esté finalizado ni cancelado. */
export function isActiveOrder(order: { operational_status: string }) {
  return order.operational_status !== "finished" && order.operational_status !== "cancelled";
}

const ORDER_STEPS = ["Recibida", "Programada", "En curso", "Finalizada"] as const;

const ORDER_STEP_INDEX: Partial<Record<string, number>> = {
  new: 0,
  scheduled: 1,
  in_progress: 2,
  waiting: 2,
  finished: 3,
};

/** Etapa del trabajo para mostrar un avance simple al cliente. */
export function portalOrderProgress(status: string) {
  const index = ORDER_STEP_INDEX[status];
  if (index === undefined) return null;
  return { step: index, total: ORDER_STEPS.length, label: ORDER_STEPS[index] };
}

const DATE_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ARGENTINA_TIME_ZONE,
});

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * Clave de día calendario (`YYYY-MM-DD`). Las fechas sin hora (`2026-11-20`) se
 * toman como fecha civil: interpretarlas como UTC las correría un día en
 * Argentina y adelantaría el vencimiento.
 */
function civilDayKey(value: string | Date): string {
  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) return value;
  return DATE_KEY_FORMAT.format(typeof value === "string" ? new Date(value) : value);
}

function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(
    (Date.parse(`${toKey}T00:00:00Z`) - Date.parse(`${fromKey}T00:00:00Z`)) / DAY_MS,
  );
}

/**
 * Un presupuesto enviado con fecha límite pasada ya no se puede responder,
 * aunque el backend todavía no lo haya marcado como vencido.
 */
export function isPortalQuoteExpired(quote: { status: string; valid_until: string | null }) {
  if (quote.status === "expired") return true;
  if (!quote.valid_until) return false;
  return civilDayKey(quote.valid_until) < civilDayKey(new Date());
}

/**
 * Días calendario que faltan para el vencimiento. `0` es hoy, negativo es
 * vencido y `null` significa que el presupuesto no vence.
 */
export function portalQuoteDaysLeft(quote: {
  status: string;
  valid_until: string | null;
}): number | null {
  if (!quote.valid_until) return null;
  return daysBetween(civilDayKey(new Date()), civilDayKey(quote.valid_until));
}

/**
 * Suma importes expresados como texto decimal. Opera en centavos enteros para
 * no acumular error de punto flotante; el backend sigue siendo la fuente de
 * verdad de los totales.
 */
export function sumCurrency(values: string[]): string {
  const cents = values.reduce((total, value) => total + Math.round(Number(value) * 100), 0);
  return (cents / 100).toFixed(2);
}

/** Nombre corto para saludar sin invadir: solo la primera palabra. */
export function shortName(fullName: string) {
  const [first] = fullName.trim().split(/\s+/);
  return first && first.length > 1 ? first : fullName.trim();
}

/** Etiqueta corta de cercanía: "Hoy", "Mañana" o "En 3 días". */
export function portalDayHint(value: string): string | null {
  const diff = daysBetween(civilDayKey(new Date()), civilDayKey(value));
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff > 1 && diff <= 7) return `En ${diff} días`;
  return null;
}

/**
 * Aviso de vencimiento próximo para presupuestos pendientes. Devuelve `null`
 * cuando falta más de tres días o el presupuesto ya no espera respuesta.
 */
export function portalQuoteExpiryNote(quote: {
  status: string;
  valid_until: string | null;
}): string | null {
  if (quote.status !== "sent") return null;
  const days = portalQuoteDaysLeft(quote);
  if (days === null || days < 0) return null;
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  if (days <= 3) return `Vence en ${days} días`;
  return null;
}

export function formatPortalDay(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatPortalTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(new Date(value));
}

export function formatPortalTimeRange(startsAt: string, endsAt: string) {
  return `${formatPortalTime(startsAt)} a ${formatPortalTime(endsAt)}`;
}

/** Fecha y hora cortas para listas: "18/11/2026, 10:00". */
export function formatPortalDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: ARGENTINA_TIME_ZONE,
  }).format(new Date(value));
}
