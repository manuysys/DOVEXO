"use client";

import { useQuery } from "@tanstack/react-query";
import { listProvinces } from "@/lib/api/dashboard";

/** Provincias de referencia del backend (`GET /meta/provinces`). */
export function useProvinces() {
  return useQuery({
    queryKey: ["provinces"],
    queryFn: listProvinces,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
