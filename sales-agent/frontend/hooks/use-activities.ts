"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createLeadActivity,
  listActivities,
  listLeadActivities,
} from "@/lib/api/activities";
import type { ActivityInput } from "@/lib/api/types";

export const activityKeys = {
  all: ["activities"] as const,
  recent: (limit: number) => ["activities", "recent", limit] as const,
  lead: (leadId: string) => ["activities", "lead", leadId] as const,
};

export function useRecentActivities(limit = 8) {
  return useQuery({
    queryKey: activityKeys.recent(limit),
    queryFn: () => listActivities({ limit }),
  });
}

export function useLeadActivities(leadId: string) {
  return useQuery({
    queryKey: activityKeys.lead(leadId),
    queryFn: () => listLeadActivities(leadId),
    enabled: Boolean(leadId),
  });
}

export function useCreateLeadActivity(leadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ActivityInput) => createLeadActivity(leadId, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: activityKeys.all }),
        queryClient.invalidateQueries({ queryKey: activityKeys.lead(leadId) }),
        queryClient.invalidateQueries({ queryKey: ["leads", leadId] }),
        queryClient.invalidateQueries({ queryKey: ["leads", "list"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}
