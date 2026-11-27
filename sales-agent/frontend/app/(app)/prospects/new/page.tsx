"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyForm } from "@/components/prospects/company-form";
import {
  emptyCompanyValues,
  formValuesToCompanyInput,
} from "@/features/prospects/schema";
import {
  readDuplicateCompany,
  type DuplicateCompany,
} from "@/features/prospects/duplicate";
import { useCreateCompany } from "@/hooks/use-companies";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import type { ProvinceOption } from "@/lib/api/types";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { getErrorMessage } from "@/lib/errors";

export default function NewCompanyPage() {
  const router = useRouter();
  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();
  const createCompany = useCreateCompany();
  const [duplicate, setDuplicate] = useState<DuplicateCompany | null>(null);

  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  return (
    <>
      <PageHeader
        title="Agregar empresa"
        description="Alta manual de una empresa que ya conocés. Se guarda lo que cargues: el enriquecimiento automático llega en la Fase 3."
      />

      <CompanyForm
        provinces={provinces}
        provincesUnavailable={provincesQuery.isError}
        sectors={sectorsQuery.data ?? []}
        sectorsUnavailable={sectorsQuery.isError}
        defaultValues={emptyCompanyValues()}
        submitLabel="Guardar empresa"
        isSubmitting={createCompany.isPending}
        duplicate={duplicate}
        formError={
          createCompany.isError && !duplicate
            ? getErrorMessage(createCompany.error)
            : null
        }
        onSubmit={async (values) => {
          setDuplicate(null);
          try {
            const company = await createCompany.mutateAsync(
              formValuesToCompanyInput(values),
            );
            if (!company.id) {
              throw new Error("La API no devolvió el identificador de la empresa.");
            }
            router.push(`/prospects/${company.id}`);
          } catch (error) {
            const conflict = readDuplicateCompany(error);
            if (conflict) {
              setDuplicate(conflict);
              return;
            }
            throw error;
          }
        }}
      />
    </>
  );
}
