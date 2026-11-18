"use client";

import { Archive, ArrowUpRight, Mail, Pencil, Phone } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";

import type { CustomerInsight } from "./customer-insights";
import { customerAddress, customerInitials, customerPhoneHref } from "./customer-labels";
import type { CustomerRecord } from "./customer-labels";
import { CustomerStatusBadge } from "./customer-status-badge";

export type CustomerListRow = {
  customer: CustomerRecord;
  insight: CustomerInsight;
};

type CustomerTableProps = {
  rows: CustomerListRow[];
  canManage: boolean;
  showQuoteInsights: boolean;
  onEdit: (customer: CustomerRecord) => void;
  onArchive: (customer: CustomerRecord) => void;
};

const iconButtonClass =
  "text-text-2 hover:bg-surface-2 hover:text-text focus-visible:ring-primary inline-flex h-10 w-10 items-center justify-center rounded-ds-md transition-colors focus-visible:ring-2 focus-visible:outline-none";

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md text-xs font-bold"
    >
      {customerInitials(name)}
    </span>
  );
}

function InsightTags({
  insight,
  showQuoteInsights,
}: {
  insight: CustomerInsight;
  showQuoteInsights: boolean;
}) {
  return (
    <>
      {insight.openOrders > 0 && (
        <Badge variant="info" className="text-[11px]">
          {insight.openOrders} orden{insight.openOrders === 1 ? "" : "es"} abierta
          {insight.openOrders === 1 ? "" : "s"}
        </Badge>
      )}
      {showQuoteInsights && insight.pendingQuotes > 0 && (
        <Badge variant="warning" className="text-[11px]">
          {insight.pendingQuotes} presupuesto{insight.pendingQuotes === 1 ? "" : "s"} pendiente
          {insight.pendingQuotes === 1 ? "" : "s"}
        </Badge>
      )}
    </>
  );
}

function ContactLines({ customer }: { customer: CustomerRecord }) {
  if (!customer.phone && !customer.email) {
    return <span className="text-text-2 text-xs">Sin contacto</span>;
  }
  return (
    <div className="space-y-1 text-xs">
      {customer.phone && (
        <a
          href={customerPhoneHref(customer.phone)}
          className="text-text-2 hover:text-text flex items-center gap-1.5"
        >
          <Phone className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{customer.phone}</span>
        </a>
      )}
      {customer.email && (
        <a
          href={`mailto:${customer.email}`}
          className="text-text-2 hover:text-text flex items-center gap-1.5"
        >
          <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{customer.email}</span>
        </a>
      )}
    </div>
  );
}

function RowActions({
  customer,
  canManage,
  onEdit,
  onArchive,
}: {
  customer: CustomerRecord;
  canManage: boolean;
  onEdit: (customer: CustomerRecord) => void;
  onArchive: (customer: CustomerRecord) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/customers/${customer.id}`}
        className={iconButtonClass}
        aria-label={`Ver ficha de ${customer.name}`}
        title="Ver ficha"
      >
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {canManage && (
        <>
          <button
            type="button"
            className={iconButtonClass}
            onClick={() => onEdit(customer)}
            aria-label={`Editar ${customer.name}`}
            title="Editar"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={cn(iconButtonClass, "hover:bg-danger-soft hover:text-danger-strong")}
            onClick={() => onArchive(customer)}
            aria-label={`Archivar ${customer.name}`}
            title="Archivar"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

export function CustomerTable({
  rows,
  canManage,
  showQuoteInsights,
  onEdit,
  onArchive,
}: CustomerTableProps) {
  return (
    <>
      {/* Escritorio y tablet: tabla sin scroll horizontal */}
      <div className="hidden md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Clientes de la empresa</caption>
          <thead className="bg-surface-2 text-text-2 text-label">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Cliente
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Contacto
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Estado
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Última actividad
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {rows.map(({ customer, insight }) => {
              const address = customerAddress(customer);
              return (
                <tr key={customer.id} className="hover:bg-surface-2/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={customer.name} />
                      <div className="min-w-0">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="text-text hover:text-primary font-semibold underline-offset-4 hover:underline"
                        >
                          {customer.name}
                        </Link>
                        <p className="text-text-2 mt-0.5 max-w-[22rem] truncate text-xs">
                          {address ?? "Sin dirección"}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <InsightTags insight={insight} showQuoteInsights={showQuoteInsights} />
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ContactLines customer={customer} />
                  </td>
                  <td className="px-4 py-3">
                    <CustomerStatusBadge status={customer.status} />
                  </td>
                  <td className="text-text-2 px-4 py-3 text-xs whitespace-nowrap">
                    <time dateTime={insight.lastActivityAt}>
                      {formatDate(insight.lastActivityAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3">
                    <RowActions
                      customer={customer}
                      canManage={canManage}
                      onEdit={onEdit}
                      onArchive={onArchive}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: tarjetas, sin scroll horizontal */}
      <ul className="divide-border divide-y md:hidden">
        {rows.map(({ customer, insight }) => {
          const address = customerAddress(customer);
          return (
            <li key={customer.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={customer.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/customers/${customer.id}`}
                      className="text-text hover:text-primary text-sm font-semibold underline-offset-4 hover:underline"
                    >
                      {customer.name}
                    </Link>
                    <CustomerStatusBadge status={customer.status} />
                  </div>
                  <p className="text-text-2 mt-0.5 text-xs">{address ?? "Sin dirección"}</p>
                  <div className="mt-2">
                    <ContactLines customer={customer} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <InsightTags insight={insight} showQuoteInsights={showQuoteInsights} />
                  </div>
                  <p className="text-text-2 mt-2 text-[11px]">
                    Última actividad:{" "}
                    <time dateTime={insight.lastActivityAt}>
                      {formatDate(insight.lastActivityAt)}
                    </time>
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  href={`/customers/${customer.id}`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-10")}
                >
                  Ver ficha
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                {canManage && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className={iconButtonClass}
                      onClick={() => onEdit(customer)}
                      aria-label={`Editar ${customer.name}`}
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        iconButtonClass,
                        "hover:bg-danger-soft hover:text-danger-strong",
                      )}
                      onClick={() => onArchive(customer)}
                      aria-label={`Archivar ${customer.name}`}
                    >
                      <Archive className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
