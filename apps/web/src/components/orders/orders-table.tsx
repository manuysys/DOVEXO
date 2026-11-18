"use client";

import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { WorkOrder } from "@/lib/api";

import { OrderPriorityBadge, OrderStatusBadge } from "./order-badges";
import type { OrderSortKey, PageSlice, SortDirection } from "./order-list-utils";
import { formatRelativeTime } from "./order-meta";

type SortHeaderProps = {
  label: string;
  sortKey: OrderSortKey;
  activeSort: OrderSortKey;
  direction: SortDirection;
  onSortChange: (sort: OrderSortKey) => void;
  className?: string;
};

function SortHeader({
  label,
  sortKey,
  activeSort,
  direction,
  onSortChange,
  className,
}: SortHeaderProps) {
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
        className="focus-visible:ring-primary focus-visible:ring-offset-surface-2 inline-flex items-center gap-1 rounded-sm text-label hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
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

type OrdersTableProps = {
  page: PageSlice<WorkOrder>;
  total: number;
  pageSize: number;
  customerName: (customerId: string) => string;
  technicianName: (userId: string | null) => string;
  sort: OrderSortKey;
  direction: SortDirection;
  onSortChange: (sort: OrderSortKey) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

const PAGE_SIZES = [10, 25, 50];

export function OrdersTable({
  page,
  total,
  pageSize,
  customerName,
  technicianName,
  sort,
  direction,
  onSortChange,
  onPageChange,
  onPageSizeChange,
}: OrdersTableProps) {
  return (
    <section aria-label="Órdenes de trabajo" className="space-y-3">
      {/* Tabla: escritorio ancho */}
      <div className="border-border bg-surface rounded-ds-lg hidden overflow-x-auto border shadow-card xl:block">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <caption className="sr-only">
            Órdenes de trabajo con código, cliente, servicio, estado, prioridad, técnico y fechas
          </caption>
          <thead className="bg-surface-2 border-border border-b">
            <tr>
              <SortHeader
                label="Orden"
                sortKey="code"
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
                label="Servicio"
                sortKey="title"
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
                label="Prioridad"
                sortKey="priority"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Técnico"
                sortKey="technician"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Fecha"
                sortKey="scheduled"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
              />
              <SortHeader
                label="Actualización"
                sortKey="updated"
                activeSort={sort}
                direction={direction}
                onSortChange={onSortChange}
                className="pr-4"
              />
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {page.items.map((order) => (
              <tr
                key={order.id}
                className="hover:bg-surface-2/60 focus-within:bg-surface-2/60 transition-colors"
              >
                <th scope="row" className="text-text-2 numeric px-3 py-3 pl-4 text-left align-top font-mono text-caption font-normal">
                  {order.code}
                </th>
                <td className="text-text px-3 py-3 align-top text-small">
                  {customerName(order.customer_id) || "Sin cliente"}
                </td>
                <td className="px-3 py-3 align-top">
                  <Link
                    href={`/orders/${order.id}`}
                    aria-label={`Abrir orden ${order.code}: ${order.title}`}
                    className="text-text focus-visible:ring-primary focus-visible:ring-offset-surface rounded-sm text-small font-medium hover:text-primary hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    {order.title}
                  </Link>
                </td>
                <td className="px-3 py-3 align-top">
                  <OrderStatusBadge status={order.operational_status} />
                </td>
                <td className="px-3 py-3 align-top">
                  <OrderPriorityBadge priority={order.priority} withDot />
                </td>
                <td className="text-text px-3 py-3 align-top text-small">
                  {technicianName(order.assigned_user_id) || "Sin asignar"}
                </td>
                <td className="text-text px-3 py-3 align-top text-small whitespace-nowrap">
                  {order.scheduled_at ? (
                    <time dateTime={order.scheduled_at}>{formatDate(order.scheduled_at)}</time>
                  ) : (
                    <span className="text-text-2">Sin programar</span>
                  )}
                </td>
                <td className="text-text-2 px-3 py-3 pr-4 align-top text-caption whitespace-nowrap">
                  <time dateTime={order.updated_at} title={formatDate(order.updated_at)}>
                    {formatRelativeTime(order.updated_at)}
                  </time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tarjetas: móvil y tablet */}
      <ul className="space-y-2 xl:hidden">
        {page.items.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="border-border bg-surface rounded-ds-lg focus-visible:ring-primary focus-visible:ring-offset-bg block border p-4 shadow-card transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-text-2 numeric font-mono text-caption">{order.code}</span>
                <OrderStatusBadge status={order.operational_status} />
              </div>
              <p className="text-text mt-1 text-small font-semibold">{order.title}</p>
              <p className="text-text-2 mt-0.5 text-small">
                {customerName(order.customer_id) || "Sin cliente"}
              </p>
              <dl className="text-caption mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <dt className="text-text-2">Prioridad</dt>
                  <dd className="mt-0.5">
                    <OrderPriorityBadge priority={order.priority} withDot />
                  </dd>
                </div>
                <div>
                  <dt className="text-text-2">Técnico</dt>
                  <dd className="text-text mt-0.5">
                    {technicianName(order.assigned_user_id) || "Sin asignar"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-2">Fecha</dt>
                  <dd className="text-text mt-0.5">
                    {order.scheduled_at ? formatDate(order.scheduled_at) : "Sin programar"}
                  </dd>
                </div>
                <div>
                  <dt className="text-text-2">Actualización</dt>
                  <dd className="text-text mt-0.5">
                    <time dateTime={order.updated_at} title={formatDate(order.updated_at)}>
                      {formatRelativeTime(order.updated_at)}
                    </time>
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-border bg-surface rounded-ds-lg flex flex-col gap-3 border p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <p className="text-text-2 text-caption" role="status" aria-live="polite">
          {page.from === 0
            ? "Sin resultados en esta página"
            : `Mostrando ${page.from}–${page.to} de ${total} ${total === 1 ? "orden" : "órdenes"}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="orders-page-size" className="text-text-2 text-caption">
            Por página
          </label>
          <select
            id="orders-page-size"
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
