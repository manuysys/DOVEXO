"use client";

import { useMemo } from "react";
import type { Lead, WhatsAppMessage } from "@/lib/api/types";
import { useWhatsAppThread, useWhatsAppThreads } from "@/hooks/use-whatsapp";
import { samePhone } from "@/features/whatsapp/phone";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { LoadingBlock } from "@/components/ui/spinner";
import { ConfirmWhatsAppForm } from "./confirm-whatsapp-form";
import { SimulateInboundForm } from "./simulate-inbound-form";

function MessageBubble({ message }: { message: WhatsAppMessage }) {
  const inbound = message.direction === "inbound";
  return (
    <li className={inbound ? "flex justify-start" : "flex justify-end"}>
      <div
        className={[
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          inbound
            ? "border border-line bg-surface text-ink"
            : "bg-accent-soft text-accent-strong",
        ].join(" ")}
      >
        <div className="mb-1 flex items-center gap-2 text-[11px] text-muted">
          <Badge variant={inbound ? "neutral" : "info"}>
            {inbound ? "Entrante" : message.direction === "outbound" ? "Saliente" : "Sin dirección"}
          </Badge>
          <span>{formatDateTime(message.created_at)}</span>
        </div>
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
      </div>
    </li>
  );
}

export function ThreadPanel({ lead }: { lead: Lead }) {
  const threadsQuery = useWhatsAppThreads();

  const matchedThread = useMemo(() => {
    const threads = threadsQuery.data ?? [];
    return (
      threads.find((thread) => thread.lead_id === lead.id) ??
      threads.find((thread) => samePhone(thread.phone, lead.company_whatsapp)) ??
      null
    );
  }, [threadsQuery.data, lead.id, lead.company_whatsapp]);

  const threadId = matchedThread?.id ?? "";
  const threadQuery = useWhatsAppThread(threadId);

  const messages = threadQuery.data?.messages ?? [];

  return (
    <div className="space-y-4">
      {threadsQuery.isError ? (
        <Alert variant="warning" title="No se pudieron cargar las conversaciones">
          {getErrorMessage(threadsQuery.error)}
        </Alert>
      ) : null}

      {!lead.company_whatsapp ? (
        <div className="rounded-md border border-line bg-canvas/60 px-4 py-3">
          <ConfirmWhatsAppForm
            companyId={lead.company_id}
            defaultPhone={lead.company_phone ?? ""}
          />
        </div>
      ) : null}

      {threadId === "" ? (
        <p className="rounded-md border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-muted">
          Sin conversación de WhatsApp todavía para este contacto.
        </p>
      ) : threadQuery.isPending ? (
        <LoadingBlock label="Cargando conversación…" />
      ) : threadQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar la conversación">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(threadQuery.error)}</span>
            <button
              type="button"
              onClick={() => void threadQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted">
          La conversación existe pero no tiene mensajes guardados.
        </p>
      ) : (
        <ul className="space-y-2">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || `${message.created_at ?? ""}-${index}`}
              message={message}
            />
          ))}
        </ul>
      )}

      <div className="border-t border-line pt-4">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
          Probar el bot (simulación)
        </h3>
        <div className="mt-2">
          <SimulateInboundForm
            defaultPhone={
              matchedThread?.phone ??
              lead.company_whatsapp ??
              lead.company_phone ??
              ""
            }
            defaultName={lead.company_name}
          />
        </div>
      </div>
    </div>
  );
}
