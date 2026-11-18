"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, MoreHorizontal, XCircle } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  agendaErrorMessage,
  formatMinutesAsTime,
  minutesOfDay,
} from "@/components/agenda/agenda-utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api, type Appointment, type Technician } from "@/lib/api";
import { argentinaDayKey, localDateTimeToIso } from "@/lib/agenda";
import { cn, formatDateOnly } from "@/lib/utils";

const inputClass =
  "min-h-10 w-full rounded-ds-md border border-border bg-surface px-3 text-small text-text focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none";
const labelClass = "mb-1 block text-small font-semibold text-text";
const errorClass = "mt-1 text-caption text-danger-strong";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const rescheduleSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Elegí una fecha"),
    start: z.string().regex(timePattern, "Usá el formato HH:MM"),
    end: z.string().regex(timePattern, "Usá el formato HH:MM"),
    technician_id: z.uuid("Seleccioná un técnico"),
  })
  .refine((values) => values.end > values.start, {
    message: "El fin tiene que ser posterior al inicio",
    path: ["end"],
  });

type RescheduleValues = z.infer<typeof rescheduleSchema>;

type AgendaAppointmentMenuProps = {
  tenantId: string;
  appointment: Appointment;
  technicians: readonly Technician[];
  /** Sin permiso de escritura no se muestra el menú de acciones. */
  canWrite: boolean;
  className?: string;
};

/**
 * Acciones del turno sin depender de arrastrar: reprogramar, reasignar técnico y
 * cancelar mediante formularios y menús accesibles por teclado.
 */
export function AgendaAppointmentMenu({
  tenantId,
  appointment,
  technicians,
  canWrite,
  className,
}: AgendaAppointmentMenuProps) {
  const queryClient = useQueryClient();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const openingDialogRef = useRef(false);

  const invalidateAgenda = () => {
    void queryClient.invalidateQueries({ queryKey: ["appointments", tenantId] });
    void queryClient.invalidateQueries({ queryKey: ["work-orders", tenantId] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", tenantId] });
  };

  const rescheduleMutation = useMutation({
    mutationFn: (values: RescheduleValues) =>
      api.appointments.update(tenantId, appointment.id, {
        technician_id: values.technician_id,
        starts_at: localDateTimeToIso(`${values.date}T${values.start}`),
        ends_at: localDateTimeToIso(`${values.date}T${values.end}`),
      }),
    onSuccess: () => {
      invalidateAgenda();
      setRescheduleOpen(false);
      toast.success("Turno reprogramado.");
    },
    onError: (error) => {
      toast.error(agendaErrorMessage(error, "No se pudo reprogramar el turno."));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.appointments.cancel(tenantId, appointment.id),
    onSuccess: () => {
      invalidateAgenda();
      setCancelOpen(false);
      toast.success("Turno cancelado.");
    },
    onError: (error) => {
      toast.error(agendaErrorMessage(error, "No se pudo cancelar el turno."));
    },
  });

  if (!canWrite) return null;

  const startTime = formatMinutesAsTime(minutesOfDay(appointment.starts_at));
  const endTime = formatMinutesAsTime(minutesOfDay(appointment.ends_at));
  const isCancelled = appointment.status === "cancelled";
  const canCancel = appointment.status === "scheduled";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Acciones del turno de las ${startTime}`}
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md border border-border bg-surface text-text-2 transition-colors hover:bg-surface-2 hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
              className,
            )}
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="border-border bg-surface text-text shadow-raised"
          onCloseAutoFocus={(event) => {
            if (openingDialogRef.current) {
              event.preventDefault();
              openingDialogRef.current = false;
            }
          }}
        >
          <DropdownMenuItem asChild className="focus:bg-surface-2">
            <Link href={`/orders/${appointment.work_order_id}`} className="cursor-pointer">
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Abrir orden
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={isCancelled}
            className="focus:bg-surface-2"
            onSelect={() => {
              openingDialogRef.current = true;
              setRescheduleOpen(true);
            }}
          >
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Reprogramar turno
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border my-1" />
          <DropdownMenuItem
            disabled={!canCancel}
            className="text-danger-strong focus:bg-danger-soft focus:text-danger-strong"
            onSelect={() => {
              openingDialogRef.current = true;
              setCancelOpen(true);
            }}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancelar turno
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {rescheduleOpen && (
        <RescheduleDialog
          appointment={appointment}
          technicians={technicians}
          pending={rescheduleMutation.isPending}
          error={
            rescheduleMutation.error
              ? agendaErrorMessage(rescheduleMutation.error, "No se pudo reprogramar el turno.")
              : null
          }
          onClose={() => setRescheduleOpen(false)}
          onSubmit={(values) => rescheduleMutation.mutateAsync(values)}
        />
      )}

      {cancelOpen && (
        <Dialog open onOpenChange={(open) => !open && setCancelOpen(false)}>
          <DialogContent className="border-border bg-surface rounded-ds-xl max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-text">Cancelar turno</DialogTitle>
              <DialogDescription className="text-text-2">
                El turno del {formatDateOnly(appointment.starts_at)} de {startTime} a {endTime} queda
                registrado como cancelado. Esta acción no se puede deshacer.
              </DialogDescription>
            </DialogHeader>

            {cancelMutation.error && (
              <p role="alert" className="bg-danger-soft text-danger-strong mt-4 rounded-ds-md px-3 py-2 text-small">
                {agendaErrorMessage(cancelMutation.error, "No se pudo cancelar el turno.")}
              </p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelOpen(false)}>
                Volver
              </Button>
              <Button
                variant="danger"
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                aria-busy={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? "Cancelando…" : "Cancelar turno"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

type RescheduleDialogProps = {
  appointment: Appointment;
  technicians: readonly Technician[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (values: RescheduleValues) => Promise<unknown>;
};

function RescheduleDialog({
  appointment,
  technicians,
  pending,
  error,
  onClose,
  onSubmit,
}: RescheduleDialogProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RescheduleValues>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      date: argentinaDayKey(appointment.starts_at),
      start: formatMinutesAsTime(minutesOfDay(appointment.starts_at)),
      end: formatMinutesAsTime(minutesOfDay(appointment.ends_at)),
      technician_id: appointment.technician_id,
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-border bg-surface rounded-ds-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text">Reprogramar turno</DialogTitle>
          <DialogDescription className="text-text-2">
            Cambiá la fecha, el horario o el técnico. El servidor rechaza la superposición con otro
            turno del mismo técnico.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((values) => onSubmit(values))} className="mt-4 space-y-3" noValidate>
          <div>
            <label htmlFor="reschedule-date" className={labelClass}>
              Fecha
            </label>
            <input
              id="reschedule-date"
              type="date"
              className={inputClass}
              aria-invalid={Boolean(errors.date)}
              aria-describedby={errors.date ? "reschedule-date-error" : undefined}
              {...register("date")}
            />
            {errors.date && (
              <p id="reschedule-date-error" className={errorClass}>
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="reschedule-start" className={labelClass}>
                Inicio
              </label>
              <input
                id="reschedule-start"
                type="time"
                className={inputClass}
                aria-invalid={Boolean(errors.start)}
                aria-describedby={errors.start ? "reschedule-start-error" : undefined}
                {...register("start")}
              />
              {errors.start && (
                <p id="reschedule-start-error" className={errorClass}>
                  {errors.start.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="reschedule-end" className={labelClass}>
                Fin
              </label>
              <input
                id="reschedule-end"
                type="time"
                className={inputClass}
                aria-invalid={Boolean(errors.end)}
                aria-describedby={errors.end ? "reschedule-end-error" : undefined}
                {...register("end")}
              />
              {errors.end && (
                <p id="reschedule-end-error" className={errorClass}>
                  {errors.end.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="reschedule-technician" className={labelClass}>
              Técnico
            </label>
            <select
              id="reschedule-technician"
              className={inputClass}
              aria-invalid={Boolean(errors.technician_id)}
              aria-describedby={errors.technician_id ? "reschedule-technician-error" : undefined}
              {...register("technician_id")}
            >
              {!technicians.some((technician) => technician.id === appointment.technician_id) && (
                <option value={appointment.technician_id}>
                  Técnico actual (fuera del equipo activo)
                </option>
              )}
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.full_name}
                </option>
              ))}
            </select>
            {errors.technician_id && (
              <p id="reschedule-technician-error" className={errorClass}>
                {errors.technician_id.message}
              </p>
            )}
            {technicians.length === 0 && (
              <p className="text-text-2 mt-1 text-caption">
                No hay técnicos activos en la empresa.
              </p>
            )}
          </div>

          {error && (
            <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-small">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Volver
            </Button>
            <Button type="submit" disabled={pending} aria-busy={pending}>
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
