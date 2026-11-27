"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSuppression,
  deleteSuppression,
  listSuppressions,
} from "@/lib/api/suppressions";
import type { SuppressionInput } from "@/lib/api/types";

export const suppressionKeys = {
  all: ["suppressions"] as const,
};

export function useSuppressions() {
  return useQuery({
    queryKey: suppressionKeys.all,
    queryFn: listSuppressions,
  });
}

export function useCreateSuppression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SuppressionInput) => createSuppression(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: suppressionKeys.all }),
  });
}

export function useDeleteSuppression() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSuppression(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: suppressionKeys.all }),
  });
}
