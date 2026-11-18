import type { TechWorkOrder } from "@/src/lib/types";

/** Dirección completa del cliente tal como la ve el técnico. */
export function orderAddress(
  order: Pick<
    TechWorkOrder,
    "customer_address" | "customer_city" | "customer_province" | "customer_postal_code"
  >,
): string {
  return [
    order.customer_address,
    order.customer_city,
    order.customer_province,
    order.customer_postal_code,
  ]
    .filter(Boolean)
    .join(", ");
}