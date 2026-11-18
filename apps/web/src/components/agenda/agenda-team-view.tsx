"use client";

import { AlertTriangle, UserRound } from "lucide-react";
import Link from "next/link";

import { AgendaAppointmentMenu } from "@/components/agenda/agenda-appointment-menu";
import {
  appointmentStatusVariant,
  conflictsForAppointment,
  customerNameFor,
  formatDayLong,
  formatDuration,
  formatMinutesAsTime,
  minutesOfDay,
  technicianDayLoad,
  type AgendaConflict,
  type AgendaCustomer,
} from "@/components/agenda/agenda-utils";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { appointmentStatusLabel } from "@/lib/agenda";
import type { Appointment, Technician, WorkOrder } from "@/lib/api";

type AgendaTeamViewProps = {
  tenantId: string;
  day: string;
  appointments: readonly Appointment[];
  orders: readonly WorkOrder[];
  customers: readonly AgendaCustomer[];
  technicians: readonly Technician[];
  conflicts: readonly AgendaConflict[];
  canWrite: boolean;
};

export function AgendaTeamView({
  tenantId,
  day,
  appointments,
  orders,
  customers,
  technicians,
  conflicts,
  canWrite,
}: AgendaTeamViewProps) {
  const orderById = new Map(orders.map((order): [string, WorkOrder] => [order.id, order]));
  const activeTechnicianIds = new Set(technicians.map((technician) => technician.id));
  const unassignedOrders = conflicts
    .filter((conflict) => conflict.kind === "unassigned")
    .flatMap((conflict) => conflict.orderIds)
    .map((orderId) => orderById.get(orderId))
    .filter((order): order is WorkOrder => Boolean(order));
  const orphanAppointments = appointments.filter(
    (appointment) =>
      appointment.status !== "cancelled" && !activeTechnicianIds.has(appointment.technician_id),
  );

  return (
    <section aria-labelledby="agenda-team-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="agenda-team-title" className="text-h4 text-text">
          Equipo
        </h2>
        <p className="text-text-2 text-caption">
          {formatDayLong(day)} · {technicians.length}{" "}
          {technicians.length === 1 ? "técnico activo" : "técnicos activos"}
        </p>
      </div>

      {technicians.length === 0 ? (
        <div className="border-border bg-surface rounded-ds-lg border p-6 shadow-card">
          <EmptyState
            icon={UserRound}
            title={canWrite ? "No hay técnicos activos" : "Lista de técnicos no disponible"}
            description={
              canWrite
                ? "Invitá a tu equipo desde Configuración › Equipo para poder asignar visitas."
                : "Tu rol no permite ver la lista de técnicos de la empresa."
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {technicians.map((technician) => {
            const load = technicianDayLoad(appointments, technician.id);
            const items = appointments
              .filter(
                (appointment) =>
                  appointment.technician_id === technician.id &&
                  appointment.status !== "cancelled",
              )
              .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
            const availability =
              load.count === 0
                ? { label: "Sin visitas", variant: "neutral" as const }
                : load.hasFreeSlot
                  ? { label: "Con disponibilidad", variant: "success" as const }
                  : { label: "Sin franjas libres", variant: "warning" as const };

            return (
              <article
                key={technician.id}
                className="border-border bg-surface flex flex-col rounded-ds-lg border shadow-card"
              >
                <header className="border-border flex items-start justify-between gap-2 border-b p-3">
                  <div className="min-w-0">
                    <p className="text-text truncate text-small font-semibold">
                      {technician.full_name}
                    </p>
                    <p className="text-text-2 numeric text-caption">
                      {load.count === 1 ? "1 visita" : `${load.count} visitas`} ·{" "}
                      {formatDuration(load.occupiedMinutes)} ocupadas
                    </p>
                  </div>
                  <Badge variant={availability.variant}>{availability.label}</Badge>
                </header>

                {items.length === 0 ? (
                  <p className="text-text-2 p-3 text-caption">Sin visitas asignadas.</p>
                ) : (
                  <ul className="divide-border divide-y">
                    {items.map((appointment) => {
                      const order = orderById.get(appointment.work_order_id);
                      const customerName = customerNameFor(customers, order?.customer_id);
                      const appointmentConflicts = conflictsForAppointment(
                        conflicts,
                        appointment.id,
                      );

                      return (
                        <li
                          key={appointment.id}
                          className="flex items-start justify-between gap-2 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="numeric text-text text-caption font-semibold">
                                {formatMinutesAsTime(minutesOfDay(appointment.starts_at))}
                              </span>
                              <Badge variant={appointmentStatusVariant(appointment.status)}>
                                {appointmentStatusLabel(appointment.status)}
                              </Badge>
                              {appointmentConflicts.length > 0 && (
                                <span className="bg-warning-soft text-warning-strong inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-caption font-semibold">
                                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                                  {appointmentConflicts[0].label}
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/orders/${appointment.work_order_id}`}
                              className="text-text hover:text-primary focus-visible:ring-primary mt-0.5 block truncate rounded-sm text-small underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                            >
                              {order ? `${order.code} · ${order.title}` : "Abrir orden"}
                            </Link>
                            <p className="text-text-2 truncate text-caption">
                              {customerName ?? "Cliente sin nombre"}
                            </p>
                          </div>
                          <AgendaAppointmentMenu
                            tenantId={tenantId}
                            appointment={appointment}
                            technicians={technicians}
                            canWrite={canWrite}
                          />
                        </li>
                      );
                    })}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}

      {(unassignedOrders.length > 0 || orphanAppointments.length > 0) && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {unassignedOrders.length > 0 && (
            <article className="border-warning/40 bg-warning-soft/40 rounded-ds-lg border p-3">
              <h3 className="text-warning-strong text-small font-semibold">
                Visitas sin técnico asignado
              </h3>
              <ul className="mt-2 space-y-1">
                {unassignedOrders.map((order) => (
                  <li key={order.id} className="text-caption">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-text hover:text-primary focus-visible:ring-primary rounded-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {order.code} · {order.title}
                    </Link>
                    <span className="text-text-2">
                      {order.scheduled_at
                        ? ` · ${formatMinutesAsTime(minutesOfDay(order.scheduled_at))}`
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-text-2 mt-2 text-caption">
                Asigná un técnico desde la orden o creá el turno desde la vista Día.
              </p>
            </article>
          )}

          {orphanAppointments.length > 0 && (
            <article className="border-warning/40 bg-warning-soft/40 rounded-ds-lg border p-3">
              <h3 className="text-warning-strong text-small font-semibold">
                Turnos con técnico inactivo
              </h3>
              <ul className="mt-2 space-y-1">
                {orphanAppointments.map((appointment) => {
                  const order = orderById.get(appointment.work_order_id);
                  return (
                    <li key={appointment.id} className="text-caption">
                      <span className="numeric text-text font-semibold">
                        {formatMinutesAsTime(minutesOfDay(appointment.starts_at))}
                      </span>{" "}
                      <Link
                        href={`/orders/${appointment.work_order_id}`}
                        className="text-text hover:text-primary focus-visible:ring-primary rounded-sm underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {order ? `${order.code} · ${order.title}` : "Abrir orden"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="text-text-2 mt-2 text-caption">
                Reasigná estos turnos desde el menú de acciones de cada visita.
              </p>
            </article>
          )}
        </div>
      )}
    </section>
  );
}
