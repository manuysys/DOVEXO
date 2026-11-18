import { CalendarDays } from "lucide-react";
import Link from "next/link";

import {
  formatTime,
  statusVariant,
  type TechnicianWorkOrderWithAddress,
} from "@/components/tech/tech-format";
import { Badge } from "@/components/ui/badge";
import { OPERATIONAL_STATUS_LABELS } from "@/lib/order-status";

type Props = {
  orders: TechnicianWorkOrderWithAddress[];
};

export function TechAgendaList({ orders }: Props) {
  return (
    <section id="agenda" aria-labelledby="tech-agenda-title" className="scroll-mt-20 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <h2 id="tech-agenda-title" className="text-h4 text-text">
          Agenda de hoy
        </h2>
        <span className="text-caption text-text-2">
          {orders.length === 1 ? "1 visita" : `${orders.length} visitas`}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center gap-2 rounded-ds-md border border-dashed border-border bg-surface px-3">
          <CalendarDays className="h-4 w-4 shrink-0 text-text-2" aria-hidden="true" />
          <p className="text-small min-w-0 flex-1 py-2 text-text-2">
            Sin visitas para hoy. Tu agenda del día está libre.
          </p>
          <a
            href="#trabajos"
            className="text-small inline-flex min-h-11 shrink-0 items-center px-1 font-semibold text-primary hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            Ver trabajos
          </a>
        </div>
      ) : (
        <ol className="space-y-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/tech/orders/${order.id}`}
                className="flex min-h-16 items-center gap-3 rounded-ds-md border border-border bg-surface p-3 shadow-card transition-colors hover:border-primary/40 hover:bg-surface-2/50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <time
                  dateTime={order.scheduled_at ?? undefined}
                  className="numeric text-small w-12 shrink-0 font-semibold text-text"
                >
                  {order.scheduled_at ? formatTime(order.scheduled_at) : "--:--"}
                </time>
                <div className="min-w-0 flex-1">
                  <p className="text-small truncate font-semibold text-text">
                    {order.customer_name ?? "Cliente"}
                  </p>
                  <p className="text-caption truncate text-text-2">{order.title}</p>
                </div>
                <Badge variant={statusVariant(order.operational_status)} className="shrink-0">
                  {OPERATIONAL_STATUS_LABELS[order.operational_status] ?? order.operational_status}
                </Badge>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
