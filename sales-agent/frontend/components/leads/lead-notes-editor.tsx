"use client";

import { useState } from "react";
import type { Lead } from "@/lib/api/types";
import { useUpdateLead } from "@/hooks/use-leads";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";

/** Notas libres de la oportunidad (`PATCH /leads/{id}` → assigned_notes). */
export function LeadNotesEditor({
  lead,
  idPrefix = "lead",
}: {
  lead: Lead;
  idPrefix?: string;
}) {
  const [notes, setNotes] = useState(lead.assigned_notes);
  const updateLead = useUpdateLead();
  const fieldId = `${idPrefix}-notes-${lead.id}`;

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        updateLead.mutate({ id: lead.id, input: { assigned_notes: notes } });
      }}
    >
      <Field label="Notas de la oportunidad" htmlFor={fieldId}>
        <Textarea
          id={fieldId}
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Contexto, objeciones, próximos pasos…"
        />
      </Field>
      {updateLead.isError ? (
        <Alert variant="danger">{getErrorMessage(updateLead.error)}</Alert>
      ) : null}
      <div className="flex items-center gap-2">
        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={updateLead.isPending}
        >
          {updateLead.isPending ? "Guardando…" : "Guardar notas"}
        </Button>
        {updateLead.isSuccess ? (
          <span className="text-xs text-success-strong">Notas guardadas.</span>
        ) : null}
      </div>
    </form>
  );
}
