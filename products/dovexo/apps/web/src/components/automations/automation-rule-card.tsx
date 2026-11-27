"use client";

import { AlertTriangle, ChevronDown, Trash2, Workflow } from "lucide-react";
import { useId, useState } from "react";

import { AutomationFlow } from "@/components/automations/automation-flow";
import { ExecutionStatusBadge } from "@/components/automations/automation-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { AutomationExecution, AutomationRule } from "@/lib/api";
import { ACTION_TYPE_LABELS, EVENT_TYPE_LABELS } from "@/lib/automations";
import { cn, formatDate } from "@/lib/utils";

type AutomationRuleCardProps = {
  rule: AutomationRule;
  recentExecutions: AutomationExecution[];
  failedCount: number;
  togglePending: boolean;
  deletePending: boolean;
  onToggle: () => void;
  onDelete: () => void;
};

function formatJson(value: Record<string, unknown> | null): string | null {
  if (!value || Object.keys(value).length === 0) return null;
  return JSON.stringify(value, null, 2);
}

export function AutomationRuleCard({
  rule,
  recentExecutions,
  failedCount,
  togglePending,
  deletePending,
  onToggle,
  onDelete,
}: AutomationRuleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const detailId = useId();
  const conditions = formatJson(rule.conditions);
  const actionConfig = formatJson(rule.action_config);

  const latest = recentExecutions.reduce<AutomationExecution | null>((current, execution) => {
    if (!current) return execution;
    return new Date(execution.created_at) > new Date(current.created_at) ? execution : current;
  }, null);

  const failuresWithError = recentExecutions.filter(
    (execution) => execution.status === "failed" && execution.error,
  );

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md",
              rule.active ? "bg-primary/10 text-primary" : "bg-surface-2 text-text-2",
            )}
          >
            <Workflow className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-text text-sm font-semibold">{rule.name}</h3>
              <Badge variant={rule.active ? "success" : "neutral"}>
                {rule.active ? "Activa" : "Inactiva"}
              </Badge>
              {failedCount > 0 && (
                <Badge variant="danger">
                  <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                  {failedCount} con error
                </Badge>
              )}
            </div>
            <p className="text-text-2 mt-0.5 text-xs">
              Actualizada el <time dateTime={rule.updated_at}>{formatDate(rule.updated_at)}</time>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggle}
            disabled={togglePending}
            aria-label={`${rule.active ? "Desactivar" : "Activar"} regla ${rule.name}`}
          >
            {togglePending ? "Guardando..." : rule.active ? "Desactivar" : "Activar"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={deletePending}
            aria-label={`Eliminar regla ${rule.name}`}
            className="text-text-2 hover:bg-danger-soft hover:text-danger-strong"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <AutomationFlow rule={rule} />
      </div>

      <div className="border-border mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3">
        <p className="text-text-2 flex flex-wrap items-center gap-2 text-xs">
          <span>Última ejecución:</span>
          {latest ? (
            <>
              <ExecutionStatusBadge status={latest.status} />
              <time dateTime={latest.created_at}>{formatDate(latest.created_at)}</time>
            </>
          ) : (
            <span>todavía no se ejecutó</span>
          )}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={detailId}
          className="px-2"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
            aria-hidden="true"
          />
          {expanded ? "Ocultar detalle" : "Ver detalle"}
        </Button>
      </div>

      {expanded && (
        <div id={detailId} className="border-border mt-3 space-y-4 border-t pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <section aria-label="Condiciones de la regla">
              <h4 className="text-text text-caption">Condiciones</h4>
              {conditions ? (
                <pre className="border-border bg-surface-2 text-text mt-2 overflow-x-auto rounded-ds-md border p-3 text-xs">
                  <code>{conditions}</code>
                </pre>
              ) : (
                <p className="text-text-2 mt-2 text-sm">
                  Se ejecuta con cualquier evento de este tipo, sin filtros.
                </p>
              )}
            </section>

            <section aria-label="Configuración de la acción">
              <h4 className="text-text text-caption">Configuración de la acción</h4>
              {actionConfig ? (
                <pre className="border-border bg-surface-2 text-text mt-2 overflow-x-auto rounded-ds-md border p-3 text-xs">
                  <code>{actionConfig}</code>
                </pre>
              ) : (
                <p className="text-text-2 mt-2 text-sm">
                  {ACTION_TYPE_LABELS[rule.action_type]} con el mensaje predeterminado.
                </p>
              )}
            </section>
          </div>

          <section aria-label="Ejecuciones recientes de la regla">
            <h4 className="text-text text-caption">Ejecuciones recientes</h4>
            {recentExecutions.length === 0 ? (
              <p className="text-text-2 mt-2 text-sm">
                Esta regla todavía no tiene ejecuciones registradas.
              </p>
            ) : (
              <ul className="divide-border mt-2 divide-y">
                {recentExecutions.map((execution) => (
                  <li
                    key={execution.id}
                    className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <ExecutionStatusBadge status={execution.status} />
                      <span className="text-text text-xs">
                        {EVENT_TYPE_LABELS[execution.event_type]}
                      </span>
                      <time dateTime={execution.created_at} className="text-text-2 text-xs">
                        {formatDate(execution.created_at)}
                      </time>
                    </div>
                    <span className="text-text-2 numeric text-xs">
                      {execution.attempts} intento{execution.attempts === 1 ? "" : "s"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {failuresWithError.length > 0 && (
              <div className="bg-danger-soft text-danger-strong mt-3 rounded-ds-md px-3 py-2 text-xs">
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                  Últimos errores
                </p>
                <ul className="mt-1 space-y-1">
                  {failuresWithError.slice(0, 3).map((execution) => (
                    <li key={execution.id} className="break-words">
                      {execution.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <dl className="text-text-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <div>
              <dt className="inline">Creada: </dt>
              <dd className="text-text inline">
                <time dateTime={rule.created_at}>{formatDate(rule.created_at)}</time>
              </dd>
            </div>
            <div>
              <dt className="inline">Actualizada: </dt>
              <dd className="text-text inline">
                <time dateTime={rule.updated_at}>{formatDate(rule.updated_at)}</time>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </Card>
  );
}
