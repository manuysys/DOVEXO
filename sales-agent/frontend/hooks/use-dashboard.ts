"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getDashboardJobs,
  getDashboardMetrics,
  listSectors,
} from "@/lib/api/dashboard";

export const dashboardKeys = {
  metrics: (productId?: string) =>
    ["dashboard", "metrics", productId ?? "all"] as const,
  jobs: ["dashboard", "jobs"] as const,
};

export function useDashboardMetrics(productId?: string) {
  return useQuery({
    queryKey: dashboardKeys.metrics(productId),
    queryFn: () => getDashboardMetrics(productId),
  });
}

export function useDashboardJobs() {
  return useQuery({
    queryKey: dashboardKeys.jobs,
    queryFn: getDashboardJobs,
    retry: false,
  });
}

export function useSectors() {
  return useQuery({
    queryKey: ["sectors"],
    queryFn: listSectors,
    retry: false,
    staleTime: 5 * 60_000,
  });
}
