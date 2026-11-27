"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createLead,
  getLead,
  listLeadEvaluations,
  listLeads,
  scoreLead,
  updateLead,
} from "@/lib/api/leads";
import type {
  Lead,
  LeadFilters,
  LeadScoreResult,
  LeadUpdateInput,
} from "@/lib/api/types";

export const leadKeys = {
  all: ["leads"] as const,
  list: (filters: LeadFilters) => ["leads", "list", filters] as const,
  detail: (id: string) => ["leads", id] as const,
  evaluations: (id: string) => ["leads", id, "evaluations"] as const,
};

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => listLeads(filters),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLead(id),
    enabled: Boolean(id),
  });
}

export function useLeadEvaluations(id: string) {
  return useQuery({
    queryKey: leadKeys.evaluations(id),
    queryFn: () => listLeadEvaluations(id),
    enabled: Boolean(id),
  });
}

/** Crea la oportunidad de una empresa; no calcula el score todavía. */
export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      product_id,
    }: {
      companyId: string;
      product_id?: string;
    }) => createLead(companyId, { product_id }),
    onSuccess: (lead: Lead) => {
      if (lead.id) queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: LeadUpdateInput }) =>
      updateLead(id, input),
    onSuccess: (lead: Lead) => {
      if (lead.id) queryClient.setQueryData(leadKeys.detail(lead.id), lead);
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

/** Calcula compatibilidad y confianza y guarda la evaluación. */
export function useScoreLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => scoreLead(id),
    onSuccess: (result: LeadScoreResult, id) => {
      if (result.lead) {
        queryClient.setQueryData(leadKeys.detail(id), result.lead);
      }
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: leadKeys.detail(id) }),
        queryClient.invalidateQueries({ queryKey: leadKeys.evaluations(id) }),
        queryClient.invalidateQueries({ queryKey: ["leads", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}
