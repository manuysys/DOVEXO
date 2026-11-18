"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

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
      src: "/product-tour/dashboard.webp",
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
      src: "/product-tour/orders.webp",
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
      src: "/product-tour/quotes.webp",
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
      src: "/product-tour/agenda.webp",
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
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

function BrowserFrame({ visual }: { visual: TourVisual }) {
  return (
    <div className="w-full overflow-hidden rounded-ds-lg border border-border bg-surface shadow-raised">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-2 px-3 py-2">
        <span aria-hidden="true" className="size-2 rounded-full bg-border" />
        <span aria-hidden="true" className="size-2 rounded-full bg-border" />
        <span aria-hidden="true" className="size-2 rounded-full bg-border" />
        <span className="text-caption ml-2 truncate text-text-2">DOVEXO · panel</span>
      </div>
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
    <div className="mx-auto w-[16.5rem] max-w-full rounded-[2.25rem] border-[7px] border-[#06121F] bg-[#0B1220] p-1.5 shadow-[0_30px_70px_-30px_rgb(0_0_0/0.8)]">
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
  const reduce = useReducedMotion();
  const [active, setActive] = useState<TourTabId>("dashboard");
  const current = tabs.find((tab) => tab.id === active) ?? tabs[0];

  return (
    <section id="producto" aria-labelledby="tour-title" className="bg-surface py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Producto"
          title="Recorré las pantallas principales."
          text="Dashboard, órdenes, presupuestos, agenda, la vista del técnico y el portal del cliente. Capturas reales del tenant demo."
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
            className="border-border bg-surface-2 rounded-ds-md mt-10 flex gap-1 overflow-x-auto border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab.id}
                value={tab.id}
                className={`text-small text-text-2 hover:text-text data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-card rounded-ds-sm inline-flex min-h-11 shrink-0 items-center justify-center px-3.5 font-medium whitespace-nowrap transition-colors ${focusRing}`}
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
              className="border-border bg-bg rounded-ds-lg grid gap-8 border p-5 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-12"
            >
              <div className="min-w-0">
                <h3 className="text-h2 text-text text-balance">{current.title}</h3>
                <p className="text-body text-text-2 mt-3">{current.text}</p>
                <ul className="mt-6 space-y-3">
                  {current.bullets.map((bullet) => (
                    <li key={bullet} className="text-small text-text flex gap-3">
                      <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden="true" />
                      {bullet}
                    </li>
                  ))}
                </ul>
                <p className="text-caption text-text-2 mt-6">
                  Capturas reales del tenant demo con datos de ejemplo, no de clientes reales.
                </p>
              </div>

              <div className="flex min-h-[18rem] items-center justify-center overflow-hidden lg:h-[30rem]">
                {current.visual.phone ? (
                  <PhoneFrame visual={current.visual} />
                ) : (
                  <BrowserFrame visual={current.visual} />
                )}
              </div>
            </motion.div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </section>
  );
}
