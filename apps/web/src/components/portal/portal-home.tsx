"use client";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  Plus,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
  PortalAppointment,
  PortalOrder,
  PortalPayment,
  PortalQuote,
  PortalServiceRequest,
  PortalSummary,
} from "@/lib/portal-api";
import { formatCurrency, formatDateOnly } from "@/lib/utils";

import {
  formatPortalDateTime,
  formatPortalDay,
  formatPortalTimeRange,
  isActiveOrder,
  isPortalQuoteExpired,
  portalDayHint,
  portalOrderProgress,
  portalOrderStatus,
  portalPaymentStatus,
  portalQuoteExpiryNote,
  portalRequestStatus,
  type PortalTab,
  type PortalTone,
} from "./portal-labels";
import { PortalEmpty, PortalProgress } from "./portal-ui";

type HistoryItem = {
  id: string;
  date: string;
  label: string;
  detail: string;
  tone: PortalTone;
  icon: LucideIcon;
  tab: PortalTab;
};

const ACTIVE_ORDER_PRIORITY: Partial<Record<string, number>> = {
  in_progress: 0,
  waiting: 1,
  scheduled: 2,
  new: 3,
};

function activeOrderRank(order: PortalOrder) {
  return ACTIVE_ORDER_PRIORITY[order.operational_status] ?? 9;
}

const TONE_CLASSES: Record<PortalTone, string> = {
  neutral: "bg-surface-2 text-text-2",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
  info: "bg-info-soft text-info-strong",
  teal: "bg-accent-teal/10 text-accent-teal",
};

export function PortalHome({
  summary,
  orders,
  quotes,
  requests,
  appointments,
  payments,
  loading,
  onNavigate,
}: {
  summary: PortalSummary | undefined;
  orders: PortalOrder[];
  quotes: PortalQuote[];
  requests: PortalServiceRequest[];
  appointments: PortalAppointment[];
  payments: PortalPayment[];
  loading: boolean;
  onNavigate: (tab: PortalTab) => void;
}) {
  const [now] = useState(() => Date.now());
  const activeOrder = [...orders].filter(isActiveOrder).sort((a, b) => {
    const byPriority = activeOrderRank(a) - activeOrderRank(b);
    if (byPriority !== 0) return byPriority;
    return (a.scheduled_at ?? a.created_at).localeCompare(b.scheduled_at ?? b.created_at);
  })[0];
  const pendingQuotes = quotes
    .filter((quote) => quote.status === "sent" && !isPortalQuoteExpired(quote))
    .sort((a, b) => (a.valid_until ?? "9999-12-31").localeCompare(b.valid_until ?? "9999-12-31"));
  const nextAppointment =
    summary?.next_appointment ??
    appointments
      .filter(
        (appointment) =>
          appointment.status !== "cancelled" && new Date(appointment.starts_at).getTime() >= now,
      )
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0] ??
    null;
  const activeProgress = activeOrder ? portalOrderProgress(activeOrder.operational_status) : null;

  const history = useMemo<HistoryItem[]>(() => {
    const items: HistoryItem[] = [];

    for (const order of orders) {
      const status = portalOrderStatus(order.operational_status);
      items.push({
        id: `order-${order.id}`,
        date: order.finished_at ?? order.started_at ?? order.scheduled_at ?? order.created_at,
        label: `Trabajo ${order.code}`,
        detail: status.label,
        tone: status.tone,
        icon: Wrench,
        tab: "orders",
      });
    }

    for (const request of requests) {
      const status = portalRequestStatus(request.status);
      items.push({
        id: `request-${request.id}`,
        date: request.requested_at,
        label: request.title,
        detail: `Solicitud · ${status.label}`,
        tone: status.tone,
        icon: ClipboardList,
        tab: "requests",
      });
    }

    for (const payment of payments) {
      const status = portalPaymentStatus(payment.status);
      items.push({
        id: `payment-${payment.id}`,
        date: payment.paid_at,
        label: `Pago de ${formatCurrency(payment.amount)}`,
        detail: status.label,
        tone: status.tone,
        icon: CheckCircle2,
        tab: "payments",
      });
    }

    return items
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4);
  }, [orders, requests, payments]);

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Cargando tu información...</span>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-44 animate-pulse rounded-ds-lg border border-border bg-surface lg:col-span-2" />
          <div className="space-y-4">
            <div className="h-32 animate-pulse rounded-ds-lg border border-border bg-surface" />
            <div className="h-32 animate-pulse rounded-ds-lg border border-border bg-surface" />
          </div>
        </div>
        <div className="h-48 animate-pulse rounded-ds-lg border border-border bg-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeOrder ? (
            <Card className="h-full p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-label text-text-2">Trabajo activo</p>
                  <h2 className="text-h4 mt-1 text-text">{activeOrder.title}</h2>
                  <p className="text-caption numeric mt-0.5 text-text-2">{activeOrder.code}</p>
                </div>
                <Badge variant={portalOrderStatus(activeOrder.operational_status).tone}>
                  {portalOrderStatus(activeOrder.operational_status).label}
                </Badge>
              </div>
              {activeOrder.description && (
                <p className="text-small mt-3 line-clamp-3 text-text-2">
                  {activeOrder.description}
                </p>
              )}
              {activeProgress && (
                <div className="mt-4">
                  <PortalProgress
                    step={activeProgress.step}
                    total={activeProgress.total}
                    label={activeProgress.label}
                  />
                </div>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onNavigate("orders")}>
                  Ver todos los trabajos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
                {activeOrder.scheduled_at && (
                  <span className="text-caption flex items-center gap-1.5 text-text-2">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                    {formatPortalDateTime(activeOrder.scheduled_at)}
                  </span>
                )}
              </div>
            </Card>
          ) : (
            <Card className="flex h-full flex-col justify-between p-5 sm:p-6">
              <div>
                <p className="text-label text-text-2">Trabajo activo</p>
                <h2 className="text-h4 mt-1 text-text">No tenés trabajos en curso</h2>
                <p className="text-small mt-1.5 text-text-2">
                  Si necesitás un service, una instalación o una reparación, podés pedirlo desde
                  acá.
                </p>
              </div>
              <div className="mt-4">
                <Button size="sm" onClick={() => onNavigate("requests")}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Pedir un servicio
                </Button>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-label text-text-2">Próxima visita</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-ds-sm bg-info-soft text-info-strong">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            {nextAppointment ? (
              <>
                <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-semibold text-text first-letter:uppercase">
                  {formatPortalDay(nextAppointment.starts_at)}
                  {portalDayHint(nextAppointment.starts_at) && (
                    <span className="text-caption rounded-full bg-info-soft px-2 py-0.5 font-semibold text-info-strong">
                      {portalDayHint(nextAppointment.starts_at)}
                    </span>
                  )}
                </p>
                <p className="numeric text-small mt-0.5 text-text-2">
                  {formatPortalTimeRange(nextAppointment.starts_at, nextAppointment.ends_at)}
                </p>
              </>
            ) : (
              <p className="text-small mt-2 text-text-2">No tenés visitas agendadas.</p>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 -ml-2"
              onClick={() => onNavigate("appointments")}
            >
              Ver turnos
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-label text-text-2">Presupuestos por responder</p>
              <span className="flex h-8 w-8 items-center justify-center rounded-ds-sm bg-warning-soft text-warning-strong">
                <FileText className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="numeric mt-2 font-display text-2xl font-semibold tracking-tight text-text">
              {pendingQuotes.length}
            </p>
            {pendingQuotes.length > 0 ? (
              <div className="mt-1 space-y-2">
                <p className="text-small text-text-2">
                  <span className="numeric">{pendingQuotes[0].number}</span> ·{" "}
                  {formatCurrency(pendingQuotes[0].total)}
                  {pendingQuotes[0].valid_until
                    ? ` · hasta el ${formatDateOnly(pendingQuotes[0].valid_until)}`
                    : ""}
                </p>
                {portalQuoteExpiryNote(pendingQuotes[0]) && (
                  <p className="text-caption font-semibold text-warning-strong">
                    {portalQuoteExpiryNote(pendingQuotes[0])}
                  </p>
                )}
                <Button size="sm" onClick={() => onNavigate("quotes")}>
                  Revisar presupuestos
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <p className="text-small mt-1 text-text-2">No tenés presupuestos pendientes.</p>
            )}
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="text-h3 text-text">Actividad reciente</h2>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("orders")}>
            Ver trabajos
          </Button>
        </div>
        {history.length === 0 ? (
          <PortalEmpty
            icon={ClipboardList}
            title="Todavía no hay movimientos"
            description="Cuando pidas un servicio o se registre un trabajo, lo vas a ver acá."
          />
        ) : (
          <ul className="divide-y divide-border rounded-ds-lg border border-border bg-surface shadow-card">
            {history.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(item.tab)}
                    className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-surface-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none focus-visible:ring-inset"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-ds-md ${TONE_CLASSES[item.tone]}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">{item.label}</p>
                      <p className="text-caption text-text-2">{item.detail}</p>
                      <p className="numeric text-caption mt-0.5 text-text-2 sm:hidden">
                        {formatPortalDateTime(item.date)}
                      </p>
                    </div>
                    <p className="text-caption numeric hidden shrink-0 text-right text-text-2 sm:block">
                      {formatPortalDateTime(item.date)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
