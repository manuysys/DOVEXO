"use client";

import { ArrowDownWideNarrow, ArrowUpNarrowWide, LayoutGrid, List, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OPERATIONAL_STATUS_LABELS, PRIORITY_LABELS } from "@/lib/order-status";
import type { Technician } from "@/lib/api";
import { cn } from "@/lib/utils";

import {
  UNASSIGNED_TECHNICIAN,
  type OrderFilters,
  type OrderSortKey,
  type OrdersView,
  type SortDirection,
} from "./order-list-utils";
import { ORDER_STATUS_SEQUENCE } from "./order-meta";

const selectClass =
  "min-h-10 rounded-ds-md border border-border bg-surface px-2.5 text-small text-text outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

const sortLabels: Array<{ value: OrderSortKey; label: string }> = [
  { value: "updated", label: "Última actualización" },
  { value: "scheduled", label: "Fecha programada" },
  { value: "priority", label: "Prioridad" },
  { value: "status", label: "Estado" },
  { value: "code", label: "Código" },
  { value: "customer", label: "Cliente" },
  { value: "title", label: "Servicio" },
  { value: "technician", label: "Técnico" },
];

type OrdersToolbarProps = {
  filters: OrderFilters;
  onFiltersChange: (patch: Partial<OrderFilters>) => void;
  sort: OrderSortKey;
  direction: SortDirection;
  onSortChange: (sort: OrderSortKey) => void;
  view: OrdersView;
  onViewChange: (view: OrdersView) => void;
  technicians: Technician[];
  showTechnicianFilter: boolean;
  resultCount: number;
  totalCount: number;
  activeFilterCount: number;
  onClearFilters: () => void;
};

export function OrdersToolbar({
  filters,
  onFiltersChange,
  sort,
  direction,
  onSortChange,
  view,
  onViewChange,
  technicians,
  showTechnicianFilter,
  resultCount,
  totalCount,
  activeFilterCount,
  onClearFilters,
}: OrdersToolbarProps) {
  const directionLabel =
    direction === "asc" ? "Orden ascendente. Cambiar a descendente" : "Orden descendente. Cambiar a ascendente";

  return (
    <div className="border-border bg-surface rounded-ds-lg border p-3 shadow-card">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <label htmlFor="orders-search" className="sr-only">
            Buscar órdenes
          </label>
          <Search
            aria-hidden="true"
            className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
          />
          <Input
            id="orders-search"
            type="search"
            value={filters.search}
            onChange={(event) => onFiltersChange({ search: event.target.value })}
            placeholder="Buscar por código, servicio, cliente o técnico"
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

        <div
          role="group"
          aria-label="Vista de órdenes"
          className="border-border bg-surface-2 flex w-fit items-center gap-0.5 rounded-ds-md border p-0.5"
        >
          <button
            type="button"
            onClick={() => onViewChange("board")}
            aria-pressed={view === "board"}
            aria-label="Vista de tablero"
            className={cn(
              "focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-ds-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              view === "board"
                ? "bg-surface text-text shadow-card"
                : "text-text-2 hover:text-text",
            )}
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("table")}
            aria-pressed={view === "table"}
            aria-label="Vista de tabla"
            className={cn(
              "focus-visible:ring-primary flex h-9 w-9 items-center justify-center rounded-ds-sm transition-colors focus-visible:ring-2 focus-visible:outline-none",
              view === "table"
                ? "bg-surface text-text shadow-card"
                : "text-text-2 hover:text-text",
            )}
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <div>
          <label htmlFor="orders-status" className="sr-only">
            Filtrar por estado
          </label>
          <select
            id="orders-status"
            className={selectClass}
            value={filters.status}
            onChange={(event) => onFiltersChange({ status: event.target.value })}
          >
            <option value="">Todos los estados</option>
            {ORDER_STATUS_SEQUENCE.map((status) => (
              <option key={status} value={status}>
                {OPERATIONAL_STATUS_LABELS[status] ?? status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="orders-priority" className="sr-only">
            Filtrar por prioridad
          </label>
          <select
            id="orders-priority"
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

        {showTechnicianFilter && (
          <div>
            <label htmlFor="orders-technician" className="sr-only">
              Filtrar por técnico
            </label>
            <select
              id="orders-technician"
              className={selectClass}
              value={filters.technicianId}
              onChange={(event) => onFiltersChange({ technicianId: event.target.value })}
            >
              <option value="">Todos los técnicos</option>
              <option value={UNASSIGNED_TECHNICIAN}>Sin asignar</option>
              {technicians.map((technician) => (
                <option key={technician.id} value={technician.id}>
                  {technician.full_name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          <div>
            <label htmlFor="orders-sort" className="sr-only">
              Ordenar por
            </label>
            <select
              id="orders-sort"
              className={selectClass}
              value={sort}
              onChange={(event) => onSortChange(event.target.value as OrderSortKey)}
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
          ? `${totalCount} ${totalCount === 1 ? "orden" : "órdenes"}`
          : `${resultCount} de ${totalCount} ${totalCount === 1 ? "orden" : "órdenes"} con los filtros actuales`}
      </p>    </div>
  );
}
