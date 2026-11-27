"use client";

import { CalendarDays, ClipboardList, FileText, Inbox, Wallet } from "lucide-react";
import Link from "next/link";

import { PortalAccessSection } from "@/components/customers/portal-access-section";
import { StatCard } from "@/components/ui/stat-card";
import type {
  Appointment,
  Payment,
  QuoteSummary,
  ServiceRequest,
  WorkOrder,
} from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

import type { CustomerInsight } from "./customer-insights";
import {
  nextScheduledAppointment,
  registeredPayments,
  sumPaymentAmounts,
} from "./customer-insights";
import type { CustomerRecord } from "./customer-labels";
import { CustomerTimeline } from "./customer-timeline";

type CustomerOverviewProps = {
  customer: CustomerRecord;
  insight: CustomerInsight;
  requests: ServiceRequest[];
  orders: WorkOrder[];
  quotes: QuoteSummary[];
  payments: Payment[];
  appointments: Appointment[];
  canViewFinancial: boolean;
  isLoading: boolean;
};

export function CustomerOverview({
  customer,
  insight,
  requests,
  orders,
  quotes,
  payments,
  appointments,
  canViewFinancial,
  isLoading,
}: CustomerOverviewProps) {
  const nextVisit = nextScheduledAppointment(appointments);
  const nextOrder = nextVisit
    ? orders.find((order) => order.id === nextVisit.work_order_id)
    : undefined;
  const paidPayments = registeredPayments(payments);
  const paidTotal = sumPaymentAmounts(paidPayments);
  const display = (value: string | number) => (isLoading ? "…" : value);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Órdenes abiertas"
            value={display(insight.openOrders)}
            hint={`${insight.totalOrders} en total`}
            icon={ClipboardList}
            tone="teal"
          />
          <StatCard
            label="Solicitudes"
            value={display(requests.length)}
            hint="Registradas"
            icon={Inbox}
          />
          {canViewFinancial && (
            <StatCard
              label="Presupuestos pendientes"
              value={display(insight.pendingQuotes)}
              hint={`${insight.totalQuotes} en total`}
              icon={FileText}
              tone="amber"
            />
          )}
          {canViewFinancial && (
            <StatCard
              label="Pagos registrados"
              value={isLoading ? "…" : formatCurrency(paidTotal)}
              hint={`${paidPayments.length} pago${paidPayments.length === 1 ? "" : "s"}`}
              icon={Wallet}
              tone="teal"
            />
          )}
        </div>

        <section
          aria-labelledby="customer-next-visit-title"
          className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2
                id="customer-next-visit-title"
                className="text-text flex items-center gap-2 text-base font-semibold"
              >
                <CalendarDays className="text-accent-teal h-4 w-4" aria-hidden="true" />
                Próxima visita
              </h2>
              <p className="text-text-2 mt-0.5 text-sm">El próximo turno agendado del cliente.</p>
            </div>
            <Link href="/agenda" className="text-primary shrink-0 text-xs font-semibold hover:underline">
              Ver agenda
            </Link>
          </div>

          {isLoading ? (
            <p className="text-text-2 mt-3 text-sm">Cargando turnos…</p>
          ) : nextVisit ? (
            <div className="mt-3">
              <p className="text-text text-sm font-semibold">{formatDate(nextVisit.starts_at)}</p>
              <p className="text-text-2 mt-0.5 text-xs">
                {nextOrder ? `${nextOrder.code} · ${nextOrder.title}` : "Turno agendado"}
              </p>
              {nextOrder && (
                <Link
                  href={`/orders/${nextOrder.id}`}
                  className="text-primary mt-2 inline-block text-xs font-semibold hover:underline"
                >
                  Ver orden
                </Link>
              )}
            </div>
          ) : (
            <p className="text-text-2 mt-3 text-sm">
              No hay visitas agendadas. Cuando se programe un turno, aparece acá.
            </p>
          )}
        </section>

        <div id="portal-acceso" className="scroll-mt-24">
          <PortalAccessSection customer={customer} />
        </div>
      </div>

      <CustomerTimeline
        customer={customer}
        requests={requests}
        orders={orders}
        quotes={quotes}
        payments={payments}
        isLoading={isLoading}
      />
    </div>
  );
}
