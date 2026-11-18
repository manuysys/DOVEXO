import type { Customer } from "@/lib/api";

/**
 * El backend ya devuelve dirección, ciudad, provincia y código postal, pero el
 * tipo `Customer` del cliente API todavía no los declara. Se extienden acá para
 * no tocar el cliente compartido desde el módulo de clientes.
 */
export type CustomerRecord = Customer & {
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
};

const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  inactive: "Inactivo",
  archived: "Archivado",
};

export type CustomerStatusVariant = "success" | "warning" | "neutral";

export function customerStatusLabel(status: string): string {
  return CUSTOMER_STATUS_LABELS[status] ?? status;
}

export function customerStatusVariant(status: string): CustomerStatusVariant {
  if (status === "active") return "success";
  if (status === "inactive") return "warning";
  return "neutral";
}

export function customerInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/** Dirección en una línea, sin inventar datos faltantes. */
export function customerAddress(customer: CustomerRecord): string | null {
  const line = [customer.address, customer.city, customer.province]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
  const postal = customer.postal_code?.trim();
  const parts = [line, postal ? `CP ${postal}` : null].filter(
    (part): part is string => Boolean(part),
  );
  return parts.length > 0 ? parts.join(" · ") : null;
}

/** `tel:` solo con dígitos y el prefijo internacional. */
export function customerPhoneHref(phone: string): string {
  const sanitized = phone.replace(/[^\d+]/g, "");
  return `tel:${sanitized}`;
}
