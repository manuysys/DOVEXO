"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lead } from "@/lib/api/types";
import { leadStatusLabel } from "@/features/leads/status";
import { formatScorePair } from "@/features/leads/score";
import { useLeads, useUpdateLead } from "@/hooks/use-leads";
import { getErrorMessage } from "@/lib/errors";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";

function ReviewItem({
  lead,
  busy,
  onDecision,
}: {
  lead: Lead;
  busy: boolean;
  onDecision: (lead: Lead, status: "approved" | "not_interested" | "do_not_contact") => void;
}) {
  return (
    <li className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/prospects/${lead.company_id}#oportunidad`}
            className="text-sm font-semibold text-ink hover:text-accent"
          >
            {lead.company_name || `Oportunidad #${lead.id}`}
          </Link>
          <p className="text-xs text-muted">
            {lead.company_locality ?? "Sin localidad"} ·{" "}
            {lead.product_name ?? "Producto sin definir"} · compatibilidad /
            confianza {formatScorePair(lead.score, lead.confidence)}
          </p>
        </div>
        <LeadStatusBadge status={lead.status} rawStatus={lead.raw_status} />
      </div>

      {lead.reasons.length > 0 ? (
        <ul className="space-y-1 text-xs text-muted">
          {lead.reasons.slice(0, 4).map((reason, index) => (
            <li key={`${index}-${reason}`} className="flex gap-2">
              <span aria-hidden="true">·</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">
          Sin razones registradas: calculá el score en la ficha antes de aprobar.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" disabled={busy} onClick={() => onDecision(lead, "approved")}>
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => onDecision(lead, "not_interested")}
        >
          Descartar
        </Button>
        <Button
          size="sm"
          variant="danger"
          disabled={busy}
          onClick={() => onDecision(lead, "do_not_contact")}
        >
          No contactar
        </Button>
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
    </li>
  );
}

export default function ApprovalsPage() {
  const leadsQuery = useLeads({ status: "pending_review", limit: 50 });
  const updateLead = useUpdateLead();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const decide = (
    lead: Lead,
    status: "approved" | "not_interested" | "do_not_contact",
  ) => {
    if (
      status === "do_not_contact" &&
      !window.confirm(
        `¿Marcar "${lead.company_name || `oportunidad ${lead.id}`}" como no contactar?`,
      )
    ) {
      return;
    }
    setUpdatingId(lead.id);
    updateLead.mutate(
      { id: lead.id, input: { status } },
      { onSettled: () => setUpdatingId(null) },
    );
  };

  const pending = leadsQuery.data?.items ?? [];

  return (
    <>
      <PageHeader
        title="Pendientes de aprobación"
        description="Bandeja de revisión humana: oportunidades con estado pendiente de revisión. Aprobar acá habilita el contacto; los mensajes se aprueban por separado."
        actions={
          <Link
            href="/messages"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Ir a mensajes
          </Link>
        }
      />

      {updateLead.isError ? (
        <Alert variant="danger" title="No se pudo actualizar la oportunidad" className="mb-4">
          {getErrorMessage(updateLead.error)}
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Cola de revisión"
          description="Nombre, ubicación, compatibilidad, confianza y razones del scoring real."
        />
        <CardContent>
          {leadsQuery.isPending ? (
            <LoadingBlock label="Cargando pendientes…" />
          ) : leadsQuery.isError ? (
            <Alert variant="danger" title="No se pudieron cargar los pendientes">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{getErrorMessage(leadsQuery.error)}</span>
                <button
                  type="button"
                  onClick={() => void leadsQuery.refetch()}
                  className="text-xs font-semibold underline"
                >
                  Reintentar
                </button>
              </div>
            </Alert>
          ) : pending.length === 0 ? (
            <EmptyState
              title="No hay oportunidades pendientes de revisión"
              description="Cuando una oportunidad quede en estado “Pendiente de revisión” aparece acá. Se cambia el estado desde la ficha o el CRM."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Link
                    href="/crm"
                    className={buttonStyles({ variant: "secondary", size: "sm" })}
                  >
                    Ver CRM
                  </Link>
                  <Link
                    href="/prospects"
                    className={buttonStyles({ variant: "primary", size: "sm" })}
                  >
                    Ver prospectos
                  </Link>
                </div>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {pending.map((lead) => (
                <ReviewItem
                  key={lead.id}
                  lead={lead}
                  busy={updatingId === lead.id}
                  onDecision={decide}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-[11px] text-muted">
        Los mensajes generados quedan en borrador: se aprueban y se envían
        manualmente desde Mensajes o desde la ficha de la empresa. Nunca se
        envían de forma automática. Estados disponibles:{" "}
        {["new", "researched", "pending_review", "approved", "contacted"]
          .map((status) => leadStatusLabel(status))
          .join(", ")}
        .
      </p>
    </>
  );
}
