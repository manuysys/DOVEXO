"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";
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
import { api } from "@/lib/api";
import { userFacingError } from "@/lib/errors";

import type { CustomerRecord } from "./customer-labels";

const customerFormSchema = z.object({
  name: z.string().min(2, "Ingresá el nombre del cliente").max(160, "Máximo 160 caracteres"),
  phone: z.string().max(40, "Teléfono demasiado largo"),
  email: z.union([z.string().email("Email inválido"), z.literal("")]),
  address: z.string().max(240, "Máximo 240 caracteres"),
  city: z.string().max(120, "Máximo 120 caracteres"),
  province: z.string().max(120, "Máximo 120 caracteres"),
  postal_code: z.string().max(20, "Máximo 20 caracteres"),
  notes: z.string().max(2000, "Máximo 2000 caracteres"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const EMPTY_VALUES: CustomerFormValues = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  province: "",
  postal_code: "",
  notes: "",
};

function toFormValues(customer: CustomerRecord | null): CustomerFormValues {
  if (!customer) return EMPTY_VALUES;
  return {
    name: customer.name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    address: customer.address ?? "",
    city: customer.city ?? "",
    province: customer.province ?? "",
    postal_code: customer.postal_code ?? "",
    notes: customer.notes ?? "",
  };
}

/**
 * El backend acepta dirección y ubicación, pero `CustomerInput` todavía no las
 * declara. Se arma un objeto más amplio y se pasa como variable para no tocar
 * el cliente API compartido.
 */
type CustomerMutationPayload = {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  notes?: string;
};

function buildPayload(values: CustomerFormValues, isEdit: boolean): CustomerMutationPayload {
  const name = values.name.trim();
  const phone = values.phone.trim();
  const email = values.email.trim();
  const address = values.address.trim();
  const city = values.city.trim();
  const province = values.province.trim();
  const postalCode = values.postal_code.trim();
  const notes = values.notes.trim();

  if (isEdit) {
    return {
      name,
      phone,
      address,
      city,
      province,
      postal_code: postalCode,
      notes,
      ...(email ? { email } : {}),
    };
  }

  return {
    name,
    ...(phone ? { phone } : {}),
    ...(email ? { email } : {}),
    ...(address ? { address } : {}),
    ...(city ? { city } : {}),
    ...(province ? { province } : {}),
    ...(postalCode ? { postal_code: postalCode } : {}),
    ...(notes ? { notes } : {}),
  };
}

type FieldProps = {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

function Field({ label, htmlFor, error, hint, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-text mb-1 block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p id={`${htmlFor}-hint`} className="text-text-2 mt-1 text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${htmlFor}-error`} role="alert" className="text-danger-strong mt-1 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}

type CustomerFormDialogProps = {
  tenantId: string;
  customer?: CustomerRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Alta y edición de clientes. El contenido se monta de nuevo en cada apertura. */
export function CustomerFormDialog({
  tenantId,
  customer = null,
  open,
  onOpenChange,
}: CustomerFormDialogProps) {
  const isEdit = Boolean(customer);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Actualizá los datos de contacto. Los cambios quedan registrados en el historial."
              : "Cargá los datos básicos para empezar el historial del cliente."}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CustomerFormBody
            tenantId={tenantId}
            customer={customer}
            isEdit={isEdit}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type CustomerFormBodyProps = {
  tenantId: string;
  customer: CustomerRecord | null;
  isEdit: boolean;
  onDone: () => void;
};

function CustomerFormBody({ tenantId, customer, isEdit, onDone }: CustomerFormBodyProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: toFormValues(customer),
  });

  const mutation = useMutation({
    mutationFn: (values: CustomerFormValues) => {
      const payload = buildPayload(values, isEdit);
      if (customer) {
        return api.customers.update(tenantId, customer.id, payload);
      }
      return api.customers.create(tenantId, payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Cliente actualizado" : "Cliente creado");
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      if (customer) {
        void queryClient.invalidateQueries({ queryKey: ["customer", tenantId, customer.id] });
      }
      onDone();
    },
    onError: (error) => {
      toast.error(
        userFacingError(
          error,
          isEdit ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente",
        ),
      );
    },
  });

  const errorMessage = mutation.isError
    ? userFacingError(
        mutation.error,
        isEdit ? "No se pudo actualizar el cliente" : "No se pudo crear el cliente",
      )
    : null;

  async function onSubmit(values: CustomerFormValues) {
    try {
      await mutation.mutateAsync(values);
    } catch {
      // El error se muestra inline y con un toast desde `onError`.
    }
  }

  const busy = isSubmitting || mutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
      <Field
        label="Nombre *"
        htmlFor="customer-name"
        error={errors.name?.message}
        className="sm:col-span-2"
      >
        <Input
          id="customer-name"
          autoComplete="name"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "customer-name-error" : undefined}
          {...register("name")}
        />
      </Field>

      <Field label="Teléfono" htmlFor="customer-phone" error={errors.phone?.message}>
        <Input
          id="customer-phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={Boolean(errors.phone)}
          aria-describedby={errors.phone ? "customer-phone-error" : undefined}
          {...register("phone")}
        />
      </Field>

      <Field
        label="Email"
        htmlFor="customer-email"
        error={errors.email?.message}
        hint={isEdit ? "Si lo dejás vacío, se conserva el email actual." : undefined}
      >
        <Input
          id="customer-email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={
            errors.email
              ? "customer-email-error"
              : isEdit
                ? "customer-email-hint"
                : undefined
          }
          {...register("email")}
        />
      </Field>

      <Field
        label="Dirección"
        htmlFor="customer-address"
        error={errors.address?.message}
        className="sm:col-span-2"
      >
        <Input
          id="customer-address"
          autoComplete="street-address"
          aria-invalid={Boolean(errors.address)}
          aria-describedby={errors.address ? "customer-address-error" : undefined}
          {...register("address")}
        />
      </Field>

      <Field label="Ciudad" htmlFor="customer-city" error={errors.city?.message}>
        <Input
          id="customer-city"
          autoComplete="address-level2"
          aria-invalid={Boolean(errors.city)}
          aria-describedby={errors.city ? "customer-city-error" : undefined}
          {...register("city")}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Provincia" htmlFor="customer-province" error={errors.province?.message}>
          <Input
            id="customer-province"
            autoComplete="address-level1"
            aria-invalid={Boolean(errors.province)}
            aria-describedby={errors.province ? "customer-province-error" : undefined}
            {...register("province")}
          />
        </Field>
        <Field
          label="Código postal"
          htmlFor="customer-postal-code"
          error={errors.postal_code?.message}
        >
          <Input
            id="customer-postal-code"
            autoComplete="postal-code"
            aria-invalid={Boolean(errors.postal_code)}
            aria-describedby={errors.postal_code ? "customer-postal-code-error" : undefined}
            {...register("postal_code")}
          />
        </Field>
      </div>

      <Field
        label="Observaciones"
        htmlFor="customer-notes"
        error={errors.notes?.message}
        className="sm:col-span-2"
      >
        <textarea
          id="customer-notes"
          rows={3}
          className="border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-24 w-full rounded-ds-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2"
          aria-invalid={Boolean(errors.notes)}
          aria-describedby={errors.notes ? "customer-notes-error" : undefined}
          {...register("notes")}
        />
      </Field>

      {errorMessage && (
        <p
          role="alert"
          className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm sm:col-span-2"
        >
          {errorMessage}
        </p>
      )}

      <DialogFooter className="sm:col-span-2">
        <DialogClose asChild>
          <Button variant="outline" disabled={busy}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {busy ? "Guardando…" : isEdit ? "Guardar cambios" : "Guardar cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
