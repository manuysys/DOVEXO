"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getWhatsAppStatus,
  getWhatsAppThread,
  listWhatsAppThreads,
  simulateInbound,
} from "@/lib/api/whatsapp";

export const whatsappKeys = {
  all: ["whatsapp"] as const,
  status: ["whatsapp", "status"] as const,
  threads: ["whatsapp", "threads"] as const,
  thread: (id: string) => ["whatsapp", "threads", id] as const,
};

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: whatsappKeys.status,
    queryFn: getWhatsAppStatus,
    staleTime: 60_000,
  });
}

export function useWhatsAppThreads() {
  return useQuery({
    queryKey: whatsappKeys.threads,
    queryFn: listWhatsAppThreads,
  });
}

export function useWhatsAppThread(id: string, { poll = false }: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: whatsappKeys.thread(id),
    queryFn: () => getWhatsAppThread(id),
    enabled: Boolean(id),
    refetchInterval: poll ? 15_000 : false,
  });
}

/** Simula un entrante para probar el bot sin WhatsApp real. */
export function useSimulateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone: string; name?: string; text: string }) =>
      simulateInbound(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: whatsappKeys.threads }),
        queryClient.invalidateQueries({ queryKey: whatsappKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["messages"] }),
        queryClient.invalidateQueries({ queryKey: ["activities"] }),
      ]),
  });
}
