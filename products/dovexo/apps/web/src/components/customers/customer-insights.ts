import type {
  Appointment,
  Payment,
  QuoteSummary,
  ServiceRequest,
  WorkOrder,
} from "@/lib/api";

import type { CustomerRecord } from "./customer-labels";

/** Estados operativos que siguen abiertos para la empresa. */
const CLOSED_OPERATIONAL_STATUSES = new Set(["finished", "cancelled"]);

const RECENT_WINDOW_DAYS = 30;

export function customerOrders(orders: WorkOrder[], customerId: string): WorkOrder[] {
  return orders.filter((order) => order.customer_id === customerId);
}

export function customerRequests(
  requests: ServiceRequest[],
  customerId: string,
): ServiceRequest[] {
  return requests.filter((request) => request.customer_id === customerId);
}

export function customerQuotes(quotes: QuoteSummary[], customerId: string): QuoteSummary[] {
  return quotes.filter((quote) => quote.customer_id === customerId);
}

export function customerPayments(payments: Payment[], orders: WorkOrder[]): Payment[] {
  const orderIds = new Set(orders.map((order) => order.id));
  return payments.filter((payment) => orderIds.has(payment.work_order_id));
}

export function customerAppointments(
  appointments: Appointment[],
  orders: WorkOrder[],
): Appointment[] {
  const orderIds = new Set(orders.map((order) => order.id));
  return appointments.filter((appointment) => orderIds.has(appointment.work_order_id));
}

export function isOpenWorkOrder(order: WorkOrder): boolean {
  return !CLOSED_OPERATIONAL_STATUSES.has(order.operational_status);
}

export function openWorkOrders(orders: WorkOrder[]): WorkOrder[] {
  return orders.filter(isOpenWorkOrder);
}

/** Presupuestos enviados que todavía esperan respuesta del cliente. */
export function pendingQuotes(quotes: QuoteSummary[]): QuoteSummary[] {
  return quotes.filter((quote) => quote.status === "sent");
}

export function registeredPayments(payments: Payment[]): Payment[] {
  return payments.filter((payment) => payment.status === "registered");
}

/** Suma solo para mostrar en pantalla; no se usa para persistir importes. */
export function sumPaymentAmounts(payments: Payment[]): number {
  return payments.reduce((total, payment) => total + Number(payment.amount), 0);
}

function toTimestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** Última actividad conocida: edición del cliente, orden o presupuesto. */
export function latestActivityAt(
  customer: CustomerRecord,
  orders: WorkOrder[],
  quotes: QuoteSummary[],
): string {
  const candidates = [
    customer.updated_at,
    ...orders.map((order) => order.updated_at),
    ...quotes.map((quote) => quote.updated_at),
  ];
  return candidates.reduce(
    (latest, current) => (toTimestamp(current) > toTimestamp(latest) ? current : latest),
    customer.created_at,
  );
}

export function isRecent(customer: CustomerRecord, now: Date = new Date()): boolean {
  const createdAt = toTimestamp(customer.created_at);
  if (createdAt === 0) return false;
  const windowMs = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return now.getTime() - createdAt <= windowMs;
}

export function nextScheduledAppointment(
  appointments: Appointment[],
  now: Date = new Date(),
): Appointment | null {
  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.status === "scheduled" && toTimestamp(appointment.starts_at) >= now.getTime(),
    )
    .sort((a, b) => toTimestamp(a.starts_at) - toTimestamp(b.starts_at));
  return upcoming[0] ?? null;
}

export type CustomerInsight = {
  customerId: string;
  lastActivityAt: string;
  openOrders: number;
  totalOrders: number;
  pendingQuotes: number;
  totalQuotes: number;
};

/**
 * Construye los indicadores de la lista a partir de las órdenes y presupuestos
 * cargados. Si una lista viene truncada por paginación, el indicador refleja
 * solo lo cargado: la interfaz lo aclara.
 */
export function buildCustomerInsights(
  customers: CustomerRecord[],
  orders: WorkOrder[],
  quotes: QuoteSummary[],
): Map<string, CustomerInsight> {
  const insights = new Map<string, CustomerInsight>();
  for (const customer of customers) {
    const ownOrders = customerOrders(orders, customer.id);
    const ownQuotes = customerQuotes(quotes, customer.id);
    insights.set(customer.id, {
      customerId: customer.id,
      lastActivityAt: latestActivityAt(customer, ownOrders, ownQuotes),
      openOrders: openWorkOrders(ownOrders).length,
      totalOrders: ownOrders.length,
      pendingQuotes: pendingQuotes(ownQuotes).length,
      totalQuotes: ownQuotes.length,
    });
  }
  return insights;
}
