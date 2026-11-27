"use client";

import Link from "next/link";
import type { Lead } from "@/lib/api/types";
import {
  LEAD_STATUS_ORDER,
  PIPELINE_STAGES,
  leadStageKey,
  leadStatusLabel,
} from "@/features/leads/status";
import { formatScorePair } from "@/features/leads/score";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";

export interface PipelineBoardProps {
  leads: Lead[];
  selectedId: string | null;
  updatingId: string | null;
  onChangeStatus: (lead: Lead, status: string) => void;
  onSelect: (lead: Lead) => void;
}

/**
 * Pipeline por etapas con controles accesibles (select de estado), no solo
 * drag and drop: cada tarjeta se puede mover con teclado.
 */
export function PipelineBoard({
  leads,
  selectedId,
  updatingId,
  onChangeStatus,
  onSelect,
}: PipelineBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-full gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leads.filter(
            (lead) => leadStageKey(lead.status) === stage.key,
          );
          return (
            <section
              key={stage.key}
              aria-label={stage.label}
              className="w-72 shrink-0 rounded-lg border border-line bg-canvas/40"
            >
              <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
                <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">
                  {stage.label}
                </h3>
                <span className="text-xs text-muted tabular-nums">
                  {stageLeads.length}
                </span>
              </header>
              <div className="space-y-2 p-2">
                {stageLeads.length === 0 ? (
                  <p className="px-1 py-2 text-[11px] text-muted">
                    Sin oportunidades.
                  </p>
                ) : (
                  stageLeads.map((lead) => {
                    const unknown = lead.status === "unknown";
                    return (
                      <article
                        key={lead.id}
                        className={cn(
                          "rounded-md border bg-surface p-2",
                          selectedId === lead.id
                            ? "border-accent/40 ring-1 ring-accent/20"
                            : "border-line",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/prospects/${lead.company_id}#oportunidad`}
                            className="line-clamp-2 text-sm font-medium text-ink hover:text-accent"
                          >
                            {lead.company_name || `Oportunidad #${lead.id}`}
                          </Link>
                          <LeadStatusBadge
                            status={lead.status}
                            rawStatus={lead.raw_status}
                          />
                        </div>
                        <p className="mt-1 text-[11px] text-muted">
                          {lead.company_locality ?? "Sin localidad"} · Score{" "}
                          {formatScorePair(lead.score, lead.confidence)}
                        </p>
                        <label className="mt-2 flex flex-col gap-1 text-[11px] font-medium text-muted">
                          Estado
                          <Select
                            aria-label={`Estado de ${lead.company_name || `oportunidad ${lead.id}`}`}
                            value={unknown ? "" : lead.status}
                            disabled={updatingId === lead.id}
                            onChange={(event) =>
                              onChangeStatus(lead, event.target.value)
                            }
                            className="h-8 py-0 text-xs"
                          >
                            {unknown ? (
                              <option value="">
                                {lead.raw_status || "Sin estado"}
                              </option>
                            ) : null}
                            {LEAD_STATUS_ORDER.map((status) => (
                              <option key={status} value={status}>
                                {leadStatusLabel(status)}
                              </option>
                            ))}
                          </Select>
                        </label>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => onSelect(lead)}
                          >
                            Gestionar
                          </Button>
                          <Link
                            href={`/messages?lead=${encodeURIComponent(lead.id)}`}
                            className="text-[11px] font-medium text-accent hover:underline"
                          >
                            Mensajes
                          </Link>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
