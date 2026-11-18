"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ClipboardList, ListFilter, RefreshCw } from "lucide-react";
import { useState } from "react";

import { TechAgendaList } from "@/components/tech/tech-agenda-list";
import { TechEmptyState } from "@/components/tech/tech-empty-state";
import {
  compareWorkOrders,
  formatLongDate,
  formatRelative,
  isToday,
  pickNextOrder,
  scheduledTime,
  type TechnicianWorkOrderWithAddress,
} from "@/components/tech/tech-format";
import { TechNextJobCard } from "@/components/tech/tech-next-job-card";
import { TechQueryError } from "@/components/tech/tech-query-error";
import { TechWorkOrderCard } from "@/components/tech/tech-work-order-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const filters = [
  { value: "open", label: "Abiertas" },
  { value: "today", label: "Hoy" },
  { value: "scheduled", label: "Programadas" },
  { value: "in_progress", label: "En ejecución" },
  { value: "waiting", label: "En espera" },
  { value: "finished", label: "Finalizadas" },
  { value: "all", label: "Todas" },
] as const;

function matchesFilter(order: TechnicianWorkOrderWithAddress, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "open") {
    return order.operational_status !== "finished" && order.operational_status !== "cancelled";
  }
  if (filter === "today") {
    return Boolean(order.scheduled_at && isToday(order.scheduled_at));
  }
  return order.operational_status === filter;
}

function scrollToSection(id: string) {
  const prefersReduced =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
}

export function TechHome() {
  const { user, activeTenantId } = useAuth();
  const [filter, setFilter] = useState<string>("open");

  const ordersQuery = useQuery({
    queryKey: ["tech-work-orders", activeTenantId],
    queryFn: () => api.technicianWorkOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  if (!activeTenantId) {
    return (
      <TechEmptyState
        icon={ClipboardList}
        title="No hay empresa activa"
        description="Volvé a iniciar sesión para ver tus trabajos."
      />
    );
  }

  if (ordersQuery.isLoading) {
    return <TechHomeSkeleton />;
  }

  if (ordersQuery.isError) {
    return <TechQueryError error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} />;
  }

  const orders: TechnicianWorkOrderWithAddress[] = ordersQuery.data?.items ?? [];
  const firstName = user?.full_name.trim().split(/\s+/)[0] ?? "";
  const openCount = orders.filter(
    (order) => order.operational_status !== "finished" && order.operational_status !== "cancelled",
  ).length;
  const inProgressCount = orders.filter(
    (order) => order.operational_status === "in_progress",
  ).length;
  const todayOrders = [...orders]
    .filter(
      (order) =>
        order.scheduled_at &&
        isToday(order.scheduled_at) &&
        order.operational_status !== "cancelled",
    )
    .sort((a, b) => scheduledTime(a) - scheduledTime(b));

  const { order: nextOrder, label: nextLabel } = pickNextOrder(orders);

  const filteredOrders = [...orders]
    .filter((order) => matchesFilter(order, filter))
    .sort(compareWorkOrders);

  const header = (
    <HomeHeader
      firstName={firstName}
      openCount={openCount}
      updatedAt={ordersQuery.dataUpdatedAt}
      isFetching={ordersQuery.isFetching}
      onRefresh={() => void ordersQuery.refetch()}
    />
  );

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <TechEmptyState
          icon={ClipboardList}
          title="No tenés trabajos asignados"
          description="Cuando la oficina te asigne un trabajo, aparece acá. Podés actualizar para buscar cambios."
          action={
            <Button
              size="lg"
              onClick={() => void ordersQuery.refetch()}
              disabled={ordersQuery.isFetching}
            >
              {ordersQuery.isFetching ? "Actualizando…" : "Actualizar"}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {header}

      <dl className="flex divide-x divide-border overflow-hidden rounded-ds-lg border border-border bg-surface shadow-card">
        <TechStat label="Hoy" value={todayOrders.length} />
        <TechStat label="Pendientes" value={openCount} />
        <TechStat label="En curso" value={inProgressCount} />
      </dl>

      <section aria-labelledby="tech-next-title" className="space-y-2">
        <h2 id="tech-next-title" className="text-label text-text-2">
          {nextLabel}
        </h2>
        {nextOrder ? (
          <TechNextJobCard order={nextOrder} label={nextLabel} />
        ) : (
          <TechEmptyState
            compact
            icon={CheckCircle2}
            title="No tenés trabajos pendientes"
            description="Cuando la oficina te asigne un trabajo, aparece acá."
            action={
              <Button variant="outline" size="lg" onClick={() => scrollToSection("trabajos")}>
                Ver trabajos
              </Button>
            }
          />
        )}
      </section>

      <TechAgendaList orders={todayOrders} />

      <section id="trabajos" aria-labelledby="tech-jobs-title" className="scroll-mt-20 space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="tech-jobs-title" className="text-h4 text-text">
              Trabajos
            </h2>
            <p className="text-caption text-text-2" aria-live="polite">
              {filteredOrders.length === 1 ? "1 trabajo" : `${filteredOrders.length} trabajos`}
            </p>
          </div>
          {filter !== "all" && (
            <button
              type="button"
              onClick={() => setFilter("all")}
              className="text-caption inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-ds-md px-2 font-semibold text-primary transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ListFilter className="h-4 w-4" aria-hidden="true" />
              Ver todas
            </button>
          )}
        </div>

        <div role="group" aria-label="Filtrar trabajos" className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => {
            const isActive = filter === item.value;
            return (
              <button
                key={item.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(item.value)}
                className={cn(
                  "text-small min-h-11 shrink-0 rounded-full px-3.5 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                  isActive
                    ? "bg-deep text-white"
                    : "border border-border bg-surface text-text-2 hover:bg-surface-2",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <TechEmptyState
            icon={ClipboardList}
            title="No hay trabajos en este filtro"
            description="Probá con otro filtro para ver tus trabajos."
            action={
              <Button variant="outline" size="lg" onClick={() => setFilter("open")}>
                Ver abiertas
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {filteredOrders.map((order) => (
              <li key={order.id}>
                <TechWorkOrderCard order={order} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tech-quick-actions-title" className="space-y-2">
        <h2 id="tech-quick-actions-title" className="text-label text-text-2">
          Acciones rápidas
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => void ordersQuery.refetch()}
            disabled={ordersQuery.isFetching}
            className="text-small flex min-h-16 flex-col items-center justify-center gap-1 rounded-ds-md border border-border bg-surface p-2 font-semibold text-text shadow-card transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-5 w-5 text-primary", ordersQuery.isFetching && "animate-spin")}
              aria-hidden="true"
            />
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => scrollToSection("agenda")}
            className="text-small flex min-h-16 flex-col items-center justify-center gap-1 rounded-ds-md border border-border bg-surface p-2 font-semibold text-text shadow-card transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <CalendarDays className="h-5 w-5 text-primary" aria-hidden="true" />
            Agenda
          </button>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              scrollToSection("trabajos");
            }}
            className="text-small flex min-h-16 flex-col items-center justify-center gap-1 rounded-ds-md border border-border bg-surface p-2 font-semibold text-text shadow-card transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
            Ver todos
          </button>
        </div>
      </section>
    </div>
  );
}

function HomeHeader({
  firstName,
  openCount,
  updatedAt,
  isFetching,
  onRefresh,
}: {
  firstName: string;
  openCount: number;
  updatedAt: number;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  return (
    <header className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption text-text-2">{formatLongDate(new Date())}</p>
          <h1 className="text-h2 mt-0.5 text-text">Hola{firstName ? `, ${firstName}` : ""}</h1>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={isFetching}
          aria-label="Actualizar trabajos"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-md border border-border bg-surface text-text-2 shadow-card transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60"
        >
          <RefreshCw className={cn("h-5 w-5", isFetching && "animate-spin")} aria-hidden="true" />
        </button>
      </div>
      <p className="text-small text-text-2" aria-live="polite">
        {openCount === 0
          ? "Sin trabajos pendientes."
          : openCount === 1
            ? "Tenés 1 trabajo pendiente."
            : `Tenés ${openCount} trabajos pendientes.`}
      </p>
      {updatedAt > 0 && (
        <p className="text-caption text-text-2">
          Actualizado {formatRelative(new Date(updatedAt))}
        </p>
      )}
    </header>
  );
}

function TechStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-2.5">
      <dt className="text-caption truncate text-text-2">{label}</dt>
      <dd className="numeric text-small font-semibold text-text">{value}</dd>
    </div>
  );
}

function TechHomeSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true">
      <span className="sr-only">Cargando tus trabajos…</span>
      <div className="space-y-2">
        <Skeleton className="h-3 w-32 bg-surface-2" />
        <Skeleton className="h-8 w-48 bg-surface-2" />
        <Skeleton className="h-3 w-40 bg-surface-2" />
      </div>
      <Skeleton className="h-11 w-full bg-surface-2" />
      <Skeleton className="h-40 w-full rounded-xl bg-surface-2" />
      <Skeleton className="h-24 w-full rounded-xl bg-surface-2" />
    </div>
  );
}
