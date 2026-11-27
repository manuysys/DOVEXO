"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ApiError, api, errorMessage, type WorkOrderMaterialInput } from "@/lib/api";
import { MATERIAL_UNITS, normalizeQuantity } from "@/lib/technician";
import { cn, formatDate, formatNumber } from "@/lib/utils";

const materialSchema = z.object({
  description: z
    .string()
    .trim()
    .min(2, "Describí el material")
    .max(200, "La descripción supera los 200 caracteres"),
  quantity: z
    .string()
    .trim()
    .refine(
      (value) => normalizeQuantity(value) !== null,
      "Ingresá una cantidad mayor a 0 (hasta 3 decimales)",
    ),
  unit: z.enum(MATERIAL_UNITS, { error: "Seleccioná una unidad" }),
});

type MaterialFormValues = z.infer<typeof materialSchema>;

type Props = {
  tenantId: string;
  orderId: string;
};

function materialErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.status === 403) return "No tenés permiso para registrar materiales en este trabajo.";
    if (error.status === 422) return "Revisá la descripción y la cantidad.";
  }
  return errorMessage(error, "No pudimos registrar el material. Reintentá.");
}

export function TechnicianMaterials({ tenantId, orderId }: Props) {
  const queryClient = useQueryClient();
  const [added, setAdded] = useState(false);
  const materialsKey = ["tech-materials", tenantId, orderId];

  const materialsQuery = useQuery({
    queryKey: materialsKey,
    queryFn: () => api.technicianWorkOrders.materials.list(tenantId, orderId),
    enabled: Boolean(tenantId && orderId),
  });

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormValues>({
    resolver: zodResolver(materialSchema),
    defaultValues: { description: "", quantity: "1", unit: "u" },
  });

  const createMutation = useMutation({
    mutationFn: (input: WorkOrderMaterialInput) =>
      api.technicianWorkOrders.materials.create(tenantId, orderId, input),
    onSuccess: () => {
      reset({ description: "", quantity: "1", unit: "u" });
      setAdded(true);
      void queryClient.invalidateQueries({ queryKey: materialsKey });
    },
  });

  const materials = materialsQuery.data ?? [];
  const serverError = createMutation.isError ? materialErrorMessage(createMutation.error) : null;
  const selectedUnit = watch("unit");

  function adjustQuantity(delta: number) {
    const current = normalizeQuantity(watch("quantity"));
    const base = current ? Number(current) : 0;
    const next = Math.max(0.5, Math.round((base + delta) * 1000) / 1000);
    setValue("quantity", String(next).replace(".", ","), { shouldValidate: false });
  }

  function onSubmit(values: MaterialFormValues) {
    const quantity = normalizeQuantity(values.quantity);
    if (quantity === null) {
      setError("quantity", { message: "Ingresá una cantidad mayor a 0 (hasta 3 decimales)" });
      return;
    }
    setAdded(false);
    createMutation.reset();
    createMutation.mutate({ description: values.description, quantity, unit: values.unit });
  }

  return (
    <section
      aria-labelledby="tech-materials-title"
      className="rounded-ds-lg border border-border bg-surface p-4 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="tech-materials-title" className="text-h4 text-text">
            Materiales usados
          </h2>
          <p className="text-caption mt-0.5 text-text-2">Registrá rápido lo que usaste.</p>
        </div>
        <span className="text-caption text-text-2">
          {materials.length === 1 ? "1 material" : `${materials.length} materiales`}
        </span>
      </div>

      <form className="mt-3 space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="material-description" className="text-label mb-1 block text-text-2">
            Material
          </label>
          <input
            id="material-description"
            type="text"
            placeholder="Ej.: Caño de cobre 1/4"
            aria-invalid={errors.description ? true : undefined}
            className="min-h-12 w-full rounded-ds-md border border-border bg-surface px-3 text-base text-text outline-none placeholder:text-text-2/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-small mt-1 text-danger-strong">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="material-quantity" className="text-label mb-1 block text-text-2">
            Cantidad
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => adjustQuantity(-0.5)}
              aria-label="Restar cantidad"
              className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-ds-md border border-border bg-surface text-text transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Minus className="h-5 w-5" aria-hidden="true" />
            </button>
            <input
              id="material-quantity"
              type="text"
              inputMode="decimal"
              placeholder="1"
              aria-invalid={errors.quantity ? true : undefined}
              aria-describedby={
                errors.quantity ? "material-quantity-error" : "material-quantity-hint"
              }
              className="numeric min-h-12 w-full rounded-ds-md border border-border bg-surface px-2 text-center text-base text-text outline-none placeholder:text-text-2/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              {...register("quantity")}
            />
            <button
              type="button"
              onClick={() => adjustQuantity(0.5)}
              aria-label="Sumar cantidad"
              className="inline-flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-ds-md border border-border bg-surface text-text transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <Plus className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {errors.quantity ? (
            <p id="material-quantity-error" className="text-small mt-1 text-danger-strong">
              {errors.quantity.message}
            </p>
          ) : (
            <p id="material-quantity-hint" className="text-caption mt-1 text-text-2">
              Podés usar decimales con coma: 1,5.
            </p>
          )}
        </div>

        <fieldset>
          <legend className="text-label text-text-2">Unidad</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MATERIAL_UNITS.map((unit) => {
              const active = selectedUnit === unit;
              return (
                <button
                  key={unit}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setValue("unit", unit, { shouldValidate: true })}
                  className={cn(
                    "text-small min-h-11 min-w-11 rounded-ds-md border px-3 font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-surface text-text hover:bg-surface-2",
                  )}
                >
                  {unit}
                </button>
              );
            })}
          </div>
          {errors.unit && (
            <p className="text-small mt-1 text-danger-strong">{errors.unit.message}</p>
          )}
        </fieldset>

        {serverError && (
          <p
            role="alert"
            className="text-small rounded-ds-sm bg-danger-soft px-3 py-2 text-danger-strong"
          >
            {serverError}
          </p>
        )}
        {added && !serverError && (
          <p
            role="status"
            className="text-small rounded-ds-sm bg-success-soft px-3 py-2 text-success-strong"
          >
            Material registrado.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || createMutation.isPending}
        >
          {createMutation.isPending ? "Registrando…" : "Agregar material"}
        </Button>
      </form>

      <div className="mt-4">
        {materialsQuery.isLoading ? (
          <p className="text-small text-text-2">Cargando materiales…</p>
        ) : materialsQuery.isError ? (
          <div className="rounded-ds-sm bg-danger-soft px-3 py-2">
            <p role="alert" className="text-small text-danger-strong">
              No pudimos cargar los materiales.
            </p>
            <button
              type="button"
              onClick={() => void materialsQuery.refetch()}
              className="text-small mt-2 min-h-11 rounded-ds-sm border border-border bg-surface px-3 font-semibold text-text"
            >
              Reintentar
            </button>
          </div>
        ) : materials.length === 0 ? (
          <div className="rounded-ds-md border border-dashed border-border bg-surface-2/40 px-3 py-3">
            <p className="text-small font-medium text-text">Todavía no registraste materiales.</p>
            <p className="text-caption mt-0.5 text-text-2">
              Anotá lo que usaste con la cantidad para que quede en el trabajo.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {materials.map((material) => (
              <li key={material.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-small font-medium break-words text-text">
                    {material.description}
                  </p>
                  <p className="text-caption text-text-2">{formatDate(material.created_at)}</p>
                </div>
                <span className="numeric text-caption shrink-0 rounded-full bg-surface-2 px-2.5 py-1 font-semibold text-text">
                  {formatNumber(material.quantity)} {material.unit}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
