"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  searchFormSchema,
  SEARCH_MAX_LIMIT,
  type SearchFormValues,
} from "@/features/search/schema";
import type { ProvinceOption, Sector } from "@/lib/api/types";
import { slugify } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export interface SearchFormProps {
  provinces: ReadonlyArray<ProvinceOption>;
  provincesUnavailable?: boolean;
  sectors: Sector[];
  sectorsUnavailable?: boolean;
  defaultValues: SearchFormValues;
  onSubmit: (values: SearchFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
  formError?: string | null;
}

export function SearchForm({
  provinces,
  provincesUnavailable = false,
  sectors,
  sectorsUnavailable = false,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  formError = null,
}: SearchFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
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
      {formError ? (
        <Alert variant="danger" title="No se pudo iniciar la búsqueda">
          {formError}
        </Alert>
      ) : null}

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Alcance geográfico
        </legend>
        <p className="mb-3 text-xs text-muted">
          La búsqueda nacional completa y las campañas automáticas llegan en la
          Fase 2B. Por ahora se ejecuta una provincia por corrida.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="País"
            htmlFor="search-country"
            hint="Argentina es el único país configurado."
            className="md:col-span-1"
          >
            <Input id="search-country" value="Argentina" readOnly disabled />
          </Field>

          <Field
            label="Provincia"
            htmlFor="province_code"
            required
            error={errors.province_code?.message}
            hint={
              provincesUnavailable
                ? "No se pudo consultar /meta/provinces: se muestra la lista local y los códigos pueden diferir."
                : undefined
            }
          >
            <Select
              id="province_code"
              invalid={Boolean(errors.province_code)}
              {...register("province_code")}
            >
              <option value="">Seleccioná una provincia…</option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Límite de resultados"
            htmlFor="limit"
            required
            error={errors.limit?.message}
            hint={`Entre 1 y ${SEARCH_MAX_LIMIT} por corrida. Por defecto 50.`}
          >
            <Input
              id="limit"
              type="number"
              min={1}
              max={SEARCH_MAX_LIMIT}
              invalid={Boolean(errors.limit)}
              {...register("limit", { valueAsNumber: true })}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Rubros
        </legend>
        <p className="mb-3 text-xs text-muted">
          Los rubros salen de la base de datos del backend (`/meta/sectors`) y
          es obligatorio elegir al menos uno: el proveedor consulta por rubro.
        </p>

        {sectorsUnavailable ? (
          <p className="mb-3 text-xs font-medium text-warning-strong">
            No se pudieron cargar los rubros desde la API. No se puede iniciar
            la búsqueda hasta que `/meta/sectors` responda: reintentá cuando el
            backend esté disponible.
          </p>
        ) : sectors.length === 0 ? (
          <p className="mb-3 text-xs text-muted">
            Todavía no hay rubros cargados en la base. Ejecutá el seed del
            backend antes de buscar.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => {
              const slug = sector.slug || slugify(sector.name);
              const label = sector.name || sector.slug;
              const id = `search-sector-${slugify(slug)}`;
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
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Palabras clave
        </legend>
        <Field
          label="Palabras clave"
          htmlFor="keywords"
          error={errors.keywords?.message}
          hint="Opcional. Una por línea o separadas por coma; se combinan con los rubros."
        >
          <Textarea
            id="keywords"
            rows={3}
            placeholder={"service de calderas\ninstalación de aires"}
            invalid={Boolean(errors.keywords)}
            {...register("keywords")}
          />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          La búsqueda consulta OpenStreetMap/Overpass con límites conservadores.
          No se generan resultados simulados.
        </p>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner label="Iniciando" />
              Iniciando…
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  );
}
