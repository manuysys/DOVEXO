"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Lead, LeadStatus } from "@/lib/api/types";
import {
  ACTIVE_LEAD_STATUSES,
  leadStatusLabel,
} from "@/features/leads/status";
import { formatScorePair } from "@/features/leads/score";
import { useLeads } from "@/hooks/use-leads";
import { LEADS_PAGE_LIMIT } from "@/lib/api/leads";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingBlock } from "@/components/ui/spinner";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { MessageComposer } from "@/components/messages/message-composer";
import { LeadMessagesSection } from "@/components/messages/message-list";
import { ThreadPanel } from "@/components/whatsapp/thread-panel";
import { WhatsAppStatusBanner } from "@/components/whatsapp/whatsapp-status-banner";

const CANNED_STATUS_FILTERS: LeadStatus[] = [
  ...ACTIVE_LEAD_STATUSES,
  "new",
  "researched",
  "not_interested",
  "invalid",
  "do_not_contact",
];

function InboxItem({
  lead,
  selected,
  onSelect,
}: {
  lead: Lead;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={[
          "w-full rounded-md border px-3 py-2 text-left transition-colors",
          selected
            ? "border-accent/40 bg-accent-soft"
            : "border-transparent hover:border-line hover:bg-canvas/60",
        ].join(" ")}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-ink">
            {lead.company_name || `Oportunidad #${lead.id}`}
          </span>
          <LeadStatusBadge status={lead.status} rawStatus={lead.raw_status} />
        </span>
        <span className="mt-1 flex items-center justify-between gap-2 text-[11px] text-muted">
          <span className="truncate">
            {lead.company_locality ?? "Sin localidad"}
          </span>
          <span className="shrink-0 tabular-nums">
            {formatScorePair(lead.score, lead.confidence)}
          </span>
        </span>
        {lead.last_activity_at ? (
          <span className="mt-0.5 block text-[11px] text-muted">
            {formatDateTime(lead.last_activity_at)}
          </span>
        ) : null}
      </button>
    </li>
  );
}

export function MessagesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  const leadsQuery = useLeads({
    limit: LEADS_PAGE_LIMIT,
    status: statusFilter || undefined,
  });

  const leads = (leadsQuery.data?.items ?? []).filter((lead) => {
    if (search.trim().length === 0) return true;
    const needle = search.trim().toLowerCase();
    return (
      lead.company_name.toLowerCase().includes(needle) ||
      (lead.company_locality ?? "").toLowerCase().includes(needle)
    );
  });

  const requestedId = searchParams.get("lead") ?? "";
  const selectedLead =
    leads.find((lead) => lead.id === requestedId) ?? leads[0] ?? null;

  const selectLead = (id: string) => {
    router.replace(`${pathname}?lead=${encodeURIComponent(id)}`, {
      scroll: false,
    });
  };

  return (
    <div className="space-y-4">
      <WhatsAppStatusBanner />

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Estado
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 py-1"
            >
              <option value="">Todos los estados</option>
              {CANNED_STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {leadStatusLabel(status)}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Buscar empresa
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nombre o localidad"
              className="h-9 py-1"
            />
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,320px)_1fr]">
        <Card>
          <CardHeader
            title="Bandeja"
            description={
              leadsQuery.isPending
                ? "Cargando…"
                : pluralize(leads.length, "oportunidad", "oportunidades")
            }
          />
          <CardContent>
            {leadsQuery.isPending ? (
              <LoadingBlock label="Cargando oportunidades…" />
            ) : leadsQuery.isError ? (
              <Alert variant="danger" title="No se pudo cargar la bandeja">
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
            ) : leads.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  No hay oportunidades con ese filtro. Creá una desde la ficha
                  de una empresa.
                </p>
                <Link
                  href="/prospects"
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Ver prospectos
                </Link>
              </div>
            ) : (
              <ul className="space-y-1">
                {leads.map((lead) => (
                  <InboxItem
                    key={lead.id}
                    lead={lead}
                    selected={selectedLead?.id === lead.id}
                    onSelect={() => selectLead(lead.id)}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!selectedLead ? (
            <EmptyState
              title="Elegí una oportunidad"
              description="La bandeja muestra oportunidades (empresas por producto). Creá una desde la ficha de la empresa para generar mensajes y ver la conversación."
              action={
                <Link
                  href="/prospects"
                  className={buttonStyles({ variant: "primary", size: "sm" })}
                >
                  Buscar empresas
                </Link>
              }
            />
          ) : (
            <>
              <Card>
                <CardHeader
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {selectedLead.company_name || `Oportunidad #${selectedLead.id}`}
                      <LeadStatusBadge
                        status={selectedLead.status}
                        rawStatus={selectedLead.raw_status}
                      />
                    </span>
                  }
                  description={`Compatibilidad / confianza: ${formatScorePair(
                    selectedLead.score,
                    selectedLead.confidence,
                  )} · ${selectedLead.product_name ?? "Producto sin definir"}`}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/prospects/${selectedLead.company_id}#oportunidad`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        Ver ficha
                      </Link>
                      <Link
                        href={`/crm?lead=${encodeURIComponent(selectedLead.id)}`}
                        className="text-xs font-medium text-accent hover:underline"
                      >
                        CRM
                      </Link>
                    </div>
                  }
                />
                <CardContent>
                  <h3 className="mb-2 text-xs font-semibold tracking-wide text-muted uppercase">
                    Conversación de WhatsApp
                  </h3>
                  <ThreadPanel lead={selectedLead} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader
                  title="Mensajes de contacto"
                  description="Generá un borrador, revisalo, aprobalo y envialo. Nada se envía automáticamente."
                />
                <CardContent className="space-y-4">
                  <MessageComposer leadId={selectedLead.id} />
                  <div className="border-t border-line pt-4">
                    <LeadMessagesSection lead={selectedLead} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
