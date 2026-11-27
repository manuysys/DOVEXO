"use client";

import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { SearchHistoryTable } from "@/components/search/search-history-table";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import { useSearchRuns } from "@/hooks/use-search-runs";
import type { ProvinceOption } from "@/lib/api/types";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { getErrorMessage } from "@/lib/errors";

export default function SearchHistoryPage() {
  const runsQuery = useSearchRuns();
  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();

  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  return (
    <>
      <PageHeader
        title="Historial de búsquedas"
        description="Cada corrida de descubrimiento con su estado, alcance y conteos reales informados por el backend."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              disabled={runsQuery.isFetching}
              onClick={() => void runsQuery.refetch()}
            >
              {runsQuery.isFetching ? "Actualizando…" : "Actualizar"}
            </Button>
            <Link
              href="/search"
              className={buttonStyles({ variant: "primary", size: "md" })}
            >
              Nueva búsqueda
            </Link>
          </div>
        }
      />

      {runsQuery.isPending ? (
        <LoadingBlock label="Cargando historial…" />
      ) : runsQuery.isError ? (
        <Alert variant="danger" title="No se pudo cargar el historial">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(runsQuery.error)}</span>
            <button
              type="button"
              onClick={() => void runsQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : runsQuery.data.length === 0 ? (
        <EmptyState
          title="Todavía no hay búsquedas ejecutadas"
          description="Cuando inicies una búsqueda por provincia y rubro, la corrida queda registrada acá con su estado y sus conteos."
          action={
            <Link
              href="/search"
              className={buttonStyles({ variant: "primary", size: "sm" })}
            >
              Iniciar una búsqueda
            </Link>
          }
        />
      ) : (
        <>
          {provincesQuery.isError ? (
            <Alert variant="warning" className="mb-4">
              No se pudo consultar <code>/meta/provinces</code>: la columna
              Provincia muestra el código informado por la corrida.
            </Alert>
          ) : null}
          <SearchHistoryTable
            runs={runsQuery.data}
            provinces={provinces}
            sectors={sectorsQuery.data ?? []}
          />
        </>
      )}
    </>
  );
}
