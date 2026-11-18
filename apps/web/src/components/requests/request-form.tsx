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

import { REQUEST_SOURCE_LABELS, REQUEST_SOURCE_SEQUENCE } from "./request-list-utils";

const requestSchema = z.object({
  customer_id: z.string().uuid("Seleccioná un cliente"),
  title: z.string().min(2, "Ingresá el motivo de la solicitud"),
  description: z.string().max(5000, "Máximo 5000 caracteres").optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  source: z.enum(["whatsapp", "phone", "email", "web", "manual"]),
});

type RequestFormValues = z.infer<typeof requestSchema>;

const fieldClass =
  "border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2";

const errorClass = "text-danger-strong mt-1 text-caption";

type RequestFormProps = {
  tenantId: string;
  customers: Customer[];
  onCreated: () => void;
  onCancel: () => void;
};

export function RequestForm({ tenantId, customers, onCreated, onCancel }: RequestFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { priority: "normal", source: "manual" },
  });

  const createMutation = useMutation({
    mutationFn: (values: RequestFormValues) =>
      api.serviceRequests.create(tenantId, {
        customer_id: values.customer_id,
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        source: values.source,
      }),
    onSuccess: () => {
      toast.success("Solicitud creada");
      void queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      reset({ priority: "normal", source: "manual" });
      onCreated();
    },
  });

  const formError = createMutation.error
    ? createMutation.error instanceof ApiError
      ? createMutation.error.detail
      : errorMessage(createMutation.error, "No se pudo crear la solicitud")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nueva solicitud</CardTitle>
        <CardDescription>Registrá la consulta antes de comprometer una visita.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => createMutation.mutate(values))}
          className="grid gap-4 sm:grid-cols-2"
          noValidate
        >
          <div>
            <label htmlFor="request-customer" className="text-text mb-1 block text-small font-medium">
              Cliente <span aria-hidden="true">*</span>
            </label>
            <select
              id="request-customer"
              className={fieldClass}
              aria-invalid={Boolean(errors.customer_id)}
              aria-describedby={errors.customer_id ? "request-customer-error" : undefined}
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
              <p id="request-customer-error" className={errorClass}>
                {errors.customer_id.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="request-priority" className="text-text mb-1 block text-small font-medium">
              Prioridad
            </label>
            <select id="request-priority" className={fieldClass} {...register("priority")}>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="request-title" className="text-text mb-1 block text-small font-medium">
              Motivo <span aria-hidden="true">*</span>
            </label>
            <Input
              id="request-title"
              placeholder="Ej.: El aire acondicionado no enfría"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? "request-title-error" : undefined}
              {...register("title")}
            />
            {errors.title && (
              <p id="request-title-error" className={errorClass}>
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="request-source" className="text-text mb-1 block text-small font-medium">
              Origen
            </label>
            <select id="request-source" className={fieldClass} {...register("source")}>
              {REQUEST_SOURCE_SEQUENCE.map((source) => (
                <option key={source} value={source}>
                  {REQUEST_SOURCE_LABELS[source] ?? source}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="request-description" className="text-text mb-1 block text-small font-medium">
              Descripción
            </label>
            <textarea
              id="request-description"
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
              {createMutation.isPending ? "Guardando..." : "Guardar solicitud"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
