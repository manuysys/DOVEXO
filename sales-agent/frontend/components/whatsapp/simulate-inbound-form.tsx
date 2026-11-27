"use client";

import { useState } from "react";
import { useSimulateInbound } from "@/hooks/use-whatsapp";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

export function SimulateInboundForm({
  defaultPhone = "",
  defaultName = "",
}: {
  defaultPhone?: string | null;
  defaultName?: string | null;
}) {
  const simulate = useSimulateInbound();
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const phone = String(data.get("phone") ?? "").trim();
    const text = String(data.get("text") ?? "").trim();
    const name = String(data.get("name") ?? "").trim();
    if (phone.length === 0 || text.length === 0) return;
    setFeedback(null);
    simulate.mutate(
      { phone, text, ...(name.length > 0 ? { name } : {}) },
      {
        onSuccess: (result) => {
          setFeedback(
            result.text
              ? `Entrante simulado registrado. Respuesta del sistema: ${result.text}`
              : "Entrante simulado registrado en el backend.",
          );
          form.reset();
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-muted">
        Simula un mensaje recibido para probar el bot. No usa WhatsApp real ni
        envía nada a terceros.
      </p>

      {simulate.isError ? (
        <Alert variant="danger" title="No se pudo simular el entrante">
          {getErrorMessage(simulate.error)}
        </Alert>
      ) : null}

      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Teléfono" htmlFor="simulate-phone" required>
          <Input
            id="simulate-phone"
            name="phone"
            inputMode="tel"
            defaultValue={defaultPhone ?? ""}
            placeholder="+5493415550000"
            required
          />
        </Field>
        <Field label="Nombre" htmlFor="simulate-name" hint="Opcional.">
          <Input
            id="simulate-name"
            name="name"
            defaultValue={defaultName ?? ""}
            placeholder="Nombre de contacto"
          />
        </Field>
      </div>

      <Field label="Texto recibido" htmlFor="simulate-text" required>
        <Textarea
          id="simulate-text"
          name="text"
          rows={2}
          placeholder="Hola, quiero saber más sobre DOVEXO"
          required
        />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" variant="secondary" size="sm" disabled={simulate.isPending}>
          {simulate.isPending ? (
            <>
              <Spinner label="Simulando" />
              Simulando…
            </>
          ) : (
            "Simular entrante"
          )}
        </Button>
      </div>
    </form>
  );
}
