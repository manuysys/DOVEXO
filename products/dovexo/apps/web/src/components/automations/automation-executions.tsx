"use client";

import { AlertTriangle, History } from "lucide-react";
import { useState } from "react";

import { ExecutionStatusBadge } from "@/components/automations/automation-status";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, type AutomationExecution, type AutomationExecutionStatus } from "@/lib/api";
import { EXECUTION_STATUS_LABELS, EVENT_TYPE_LABELS } from "@/lib/automations";
import { cn, formatDate } from "@/lib/utils";

type ExecutionFilter = "all" | AutomationExecutionStatus;

const FILTERS: { value: ExecutionFilter; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "success", label: EXECUTION_STATUS_LABELS.success },
  { value: "failed", label: EXECUTION_STATUS_LABELS.failed },
  { value: "skipped", label: EXECUTION_STATUS_LABELS.skipped },
  { value: "pending", label: EXECUTION_STATUS_LABELS.pending },
];

type AutomationExecutionsProps = {
  executions: AutomationExecution[];
  ruleNames: Map<string, string>;
  loading: boolean;
  error: unknown;
  onRetry: () => void;
};

export function AutomationExecutions({
  executions,
  ruleNames,
  loading,
  error,
  onRetry,
}: AutomationExecutionsProps) {
  const [filter, setFilter] = useState<ExecutionFilter>("all");
  const filtered =
    filter === "all" ? executions : executions.filter((execution) => execution.status === filter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="text-violet h-4 w-4" aria-hidden="true" />
          Historial de ejecuciones
        </CardTitle>
        <p className="text-text-2 text-sm">
          Últimas 50 ejecuciones de la empresa, con estado e intentos.
        </p>
      </CardHeader>

      {!loading && !error && executions.length > 0 && (
        <div className="border-border border-y px-5 py-3">
          <div
            role="group"
            aria-label="Filtrar historial por estado"
            className="flex flex-wrap gap-2"
          >
            {FILTERS.map((option) => {
              const count =
                option.value === "all"
                  ? executions.length
                  : executions.filter((execution) => execution.status === option.value).length;
              const active = filter === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(option.value)}
                  className={cn(
                    "focus-visible:ring-primary rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-text-2 hover:bg-surface-2",
                  )}
                >
                  {option.label} <span className="numeric">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : error ? (
        <div className="p-5">
          <p role="alert" className="text-danger text-sm">
            {errorMessage(error, "No se pudo cargar el historial.")}
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : executions.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={History}
            title="Todavía no hay ejecuciones"
            description="Cuando una regla se dispare, la ejecución queda registrada acá con su estado y errores."
          />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-text-2 p-5 text-sm">
          No hay ejecuciones con ese estado en las últimas 50.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <caption className="sr-only">Historial de ejecuciones de automatizaciones</caption>
            <thead className="bg-surface-2 text-text-2">
              <tr>
                <th scope="col" className="text-caption px-5 py-3 font-semibold tracking-wide uppercase">
                  Fecha
                </th>
                <th scope="col" className="text-caption px-5 py-3 font-semibold tracking-wide uppercase">
                  Regla
                </th>
                <th scope="col" className="text-caption px-5 py-3 font-semibold tracking-wide uppercase">
                  Evento
                </th>
                <th scope="col" className="text-caption px-5 py-3 font-semibold tracking-wide uppercase">
                  Estado
                </th>
                <th scope="col" className="text-caption px-5 py-3 text-right font-semibold tracking-wide uppercase">
                  Intentos
                </th>
                <th scope="col" className="text-caption px-5 py-3 font-semibold tracking-wide uppercase">
                  Error
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {filtered.map((execution) => (
                <tr key={execution.id} className="hover:bg-surface-2/60 align-top">
                  <td className="text-text-2 px-5 py-3 text-xs whitespace-nowrap">
                    <time dateTime={execution.created_at}>{formatDate(execution.created_at)}</time>
                  </td>
                  <td className="text-text px-5 py-3 font-medium">
                    {ruleNames.get(execution.rule_id) ?? (
                      <span className="text-text-2 italic">Regla eliminada</span>
                    )}
                  </td>
                  <td className="text-text-2 px-5 py-3">
                    {EVENT_TYPE_LABELS[execution.event_type]}
                  </td>
                  <td className="px-5 py-3">
                    <ExecutionStatusBadge status={execution.status} />
                  </td>
                  <td className="text-text numeric px-5 py-3 text-right">{execution.attempts}</td>
                  <td className="text-danger-strong max-w-xs px-5 py-3 text-xs">
                    {execution.error ? (
                      <span className="flex items-start gap-1.5">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="break-words">{execution.error}</span>
                      </span>
                    ) : (
                      <span className="text-text-2">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
