import { Building2, CheckCircle2, Clock, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { errorMessage, type AdminMetrics } from "@/lib/api";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

type AdminMetricsSectionProps = {
  metrics: AdminMetrics | undefined;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

export function AdminMetricsSection({
  metrics,
  loading,
  error,
  onRetry,
}: AdminMetricsSectionProps) {
  if (loading) {
    return (
      <section aria-labelledby="metrics-title">
        <h2 id="metrics-title" className="sr-only">
          Métricas globales
        </h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div className="border-border bg-surface rounded-ds-lg border p-5">
        <p role="alert" className="text-danger text-sm">
          {errorMessage(error, "No se pudieron cargar las métricas.")}
        </p>
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!metrics) return null;

  const otherSubscriptions = Math.max(
    0,
    metrics.tenants_total - metrics.active_subscriptions - metrics.trialing_subscriptions,
  );
  const segments = [
    {
      label: "Activas",
      value: metrics.active_subscriptions,
      className: "bg-success",
    },
    {
      label: "En prueba",
      value: metrics.trialing_subscriptions,
      className: "bg-warning",
    },
    {
      label: "Otras o sin suscripción",
      value: otherSubscriptions,
      className: "bg-surface-2",
    },
  ].filter((segment) => segment.value > 0);

  return (
    <section aria-labelledby="metrics-title" className="space-y-3">
      <h2 id="metrics-title" className="sr-only">
        Métricas globales
      </h2>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="MRR"
          value={
            <span className="text-lg whitespace-nowrap sm:text-2xl">
              {formatCurrency(metrics.mrr_ars)}
            </span>
          }
          hint="Ingreso recurrente mensual"
          icon={Wallet}
          tone="teal"
        />
        <StatCard
          label="Empresas"
          value={formatNumber(metrics.tenants_total, 0)}
          hint="Tenants registrados"
          icon={Building2}
          tone="default"
        />
        <StatCard
          label="Suscripciones activas"
          value={formatNumber(metrics.active_subscriptions, 0)}
          hint="Con contrato vigente"
          icon={CheckCircle2}
          tone="default"
        />
        <StatCard
          label="En prueba"
          value={formatNumber(metrics.trialing_subscriptions, 0)}
          hint="Trial de 14 días"
          icon={Clock}
          tone="amber"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="border-border bg-surface rounded-ds-lg border p-4">
          <p className="text-text-2 text-label">Órdenes totales</p>
          <p className="text-text font-display numeric mt-2 text-xl font-semibold">
            {formatNumber(metrics.orders_total, 0)}
          </p>
        </div>
        <div className="border-border bg-surface rounded-ds-lg border p-4">
          <p className="text-text-2 text-label">Órdenes este mes</p>
          <p className="text-text font-display numeric mt-2 text-xl font-semibold">
            {formatNumber(metrics.orders_this_month, 0)}
          </p>
        </div>
        <div className="border-border bg-surface rounded-ds-lg border p-4">
          <p className="text-text-2 text-label">Tokens de IA este mes</p>
          <p className="text-text font-display numeric mt-2 text-xl font-semibold">
            {formatNumber(metrics.ai_tokens_this_month, 0)}
          </p>
        </div>
      </div>

      {metrics.tenants_total > 0 && segments.length > 0 && (
        <div className="border-border bg-surface rounded-ds-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-text text-sm font-semibold">Composición de suscripciones</p>
            <p className="text-text-2 text-xs">
              {formatNumber(metrics.tenants_total, 0)} empresa(s)
            </p>
          </div>
          <div
            aria-hidden="true"
            className="bg-surface-2 mt-3 flex h-2.5 w-full overflow-hidden rounded-full"
          >
            {segments.map((segment) => (
              <span
                key={segment.label}
                className={cn("h-full", segment.className)}
                style={{ width: `${(segment.value / metrics.tenants_total) * 100}%` }}
              />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            {segments.map((segment) => (
              <li key={segment.label} className="text-text-2 flex items-center gap-1.5 text-xs">
                <span
                  aria-hidden="true"
                  className={cn("border-border h-2.5 w-2.5 rounded-full border", segment.className)}
                />
                {segment.label}:{" "}
                <span className="text-text numeric font-medium">
                  {formatNumber(segment.value, 0)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
