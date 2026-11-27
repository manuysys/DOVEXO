"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  agendaErrorMessage,
  findOverlappingAppointment,
  formatDayLong,
  formatTimeRange,
} from "@/components/agenda/agenda-utils";
import { Button } from "@/components/ui/button";
import { api, type Appointment, type Technician, type WorkOrder } from "@/lib/api";
import { dateTimeLocalFromDay, localDateTimeToIso } from "@/lib/agenda";

const appointmentFormSchema = z
  .object({
    work_order_id: z.uuid("Seleccioná una orden"),
    technician_id: z.uuid("Seleccioná un técnico"),
    starts_at: z.string().min(1, "Ingresá el inicio"),
    ends_at: z.string().min(1, "Ingresá el fin"),
    notes: z.string().trim().max(2000, "Máximo 2000 caracteres"),
  })
  .refine((values) => Date.parse(values.ends_at) > Date.parse(values.starts_at), {
    message: "El fin debe ser posterior al inicio",
    path: ["ends_at"],
  });

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const inputClass =
  "min-h-10 w-full rounded-ds-md border border-border bg-surface px-3 text-small text-text focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none";
const labelClass = "mb-1 block text-small font-semibold text-text";
const errorClass = "mt-1 text-caption text-danger-strong";

function toIso(value: string): string | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : null;
}

type AppointmentFormProps = {
  tenantId: string;
  /** Día `YYYY-MM-DD` usado para prellenar inicio (09:00) y fin (10:00). */
  day: string;
  orders: WorkOrder[];
  technicians: Technician[];
  /** Turnos ya cargados del día, para avisar de una superposición antes de guardar. */
  appointments?: readonly Appointment[];
  onDone: () => void;
};

export function AppointmentForm({
  tenantId,
  day,
  orders,
  technicians,
  appointments = [],
  onDone,
}: AppointmentFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      work_order_id: "",
      technician_id: "",
      starts_at: dateTimeLocalFromDay(day, "09:00"),
      ends_at: dateTimeLocalFromDay(day, "10:00"),
      notes: "",
    },
  });

  const technicianId = watch("technician_id");
  const startsAt = watch("starts_at");
  const endsAt = watch("ends_at");

  const overlap = useMemo(() => {
    if (!technicianId || !startsAt || !endsAt) return null;
    const startIso = toIso(startsAt);
    const endIso = toIso(endsAt);
    if (!startIso || !endIso) return null;
    return findOverlappingAppointment({
      appointments,
      technicianId,
      startsAt: startIso,
      endsAt: endIso,
    });
  }, [appointments, technicianId, startsAt, endsAt]);

  const createMutation = useMutation({
    mutationFn: (values: AppointmentFormValues) =>
      api.appointments.create(tenantId, {
        work_order_id: values.work_order_id,
        technician_id: values.technician_id,
        starts_at: localDateTimeToIso(values.starts_at),
        ends_at: localDateTimeToIso(values.ends_at),
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appointments", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", tenantId] });
      onDone();
    },
  });

  const formError = createMutation.error
    ? agendaErrorMessage(createMutation.error, "No se pudo crear el turno")
    : null;

  return (
    <form
      onSubmit={handleSubmit((values) => createMutation.mutateAsync(values))}
      className="border-border bg-surface rounded-ds-lg border p-4 shadow-card sm:p-5"
      noValidate
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h4 text-text">Nuevo turno</h2>
        <p className="text-text-2 text-caption">{formatDayLong(day)}</p>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="appointment-work-order" className={labelClass}>
            Orden de trabajo *
          </label>
          <select
            id="appointment-work-order"
            className={inputClass}
            aria-invalid={Boolean(errors.work_order_id)}
            aria-describedby={errors.work_order_id ? "appointment-work-order-error" : undefined}
            {...register("work_order_id")}
          >
            <option value="">Seleccionar orden</option>
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.code} · {order.title}
              </option>
            ))}
          </select>
          {errors.work_order_id && (
            <p id="appointment-work-order-error" className={errorClass}>
              {errors.work_order_id.message}
            </p>
          )}
          {orders.length === 0 && (
            <p className="text-text-2 mt-1 text-caption">
              No hay órdenes abiertas para agendar. Creá una orden primero.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="appointment-starts-at" className={labelClass}>
            Inicio *
          </label>
          <input
            id="appointment-starts-at"
            type="datetime-local"
            className={inputClass}
            aria-invalid={Boolean(errors.starts_at)}
            aria-describedby={errors.starts_at ? "appointment-starts-at-error" : undefined}
            {...register("starts_at")}
          />
          {errors.starts_at && (
            <p id="appointment-starts-at-error" className={errorClass}>
              {errors.starts_at.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="appointment-ends-at" className={labelClass}>
            Fin *
          </label>
          <input
            id="appointment-ends-at"
            type="datetime-local"
            className={inputClass}
            aria-invalid={Boolean(errors.ends_at)}
            aria-describedby={errors.ends_at ? "appointment-ends-at-error" : undefined}
            {...register("ends_at")}
          />
          {errors.ends_at && (
            <p id="appointment-ends-at-error" className={errorClass}>
              {errors.ends_at.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="appointment-technician" className={labelClass}>
            Técnico *
          </label>
          <select
            id="appointment-technician"
            className={inputClass}
            aria-invalid={Boolean(errors.technician_id)}
            aria-describedby={errors.technician_id ? "appointment-technician-error" : undefined}
            {...register("technician_id")}
          >
            <option value="">Seleccionar técnico</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.full_name}
              </option>
            ))}
          </select>
          {errors.technician_id && (
            <p id="appointment-technician-error" className={errorClass}>
              {errors.technician_id.message}
            </p>
          )}
          {technicians.length === 0 && (
            <p className="text-text-2 mt-1 text-caption">
              No hay técnicos activos en la empresa.
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="appointment-notes" className={labelClass}>
            Notas
          </label>
          <textarea
            id="appointment-notes"
            rows={2}
            className={inputClass}
            placeholder="Ej.: Llevar escalera y repuesto de capacitor"
            aria-invalid={Boolean(errors.notes)}
            aria-describedby={errors.notes ? "appointment-notes-error" : undefined}
            {...register("notes")}
          />
          {errors.notes && (
            <p id="appointment-notes-error" className={errorClass}>
              {errors.notes.message}
            </p>
          )}
        </div>
      </div>

      {overlap && (
        <p
          role="status"
          className="bg-warning-soft text-warning-strong mt-4 flex items-start gap-2 rounded-ds-md px-3 py-2 text-small"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Ese técnico ya tiene una visita de {formatTimeRange(overlap)}. El servidor va a rechazar
            el turno si se superpone.
          </span>
        </p>
      )}

      {formError && (
        <p
          role="alert"
          className="bg-danger-soft text-danger-strong mt-4 rounded-ds-md px-3 py-2 text-small"
        >
          {formError}
        </p>
      )}

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || createMutation.isPending}
          aria-busy={createMutation.isPending}
        >
          {createMutation.isPending ? "Guardando…" : "Guardar turno"}
        </Button>
      </div>
    </form>
  );
}
