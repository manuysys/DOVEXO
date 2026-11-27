"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveMessage,
  generateMessage,
  listLeadMessages,
  markMessageSent,
  sendMessage,
  updateMessage,
} from "@/lib/api/messages";
import type { GenerateMessageInput, OutreachMessage } from "@/lib/api/types";

export const messageKeys = {
  all: ["messages"] as const,
  lead: (leadId: string) => ["messages", "lead", leadId] as const,
};

export function useLeadMessages(leadId: string) {
  return useQuery({
    queryKey: messageKeys.lead(leadId),
    queryFn: () => listLeadMessages(leadId),
    enabled: Boolean(leadId),
  });
}

function useInvalidateMessages(leadId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: messageKeys.all }),
      queryClient.invalidateQueries({ queryKey: messageKeys.lead(leadId) }),
      queryClient.invalidateQueries({ queryKey: ["leads"] }),
      queryClient.invalidateQueries({ queryKey: ["whatsapp"] }),
      queryClient.invalidateQueries({ queryKey: ["activities"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
}

export function useGenerateMessage(leadId: string) {
  const invalidate = useInvalidateMessages(leadId);
  return useMutation({
    mutationFn: (input: GenerateMessageInput) => generateMessage(leadId, input),
    onSuccess: invalidate,
  });
}

export function useUpdateMessage(leadId: string) {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateMessages(leadId);
  return useMutation({
    mutationFn: ({ id, edited_text }: { id: string; edited_text: string }) =>
      updateMessage(id, { edited_text }),
    onSuccess: (message: OutreachMessage) => {
      queryClient.setQueryData<OutreachMessage[]>(
        messageKeys.lead(leadId),
        (current) =>
          current?.map((item) => (item.id === message.id ? message : item)) ??
          current,
      );
      return invalidate();
    },
  });
}

export function useApproveMessage(leadId: string) {
  const invalidate = useInvalidateMessages(leadId);
  return useMutation({
    mutationFn: (id: string) => approveMessage(id),
    onSuccess: invalidate,
  });
}

export function useSendMessage(leadId: string) {
  const invalidate = useInvalidateMessages(leadId);
  return useMutation({
    mutationFn: (id: string) => sendMessage(id),
    onSuccess: invalidate,
  });
}

export function useMarkMessageSent(leadId: string) {
  const invalidate = useInvalidateMessages(leadId);
  return useMutation({
    mutationFn: (id: string) => markMessageSent(id),
    onSuccess: invalidate,
  });
}
