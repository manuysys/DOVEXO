import {
  ArrowRight,
  Building2,
  Camera,
  Check,
  ClipboardList,
  MapPin,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
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
} from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";

import { ApprovalStamp } from "./approval-stamp";
import { PanelShell } from "./panels";
import { SectionHeading } from "./section-heading";

const activeOrder = getOrder(demoRefs.activeOrderId);
const activeCustomer = getCustomer(activeOrder.customerId);
const activeTechnician = activeOrder.technicianId
  ? getTechnician(activeOrder.technicianId)
  : null;
const activeQuote = getQuote(demoRefs.approvedQuoteId);
const paid = getQuoteTotalPaid(activeQuote.id);
const balance = getQuoteBalance(activeQuote.id);

function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mk-scroll-reveal min-w-0 ${className ?? ""}`}>{children}</div>;
}

function OfficePanel() {
  return (
    <PanelShell>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="mk-display text-[26px] font-semibold tracking-[-0.04em]">
            Hoy en la empresa
          </h3>
          <p className="mt-1 text-[15px] text-mk-panel-muted">
            La oficina ve la calle en el mismo lugar.
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-[13px] text-mk-panel-muted">
          {demoOperation.orders.length} trabajos
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          ["Turnos de hoy", String(demoOperation.appointments.length)],
          [
            "Sin técnico",
            String(demoOperation.orders.filter((order) => !order.technicianId).length),
          ],
          [
            "Presupuestos enviados",
            String(demoOperation.quotes.filter((quote) => quote.status === "enviado").length),
          ],
          ["Saldo pendiente", formatArs(balance)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
            <p className="text-[14px] text-mk-panel-muted">{label}</p>
            <p className="mk-display mt-1 text-[22px] font-semibold tracking-[-0.04em]">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-medium text-mk-panel-text">Próximos turnos</p>
        </div>
        <div className="mt-3 space-y-2">
          {demoOperation.appointments.map((appointment) => {
            const order = getOrder(appointment.orderId);
            return (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] text-mk-panel-text">{order.title}</p>
                  <p className="mt-0.5 text-[13px] text-mk-panel-muted">
                    {getCustomer(order.customerId).zone}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[14px] text-mk-panel-text">
                  {appointment.startTime}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </PanelShell>
  );
}

function TechnicianPhone() {
  return (
    <div className="mx-auto w-full max-w-[320px] rotate-[2deg] rounded-[42px] border border-white/15 bg-[#05060a] p-2.5 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.9)] transition-transform duration-300 hover:-translate-y-1.5 hover:rotate-0">
      <div className="overflow-hidden rounded-[34px] bg-mk-paper-2">
        <div className="flex items-center justify-between border-b border-mk-line px-4 py-3">
          <div>
            <p className="text-[13px] text-mk-slate">Hoy</p>
            <p className="mt-0.5 text-[17px] font-semibold text-mk-ink">
              {activeTechnician?.firstName ?? "Técnico"}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-100 px-2.5 py-1 text-[12px] font-medium text-amber-900">
            <WifiOff className="size-3.5" aria-hidden="true" />
            Sin señal
          </span>
        </div>

        <div className="p-4">
          <div className="rounded-2xl border border-mk-line bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-mk-slate">{activeOrder.id}</p>
                <p className="mt-1 text-[16px] font-semibold text-mk-ink">{activeOrder.title}</p>
              </div>
              <span className="whitespace-nowrap rounded-full bg-emerald-100 px-2.5 py-1 text-[12px] font-medium text-emerald-900">
                En curso
              </span>
            </div>
            <p className="mt-3 flex items-start gap-2 text-[14px] leading-[1.4] text-mk-ink/70">
              <MapPin className="mt-0.5 size-4 shrink-0 text-mk-signal-strong" aria-hidden="true" />
              {activeCustomer.address}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { icon: Check, label: "Iniciar" },
                { icon: ClipboardList, label: "Notas" },
                { icon: Camera, label: "Fotos" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-mk-line bg-mk-paper px-2 text-[13px] font-semibold text-mk-ink"
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-600/20 bg-amber-50 px-3 py-2.5">
            <p className="text-[13px] text-amber-950">2 cambios en cola</p>
            <p className="text-[12px] text-amber-950">Se sincroniza al volver</p>
          </div>

          <p className="mt-3 text-[13px] text-mk-slate">
            2 materiales cargados · 1 foto adjunta
          </p>
        </div>
      </div>
    </div>
  );
}

function ClientPanel() {
  return (
    <div className="rounded-[28px] border border-mk-line bg-white p-6 shadow-[0_30px_70px_-50px_rgb(15_15_15/0.35)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="mk-display text-[26px] font-semibold tracking-[-0.04em] text-mk-ink">
            Presupuesto
          </h3>
          <p className="mt-1 text-[15px] text-mk-slate">
            {activeCustomer.name} · {activeCustomer.zone}
          </p>
        </div>
        <ApprovalStamp label="Aprobado" detail={activeQuote.id} size="sm" className="mk-stamp-in" />
      </div>

      <div className="mt-5 space-y-3 border-t border-mk-line pt-4">
        {activeQuote.items.map((item) => (
          <div key={item.description} className="flex items-center justify-between gap-4">
            <span className="text-[15px] text-mk-ink/70">{item.description}</span>
            <span className="font-mono text-[13px] text-mk-ink">{formatArs(item.amount)}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-mk-line pt-4">
        <div>
          <p className="text-[13px] text-mk-slate">Total</p>
          <p className="mk-display mt-1 text-[32px] font-semibold tracking-[-0.05em] text-mk-ink">
            {formatArs(activeQuote.total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-mk-slate">Saldo</p>
          <p className="mk-display mt-1 text-[22px] font-semibold tracking-[-0.04em] text-mk-signal-strong">
            {formatArs(balance)}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-mk-line bg-mk-paper-2 p-3">
        <div className="flex items-center justify-between text-[14px]">
          <span className="text-mk-ink/75">Pago parcial · Transferencia</span>
          <span className="font-mono text-mk-ink">{formatArs(paid)}</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-mk-line">
          <div
            className="h-full rounded-full bg-mk-signal"
            style={{ width: `${Math.round((paid / activeQuote.total) * 100)}%` }}
          />
        </div>
      </div>

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-mk-ink underline decoration-mk-signal decoration-2 underline-offset-4"
      >
        Probar la demo
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

export function RoleSections() {
  return (
    <>
      <section id="oficina" className="scroll-mt-20 bg-mk-paper py-20 sm:py-28">
        <div className="mx-auto grid min-w-0 max-w-none items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-16">
          <Reveal>
            <SectionHeading
              title="La oficina ve todo."
              text="Turnos, órdenes sin técnico, presupuestos pendientes y saldos en una sola pantalla. Sin planillas paralelas ni preguntar por WhatsApp."
            />
            <ul className="mt-7 space-y-3">
              {[
                "La agenda y la calle comparten el mismo estado.",
                "Cada alerta lleva a la orden que hay que resolver.",
                "El dashboard muestra lo que falta, no solo lo que pasó.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-mk-ink/80">
                  <Check className="mt-1 size-4 shrink-0 text-mk-signal" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-mk-ink underline decoration-mk-signal decoration-2 underline-offset-4"
            >
              Entrar al panel
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Reveal>
          <Reveal>
            <OfficePanel />
          </Reveal>
        </div>
      </section>

      <section id="tecnico" className="scroll-mt-20 bg-mk-panel py-20 text-mk-panel-text sm:py-28">
        <div className="mx-auto grid min-w-0 max-w-none items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <Reveal>
            <SectionHeading
              title="El técnico trabaja sin señal."
              text="La orden, la dirección, las notas, los materiales y las fotos quedan en el teléfono. Cuando vuelve la conexión, se sincroniza sin duplicar."
              tone="dark"
            />
            <ul className="mt-7 space-y-3">
              {[
                "Órdenes asignadas con dirección y contacto.",
                "Notas, materiales y fotos con cola offline.",
                "La oficina ve el cambio cuando el técnico lo confirma.",
              ].map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-[16px] leading-[1.55] text-mk-panel-text"
                >
                  <Check className="mt-1 size-4 shrink-0 text-mk-foil-gold" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="flex justify-center">
            <TechnicianPhone />
          </Reveal>
        </div>
      </section>

      <section id="cliente" className="scroll-mt-20 border-y border-mk-line bg-mk-paper-2 py-20 sm:py-28">
        <div className="mx-auto grid min-w-0 max-w-none items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-16">
          <Reveal>
            <SectionHeading
              title="El cliente aprueba sin cuenta."
              text="Recibe el presupuesto, lo aprueba desde el teléfono y ve el turno y los pagos. La oficina recibe la respuesta en el momento, con el sello y el historial."
            />
            <ul className="mt-7 space-y-3">
              {[
                "Link público para aprobar o rechazar.",
                "Turnos, presupuestos y pagos en el portal.",
                "La aprobación queda registrada, no se pierde en el chat.",
              ].map((item) => (
                <li key={item} className="flex gap-3 text-[16px] leading-[1.55] text-mk-ink/80">
                  <Check className="mt-1 size-4 shrink-0 text-mk-signal" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal>
            <ClientPanel />
          </Reveal>
        </div>
      </section>

      <section id="control" className="bg-mk-paper py-16 sm:py-24">
        <div className="mx-auto max-w-none px-5 sm:px-8">
          <SectionHeading
            title="Cada empresa, separada."
            text="La seguridad no es una etiqueta: está en cómo se autoriza cada acción, cómo se guardan los datos y qué queda registrado."
          />
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ShieldCheck,
                title: "Roles claros",
                text: "Owner, admin, dispatcher, técnico y viewer. El backend decide qué puede hacer cada uno; el frontend no manda.",
              },
              {
                icon: ClipboardList,
                title: "Auditoría",
                text: "Cada cambio de estado y cada acción sensible guarda actor, fecha y empresa. El historial no se reescribe.",
              },
              {
                icon: Building2,
                title: "Aislamiento",
                text: "Cada entidad tiene tenant y el backend valida la membresía. Un ID de otra empresa no abre la puerta.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Reveal key={title}>
                <div className="h-full rounded-2xl border border-mk-line bg-white p-6">
                  <Icon className="size-5 text-mk-signal-strong" aria-hidden="true" />
                  <h3 className="mt-5 text-[20px] font-semibold tracking-[-0.02em] text-mk-ink">
                    {title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-mk-ink/70">{text}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <p className="mt-8 text-[14px] leading-[1.5] text-mk-slate">
            Los paneles del sitio usan datos de ejemplo del tenant demo. No hay métricas de
            terceros ni testimonios inventados.
          </p>
        </div>
      </section>
    </>
  );
}
