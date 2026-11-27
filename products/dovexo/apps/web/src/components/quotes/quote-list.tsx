import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { QuoteExpiry } from "@/components/quotes/quote-expiry";
import { QuoteStatusBadge } from "@/components/quotes/quote-status-badge";
import type { QuoteSummary } from "@/lib/api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

type QuoteListProps = {
  quotes: QuoteSummary[];
  customerName: (customerId: string) => string;
};

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-ds-sm";

export function QuoteList({ quotes, customerName }: QuoteListProps) {
  return (
    <>
      {/* Escritorio: tabla comparable por columna. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <caption className="sr-only">Presupuestos de la empresa</caption>
          <thead>
            <tr className="border-border text-text-2 border-b text-[11px] font-semibold tracking-wide uppercase">
              <th scope="col" className="px-4 py-3">
                Número
              </th>
              <th scope="col" className="px-4 py-3">
                Cliente
              </th>
              <th scope="col" className="px-4 py-3">
                Emitido
              </th>
              <th scope="col" className="px-4 py-3">
                Vencimiento
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Importe
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {quotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-surface-2/60 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className={`text-text hover:text-primary font-mono text-xs font-semibold ${linkFocus}`}
                  >
                    {quote.number}
                  </Link>
                </td>
                <td className="text-text max-w-[220px] truncate px-4 py-3 text-sm">
                  {customerName(quote.customer_id)}
                </td>
                <td className="text-text-2 numeric px-4 py-3 text-xs">
                  {formatDateOnly(quote.created_at)}
                </td>
                <td className="px-4 py-3">
                  <QuoteExpiry validUntil={quote.valid_until} status={quote.status} />
                </td>
                <td className="px-4 py-3">
                  <QuoteStatusBadge status={quote.status} />
                </td>
                <td className="text-text numeric px-4 py-3 text-right text-sm font-semibold">
                  {formatCurrency(quote.total)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className={`text-text-2 hover:text-primary hover:bg-surface-2 inline-flex min-h-9 items-center gap-1 rounded-ds-md px-2 text-xs font-semibold ${linkFocus}`}
                  >
                    Ver
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: una tarjeta por presupuesto, con el importe primero. */}
      <ul className="divide-border divide-y md:hidden">
        {quotes.map((quote) => (
          <li key={quote.id}>
            <Link
              href={`/quotes/${quote.id}`}
              className="hover:bg-surface-2/60 block px-4 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text-2 font-mono text-[11px] font-semibold">{quote.number}</p>
                  <p className="text-text mt-0.5 truncate text-sm font-semibold">
                    {customerName(quote.customer_id)}
                  </p>
                </div>
                <QuoteStatusBadge status={quote.status} className="shrink-0" />
              </div>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-text-2 numeric text-xs">
                    Emitido {formatDateOnly(quote.created_at)}
                  </p>
                  <QuoteExpiry
                    validUntil={quote.valid_until}
                    status={quote.status}
                    className="mt-0.5 block"
                  />
                </div>
                <p className="text-text numeric font-display shrink-0 text-lg font-semibold tracking-tight">
                  {formatCurrency(quote.total)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
