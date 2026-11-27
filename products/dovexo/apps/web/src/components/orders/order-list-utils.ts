import type { WorkOrder } from "@/lib/api";

import { PRIORITY_ORDER, STATUS_ORDER } from "./order-meta";

export type OrdersView = "board" | "table";

export type OrderSortKey =
  | "code"
  | "customer"
  | "title"
  | "status"
  | "priority"
  | "technician"
  | "scheduled"
  | "updated";

export type SortDirection = "asc" | "desc";

export type OrderFilters = {
  search: string;
  status: string;
  priority: string;
  /** Id de técnico, `UNASSIGNED_TECHNICIAN` o cadena vacía para todos. */
  technicianId: string;
};

export const UNASSIGNED_TECHNICIAN = "__unassigned__";

export const EMPTY_ORDER_FILTERS: OrderFilters = {
  search: "",
  status: "",
  priority: "",
  technicianId: "",
};

export type OrderLookups = {
  /** Nombre del cliente o cadena vacía si todavía no se cargó. */
  customerName: (customerId: string) => string;
  /** Nombre del técnico; "Sin asignar" cuando no hay técnico. */
  technicianName: (userId: string | null) => string;
};

export function normalizeSearch(value: string): string {
  return value
    .toLocaleLowerCase("es-AR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function countActiveFilters(filters: OrderFilters): number {
  return [
    filters.search.trim().length > 0,
    filters.status.length > 0,
    filters.priority.length > 0,
    filters.technicianId.length > 0,
  ].filter(Boolean).length;
}

export function filterOrders(
  orders: WorkOrder[],
  filters: OrderFilters,
  lookups: OrderLookups,
): WorkOrder[] {
  const term = normalizeSearch(filters.search);

  return orders.filter((order) => {
    if (filters.status && order.operational_status !== filters.status) {
      return false;
    }
    if (filters.priority && order.priority !== filters.priority) {
      return false;
    }
    if (filters.technicianId === UNASSIGNED_TECHNICIAN && order.assigned_user_id) {
      return false;
    }
    if (
      filters.technicianId &&
      filters.technicianId !== UNASSIGNED_TECHNICIAN &&
      order.assigned_user_id !== filters.technicianId
    ) {
      return false;
    }
    if (!term) {
      return true;
    }
    const haystack = normalizeSearch(
      [
        order.code,
        order.title,
        lookups.customerName(order.customer_id),
        lookups.technicianName(order.assigned_user_id),
      ].join(" "),
    );
    return haystack.includes(term);
  });
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "es-AR", { sensitivity: "base" });
}

/** Las fechas vacías quedan siempre al final, sin importar la dirección. */
function compareNullableDate(a: string | null, b: string | null, direction: SortDirection): number {
  if (!a && !b) {
    return 0;
  }
  if (!a) {
    return 1;
  }
  if (!b) {
    return -1;
  }
  return direction === "asc" ? a.localeCompare(b) : b.localeCompare(a);
}

export function sortOrders(
  orders: WorkOrder[],
  key: OrderSortKey,
  direction: SortDirection,
  lookups: OrderLookups,
): WorkOrder[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...orders].sort((a, b) => {
    switch (key) {
      case "customer":
        return factor * compareText(lookups.customerName(a.customer_id), lookups.customerName(b.customer_id));
      case "title":
        return factor * compareText(a.title, b.title);
      case "status":
        return factor * ((STATUS_ORDER[a.operational_status] ?? 99) - (STATUS_ORDER[b.operational_status] ?? 99));
      case "priority":
        return factor * ((PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99));
      case "technician":
        return factor * compareText(lookups.technicianName(a.assigned_user_id), lookups.technicianName(b.assigned_user_id));
      case "scheduled":
        return compareNullableDate(a.scheduled_at, b.scheduled_at, direction);
      case "updated":
        return compareNullableDate(a.updated_at, b.updated_at, direction);
      case "code":
        return factor * compareText(a.code, b.code);
      default:
        return 0;
    }
  });
}

export type PageSlice<T> = {
  items: T[];
  page: number;
  pageCount: number;
  /** Primer ítem visible (1-based); 0 si la página está vacía. */
  from: number;
  /** Último ítem visible (1-based); 0 si la página está vacía. */
  to: number;
};

/** Pagina en memoria y acota la página pedida al rango válido. */
export function paginate<T>(items: T[], page: number, pageSize: number): PageSlice<T> {
  const safePageSize = Math.max(1, Math.trunc(pageSize));
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePage = Math.min(Math.max(1, Math.trunc(page)), pageCount);
  const start = (safePage - 1) * safePageSize;
  const slice = items.slice(start, start + safePageSize);

  return {
    items: slice,
    page: safePage,
    pageCount,
    from: slice.length > 0 ? start + 1 : 0,
    to: start + slice.length,
  };
}
