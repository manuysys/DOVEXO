"use client";

import {
  CheckCircle2,
  ClipboardList,
  FileText,
  Inbox,
  Play,
  Send,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Payment, QuoteSummary, ServiceRequest, WorkOrder } from "@/lib/api";
import { paymentMethodLabel } from "@/lib/payment-status";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

import type { CustomerRecord } from "./customer-labels";
import { CustomerInlineLoading } from "./customer-states";

const COLLAPSED_EVENTS = 8;

type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  description?: string;
  href?: string;
  icon: LucideIcon;
  tone: string;
};

type CustomerTimelineProps = {
  customer: CustomerRecord;
  requests: ServiceRequest[];
  orders: WorkOrder[];
  quotes: QuoteSummary[];
  payments: Payment[];
  isLoading?: boolean;
};

function buildEvents({
  customer,
  requests,
  orders,
  quotes,
  payments,
}: Omit<CustomerTimelineProps, "isLoading">): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `customer-${customer.id}`,
      at: customer.created_at,
      title: "Cliente creado",
      description: "Se dio de alta en la cartera de la empresa.",
      icon: UserPlus,
      tone: "bg-primary/10 text-primary",
    },
  ];

  for (const request of requests) {
    events.push({
      id: `request-${request.id}`,
      at: request.requested_at ?? request.created_at,
      title: "Solicitud recibida",
      description: request.title,
      href: "/requests",
      icon: Inbox,
      tone: "bg-info-soft text-info-strong",
    });
  }

  for (const order of orders) {
    events.push({
      id: `order-created-${order.id}`,
      at: order.created_at,
      title: `Orden ${order.code} creada`,
      description: order.title,
      href: `/orders/${order.id}`,
      icon: ClipboardList,
      tone: "bg-surface-2 text-text-2",
    });
    if (order.started_at) {
      events.push({
        id: `order-started-${order.id}`,
        at: order.started_at,
        title: `Orden ${order.code} iniciada`,
        href: `/orders/${order.id}`,
        icon: Play,
        tone: "bg-warning-soft text-warning-strong",
      });
    }
    if (order.finished_at) {
      events.push({
        id: `order-finished-${order.id}`,
        at: order.finished_at,
        title: `Orden ${order.code} finalizada`,
        href: `/orders/${order.id}`,
        icon: CheckCircle2,
        tone: "bg-success-soft text-success-strong",
      });
    }
  }

  for (const quote of quotes) {
    events.push({
      id: `quote-created-${quote.id}`,
      at: quote.created_at,
      title: `Presupuesto ${quote.number} creado`,
      description: formatCurrency(quote.total),
      href: `/quotes/${quote.id}`,
      icon: FileText,
      tone: "bg-surface-2 text-text-2",
    });
    if (quote.sent_at) {
      events.push({
        id: `quote-sent-${quote.id}`,
        at: quote.sent_at,
        title: `Presupuesto ${quote.number} enviado`,
        href: `/quotes/${quote.id}`,
        icon: Send,
        tone: "bg-info-soft text-info-strong",
      });
    }
    if (quote.approved_at) {
      events.push({
        id: `quote-approved-${quote.id}`,
        at: quote.approved_at,
        title: `Presupuesto ${quote.number} aprobado`,
        description: formatCurrency(quote.total),
        href: `/quotes/${quote.id}`,
        icon: ThumbsUp,
        tone: "bg-success-soft text-success-strong",
      });
    }
    if (quote.rejected_at) {
      events.push({
        id: `quote-rejected-${quote.id}`,
        at: quote.rejected_at,
        title: `Presupuesto ${quote.number} rechazado`,
        href: `/quotes/${quote.id}`,
        icon: ThumbsDown,
        tone: "bg-danger-soft text-danger-strong",
      });
    }
  }

  for (const payment of payments) {
    events.push({
      id: `payment-${payment.id}`,
      at: payment.paid_at,
      title: "Pago registrado",
      description: `${formatCurrency(payment.amount)} · ${paymentMethodLabel(payment.method)}`,
      href: "/payments",
      icon: Wallet,
      tone: "bg-accent-teal/10 text-accent-teal",
    });
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export function CustomerTimeline({
  customer,
  requests,
  orders,
  quotes,
  payments,
  isLoading = false,
}: CustomerTimelineProps) {
  const [showAll, setShowAll] = useState(false);
  const events = useMemo(
    () => buildEvents({ customer, requests, orders, quotes, payments }),
    [customer, requests, orders, quotes, payments],
  );

  const visible = showAll ? events : events.slice(0, COLLAPSED_EVENTS);

  return (
    <section
      aria-labelledby="customer-timeline-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="customer-timeline-title" className="text-text text-base font-semibold">
            Historial
          </h2>
          <p className="text-text-2 mt-0.5 text-sm">
            Todo lo que pasó con este cliente, en orden.
          </p>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <CustomerInlineLoading label="Cargando historial…" />
        ) : visible.length === 0 ? (
          <p className="text-text-2 text-sm">Todavía no hay actividad registrada.</p>
        ) : (
          <ol>
            {visible.map((event, index) => {
              const Icon = event.icon;
              const isLast = index === visible.length - 1;
              return (
                <li key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        event.tone,
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isLast && <span className="bg-border w-px flex-1" aria-hidden="true" />}
                  </div>
                  <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="text-text text-sm font-medium">{event.title}</p>
                      <time
                        dateTime={event.at}
                        className="text-text-2 text-[11px] whitespace-nowrap"
                      >
                        {formatDate(event.at)}
                      </time>
                    </div>
                    {event.description && (
                      <p className="text-text-2 mt-0.5 text-xs">{event.description}</p>
                    )}
                    {event.href && (
                      <Link
                        href={event.href}
                        className="text-primary mt-1 inline-block text-xs font-semibold hover:underline"
                      >
                        Ver detalle
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {events.length > COLLAPSED_EVENTS && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
        >
          {showAll ? "Mostrar menos" : `Mostrar todo (${events.length})`}
        </Button>
      )}
    </section>
  );
}
