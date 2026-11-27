"use client";

import { useState } from "react";
import type { MessageType } from "@/lib/api/types";
import { MESSAGE_TYPES_FOR_UI, messageTypeLabel } from "@/features/messages/status";
import { useGenerateMessage } from "@/hooks/use-messages";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

export function MessageComposer({ leadId }: { leadId: string }) {
  const [messageType, setMessageType] = useState<MessageType>("first_contact");
  const generate = useGenerateMessage(leadId);
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);
    generate.mutate(
      { channel: "whatsapp", message_type: messageType },
      {
        onSuccess: (message) => {
          setFeedback(
            `Borrador generado (${messageTypeLabel(message.message_type)}). Revisalo y aprobalo antes de enviarlo.`,
          );
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-muted">
        El generador usa los datos de la empresa y el producto. Nunca envía: el
        borrador queda pendiente de aprobación humana.
      </p>

      {generate.isError ? (
        <Alert variant="danger" title="No se pudo generar el mensaje">
          {getErrorMessage(generate.error)}
        </Alert>
      ) : null}

      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div className="flex flex-wrap items-end gap-3">
        <Field label="Tipo de mensaje" htmlFor="message-type" className="min-w-56">
          <Select
            id="message-type"
            value={messageType}
            onChange={(event) => setMessageType(event.target.value as MessageType)}
          >
            {MESSAGE_TYPES_FOR_UI.map((type) => (
              <option key={type} value={type}>
                {messageTypeLabel(type)}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Canal" htmlFor="message-channel" className="min-w-40">
          <Select id="message-channel" value="whatsapp" disabled>
            <option value="whatsapp">WhatsApp</option>
          </Select>
        </Field>

        <Button type="submit" disabled={generate.isPending}>
          {generate.isPending ? (
            <>
              <Spinner label="Generando" />
              Generando…
            </>
          ) : (
            "Generar mensaje"
          )}
        </Button>
      </div>
    </form>
  );
}
