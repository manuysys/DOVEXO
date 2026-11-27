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
import {
  useCompanies,
  useExportCompanies,
  useUpdateCompany,
} from "@/hooks/use-companies";
import { useSectors } from "@/hooks/use-dashboard";
import { useProvinces } from "@/hooks/use-provinces";
import { useSearchRuns } from "@/hooks/use-search-runs";
import type {
  Company,
  CompanyFilters,
  ProvinceOption,
} from "@/lib/api/types";
import { companyStatusLabel } from "@/components/prospects/company-status-badge";
import { ARGENTINA_PROVINCE_CODES } from "@/lib/data/provinces";
import { downloadBlob } from "@/lib/download";
import { getErrorMessage } from "@/lib/errors";
import { formatDateTime, pluralize } from "@/lib/utils";
import { ProspectsTable } from "./prospects-table";

const PAGE_SIZE = 25;

export function ProspectsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const searchRunId = searchParams.get("search_run_id") ?? "";
  const province = searchParams.get("province") ?? "";
  const sector = searchParams.get("sector") ?? "";
  const discoveryStatus = searchParams.get("discovery_status") ?? "";
  const query = searchParams.get("q") ?? "";
  const parsedOffset = Number(searchParams.get("offset") ?? "0");
  const offset =
    Number.isFinite(parsedOffset) && parsedOffset > 0 ? parsedOffset : 0;

  const provincesQuery = useProvinces();
  const sectorsQuery = useSectors();
  const searchRunsQuery = useSearchRuns();
  const updateCompanyMutation = useUpdateCompany();
  const exportMutation = useExportCompanies();

  const filters: CompanyFilters = {
    search_run_id: searchRunId || undefined,
    province: province || undefined,
    sector: sector || undefined,
    discovery_status: discoveryStatus || undefined,
    query: query || undefined,
    limit: PAGE_SIZE,
    offset,
  };

  const exportFilters: CompanyFilters = {
    search_run_id: searchRunId || undefined,
    province: province || undefined,
    sector: sector || undefined,
    discovery_status: discoveryStatus || undefined,
    query: query || undefined,
  };

  const companiesQuery = useCompanies(filters);

  const provinces: ReadonlyArray<ProvinceOption> =
    provincesQuery.data && provincesQuery.data.length > 0
      ? provincesQuery.data
      : ARGENTINA_PROVINCE_CODES;

  const hasFilters = Boolean(
    searchRunId || province || sector || query || discoveryStatus,
  );

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

  const handleStatusChange = (
    company: Company,
    status: "discovered" | "rejected",
  ) => {
    const label = company.name || "esta empresa";
    const message =
      status === "rejected"
        ? `¿Descartar "${label}"? Queda marcada como descartada y podés restaurarla después.`
        : `¿Marcar "${label}" como que no es un duplicado?`;
    if (!window.confirm(message)) return;

    setUpdatingId(company.id);
    updateCompanyMutation.mutate(
      { id: company.id, input: { discovery_status: status } },
      { onSettled: () => setUpdatingId(null) },
    );
  };

  const handleExport = () => {
    exportMutation.mutate(exportFilters, {
      onSuccess: ({ blob, filename }) => downloadBlob(blob, filename),
    });
  };

  const page = companiesQuery.data;
  const companies = page?.items ?? [];
  const total = page?.total ?? 0;
  const from = total === 0 || companies.length === 0 ? 0 : offset + 1;
  const to = offset + companies.length;
  const hasNext = to < total;

  return (
    <>
      <Card className="mb-4">
        <CardHeader
          title="Filtros"
          description="Los filtros se guardan en la URL, así podés compartir o recargar la vista sin perderlos. La exportación usa los mismos filtros."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={exportMutation.isPending}
                onClick={handleExport}
              >
                {exportMutation.isPending ? (
                  <>
                    <Spinner label="Exportando" />
                    Exportando…
                  </>
                ) : (
                  "Exportar CSV"
                )}
              </Button>
              {hasFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              ) : null}
            </div>
          }
        />
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const value = data.get("q");
              updateParams({ q: typeof value === "string" ? value.trim() : "" });
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
              onChange={(event) => updateParams({ province: event.target.value })}
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
              onChange={(event) => updateParams({ sector: event.target.value })}
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

          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Estado
            <Select
              value={discoveryStatus}
              onChange={(event) =>
                updateParams({ discovery_status: event.target.value })
              }
              className="h-9 py-1"
            >
              <option value="">Todos los estados</option>
              <option value="possible_duplicate">Posibles duplicados</option>
              <option value="discovered">Descubiertas</option>
              <option value="rejected">Descartadas</option>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            Búsqueda de origen
            <Select
              value={searchRunId}
              onChange={(event) =>
                updateParams({ search_run_id: event.target.value })
              }
              className="h-9 py-1"
              disabled={searchRunsQuery.isError}
            >
              <option value="">Todas las búsquedas</option>
              {(searchRunsQuery.data ?? []).map((run) => (
                <option key={run.id} value={run.id}>
                  #{run.id} · {run.province_name ?? run.province_code} ·{" "}
                  {formatDateTime(run.started_at ?? run.created_at)}
                </option>
              ))}
            </Select>
          </label>
        </CardContent>
      </Card>

      {searchRunId ? (
        <Alert variant="info" className="mb-4">
          Mostrando empresas de la búsqueda #{searchRunId}.{" "}
          <button
            type="button"
            onClick={() => updateParams({ search_run_id: "" })}
            className="font-semibold underline"
          >
            Quitar filtro
          </button>
        </Alert>
      ) : null}

      {discoveryStatus ? (
        <Alert variant="info" className="mb-4">
          Mostrando empresas con estado{" "}
          <strong>{companyStatusLabel(discoveryStatus)}</strong>.{" "}
          <button
            type="button"
            onClick={() => updateParams({ discovery_status: "" })}
            className="font-semibold underline"
          >
            Quitar filtro
          </button>
        </Alert>
      ) : null}

      {exportMutation.isError ? (
        <Alert variant="danger" title="No se pudo exportar el CSV" className="mb-4">
          {getErrorMessage(exportMutation.error)}
        </Alert>
      ) : null}

      {updateCompanyMutation.isError ? (
        <Alert variant="danger" title="No se pudo cambiar el estado" className="mb-4">
          {getErrorMessage(updateCompanyMutation.error)}
        </Alert>
      ) : null}

      {companiesQuery.isPending ? (
        <LoadingBlock label="Cargando empresas…" />
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
            discoveryStatus === "possible_duplicate" && !searchRunId && !query
              ? "No hay posibles duplicados pendientes"
              : hasFilters
                ? "Ninguna empresa coincide con los filtros"
                : "Todavía no hay empresas descubiertas"
          }
          description={
            hasFilters
              ? "Probá con otra provincia, otro rubro o sin filtros. Los datos salen de la base, no hay resultados de ejemplo."
              : "Ejecutá una búsqueda por provincia y rubro, importá un CSV o cargá una empresa manualmente. Esta lista muestra solo lo que existe en la base."
          }
          action={
            hasFilters ? (
              <Button variant="secondary" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  href="/search"
                  className={buttonStyles({ variant: "primary", size: "sm" })}
                >
                  Buscar empresas
                </Link>
                <Link
                  href="/imports"
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Importar CSV
                </Link>
                <Link
                  href="/prospects/new"
                  className={buttonStyles({ variant: "secondary", size: "sm" })}
                >
                  Agregar empresa
                </Link>
              </div>
            )
          }
        />
      ) : (
        <>
          <ProspectsTable
            companies={companies}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
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
                  updateParams({ offset: String(Math.max(offset - PAGE_SIZE, 0)) })
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
    </>
  );
}
