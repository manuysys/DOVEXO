import {
  CalendarClock,
  Check,
  ClipboardList,
  FileText,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
  AgendaMockup,
  AiMockup,
  AutomationMockup,
  ClientsMockup,
  OrdersMockup,
  PaymentsMockup,
  PhoneTechMockup,
  QuoteStatusMockup,
} from "./mockups";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type FeatureRow = {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  text: string;
  bullets: readonly string[];
  visual: ReactNode;
};

/** Dos mockups superpuestos con un desplazamiento leve (sin sombras excesivas). */
function Stack({
  main,
  aside,
  asideClassName,
}: {
  main: ReactNode;
  aside: ReactNode;
  asideClassName?: string;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[30rem]">
      <div className="w-full">{main}</div>
      <div className={cn("mt-4 ml-auto w-[88%] sm:w-[82%] lg:-mt-12", asideClassName)}>{aside}</div>
    </div>
  );
}

/*
 * Beneficios en secciones alternadas: texto a un lado, composición del producto
 * al otro. Cada fila agrupa módulos reales y usa los mockups del dataset demo.
 */
const rows: FeatureRow[] = [
  {
    id: "clientes",
    icon: Users,
    label: "Clientes y trabajos",
    title: "Una ficha por cliente. Una orden por trabajo.",
    text: "Todo lo que pasó con un cliente queda en el mismo lugar: datos, equipos, visitas y presupuestos, sin buscar en planillas.",
    bullets: [
      "Historial de visitas y órdenes por cliente",
      "Estados con transiciones válidas y auditoría",
      "Materiales, fotos y notas dentro de la orden",
    ],
    visual: (
      <Stack
        main={<ClientsMockup className="w-full" />}
        aside={<OrdersMockup className="w-full" />}
      />
    ),
  },
  {
    id: "presupuestos",
    icon: FileText,
    label: "Presupuestos y cobros",
    title: "Presupuestos con precios que no cambian solos.",
    text: "Cada ítem guarda una copia histórica. El cliente aprueba desde un link y el cobro queda asociado a la misma orden.",
    bullets: [
      "Ítems y precios históricos por presupuesto",
      "Aprobación pública sin crear cuenta",
      "Cobros totales o parciales con saldo visible",
    ],
    visual: (
      <Stack
        main={<QuoteStatusMockup className="w-full" />}
        aside={<PaymentsMockup className="w-full" />}
      />
    ),
  },
  {
    id: "agenda",
    icon: CalendarClock,
    label: "Agenda y técnicos",
    title: "La agenda de la oficina y el celular del técnico, con el mismo turno.",
    text: "Se asigna el trabajo, se controla el solapamiento y el técnico ve su día desde el navegador. Sin tienda de aplicaciones.",
    bullets: [
      "Detección de turnos superpuestos",
      "PWA con agenda, fotos y materiales",
      "Cierre de visita desde el celular",
    ],
    visual: (
      <Stack
        main={<AgendaMockup className="w-full" />}
        aside={
          <div className="flex justify-end">
            <PhoneTechMockup className="w-[12rem]" />
          </div>
        }
      />
    ),
  },
  {
    id: "automatizacion",
    icon: Sparkles,
    label: "Automatización e IA",
    title: "Avisos automáticos y respuestas con tus datos.",
    text: "Las reglas se disparan con eventos del trabajo y el asistente consulta información de la empresa. Ninguno de los dos cambia datos por su cuenta.",
    bullets: [
      "Reglas por evento con historial de ejecución",
      "Notificaciones dentro de la app",
      "El asistente consulta; no ejecuta acciones",
    ],
    visual: (
      <Stack
        main={<AutomationMockup className="w-full" />}
        aside={<AiMockup className="w-full" />}
      />
    ),
  },
];

export function FeaturesBento() {
  return (
    <section
      id="funciones"
      aria-labelledby="features-title"
      className="scroll-mt-16 bg-bg py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Funciones"
          title="Cada área de la empresa, conectada a la misma orden."
          text="Clientes, órdenes, presupuestos, agenda, técnicos, pagos y automatizaciones comparten datos. Lo que pasa en la calle se ve en la oficina."
          titleId="features-title"
        />

        <div className="mt-14 space-y-16 sm:space-y-24">
          {rows.map((row, index) => {
            const flipped = index % 2 === 1;
            return (
              <div key={row.id} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <Reveal className={cn("min-w-0", flipped && "lg:order-2")}>
                  <p className="text-label flex items-center gap-2 text-primary">
                    <row.icon className="size-4" aria-hidden="true" />
                    {row.label}
                  </p>
                  <h3 className="text-h2 mt-3 text-text text-balance">{row.title}</h3>
                  <p className="text-body mt-3 max-w-lg text-text-2">{row.text}</p>
                  <ul className="mt-6 space-y-2.5">
                    {row.bullets.map((bullet) => (
                      <li key={bullet} className="text-small flex gap-2.5 text-text">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </Reveal>
                <Reveal delay={0.08} className={cn("min-w-0", flipped && "lg:order-1")}>
                  {row.visual}
                </Reveal>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col gap-4 rounded-ds-lg border border-dashed border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-ds-sm bg-surface-2 text-text-2">
              <MessageCircle className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-small font-semibold text-text">WhatsApp Cloud API oficial</p>
              <p className="text-small mt-1 max-w-xl text-text-2">
                Se configura con credenciales de Meta por empresa. Sin ellas no se envía ningún
                mensaje y el resto de la plataforma funciona igual.
              </p>
            </div>
          </div>
          <span className="text-xs w-fit shrink-0 rounded-full border border-warning/40 bg-warning-soft px-3 py-1 font-semibold text-warning-strong">
            Requiere configuración
          </span>
        </div>

        <p className="text-caption mt-6 flex items-center gap-2 text-text-2">
          <ClipboardList className="size-3.5 shrink-0" aria-hidden="true" />
          Datos ilustrativos: todas las vistas muestran una misma operación de ejemplo, no clientes
          reales.
        </p>
      </div>
    </section>
  );
}
