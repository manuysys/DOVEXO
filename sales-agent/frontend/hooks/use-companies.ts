"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCompany,
  exportCompaniesCsv,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/lib/api/companies";
import type {
  Company,
  CompanyFilters,
  CompanyInput,
  CompanyUpdateInput,
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

/** Correcciones y cambios de estado (por ejemplo, resolver un duplicado). */
export function useUpdateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CompanyUpdateInput }) =>
      updateCompany(id, input),
    onSuccess: (company) => {
      if (company.id) {
        queryClient.setQueryData(companyKeys.detail(company.id), company);
      }
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
}

/** Descarga el CSV con los filtros activos de la tabla. */
export function useExportCompanies() {
  return useMutation({
    mutationFn: (filters: CompanyFilters) => exportCompaniesCsv(filters),
  });
}
