import { ChevronRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";

import {
  formatAddress,
  formatSchedule,
  statusVariant,
  type TechnicianWorkOrderWithAddress,
} from "@/components/tech/tech-format";
import { Badge } from "@/components/ui/badge";
import { OPERATIONAL_STATUS_LABELS } from "@/lib/order-status";

type Props = {
  order: TechnicianWorkOrderWithAddress;
};

/**
 * Tarjeta compacta para la calle: cliente, servicio, horario, dirección,
 * estado y acción en un solo bloque táctil. El detalle queda al ingresar.
 */
export function TechWorkOrderCard({ order }: Props) {
  const address = formatAddress(order);
  const statusLabel =
    OPERATIONAL_STATUS_LABELS[order.operational_status] ?? order.operational_status;
  const isActive =
    order.operational_status === "in_progress" || order.operational_status === "waiting";
  const actionLabel = isActive ? "Continuar" : "Abrir";
  const schedule = formatSchedule(order.scheduled_at);

  return (
    <Link
      href={`/tech/orders/${order.id}`}
      aria-label={`${actionLabel} trabajo ${order.code}: ${order.customer_name ?? "Cliente"} · ${order.title} · ${schedule}`}
      className="group block rounded-ds-lg border border-border bg-surface p-3.5 shadow-card transition-colors hover:border-primary/40 hover:bg-surface-2/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption font-mono text-text-2">{order.code}</span>
        <Badge variant={statusVariant(order.operational_status)} className="shrink-0">
          {statusLabel}
        </Badge>
      </div>

      <h3 className="text-small mt-1 truncate font-semibold text-text">
        {order.customer_name ?? "Cliente"}
      </h3>
      <p className="text-caption truncate text-text-2">{order.title}</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="text-caption flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-text-2">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {schedule}
          </span>
          {address && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{address}</span>
            </span>
          )}
        </div>
        <span className="text-small inline-flex min-h-6 shrink-0 items-center gap-0.5 font-semibold text-primary">
          {actionLabel}
          <ChevronRight
            className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
