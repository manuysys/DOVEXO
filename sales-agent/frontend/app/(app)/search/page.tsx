"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { buttonStyles } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { SearchForm } from "@/components/search/search-form";
import { SearchRunPanel } from "@/components/search/search-run-panel";
import {
  emptySearchValues,
  formValuesToSearchRunInput,
  type SearchFormValues,
} from "@/features/search/schema";
import { useCreateSearchRun } from "@/hooks/use-search-runs";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import type { ProvinceOption } from "@/lib/api/types";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { getErrorMessage } from "@/lib/errors";

export default function SearchPage() {
  const [runId, setRunId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();
  const createRun = useCreateSearchRun();

  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  return (
    <>
      <PageHeader
        title="Buscar empresas"
        description="Iniciá una corrida de descubrimiento sobre OpenStreetMap/Overpass para una provincia y sus rubros. El progreso lo informa el backend."
        actions={
          <Link
            href="/search-history"
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            Historial de búsquedas
          </Link>
        }
      />

      {provincesQuery.isPending ? null : provincesQuery.isError ? (
        <Alert variant="warning" className="mb-4">
          No se pudo consultar <code>/meta/provinces</code> (
          {getErrorMessage(provincesQuery.error)}). Se usa la lista local de
          provincias; si la búsqueda falla, reintentá cuando la API responda.
        </Alert>
      ) : null}

      {runId ? (
        <div className="space-y-4">
          <SearchRunPanel runId={runId} />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setRunId(null)}
              className={buttonStyles({ variant: "secondary", size: "sm" })}
            >
              Configurar otra búsqueda
            </button>
            <span className="text-xs text-muted">
              Los resultados se guardan en la base; esta pantalla solo sigue una
              corrida a la vez.
            </span>
          </div>
        </div>
      ) : (
        <SearchForm
          provinces={provinces}
          provincesUnavailable={provincesQuery.isError}
          sectors={sectorsQuery.data ?? []}
          sectorsUnavailable={sectorsQuery.isError}
          defaultValues={emptySearchValues()}
          submitLabel="Iniciar búsqueda"
          isSubmitting={createRun.isPending}
          formError={
            runError ??
            (createRun.isError ? getErrorMessage(createRun.error) : null)
          }
          onSubmit={async (values: SearchFormValues) => {
            setRunError(null);
            const run = await createRun.mutateAsync(
              formValuesToSearchRunInput(values),
            );
            if (!run.id) {
              setRunError(
                "La API no devolvió el identificador de la búsqueda. Revisá el historial o reintentá.",
              );
              return;
            }
            setRunId(run.id);
          }}
        />
      )}
    </>
  );
}
