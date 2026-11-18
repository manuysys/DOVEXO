"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  FileText,
  Inbox,
  Loader2,
  RotateCcw,
  Save,
  Wallet,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Payment, QuoteSummary, ServiceRequest, WorkOrder } from "@/lib/api";
import { api } from "@/lib/api";
import { userFacingError } from "@/lib/errors";
import { OPERATIONAL_STATUS_LABELS, PRIORITY_LABELS, REQUEST_STATUS_LABELS } from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment-status";
import { QUOTE_STATUS_LABELS } from "@/lib/quote-status";
import { formatCurrency, formatDate, formatDateOnly } from "@/lib/utils";

import type { CustomerRecord } from "./customer-labels";
import { CustomerInlineLoading, CustomerPermissionNotice } from "./customer-states";

type RelatedPanelProps<T> = {
  items: T[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  retrying?: boolean;
};

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info";

const REQUEST_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  new: "info",
  triaged: "warning",
  converted: "success",
  closed: "neutral",
};

const ORDER_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  new: "info",
  scheduled: "info",
  in_progress: "warning",
  waiting: "warning",
  finished: "success",
  cancelled: "danger",
};

const QUOTE_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  draft: "neutral",
  sent: "warning",
  approved: "success",
  rejected: "danger",
  expired: "neutral",
};

const PAYMENT_STATUS_VARIANTS: Record<string, BadgeVariant> = {
  registered: "success",
  voided: "danger",
};

function PanelLoading({ label }: { label: string }) {
  return <CustomerInlineLoading label={label} />;
}

function PanelError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying?: boolean;
}) {
  return (
    <div role="alert" className="bg-danger-soft/60 text-danger-strong rounded-ds-md px-4 py-3 text-sm">
      <p>{message}</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry} disabled={retrying}>
        {retrying ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        )}
        Reintentar
      </Button>
    </div>
  );
}

function PanelList({ children }: { children: ReactNode }) {
  return <ul className="divide-border divide-y">{children}</ul>;
}

function RowLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className="text-primary shrink-0 text-xs font-semibold hover:underline">
      {children}
    </Link>
  );
}

export function CustomerRequestsPanel({
  items,
  isLoading,
  isError,
  onRetry,
  retrying,
}: RelatedPanelProps<ServiceRequest>) {
  if (isLoading) return <PanelLoading label="Cargando solicitudes…" />;
  if (isError) {
    return (
      <PanelError
        message="No se pudieron cargar las solicitudes de este cliente."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="Sin solicitudes"
        description="Cuando se registre una solicitud para este cliente, aparece acá."
        action={
          <Link
            href="/requests"
            className="border-border bg-surface text-text hover:bg-surface-2 inline-flex min-h-9 items-center rounded-ds-md border px-3 text-xs font-semibold"
          >
            Ver solicitudes
          </Link>
        }
      />
    );
  }

  return (
    <PanelList>
      {items.map((request) => (
        <li
          key={request.id}
          className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <p className="text-text text-sm font-medium">{request.title}</p>
            <p className="text-text-2 mt-0.5 text-xs">
              {formatDate(request.requested_at)} · Prioridad{" "}
              {PRIORITY_LABELS[request.priority] ?? request.priority} · Origen {request.source}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={REQUEST_STATUS_VARIANTS[request.status] ?? "neutral"}>
              {REQUEST_STATUS_LABELS[request.status] ?? request.status}
            </Badge>
            <RowLink href="/requests">Ver</RowLink>
          </div>
        </li>
      ))}
    </PanelList>
  );
}

export function CustomerOrdersPanel({
  items,
  isLoading,
  isError,
  onRetry,
  retrying,
}: RelatedPanelProps<WorkOrder>) {
  if (isLoading) return <PanelLoading label="Cargando órdenes…" />;
  if (isError) {
    return (
      <PanelError
        message="No se pudieron cargar las órdenes de este cliente."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Sin órdenes"
        description="Cuando se cree una orden para este cliente, aparece acá con su estado."
        action={
          <Link
            href="/orders"
            className="border-border bg-surface text-text hover:bg-surface-2 inline-flex min-h-9 items-center rounded-ds-md border px-3 text-xs font-semibold"
          >
            Ver órdenes
          </Link>
        }
      />
    );
  }

  return (
    <PanelList>
      {items.map((order) => (
        <li
          key={order.id}
          className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <p className="text-text text-sm font-medium">
              <span className="text-text-2 font-mono text-xs">{order.code}</span> · {order.title}
            </p>
            <p className="text-text-2 mt-0.5 text-xs">
              {order.scheduled_at
                ? `Programada para ${formatDate(order.scheduled_at)}`
                : `Creada el ${formatDate(order.created_at)}`}
              {" · "}Prioridad {PRIORITY_LABELS[order.priority] ?? order.priority}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={ORDER_STATUS_VARIANTS[order.operational_status] ?? "neutral"}>
              {OPERATIONAL_STATUS_LABELS[order.operational_status] ?? order.operational_status}
            </Badge>
            <RowLink href={`/orders/${order.id}`}>Ver</RowLink>
          </div>
        </li>
      ))}
    </PanelList>
  );
}

export function CustomerQuotesPanel({
  items,
  isLoading,
  isError,
  onRetry,
  retrying,
  canView,
}: RelatedPanelProps<QuoteSummary> & { canView: boolean }) {
  if (!canView) {
    return (
      <CustomerPermissionNotice>
        Solo owner, administradores y coordinadores pueden ver presupuestos e importes.
      </CustomerPermissionNotice>
    );
  }
  if (isLoading) return <PanelLoading label="Cargando presupuestos…" />;
  if (isError) {
    return (
      <PanelError
        message="No se pudieron cargar los presupuestos de este cliente."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Sin presupuestos"
        description="Los presupuestos enviados y aprobados de este cliente aparecen acá."
        action={
          <Link
            href="/quotes"
            className="border-border bg-surface text-text hover:bg-surface-2 inline-flex min-h-9 items-center rounded-ds-md border px-3 text-xs font-semibold"
          >
            Ver presupuestos
          </Link>
        }
      />
    );
  }

  return (
    <PanelList>
      {items.map((quote) => (
        <li
          key={quote.id}
          className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <p className="text-text text-sm font-medium">
              <span className="text-text-2 font-mono text-xs">{quote.number}</span> ·{" "}
              <span className="numeric">{formatCurrency(quote.total)}</span>
            </p>
            <p className="text-text-2 mt-0.5 text-xs">
              {quote.sent_at ? `Enviado el ${formatDate(quote.sent_at)}` : "Sin enviar"}
              {quote.valid_until
                ? ` · Válido hasta ${formatDateOnly(quote.valid_until)}`
                : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant={QUOTE_STATUS_VARIANTS[quote.status] ?? "neutral"}>
              {QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
            </Badge>
            <RowLink href={`/quotes/${quote.id}`}>Ver</RowLink>
          </div>
        </li>
      ))}
    </PanelList>
  );
}

export function CustomerPaymentsPanel({
  items,
  orders,
  isLoading,
  isError,
  onRetry,
  retrying,
  canView,
}: RelatedPanelProps<Payment> & { orders: WorkOrder[]; canView: boolean }) {
  if (!canView) {
    return (
      <CustomerPermissionNotice>
        Solo owner, administradores y coordinadores pueden ver pagos e importes.
      </CustomerPermissionNotice>
    );
  }
  if (isLoading) return <PanelLoading label="Cargando pagos…" />;
  if (isError) {
    return (
      <PanelError
        message="No se pudieron cargar los pagos de este cliente."
        onRetry={onRetry}
        retrying={retrying}
      />
    );
  }
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="Sin pagos registrados"
        description="Cuando se registre un pago de una orden de este cliente, aparece acá."
        action={
          <Link
            href="/payments"
            className="border-border bg-surface text-text hover:bg-surface-2 inline-flex min-h-9 items-center rounded-ds-md border px-3 text-xs font-semibold"
          >
            Ver pagos
          </Link>
        }
      />
    );
  }

  return (
    <PanelList>
      {items.map((payment) => {
        const order = orders.find((candidate) => candidate.id === payment.work_order_id);
        return (
          <li
            key={payment.id}
            className="flex flex-col gap-1.5 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0">
              <p className="text-text numeric text-sm font-medium">
                {formatCurrency(payment.amount)}
                <span className="text-text-2 ml-2 text-xs font-normal">
                  {paymentMethodLabel(payment.method)}
                </span>
              </p>
              <p className="text-text-2 mt-0.5 text-xs">
                {formatDate(payment.paid_at)}
                {order ? ` · Orden ${order.code}` : ""}
                {payment.reference ? ` · Ref. ${payment.reference}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={PAYMENT_STATUS_VARIANTS[payment.status] ?? "neutral"}>
                {paymentStatusLabel(payment.status)}
              </Badge>
              <RowLink href="/payments">Ver</RowLink>
            </div>
          </li>
        );
      })}
    </PanelList>
  );
}

/** No existe todavía un modelo de equipos en el backend: se informa sin inventar datos. */
export function CustomerEquipmentPanel() {
  return (
    <EmptyState
      icon={Wrench}
      title="Todavía no hay equipos registrados"
      description="El registro de equipos por cliente (marca, modelo y número de serie) todavía no está disponible en esta versión. Mientras tanto, podés anotarlos en la pestaña Notas."
    />
  );
}

type CustomerNotesPanelProps = {
  tenantId: string;
  customer: CustomerRecord;
  canManage: boolean;
};

export function CustomerNotesPanel({ tenantId, customer, canManage }: CustomerNotesPanelProps) {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(customer.notes ?? "");

  const mutation = useMutation({
    mutationFn: (notes: string) => api.customers.update(tenantId, customer.id, { notes }),
    onSuccess: () => {
      toast.success("Notas guardadas");
      void queryClient.invalidateQueries({ queryKey: ["customer", tenantId, customer.id] });
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => toast.error(userFacingError(error, "No se pudieron guardar las notas")),
  });

  const saved = customer.notes ?? "";
  const dirty = value !== saved;
  const errorMessage = mutation.isError
    ? userFacingError(mutation.error, "No se pudieron guardar las notas")
    : null;

  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="customer-notes-detail" className="text-text mb-1 block text-sm font-medium">
          Observaciones del cliente
        </label>
        <p id="customer-notes-help" className="text-text-2 mb-2 text-xs">
          Información interna: equipos, preferencias de horario o detalles de acceso.
        </p>
        <textarea
          id="customer-notes-detail"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          rows={8}
          maxLength={2000}
          readOnly={!canManage}
          aria-describedby="customer-notes-help customer-notes-count"
          className="border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 min-h-40 w-full rounded-ds-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 read-only:bg-surface-2/60"
        />
        <p id="customer-notes-count" className="text-text-2 mt-1 text-xs">
          {value.length} / 2000 caracteres
        </p>
      </div>

      {errorMessage && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
          {errorMessage}
        </p>
      )}

      {canManage ? (
        <div className="flex items-center justify-end gap-2">
          {dirty && (
            <Button variant="ghost" onClick={() => setValue(saved)} disabled={mutation.isPending}>
              Descartar cambios
            </Button>
          )}
          <Button
            onClick={() => mutation.mutate(value.trim())}
            disabled={!dirty || mutation.isPending}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="h-4 w-4" aria-hidden="true" />
            )}
            {mutation.isPending ? "Guardando…" : "Guardar notas"}
          </Button>
        </div>
      ) : (
        <p className="text-text-2 text-xs">
          Solo lectura: tu rol no puede editar las observaciones.
        </p>
      )}
    </div>
  );
}
