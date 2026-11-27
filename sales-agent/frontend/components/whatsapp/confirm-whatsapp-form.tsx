"use client";

import { useState } from "react";
import { useCreateCompanyContact } from "@/hooks/use-companies";
import { isApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

/**
 * Confirmación manual de un WhatsApp publicado. La persona que usa el sistema
 * debe verificar que el número tenga WhatsApp: este formulario solo guarda el
 * contacto y no envía nada.
 */
export function ConfirmWhatsAppForm({
  companyId,
  defaultPhone = "",
}: {
  companyId: string;
  /** Se prellena con el teléfono de la empresa si existe. */
  defaultPhone?: string;
}) {
  const [phone, setPhone] = useState(defaultPhone);
  const [feedback, setFeedback] = useState<string | null>(null);
  const createContact = useCreateCompanyContact(companyId);

  const error = createContact.error;
  const conflict = isApiError(error) && error.status === 409;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = phone.trim();
    if (value.length === 0) return;
    setFeedback(null);
    createContact.mutate(
      {
        contact_type: "whatsapp",
        value,
        label: "Confirmado manualmente",
        is_primary: true,
        verification_status: "verified",
      },
      {
        onSuccess: () => {
          setFeedback(
            "WhatsApp confirmado. La empresa y la conversación se actualizan con este número.",
          );
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-xs leading-relaxed text-muted">
        La empresa no tiene un WhatsApp confirmado. Verificá vos mismo que el
        número tenga WhatsApp antes de guardarlo: el sistema no envía nada ni
        comprueba la cuenta.
      </p>

      {error ? (
        <Alert variant="danger" title="No se pudo confirmar el WhatsApp">
          {conflict
            ? "Ese contacto ya existe para la empresa. Revisá los canales guardados o usá el número existente."
            : getErrorMessage(error)}
        </Alert>
      ) : null}

      {feedback ? <Alert variant="success">{feedback}</Alert> : null}

      <div className="flex flex-wrap items-end gap-2">
        <Field
          label="Teléfono con WhatsApp"
          htmlFor={`confirm-whatsapp-${companyId}`}
          className="min-w-56 flex-1"
          hint="Se guarda como contacto verificado (confirmación manual)."
        >
          <Input
            id={`confirm-whatsapp-${companyId}`}
            name="whatsapp"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+5493415550000"
          />
        </Field>
        <Button type="submit" size="sm" variant="secondary" disabled={createContact.isPending}>
          {createContact.isPending ? (
            <>
              <Spinner label="Guardando" />
              Guardando…
            </>
          ) : (
            "Confirmar WhatsApp"
          )}
        </Button>
      </div>
    </form>
  );
}
