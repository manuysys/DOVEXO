"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/api/types";
import { useCreateLeadActivity, useLeadActivities } from "@/hooks/use-activities";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LoadingBlock, Spinner } from "@/components/ui/spinner";
import { ActivityList } from "@/components/activities/activity-list";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { LeadNotesEditor } from "@/components/leads/lead-notes-editor";

function FollowUpForm({ lead }: { lead: Lead }) {
  const createActivity = useCreateLeadActivity(lead.id);
  const [nextAt, setNextAt] = useState("");
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nextAt.trim().length === 0) return;
    const parsed = new Date(nextAt);
    if (Number.isNaN(parsed.getTime())) {
      setFeedback("Ingresá una fecha válida para el seguimiento.");
      return;
    }
    setFeedback(null);
    createActivity.mutate(
      {
        activity_type: "follow_up",
        description: reason.trim() || "Seguimiento programado",
        next_action_at: parsed.toISOString(),
      },
      {
        onSuccess: () => {
          setNextAt("");
          setReason("");
          setFeedback("Seguimiento programado.");
        },
      },
    );
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {createActivity.isError ? (
        <Alert variant="danger">{getErrorMessage(createActivity.error)}</Alert>
      ) : null}
      {feedback ? <Alert variant="success">{feedback}</Alert> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Próximo seguimiento" htmlFor={`follow-up-${lead.id}`}>
          <Input
            id={`follow-up-${lead.id}`}
            type="datetime-local"
            value={nextAt}
            onChange={(event) => setNextAt(event.target.value)}
          />
        </Field>
        <Field label="Motivo" htmlFor={`follow-up-reason-${lead.id}`} hint="Opcional.">
          <Input
            id={`follow-up-reason-${lead.id}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Llamar para confirmar reunión"
          />
        </Field>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" variant="secondary" disabled={createActivity.isPending}>
          {createActivity.isPending ? (
            <>
              <Spinner label="Programando" />
              Programando…
            </>
          ) : (
            "Programar seguimiento"
          )}
        </Button>
      </div>
    </form>
  );
}

/** Panel de gestión de una oportunidad: notas, seguimiento e historial. */
export function LeadManagementPanel({
  lead,
  onChangeStatus,
  updating,
}: {
  lead: Lead;
  onChangeStatus: (lead: Lead, status: string) => void;
  updating: boolean;
}) {
  const activitiesQuery = useLeadActivities(lead.id);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {lead.company_name || `Oportunidad #${lead.id}`}
            <LeadStatusBadge status={lead.status} rawStatus={lead.raw_status} />
          </span>
        }
        description={`${lead.product_name ?? "Producto sin definir"} · ${lead.company_locality ?? "Sin localidad"} · creada ${formatDateTime(lead.created_at)}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/prospects/${lead.company_id}#oportunidad`}
              className="text-xs font-medium text-accent hover:underline"
            >
              Ver ficha
            </Link>
            <Link
              href={`/messages?lead=${encodeURIComponent(lead.id)}`}
              className="text-xs font-medium text-accent hover:underline"
            >
              Mensajes
            </Link>
          </div>
        }
      />
      <CardContent className="space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Notas
          </h3>
          <LeadNotesEditor
            key={`${lead.id}-${lead.assigned_notes}`}
            lead={lead}
            idPrefix="crm"
          />
        </div>

        <div className="border-t border-line pt-4">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
            Programar seguimiento
          </h3>
          <FollowUpForm key={lead.id} lead={lead} />
        </div>

        <div className="border-t border-line pt-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
              Historial
            </h3>
            <span className="text-[11px] text-muted">
              {activitiesQuery.data
                ? pluralize(activitiesQuery.data.length, "actividad", "actividades")
                : "—"}
            </span>
          </div>
          {activitiesQuery.isPending ? (
            <LoadingBlock label="Cargando historial…" />
          ) : activitiesQuery.isError ? (
            <Alert variant="danger">
              {getErrorMessage(activitiesQuery.error)}
            </Alert>
          ) : (
            <ActivityList
              activities={activitiesQuery.data}
              emptyMessage="Sin actividades registradas para esta oportunidad."
            />
          )}
        </div>

        <div className="border-t border-line pt-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Cambiar estado
            <select
              aria-label={`Cambiar estado de ${lead.company_name || lead.id}`}
              value={lead.status === "unknown" ? "" : lead.status}
              disabled={updating}
              onChange={(event) => onChangeStatus(lead, event.target.value)}
              className="h-9 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink"
            >
              {lead.status === "unknown" ? (
                <option value="">{lead.raw_status || "Sin estado"}</option>
              ) : null}
              <option value="new">Nuevo</option>
              <option value="researched">Investigado</option>
              <option value="pending_review">Pendiente de revisión</option>
              <option value="approved">Aprobado</option>
              <option value="contacted">Contactado</option>
              <option value="replied">Respondió</option>
              <option value="interested">Interesado</option>
              <option value="meeting_scheduled">Reunión agendada</option>
              <option value="proposal_sent">Propuesta enviada</option>
              <option value="customer">Cliente</option>
              <option value="not_interested">No interesado</option>
              <option value="invalid">Inválido</option>
              <option value="do_not_contact">No contactar</option>
            </select>
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
