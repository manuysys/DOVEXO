"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  demoOperation,
  demoRefs,
  getCustomer,
  getOrder,
  getQuote,
  getQuoteBalance,
  getTechnician,
} from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";

import {
  AgendaMockup,
  MockFrame,
  OrdersMockup,
  PanelMockup,
  PhoneTechMockup,
  QuoteMockup,
} from "./mockups";
import { SectionHeading } from "./section-heading";

type TourTabId = "dashboard" | "orders" | "quotes" | "agenda" | "tech" | "portal";

type TourTab = {
  id: TourTabId;
  label: string;
  title: string;
  text: string;
  bullets: readonly string[];
  visual: ReactNode;
};

/** Vista del portal con los datos del mismo dataset: turno, presupuesto y saldo. */
function PortalPreview({ className }: { className?: string }) {
  const customer = getCustomer(demoRefs.customerId);
  const quote = getQuote(demoRefs.pendingQuoteId);
  const appointment = demoOperation.appointments.find(
    (item) => item.orderId === demoRefs.activeOrderId,
  );
  const balance = getQuoteBalance(demoRefs.approvedQuoteId);

  return (
    <MockFrame title="Portal del cliente" className={className}>
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-full bg-primary text-[10px] font-semibold text-white">
            {customer.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold">{customer.name}</p>
            <p className="truncate text-[10px] text-white/60">{customer.address}</p>
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.05] p-2.5">
          <p className="text-[10px] text-white/60">Turno de hoy</p>
          <p className="mt-0.5 text-[11px] font-semibold">
            {appointment
              ? `${appointment.startTime} · ${getOrder(appointment.orderId).title}`
              : "Sin turno agendado"}
          </p>
          <p className="text-[10px] text-white/65">
            {getTechnician(demoRefs.technicianId).fullName}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.05] p-2.5">
          <div>
            <p className="text-[10px] text-white/60">Presupuesto {quote.id}</p>
            <p className="font-mono text-[11px]">{formatArs(quote.total)}</p>
          </div>
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-semibold text-white">
            Ver y aprobar
          </span>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-white/10 p-2.5">
          <span className="text-[10px] text-white/65">Saldo pendiente</span>
          <span className="font-mono text-[11px] font-semibold text-amber">
            {formatArs(balance)}
          </span>
        </div>
      </div>
    </MockFrame>
  );
}

const tabs: readonly TourTab[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Lo que pasa hoy, en una pantalla.",
    text: "El dueño y la oficina ven órdenes, presupuestos y cobros pendientes sin abrir planillas.",
    bullets: [
      "Órdenes del día y técnicos asignados",
      "Presupuestos pendientes de respuesta",
      "Saldo pendiente de cobro",
    ],
    visual: <PanelMockup className="w-full max-w-[34rem]" />,
  },
  {
    id: "orders",
    label: "Órdenes",
    title: "Del pedido al cierre, con responsables.",
    text: "Cada orden tiene estado, técnico, materiales y adjuntos. Cada cambio queda registrado.",
    bullets: [
      "Transiciones de estado válidas según el flujo",
      "Historial con actor y fecha",
      "Materiales y fotos asociados a la orden",
    ],
    visual: <OrdersMockup className="w-full max-w-[34rem]" />,
  },
  {
    id: "quotes",
    label: "Presupuestos",
    title: "El cliente lo ve y lo aprueba desde un link.",
    text: "El enlace no requiere login. La aprobación actualiza la orden automáticamente y el cobro queda asociado.",
    bullets: [
      "Ítems y precios con copia histórica",
      "Sin cuenta ni contraseña para el cliente",
      "Estado sincronizado con la orden de trabajo",
    ],
    visual: <QuoteMockup className="w-full max-w-[34rem]" />,
  },
  {
    id: "agenda",
    label: "Agenda",
    title: "Cada turno, contra la agenda del equipo.",
    text: "Se asigna el técnico, se detectan solapamientos antes de confirmar y la visita aparece en el celular.",
    bullets: [
      "Turnos por técnico y por día",
      "Detección de superposición de horarios",
      "Reprogramación sin perder el historial",
    ],
    visual: <AgendaMockup className="w-full max-w-[34rem]" />,
  },
  {
    id: "tech",
    label: "Técnico",
    title: "La agenda del día, en el bolsillo del técnico.",
    text: "Se agrega a la pantalla de inicio. Si se corta la conexión, muestra el shell y una pantalla offline; los datos se actualizan al volver.",
    bullets: [
      "Se usa desde el navegador, sin tienda de aplicaciones",
      "Cierre de visita con notas y materiales",
      "Fotos con validación de tipo y tamaño",
    ],
    visual: <PhoneTechMockup className="w-[15.5rem]" />,
  },
  {
    id: "portal",
    label: "Portal",
    title: "El cliente ve su trabajo sin llamar a la oficina.",
    text: "Acceso por link: turnos, presupuestos y pagos de su empresa. Sin descargar nada y sin crear una cuenta.",
    bullets: [
      "Acceso con token, revocable desde la ficha del cliente",
      "Presupuestos pendientes y aprobación en el momento",
      "Turnos, órdenes y saldo de la operación",
    ],
    visual: <PortalPreview className="w-full max-w-[20rem]" />,
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/*
 * Demo interactiva: seis pantallas del producto en un panel de altura estable
 * para que cambiar de pestaña no mueva el scroll. Las pestañas usan Radix
 * (roles, foco y teclado incluidos) y el contenido entra con un fade corto.
 */
export function ProductTour() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState<TourTabId>("dashboard");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section id="producto" aria-labelledby="tour-title" className="scroll-mt-16 bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Producto"
          title="Recorré las pantallas principales."
          text="Dashboard, órdenes, presupuestos, agenda, la vista del técnico y el portal del cliente. Todo con la misma operación de ejemplo."
          titleId="tour-title"
        />

        <Tabs.Root
          value={active}
          onValueChange={(value) => {
            const next = tabs.find((tab) => tab.id === value);
            if (next) setActive(next.id);
          }}
        >
          <Tabs.List
            aria-label="Pantallas del producto"
            className="mt-10 flex gap-1 overflow-x-auto rounded-ds-md border border-border bg-surface-2 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`text-small inline-flex min-h-11 shrink-0 items-center justify-center rounded-ds-sm px-3.5 font-medium whitespace-nowrap text-text-2 transition-colors hover:text-text data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-card ${focusRing}`}
              >
                {tab.label}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value={active} tabIndex={-1} className="mt-6 outline-none">
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="grid gap-8 rounded-ds-lg border border-border bg-bg p-5 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-12"
            >
              <div className="min-w-0">
                <h3 className="text-h2 text-text text-balance">{current.title}</h3>
                <p className="text-body mt-3 text-text-2">{current.text}</p>
                <ul className="mt-6 space-y-3">
                  {current.bullets.map((bullet) => (
                    <li key={bullet} className="text-small flex gap-3 text-text">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="text-caption mt-6 text-text-2">
                  Las pantallas son maquetas con datos ilustrativos, no capturas de clientes reales.
                </p>
              </div>

              <div className="flex min-h-[18rem] items-center justify-center overflow-hidden lg:h-[28rem]">
                {current.visual}
              </div>
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>
  );
}
