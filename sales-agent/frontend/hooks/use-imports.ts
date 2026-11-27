"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmImport, listImports, previewImport } from "@/lib/api/imports";

export const importKeys = {
  all: ["imports"] as const,
  detail: (id: string) => ["imports", id] as const,
};

export function useImports() {
  return useQuery({ queryKey: importKeys.all, queryFn: listImports });
}

/** Sube el archivo y devuelve la previsualización; no crea empresas. */
export function usePreviewImport() {
  return useMutation({ mutationFn: (file: File) => previewImport(file) });
}

/** Confirma el lote previsualizado y crea las empresas válidas. */
export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (batchId: string) => confirmImport(batchId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: importKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["companies"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}
