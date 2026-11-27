"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/order-status";

import {
  REQUEST_SOURCE_LABELS,
  REQUEST_SOURCE_SEQUENCE,
  REQUEST_STATUS_SEQUENCE,
  type RequestFilters,
  type RequestSortKey,
  type SortDirection,
} from "./request-list-utils";

const selectClass =
  "min-h-10 rounded-ds-md border border-border bg-surface px-2.5 text-small text-text outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

const sortLabels: Array<{ value: RequestSortKey; label: string }> = [
  { value: "created", label: "Fecha de ingreso" },
  { value: "priority", label: "Prioridad" },
  { value: "status", label: "Estado" },
  { value: "title", label: "Motivo" },
  { value: "customer", label: "Cliente" },
  { value: "source", label: "Origen" },
];

type RequestsToolbarProps = {
  filters: RequestFilters;
  onFiltersChange: (patch: Partial<RequestFilters>) => void;
  sort: RequestSortKey;
  direction: SortDirection;
  onSortChange: (sort: RequestSortKey) => void;
  resultCount: number;
  totalCount: number;
  activeFilterCount: number;
  onClearFilters: () => void;
};

export function RequestsToolbar({
  filters,
  onFiltersChange,
  sort,
  direction,
  onSortChange,
  resultCount,
  totalCount,
  activeFilterCount,
  onClearFilters,
}: RequestsToolbarProps) {
  const directionLabel =
    direction === "asc" ? "Orden ascendente. Cambiar a descendente" : "Orden descendente. Cambiar a ascendente";

  return (
    <div className="border-border bg-surface rounded-ds-lg border p-3 shadow-card">
      <div className="relative min-w-0">
        <label htmlFor="requests-search" className="sr-only">
          Buscar solicitudes
        </label>
        <Search
          aria-hidden="true"
          className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
        />
        <Input
          id="requests-search"
          type="search"
          value={filters.search}
          onChange={(event) => onFiltersChange({ search: event.target.value })}
          placeholder="Buscar por motivo, cliente u origen"
          className="pr-10 pl-9"
          autoComplete="off"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onFiltersChange({ search: "" })}
            aria-label="Limpiar búsqueda"
            className="text-text-2 hover:bg-surface-2 hover:text-text focus-visible:ring-primary absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div>
          <label htmlFor="requests-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="requests-status"
            className={selectClass}
            value={filters.status}
            onChange={(event) => onFiltersChange({ status: event.target.value })}
          >
            <option value="">Todos los estados</option>
            {REQUEST_STATUS_SEQUENCE.map((status) => (
              <option key={status} value={status}>
                {REQUEST_STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="requests-priority" className="sr-only">
            Filtrar por prioridad
          </label>
          <select
            id="requests-priority"
            className={selectClass}
            value={filters.priority}
            onChange={(event) => onFiltersChange({ priority: event.target.value })}
          >
            <option value="">Todas las prioridades</option>
            {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="requests-source" className="sr-only">
            Filtrar por origen
          </label>
          <select
            id="requests-source"
            className={selectClass}
            value={filters.source}
            onChange={(event) => onFiltersChange({ source: event.target.value })}
          >
            <option value="">Todos los orígenes</option>
            {REQUEST_SOURCE_SEQUENCE.map((source) => (
              <option key={source} value={source}>
                {REQUEST_SOURCE_LABELS[source] ?? source}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <div>
            <label htmlFor="requests-sort" className="sr-only">
              Ordenar por
            </label>
            <select
              id="requests-sort"
              className={selectClass}
              value={sort}
              onChange={(event) => onSortChange(event.target.value as RequestSortKey)}
            >
              {sortLabels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onSortChange(sort)}
            aria-label={directionLabel}
            className="h-10 w-10 shrink-0"
          >
            {direction === "asc" ? (
              <ArrowUpNarrowWide className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowDownWideNarrow className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>

        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-text-2">
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Limpiar filtros ({activeFilterCount})
          </Button>
        )}
      </div>

      <p role="status" aria-live="polite" className="text-text-2 text-caption mt-2">
        {resultCount === totalCount
          ? `${totalCount} ${totalCount === 1 ? "solicitud" : "solicitudes"}`
          : `${resultCount} de ${totalCount} ${
              totalCount === 1 ? "solicitud" : "solicitudes"
            } con los filtros actuales`}
      </p>
    </div>
  );
}
