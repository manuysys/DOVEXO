import { ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

import {
  formatAddress,
  formatTime,
  scheduleDayLabel,
  statusVariant,
  type TechnicianWorkOrderWithAddress,
} from "@/components/tech/tech-format";
import { Badge } from "@/components/ui/badge";
import { OPERATIONAL_STATUS_LABELS } from "@/lib/order-status";

type Props = {
  order: TechnicianWorkOrderWithAddress;
  label: string;
};

export function TechNextJobCard({ order, label }: Props) {
  const address = formatAddress(order);
  const scheduled = order.scheduled_at ? new Date(order.scheduled_at) : null;
  const statusLabel =
    OPERATIONAL_STATUS_LABELS[order.operational_status] ?? order.operational_status;

  return (
    <Link
      href={`/tech/orders/${order.id}`}
      aria-label={`${label}: ${order.customer_name ?? "Cliente"} · ${order.title} · ${scheduled ? `${scheduleDayLabel(scheduled)} ${formatTime(scheduled)}` : "sin horario"}`}
      className="block rounded-ds-xl border border-deep bg-deep p-4 text-white shadow-pop transition-colors hover:bg-deep/95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-caption font-mono text-white/70">{order.code}</span>
        <Badge variant={statusVariant(order.operational_status)}>{statusLabel}</Badge>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="shrink-0 rounded-ds-md bg-white/10 px-3 py-2 text-center">
          <p className="numeric text-h4 leading-none text-white">
            {scheduled ? formatTime(scheduled) : "--:--"}
          </p>
          <p className="text-caption mt-1 text-white/75">
            {scheduled ? scheduleDayLabel(scheduled) : "Sin horario"}
          </p>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-h4 truncate text-white">{order.customer_name ?? "Cliente"}</h2>
          <p className="text-small line-clamp-2 text-white/80">{order.title}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/15 pt-3">
        <span className="text-small inline-flex min-w-0 items-center gap-1.5 text-white/80">
          <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{address ?? "Sin dirección cargada"}</span>
        </span>
        <span className="text-small inline-flex min-h-11 shrink-0 items-center gap-1 rounded-ds-md bg-white px-3 font-semibold text-deep">
          Abrir
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
