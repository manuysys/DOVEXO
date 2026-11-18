"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminMetricsSection } from "@/components/admin/admin-metrics";
import { TenantCardList, TenantTable } from "@/components/admin/tenant-subscriptions";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, errorMessage, type SubscriptionStatus } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const FORBIDDEN_MESSAGE = "No tenés acceso al panel global.";

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export default function AdminPage() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const metricsQuery = useQuery({
    queryKey: ["admin-metrics", activeTenantId],
    queryFn: () => api.admin.metrics(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
    retry: false,
  });

  const tenantsQuery = useQuery({
    queryKey: ["admin-tenants", activeTenantId, search.trim()],
    queryFn: () => api.admin.tenants(activeTenantId ?? "", search),
    enabled: Boolean(activeTenantId),
    retry: false,
    placeholderData: keepPreviousData,
  });

  const plansQuery = useQuery({
    queryKey: ["billing-plans", activeTenantId],
    queryFn: () => api.billing.plans(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (input: { targetTenantId: string; planCode: string; status: SubscriptionStatus }) =>
      api.admin.updateSubscription(
        activeTenantId ?? "",
        input.targetTenantId,
        input.planCode,
        input.status,
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
    },
  });

  if (!activeTenantId) {
    return (
      <EmptyState
        icon={Building2}
        title="No hay una empresa activa"
        description="Cerrá sesión y volvé a ingresar para acceder al panel global."
      />
    );
  }

  const forbidden = isForbidden(metricsQuery.error) || isForbidden(tenantsQuery.error);

  if (forbidden) {
    return (
      <div role="alert">
        <EmptyState
          icon={ShieldAlert}
          title={FORBIDDEN_MESSAGE}
          description="Este panel es solo para administradores de la plataforma y muestra métricas agregadas, nunca datos de clientes."
          action={
            <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
              Volver al panel
            </Link>
          }
        />
      </div>
    );
  }

  const plans = plansQuery.data ?? [];
  const tenants = tenantsQuery.data?.items ?? [];
  const savingTenantId = updateMutation.isPending
    ? (updateMutation.variables?.targetTenantId ?? null)
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel global"
        title="Admin SaaS"
        description="Métricas agregadas de la plataforma y estado de las suscripciones. No muestra datos de clientes ni órdenes individuales."
        actions={
          <Badge variant="teal">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Platform admin
          </Badge>
        }
      />

      <AdminMetricsSection
        metrics={metricsQuery.data}
        loading={metricsQuery.isLoading}
        error={metricsQuery.error}
        onRetry={() => void metricsQuery.refetch()}
      />

      <Card>
        <div className="border-border flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="tenants-title" className="text-h4 text-text">
              Empresas y suscripciones
            </h2>
            <p className="text-text-2 mt-1 text-xs">
              {tenantsQuery.data
                ? `${tenantsQuery.data.total} resultado(s)`
                : "Consultando empresas..."}
            </p>
          </div>
          <div className="w-full sm:w-72">
            <label htmlFor="tenant-search" className="text-text-2 mb-1 block text-xs font-medium">
              Buscar empresa
            </label>
            <div className="relative">
              <Search
                className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                id="tenant-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Ej.: Electricidad"
                autoComplete="off"
                className="border-border bg-surface text-text placeholder:text-text-2/70 focus-visible:border-primary focus-visible:ring-primary/30 w-full rounded-ds-md border py-2 pr-3 pl-9 text-sm outline-none focus-visible:ring-2"
              />
            </div>
          </div>
        </div>

        <div aria-live="polite" className="space-y-2">
          {updateMutation.error && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong mx-5 mt-3 rounded-lg px-3 py-2 text-sm"
            >
              {errorMessage(updateMutation.error, "No se pudo actualizar la suscripción.")}
            </p>
          )}
          {updateMutation.isSuccess && (
            <p
              role="status"
              className="bg-success-soft text-success-strong mx-5 mt-3 rounded-lg px-3 py-2 text-sm"
            >
              Suscripción actualizada.
            </p>
          )}
          {plansQuery.isError && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong mx-5 mt-3 rounded-lg px-3 py-2 text-sm"
            >
              {errorMessage(plansQuery.error, "No se pudieron cargar los planes.")}
            </p>
          )}
        </div>

        {tenantsQuery.isLoading ? (
          <div className="space-y-2 p-5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : tenantsQuery.isError ? (
          <div className="p-5">
            <p role="alert" className="text-danger text-sm">
              {errorMessage(tenantsQuery.error, "No se pudieron cargar las empresas.")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void tenantsQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Building2}
              title={
                search.trim() === ""
                  ? "Todavía no hay empresas registradas"
                  : "No hay empresas que coincidan con la búsqueda"
              }
              description={
                search.trim() === ""
                  ? "Cuando se registre una empresa, aparece acá con su plan y estado."
                  : "Probá con otro nombre o limpiá la búsqueda."
              }
              action={
                search.trim() !== "" ? (
                  <Button variant="outline" onClick={() => setSearch("")}>
                    Limpiar búsqueda
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <p className="text-text-2 px-5 pb-2 text-xs xl:hidden">
              Desplazá la tabla horizontalmente para ver y editar la suscripción.
            </p>
            <div className="hidden md:block">
              <TenantTable
                tenants={tenants}
                plans={plans}
                savingTenantId={savingTenantId}
                disabled={updateMutation.isPending}
                onSave={(tenantId, planCode, status) =>
                  updateMutation.mutate({ targetTenantId: tenantId, planCode, status })
                }
              />
            </div>
            <div className="md:hidden">
              <TenantCardList
                tenants={tenants}
                plans={plans}
                savingTenantId={savingTenantId}
                disabled={updateMutation.isPending}
                onSave={(tenantId, planCode, status) =>
                  updateMutation.mutate({ targetTenantId: tenantId, planCode, status })
                }
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
