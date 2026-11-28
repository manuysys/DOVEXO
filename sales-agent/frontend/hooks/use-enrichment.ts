"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ENRICH_BATCH_LIMIT,
  enrichCompanies,
  getEnrichJob,
  listEnrichJobs,
} from "@/lib/api/companies";
import {
  enrichmentJobPollInterval,
  enrichmentJobsPollInterval,
} from "@/features/prospects/enrichment";

export const enrichmentKeys = {
  all: ["enrichment"] as const,
  jobs: (limit: number = ENRICH_BATCH_LIMIT) =>
    ["enrichment", "jobs", limit] as const,
  job: (id: string) => ["enrichment", "job", id] as const,
};

/**
 * Todo lo que cambia cuando termina una investigación: la ficha (contactos,
 * facts, fuentes), las oportunidades, el dashboard y la propia cola.
 */
function invalidateEnrichmentData(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<void[]> {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["companies"] }),
    queryClient.invalidateQueries({ queryKey: ["leads"] }),
    queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    queryClient.invalidateQueries({ queryKey: ["enrichment"] }),
    queryClient.invalidateQueries({ queryKey: ["search-runs"] }),
  ]);
}

/**
 * Cola de trabajos. Se actualiza cada 5 s mientras haya trabajos pendientes o
 * en ejecución; cuando todos terminan, deja de consultar.
 */
export function useEnrichJobs({
  limit = ENRICH_BATCH_LIMIT,
  poll = true,
}: { limit?: number; poll?: boolean } = {}) {
  return useQuery({
    queryKey: enrichmentKeys.jobs(limit),
    queryFn: () => listEnrichJobs(limit),
    refetchInterval: (query) => {
      if (!poll) return false;
      return enrichmentJobsPollInterval(query.state.data);
    },
  });
}

/** Detalle de un trabajo; se refresca hasta que llega a un estado terminal. */
export function useEnrichJob(
  id: string,
  { poll = true }: { poll?: boolean } = {},
) {
  return useQuery({
    queryKey: enrichmentKeys.job(id),
    queryFn: () => getEnrichJob(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!poll) return false;
      return enrichmentJobPollInterval(query.state.data);
    },
  });
}

/**
 * Encola hasta 50 empresas (`POST /companies/enrich`). La respuesta indica
 * cuántas se encolaron y cuántas se omitieron; no se completa por cuenta
 * propia lo que el backend no informa. También se usa para reencolar un
 * trabajo fallido de una sola empresa.
 */
export function useEnrichCompanies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyIds: string[]) => enrichCompanies(companyIds),
    onSuccess: () => invalidateEnrichmentData(queryClient),
  });
}
