"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSearchRun,
  getSearchRun,
  listSearchRuns,
  runSearchRunAction,
  type SearchRunAction,
} from "@/lib/api/search";
import type {
  SearchRun,
  SearchRunInput,
  SearchRunStatus,
} from "@/lib/api/types";

export const searchRunKeys = {
  all: ["search-runs"] as const,
  list: (campaignId?: string) =>
    ["search-runs", "list", campaignId ?? "all"] as const,
  detail: (id: string) => ["search-runs", id] as const,
};

/** Intervalo de consulta al backend mientras la corrida sigue activa. */
export const SEARCH_RUN_POLL_MS = 2_000;
/** La campaña consulta más espaciado: hay una corrida por provincia. */
export const CAMPAIGN_RUNS_POLL_MS = 5_000;

export function isTerminalSearchRunStatus(status: SearchRunStatus): boolean {
  return (
    status === "completed" || status === "failed" || status === "cancelled"
  );
}

/** Historial de corridas; con `campaignId` solo las de esa campaña. */
export function useSearchRuns(campaignId?: string) {
  return useQuery({
    queryKey: searchRunKeys.list(campaignId),
    queryFn: () =>
      listSearchRuns(campaignId ? { campaign_id: campaignId } : {}),
  });
}

/**
 * Corridas provinciales de una campaña. Se refresca cada 5 s mientras alguna
 * siga pendiente o en ejecución.
 */
export function useCampaignSearchRuns(
  campaignId: string,
  { poll = true }: { poll?: boolean } = {},
) {
  return useQuery({
    queryKey: searchRunKeys.list(campaignId),
    queryFn: () => listSearchRuns({ campaign_id: campaignId }),
    enabled: Boolean(campaignId),
    refetchInterval: (query) => {
      if (!poll) return false;
      const runs = query.state.data;
      if (!runs) return CAMPAIGN_RUNS_POLL_MS;
      const active = runs.some(
        (run) => !isTerminalSearchRunStatus(run.status),
      );
      return active ? CAMPAIGN_RUNS_POLL_MS : false;
    },
  });
}

/**
 * Detalle de una corrida. Con `poll` activo se consulta cada 2 s hasta que
 * llega a un estado terminal; el backend es la única fuente del progreso.
 */
export function useSearchRun(
  id: string,
  { poll = true }: { poll?: boolean } = {},
) {
  return useQuery({
    queryKey: searchRunKeys.detail(id),
    queryFn: () => getSearchRun(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      if (!poll) return false;
      const run = query.state.data;
      if (!run) return SEARCH_RUN_POLL_MS;
      return isTerminalSearchRunStatus(run.status)
        ? false
        : SEARCH_RUN_POLL_MS;
    },
  });
}

export function useCreateSearchRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SearchRunInput) => createSearchRun(input),
    onSuccess: (run: SearchRun) => {
      if (run.id) queryClient.setQueryData(searchRunKeys.detail(run.id), run);
      return queryClient.invalidateQueries({ queryKey: searchRunKeys.all });
    },
  });
}

export function useSearchRunAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: SearchRunAction) => runSearchRunAction(id, action),
    onSuccess: (run) => {
      if (run.id) queryClient.setQueryData(searchRunKeys.detail(id), run);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: searchRunKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["companies"] }),
      ]);
    },
  });
}
