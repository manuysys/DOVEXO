"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { portalApi, type PortalSession } from "@/lib/portal-api";

import { PortalNotice } from "./portal-ui";

const requestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Contanos brevemente qué necesitás.")
    .max(200, "Usá hasta 200 caracteres."),
  description: z.string().max(5000, "Usá hasta 5000 caracteres.").optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
});

type RequestValues = z.infer<typeof requestSchema>;

const PRIORITY_OPTIONS: { value: RequestValues["priority"]; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "low", label: "Puede esperar" },
  { value: "high", label: "Es urgente" },
];

export function PortalNewRequest({
  session,
  onCreated,
}: {
  session: PortalSession;
  onCreated: () => void;
}) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: { title: "", description: "", priority: "normal" },
  });

  const mutation = useMutation({
    mutationFn: (values: RequestValues) =>
      portalApi.createRequest(session.slug, session.token, {
        title: values.title,
        description: values.description?.trim() || undefined,
        priority: values.priority,
      }),
    onSuccess: () => {
      toast.success("Recibimos tu solicitud");
      reset();
      setOpen(false);
      onCreated();
    },
  });

  function openDialog() {
    mutation.reset();
    setOpen(true);
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Nueva solicitud
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pedir un servicio</DialogTitle>
            <DialogDescription>
              Contanos qué necesitás. La empresa recibe la solicitud y se comunica con vos.
            </DialogDescription>
          </DialogHeader>

          <form
            className="mt-4 space-y-4"
            noValidate
            onSubmit={(event) => {
              void handleSubmit((values) => mutation.mutate(values))(event);
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="portal-request-title" className="text-small font-semibold text-text">
                ¿Qué necesitás?
              </label>
              <Input
                id="portal-request-title"
                placeholder="Ej.: El aire acondicionado no enfría"
                autoComplete="off"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "portal-request-title-error" : undefined}
                {...register("title")}
              />
              {errors.title && (
                <p
                  id="portal-request-title-error"
                  className="text-small text-danger-strong"
                  role="alert"
                >
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="portal-request-description"
                className="text-small font-semibold text-text"
              >
                Detalles <span className="font-normal text-text-2">(opcional)</span>
              </label>
              <textarea
                id="portal-request-description"
                rows={4}
                placeholder="Marca, modelo, qué pasa y desde cuándo."
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "portal-request-description-error" : undefined
                }
                className="min-h-24 w-full rounded-ds-md border border-border bg-surface px-3 py-2 text-sm text-text outline-none placeholder:text-text-2/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("description")}
              />
              {errors.description && (
                <p
                  id="portal-request-description-error"
                  className="text-small text-danger-strong"
                  role="alert"
                >
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="portal-request-priority"
                className="text-small font-semibold text-text"
              >
                ¿Qué tan urgente es?
              </label>
              <select
                id="portal-request-priority"
                className="min-h-11 w-full rounded-ds-md border border-border bg-surface px-3 text-sm text-text outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                {...register("priority")}
              >
                {PRIORITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {mutation.isError && (
              <PortalNotice role="alert" tone="danger">
                No pudimos enviar tu solicitud. Revisá tu conexión e intentá de nuevo.
              </PortalNotice>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting || mutation.isPending}>
                {isSubmitting || mutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Enviar solicitud
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
