"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, CreditCard, RefreshCw, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLAN_LIMIT_ITEMS,
  SUBSCRIPTION_STATUS_LABELS,
  isSubscriptionStatus,
  periodLabel,
} from "@/lib/billing";
import { api, errorMessage, type Plan, type SubscriptionDetail } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { readLimit, usagePercent } from "@/lib/usage";
import { cn, formatCurrency, formatDateOnly, formatNumber } from "@/lib/utils";

const ADMIN_ROLES = ["owner", "admin"];

const STATUS_VARIANTS = {
  trialing: "info",
  active: "success",
  past_due: "warning",
  cancelled: "neutral",
} as const;

export default function BillingPage() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const [pendingPlan, setPendingPlan] = useState<Plan | null>(null);
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManage = ADMIN_ROLES.includes(activeTenant?.role ?? "");

  const subscriptionQuery = useQuery({
    queryKey: ["billing-subscription", activeTenantId],
    queryFn: () => api.billing.subscription(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  const plansQuery = useQuery({
    queryKey: ["billing-plans", activeTenantId],
    queryFn: () => api.billing.plans(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  const changePlanMutation = useMutation({
    mutationFn: (planCode: string) => api.billing.changePlan(activeTenantId ?? "", planCode),
    onSuccess: () => {
      setPendingPlan(null);
      void queryClient.invalidateQueries({ queryKey: ["billing-subscription"] });
      void queryClient.invalidateQueries({ queryKey: ["billing-plans"] });
    },
  });

  if (!activeTenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="bg-warning-soft text-warning-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-text text-sm font-semibold">
            Solo los administradores pueden ver la facturación
          </p>
          <p className="text-text-2 mt-1 text-sm">
            Pedile al propietario o a un administrador de {activeTenant?.name ?? "la empresa"} que
            revise el plan y los límites.
          </p>
        </div>
      </Card>
    );
  }

  const detail = subscriptionQuery.data;
  const plans = plansQuery.data ?? [];
  const currentPlanCode = detail?.subscription.plan.code;
  const availablePlans = plans.filter(
    (plan) => plan.active || plan.code === currentPlanCode,
  );
  const isOwner = activeTenant?.role === "owner";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="Facturación"
        description={`Plan, uso y límites de ${activeTenant?.name ?? "tu empresa"}. Precios en pesos argentinos.`}
      />

      <p
        role="note"
        className="bg-info-soft text-info-strong rounded-ds-md border-info/25 border px-4 py-3 text-sm"
      >
        Este panel no procesa pagos. Cambiar de plan registra el precio contratado y los límites; el
        cobro automático todavía no está habilitado.
      </p>

      {subscriptionQuery.isLoading ? (
        <PlanSkeleton />
      ) : subscriptionQuery.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-danger-strong text-sm">
            {errorMessage(subscriptionQuery.error, "No se pudo cargar la suscripción.")}
          </p>
          <Button variant="outline" onClick={() => void subscriptionQuery.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </Card>
      ) : detail ? (
        <>
          <CurrentPlanCard detail={detail} />
          <UsageSection detail={detail} />
        </>
      ) : (
        <Card className="p-6 text-sm text-text-2">
          Todavía no hay una suscripción registrada para esta empresa. Elegí un plan abajo.
        </Card>
      )}

      <section aria-labelledby="plans-title" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="plans-title" className="text-text font-display text-xl font-semibold">
              Planes disponibles
            </h2>
            <p className="text-text-2 mt-1 text-sm">
              Compará límites antes de cambiar. El precio contratado queda registrado.
            </p>
          </div>
          {!isOwner && (
            <p className="text-text-2 text-sm">Solo el propietario puede cambiar de plan.</p>
          )}
        </div>

        {changePlanMutation.error && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
            {errorMessage(changePlanMutation.error, "No se pudo cambiar el plan.")}
          </p>
        )}

        {pendingPlan && (
          <section
            aria-labelledby="confirm-plan-title"
            className="border-warning/40 bg-warning-soft rounded-ds-lg border p-5"
          >
            <h3 id="confirm-plan-title" className="text-warning-strong text-sm font-semibold">
              Confirmar cambio de plan
            </h3>
            <p className="text-warning-strong mt-1 text-sm">
              Vas a cambiar a <strong>{pendingPlan.name}</strong> por{" "}
              <span className="numeric font-semibold">
                {formatCurrency(pendingPlan.price_ars)}
              </span>{" "}
              por {periodLabel(pendingPlan.billing_period)}. Los nuevos límites aplican desde este
              momento.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setPendingPlan(null)}
                disabled={changePlanMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => changePlanMutation.mutate(pendingPlan.code)}
                disabled={changePlanMutation.isPending || !isOwner}
              >
                {changePlanMutation.isPending ? "Cambiando..." : "Confirmar cambio"}
              </Button>
            </div>
          </section>
        )}

        {plansQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PlanCardSkeleton key={index} />
            ))}
          </div>
        ) : plansQuery.isError ? (
          <Card className="space-y-4 p-6">
            <p role="alert" className="text-danger-strong text-sm">
              {errorMessage(plansQuery.error, "No se pudieron cargar los planes.")}
            </p>
            <Button variant="outline" onClick={() => void plansQuery.refetch()}>
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          </Card>
        ) : availablePlans.length === 0 ? (
          <Card className="p-6 text-sm text-text-2">
            No hay planes disponibles para cambiar en este momento. Si necesitás otro plan,
            escribinos.
          </Card>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availablePlans.map((plan) => {
              const isCurrent = plan.code === currentPlanCode;
              return (
                <li
                  key={plan.id}
                  className={cn(
                    "bg-surface flex flex-col rounded-ds-lg border p-5",
                    isCurrent ? "border-primary shadow-raised" : "border-border shadow-card",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-text text-base font-semibold">{plan.name}</h3>
                      <p className="text-text-2 mt-0.5 font-mono text-xs">{plan.code}</p>
                    </div>
                    {isCurrent && <Badge variant="info">Plan actual</Badge>}
                  </div>

                  <p className="text-text numeric mt-4 flex items-baseline gap-1 font-display text-2xl font-semibold">
                    {formatCurrency(plan.price_ars)}
                    <span className="text-text-2 font-sans text-sm font-normal">
                      / {periodLabel(plan.billing_period)}
                    </span>
                  </p>

                  <PlanLimitsList limits={plan.limits} />

                  <div className="mt-auto pt-5">
                    {isCurrent ? (
                      <Button variant="outline" className="w-full" disabled>
                        Plan actual
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="hover:border-primary/40 hover:bg-primary/5 w-full"
                        onClick={() => setPendingPlan(plan)}
                        disabled={!isOwner || changePlanMutation.isPending}
                      >
                        Cambiar a este plan
                      </Button>
                    )}
                    {!isOwner && !isCurrent && (
                      <p className="text-text-2 mt-2 text-center text-xs">
                        Solo el propietario puede confirmarlo.
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (!isSubscriptionStatus(status)) {
    return <Badge variant="neutral">{status}</Badge>;
  }
  return <Badge variant={STATUS_VARIANTS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>;
}

function CurrentPlanCard({ detail }: { detail: SubscriptionDetail }) {
  const { subscription } = detail;
  return (
    <section
      aria-labelledby="current-plan-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p
            id="current-plan-title"
            className="text-text-2 text-label flex items-center gap-2"
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            Plan actual
          </p>
          <p className="text-text font-display mt-2 text-2xl font-semibold tracking-tight">
            {subscription.plan.name}
          </p>
          <p className="text-text-2 mt-1 text-sm">
            <span className="numeric text-text font-semibold">
              {formatCurrency(subscription.plan.price_ars)}
            </span>{" "}
            por {periodLabel(subscription.plan.billing_period)} · precio de lista
          </p>
        </div>

        <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-text-2 text-xs">Estado</dt>
            <dd className="mt-1">
              <StatusBadge status={subscription.status} />
            </dd>
          </div>
          <div>
            <dt className="text-text-2 text-xs">
              {subscription.status === "trialing" ? "Prueba hasta" : "Período hasta"}
            </dt>
            <dd className="text-text mt-1 font-medium">
              {subscription.current_period_end
                ? formatDateOnly(subscription.current_period_end)
                : "Sin fecha"}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-text-2 text-xs">Inicio</dt>
            <dd className="text-text mt-1 font-medium">
              {subscription.started_at ? formatDateOnly(subscription.started_at) : "Sin fecha"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

function UsageSection({ detail }: { detail: SubscriptionDetail }) {
  const { usage, subscription } = detail;
  return (
    <section
      aria-labelledby="usage-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="usage-title" className="text-text text-sm font-semibold">
            Uso frente a los límites del plan
          </h2>
          <p className="text-text-2 mt-1 text-sm">
            Se calcula con los datos actuales de la empresa.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {PLAN_LIMIT_ITEMS.map((item) => {
          const used = usage[item.usageKey];
          const limit = readLimit(subscription.plan.limits, item.key);
          return <UsageBar key={item.key} label={item.label} used={used} limit={limit} />;
        })}
      </div>
      <p className="border-border text-text-2 mt-5 border-t pt-4 text-sm">
        El asistente de IA está incluido en todos los planes; el consumo se mide internamente.
        Los usuarios de oficina incluyen al dueño y no cuentan a los técnicos.
      </p>
    </section>
  );
}

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const percent = usagePercent(used, limit);
  const overLimit = limit !== null && used >= limit;
  const nearLimit = percent !== null && percent >= 80;
  const text =
    limit === null
      ? `${formatNumber(used, 0)} · sin límite`
      : `${formatNumber(used, 0)} de ${formatNumber(limit, 0)}`;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-text font-medium">{label}</span>
        <span className="text-text-2 numeric text-xs">{text}</span>
      </div>
      {percent !== null ? (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-valuetext={`${percent}% usado: ${text}`}
          className="bg-surface-2 mt-2 h-2 w-full overflow-hidden rounded-full"
        >
          <div
            className={cn(
              "h-full rounded-full",
              overLimit ? "bg-danger" : nearLimit ? "bg-warning" : "bg-primary",
            )}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <div className="bg-surface-2 mt-2 h-2 w-full rounded-full" aria-hidden="true" />
      )}
      {overLimit && (
        <p className="text-warning-strong mt-1.5 text-xs">
          El uso alcanzó el límite del plan. Cambiá de plan para ampliarlo.
        </p>
      )}
    </div>
  );
}

function PlanLimitsList({ limits }: { limits: Record<string, unknown> | null }) {
  return (
    <ul className="border-border mt-4 space-y-2 border-t pt-4 text-sm">
      {PLAN_LIMIT_ITEMS.map((item) => {
        const limit = readLimit(limits, item.key);
        return (
          <li key={item.key} className="flex items-start justify-between gap-3">
            <span className="text-text-2 flex items-center gap-2">
              <Check className="text-success h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {item.label}
            </span>
            <span className="text-text numeric shrink-0 font-medium">
              {limit === null ? "Sin límite" : formatNumber(limit, 0)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PlanSkeleton() {
  return (
    <div className="border-border bg-surface rounded-ds-lg border p-6" role="status">
      <span className="sr-only">Cargando suscripción</span>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-48" />
      <Skeleton className="mt-3 h-4 w-64" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

function PlanCardSkeleton() {
  return (
    <div className="border-border bg-surface rounded-ds-lg border p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-7 w-32" />
      <div className="mt-5 space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-3 w-full" />
        ))}
      </div>
      <Skeleton className="mt-6 h-10 w-full" />
    </div>
  );
}
