import { ExternalLink } from "lucide-react";
import Link from "next/link";

import { QuoteExpiry } from "@/components/quotes/quote-expiry";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import type { Quote } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

type QuoteDetailSummaryProps = {
  quote: Quote;
  customerName: string;
  tenantName: string;
};

export function QuoteDetailSummary({ quote, customerName, tenantName }: QuoteDetailSummaryProps) {
  const decision = quote.approved_at
    ? { label: "Aprobado", value: quote.approved_at }
    : quote.rejected_at
      ? { label: "Rechazado", value: quote.rejected_at }
      : null;

  return (
    <section
      aria-labelledby="quote-summary-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-2 font-mono text-[11px] font-semibold">{quote.number}</p>
          <h1 id="quote-summary-title" className="text-text text-h3 mt-1">
            Presupuesto
          </h1>
          <p className="text-text-2 mt-1 text-sm">
            {customerName} · {tenantName}
          </p>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="bg-surface-2 rounded-ds-md mt-5 flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-text-2 text-label">Total del presupuesto</p>
          <p className="text-text font-display numeric mt-1 text-3xl leading-none font-semibold tracking-tight sm:text-4xl">
            {formatCurrency(quote.total)}
          </p>
          <p className="text-text-2 mt-2 text-xs">
            {quote.items.length} {quote.items.length === 1 ? "concepto" : "conceptos"} ·{" "}
            {quote.currency}
          </p>
        </div>
        <div className="sm:text-right">
          <QuoteExpiry
            validUntil={quote.valid_until}
            status={quote.status}
            className="block text-sm"
          />
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-text-2 text-caption">Enviado</dt>
          <dd className="text-text numeric mt-0.5">
            {quote.sent_at ? formatDate(quote.sent_at) : "Sin enviar"}
          </dd>
        </div>
        <div>
          <dt className="text-text-2 text-caption">{decision?.label ?? "Respuesta"}</dt>
          <dd className="text-text numeric mt-0.5">
            {decision ? formatDate(decision.value) : "Pendiente"}
          </dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="text-text-2 text-caption">Orden asociada</dt>
          <dd className="mt-0.5">
            {quote.work_order_id ? (
              <Link
                href={`/orders/${quote.work_order_id}`}
                className="text-primary focus-visible:ring-primary inline-flex items-center gap-1 rounded-ds-sm text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Ver orden
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            ) : (
              <span className="text-text-2 text-sm">Sin orden asociada</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}
