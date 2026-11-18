"use client";

import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PendingBalance } from "@/components/payments/payment-overview";
import { formatCurrency } from "@/lib/utils";

type PendingBalancesProps = {
  items: PendingBalance[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function PendingBalances({ items, total, isLoading, isError, onRetry }: PendingBalancesProps) {
  return (
    <section
      aria-labelledby="pending-balances-title"
      className="border-warning/30 bg-warning-soft/40 rounded-ds-lg border shadow-card"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 p-5 pb-3">
        <div className="min-w-0">
          <h2
            id="pending-balances-title"
            className="text-text flex items-center gap-2 text-sm font-semibold"
          >
            <AlertTriangle className="text-warning-strong h-4 w-4" aria-hidden="true" />
            Pendientes de cobro
          </h2>
          <p className="text-text-2 mt-1 text-xs">
            Trabajos finalizados con saldo sin cobrar, ordenados por monto.
          </p>
        </div>
        {!isLoading && !isError && (
          <Badge variant="warning" className="shrink-0">
            {total} {total === 1 ? "trabajo" : "trabajos"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 px-5 pb-5" aria-busy="true">
          <span className="sr-only">Cargando saldos pendientes…</span>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="px-5 pb-5">
          <p className="text-danger-strong text-sm">No se pudieron cargar los saldos pendientes.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-text-2 px-5 pb-5 text-sm">
          No hay saldos pendientes. Todo lo finalizado está cobrado.
        </p>
      ) : (
        <ul className="divide-warning/20 border-warning/20 divide-y border-t">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/orders/${item.id}`}
                className="hover:bg-warning-soft/70 flex flex-col gap-1 px-5 py-3 transition-colors focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-text truncate text-sm font-semibold">
                    {item.code} · {item.title}
                  </p>
                  <p className="text-text-2 mt-0.5 text-xs">
                    {item.customer_name} · Pagado {formatCurrency(item.paid)} de{" "}
                    {formatCurrency(item.total)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <p className="text-danger-strong numeric text-sm font-semibold">
                    {formatCurrency(item.balance)}
                  </p>
                  <ArrowRight className="text-text-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
