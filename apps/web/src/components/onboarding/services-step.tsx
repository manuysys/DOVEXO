"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Clock, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OnboardingPatch, OnboardingState } from "@/lib/onboarding-api";
import {
  MAX_SERVICES,
  WEEKDAYS,
  WEEKDAY_LABELS,
  buildSchedulePayload,
  buildServicesPayload,
  scheduleFormDefaults,
  servicesFormDefaults,
  servicesStepSchema,
  type ServicesStepValues,
} from "@/lib/onboarding-utils";
import { cn } from "@/lib/utils";

type ServicesStepProps = {
  state: Required<OnboardingState>;
  pending: boolean;
  onSave: (patch: OnboardingPatch) => void;
  onBack: () => void;
};

const SERVICES_LIST_ERROR_ID = "onboarding-services-list-error";
const SCHEDULE_ERROR_ID = "onboarding-schedule-error";

const timeInputClass =
  "border-border text-text focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2";

function fieldErrorId(index: number, field: "name" | "duration" | "price") {
  return `service-${field}-error-${index}`;
}

export function ServicesStep({ state, pending, onSave, onBack }: ServicesStepProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ServicesStepValues>({
    resolver: zodResolver(servicesStepSchema),
    defaultValues: {
      services: servicesFormDefaults(state.services),
      days: scheduleFormDefaults(state.schedule),
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "services" });

  const servicesListError =
    errors.services?.root?.message ??
    (typeof errors.services?.message === "string" ? errors.services.message : null);

  function onSubmit(values: ServicesStepValues) {
    onSave({
      services: buildServicesPayload(values.services),
      schedule: buildSchedulePayload(values.days),
      step: 3,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      <section aria-labelledby="onboarding-services-heading" className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 id="onboarding-services-heading" className="text-text text-sm font-semibold">
              Servicios que ofrecés
            </h3>
            <p className="text-text-2 mt-1 text-xs">
              Hasta {MAX_SERVICES} servicios. El precio es una referencia inicial, editable después.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || fields.length >= MAX_SERVICES}
            onClick={() => append({ name: "", duration: "60", price: "" })}
            className="self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar servicio
          </Button>
        </div>

        {fields.map((field, index) => {
          const itemErrors = errors.services?.[index];
          return (
            <fieldset key={field.id} className="border-border rounded-ds-md border p-4">
              <legend className="text-text-2 px-1 text-xs font-semibold">
                Servicio {index + 1}
              </legend>
              <div className="grid gap-3 sm:grid-cols-[1fr_8rem_9rem_auto] sm:items-start">
                <div>
                  <label
                    htmlFor={`service-name-${index}`}
                    className="text-text mb-1 block text-xs font-medium"
                  >
                    Nombre *
                  </label>
                  <Input
                    id={`service-name-${index}`}
                    className="min-h-11"
                    aria-invalid={itemErrors?.name ? true : undefined}
                    aria-describedby={itemErrors?.name ? fieldErrorId(index, "name") : undefined}
                    {...register(`services.${index}.name`)}
                  />
                  {itemErrors?.name && (
                    <p id={fieldErrorId(index, "name")} className="text-danger mt-1 text-xs">
                      {itemErrors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`service-duration-${index}`}
                    className="text-text mb-1 block text-xs font-medium"
                  >
                    Minutos *
                  </label>
                  <Input
                    id={`service-duration-${index}`}
                    inputMode="numeric"
                    className="min-h-11"
                    aria-invalid={itemErrors?.duration ? true : undefined}
                    aria-describedby={
                      itemErrors?.duration ? fieldErrorId(index, "duration") : undefined
                    }
                    {...register(`services.${index}.duration`)}
                  />
                  {itemErrors?.duration && (
                    <p id={fieldErrorId(index, "duration")} className="text-danger mt-1 text-xs">
                      {itemErrors.duration.message}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor={`service-price-${index}`}
                    className="text-text mb-1 block text-xs font-medium"
                  >
                    Precio (ARS) *
                  </label>
                  <Input
                    id={`service-price-${index}`}
                    inputMode="decimal"
                    placeholder="15000"
                    className="min-h-11"
                    aria-invalid={itemErrors?.price ? true : undefined}
                    aria-describedby={itemErrors?.price ? fieldErrorId(index, "price") : undefined}
                    {...register(`services.${index}.price`)}
                  />
                  {itemErrors?.price && (
                    <p id={fieldErrorId(index, "price")} className="text-danger mt-1 text-xs">
                      {itemErrors.price.message}
                    </p>
                  )}
                </div>
                <div className="sm:pt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={pending || fields.length === 1}
                    onClick={() => remove(index)}
                    aria-label={`Quitar servicio ${index + 1}`}
                    className="text-danger-strong hover:bg-danger-soft w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sm:sr-only">Quitar</span>
                  </Button>
                </div>
              </div>
            </fieldset>
          );
        })}
        {servicesListError && (
          <p id={SERVICES_LIST_ERROR_ID} role="alert" className="text-danger text-xs">
            {servicesListError}
          </p>
        )}
      </section>

      <section aria-labelledby="onboarding-schedule-heading" className="space-y-3">
        <div className="flex items-start gap-2">
          <Clock className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div>
            <h3 id="onboarding-schedule-heading" className="text-text text-sm font-semibold">
              Días y horarios de atención
            </h3>
            <p className="text-text-2 mt-1 text-xs">Hora de la empresa (Buenos Aires).</p>
          </div>
        </div>
        <ul className="divide-border border-border divide-y rounded-ds-md border">
          {WEEKDAYS.map((day) => (
            <li
              key={day}
              className="grid gap-3 px-4 py-3 sm:grid-cols-[10rem_1fr_1fr] sm:items-center"
            >
              <label className="text-text flex min-h-11 items-center gap-3 text-sm font-medium">
                <input
                  type="checkbox"
                  className="accent-primary h-4 w-4"
                  aria-describedby={errors.days?.message ? SCHEDULE_ERROR_ID : undefined}
                  {...register(`days.${day}.enabled`)}
                />
                {WEEKDAY_LABELS[day]}
              </label>
              <label className="text-text-2 flex flex-col gap-1 text-xs">
                Desde
                <input
                  type="time"
                  aria-describedby={errors.days?.message ? SCHEDULE_ERROR_ID : undefined}
                  className={cn(timeInputClass)}
                  {...register(`days.${day}.start`)}
                />
              </label>
              <label className="text-text-2 flex flex-col gap-1 text-xs">
                Hasta
                <input
                  type="time"
                  aria-describedby={errors.days?.message ? SCHEDULE_ERROR_ID : undefined}
                  className={cn(timeInputClass)}
                  {...register(`days.${day}.end`)}
                />
              </label>
            </li>
          ))}
        </ul>
        {errors.days?.message && (
          <p id={SCHEDULE_ERROR_ID} role="alert" className="text-danger text-xs">
            {errors.days.message}
          </p>
        )}
      </section>

      <div className="border-border flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" disabled={pending} onClick={onBack}>
          Volver
        </Button>
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Guardando..." : "Guardar y continuar"}
        </Button>
      </div>
    </form>
  );
}
