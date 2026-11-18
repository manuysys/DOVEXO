import { CalendarClock, ExternalLink, MapPin, Phone } from "lucide-react";

import {
  formatAddress,
  formatSchedule,
  phoneHref,
  statusVariant,
  type TechnicianWorkOrderWithAddress,
} from "@/components/tech/tech-format";
import { Badge } from "@/components/ui/badge";
import { OPERATIONAL_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/order-status";

type Props = {
  order: TechnicianWorkOrderWithAddress;
};

export function TechOrderSummary({ order }: Props) {
  const address = formatAddress(order);
  const phoneLabel = order.customer_phone?.trim() || null;
  const phone = phoneHref(phoneLabel);
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : null;

  return (
    <section
      aria-labelledby="tech-order-title"
      className="overflow-hidden rounded-ds-xl border border-border bg-surface shadow-card"
    >
      <div className="border-b border-border p-4">
        <div className="flex flex-wrap items-center gap-2" aria-live="polite">
          <Badge variant={statusVariant(order.operational_status)}>
            {OPERATIONAL_STATUS_LABELS[order.operational_status] ?? order.operational_status}
          </Badge>
          <span className="text-caption text-text-2">
            Prioridad {PRIORITY_LABELS[order.priority] ?? order.priority}
          </span>
        </div>
        <p className="text-caption mt-2 font-mono text-text-2">{order.code}</p>
        <h1 id="tech-order-title" className="text-h3 mt-0.5 text-text">
          {order.title}
        </h1>
        <p className="text-small mt-1 flex items-center gap-1.5 text-text-2">
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          <time dateTime={order.scheduled_at ?? undefined}>
            {formatSchedule(order.scheduled_at)}
          </time>
        </p>
      </div>

      <div className="p-4">
        <h2 className="text-label text-text-2">Cliente</h2>
        <p className="text-h4 mt-1 text-text">{order.customer_name ?? "Cliente sin nombre"}</p>
        {phone ? (
          <a
            href={phone}
            className="text-small mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-ds-md border border-border bg-surface px-4 font-semibold text-text transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Phone className="h-4 w-4" aria-hidden="true" />
            Llamar a {phoneLabel}
          </a>
        ) : (
          <p className="text-small mt-2 text-text-2">
            {phoneLabel ?? "El cliente no tiene teléfono cargado."}
          </p>
        )}

        <div className="mt-4">
          <h2 className="text-label text-text-2">Dirección</h2>
          {address ? (
            <p className="text-small mt-1 flex items-start gap-1.5 text-text">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-2" aria-hidden="true" />
              <span className="break-words">{address}</span>
            </p>
          ) : (
            <p className="text-small mt-1 text-text-2">Sin dirección cargada.</p>
          )}
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-small mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary hover:underline"
            >
              Abrir en Maps
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      {order.description && (
        <div className="border-t border-border bg-surface-2/50 p-4">
          <h2 className="text-label text-text-2">Instrucciones</h2>
          <p className="text-small mt-1 whitespace-pre-line text-text">{order.description}</p>
        </div>
      )}
    </section>
  );
}
