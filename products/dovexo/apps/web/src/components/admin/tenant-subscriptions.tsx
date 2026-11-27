"use client";

import { useState } from "react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  isSubscriptionStatus,
} from "@/lib/billing";
import type { AdminTenant, Plan, SubscriptionStatus } from "@/lib/api";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/utils";

const selectClass =
  "border-border bg-surface text-text focus-visible:border-primary focus-visible:ring-primary/30 rounded-lg border px-2 py-1.5 text-sm outline-none focus-visible:ring-2 disabled:opacity-60";

const STATUS_VARIANTS: Record<SubscriptionStatus, NonNullable<BadgeProps["variant"]>> = {
  trialing: "warning",
  active: "success",
  past_due: "danger",
  cancelled: "neutral",
};

export function TenantStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-text-2">—</span>;
  if (isSubscriptionStatus(status)) {
    return (
      <Badge variant={STATUS_VARIANTS[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>
    );
  }
  return <Badge variant="neutral">{status}</Badge>;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const value = parts.map((part) => part.charAt(0).toUpperCase()).join("");
  return value === "" ? "?" : value;
}

type TenantSubscriptionControlsProps = {
  tenant: AdminTenant;
  plans: Plan[];
  saving: boolean;
  disabled: boolean;
  onSave: (tenantId: string, planCode: string, status: SubscriptionStatus) => void;
};

function TenantSubscriptionControls({
  tenant,
  plans,
  saving,
  disabled,
  onSave,
}: TenantSubscriptionControlsProps) {
  const initialStatus: SubscriptionStatus = isSubscriptionStatus(tenant.subscription_status)
    ? tenant.subscription_status
    : "trialing";
  const initialPlan = tenant.plan_code ?? plans[0]?.code ?? "";
  const [planCode, setPlanCode] = useState(initialPlan);
  const [status, setStatus] = useState<SubscriptionStatus>(initialStatus);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`plan-${tenant.id}`}>
        Plan de {tenant.name}
      </label>
      <select
        id={`plan-${tenant.id}`}
        value={planCode}
        onChange={(event) => setPlanCode(event.target.value)}
        disabled={disabled || plans.length === 0}
        className={selectClass}
      >
        {plans.length === 0 && <option value="">Sin planes</option>}
        {plans.map((plan) => (
          <option key={plan.id} value={plan.code}>
            {plan.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`status-${tenant.id}`}>
        Estado de {tenant.name}
      </label>
      <select
        id={`status-${tenant.id}`}
        value={status}
        onChange={(event) => {
          if (isSubscriptionStatus(event.target.value)) setStatus(event.target.value);
        }}
        disabled={disabled}
        className={selectClass}
      >
        {SUBSCRIPTION_STATUSES.map((value) => (
          <option key={value} value={value}>
            {SUBSCRIPTION_STATUS_LABELS[value]}
          </option>
        ))}
      </select>

      <Button
        size="sm"
        onClick={() => onSave(tenant.id, planCode, status)}
        disabled={disabled || planCode === ""}
        aria-label={`Actualizar suscripción de ${tenant.name}`}
      >
        {saving ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}

type TenantListProps = {
  tenants: AdminTenant[];
  plans: Plan[];
  savingTenantId: string | null;
  disabled: boolean;
  onSave: (tenantId: string, planCode: string, status: SubscriptionStatus) => void;
};

export function TenantTable({
  tenants,
  plans,
  savingTenantId,
  disabled,
  onSave,
}: TenantListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <caption className="sr-only">Empresas registradas y su suscripción</caption>
        <thead className="bg-surface-2 text-text-2">
          <tr>
            <th scope="col" className="text-caption px-4 py-3 font-semibold tracking-wide uppercase">
              Empresa
            </th>
            <th scope="col" className="text-caption px-4 py-3 font-semibold tracking-wide uppercase">
              Plan
            </th>
            <th scope="col" className="text-caption px-4 py-3 font-semibold tracking-wide uppercase">
              Estado
            </th>
            <th
              scope="col"
              className="text-caption px-4 py-3 text-right font-semibold tracking-wide uppercase"
            >
              Usuarios
            </th>
            <th
              scope="col"
              className="text-caption px-4 py-3 text-right font-semibold tracking-wide uppercase"
            >
              Órdenes
            </th>
            <th
              scope="col"
              className="text-caption px-4 py-3 text-right font-semibold tracking-wide uppercase"
            >
              Precio
            </th>
            <th scope="col" className="text-caption px-4 py-3 font-semibold tracking-wide uppercase">
              Suscripción
            </th>
          </tr>
        </thead>
        <tbody className="divide-border divide-y">
          {tenants.map((tenant) => (
            <tr
              key={`${tenant.id}-${tenant.plan_code ?? "none"}-${tenant.subscription_status ?? "none"}`}
              className="hover:bg-surface-2/60 align-middle"
            >
              <th scope="row" className="min-w-[190px] px-4 py-3 text-left">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                  >
                    {initials(tenant.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-text text-sm font-semibold">{tenant.name}</p>
                    <p className="text-text-2 text-xs">
                      Alta <time dateTime={tenant.created_at}>{formatDateOnly(tenant.created_at)}</time>
                    </p>
                  </div>
                </div>
              </th>
              <td className="px-4 py-3">
                {tenant.plan_name ? (
                  <Badge variant="info">{tenant.plan_name}</Badge>
                ) : (
                  <span className="text-text-2">Sin plan</span>
                )}
              </td>
              <td className="px-4 py-3">
                <TenantStatusBadge status={tenant.subscription_status} />
              </td>
              <td className="text-text numeric px-4 py-3 text-right">
                {formatNumber(tenant.users_count, 0)}
              </td>
              <td className="text-text numeric px-4 py-3 text-right">
                {formatNumber(tenant.orders_count, 0)}
              </td>
              <td className="text-text numeric px-4 py-3 text-right whitespace-nowrap">
                {formatCurrency(tenant.price_snapshot)}
              </td>
              <td className="px-4 py-3">
                <TenantSubscriptionControls
                  tenant={tenant}
                  plans={plans}
                  saving={savingTenantId === tenant.id}
                  disabled={disabled}
                  onSave={onSave}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TenantCardList({
  tenants,
  plans,
  savingTenantId,
  disabled,
  onSave,
}: TenantListProps) {
  return (
    <ul className="divide-border divide-y">
      {tenants.map((tenant) => (
        <li
          key={`${tenant.id}-${tenant.plan_code ?? "none"}-${tenant.subscription_status ?? "none"}`}
          className="p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                aria-hidden="true"
                className="bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
              >
                {initials(tenant.name)}
              </span>
              <div className="min-w-0">
                <p className="text-text text-sm font-semibold">{tenant.name}</p>
                <p className="text-text-2 text-xs">
                  Alta <time dateTime={tenant.created_at}>{formatDateOnly(tenant.created_at)}</time>
                </p>
              </div>
            </div>
            <TenantStatusBadge status={tenant.subscription_status} />
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-text-2 text-xs">Plan</dt>
              <dd className="text-text mt-0.5 font-medium">{tenant.plan_name ?? "Sin plan"}</dd>
            </div>
            <div>
              <dt className="text-text-2 text-xs">Precio</dt>
              <dd className="text-text numeric mt-0.5 font-medium">
                {formatCurrency(tenant.price_snapshot)}
              </dd>
            </div>
            <div>
              <dt className="text-text-2 text-xs">Usuarios</dt>
              <dd className="text-text numeric mt-0.5 font-medium">
                {formatNumber(tenant.users_count, 0)}
              </dd>
            </div>
            <div>
              <dt className="text-text-2 text-xs">Órdenes</dt>
              <dd className="text-text numeric mt-0.5 font-medium">
                {formatNumber(tenant.orders_count, 0)}
              </dd>
            </div>
          </dl>

          <div className="border-border mt-3 border-t pt-3">
            <TenantSubscriptionControls
              tenant={tenant}
              plans={plans}
              saving={savingTenantId === tenant.id}
              disabled={disabled}
              onSave={onSave}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
