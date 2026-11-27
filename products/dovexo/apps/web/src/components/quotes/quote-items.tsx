import type { Quote } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";

type QuoteItemsProps = {
  quote: Quote;
};

export function QuoteItems({ quote }: QuoteItemsProps) {
  const hasDiscount = Number(quote.discount_total) > 0;

  return (
    <section
      aria-labelledby="quote-items-title"
      className="border-border bg-surface rounded-ds-lg border shadow-card"
    >
      <div className="border-border border-b px-5 py-4">
        <h2 id="quote-items-title" className="text-text text-sm font-semibold">
          Conceptos
        </h2>
        <p className="text-text-2 mt-0.5 text-xs">
          Precios históricos guardados al crear el presupuesto.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left text-sm">
          <caption className="sr-only">Conceptos e importes del presupuesto</caption>
          <thead>
            <tr className="text-text-2 border-border border-b text-[11px] font-semibold tracking-wide uppercase">
              <th scope="col" className="px-4 py-3">
                Concepto
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Cant.
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                P. unitario
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Desc.
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                IVA
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {quote.items.map((item) => (
              <tr key={item.id}>
                <td className="text-text px-4 py-3 text-sm font-medium">{item.description}</td>
                <td className="text-text-2 numeric px-4 py-3 text-right text-sm">
                  {formatNumber(item.quantity)}
                </td>
                <td className="text-text-2 numeric px-4 py-3 text-right text-sm">
                  {formatCurrency(item.unit_price)}
                </td>
                <td className="text-text-2 numeric px-4 py-3 text-right text-sm">
                  {formatNumber(item.discount_rate, 2)}%
                </td>
                <td className="text-text-2 numeric px-4 py-3 text-right text-sm">
                  {formatNumber(item.tax_rate, 2)}%
                </td>
                <td className="text-text numeric px-4 py-3 text-right text-sm font-semibold">
                  {formatCurrency(item.line_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="border-border numeric space-y-1.5 border-t px-5 py-4 text-sm sm:ml-auto sm:max-w-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-text-2">Subtotal</dt>
          <dd className="text-text font-medium">{formatCurrency(quote.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-2">Descuentos</dt>
          <dd className="text-text font-medium">− {formatCurrency(quote.discount_total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-2">IVA</dt>
          <dd className="text-text font-medium">{formatCurrency(quote.tax_total)}</dd>
        </div>
        <div className="border-border flex justify-between gap-4 border-t pt-2 text-base">
          <dt className="text-text font-semibold">Total</dt>
          <dd className="text-text font-display font-semibold tracking-tight">
            {formatCurrency(quote.total)}
          </dd>
        </div>
      </dl>

      {hasDiscount && (
        <p className="text-text-2 border-border border-t px-5 py-3 text-xs">
          El total ya incluye los descuentos y el IVA informado en cada concepto.
        </p>
      )}
    </section>
  );
}
