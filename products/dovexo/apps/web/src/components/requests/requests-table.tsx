"use client";

import { ArrowRight, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { ServiceRequest } from "@/lib/api";

import { RequestPriorityBadge, RequestSourceLabel, RequestStatusBadge } from "./request-badges";
import type { PageSlice, RequestSortKey, SortDirection } from "./request-list-utils";

const PAGE_SIZES = [10, 25, 50];

type SortHeaderProps = {
  label: string;
  sortKey: RequestSortKey;
  activeSort: RequestSortKey;
  direction: SortDirection;
  onSortChange: (sortKey: RequestSortKey) => void;
  className?: string;
};

function SortHeader({ label, sortKey, activeSort, direction, onSortChange, className }: SortHeaderProps) {
  const active = activeSort === sortKey;
  const Icon = active ? (direction === "asc" ? ChevronUp : ChevronDown) : ChevronsUpDown;

  return (
    <th
      scope="col"
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      className={cn("text-text px-3 py-2.5 text-left align-bottom font-semibold", className)}
    >
      <button
        type="button"
        onClick={() => onSortChange(sortKey)}
        className="focus-visible:ring-primary focus-visible:ring-offset-surface-2 text-label inline-flex items-center gap-1 rounded-sm hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
      >
        {label}
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-text-2")}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}

type RequestsTableProps = {
  page: PageSlice<ServiceRequest>;
  total: number;
  pageSize: number;
  customerName: (customerId: string) => string;
  sort: RequestSortKey;
  direction: SortDirection;
  onSortChange: (sortKey: RequestSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  canConvert: boolean;
  onConvert: (requestId: string) => void;
  convertingId: string | null;
};

export function RequestsTable({
  page,
  total,
  pageSize,
  customerName,
  sort,
  direction,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  canConvert,
  onConvert,
  convertingId,
}: RequestsTableProps) {
  function convertButton(request: ServiceRequest, size: "sm" = "sm") {
    if (request.status === "converted") {
      return <Badge variant="success">Convertida</Badge>;
    }
    if (!canConvert) {
      return <span className="text-text-2 text-caption">Solo lectura</span>;
    }
    return (
      <Button
        size={size}
        variant="outline"
        onClick={() => onConvert(request.id)}
        disabled={convertingId !== null}
        aria-label={`Convertir la solicitud ${request.title} en orden de trabajo`}
      >
        {convertingId === request.id ? "Convirtiendo..." : "Convertir en orden"}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <section aria-label="Solicitudes de servicio" className="space-y-3">
      <div className="border-border bg-surface rounded-ds-lg hidden overflow-x-auto border shadow-card xl:block">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <caption className="sr-only">
            Solicitudes con motivo, cliente, prioridad, origen, estado y fecha
          </caption>
          <thead className="bg-surface-2 border-border border-b">
            <tr>
              <SortHeader
                label="Solicitud"
                sortKey="title"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
                className="pl-4"
              />
              <SortHeader
                label="Cliente"
                sortKey="customer"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Prioridad"
                sortKey="priority"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Origen"
                sortKey="source"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Estado"
                sortKey="status"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Fecha"
                sortKey="created"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <th scope="col" className="text-text px-3 py-2.5 pr-4 text-right align-bottom font-semibold">
                <span className="text-label">Acción</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {page.items.map((request) => (
              <tr key={request.id} className="hover:bg-surface-2/60 transition-colors">
                <th scope="row" className="max-w-md px-3 py-3 pl-4 text-left align-top font-normal">
                  <p className="text-text text-small font-semibold">{request.title}</p>
                  {request.description && (
                    <p className="text-text-2 mt-0.5 line-clamp-2 text-caption">{request.description}</p>
                  )}
                </th>
                <td className="text-text px-3 py-3 align-top text-small">
                  {customerName(request.customer_id) || "Sin cliente"}
                </td>
                <td className="px-3 py-3 align-top">
                  <RequestPriorityBadge priority={request.priority} />
                </td>
                <td className="text-text px-3 py-3 align-top text-small">
                  <RequestSourceLabel source={request.source} />
                </td>
                <td className="px-3 py-3 align-top">
                  <RequestStatusBadge status={request.status} />
                </td>
                <td className="text-text px-3 py-3 align-top text-small whitespace-nowrap">
                  <time dateTime={request.created_at}>{formatDate(request.created_at)}</time>
                </td>
                <td className="px-3 py-3 pr-4 text-right align-top">
                  <div className="flex justify-end">{convertButton(request)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-2 xl:hidden">
        {page.items.map((request) => (
          <li
            key={request.id}
            className="border-border bg-surface rounded-ds-lg border p-4 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-text text-small font-semibold">{request.title}</p>
              <RequestStatusBadge status={request.status} />
            </div>
            {request.description && (
              <p className="text-text-2 mt-1 line-clamp-3 text-caption">{request.description}</p>
            )}
            <dl className="text-caption mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
              <div>
                <dt className="text-text-2">Cliente</dt>
                <dd className="text-text mt-0.5">{customerName(request.customer_id) || "Sin cliente"}</dd>
              </div>
              <div>
                <dt className="text-text-2">Prioridad</dt>
                <dd className="mt-0.5">
                  <RequestPriorityBadge priority={request.priority} />
                </dd>
              </div>
              <div>
                <dt className="text-text-2">Origen</dt>
                <dd className="text-text mt-0.5">
                  <RequestSourceLabel source={request.source} />
                </dd>
              </div>
              <div>
                <dt className="text-text-2">Fecha</dt>
                <dd className="text-text mt-0.5">{formatDate(request.created_at)}</dd>
              </div>
            </dl>
            <div className="mt-3 flex justify-end">{convertButton(request)}</div>
          </li>
        ))}
      </ul>

      <div className="border-border bg-surface rounded-ds-lg flex flex-col gap-3 border p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-2 text-caption" role="status" aria-live="polite">
          {page.from === 0
            ? "Sin resultados en esta página"
            : `Mostrando ${page.from}–${page.to} de ${total} ${
                total === 1 ? "solicitud" : "solicitudes"
              }`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="requests-page-size" className="text-text-2 text-caption">
            Por página
          </label>
          <select
            id="requests-page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="border-border bg-surface text-text focus:border-primary focus:ring-primary/20 min-h-9 rounded-ds-md border px-2 text-small focus:ring-2 focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page.page - 1)}
            disabled={page.page <= 1}
            aria-label="Página anterior"
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <span className="text-text numeric text-caption whitespace-nowrap">
            Página {page.page} de {page.pageCount}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page.page + 1)}
            disabled={page.page >= page.pageCount}
            aria-label="Página siguiente"
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}
