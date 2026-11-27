"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Save, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ACTION_TYPE_LABELS,
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_EVENT_TYPES,
  EVENT_TYPE_LABELS,
  automationFormSchema,
  type AutomationFormValues,
} from "@/lib/automations";
import { errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const EMPTY_VALUES: AutomationFormValues = {
  name: "",
  event_type: "quote_approved",
  action_type: "notify",
  conditions: "",
  action_config: "",
  user_id: "",
  active: true,
};

const inputClass =
  "border-border bg-surface text-text placeholder:text-text-2/70 focus-visible:border-primary focus-visible:ring-primary/30 w-full rounded-ds-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";

type AutomationRuleFormProps = {
  pending: boolean;
  error: unknown;
  onCancel: () => void;
  onSubmit: (values: AutomationFormValues) => void;
};

export function AutomationRuleForm({ pending, error, onCancel, onSubmit }: AutomationRuleFormProps) {
  const form = useForm<AutomationFormValues>({
    resolver: zodResolver(automationFormSchema),
    defaultValues: EMPTY_VALUES,
  });
  const actionType = useWatch({ control: form.control, name: "action_type" });

  return (
    <Card>
      <CardHeader>
        <CardTitle id="automation-form-title">Nueva regla</CardTitle>
        <p className="text-text-2 text-sm">
          Una regla escucha un evento del negocio y ejecuta una acción. Podés dejarla inactiva y
          activarla cuando la revises.
        </p>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          aria-labelledby="automation-form-title"
          className="space-y-5"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="automation-name" className="text-text mb-1 block text-sm font-medium">
                Nombre <span aria-hidden="true">*</span>
              </label>
              <input
                id="automation-name"
                placeholder="Ej.: Avisar cuando se aprueba un presupuesto"
                aria-invalid={Boolean(form.formState.errors.name)}
                aria-describedby={form.formState.errors.name ? "automation-name-error" : undefined}
                className={inputClass}
                {...form.register("name")}
              />
              <FieldError
                id="automation-name-error"
                message={form.formState.errors.name?.message}
              />
            </div>

            <div>
              <label htmlFor="automation-event" className="text-text mb-1 block text-sm font-medium">
                Disparador <span aria-hidden="true">*</span>
              </label>
              <select id="automation-event" className={inputClass} {...form.register("event_type")}>
                {AUTOMATION_EVENT_TYPES.map((eventType) => (
                  <option key={eventType} value={eventType}>
                    {EVENT_TYPE_LABELS[eventType]}
                  </option>
                ))}
              </select>
              <p className="text-text-2 mt-1 text-xs">El evento del negocio que inicia la regla.</p>
              <FieldError
                id="automation-event-error"
                message={form.formState.errors.event_type?.message}
              />
            </div>

            <div>
              <label
                htmlFor="automation-action"
                className="text-text mb-1 block text-sm font-medium"
              >
                Acción <span aria-hidden="true">*</span>
              </label>
              <select
                id="automation-action"
                className={inputClass}
                {...form.register("action_type")}
              >
                {AUTOMATION_ACTION_TYPES.map((actionTypeOption) => (
                  <option key={actionTypeOption} value={actionTypeOption}>
                    {ACTION_TYPE_LABELS[actionTypeOption]}
                  </option>
                ))}
              </select>
              <p className="text-text-2 mt-1 text-xs">Qué hace el sistema cuando ocurre el evento.</p>
              <FieldError
                id="automation-action-error"
                message={form.formState.errors.action_type?.message}
              />
            </div>

            {actionType === "notify_user" && (
              <div className="sm:col-span-2">
                <label htmlFor="automation-user" className="text-text mb-1 block text-sm font-medium">
                  Usuario destinatario (UUID) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="automation-user"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={Boolean(form.formState.errors.user_id)}
                  aria-describedby={
                    form.formState.errors.user_id ? "automation-user-error" : "automation-user-help"
                  }
                  className={cn(inputClass, "font-mono")}
                  {...form.register("user_id")}
                />
                <p id="automation-user-help" className="text-text-2 mt-1 text-xs">
                  Se puede indicar también en la configuración JSON como <code>user_id</code>.
                </p>
                <FieldError
                  id="automation-user-error"
                  message={form.formState.errors.user_id?.message}
                />
              </div>
            )}
          </div>

          <div className="border-border space-y-4 border-t pt-4">
            <div>
              <h3 className="text-text text-sm font-semibold">Condiciones (opcional)</h3>
              <p className="text-text-2 mt-0.5 text-xs">
                Sin condiciones, la regla aplica siempre que ocurra el evento. Los filtros se
                escriben como objeto JSON.
              </p>
            </div>

            <div>
              <label
                htmlFor="automation-conditions"
                className="text-text mb-1 block text-sm font-medium"
              >
                Filtros del evento
              </label>
              <textarea
                id="automation-conditions"
                rows={3}
                spellCheck={false}
                placeholder='{"total__gte": 50000}'
                aria-invalid={Boolean(form.formState.errors.conditions)}
                aria-describedby={
                  form.formState.errors.conditions
                    ? "automation-conditions-error"
                    : "automation-conditions-help"
                }
                className={cn(inputClass, "font-mono")}
                {...form.register("conditions")}
              />
              <p id="automation-conditions-help" className="text-text-2 mt-1 text-xs">
                Ejemplos: <code>total__gte</code> (monto mínimo), <code>priority</code> (prioridad),{" "}
                <code>to_status</code> (estado destino).
              </p>
              <FieldError
                id="automation-conditions-error"
                message={form.formState.errors.conditions?.message}
              />
            </div>

            <div>
              <label
                htmlFor="automation-config"
                className="text-text mb-1 block text-sm font-medium"
              >
                Configuración de la acción
              </label>
              <textarea
                id="automation-config"
                rows={3}
                spellCheck={false}
                placeholder='{"title": "Presupuesto aprobado", "message": "El cliente aprobó el presupuesto."}'
                aria-invalid={Boolean(form.formState.errors.action_config)}
                aria-describedby={
                  form.formState.errors.action_config
                    ? "automation-config-error"
                    : "automation-config-help"
                }
                className={cn(inputClass, "font-mono")}
                {...form.register("action_config")}
              />
              <p id="automation-config-help" className="text-text-2 mt-1 text-xs">
                Acepta <code>title</code> y <code>message</code> para personalizar la notificación.
              </p>
              <FieldError
                id="automation-config-error"
                message={form.formState.errors.action_config?.message}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="automation-active"
              type="checkbox"
              className="border-border text-primary focus-visible:ring-primary h-4 w-4 rounded focus-visible:ring-2"
              {...form.register("active")}
            />
            <label htmlFor="automation-active" className="text-text text-sm font-medium">
              Activar al guardar
            </label>
          </div>

          {Boolean(error) && (
            <p role="alert" className="bg-danger-soft text-danger-strong rounded-lg px-3 py-2 text-sm">
              {errorMessage(error, "No se pudo crear la regla")}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onCancel} disabled={pending}>
              <X className="h-4 w-4" aria-hidden="true" />
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {pending ? "Guardando..." : "Guardar regla"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function FieldError({ id, message }: { id: string; message: string | undefined }) {
  if (!message) return null;
  return (
    <p id={id} className="text-danger mt-1 text-xs">
      {message}
    </p>
  );
}
