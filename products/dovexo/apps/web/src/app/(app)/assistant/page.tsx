"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Eraser,
  FileText,
  Lock,
  Send,
  Sparkles,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AssistantReplyView } from "@/components/assistant/assistant-reply";
import { AssistantSessionHistory } from "@/components/assistant/assistant-session-history";
import { AssistantStatusCard } from "@/components/assistant/assistant-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DETERMINISTIC_NOTICE,
  DETERMINISTIC_PROVIDER,
  NOT_CONFIGURED_NOTICE,
  capabilityToPrompt,
  isAiBlocked,
  suggestedPrompts,
} from "@/lib/ai";
import { api, errorMessage } from "@/lib/api";
import { extractAssistantEntities, parseAssistantReply } from "@/lib/assistant-reply";
import { useAuth } from "@/lib/auth";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

const MANAGE_ROLES = ["owner", "admin", "dispatcher"];

const assistantFormSchema = z.object({
  message: z.string().trim().min(1, "Escribí una pregunta").max(2000, "Máximo 2000 caracteres"),
});

type AssistantFormValues = z.infer<typeof assistantFormSchema>;

type ChatMessage =
  | { id: string; role: "user"; content: string; createdAt: string }
  | {
      id: string;
      role: "assistant";
      content: string;
      createdAt: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      usedTokens: number;
      estimatedCost: string;
    };

const inputClass =
  "border-border bg-surface text-text placeholder:text-text-2/70 focus-visible:border-primary focus-visible:ring-primary/30 w-full rounded-ds-md border px-3 py-2 text-sm outline-none focus-visible:ring-2 aria-[invalid=true]:border-danger";

const PROMPT_ICONS: { match: string; icon: LucideIcon }[] = [
  { match: "presupuesto", icon: FileText },
  { match: "agenda", icon: CalendarDays },
  { match: "resumen", icon: BarChart3 },
  { match: "urgente", icon: AlertTriangle },
  { match: "saldo", icon: Wallet },
];

function promptIcon(capability: string): LucideIcon {
  const normalized = capability.toLowerCase();
  return PROMPT_ICONS.find((entry) => normalized.includes(entry.match))?.icon ?? Sparkles;
}

export default function AssistantPage() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messageCounter = useRef(0);
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canUse = MANAGE_ROLES.includes(activeTenant?.role ?? "");

  const form = useForm<AssistantFormValues>({
    resolver: zodResolver(assistantFormSchema),
    defaultValues: { message: "" },
  });
  const messageField = form.register("message");

  const statusQuery = useQuery({
    queryKey: ["ai-status", activeTenantId],
    queryFn: () => api.ai.status(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canUse,
  });

  const chatMutation = useMutation({
    mutationFn: (message: string) => api.ai.chat(activeTenantId ?? "", message),
    onSuccess: (response) => {
      messageCounter.current += 1;
      setMessages((previous) => [
        ...previous,
        {
          id: `assistant-${messageCounter.current}`,
          role: "assistant",
          content: response.reply,
          createdAt: new Date().toISOString(),
          provider: response.provider,
          model: response.model,
          inputTokens: response.input_tokens,
          outputTokens: response.output_tokens,
          usedTokens: response.used_tokens,
          estimatedCost: response.estimated_cost,
        },
      ]);
      void queryClient.invalidateQueries({ queryKey: ["ai-status", activeTenantId] });
    },
  });

  if (!activeTenantId) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No hay una empresa activa"
        description="Cerrá sesión y volvé a ingresar para consultar los datos de tu empresa."
      />
    );
  }

  if (!canUse) {
    return (
      <EmptyState
        icon={Lock}
        title="Sin permiso para usar el asistente"
        description="El asistente está disponible para owner, administración y despacho. Pedile acceso a un administrador de la empresa."
      />
    );
  }

  const status = statusQuery.data;
  const blocked = status ? isAiBlocked(status) : true;
  const sending = chatMutation.isPending;
  const questions = messages.flatMap((message) =>
    message.role === "user"
      ? [{ id: message.id, content: message.content, createdAt: message.createdAt }]
      : [],
  );

  function nextMessageId(role: "user" | "assistant") {
    messageCounter.current += 1;
    return `${role}-${messageCounter.current}`;
  }

  function submit(values: AssistantFormValues) {
    if (blocked || sending || !status) return;
    setMessages((previous) => [
      ...previous,
      {
        id: nextMessageId("user"),
        role: "user",
        content: values.message,
        createdAt: new Date().toISOString(),
      },
    ]);
    form.reset({ message: "" });
    chatMutation.mutate(values.message);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void form.handleSubmit(submit)();
    }
  }

  function applyPrompt(prompt: string) {
    form.setValue("message", prompt, { shouldDirty: true, shouldValidate: true });
    textareaRef.current?.focus();
  }

  function startNewConversation() {
    setMessages([]);
    chatMutation.reset();
    form.reset({ message: "" });
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Asistente"
        title="Consultá los datos de tu empresa"
        description="Preguntá en lenguaje natural. Las respuestas se arman con los datos registrados y se muestran en tablas cuando hay varias filas."
        actions={
          <Button
            variant="outline"
            onClick={startNewConversation}
            disabled={messages.length === 0}
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            Nueva conversación
          </Button>
        }
      />

      {statusQuery.isError && (
        <div
          role="alert"
          className="bg-danger-soft text-danger-strong flex flex-col gap-2 rounded-ds-md px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{errorMessage(statusQuery.error, "No se pudo cargar el estado del asistente.")}</span>
          <Button variant="outline" size="sm" onClick={() => void statusQuery.refetch()}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <section aria-labelledby="chat-title" className="min-w-0">
          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle id="chat-title" className="flex items-center gap-2">
                  <Sparkles className="text-primary h-4 w-4" aria-hidden="true" />
                  Conversación
                </CardTitle>
                <p className="text-text-2 mt-1 text-xs">
                  {status
                    ? `Proveedor: ${status.provider}${status.model ? ` · ${status.model}` : ""}`
                    : "Consultando el estado del proveedor..."}
                </p>
              </div>
              {messages.length > 0 && (
                <Badge variant="neutral">
                  {messages.filter((message) => message.role === "user").length} consulta(s)
                </Badge>
              )}
            </CardHeader>

            <div
              role="log"
              aria-live="polite"
              aria-relevant="additions"
              aria-busy={sending}
              aria-label="Mensajes del asistente"
              className="border-border flex max-h-[60vh] min-h-[260px] flex-col gap-4 overflow-y-auto border-y p-4"
            >
              {messages.length === 0 ? (
                <div className="m-auto max-w-sm text-center">
                  <span className="bg-primary/10 text-primary mx-auto flex h-12 w-12 items-center justify-center rounded-ds-lg">
                    <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <p className="text-text mt-3 text-sm font-semibold">
                    Preguntá sobre tu operación
                  </p>
                  <p className="text-text-2 mt-1 text-sm">
                    Probá con presupuestos pendientes, la agenda de hoy o el resumen del negocio.
                    Las respuestas usan solo datos de {activeTenant?.name ?? "tu empresa"}.
                  </p>
                </div>
              ) : (
                messages.map((message) =>
                  message.role === "user" ? (
                    <UserMessage key={message.id} message={message} />
                  ) : (
                    <AssistantMessage key={message.id} message={message} />
                  ),
                )
              )}

              {sending && (
                <div role="status" className="text-text-2 flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    className="border-primary h-3.5 w-3.5 animate-spin rounded-full border-2 border-t-transparent"
                  />
                  Consultando datos de la empresa...
                </div>
              )}
            </div>

            {chatMutation.error && (
              <p
                role="alert"
                className="bg-danger-soft text-danger-strong mx-4 mt-3 rounded-lg px-3 py-2 text-sm"
              >
                {errorMessage(chatMutation.error, "No se pudo obtener la respuesta.")}
              </p>
            )}

            {status && status.capabilities.length > 0 && (
              <div className="border-border border-b px-4 py-3">
                <p className="text-text-2 text-caption mb-2">Preguntas sugeridas</p>
                <ul className="flex flex-wrap gap-2">
                  {suggestedPrompts(status.capabilities).map((capability) => {
                    const Icon = promptIcon(capability);
                    return (
                      <li key={capability}>
                        <button
                          type="button"
                          onClick={() => applyPrompt(capabilityToPrompt(capability))}
                          disabled={blocked}
                          className="border-border bg-surface text-text hover:border-primary/40 hover:bg-surface-2 focus-visible:ring-primary inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          {capabilityToPrompt(capability)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(submit)}
              noValidate
              aria-describedby="composer-help"
              className="flex flex-col gap-3 p-4"
            >
              <div className="min-w-0">
                <label htmlFor="assistant-message" className="sr-only">
                  Mensaje para el asistente
                </label>
                <textarea
                  id="assistant-message"
                  rows={2}
                  disabled={blocked || !status}
                  placeholder={
                    blocked
                      ? "El asistente no está disponible."
                      : "Escribí tu consulta sobre clientes, órdenes, presupuestos o pagos..."
                  }
                  aria-invalid={Boolean(form.formState.errors.message)}
                  aria-describedby={
                    form.formState.errors.message ? "assistant-message-error" : "composer-help"
                  }
                  onKeyDown={handleKeyDown}
                  className={cn(inputClass, "resize-y disabled:bg-surface-2 disabled:opacity-70")}
                  name={messageField.name}
                  onChange={messageField.onChange}
                  onBlur={messageField.onBlur}
                  ref={(element) => {
                    messageField.ref(element);
                    textareaRef.current = element;
                  }}
                />
                {form.formState.errors.message && (
                  <p id="assistant-message-error" className="text-danger mt-1 text-xs">
                    {form.formState.errors.message.message}
                  </p>
                )}
                <p id="composer-help" className="text-text-2 mt-1 text-xs">
                  Enter envía · Shift+Enter agrega una línea.
                </p>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={blocked || !status || sending}>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {sending ? "Consultando..." : "Enviar consulta"}
                </Button>
              </div>
            </form>
          </Card>
        </section>

        <aside className="space-y-4" aria-label="Estado y actividad del asistente">
          {statusQuery.isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ) : status ? (
            <AssistantStatusCard status={status} blocked={blocked} />
          ) : null}

          {status && status.provider === DETERMINISTIC_PROVIDER && (
            <p className="border-info/30 bg-info-soft text-info-strong rounded-ds-md border px-4 py-3 text-sm">
              {DETERMINISTIC_NOTICE}
            </p>
          )}

          {status && blocked && (
            <p
              role="status"
              className="border-warning/30 bg-warning-soft text-warning-strong rounded-ds-md border px-4 py-3 text-sm"
            >
              {NOT_CONFIGURED_NOTICE}
            </p>
          )}

          <AssistantSessionHistory questions={questions} onSelect={applyPrompt} />

          <p className="text-text-2 px-1 text-xs">
            Las cifras salen de los datos registrados en la empresa. Verificá montos y fechas antes
            de tomar decisiones con respuestas del asistente.
          </p>
        </aside>
      </div>
    </div>
  );
}

function UserMessage({ message }: { message: Extract<ChatMessage, { role: "user" }> }) {
  return (
    <div className="ml-auto w-full max-w-[92%] sm:max-w-[80%]">
      <p className="sr-only">Vos:</p>
      <div className="bg-primary rounded-ds-lg rounded-br-sm px-4 py-2.5 text-sm whitespace-pre-wrap text-white shadow-card">
        {message.content}
      </div>
      <time
        dateTime={message.createdAt}
        className="text-text-2 mt-1 block text-right text-[11px]"
      >
        {formatDate(message.createdAt)}
      </time>
    </div>
  );
}

function AssistantMessage({ message }: { message: Extract<ChatMessage, { role: "assistant" }> }) {
  const blocks = parseAssistantReply(message.content);
  const entities = extractAssistantEntities(message.content);
  const hasQuotes = entities.some((entity) => entity.type === "quote");
  const hasOrders = entities.some((entity) => entity.type === "order");

  return (
    <article
      aria-label="Respuesta del asistente"
      className="mr-auto w-full max-w-[92%] sm:max-w-[85%]"
    >
      <div className="border-border bg-surface rounded-ds-lg border shadow-card">
        <div className="border-border flex flex-wrap items-center gap-2 border-b px-4 py-2">
          <span className="bg-primary/10 text-primary flex h-6 w-6 items-center justify-center rounded-md">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <p className="text-text text-xs font-semibold">Asistente</p>
          <span className="text-text-2 text-[11px]">
            {message.provider}
            {message.model ? ` · ${message.model}` : ""}
          </span>
          <time dateTime={message.createdAt} className="text-text-2 ml-auto text-[11px]">
            {formatDate(message.createdAt)}
          </time>
        </div>

        <div className="px-4 py-3">
          <AssistantReplyView blocks={blocks} />

          {(hasQuotes || hasOrders) && (
            <div className="border-border mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-text-2 text-caption">Acción sugerida</span>
              {hasQuotes && (
                <Link
                  href="/quotes"
                  className="text-primary hover:text-primary-dark inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
                >
                  Ver presupuestos
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
              {hasOrders && (
                <Link
                  href="/orders"
                  className="text-primary hover:text-primary-dark inline-flex items-center gap-1 text-xs font-semibold underline-offset-4 hover:underline"
                >
                  Ver órdenes
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="border-border text-text-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t px-4 py-2 text-[11px]">
          <span>
            Tokens: {formatNumber(message.inputTokens, 0)} entrada +{" "}
            {formatNumber(message.outputTokens, 0)} salida
          </span>
          <span aria-hidden="true">·</span>
          <span>Costo estimado: {formatCurrency(message.estimatedCost)}</span>
          <span aria-hidden="true">·</span>
          <span>Fuente: datos de la empresa</span>
        </div>
      </div>
    </article>
  );
}
