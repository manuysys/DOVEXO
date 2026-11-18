"use client";

import { AlertTriangle, CalendarDays } from "lucide-react";
import Link from "next/link";

import {
  conflictsForAppointment,
  customerNameFor,
  formatDayLong,
  formatDayNumber,
  formatMinutesAsTime,
  formatWeekdayShort,
  minutesOfDay,
  type AgendaConflict,
  type AgendaCustomer,
} from "@/components/agenda/agenda-utils";
import { appointmentStatusLabel } from "@/lib/agenda";
import type { Appointment, WorkOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

type AgendaWeekViewProps = {
  days: readonly string[];
  today: string;
  appointmentsByDay: Readonly<Record<string, readonly Appointment[]>>;
  orders: readonly WorkOrder[];
  customers: readonly AgendaCustomer[];
  conflicts: readonly AgendaConflict[];
  onSelectDay: (day: string) => void;
};

export function AgendaWeekView({
  days,
  today,
  appointmentsByDay,
  orders,
  customers,
  conflicts,
  onSelectDay,
}: AgendaWeekViewProps) {
  const orderById = new Map(orders.map((order): [string, WorkOrder] => [order.id, order]));
  const totalAppointments = days.reduce(
    (total, day) => total + (appointmentsByDay[day]?.length ?? 0),
    0,
  );

  return (
    <section aria-labelledby="agenda-week-title">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="agenda-week-title" className="text-h4 text-text">
          Semana
        </h2>
        <p className="text-text-2 text-caption">
          {totalAppointments === 1 ? "1 visita" : `${totalAppointments} visitas`} ·{" "}
          {conflicts.length === 0
            ? "sin conflictos"
            : `${conflicts.length} ${conflicts.length === 1 ? "conflicto" : "conflictos"}`}
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = appointmentsByDay[day] ?? [];
          const isToday = day === today;
          const weekday = formatWeekdayShort(day);
          const dayNumber = formatDayNumber(day);

          return (
            <div
              key={day}
              className={cn(
                "bg-surface flex min-w-0 flex-col rounded-ds-md border shadow-card",
                isToday ? "border-primary/60" : "border-border",
              )}
            >
              <button
                type="button"
                onClick={() => onSelectDay(day)}
                aria-label={`Ver la agenda del ${formatDayLong(day)}`}
                className="border-border hover:bg-surface-2 focus-visible:ring-primary flex flex-col gap-0.5 border-b px-3 py-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-text-2 text-caption font-semibold tracking-wide uppercase">
                    {weekday}
                  </span>
                  {isToday && (
                    <span className="bg-info-soft text-info-strong rounded-full px-1.5 py-0.5 text-caption font-semibold">
                      Hoy
                    </span>
                  )}
                </span>
                <span className="numeric text-h4 text-text">{dayNumber}</span>
                <span className="text-text-2 text-caption">
                  {dayAppointments.length === 0
                    ? "Sin visitas"
                    : dayAppointments.length === 1
                      ? "1 visita"
                      : `${dayAppointments.length} visitas`}
                </span>
              </button>

              {dayAppointments.length === 0 ? (
                <p className="text-text-2 px-3 py-4 text-caption">Día libre.</p>
              ) : (
                <ul className="flex-1 space-y-1 p-2">
                  {dayAppointments.map((appointment) => {
                    const order = orderById.get(appointment.work_order_id);
                    const customerName = customerNameFor(customers, order?.customer_id);
                    const start = formatMinutesAsTime(minutesOfDay(appointment.starts_at));
                    const appointmentConflicts = conflictsForAppointment(conflicts, appointment.id);
                    const isCancelled = appointment.status === "cancelled";

                    return (
                      <li key={appointment.id}>
                        <Link
                          href={`/orders/${appointment.work_order_id}`}
                          aria-label={`${order?.code ?? "Orden"}, ${customerName ?? "cliente"}, ${start}, ${appointmentStatusLabel(appointment.status)}${appointmentConflicts.length > 0 ? ", con conflicto" : ""}`}
                          className={cn(
                            "focus-visible:ring-primary block rounded-ds-sm border px-2 py-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none",
                            appointmentConflicts.length > 0
                              ? "border-warning/50 bg-warning-soft/40 hover:border-warning"
                              : "border-border bg-surface-2/60 hover:border-primary/40 hover:bg-surface",
                            isCancelled && "opacity-60",
                          )}
                        >
                          <span className="flex items-center justify-between gap-1">
                            <span
                              className={cn(
                                "numeric text-caption text-text font-semibold",
                                isCancelled && "line-through",
                              )}
                            >
                              {start}
                            </span>
                            {appointmentConflicts.length > 0 && (
                              <>
                                <AlertTriangle
                                  className="text-warning-strong h-3 w-3 shrink-0"
                                  aria-hidden="true"
                                />
                                <span className="sr-only">Con conflicto</span>
                              </>
                            )}
                          </span>
                          <span className="text-text-2 block truncate text-caption">
                            {customerName ?? "Cliente sin nombre"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-text-2 mt-3 flex items-center gap-1.5 text-caption">
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
        Elegí un día para ver el detalle completo y las acciones de cada turno.
      </p>
    </section>
  );
}
