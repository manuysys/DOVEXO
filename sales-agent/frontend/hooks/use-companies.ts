"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCompany,
  createCompanyContact,
  enrichCompany,
  exportCompaniesCsv,
  getCompany,
  listCompanies,
  updateCompany,
} from "@/lib/api/companies";
import type {
  Company,
  CompanyContactInput,
  CompanyEnrichResult,
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

/**
 * Investiga el sitio web de la empresa y refresca todo lo que depende de ella:
 * la ficha (contactos, fuentes y `last_enriched_at`), las oportunidades, el
 * dashboard y las búsquedas. El resumen se muestra a partir de la respuesta.
 */
export function useEnrichCompany(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (): Promise<CompanyEnrichResult> => enrichCompany(companyId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["search-runs"] }),
        queryClient.invalidateQueries({ queryKey: ["enrichment"] }),
      ]),
  });
}

/**
 * Confirma manualmente un contacto (por ejemplo un WhatsApp) y refresca la
 * empresa, las oportunidades y el estado de WhatsApp para que `company_whatsapp`
 * se actualice en toda la UI.
 */
export function useCreateCompanyContact(companyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CompanyContactInput) =>
      createCompanyContact(companyId, input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: companyKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["leads"] }),
        queryClient.invalidateQueries({ queryKey: ["whatsapp"] }),
        queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
      ]),
  });
}
