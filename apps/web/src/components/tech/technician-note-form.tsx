"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { ApiError, api, errorMessage } from "@/lib/api";

const noteSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(3, "Escribí una nota de al menos 3 caracteres")
    .max(2000, "La nota supera los 2000 caracteres"),
});

type NoteFormValues = z.infer<typeof noteSchema>;

type Props = {
  tenantId: string;
  orderId: string;
};

function noteErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.status === 403) return "No tenés permiso para agregar notas en este trabajo.";
  }
  return errorMessage(error, "No pudimos guardar la nota. Reintentá.");
}

export function TechnicianNoteForm({ tenantId, orderId }: Props) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { notes: "" },
  });

  const noteMutation = useMutation({
    mutationFn: (notes: string) => api.technicianWorkOrders.note(tenantId, orderId, notes),
    onSuccess: () => {
      reset({ notes: "" });
      setSaved(true);
    },
  });

  const serverError = noteMutation.isError ? noteErrorMessage(noteMutation.error) : null;

  return (
    <section
      aria-labelledby="tech-note-title"
      className="rounded-ds-lg border border-border bg-surface p-4 shadow-card"
    >
      <h2 id="tech-note-title" className="text-h4 text-text">
        Notas del trabajo
      </h2>
      <p className="text-caption mt-0.5 text-text-2">Se guarda en el historial con fecha y hora.</p>
      <form
        className="mt-3 space-y-3"
        onSubmit={handleSubmit((values) => {
          setSaved(false);
          noteMutation.reset();
          noteMutation.mutate(values.notes);
        })}
      >
        <div>
          <label htmlFor="tech-note" className="text-label mb-1 block text-text-2">
            Nota
          </label>
          <textarea
            id="tech-note"
            rows={3}
            placeholder="Ej.: Se reemplazó el capacitor y se probó el equipo."
            aria-invalid={errors.notes ? true : undefined}
            aria-describedby={errors.notes ? "tech-note-error" : undefined}
            className="min-h-24 w-full rounded-ds-md border border-border bg-surface px-3 py-2 text-base text-text outline-none placeholder:text-text-2/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
            {...register("notes")}
          />
          {errors.notes && (
            <p id="tech-note-error" className="text-small mt-1 text-danger-strong">
              {errors.notes.message}
            </p>
          )}
        </div>
        {serverError && (
          <p
            role="alert"
            className="text-small rounded-ds-sm bg-danger-soft px-3 py-2 text-danger-strong"
          >
            {serverError}
          </p>
        )}
        {saved && !serverError && (
          <p
            role="status"
            className="text-small rounded-ds-sm bg-success-soft px-3 py-2 text-success-strong"
          >
            Nota guardada.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || noteMutation.isPending}
        >
          {noteMutation.isPending ? "Guardando…" : "Guardar nota"}
        </Button>
      </form>
    </section>
  );
}
