"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { api, errorMessage, type Technician, type WorkOrder } from "@/lib/api";

const assignmentSchema = z.object({
  /** Cadena vacía = sin técnico asignado. */
  assigned_user_id: z.union([z.literal(""), z.uuid("Técnico inválido")]),
});

type AssignmentValues = z.infer<typeof assignmentSchema>;

const inputClass =
  "border-border text-text focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2";

type TechnicianAssignmentProps = {
  tenantId: string;
  order: WorkOrder;
  technicians: Technician[];
};

export function TechnicianAssignment({ tenantId, order, technicians }: TechnicianAssignmentProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AssignmentValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { assigned_user_id: order.assigned_user_id ?? "" },
  });

  const assignMutation = useMutation({
    mutationFn: (values: AssignmentValues) =>
      api.workOrders.update(tenantId, order.id, {
        assigned_user_id: values.assigned_user_id || null,
      }),
    onSuccess: (updated) => {
      reset({ assigned_user_id: updated.assigned_user_id ?? "" });
      void queryClient.invalidateQueries({ queryKey: ["work-order", tenantId, order.id] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders", tenantId] });
    },
  });

  const formError = assignMutation.error
    ? errorMessage(assignMutation.error, "No se pudo guardar la asignación")
    : null;
  const showSaved = assignMutation.isSuccess && !isDirty;

  return (
    <section
      aria-labelledby="assignment-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <h2 id="assignment-title" className="text-text text-base font-semibold">
        Técnico asignado
      </h2>
      <form onSubmit={handleSubmit((values) => assignMutation.mutate(values))} noValidate>
        <label htmlFor="assigned_user_id" className="text-text mt-4 mb-1 block text-small font-medium">
          Técnico
        </label>
        <select
          id="assigned_user_id"
          className={inputClass}
          aria-invalid={Boolean(errors.assigned_user_id)}
          aria-describedby={errors.assigned_user_id ? "assigned-user-error" : undefined}
          {...register("assigned_user_id")}
        >
          <option value="">Sin técnico asignado</option>
          {technicians.map((technician) => (
            <option key={technician.id} value={technician.id}>
              {technician.full_name}
            </option>
          ))}
        </select>
        {errors.assigned_user_id && (
          <p id="assigned-user-error" className="text-danger-strong mt-1 text-caption">
            {errors.assigned_user_id.message}
          </p>
        )}
        {technicians.length === 0 && (
          <p className="text-text-2 mt-1 text-caption">No hay técnicos cargados en la empresa.</p>
        )}

        {formError && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md mt-3 px-3 py-2 text-small">
            {formError}
          </p>
        )}
        {showSaved && (
          <p role="status" className="text-success-strong mt-3 text-small">
            Asignación guardada.
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button type="submit" size="sm" disabled={!isDirty || assignMutation.isPending}>
            {assignMutation.isPending ? "Guardando..." : "Guardar asignación"}
          </Button>
        </div>
      </form>
    </section>
  );
}
