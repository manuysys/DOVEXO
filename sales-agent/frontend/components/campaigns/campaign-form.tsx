"use client";

import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  campaignSchema,
  campaignSources,
  SOURCE_LABELS,
  type CampaignFormValues,
  type CampaignSource,
} from "@/features/campaigns/schema";
import { ARGENTINA_PROVINCES } from "@/lib/data/provinces";
import type { Product, Sector } from "@/lib/api/types";
import { slugify } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonStyles, Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export interface CampaignFormProps {
  products: Product[];
  sectors?: Sector[];
  sectorsUnavailable?: boolean;
  defaultValues: CampaignFormValues;
  onSubmit: (values: CampaignFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
  formError?: string | null;
}

export function CampaignForm({
  products,
  sectors = [],
  sectorsUnavailable = false,
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  formError = null,
}: CampaignFormProps) {
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues,
  });

  const watchedProvinces = useWatch({ control, name: "provinces" });
  const watchedSectors = useWatch({ control, name: "selected_sectors" });
  const watchedSources = useWatch({ control, name: "sources" });
  const provinces = watchedProvinces ?? [];
  const selectedSectors = watchedSectors ?? [];
  const sources = watchedSources ?? [];

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch {
      // El contenedor muestra el error de la API.
    }
  });

  const toggleProvince = (province: string) => {
    const next = provinces.includes(province)
      ? provinces.filter((item) => item !== province)
      : [...provinces, province];
    setValue("provinces", next, { shouldValidate: true });
  };

  const toggleSector = (sector: string) => {
    const next = selectedSectors.includes(sector)
      ? selectedSectors.filter((item) => item !== sector)
      : [...selectedSectors, sector];
    setValue("selected_sectors", next, { shouldValidate: true });
  };

  const toggleSource = (source: CampaignSource) => {
    const next = sources.includes(source)
      ? sources.filter((item) => item !== source)
      : [...sources, source];
    setValue("sources", next, { shouldValidate: true });
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="danger" title="No se pudo guardar la campaña">
          {formError}
        </Alert>
      ) : null}

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
          Definición
        </legend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Producto"
            htmlFor="product_id"
            required
            error={errors.product_id?.message}
          >
            <Select
              id="product_id"
              invalid={Boolean(errors.product_id)}
              {...register("product_id")}
            >
              <option value="">Seleccioná un producto…</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Estado"
            htmlFor="status"
            error={errors.status?.message}
            hint="Podés iniciar la campaña más tarde desde el detalle."
          >
            <Select
              id="status"
              invalid={Boolean(errors.status)}
              {...register("status")}
            >
              <option value="draft">Borrador</option>
              <option value="active">Activa</option>
            </Select>
          </Field>

          <Field
            label="Nombre"
            htmlFor="name"
            required
            error={errors.name?.message}
          >
            <Input
              id="name"
              placeholder="DOVEXO - Argentina - Prospección inicial"
              invalid={Boolean(errors.name)}
              {...register("name")}
            />
          </Field>

          <Field
            label="País"
            htmlFor="country"
            required
            error={errors.country?.message}
          >
            <Input
              id="country"
              invalid={Boolean(errors.country)}
              {...register("country")}
            />
          </Field>

          <Field
            label="Descripción"
            htmlFor="description"
            error={errors.description?.message}
            className="md:col-span-2"
          >
            <Textarea
              id="description"
              rows={2}
              invalid={Boolean(errors.description)}
              {...register("description")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Alcance geográfico
        </legend>
        <p className="mb-3 text-xs text-muted">
          Si no seleccionás provincias, la campaña abarca todo el país.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {ARGENTINA_PROVINCES.map((province) => {
            const id = `province-${slugify(province)}`;
            return (
              <label
                key={province}
                htmlFor={id}
                className="flex items-center gap-2 text-sm text-ink"
              >
                <input
                  id={id}
                  type="checkbox"
                  className="size-4 rounded border-line accent-accent"
                  checked={provinces.includes(province)}
                  onChange={() => toggleProvince(province)}
                />
                {province}
              </label>
            );
          })}
        </div>

        <Field
          label="Localidades"
          htmlFor="localities"
          error={errors.localities?.message}
          hint="Opcional. Una por línea o separadas por coma."
          className="mt-4"
        >
          <Textarea
            id="localities"
            rows={2}
            invalid={Boolean(errors.localities)}
            {...register("localities")}
          />
        </Field>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Rubros
        </legend>
        {sectorsUnavailable ? (
          <p className="mb-3 text-xs text-warning-strong">
            No se pudieron cargar los rubros desde la API. Escribilos
            manualmente.
          </p>
        ) : sectors.length > 0 ? (
          <div className="mb-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
            {sectors.map((sector) => {
              const label = sector.name || sector.slug;
              const id = `sector-${slugify(label)}`;
              return (
                <label
                  key={sector.id || label}
                  htmlFor={id}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    id={id}
                    type="checkbox"
                    className="size-4 rounded border-line accent-accent"
                    checked={selectedSectors.includes(label)}
                    onChange={() => toggleSector(label)}
                  />
                  {label}
                </label>
              );
            })}
          </div>
        ) : (
          <p className="mb-3 text-xs text-muted">
            Todavía no hay rubros cargados en la base. Podés escribirlos a mano.
          </p>
        )}

        <Field
          label="Rubros adicionales"
          htmlFor="manual_sectors"
          error={errors.manual_sectors?.message}
          hint="Separados por coma o línea. Se combinan con los seleccionados."
        >
          <Textarea
            id="manual_sectors"
            rows={2}
            invalid={Boolean(errors.manual_sectors)}
            {...register("manual_sectors")}
          />
        </Field>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <legend className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">
          Fuentes y límites
        </legend>
        <p className="mb-3 text-xs text-muted">
          Solo fuentes gratuitas. La ejecución real de búsquedas llega en la
          Fase 2; hoy la campaña queda configurada y pendiente.
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          {campaignSources.map((source) => (
            <label
              key={source}
              htmlFor={`source-${source}`}
              className="flex items-center gap-2 text-sm text-ink"
            >
              <input
                id={`source-${source}`}
                type="checkbox"
                className="size-4 rounded border-line accent-accent"
                checked={sources.includes(source)}
                onChange={() => toggleSource(source)}
              />
              {SOURCE_LABELS[source]}
            </label>
          ))}
        </div>
        {errors.sources?.message ? (
          <p role="alert" className="mt-2 text-xs font-medium text-danger">
            {errors.sources.message}
          </p>
        ) : null}

        <Field
          label="Límite de resultados"
          htmlFor="max_results"
          error={errors.max_results?.message}
          hint="Entre 1 y 1000 por corrida."
          className="mt-4 max-w-xs"
        >
          <Input
            id="max_results"
            type="number"
            min={1}
            max={1000}
            invalid={Boolean(errors.max_results)}
            {...register("max_results", { valueAsNumber: true })}
          />
        </Field>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href="/campaigns"
          className={buttonStyles({ variant: "ghost", size: "md" })}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={isSubmitting || products.length === 0}>
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
