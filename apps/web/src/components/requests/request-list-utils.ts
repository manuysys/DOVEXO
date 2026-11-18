import type { ServiceRequest } from "@/lib/api";

/**
 * Reutiliza el normalizador y el paginador del listado de órdenes para no
 * duplicar la lógica de búsqueda y paginación en memoria.
 */
import {
  normalizeSearch,
  paginate,
  type PageSlice,
  type SortDirection,
} from "@/components/orders/order-list-utils";

export type { PageSlice, SortDirection };

export type RequestSortKey = "title" | "customer" | "priority" | "source" | "status" | "created";

export type RequestFilters = {
  search: string;
  status: string;
  priority: string;
  source: string;
};

export const EMPTY_REQUEST_FILTERS: RequestFilters = {
  search: "",
  status: "",
  priority: "",
  source: "",
};

export const REQUEST_STATUS_SEQUENCE = ["new", "triaged", "converted", "closed"] as const;

export const REQUEST_SOURCE_SEQUENCE = ["whatsapp", "phone", "email", "web", "manual"] as const;

export const REQUEST_SOURCE_LABELS: Record<string, string> = {
  manual: "Carga manual",
  whatsapp: "WhatsApp",
  phone: "Teléfono",
  email: "Email",
  web: "Formulario web",
};

export const REQUEST_PRIORITY_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const REQUEST_STATUS_ORDER: Record<string, number> = {
  new: 0,
  triaged: 1,
  converted: 2,
  closed: 3,
};

export type RequestLookups = {
  customerName: (customerId: string) => string;
};

export function sourceLabel(source: string): string {
  return REQUEST_SOURCE_LABELS[source] ?? source;
}

export function filterRequests(
  requests: ServiceRequest[],
  filters: RequestFilters,
  lookups: RequestLookups,
): ServiceRequest[] {
  const term = normalizeSearch(filters.search);

  return requests.filter((request) => {
    if (filters.status && request.status !== filters.status) {
      return false;
    }
    if (filters.priority && request.priority !== filters.priority) {
      return false;
    }
    if (filters.source && request.source !== filters.source) {
      return false;
    }
    if (!term) {
      return true;
    }
    const haystack = normalizeSearch(
      [
        request.title,
        request.description ?? "",
        lookups.customerName(request.customer_id),
        sourceLabel(request.source),
      ].join(" "),
    );
    return haystack.includes(term);
  });
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, "es-AR", { sensitivity: "base" });
}

export function sortRequests(
  requests: ServiceRequest[],
  key: RequestSortKey,
  direction: SortDirection,
  lookups: RequestLookups,
): ServiceRequest[] {
  const factor = direction === "asc" ? 1 : -1;

  return [...requests].sort((a, b) => {
    switch (key) {
      case "customer":
        return factor * compareText(lookups.customerName(a.customer_id), lookups.customerName(b.customer_id));
      case "priority":
        return (
          factor * ((REQUEST_PRIORITY_ORDER[a.priority] ?? 99) - (REQUEST_PRIORITY_ORDER[b.priority] ?? 99))
        );
      case "source":
        return factor * compareText(sourceLabel(a.source), sourceLabel(b.source));
      case "status":
        return factor * ((REQUEST_STATUS_ORDER[a.status] ?? 99) - (REQUEST_STATUS_ORDER[b.status] ?? 99));
      case "created":
        return direction === "asc"
          ? a.created_at.localeCompare(b.created_at)
          : b.created_at.localeCompare(a.created_at);
      case "title":
        return factor * compareText(a.title, b.title);
      default:
        return 0;
    }
  });
}

export { paginate };

export function countActiveRequestFilters(filters: RequestFilters): number {
  return [
    filters.search.trim().length > 0,
    filters.status.length > 0,
    filters.priority.length > 0,
    filters.source.length > 0,
  ].filter(Boolean).length;
}
