"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createCompany, getCompany, listCompanies } from "@/lib/api/companies";
import type {
  Company,
  CompanyFilters,
  CompanyInput,
} from "@/lib/api/types";

export const companyKeys = {
  all: ["companies"] as const,
  list: (filters: CompanyFilters) => ["companies", "list", filters] as const,
  detail: (id: string) => ["companies", id] as const,
};

export function useCompanies(filters: CompanyFilters) {
  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => listCompanies(filters),
    placeholderData: keepPreviousData,
  });
}

export function useCompany(id: string) {
  return useQuery({
    queryKey: companyKeys.detail(id),
    queryFn: () => getCompany(id),
    enabled: Boolean(id),
  });
}

export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanyInput) => createCompany(input),
    onSuccess: (company: Company) => {
      if (company.id) {
        queryClient.setQueryData(companyKeys.detail(company.id), company);
      }
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["search-runs"] }),
      ]);
    },
  });
}
