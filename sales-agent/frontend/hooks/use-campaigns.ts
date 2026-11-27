"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createCampaign,
  getCampaign,
  listCampaigns,
  runCampaignAction,
} from "@/lib/api/campaigns";
import type { CampaignInput } from "@/lib/api/types";

export const campaignKeys = {
  all: ["campaigns"] as const,
  detail: (id: string) => ["campaigns", id] as const,
};

export function useCampaigns() {
  return useQuery({ queryKey: campaignKeys.all, queryFn: listCampaigns });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaign(id),
    enabled: Boolean(id),
  });
}

function useInvalidateCampaigns() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: campaignKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useCreateCampaign() {
  const invalidate = useInvalidateCampaigns();
  return useMutation({
    mutationFn: (input: CampaignInput) => createCampaign(input),
    onSuccess: invalidate,
  });
}

export function useCampaignAction(id: string) {
  const invalidate = useInvalidateCampaigns();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: "start" | "pause" | "cancel") =>
      runCampaignAction(id, action),
    onSuccess: (campaign) => {
      queryClient.setQueryData(campaignKeys.detail(id), campaign);
      return invalidate();
    },
  });
}
