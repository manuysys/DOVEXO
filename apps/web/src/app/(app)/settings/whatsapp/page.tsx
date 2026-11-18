"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Circle,
  KeyRound,
  MessageCircle,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, errorMessage, type WhatsAppConfig, type WhatsAppMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  buildWhatsAppConfigInput,
  whatsappConfigFormSchema,
  whatsappSendSchema,
  type WhatsAppConfigFormValues,
  type WhatsAppSendFormValues,
} from "@/lib/whatsapp";
import { cn, formatDate } from "@/lib/utils";

const ADMIN_ROLES = ["owner", "admin"];

const inputClass =
  "border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-11 w-full rounded-ds-md border bg-surface px-3 text-sm outline-none focus:ring-2 aria-[invalid=true]:border-danger";

const DIRECTION_LABELS: Record<string, string> = {
  inbound: "Entrante",
  outbound: "Saliente",
};

const MESSAGE_STATUS_VARIANTS: Record<string, BadgeProps["variant"]> = {
  sent: "info",
  delivered: "success",
  read: "success",
  failed: "danger",
  queued: "neutral",
};

const MESSAGE_STATUS_LABELS: Record<string, string> = {
  sent: "Enviado",
  delivered: "Entregado",
  read: "Leído",
  failed: "Fallido",
  queued: "En cola",
};

export default function WhatsAppSettingsPage() {
  const { activeTenantId, tenants } = useAuth();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManage = ADMIN_ROLES.includes(activeTenant?.role ?? "");

  const configQuery = useQuery({
    queryKey: ["whatsapp-config", activeTenantId],
    queryFn: () => api.whatsapp.getConfig(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  const messagesQuery = useQuery({
    queryKey: ["whatsapp-messages", activeTenantId],
    queryFn: () => api.whatsapp.messages(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  if (!activeTenantId) {
    return (
      <Card className="p-8 text-sm text-text-2">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
        <span className="bg-warning-soft text-warning-strong flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-text text-sm font-semibold">
            Solo los administradores pueden configurar WhatsApp
          </p>
          <p className="text-text-2 mt-1 text-sm">
            Pedile al propietario o a un administrador de {activeTenant?.name ?? "la empresa"} que
            revise la integración.
          </p>
        </div>
      </Card>
    );
  }

  const config = configQuery.data;
  const messages = messagesQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuración"
        title="WhatsApp"
        description={`Integración y mensajes de ${activeTenant?.name ?? "tu empresa"} con la API oficial de Meta.`}
      />

      {configQuery.isLoading ? (
        <ConfigSkeleton />
      ) : configQuery.isError ? (
        <Card className="space-y-4 p-6">
          <p role="alert" className="text-danger-strong text-sm">
            {errorMessage(configQuery.error, "No se pudo cargar la configuración de WhatsApp.")}
          </p>
          <Button variant="outline" onClick={() => void configQuery.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </Card>
      ) : config ? (
        <>
          <ConfigSummary config={config} />
          <Card>
            <CardHeader className="border-border border-b">
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="text-primary h-4 w-4" aria-hidden="true" />
                Configuración
              </CardTitle>
              <p className="text-text-2 text-sm">
                Los secretos no se muestran. Dejá un campo vacío para conservar el valor guardado.
              </p>
            </CardHeader>
            <CardContent className="pt-5">
              <WhatsAppConfigForm
                key={configKey(config)}
                tenantId={activeTenantId}
                config={config}
              />
            </CardContent>
          </Card>
        </>
      ) : null}

      <WhatsAppSendForm tenantId={activeTenantId} configured={config?.configured ?? null} />

      <Card>
        <CardHeader className="border-border flex-row items-start justify-between gap-3 border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="text-accent-teal h-4 w-4" aria-hidden="true" />
              Mensajes
            </CardTitle>
            <p className="text-text-2 mt-1 text-sm">Últimos mensajes registrados de la empresa.</p>
          </div>
          {!messagesQuery.isLoading && !messagesQuery.isError && (
            <Badge variant="neutral" className="numeric shrink-0">
              {messages.length} {messages.length === 1 ? "mensaje" : "mensajes"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {messagesQuery.isLoading ? (
            <div className="space-y-3 p-5" role="status" aria-label="Cargando mensajes">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : messagesQuery.isError ? (
            <div className="space-y-3 p-5">
              <p role="alert" className="text-danger-strong text-sm">
                {errorMessage(messagesQuery.error, "No se pudieron cargar los mensajes.")}
              </p>
              <Button variant="outline" size="sm" onClick={() => void messagesQuery.refetch()}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Reintentar
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <p className="text-text-2 p-6 text-sm">
              Todavía no hay mensajes registrados. Los mensajes que envíes o recibas aparecen acá.
            </p>
          ) : (
            <ul className="divide-border divide-y">
              {messages.map((message) => (
                <MessageItem key={message.id} message={message} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function configKey(config: WhatsAppConfig): string {
  return [
    config.configured,
    config.active,
    config.phone_number_id ?? "",
    config.business_account_id ?? "",
    config.has_access_token,
    config.has_verify_token,
    config.has_app_secret,
  ].join("|");
}

type Requirement = {
  label: string;
  loaded: boolean;
  hint: string;
};

function configRequirements(config: WhatsAppConfig): Requirement[] {
  return [
    {
      label: "phone_number_id",
      loaded: Boolean(config.phone_number_id),
      hint: "Identificador del número de WhatsApp Business.",
    },
    {
      label: "business_account_id",
      loaded: Boolean(config.business_account_id),
      hint: "Identificador de la cuenta de empresa de Meta.",
    },
    {
      label: "Access token",
      loaded: config.has_access_token,
      hint: "Token de acceso permanente de la app de Meta.",
    },
    {
      label: "Verify token",
      loaded: config.has_verify_token,
      hint: "Secreto compartido para verificar el webhook.",
    },
    {
      label: "App secret",
      loaded: config.has_app_secret,
      hint: "Firma HMAC de los webhooks entrantes.",
    },
  ];
}

function ConfigSummary({ config }: { config: WhatsAppConfig }) {
  const requirements = configRequirements(config);
  const missing = requirements.filter((requirement) => !requirement.loaded);
  const ready = missing.length === 0;

  return (
    <section
      aria-labelledby="status-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="status-title" className="text-text text-label">
            Estado de la integración
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant={config.configured ? "success" : "neutral"}>
              {config.configured ? "Configurado" : "Sin configurar"}
            </Badge>
            <Badge variant={config.active ? "success" : "neutral"}>
              {config.active ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-ds-lg",
            ready ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong",
          )}
          aria-hidden="true"
        >
          {ready ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
        </span>
      </div>

      <p
        className={cn(
          "mt-4 rounded-ds-md px-4 py-3 text-sm",
          ready ? "bg-success-soft text-success-strong" : "bg-warning-soft text-warning-strong",
        )}
      >
        {ready
          ? config.active
            ? "La integración está configurada y activa. Los envíos usan la API oficial de Meta."
            : "La integración está configurada pero inactiva. Activá el interruptor para enviar."
          : `Faltan ${missing.length} de ${requirements.length} datos. Sin credenciales reales no se puede enviar ningún mensaje.`}
      </p>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2" aria-label="Requisitos de la integración">
        {requirements.map((requirement) => (
          <li
            key={requirement.label}
            className="border-border flex items-start gap-2 rounded-ds-md border px-3 py-2"
          >
            {requirement.loaded ? (
              <CheckCircle2 className="text-success mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="text-text font-mono text-xs break-all">{requirement.label}</p>
              <p className="text-text-2 mt-0.5 text-xs">
                {requirement.loaded ? "Cargado" : "Falta"} · {requirement.hint}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <dl className="border-border mt-4 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <Phone className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-text-2 text-xs">phone_number_id</dt>
            <dd className="text-text font-mono break-all">
              {config.phone_number_id ?? "Sin configurar"}
            </dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Building2 className="text-text-2 mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-text-2 text-xs">business_account_id</dt>
            <dd className="text-text font-mono break-all">
              {config.business_account_id ?? "Sin configurar"}
            </dd>
          </div>
        </div>
      </dl>
    </section>
  );
}

function WhatsAppConfigForm({ tenantId, config }: { tenantId: string; config: WhatsAppConfig }) {
  const queryClient = useQueryClient();
  const form = useForm<WhatsAppConfigFormValues>({
    resolver: zodResolver(whatsappConfigFormSchema),
    defaultValues: {
      phone_number_id: config.phone_number_id ?? "",
      business_account_id: config.business_account_id ?? "",
      access_token: "",
      verify_token: "",
      app_secret: "",
      active: config.active,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: WhatsAppConfigFormValues) =>
      api.whatsapp.updateConfig(tenantId, buildWhatsAppConfigInput(values)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-config", tenantId] });
    },
  });

  function submit(values: WhatsAppConfigFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        form.reset({ ...values, access_token: "", verify_token: "", app_secret: "" });
      },
    });
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} noValidate className="space-y-6">
      <section aria-labelledby="wa-ids-title" className="space-y-3">
        <h3 id="wa-ids-title" className="text-text text-sm font-semibold">
          Identificadores
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wa-phone-number-id" className="text-text mb-1 block text-sm font-medium">
              phone_number_id *
            </label>
            <input
              id="wa-phone-number-id"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(form.formState.errors.phone_number_id)}
              aria-describedby={
                form.formState.errors.phone_number_id ? "wa-phone-number-id-error" : undefined
              }
              className={inputClass}
              {...form.register("phone_number_id")}
            />
            <FieldError
              id="wa-phone-number-id-error"
              message={form.formState.errors.phone_number_id?.message}
            />
          </div>

          <div>
            <label
              htmlFor="wa-business-account-id"
              className="text-text mb-1 block text-sm font-medium"
            >
              business_account_id *
            </label>
            <input
              id="wa-business-account-id"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(form.formState.errors.business_account_id)}
              aria-describedby={
                form.formState.errors.business_account_id
                  ? "wa-business-account-id-error"
                  : undefined
              }
              className={inputClass}
              {...form.register("business_account_id")}
            />
            <FieldError
              id="wa-business-account-id-error"
              message={form.formState.errors.business_account_id?.message}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="wa-secrets-title" className="space-y-3">
        <div>
          <h3 id="wa-secrets-title" className="text-text text-sm font-semibold">
            Credenciales
          </h3>
          <p className="text-text-2 mt-1 text-xs">
            Se guardan cifradas. Nunca se vuelven a mostrar completas.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SecretField
            id="wa-access-token"
            label="Access token"
            loaded={config.has_access_token}
            error={form.formState.errors.access_token?.message}
            registration={form.register("access_token")}
          />
          <SecretField
            id="wa-verify-token"
            label="Verify token"
            loaded={config.has_verify_token}
            error={form.formState.errors.verify_token?.message}
            registration={form.register("verify_token")}
          />
          <SecretField
            id="wa-app-secret"
            label="App secret"
            loaded={config.has_app_secret}
            error={form.formState.errors.app_secret?.message}
            registration={form.register("app_secret")}
          />
        </div>
      </section>

      <section aria-labelledby="wa-active-title" className="border-border border-t pt-5">
        <h3 id="wa-active-title" className="sr-only">
          Estado de la integración
        </h3>
        <label className="flex items-start gap-3 text-sm">
          <input
            id="wa-active"
            type="checkbox"
            className="accent-primary mt-0.5 h-4 w-4 rounded border-border"
            aria-describedby="wa-active-help"
            {...form.register("active")}
          />
          <span>
            <span className="text-text block font-medium">Integración activa</span>
            <span id="wa-active-help" className="text-text-2 block text-xs">
              Si está inactiva, los envíos quedan registrados como no enviados.
            </span>
          </span>
        </label>
      </section>

      {mutation.error && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
          {errorMessage(mutation.error, "No se pudo guardar la configuración.")}
        </p>
      )}
      {mutation.isSuccess && (
        <p
          role="status"
          className="bg-success-soft text-success-strong rounded-ds-md px-3 py-2 text-sm"
        >
          Configuración guardada.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
          {mutation.isPending ? "Guardando..." : "Guardar configuración"}
        </Button>
      </div>
    </form>
  );
}

function SecretField({
  id,
  label,
  loaded,
  error,
  registration,
}: {
  id: string;
  label: string;
  loaded: boolean;
  error: string | undefined;
  registration: UseFormRegisterReturn<"access_token" | "verify_token" | "app_secret">;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="text-text mb-1 block text-sm font-medium">
        {label}{" "}
        <span className="text-text-2 text-xs font-normal">
          ({loaded ? "cargado: dejar vacío para conservar" : "no cargado"})
        </span>
      </label>
      <input
        id={id}
        type="password"
        autoComplete="new-password"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        placeholder={loaded ? "••••••••" : ""}
        className={inputClass}
        {...registration}
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function WhatsAppSendForm({
  tenantId,
  configured,
}: {
  tenantId: string;
  configured: boolean | null;
}) {
  const queryClient = useQueryClient();
  const form = useForm<WhatsAppSendFormValues>({
    resolver: zodResolver(whatsappSendSchema),
    defaultValues: { to_phone: "", body: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: WhatsAppSendFormValues) =>
      api.whatsapp.send(tenantId, values.to_phone, values.body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["whatsapp-messages", tenantId] });
    },
  });

  function submit(values: WhatsAppSendFormValues) {
    mutation.mutate(values, {
      onSuccess: () => {
        form.setValue("body", "");
      },
    });
  }

  return (
    <Card>
      <CardHeader className="border-border border-b">
        <CardTitle className="flex items-center gap-2">
          <Send className="text-primary h-4 w-4" aria-hidden="true" />
          Enviar mensaje de prueba
        </CardTitle>
        <p className="text-text-2 text-sm">
          Si la integración no está configurada, el sistema no simula el envío y muestra el motivo.
        </p>
      </CardHeader>
      <CardContent className="pt-5">
        {configured === false && (
          <p
            role="note"
            className="bg-warning-soft text-warning-strong mb-4 rounded-ds-md px-4 py-3 text-sm"
          >
            Todavía no hay credenciales guardadas. Podés completar el formulario, pero el envío va a
            fallar con el motivo real del backend.
          </p>
        )}

        <form onSubmit={form.handleSubmit(submit)} noValidate className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="wa-to-phone" className="text-text mb-1 block text-sm font-medium">
              Teléfono destino *
            </label>
            <input
              id="wa-to-phone"
              type="tel"
              autoComplete="off"
              placeholder="+5491155550000"
              aria-invalid={Boolean(form.formState.errors.to_phone)}
              aria-describedby={form.formState.errors.to_phone ? "wa-to-phone-error" : undefined}
              className={inputClass}
              {...form.register("to_phone")}
            />
            <FieldError id="wa-to-phone-error" message={form.formState.errors.to_phone?.message} />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="wa-body" className="text-text mb-1 block text-sm font-medium">
              Mensaje *
            </label>
            <textarea
              id="wa-body"
              rows={3}
              aria-invalid={Boolean(form.formState.errors.body)}
              aria-describedby={form.formState.errors.body ? "wa-body-error" : undefined}
              className={cn(inputClass, "py-2")}
              {...form.register("body")}
            />
            <FieldError id="wa-body-error" message={form.formState.errors.body?.message} />
          </div>

          {mutation.error && (
            <p
              role="alert"
              className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm sm:col-span-2"
            >
              {sendErrorMessage(mutation.error)}
            </p>
          )}
          {mutation.isSuccess && (
            <p
              role="status"
              className="bg-success-soft text-success-strong rounded-ds-md px-3 py-2 text-sm sm:col-span-2"
            >
              Mensaje registrado con estado “
              {MESSAGE_STATUS_LABELS[mutation.data.status] ?? mutation.data.status}”.
            </p>
          )}

          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto">
              <Send className="h-4 w-4" aria-hidden="true" />
              {mutation.isPending ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** 503 = integración no configurada: se muestra el detalle real del backend, sin simular el envío. */
function sendErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 503) {
    return `WhatsApp no configurado: ${error.detail}`;
  }
  return errorMessage(error, "No se pudo enviar el mensaje.");
}

function MessageItem({ message }: { message: WhatsAppMessage }) {
  return (
    <li className="flex flex-col gap-2 px-5 py-4">
      <div className="text-text-2 flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={message.direction === "inbound" ? "info" : "neutral"}>
          {DIRECTION_LABELS[message.direction] ?? message.direction}
        </Badge>
        <Badge variant={MESSAGE_STATUS_VARIANTS[message.status] ?? "neutral"}>
          {MESSAGE_STATUS_LABELS[message.status] ?? message.status}
        </Badge>
        <span className="font-mono">{message.message_type}</span>
        <time dateTime={message.created_at} className="ml-auto">
          {formatDate(message.created_at)}
        </time>
      </div>
      <p className="text-text-2 font-mono text-xs break-all">
        {message.from_phone} → {message.to_phone}
      </p>
      <p className="text-text text-sm whitespace-pre-wrap">{message.body ?? "(sin texto)"}</p>
    </li>
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

function ConfigSkeleton() {
  return (
    <div className="border-border bg-surface rounded-ds-lg border p-6" role="status">
      <span className="sr-only">Cargando configuración</span>
      <Skeleton className="h-3 w-32" />
      <div className="mt-3 flex gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-12 w-full" />
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
