"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { Lock, Plus, RefreshCw, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AgendaConflictList } from "@/components/agenda/agenda-conflicts";
import { AgendaDayView } from "@/components/agenda/agenda-day-view";
import { AgendaSummary } from "@/components/agenda/agenda-summary";
import { AgendaTeamView } from "@/components/agenda/agenda-team-view";
import { AgendaToolbar } from "@/components/agenda/agenda-toolbar";
import { AgendaWeekView } from "@/components/agenda/agenda-week-view";
import { AppointmentForm } from "@/components/agenda/appointment-form";
import {
  countConflictsByKind,
  detectAgendaConflicts,
  formatDaySentence,
  formatWeekRange,
  technicianDayLoad,
  toAgendaCustomers,
  weekDaysFor,
  type AgendaView,
} from "@/components/agenda/agenda-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { dayBoundsIso, shiftDay, todayArgentinaDay } from "@/lib/agenda";
import { ApiError, api, errorMessage, type Appointment, type Technician } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const MANAGEMENT_ROLES = ["owner", "admin", "dispatcher"];

/** No reintentar errores de negocio (401/403/404): el estado de permiso debe verse al instante. */
function retryAgenda(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return failureCount < 2;
}

export default function AgendaPage() {
  const { activeTenantId, tenants, user } = useAuth();
  const [view, setView] = useState<AgendaView>("day");
  const [day, setDay] = useState(() => todayArgentinaDay());
  const [showForm, setShowForm] = useState(false);

  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canWrite = MANAGEMENT_ROLES.includes(role);
  const isViewer = role === "viewer";
  const isTechnician = role === "technician";

  const days = weekDaysFor(day);
  const otherDays = days.filter((item) => item !== day);

  const dayQuery = useQuery({
    queryKey: ["appointments", activeTenantId, day],
    queryFn: () => api.appointments.list(activeTenantId ?? "", dayBoundsIso(day)),
    enabled: Boolean(activeTenantId),
    retry: retryAgenda,
  });

  const weekQueries = useQueries({
    queries: otherDays.map((item) => ({
      queryKey: ["appointments", activeTenantId, item],
      queryFn: () => api.appointments.list(activeTenantId ?? "", dayBoundsIso(item)),
      enabled: Boolean(activeTenantId) && view === "week",
      retry: retryAgenda,
    })),
  });

  const ordersQuery = useQuery({
    queryKey: ["work-orders", activeTenantId],
    queryFn: () => api.workOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
    retry: retryAgenda,
  });

  const techniciansQuery = useQuery({
    queryKey: ["technicians", activeTenantId],
    queryFn: () => api.technicians.list(activeTenantId ?? ""),
    // Técnicos y consulta no pueden listar el equipo: el backend responde 403.
    enabled: Boolean(activeTenantId) && canWrite,
    retry: retryAgenda,
  });

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId],
    queryFn: () => api.customers.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
    retry: retryAgenda,
  });

  if (!activeTenantId) {
    return (
      <Card className="text-text-2 p-8 text-small">
        No hay una empresa activa. Elegí una empresa en el selector de arriba para ver la agenda.
      </Card>
    );
  }

  const orders = ordersQuery.data?.items ?? [];
  const technicians: Technician[] = canWrite
    ? (techniciansQuery.data ?? [])
    : isTechnician && user
      ? [{ id: user.id, full_name: user.full_name, email: user.email }]
      : [];
  const customers = toAgendaCustomers(customersQuery.data?.items ?? []);
  const dayAppointments = dayQuery.data?.items ?? [];

  const otherIndex = new Map(otherDays.map((item, index): [string, number] => [item, index]));
  const appointmentsByDay: Record<string, readonly Appointment[]> = {};
  for (const item of days) {
    if (item === day) {
      appointmentsByDay[item] = dayAppointments;
      continue;
    }
    const index = otherIndex.get(item);
    appointmentsByDay[item] = index === undefined ? [] : (weekQueries[index]?.data?.items ?? []);
  }

  const weekAppointments = days.flatMap((item) => appointmentsByDay[item] ?? []);
  const isWeek = view === "week";
  const visibleAppointments = isWeek ? weekAppointments : dayAppointments;
  const visibleCount = visibleAppointments.length;

  const conflicts = isWeek
    ? days.flatMap((item) =>
        detectAgendaConflicts({
          day: item,
          appointments: appointmentsByDay[item] ?? [],
          orders,
          technicians,
        }),
      )
    : detectAgendaConflicts({ day, appointments: dayAppointments, orders, technicians });

  const unassignedCount = countConflictsByKind(conflicts, "unassigned");
  const busyTechnicians = technicians.filter(
    (technician) => technicianDayLoad(visibleAppointments, technician.id).count > 0,
  ).length;

  const openOrders = orders.filter(
    (order) => order.operational_status !== "finished" && order.operational_status !== "cancelled",
  );

  const isLoading = dayQuery.isLoading || (isWeek && weekQueries.some((query) => query.isLoading));
  const loadError = dayQuery.error ?? weekQueries.find((query) => query.error)?.error ?? null;
  const secondaryError =
    ordersQuery.isError || techniciansQuery.isError || customersQuery.isError;
  const forbidden = loadError instanceof ApiError && loadError.status === 403;

  const refetchAll = () => {
    void dayQuery.refetch();
    if (isWeek) weekQueries.forEach((query) => void query.refetch());
    if (ordersQuery.isError) void ordersQuery.refetch();
    if (techniciansQuery.isError) void techniciansQuery.refetch();
    if (customersQuery.isError) void customersQuery.refetch();
  };

  const description = isWeek
    ? `${visibleCount} ${visibleCount === 1 ? "turno" : "turnos"} en la semana del ${formatWeekRange(days)}.`
    : `${visibleCount} ${visibleCount === 1 ? "turno" : "turnos"} el ${formatDaySentence(day)}.`;

  const emptyConflictMessage = isWeek
    ? "Sin conflictos en la semana seleccionada: los turnos están asignados y sin superposiciones."
    : "Sin conflictos para este día: los turnos están asignados y sin superposiciones.";

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Agenda"
        title="Calendario operativo"
        description={`${description} ${activeTenant?.name ?? "Tu empresa"} · hora de Argentina.`}
        actions={
          canWrite ? (
            <Button
              onClick={() => setShowForm((value) => !value)}
              aria-expanded={showForm}
              aria-controls="agenda-new-form"
              variant={showForm ? "outline" : "primary"}
            >
              {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showForm ? "Cerrar formulario" : "Nuevo turno"}
            </Button>
          ) : undefined
        }
      />

      {isViewer && (
        <p className="bg-info-soft text-info-strong rounded-ds-md px-3 py-2 text-small">
          Estás en modo consulta: podés ver la agenda, pero no crear, reprogramar ni cancelar turnos.
        </p>
      )}

      {isTechnician && (
        <p className="bg-info-soft text-info-strong rounded-ds-md px-3 py-2 text-small">
          Ves solo tus visitas. Para coordinar la agenda completa necesitás un rol de coordinación.{" "}
          <Link href="/tech" className="font-semibold underline underline-offset-2">
            Ir a mis trabajos
          </Link>
        </p>
      )}

      {canWrite && showForm && (
        <div id="agenda-new-form">
          <AppointmentForm
            tenantId={activeTenantId}
            day={day}
            orders={openOrders}
            technicians={technicians}
            appointments={dayAppointments}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}

      <AgendaToolbar
        view={view}
        day={day}
        days={days}
        onViewChange={setView}
        onDayChange={setDay}
        onShift={(delta) => setDay((current) => shiftDay(current, delta))}
      />

      {forbidden ? (
        <Card className="p-6">
          <span className="bg-warning-soft text-warning-strong flex h-11 w-11 items-center justify-center rounded-full">
            <Lock className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-h4 text-text mt-3">No tenés permiso para ver la agenda</h2>
          <p className="text-text-2 mt-1 max-w-xl text-small">
            Tu rol actual en {activeTenant?.name ?? "la empresa"} no permite consultar turnos. Pedile a
            un administrador que revise tu acceso.
          </p>
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
            Volver al panel
          </Link>
        </Card>
      ) : isLoading ? (
        <AgendaSkeleton />
      ) : loadError ? (
        <Card className="p-6">
          <h2 className="text-h4 text-text">No pudimos cargar la agenda</h2>
          <p className="text-text-2 mt-1 text-small">
            {errorMessage(loadError, "Revisá la conexión y volvé a intentar.")}
          </p>
          <Button variant="outline" className="mt-4" onClick={refetchAll}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </Card>
      ) : (
        <>
          {secondaryError && (
            <p
              role="status"
              className="bg-warning-soft text-warning-strong rounded-ds-md px-3 py-2 text-small"
            >
              Algunos datos auxiliares no se pudieron cargar (órdenes, técnicos o clientes). La agenda
              puede mostrarse incompleta.{" "}
              <button
                type="button"
                onClick={refetchAll}
                className="font-semibold underline underline-offset-2"
              >
                Reintentar
              </button>
            </p>
          )}

          <AgendaSummary
            appointments={visibleCount}
            conflicts={conflicts.length}
            unassigned={unassignedCount}
            busyTechnicians={busyTechnicians}
            totalTechnicians={technicians.length}
            scope={isWeek ? "week" : "day"}
          />

          <AgendaConflictList
            conflicts={conflicts}
            orders={orders}
            emptyMessage={emptyConflictMessage}
          />

          {view === "day" && (
            <AgendaDayView
              tenantId={activeTenantId}
              day={day}
              appointments={dayAppointments}
              orders={orders}
              customers={customers}
              technicians={technicians}
              conflicts={conflicts}
              canWrite={canWrite}
              onCreate={canWrite ? () => setShowForm(true) : undefined}
            />
          )}

          {view === "week" && (
            <AgendaWeekView
              days={days}
              today={todayArgentinaDay()}
              appointmentsByDay={appointmentsByDay}
              orders={orders}
              customers={customers}
              conflicts={conflicts}
              onSelectDay={(selected) => {
                setDay(selected);
                setView("day");
              }}
            />
          )}

          {view === "team" && (
            <AgendaTeamView
              tenantId={activeTenantId}
              day={day}
              appointments={dayAppointments}
              orders={orders}
              customers={customers}
              technicians={technicians}
              conflicts={conflicts}
              canWrite={canWrite}
            />
          )}
        </>
      )}
    </div>
  );
}

function AgendaSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <p role="status" className="sr-only">
        Cargando la agenda…
      </p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="bg-surface-2 h-20 rounded-ds-md" />
        ))}
      </div>
      <Skeleton className="bg-surface-2 h-16 rounded-ds-lg" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="bg-surface-2 h-24 rounded-ds-md" />
        ))}
      </div>
    </div>
  );
}
