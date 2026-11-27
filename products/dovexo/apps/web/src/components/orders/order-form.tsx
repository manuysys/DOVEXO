"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiError, api, errorMessage, type Customer } from "@/lib/api";
import { PRIORITY_LABELS } from "@/lib/order-status";

const orderSchema = z.object({
  customer_id: z.string().uuid("Seleccioná un cliente"),
  title: z.string().min(2, "Ingresá el título de la orden"),
  description: z.string().max(5000, "Máximo 5000 caracteres").optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  scheduled_at: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;

const fieldClass =
  "border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2";

const errorClass = "text-danger-strong mt-1 text-caption";

type OrderFormProps = {
  tenantId: string;
  customers: Customer[];
  onCreated: () => void;
  onCancel: () => void;
};

export function OrderForm({ tenantId, customers, onCreated, onCancel }: OrderFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: { priority: "normal" },
  });

  const createMutation = useMutation({
    mutationFn: (values: OrderFormValues) =>
      api.workOrders.create(tenantId, {
        customer_id: values.customer_id,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        scheduled_at: values.scheduled_at ? new Date(values.scheduled_at).toISOString() : undefined,
      }),
    onSuccess: () => {
      toast.success("Orden creada");
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      reset({ priority: "normal" });
      onCreated();
    },
  });

  const formError = createMutation.error
    ? createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : errorMessage(createMutation.error, "No se pudo crear la orden")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva orden</CardTitle>
        <CardDescription>Asociá un cliente y definí prioridad y fecha.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <div>
            <label htmlFor="order-customer" className="text-text mb-1 block text-small font-medium">
              Cliente <span aria-hidden="true">*</span>
            </label>
            <select
              id="order-customer"
              className={fieldClass}
              aria-invalid={Boolean(errors.customer_id)}
              aria-describedby={errors.customer_id ? "order-customer-error" : undefined}
              {...register("customer_id")}
            >
              <option value="">Seleccionar cliente</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            {errors.customer_id && (
              <p id="order-customer-error" className={errorClass}>
                {errors.customer_id.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="order-priority" className="text-text mb-1 block text-small font-medium">
              Prioridad
            </label>
            <select id="order-priority" className={fieldClass} {...register("priority")}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="order-title" className="text-text mb-1 block text-small font-medium">
              Título <span aria-hidden="true">*</span>
            </label>
            <Input
              id="order-title"
              placeholder="Ej.: Instalación de equipo split"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "order-title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="order-title-error" className={errorClass}>
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="order-scheduled-at" className="text-text mb-1 block text-small font-medium">
              Fecha programada
            </label>
            <Input id="order-scheduled-at" type="datetime-local" {...register("scheduled_at")} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="order-description" className="text-text mb-1 block text-small font-medium">
              Descripción
            </label>
            <textarea
              id="order-description"
              rows={3}
              className="border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 w-full rounded-ds-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2"
              {...register("description")}
            />
          </div>

          {formError && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-small sm:col-span-2"
            >
              {formError}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Guardando..." : "Guardar orden"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
