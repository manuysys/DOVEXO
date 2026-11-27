"use client";

import { useState } from "react";
import type { Lead, OutreachMessage } from "@/lib/api/types";
import {
  isSimulatedWhatsAppMode,
  messageTypeLabel,
} from "@/features/messages/status";
import { whatsappLink } from "@/features/whatsapp/phone";
import {
  useApproveMessage,
  useLeadMessages,
  useMarkMessageSent,
  useSendMessage,
  useUpdateMessage,
} from "@/hooks/use-messages";
import { useWhatsAppStatus } from "@/hooks/use-whatsapp";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime } from "@/lib/utils";
import { Alert, type AlertVariant } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { LoadingBlock } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { MessageStatusBadge } from "./message-status-badge";

interface Feedback {
  variant: AlertVariant;
  message: string;
}

const EDITABLE_STATUSES = new Set(["draft", "pending_approval", "approved"]);

function MessageItem({
  message,
  lead,
  onFeedback,
}: {
  message: OutreachMessage;
  lead: Lead;
  onFeedback: (feedback: Feedback | null) => void;
}) {
  const updateMessage = useUpdateMessage(lead.id);
  const approveMessage = useApproveMessage(lead.id);
  const sendMessage = useSendMessage(lead.id);
  const markSent = useMarkMessageSent(lead.id);
  const statusQuery = useWhatsAppStatus();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.text);
  const [copied, setCopied] = useState(false);

  const busy =
    updateMessage.isPending ||
    approveMessage.isPending ||
    sendMessage.isPending ||
    markSent.isPending;

  const canEdit = EDITABLE_STATUSES.has(message.status);
  const canApprove =
    message.status === "draft" || message.status === "pending_approval";
  const canSend = message.status === "approved";
  const canMarkSent = message.status === "approved" || message.status === "sent";
  const simulatedMode =
    !statusQuery.data ||
    !statusQuery.data.configured ||
    isSimulatedWhatsAppMode(statusQuery.data.mode);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      onFeedback({
        variant: "warning",
        message:
          "No se pudo copiar al portapapeles. Seleccioná el texto y copialo manualmente.",
      });
    }
  };

  const save = () => {
    onFeedback(null);
    updateMessage.mutate(
      { id: message.id, edited_text: draft },
      {
        onSuccess: () => {
          setEditing(false);
          onFeedback({
            variant: "success",
            message: "Borrador guardado. El mensaje sigue requiriendo aprobación.",
          });
        },
      },
    );
  };

  const approve = () => {
    onFeedback(null);
    approveMessage.mutate(message.id, {
      onSuccess: () =>
        onFeedback({
          variant: "success",
          message: "Mensaje aprobado. Ahora podés enviarlo o marcarlo como enviado.",
        }),
    });
  };

  const send = () => {
    onFeedback(null);
    sendMessage.mutate(message.id, {
      onSuccess: (result) => {
        const simulated =
          result.simulated ||
          isSimulatedWhatsAppMode(result.sent_via ?? "") ||
          simulatedMode;
        onFeedback(
          simulated
            ? {
                variant: "warning",
                message:
                  "Modo simulado: el mensaje quedó registrado en el backend y no salió a WhatsApp. Copialo y envialo manualmente.",
              }
            : {
                variant: "success",
                message:
                  "El proveedor aceptó el envío. Verificá la entrega en tu WhatsApp.",
              },
        );
      },
    });
  };

  const markAsSent = () => {
    if (
      !window.confirm(
        "¿Confirmás que enviaste este mensaje manualmente desde tu WhatsApp? Se registra como enviado y no se puede deshacer.",
      )
    ) {
      return;
    }
    onFeedback(null);
    markSent.mutate(message.id, {
      onSuccess: () =>
        onFeedback({
          variant: "success",
          message: "Mensaje registrado como enviado manualmente.",
        }),
    });
  };

  const error =
    updateMessage.error ??
    approveMessage.error ??
    sendMessage.error ??
    markSent.error;

  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <MessageStatusBadge status={message.status} rawStatus={message.raw_status} />
        <span className="text-xs font-medium text-ink">
          {messageTypeLabel(message.message_type)}
        </span>
        <span className="text-[11px] text-muted">
          {message.channel || "whatsapp"} · {formatDateTime(message.created_at)}
        </span>
        {message.sent_via ? (
          <span className="text-[11px] text-muted">vía {message.sent_via}</span>
        ) : null}
        {message.simulated ? (
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning-strong ring-1 ring-warning/20 ring-inset">
            Modo simulado
          </span>
        ) : null}
      </div>

      {error ? (
        <Alert variant="danger">{getErrorMessage(error)}</Alert>
      ) : null}

      {editing ? (
        <div className="space-y-2">
          <Textarea
            aria-label={`Editar mensaje ${message.id}`}
            rows={4}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={save} disabled={busy}>
              Guardar borrador
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditing(false);
                setDraft(message.text);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm whitespace-pre-wrap break-words text-ink">
          {message.text || "—"}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {canApprove ? (
          <Button size="sm" variant="secondary" onClick={approve} disabled={busy}>
            Aprobar
          </Button>
        ) : null}
        {canSend ? (
          <Button size="sm" onClick={send} disabled={busy}>
            Enviar
          </Button>
        ) : null}
        {canMarkSent ? (
          <Button size="sm" variant="secondary" onClick={markAsSent} disabled={busy}>
            Marcar enviado manualmente
          </Button>
        ) : null}
        {canEdit && !editing ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(message.text);
              setEditing(true);
            }}
            disabled={busy}
          >
            Editar
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" onClick={() => void copy()}>
          {copied ? "Copiado" : "Copiar"}
        </Button>
        {lead.company_whatsapp ? (
          <a
            href={whatsappLink(lead.company_whatsapp, message.text)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
            title="Abre WhatsApp con el texto precargado. No envía nada automáticamente."
          >
            Abrir WhatsApp (manual)
          </a>
        ) : lead.company_phone ? (
          <a
            href={whatsappLink(lead.company_phone, message.text)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-accent hover:underline"
            title="El teléfono no está confirmado como WhatsApp: puede no tener cuenta. Abre WhatsApp con el texto precargado y no envía nada automáticamente."
          >
            Abrir WhatsApp (manual)
          </a>
        ) : null}
      </div>
    </li>
  );
}

export function LeadMessagesSection({ lead }: { lead: Lead }) {
  const messagesQuery = useLeadMessages(lead.id);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  return (
    <div className="space-y-3">
      {feedback ? (
        <Alert variant={feedback.variant}>{feedback.message}</Alert>
      ) : null}

      {messagesQuery.isPending ? (
        <LoadingBlock label="Cargando mensajes…" />
      ) : messagesQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar los mensajes">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(messagesQuery.error)}</span>
            <button
              type="button"
              onClick={() => void messagesQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : messagesQuery.data.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-canvas/60 px-4 py-6 text-center text-sm text-muted">
          Sin mensajes generados. Creá un borrador con el generador de arriba.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {messagesQuery.data.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              lead={lead}
              onFeedback={setFeedback}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
