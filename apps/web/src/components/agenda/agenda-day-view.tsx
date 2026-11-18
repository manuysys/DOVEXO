"use client";

import { AlertTriangle, CalendarDays, MapPin, UserRound } from "lucide-react";
import Link from "next/link";

import { AgendaAppointmentMenu } from "@/components/agenda/agenda-appointment-menu";
import {
  appointmentDurationMinutes,
  appointmentStatusVariant,
  conflictsForAppointment,
  customerLocation,
  customerNameFor,
  formatDayLong,
  formatDuration,
  formatMinutesAsTime,
  minutesOfDay,
  type AgendaConflict,
  type AgendaConflictSeverity,
  type AgendaCustomer,
} from "@/components/agenda/agenda-utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { appointmentStatusLabel } from "@/lib/agenda";
import type { Appointment, Technician, WorkOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

const severityBadgeClass: Record<AgendaConflictSeverity, string> = {
  danger: "bg-danger-soft text-danger-strong",
  warning: "bg-warning-soft text-warning-strong",
  info: "bg-info-soft text-info-strong",
};

const severityDotClass: Record<AgendaConflictSeverity, string> = {
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-primary",
};

type AgendaDayViewProps = {
  tenantId: string;
  day: string;
  appointments: readonly Appointment[];
  orders: readonly WorkOrder[];
  customers: readonly AgendaCustomer[];
  technicians: readonly Technician[];
  conflicts: readonly AgendaConflict[];
  canWrite: boolean;
  onCreate?: () => void;
};

export function AgendaDayView({
  tenantId,
  day,
  appointments,
  orders,
  customers,
  technicians,
  conflicts,
  canWrite,
  onCreate,
}: AgendaDayViewProps) {
  const orderById = new Map(orders.map((order): [string, WorkOrder] => [order.id, order]));
  const technicianById = new Map(
    technicians.map((technician): [string, Technician] => [technician.id, technician]),
  );

  return (
    <section aria-labelledby="agenda-day-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="agenda-day-title" className="text-h4 text-text">
          Agenda del día
        </h2>
        <p className="text-caption text-text-2">
          {formatDayLong(day)} ·{" "}
          {appointments.length === 1 ? "1 visita" : `${appointments.length} visitas`}
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="border-border bg-surface rounded-ds-lg border p-6 shadow-card">
          <EmptyState
            icon={CalendarDays}
            title="No hay turnos para este día"
            description="Creá un turno para asignar un técnico a una orden, o elegí otra fecha en el calendario."
            action={
              onCreate ? (
                <Button onClick={onCreate}>Nuevo turno</Button>
              ) : (
                <p className="text-text-2 text-small">Tu rol no permite crear turnos.</p>
              )
            }
          />
        </div>
      ) : (
        <ol className="space-y-0">
          {appointments.map((appointment) => {
            const order = orderById.get(appointment.work_order_id);
            const technician = technicianById.get(appointment.technician_id);
            const customerName = customerNameFor(customers, order?.customer_id);
            const customer = customers.find((item) => item.id === order?.customer_id);
            const location = customerLocation(customer);
            const start = formatMinutesAsTime(minutesOfDay(appointment.starts_at));
            const end = formatMinutesAsTime(minutesOfDay(appointment.ends_at));
            const duration = formatDuration(appointmentDurationMinutes(appointment));
            const appointmentConflicts = conflictsForAppointment(conflicts, appointment.id);
            const severity = appointmentConflicts[0]?.severity;
            const isCancelled = appointment.status === "cancelled";

            return (
              <li key={appointment.id} className="flex gap-3 sm:gap-4">
                <div className="w-14 shrink-0 pt-1.5 text-right sm:w-16">
                  <time
                    dateTime={appointment.starts_at}
                    className={cn(
                      "numeric text-small block font-semibold",
                      isCancelled ? "text-text-2 line-through" : "text-text",
                    )}
                  >
                    {start}
                  </time>
                  <span className="text-text-2 text-caption block">{duration}</span>
                  <span className="sr-only">hasta las {end}</span>
                </div>

                <div className="border-border relative min-w-0 flex-1 border-l pb-4 pl-3 sm:pl-4">
                  <span
                    aria-hidden="true"
                    className={cn(
                      "border-surface absolute top-2.5 -left-[5px] h-2.5 w-2.5 rounded-full border-2",
                      severity ? severityDotClass[severity] : isCancelled ? "bg-text-2" : "bg-primary",
                    )}
                  />

                  <article
                    className={cn(
                      "bg-surface rounded-ds-md border p-3 shadow-card transition-colors",
                      severity === "danger"
                        ? "border-danger/40"
                        : severity === "warning"
                          ? "border-warning/50"
                          : "border-border hover:border-primary/40",
                      isCancelled && "opacity-70",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-0.5">
                        <Link
                          href={`/orders/${appointment.work_order_id}`}
                          className="text-small text-text hover:text-primary focus-visible:ring-primary rounded-sm font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {order ? `${order.code} · ${order.title}` : "Abrir orden de trabajo"}
                        </Link>
                        <p className="text-text-2 text-caption">
                          {customerName ?? "Cliente sin nombre en la lista"}
                        </p>
                      </div>

                      <AgendaAppointmentMenu
                        tenantId={tenantId}
                        appointment={appointment}
                        technicians={technicians}
                        canWrite={canWrite}
                      />
                    </div>

                    <div className="text-text-2 mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption">
                      <Badge variant={appointmentStatusVariant(appointment.status)}>
                        {appointmentStatusLabel(appointment.status)}
                      </Badge>
                      <span className="inline-flex items-center gap-1.5">
                        <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                        {technician?.full_name ??
                          (technicians.length > 0 ? "Técnico fuera del equipo" : "Técnico asignado")}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {location ?? "Sin dirección cargada"}
                      </span>
                      <span className="numeric inline-flex items-center gap-1.5">
                        {start} – {end}
                      </span>
                    </div>

                    {appointment.notes && (
                      <p className="text-text-2 mt-2 text-caption">
                        <span className="text-text font-semibold">Nota:</span> {appointment.notes}
                      </p>
                    )}

                    {appointmentConflicts.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Conflictos del turno">
                        {appointmentConflicts.map((conflict) => (
                          <li key={conflict.id}>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-caption font-semibold",
                                severityBadgeClass[conflict.severity],
                              )}
                            >
                              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                              {conflict.label}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
