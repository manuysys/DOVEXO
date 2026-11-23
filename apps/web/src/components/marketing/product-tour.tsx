"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

import { featureCards } from "@/lib/marketing/content";

import { SectionHeading } from "./section-heading";

type TourTabId = "dashboard" | "orders" | "quotes" | "agenda" | "tech" | "portal";

type TourVisual = {
  src: string;
  width: number;
  height: number;
  alt: string;
  phone?: boolean;
};

type TourTab = {
  id: TourTabId;
  label: string;
  title: string;
  text: string;
  bullets: readonly string[];
  visual: TourVisual;
};

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
    visual: {
      src: "/product-tour/dashboard-v4.webp",
      width: 1440,
      height: 900,
      alt: "Dashboard de DOVEXO con métricas, agenda del día y actividad reciente",
    },
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
    visual: {
      src: "/product-tour/orders-v4.webp",
      width: 1440,
      height: 900,
      alt: "Listado de órdenes de trabajo con filtros, tabla y vista de tablero",
    },
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
    visual: {
      src: "/product-tour/quotes-v4.webp",
      width: 1440,
      height: 900,
      alt: "Listado de presupuestos con estados, importes y vencimientos",
    },
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
    visual: {
      src: "/product-tour/agenda-v4.webp",
      width: 1440,
      height: 900,
      alt: "Agenda operativa con vista de día, semana y equipo",
    },
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
    visual: {
      src: "/product-tour/tech.webp",
      width: 390,
      height: 844,
      alt: "PWA del técnico con el próximo trabajo y la agenda del día",
      phone: true,
    },
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
    visual: {
      src: "/product-tour/portal.webp",
      width: 1440,
      height: 900,
      alt: "Portal del cliente con trabajo activo, próximo turno y presupuestos",
    },
  },
];

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal";

function BrowserFrame({ visual }: { visual: TourVisual }) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-mk-ink/20 bg-white shadow-[0_20px_45px_-38px_rgb(18_59_49/0.45)]">
      <Image
        src={visual.src}
        alt={visual.alt}
        width={visual.width}
        height={visual.height}
        sizes="(min-width: 1024px) 55vw, 92vw"
        className="h-auto w-full"
      />
    </div>
  );
}

function PhoneFrame({ visual }: { visual: TourVisual }) {
  return (
    <div className="mx-auto w-[16.5rem] max-w-full rounded-[2.25rem] border-[7px] border-mk-ink bg-mk-ink p-1.5 shadow-[0_30px_70px_-30px_rgb(18_59_49/0.5)]">
      <Image
        src={visual.src}
        alt={visual.alt}
        width={visual.width}
        height={visual.height}
        sizes="264px"
        className="h-auto w-full rounded-[1.7rem]"
      />
    </div>
  );
}

/*
 * Demo interactiva: seis pantallas reales del producto en un panel de altura
 * estable. Las capturas salen del tenant demo con datos de ejemplo.
 */
export function ProductTour() {
  const [active, setActive] = useState<TourTabId>("dashboard");
  const reduce = useReducedMotion();
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section id="producto" aria-labelledby="tour-title" className="scroll-mt-20 bg-mk-paper py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Producto"
          title="El producto, pantalla por pantalla."
          text="Panel, órdenes, presupuestos, agenda, la vista del técnico y el portal del cliente. Capturas reales del tenant demo, con datos de ejemplo."
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
            className={`border-mk-line bg-mk-paper-2 rounded-md mt-10 grid grid-cols-3 gap-1 border p-1 sm:flex sm:overflow-x-auto sm:[scrollbar-width:none] sm:[&::-webkit-scrollbar]:hidden ${focusRing}`}
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`text-mk-ink/75 hover:text-mk-ink data-[state=active]:text-mk-ink relative inline-flex min-h-11 shrink-0 items-center justify-center overflow-hidden rounded px-2 text-[11px] font-medium whitespace-nowrap transition-colors sm:px-3.5 sm:text-sm ${focusRing}`}
              >
                {active === tab.id && (
                  <motion.span
                    layoutId="tour-tab-pill"
                    aria-hidden="true"
                    className="absolute inset-0 rounded bg-mk-paper shadow-[0_1px_2px_rgb(18_59_49/0.08)]"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 380, damping: 30 }
                    }
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value={active} tabIndex={-1} className="mt-6 outline-none">
            <div
              key={active}
              className="mk-fade border-mk-line bg-mk-paper-2 rounded-md grid gap-8 border p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12"
            >
              <div className="min-w-0">
                <h3 className="mk-display text-[clamp(1.75rem,2.6vw,2.25rem)] leading-[1.05] font-medium tracking-[-0.02em] text-balance text-mk-ink">
                  {current.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.6] text-mk-ink/75">{current.text}</p>
                <ul className="mt-6 space-y-3">
                  {current.bullets.map((bullet) => (
                    <li key={bullet} className="text-small text-mk-ink flex gap-3">
                      <Check className="text-mk-signal mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <motion.div
                whileHover={reduce ? undefined : { scale: 1.006 }}
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
                className="flex min-h-[18rem] items-center justify-center overflow-hidden lg:h-[30rem]"
              >
                {current.visual.phone ? (
                  <PhoneFrame visual={current.visual} />
                ) : (
                  <BrowserFrame visual={current.visual} />
                )}
              </motion.div>
            </div>
          </Tabs.Content>
        </Tabs.Root>

        <div className="mt-10 hidden border-t border-mk-line pt-6 lg:block">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h3 className="mk-label text-mk-signal-strong">Todo lo que incluye</h3>
            <p className="max-w-xl text-[12px] leading-[1.5] text-mk-slate sm:text-right">
              Sin promesas de roadmap: lo que sigue está operativo en el tenant demo y comparte
              los mismos datos.
            </p>
          </div>
          <ul className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards
              .filter((feature) => feature.id !== "whatsapp")
              .map((feature) => (
                <li
                  key={feature.id}
                  className="flex gap-2.5 border-t border-mk-line pt-2 text-[12px] leading-[1.5] text-mk-ink/80"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-mk-signal" aria-hidden="true" />
                  <span>
                    <b className="font-semibold text-mk-ink">{feature.title}.</b> {feature.text}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-4 max-w-3xl text-[12px] leading-[1.5] text-mk-slate">
            <span className="font-semibold text-mk-ink">WhatsApp Cloud API oficial:</span> se
            configura con credenciales de Meta por empresa. Sin ellas no se envía ningún mensaje y
            el resto de la plataforma funciona igual.
          </p>
        </div>

        <p className="mt-6 border-t border-mk-line pt-4 text-[12px] leading-[1.5] text-mk-slate lg:hidden">
          <span className="font-semibold text-mk-ink">WhatsApp Cloud API oficial:</span> se configura
          con credenciales de Meta por empresa. Sin ellas no se envía ningún mensaje.
        </p>
      </div>
    </section>
  );
}

