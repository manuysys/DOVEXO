import type {
  CompanyEnrichJob,
  CompanyEnrichJobStatus,
} from "@/lib/api/types";

/**
 * Intervalo de consulta de la cola de enriquecimiento. El contrato pide
 * refrescar cada 5 s mientras haya trabajos pendientes o en ejecución.
 */
export const ENRICH_JOBS_POLL_MS = 5_000;

export const ENRICH_JOB_STATUS_LABELS: Record<CompanyEnrichJobStatus, string> = {
  pending: "En cola",
  running: "En ejecución",
  completed: "Completado",
  failed: "Falló",
  unknown: "Sin estado",
};

export function enrichJobStatusLabel(
  status: CompanyEnrichJobStatus,
  rawStatus: string,
): string {
  if (status !== "unknown") return ENRICH_JOB_STATUS_LABELS[status];
  return rawStatus.trim().length > 0 ? rawStatus : ENRICH_JOB_STATUS_LABELS.unknown;
}

export function isActiveEnrichJobStatus(
  status: CompanyEnrichJobStatus,
): boolean {
  return status === "pending" || status === "running";
}

/**
 * Devuelve el intervalo de polling o `false` cuando no hay trabajos activos.
 * Una cola vacía o terminada no se consulta en bucle.
 */
export function enrichmentJobsPollInterval(
  jobs: CompanyEnrichJob[] | undefined,
): number | false {
  if (!jobs || jobs.length === 0) return false;
  return jobs.some((job) => isActiveEnrichJobStatus(job.status))
    ? ENRICH_JOBS_POLL_MS
    : false;
}

export function enrichmentJobPollInterval(
  job: CompanyEnrichJob | undefined,
): number | false {
  if (!job) return false;
  return isActiveEnrichJobStatus(job.status) ? ENRICH_JOBS_POLL_MS : false;
}
