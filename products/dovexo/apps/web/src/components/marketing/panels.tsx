import { Check } from "lucide-react";
import type { ReactNode } from "react";

import {
  demoOperation,
  demoRefs,
  getCustomer,
  getOrder,
  getQuote,
  getQuoteBalance,
  getQuoteTotalPaid,
  getTechnician,
  orderStatusLabel,
} from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

import { ApprovalStamp } from "./approval-stamp";

const activeOrder = getOrder(demoRefs.activeOrderId);
const activeCustomer = getCustomer(activeOrder.customerId);
const activeQuote = getQuote(demoRefs.approvedQuoteId);
const pendingOrder = getOrder(demoRefs.pendingOrderId);
const paid = getQuoteTotalPaid(activeQuote.id);
const balance = getQuoteBalance(activeQuote.id);
const paidPercent = Math.round((paid / activeQuote.total) * 100);

const statusTone: Record<string, string> = {
  en_curso: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  agendada: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  pendiente: "border-amber-400/20 bg-amber-400/10 text-amber-300",
};

export function PanelShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-[22px] border border-white/10 bg-mk-panel p-5 text-mk-panel-text shadow-[0_30px_80px_-42px_rgba(0,0,0,0.9)] sm:p-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function OrdersPanel() {
  return (
    <PanelShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="mk-display text-[24px] font-semibold tracking-[-0.04em]">Hoy</h3>
          <p className="mt-1 text-[15px] text-mk-panel-muted">3 trabajos · 2 técnicos en calle</p>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[13px] font-medium whitespace-nowrap text-emerald-300">\n          2 en curso
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {demoOperation.orders.map((order) => {
          const customer = getCustomer(order.customerId);
          const technician = order.technicianId ? getTechnician(order.technicianId) : null;
          return (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.07] text-[13px] font-semibold text-mk-panel-text">
                    {customer.initials}
                  </span>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[16px] font-medium text-mk-panel-text">
                      {order.title}
                    </p>
                    <p className="mt-1 truncate text-[14px] text-mk-panel-muted">
                      {customer.name} · {customer.zone}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[13px] font-medium",
                    statusTone[order.status],
                  )}
                >
                  {orderStatusLabel[order.status]}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[13px] text-mk-panel-muted">
                <span>{order.id}</span>
                <span>{technician ? technician.fullName : "Sin técnico"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}

export function SchedulePanel() {
  return (
    <PanelShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="mk-display text-[24px] font-semibold tracking-[-0.04em]">
            Agenda de hoy
          </h3>
          <p className="mt-1 text-[15px] text-mk-panel-muted">
            Dos visitas agendadas y una pendiente.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-mk-panel-muted">Turnos</p>
          <p className="mk-display text-[26px] font-semibold tracking-[-0.04em]">2 / 3</p>
        </div>
      </div>

      <ol className="mt-5">
        {demoOperation.appointments.map((appointment, index) => {
          const order = getOrder(appointment.orderId);
          const technician = getTechnician(appointment.technicianId);
          return (
            <li
              key={appointment.id}
              className={cn(
                "grid grid-cols-[88px_1fr] gap-4 py-4",
                index > 0 && "border-t border-white/10",
              )}
            >
              <div>
                <p className="font-mono text-[15px] text-mk-panel-text">{appointment.startTime}</p>
                <p className="mt-1 font-mono text-[13px] text-mk-panel-muted">
                  {appointment.endTime}
                </p>
              </div>
              <div className="min-w-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                  <p className="line-clamp-2 min-w-0 text-[16px] font-medium text-mk-panel-text">
                    {order.title}
                  </p>
                  <span className="w-fit shrink-0 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[13px] text-emerald-300">
                    Confirmado
                  </span>
                </div>
                <p className="mt-1 text-[14px] text-mk-panel-muted">
                  {technician.fullName} · {getCustomer(order.customerId).zone}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-mk-panel-text">
            {pendingOrder.title}
          </p>
          <p className="mt-1 text-[13px] text-mk-panel-muted">
            {getCustomer(pendingOrder.customerId).name} · sin técnico
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[13px] text-amber-300">
          Asignar
        </span>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[14px] text-mk-panel-muted">
        <Check className="size-4 text-emerald-400" aria-hidden="true" />
        El turno de las 15:00 se movió para evitar un conflicto.
      </p>
    </PanelShell>
  );
}

export function QuotePanel() {
  return (
    <PanelShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="mk-display text-[24px] font-semibold tracking-[-0.04em]">
            Presupuesto
          </h3>
          <p className="mt-1 text-[15px] text-mk-panel-muted">
            {activeCustomer.name} · {activeCustomer.zone}
          </p>
        </div>
        <ApprovalStamp label="Aprobado" detail={activeQuote.id} size="sm" className="mk-stamp-in" />
      </div>

      <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
        {activeQuote.items.map((item) => (
          <div key={item.description} className="flex items-center justify-between gap-4">
            <span className="text-[15px] text-mk-panel-muted">{item.description}</span>
            <span className="font-mono text-[13px] text-mk-panel-text">
              {formatArs(item.amount)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-[13px] text-mk-panel-muted">Total</p>
        <p className="mk-display mt-1 text-[34px] font-semibold tracking-[-0.05em]">
          {formatArs(activeQuote.total)}
        </p>
      </div>
      <p className="mt-4 text-[14px] leading-[1.5] text-mk-panel-muted">
        Aprobado desde el link público, sin crear cuenta. El PDF y el estado quedaron registrados.
      </p>
    </PanelShell>
  );
}

export function PaymentsPanel() {
  return (
    <PanelShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="mk-display text-[24px] font-semibold tracking-[-0.04em]">Cobros</h3>
          <p className="mt-1 text-[15px] text-mk-panel-muted">
            {activeQuote.id} · {activeCustomer.name}
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-[13px] text-mk-panel-muted">
          {paidPercent}% cobrado
        </span>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <p className="text-[14px] text-mk-panel-muted">Total</p>
          <p className="mk-display mt-1 text-[24px] font-semibold tracking-[-0.04em]">
            {formatArs(activeQuote.total)}
          </p>
        </div>
        <div>
          <p className="text-[14px] text-mk-panel-muted">Cobrado</p>
          <p className="mk-display mt-1 text-[24px] font-semibold tracking-[-0.04em] text-emerald-300">
            {formatArs(paid)}
          </p>
        </div>
        <div>
          <p className="text-[14px] text-mk-panel-muted">Saldo</p>
          <p className="mk-display mt-1 text-[24px] font-semibold tracking-[-0.04em] text-mk-foil-gold">
            {formatArs(balance)}
          </p>
        </div>
      </div>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-mk-foil-gold transition-[width] duration-700"
          style={{ width: `${paidPercent}%` }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div>
          <p className="text-[15px] text-mk-panel-text">Transferencia · 08/11</p>
          <p className="mt-1 font-mono text-[13px] text-mk-panel-muted">PG-2026-0001</p>
        </div>
        <span className="font-mono text-[15px] text-emerald-300">{formatArs(paid)}</span>
      </div>
    </PanelShell>
  );
}
