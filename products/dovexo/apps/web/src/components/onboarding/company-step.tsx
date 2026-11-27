"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OnboardingPatch, OnboardingState } from "@/lib/onboarding-api";
import {
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  ONBOARDING_TIMEZONES,
  companyStepSchema,
  isOnboardingTimezone,
  type CompanyStepValues,
} from "@/lib/onboarding-utils";

const TIMEZONE_LABELS: Record<(typeof ONBOARDING_TIMEZONES)[number], string> = {
  "America/Argentina/Buenos_Aires": "Buenos Aires (hora argentina)",
  "America/Argentina/Cordoba": "Córdoba",
  "America/Argentina/Mendoza": "Mendoza",
};

type CompanyStepProps = {
  state: Required<OnboardingState>;
  tenantName: string;
  pending: boolean;
  onSave: (patch: OnboardingPatch) => void;
};

export function CompanyStep({ state, tenantName, pending, onSave }: CompanyStepProps) {
  const saved = state.company;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyStepValues>({
    resolver: zodResolver(companyStepSchema),
    defaultValues: {
      name: saved?.name ?? tenantName,
      timezone: saved && isOnboardingTimezone(saved.timezone) ? saved.timezone : DEFAULT_TIMEZONE,
    },
  });

  function onSubmit(values: CompanyStepValues) {
    onSave({
      company: { name: values.name, timezone: values.timezone, currency: DEFAULT_CURRENCY },
      step: 2,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label
          htmlFor="onboarding-company-name"
          className="text-text mb-1 block text-sm font-medium"
        >
          Nombre de la empresa *
        </label>
        <Input
          id="onboarding-company-name"
          autoComplete="organization"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={
            errors.name ? "onboarding-company-name-error" : "onboarding-company-name-help"
          }
          {...register("name")}
        />
        <p id="onboarding-company-name-help" className="text-text-2 mt-1 text-xs">
          Es el nombre que ven tus clientes en presupuestos, emails y el portal.
        </p>
        {errors.name && (
          <p id="onboarding-company-name-error" className="text-danger mt-1 text-xs">
            {errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="onboarding-timezone" className="text-text mb-1 block text-sm font-medium">
          Zona horaria *
        </label>
        <select
          id="onboarding-timezone"
          aria-invalid={errors.timezone ? true : undefined}
          aria-describedby={
            errors.timezone ? "onboarding-timezone-error" : "onboarding-timezone-help"
          }
          className="border-border text-text focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2"
          {...register("timezone")}
        >
          {ONBOARDING_TIMEZONES.map((zone) => (
            <option key={zone} value={zone}>
              {TIMEZONE_LABELS[zone]}
            </option>
          ))}
        </select>
        <p id="onboarding-timezone-help" className="text-text-2 mt-1 text-xs">
          Se usa para agenda, vencimientos y reportes.
        </p>
        {errors.timezone && (
          <p id="onboarding-timezone-error" className="text-danger mt-1 text-xs">
            {errors.timezone.message}
          </p>
        )}
      </div>

      <div>
        <p className="text-text mb-1 text-sm font-medium">Moneda</p>
        <p className="border-border bg-surface-2 text-text-2 flex min-h-11 items-center gap-2 rounded-ds-md border px-3 text-sm">
          <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Peso argentino (ARS)
        </p>
        <p className="text-text-2 mt-1 text-xs">Por ahora todos los importes se expresan en ARS.</p>
      </div>

      <div className="border-border flex justify-end border-t pt-4 sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Guardando..." : "Guardar y continuar"}
        </Button>
      </div>
    </form>
  );
}
