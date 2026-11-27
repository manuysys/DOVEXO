"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyFormSchema,
  type CompanyFormValues,
} from "@/features/prospects/schema";
import type { DuplicateCompany } from "@/features/prospects/duplicate";
import type { ProvinceOption, Sector } from "@/lib/api/types";
import { slugify } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonStyles, Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export interface CompanyFormProps {
  provinces: ReadonlyArray<ProvinceOption>;
  provincesUnavailable?: boolean;
  sectors: Sector[];
  sectorsUnavailable?: boolean;
  defaultValues: CompanyFormValues;
  onSubmit: (values: CompanyFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
  formError?: string | null;
  duplicate?: DuplicateCompany | null;
}

export function CompanyForm({
  provinces,
  provincesUnavailable = false,
  sectors,
  sectorsUnavailable = false,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  formError = null,
  duplicate = null,
}: CompanyFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues,
  });

  const watchedSectors = useWatch({ control, name: "sector_slugs" });
  const selectedSectors = watchedSectors ?? [];

  const toggleSector = (slug: string) => {
    const next = selectedSectors.includes(slug)
      ? selectedSectors.filter((item) => item !== slug)
      : [...selectedSectors, slug];
    setValue("sector_slugs", next, { shouldValidate: true });
  };

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch {
      // El contenedor muestra el error de la API.
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {duplicate ? (
        <Alert variant="warning" title="Ya existe una empresa con esos datos">
          <p>{duplicate.message}</p>
          {duplicate.id ? (
            <p className="mt-2">
              <Link
                href={`/prospects/${duplicate.id}`}
                className="font-semibold underline"
              >
                Ver la empresa existente
                {duplicate.name ? `: ${duplicate.name}` : ""}
              </Link>
            </p>
          ) : null}
        </Alert>
      ) : null}

      {formError ? (
        <Alert variant="danger" title="No se pudo guardar la empresa">
          {formError}
        </Alert>
      ) : null}

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Datos generales
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nombre"
            htmlFor="name"
            required
            error={errors.name?.message}
            className="md:col-span-2"
          >
            <Input
              id="name"
              placeholder="Razón social o nombre comercial"
              invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>

          <Field
            label="Sitio web"
            htmlFor="website"
            error={errors.website?.message}
            hint="Opcional. Incluí el protocolo: https://…"
          >
            <Input
              id="website"
              inputMode="url"
              placeholder="https://empresa.com.ar"
              invalid={Boolean(errors.website)}
              {...register("website")}
            />
          </Field>

          <Field
            label="Provincia"
            htmlFor="province"
            error={errors.province?.message}
            hint={
              provincesUnavailable
                ? "No se pudo consultar /meta/provinces: se muestra la lista local."
                : undefined
            }
          >
            <Select
              id="province"
              invalid={Boolean(errors.province)}
              {...register("province")}
            >
              <option value="">Sin especificar</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Localidad"
            htmlFor="locality"
            error={errors.locality?.message}
          >
            <Input
              id="locality"
              placeholder="Ej.: Rosario"
              invalid={Boolean(errors.locality)}
              {...register("locality")}
            />
          </Field>

          <Field
            label="Dirección"
            htmlFor="address"
            error={errors.address?.message}
          >
            <Input
              id="address"
              placeholder="Calle, número, barrio"
              invalid={Boolean(errors.address)}
              {...register("address")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Rubros
        </legend>
        <p className="mb-3 text-xs text-muted">
          Obligatorio: el backend guarda cada empresa con al menos un rubro.
          Los rubros salen de la base (`/meta/sectors`).
        </p>

        {sectorsUnavailable ? (
          <p className="text-xs font-medium text-warning-strong">
            No se pudieron cargar los rubros desde la API. No se puede guardar
            la empresa hasta que `/meta/sectors` responda.
          </p>
        ) : sectors.length === 0 ? (
          <p className="text-xs text-muted">
            Todavía no hay rubros cargados en la base. Ejecutá el seed del
            backend antes de dar de alta empresas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => {
              const slug = sector.slug || slugify(sector.name);
              const label = sector.name || sector.slug;
              const id = `company-sector-${slugify(slug)}`;
              return (
                <label
                  key={sector.id || slug}
                  htmlFor={id}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    id={id}
                    type="checkbox"
                    className="size-4 rounded border-line accent-accent"
                    checked={selectedSectors.includes(slug)}
                    onChange={() => toggleSector(slug)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        )}
        {errors.sector_slugs?.message ? (
          <p role="alert" className="mt-2 text-xs font-medium text-danger">
            {errors.sector_slugs.message}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Contacto
        </legend>
        <p className="mb-3 text-xs text-muted">
          Solo datos públicos. No se envían mensajes ni se verifican números en
          esta fase.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Teléfono"
            htmlFor="phone"
            error={errors.phone?.message}
            hint="Opcional."
          >
            <Input
              id="phone"
              inputMode="tel"
              placeholder="+54 341 555-5555"
              invalid={Boolean(errors.phone)}
              {...register("phone")}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={errors.email?.message} hint="Opcional.">
            <Input
              id="email"
              inputMode="email"
              placeholder="contacto@empresa.com.ar"
              invalid={Boolean(errors.email)}
              {...register("email")}
            />
          </Field>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/prospects"
          className={buttonStyles({ variant: "ghost", size: "md" })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner label="Guardando" />
              Guardando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
