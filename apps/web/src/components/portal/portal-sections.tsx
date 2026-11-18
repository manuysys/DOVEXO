"use client";

import { CalendarDays, ClipboardList, CreditCard, Wallet, Wrench } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type {
  PortalAppointment,
  PortalOrder,
  PortalPayment,
  PortalServiceRequest,
  PortalSession,
} from "@/lib/portal-api";
import { formatCurrency } from "@/lib/utils";

import {
  formatPortalDateTime,
  formatPortalDay,
  formatPortalTimeRange,
  portalAppointmentStatus,
  portalOrderStatus,
  portalPaymentMethod,
  portalPaymentStatus,
  portalPriorityLabel,
  portalRequestStatus,
  sumCurrency,
} from "./portal-labels";
import { PortalEmpty, PortalListSkeleton, PortalSection } from "./portal-ui";
import { PortalNewRequest } from "./portal-request-form";

export function PortalRequests({
  session,
  requests,
  loading,
  onCreated,
}: {
  session: PortalSession;
  requests: PortalServiceRequest[];
  loading: boolean;
  onCreated: () => void;
}) {
  return (
    <PortalSection
      title="Solicitudes"
      description="Los pedidos que hiciste y en qué estado están."
      action={<PortalNewRequest session={session} onCreated={onCreated} />}
    >
      {loading ? (
        <PortalListSkeleton rows={2} />
      ) : requests.length === 0 ? (
        <PortalEmpty
          icon={ClipboardList}
          title="Todavía no hiciste solicitudes"
          description="Si necesitás un service, una instalación o una reparación, pedilo desde acá."
        />
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const status = portalRequestStatus(request.status);
            return (
              <article
                key={request.id}
                className="rounded-ds-lg border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-text">{request.title}</h3>
                  <Badge variant={status.tone}>{status.label}</Badge>
                </div>
                {request.description && (
                  <p className="text-small mt-1.5 whitespace-pre-line text-text-2">
                    {request.description}
                  </p>
                )}
                <p className="text-caption mt-2.5 text-text-2">
                  {portalPriorityLabel(request.priority)} ·{" "}
                  {formatPortalDateTime(request.requested_at)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}

export function PortalOrders({ orders, loading }: { orders: PortalOrder[]; loading: boolean }) {
  return (
    <PortalSection
      title="Trabajos"
      description="El estado de cada trabajo que tenés con la empresa."
    >
      {loading ? (
        <PortalListSkeleton rows={2} />
      ) : orders.length === 0 ? (
        <PortalEmpty
          icon={Wrench}
          title="No tenés trabajos registrados"
          description="Cuando se genere un trabajo a partir de una solicitud, lo vas a ver acá."
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = portalOrderStatus(order.operational_status);
            return (
              <article
                key={order.id}
                className="rounded-ds-lg border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-caption numeric text-text-2">{order.code}</p>
                    <h3 className="mt-0.5 text-sm font-semibold text-text">{order.title}</h3>
                  </div>
                  <Badge variant={status.tone}>{status.label}</Badge>
                </div>
                {order.description && (
                  <p className="text-small mt-1.5 text-text-2">{order.description}</p>
                )}
                <div className="text-caption mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-text-2">
                  {order.scheduled_at && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatPortalDateTime(order.scheduled_at)}
                    </span>
                  )}
                  {order.payment_status === "paid" && (
                    <span className="font-semibold text-success-strong">Pago al día</span>
                  )}
                  {order.payment_status === "partial" && (
                    <span className="font-semibold text-warning-strong">Pago parcial</span>
                  )}
                  {order.payment_status === "pending" &&
                    order.operational_status === "finished" && (
                      <span className="font-semibold text-warning-strong">Saldo pendiente</span>
                    )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}

export function PortalAppointments({
  appointments,
  loading,
}: {
  appointments: PortalAppointment[];
  loading: boolean;
}) {
  const [now] = useState(() => Date.now());
  const upcoming = appointments
    .filter(
      (appointment) =>
        appointment.status !== "cancelled" && new Date(appointment.starts_at).getTime() >= now,
    )
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = appointments
    .filter(
      (appointment) =>
        appointment.status === "cancelled" || new Date(appointment.starts_at).getTime() < now,
    )
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at))
    .slice(0, 5);

  return (
    <PortalSection title="Turnos" description="Las visitas coordinadas con la empresa.">
      {loading ? (
        <PortalListSkeleton rows={2} />
      ) : appointments.length === 0 ? (
        <PortalEmpty
          icon={CalendarDays}
          title="No tenés turnos agendados"
          description="Cuando se coordine una visita, vas a ver la fecha y el horario acá."
        />
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="text-label text-text-2">Próximos</h3>
            {upcoming.length === 0 ? (
              <p className="text-small text-text-2">No tenés visitas próximas.</p>
            ) : (
              upcoming.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))
            )}
          </div>
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-label text-text-2">Anteriores</h3>
              {past.map((appointment) => (
                <AppointmentCard key={appointment.id} appointment={appointment} />
              ))}
            </div>
          )}
        </div>
      )}
    </PortalSection>
  );
}

function AppointmentCard({ appointment }: { appointment: PortalAppointment }) {
  const status = portalAppointmentStatus(appointment.status);
  return (
    <article className="rounded-ds-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text first-letter:uppercase">
            {formatPortalDay(appointment.starts_at)}
          </p>
          <p className="numeric text-small mt-0.5 text-text-2">
            {formatPortalTimeRange(appointment.starts_at, appointment.ends_at)}
          </p>
        </div>
        <Badge variant={status.tone}>{status.label}</Badge>
      </div>
      {appointment.notes && (
        <p className="text-small mt-2 whitespace-pre-line text-text-2">{appointment.notes}</p>
      )}
    </article>
  );
}

export function PortalPayments({
  payments,
  loading,
}: {
  payments: PortalPayment[];
  loading: boolean;
}) {
  const registeredTotal = sumCurrency(
    payments.filter((payment) => payment.status === "registered").map((payment) => payment.amount),
  );

  return (
    <PortalSection title="Pagos" description="Los pagos que la empresa registró a tu nombre.">
      {loading ? (
        <PortalListSkeleton rows={2} />
      ) : payments.length === 0 ? (
        <PortalEmpty
          icon={Wallet}
          title="Todavía no hay pagos registrados"
          description="Cuando se registre un pago, vas a poder consultarlo acá."
        />
      ) : (
        <div className="space-y-3">
          <div className="rounded-ds-lg border border-border bg-surface p-5 shadow-card">
            <p className="text-label text-text-2">Total registrado</p>
            <p className="numeric mt-1 font-display text-2xl font-semibold tracking-tight text-text">
              {formatCurrency(registeredTotal)}
            </p>
            <p className="text-caption mt-1 text-text-2">
              {payments.length === 1
                ? "1 pago en el historial."
                : `${payments.length} pagos en el historial.`}{" "}
              No incluye pagos anulados. Si tenés dudas, consultá con la empresa.
            </p>
          </div>

          {payments.map((payment) => {
            const status = portalPaymentStatus(payment.status);
            return (
              <article
                key={payment.id}
                className="rounded-ds-lg border border-border bg-surface p-5 shadow-card"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="numeric font-display text-lg font-semibold tracking-tight text-text">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-caption mt-1 flex items-center gap-1.5 text-text-2">
                      <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                      {portalPaymentMethod(payment.method)} ·{" "}
                      {formatPortalDateTime(payment.paid_at)}
                    </p>
                  </div>
                  <Badge variant={status.tone}>{status.label}</Badge>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PortalSection>
  );
}
