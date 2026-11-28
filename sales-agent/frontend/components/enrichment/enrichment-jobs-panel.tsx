"use client";

import { useState } from "react";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-auth";
import { useEnrichCompanies, useEnrichJobs } from "@/hooks/use-enrichment";
import { canEnrichCompanies } from "@/features/prospects/permissions";
import {
  enrichJobStatusLabel,
  isActiveEnrichJobStatus,
} from "@/features/prospects/enrichment";
import type {
  CompanyEnrichJob,
  CompanyEnrichJobStatus,
} from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, pluralize } from "@/lib/utils";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingBlock, Spinner } from "@/components/ui/spinner";

function jobBadgeVariant(status: CompanyEnrichJobStatus) {
  switch (status) {
    case "completed":
      return "success" as const;
    case "failed":
      return "danger" as const;
    case "running":
      return "info" as const;
    case "pending":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

function jobResultSummary(job: CompanyEnrichJob): string {
  const result = job.result;
  if (!result) return "—";
  if (result.status === "no_website") return "Sin sitio web";
  if (result.status === "unsafe") return "Sitio no permitido";
  if (result.status === "fetch_error") return "Error al leer el sitio";
  return [
    pluralize(result.contacts_added, "contacto", "contactos"),
    pluralize(result.facts_added, "dato", "datos"),
    pluralize(result.sources_added, "fuente", "fuentes"),
  ].join(" · ");
}

function jobError(job: CompanyEnrichJob): string | null {
  if (job.error_message && job.error_message.trim().length > 0) {
    return job.error_message;
  }
  if (job.result?.error && job.result.error.trim().length > 0) {
    return job.result.error;
  }
  return null;
}

function jobCompanyLabel(job: CompanyEnrichJob): string {
  if (job.company_name && job.company_name.trim().length > 0) {
    return job.company_name;
  }
  if (job.company_id) return `Empresa #${job.company_id}`;
  return `Trabajo #${job.id || "sin id"}`;
}

/**
 * Cola de trabajos del backend. Se refresca cada 5 s mientras haya trabajos
 * pendientes o en ejecución. Reintentar un trabajo fallido vuelve a encolar la
 * investigación de esa empresa en la misma cola; no se inventa un estado nuevo.
 */
export function EnrichmentJobsPanel() {
  const currentUser = useCurrentUser();
  const jobsQuery = useEnrichJobs();
  const retryMutation = useEnrichCompanies();
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);

  const canAct =
    !currentUser.isPending && canEnrichCompanies(currentUser.data?.role);
  const jobs = jobsQuery.data ?? [];
  const hasActiveJobs = jobs.some((job) =>
    isActiveEnrichJobStatus(job.status),
  );

  const handleRetry = (job: CompanyEnrichJob) => {
    if (!job.company_id) return;
    setRetryingJobId(job.id);
    retryMutation.mutate([job.company_id], {
      onSettled: () => setRetryingJobId(null),
    });
  };

  return (
    <Card>
      <CardHeader
        title="Cola de enriquecimiento"
        description="Trabajos informados por el backend. Esta lista se actualiza cada 5 segundos mientras haya trabajos activos."
        action={
          hasActiveJobs ? (
            <span className="flex items-center gap-2 text-xs text-muted">
              <Spinner label="Actualizando la cola" />
              Actualizando…
            </span>
          ) : undefined
        }
      />
      <CardContent className="space-y-4">
        {retryMutation.isError ? (
          <Alert variant="danger" title="No se pudo reencolar el trabajo">
            {getErrorMessage(retryMutation.error)}
          </Alert>
        ) : null}

        {jobsQuery.isPending ? (
          <LoadingBlock label="Cargando trabajos de enriquecimiento…" />
        ) : jobsQuery.isError ? (
          <Alert variant="danger" title="No se pudo cargar la cola">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{getErrorMessage(jobsQuery.error)}</span>
              <button
                type="button"
                onClick={() => void jobsQuery.refetch()}
                className="text-xs font-semibold underline"
              >
                Reintentar carga
              </button>
            </div>
          </Alert>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted">
            Todavía no hay trabajos de enriquecimiento en la cola. Los trabajos
            aparecen acá cuando se encola un lote.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[840px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-canvas/60 text-left text-xs font-semibold tracking-wide text-muted uppercase">
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Intentos</th>
                  <th className="px-4 py-3">Resultado</th>
                  <th className="px-4 py-3">Error</th>
                  <th className="px-4 py-3">Creado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {jobs.map((job) => {
                  const error = jobError(job);
                  const companyLabel = jobCompanyLabel(job);
                  return (
                    <tr key={job.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{companyLabel}</p>
                        <p className="text-xs text-muted">#{job.id || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={jobBadgeVariant(job.status)}>
                          {enrichJobStatusLabel(job.status, job.raw_status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted tabular-nums">
                        {job.attempts}/{job.max_attempts || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {jobResultSummary(job)}
                      </td>
                      <td className="max-w-64 px-4 py-3 text-xs text-danger">
                        {error ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {formatDateTime(job.created_at)}
                        {job.finished_at ? (
                          <span className="block">
                            Fin: {formatDateTime(job.finished_at)}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          {job.company_id ? (
                            <Link
                              href={`/prospects/${job.company_id}#investigacion`}
                              className="text-xs font-medium text-accent hover:underline"
                            >
                              Ver ficha
                            </Link>
                          ) : null}
                          {canAct &&
                          job.status === "failed" &&
                          job.company_id ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={retryingJobId === job.id}
                              aria-label={`Reintentar enriquecimiento de ${companyLabel}`}
                              onClick={() => handleRetry(job)}
                            >
                              {retryingJobId === job.id
                                ? "Reintentando…"
                                : "Reintentar"}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs leading-relaxed text-muted">
          Un trabajo completado no garantiza datos nuevos: revisá el resultado y
          la ficha. Los errores se muestran tal como los informa el backend.
        </p>
      </CardContent>
    </Card>
  );
}
