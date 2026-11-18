"use client";

import { Archive, KeyRound, Mail, MapPin, Pencil, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatDateOnly } from "@/lib/utils";

import {
  customerAddress,
  customerInitials,
  customerPhoneHref,
  type CustomerRecord,
} from "./customer-labels";
import { CustomerStatusBadge } from "./customer-status-badge";

type CustomerDetailHeaderProps = {
  customer: CustomerRecord;
  canManage: boolean;
  lastActivityAt: string;
  onEdit: () => void;
  onArchive: () => void;
  onOpenPortal: () => void;
};

export function CustomerDetailHeader({
  customer,
  canManage,
  lastActivityAt,
  onEdit,
  onArchive,
  onOpenPortal,
}: CustomerDetailHeaderProps) {
  const address = customerAddress(customer);

  return (
    <header className="border-border bg-surface rounded-ds-xl border p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <span
            aria-hidden="true"
            className="bg-primary/10 text-primary flex h-14 w-14 shrink-0 items-center justify-center rounded-ds-lg text-lg font-bold"
          >
            {customerInitials(customer.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h3 text-text min-w-0 break-words">{customer.name}</h1>
              <CustomerStatusBadge status={customer.status} />
            </div>
            <p className="text-text-2 mt-1 text-sm">
              Cliente desde el {formatDateOnly(customer.created_at)}
            </p>

            <dl className="text-text-2 mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Teléfono</dt>
                <dd className="min-w-0">
                  {customer.phone ? (
                    <a
                      href={customerPhoneHref(customer.phone)}
                      className="text-text hover:text-primary underline-offset-4 hover:underline"
                    >
                      {customer.phone}
                    </a>
                  ) : (
                    <span className="text-text-2">Sin teléfono</span>
                  )}
                </dd>
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Email</dt>
                <dd className="min-w-0 break-all">
                  {customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-text hover:text-primary underline-offset-4 hover:underline"
                    >
                      {customer.email}
                    </a>
                  ) : (
                    <span className="text-text-2">Sin email</span>
                  )}
                </dd>
              </div>
              <div className="flex w-full min-w-0 items-start gap-2 sm:w-auto">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <dt className="sr-only">Dirección</dt>
                <dd className="min-w-0 break-words">
                  {address ?? <span className="text-text-2">Sin dirección</span>}
                </dd>
              </div>
            </dl>

            <p className="text-text-2 mt-3 text-xs">
              Última actividad:{" "}
              <time dateTime={lastActivityAt}>{formatDate(lastActivityAt)}</time>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0">
          {canManage ? (
            <>
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </Button>
              <Button variant="outline" onClick={onOpenPortal}>
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Acceso al portal
              </Button>
              <Button
                variant="ghost"
                className="text-danger-strong hover:bg-danger-soft"
                onClick={onArchive}
              >
                <Archive className="h-4 w-4" aria-hidden="true" />
                Archivar
              </Button>
            </>
          ) : (
            <p className="text-text-2 text-xs">
              Solo lectura: tu rol no puede editar ni archivar clientes.
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
