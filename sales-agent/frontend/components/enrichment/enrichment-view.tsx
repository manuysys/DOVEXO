"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingBlock, Spinner } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/use-auth";
import { useCompanies } from "@/hooks/use-companies";
import { useSectors } from "@/hooks/use-dashboard";
import { useEnrichCompanies } from "@/hooks/use-enrichment";
import { useProvinces } from "@/hooks/use-provinces";
import { canEnrichCompanies } from "@/features/prospects/permissions";
import { ENRICH_BATCH_LIMIT } from "@/lib/api/companies";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import type {
  CompanyEnrichBatchResult,
  CompanyFilters,
  ProvinceOption,
} from "@/lib/api/types";
import { getErrorMessage } from "@/lib/errors";
import { pluralize } from "@/lib/utils";
import { EnrichmentJobsPanel } from "./enrichment-jobs-panel";
import { EnrichmentTable } from "./enrichment-table";

const PAGE_SIZE = ENRICH_BATCH_LIMIT;

/**
 * Lista de empresas con sitio web para encolar su investigación. La selección
 * se limita a 50; todo lo que se muestra viene de `GET /companies`, sin
 * empresas de ejemplo.
 */
export function EnrichmentView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchResult, setBatchResult] = useState<CompanyEnrichBatchResult | null>(
    null,
  );

  const currentUser = useCurrentUser();
  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();
  const batchMutation = useEnrichCompanies();

  const province = searchParams.get("province") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const query = searchParams.get("q") ?? "";
  const parsedOffset = Number(searchParams.get("offset") ?? "0");
  const offset =
    Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  const filters: CompanyFilters = {
    has_website: true,
    province: province || undefined,
    sector: sector || undefined,
    query: query || undefined,
    limit: PAGE_SIZE,
    offset,
  };

  const companiesQuery = useCompanies(filters);
  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  const canAct =
    !currentUser.isPending && canEnrichCompanies(currentUser.data?.role);
  const page = companiesQuery.data;
  const companies = page?.items ?? [];
  const total = page?.total ?? 0;
  const from = total === 0 || companies.length === 0 ? 0 : offset + 1;
  const to = offset + companies.length;
  const hasNext = to < total;
  const hasFilters = Boolean(province || sector || query);
  const selectedCount = selectedIds.size;
  const allSelected =
    companies.length > 0 &&
    companies.every((company) => selectedIds.has(company.id));
  const limitReached = selectedCount >= ENRICH_BATCH_LIMIT;

  const updateParams = (patch: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value.length === 0) params.delete(key);
      else params.set(key, value);
    }
    if (!("offset" in patch)) params.delete("offset");
    const queryString = params.toString();
    router.replace(
      queryString.length > 0 ? `${pathname}?${queryString}` : pathname,
      { scroll: false },
    );
  };

  const clearFilters = () => router.replace(pathname, { scroll: false });

  const toggleCompany = (id: string) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= ENRICH_BATCH_LIMIT) return previous;
      next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (allSelected) {
        for (const company of companies) next.delete(company.id);
        return next;
      }
      for (const company of companies) {
        if (next.size >= ENRICH_BATCH_LIMIT) break;
        next.add(company.id);
      }
      return next;
    });
  };

  const handleEnrichSelected = () => {
    if (selectedCount === 0) return;
    const ids = Array.from(selectedIds);
    batchMutation.mutate(ids, {
      onSuccess: (result) => {
        setBatchResult(result);
        setSelectedIds(new Set());
      },
    });
  };

  return (
    <div className="space-y-4">
      {!canAct && !currentUser.isPending ? (
        <Alert variant="info" title="Acciones restringidas">
          Solo un administrador o propietario puede iniciar enriquecimientos.
          Podés revisar qué empresas tienen sitio web y el estado de la cola; el
          backend valida el permiso igual.
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Empresas con sitio web"
          description="Elegí hasta 50 empresas por lote. El botón encola la investigación; no descarga sitios desde el navegador."
          action={
            <div className="flex flex-wrap items-center gap-2">
              {canAct ? (
                <Button
                  size="sm"
                  onClick={handleEnrichSelected}
                  disabled={
                    selectedCount === 0 || batchMutation.isPending
                  }
                  aria-busy={batchMutation.isPending}
                >
                  {batchMutation.isPending ? (
                    <>
                      <Spinner label="Encolando empresas" />
                      Encolando…
                    </>
                  ) : (
                    "Enriquecer seleccionadas"
                  )}
                </Button>
              ) : null}
              {selectedCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedIds(new Set())}
                >
                  Limpiar selección
                </Button>
              ) : null}
            </div>
          }
        />
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <form
              className="flex items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                const value = data.get("q");
                updateParams({
                  q: typeof value === "string" ? value.trim() : "",
                });
              }}
            >
              <label className="flex w-full flex-col gap-1 text-xs font-medium text-muted">
                Nombre o texto
                <Input
                  key={query}
                  name="q"
                  defaultValue={query}
                  placeholder="Ej.: refrigeración"
                  className="h-9 py-1"
                />
              </label>
              <Button type="submit" variant="secondary" size="sm">
                Buscar
              </Button>
            </form>

            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Provincia
              <Select
                value={province}
                onChange={(event) =>
                  updateParams({ province: event.target.value })
                }
                className="h-9 py-1"
              >
                <option value="">Todas las provincias</option>
                {provinces.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="flex flex-col gap-1 text-xs font-medium text-muted">
              Rubro
              <Select
                value={sector}
                onChange={(event) =>
                  updateParams({ sector: event.target.value })
                }
                className="h-9 py-1"
                disabled={sectorsQuery.isError}
              >
                <option value="">Todos los rubros</option>
                {(sectorsQuery.data ?? []).map((option) => (
                  <option key={option.id || option.slug} value={option.slug}>
                    {option.name || option.slug}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
            <p className="text-xs text-muted" aria-live="polite">
              {canAct
                ? `${selectedCount} de ${companies.length} seleccionadas · máximo ${ENRICH_BATCH_LIMIT} por lote`
                : `${pluralize(companies.length, "empresa", "empresas")} en esta página`}
            </p>
            {hasFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : null}
          </div>

          {limitReached && canAct ? (
            <p role="status" className="text-xs font-medium text-warning-strong">
              Llegaste al máximo de {ENRICH_BATCH_LIMIT} empresas por lote.
              Enriquecé este lote antes de seleccionar más.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {batchMutation.isError ? (
        <Alert variant="danger" title="No se pudo encolar el lote">
          {getErrorMessage(batchMutation.error)}
        </Alert>
      ) : null}

      {batchResult ? (
        <Alert
          variant={batchResult.queued > 0 ? "success" : "warning"}
          title={
            batchResult.queued > 0
              ? "Lote encolado"
              : "No se encoló ninguna empresa"
          }
        >
          <p>
            {pluralize(
              batchResult.queued,
              "empresa encolada",
              "empresas encoladas",
            )}{" "}
            ·{" "}
            {pluralize(batchResult.skipped, "omitida", "omitidas")} por el
            backend.
          </p>
          {batchResult.candidates > 0 ? (
            <p className="mt-1 text-xs">
              Candidatas evaluadas: {batchResult.candidates}. El detalle de cada
              trabajo aparece en la cola.
            </p>
          ) : null}
        </Alert>
      ) : null}

      {companiesQuery.isPending ? (
        <LoadingBlock label="Cargando empresas con sitio web…" />
      ) : companiesQuery.isError ? (
        <Alert variant="danger" title="No se pudieron cargar las empresas">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>{getErrorMessage(companiesQuery.error)}</span>
            <button
              type="button"
              onClick={() => void companiesQuery.refetch()}
              className="text-xs font-semibold underline"
            >
              Reintentar
            </button>
          </div>
        </Alert>
      ) : companies.length === 0 ? (
        <EmptyState
          title={
            hasFilters
              ? "Ninguna empresa con sitio web coincide con los filtros"
              : "Todavía no hay empresas con sitio web"
          }
          description={
            hasFilters
              ? "Probá con otra provincia, otro rubro o sin filtros. La lista sale de la base: no hay resultados de ejemplo."
              : "Solo se pueden enriquecer empresas con una URL cargada. Cargá el sitio en la ficha de una empresa o importá un CSV con la columna de sitio web."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <Link
                href="/prospects"
                className={buttonStyles({ variant: "secondary", size: "sm" })}
              >
                Ir a prospectos
              </Link>
            )
          }
        />
      ) : (
        <>
          <EnrichmentTable
            companies={companies}
            selectedIds={selectedIds}
            disabled={!canAct}
            allSelected={allSelected}
            onToggle={toggleCompany}
            onToggleAll={toggleAll}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Mostrando {from}–{to} de {pluralize(total, "empresa", "empresas")}
              {companiesQuery.isFetching ? " · actualizando…" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() =>
                  updateParams({
                    offset: String(Math.max(offset - PAGE_SIZE, 0)),
                  })
                }
              >
                Anterior
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasNext}
                onClick={() =>
                  updateParams({ offset: String(offset + PAGE_SIZE) })
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}

      <EnrichmentJobsPanel />
    </div>
  );
}
