"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormValues } from "@/features/products/schema";
import { slugify } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonStyles, Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export interface ProductFormProps {
  defaultValues: ProductFormValues;
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  submitLabel: string;
  isSubmitting?: boolean;
  formError?: string | null;
  cancelHref?: string;
}

function SectionLegend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">
      {children}
    </legend>
  );
}

export function ProductForm({
  defaultValues,
  onSubmit,
  submitLabel,
  isSubmitting = false,
  formError = null,
  cancelHref = "/products",
}: ProductFormProps) {
  const [slugEdited, setSlugEdited] = useState(
    defaultValues.slug.trim().length > 0,
  );
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues,
  });

  const name = useWatch({ control, name: "name" });

  useEffect(() => {
    if (slugEdited) return;
    setValue("slug", slugify(name ?? ""));
  }, [name, slugEdited, setValue]);

  const submit = handleSubmit(async (values) => {
    try {
      await onSubmit(values);
    } catch {
      // El contenedor muestra el error de la API.
    }
  });

  const slugRegistration = register("slug");

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {formError ? (
        <Alert variant="danger" title="No se pudo guardar el producto">
          {formError}
        </Alert>
      ) : null}

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <SectionLegend>Identidad</SectionLegend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Nombre"
            htmlFor="name"
            required
            error={errors.name?.message}
            hint="Nombre comercial visible en la plataforma."
          >
            <Input
              id="name"
              invalid={Boolean(errors.name)}
              placeholder="DOVEXO"
              {...register("name")}
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            required
            error={errors.slug?.message}
            hint="Identificador único en minúsculas."
          >
            <Input
              id="slug"
              invalid={Boolean(errors.slug)}
              placeholder="dovexo"
              {...slugRegistration}
              onChange={(event) => {
                setSlugEdited(true);
                void slugRegistration.onChange(event);
              }}
            />
          </Field>

          <Field
            label="Descripción"
            htmlFor="description"
            error={errors.description?.message}
            className="md:col-span-2"
            hint="Qué es el producto y a quién está dirigido."
          >
            <Textarea
              id="description"
              rows={3}
              invalid={Boolean(errors.description)}
              {...register("description")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <SectionLegend>Propuesta comercial</SectionLegend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Propuesta de valor"
            htmlFor="value_proposition"
            error={errors.value_proposition?.message}
            hint="Problema que resuelve y beneficio concreto."
          >
            <Textarea
              id="value_proposition"
              rows={4}
              invalid={Boolean(errors.value_proposition)}
              {...register("value_proposition")}
            />
          </Field>

          <Field
            label="Público objetivo"
            htmlFor="target_profile"
            error={errors.target_profile?.message}
            hint="Perfil de empresa o negocio que se busca."
          >
            <Textarea
              id="target_profile"
              rows={4}
              invalid={Boolean(errors.target_profile)}
              {...register("target_profile")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <SectionLegend>Segmentación</SectionLegend>
        <div className="grid gap-4 md:grid-cols-3">
          <Field
            label="Problemas que resuelve"
            htmlFor="pain_points"
            error={errors.pain_points?.message}
            hint="Uno por línea."
          >
            <Textarea
              id="pain_points"
              rows={5}
              invalid={Boolean(errors.pain_points)}
              {...register("pain_points")}
            />
          </Field>

          <Field
            label="Sectores objetivo"
            htmlFor="target_sectors"
            error={errors.target_sectors?.message}
            hint="Separados por coma o línea."
          >
            <Textarea
              id="target_sectors"
              rows={5}
              invalid={Boolean(errors.target_sectors)}
              {...register("target_sectors")}
            />
          </Field>

          <Field
            label="Palabras clave"
            htmlFor="keywords"
            error={errors.keywords?.message}
            hint="Señales a buscar en sitios y fichas."
          >
            <Textarea
              id="keywords"
              rows={5}
              invalid={Boolean(errors.keywords)}
              {...register("keywords")}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-line bg-surface p-5">
        <SectionLegend>Configuración avanzada</SectionLegend>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Configuración de scoring (JSON)"
            htmlFor="scoring_config"
            error={errors.scoring_config?.message}
            hint="Factores y pesos del producto. La estructura la define el backend."
          >
            <Textarea
              id="scoring_config"
              rows={7}
              spellCheck={false}
              className="font-mono text-xs"
              invalid={Boolean(errors.scoring_config)}
              {...register("scoring_config")}
            />
          </Field>

          <Field
            label="Configuración de mensajes (JSON)"
            htmlFor="messaging_config"
            error={errors.messaging_config?.message}
            hint="Canales, tono y plantillas. No se envían mensajes automáticos."
          >
            <Textarea
              id="messaging_config"
              rows={7}
              spellCheck={false}
              className="font-mono text-xs"
              invalid={Boolean(errors.messaging_config)}
              {...register("messaging_config")}
            />
          </Field>
        </div>

        <label className="mt-4 flex items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            className="mt-0.5 size-4 rounded border-line accent-accent"
            {...register("is_active")}
          />
          <span>
            Producto activo
            <span className="block text-xs text-muted">
              Solo los productos activos se usan para campañas nuevas.
            </span>
          </span>
        </label>
      </fieldset>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={cancelHref}
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
