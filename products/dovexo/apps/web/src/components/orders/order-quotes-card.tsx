"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

const quoteTone: Record<string, "neutral" | "success" | "warning" | "danger"> = {
  draft: "neutral",
  sent: "warning",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
};

type OrderQuotesCardProps = {
  tenantId: string;
  orderId: string;
  enabled: boolean;
};

export function OrderQuotesCard({ tenantId, orderId, enabled }: OrderQuotesCardProps) {
  const quotesQuery = useQuery({
    queryKey: ["quotes", tenantId, ""],
    queryFn: () => api.quotes.list(tenantId),
    enabled: Boolean(tenantId) && enabled,
  });

  const quotes = (quotesQuery.data?.items ?? []).filter((quote) => quote.work_order_id === orderId);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Presupuesto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!enabled ? (
          <p className="text-text-2 text-small">Tu rol no tiene acceso a los presupuestos.</p>
        ) : quotesQuery.isLoading ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : quotesQuery.isError ? (
          <p role="alert" className="text-danger-strong text-small">
            {errorMessage(quotesQuery.error, "No se pudieron cargar los presupuestos.")}
          </p>
        ) : quotes.length === 0 ? (
          <div className="text-text-2 text-small">
            <p>Esta orden todavía no tiene presupuestos asociados.</p>
            <Link
              href="/quotes"
              className="text-primary focus-visible:ring-primary mt-2 inline-flex items-center gap-1 rounded-sm font-medium underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Ir a presupuestos
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {quotes.map((quote) => (
              <li key={quote.id}>
                <Link
                  href={`/quotes/${quote.id}`}
                  className="border-border bg-surface rounded-ds-md focus-visible:ring-primary block border p-3 transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text numeric font-mono text-caption">{quote.number}</span>
                    <Badge variant={quoteTone[quote.status] ?? "neutral"}>
                      {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                    </Badge>
                  </div>
                  <p className="text-text numeric mt-1 text-small font-semibold">
                    {formatCurrency(quote.total)}
                  </p>
                  {quote.valid_until && (
                    <p className="text-text-2 text-caption mt-0.5">
                      Válido hasta {formatDateOnly(quote.valid_until)}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
