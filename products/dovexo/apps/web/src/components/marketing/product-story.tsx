"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { LazyOperationalScene } from "./lazy-operational-scene";
import { OrdersPanel, PaymentsPanel, QuotePanel, SchedulePanel } from "./panels";
import { SectionHeading } from "./section-heading";

const steps = [
  {
    number: "01",
    title: "Del pedido al trabajo.",
    text: "La consulta entra por el portal, el teléfono o la oficina. Queda con cliente, dirección y motivo, y se convierte en una orden con estado e historial.",
    bullets: [
      "Cada consulta queda con su cliente y su dirección.",
      "La solicitud pasa a orden con un clic.",
      "Estado, prioridad y responsable desde el primer minuto.",
    ],
    Panel: OrdersPanel,
  },
  {
    number: "02",
    title: "La semana del técnico.",
    text: "Asigná al técnico y controlá el turno antes de confirmar. La agenda muestra la carga del día y avisa cuando dos visitas se pisan.",
    bullets: [
      "Turnos con día, hora y técnico asignado.",
      "Detección de conflictos antes de confirmar.",
      "La oficina y el técnico ven la misma agenda.",
    ],
    Panel: SchedulePanel,
  },
  {
    number: "03",
    title: "Un link, una aprobación.",
    text: "Armá el presupuesto con ítems y precios históricos, generá el PDF y compartí un link. El cliente aprueba sin crear una cuenta y el estado queda registrado.",
    bullets: [
      "Ítems, cantidades e importes con copia histórica.",
      "PDF listo y link público para el cliente.",
      "Aprobación o rechazo con actor y fecha.",
    ],
    Panel: QuotePanel,
  },
  {
    number: "04",
    title: "Lo que falta cobrar.",
    text: "Registrá pagos totales o parciales y el saldo se recalcula solo. La misma orden muestra cuánto entró, cuánto falta y qué presupuesto lo respalda.",
    bullets: [
      "Pagos totales, parciales y anulación.",
      "Saldo pendiente sobre la orden y el presupuesto.",
      "Cobros y trabajos en el mismo panel.",
    ],
    Panel: PaymentsPanel,
  },
] as const;

export function ProductStory() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const reduce = useReducedMotion();

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const target = window.innerHeight * 0.45;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      stepRefs.current.forEach((element, index) => {
        if (!element) return;
        const rect = element.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - target);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section
      id="producto"
      aria-labelledby="product-title"
      className="scroll-mt-20 bg-mk-panel text-mk-panel-text"
    >
      <div className="mx-auto max-w-none px-5 py-20 sm:px-8 sm:py-28">
        <SectionHeading
          title="La misma orden, de punta a punta."
          text="Cuatro piezas conectadas sobre el mismo trabajo. La misma orden, el mismo estado y la misma información para todos."
          titleId="product-title"
          tone="dark"
        />

        <div className="mt-14 grid min-w-0 gap-10 xl:grid-cols-[0.78fr_1.22fr] xl:gap-16">
          <ol className="min-w-0 space-y-8 xl:space-y-0">
            {steps.map((step, index) => {
              const Panel = step.Panel;
              const selected = active === index;
              return (
                <li
                  key={step.number}
                  ref={(element) => {
                    stepRefs.current[index] = element;
                  }}
                  aria-current={selected ? "step" : undefined}
                  className={cn(
                    "min-w-0 border-t border-white/10 pt-6 transition-colors duration-300 xl:flex xl:min-h-[62vh] xl:flex-col xl:justify-center xl:pt-0",
                    selected ? "border-white/30" : "",
                  )}
                >
                  <span className="mk-display text-[clamp(2.75rem,4.5vw,4rem)] leading-none font-semibold tracking-[-0.06em] text-mk-foil-gold">
                    {step.number}
                  </span>
                  <h3 className="mk-display mt-3 max-w-[18ch] text-[clamp(2.4rem,4.4vw,3.75rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance text-white">
                    {step.title}
                  </h3>
                  <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.65] text-mk-panel-muted">
                    {step.text}
                  </p>
                  <ul className="mt-7 space-y-3">
                    {step.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="flex gap-3 text-[16px] leading-[1.5] text-mk-panel-text"
                      >
                        <span
                          aria-hidden="true"
                          className="mt-2 size-1.5 shrink-0 rounded-full bg-mk-foil-gold"
                        />
                        {bullet}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 min-w-0 xl:hidden">
                    <Panel />
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="relative hidden min-w-0 xl:sticky xl:top-16 xl:block xl:h-[min(680px,calc(100svh-6rem))] xl:self-start">
            <div className="relative h-full overflow-hidden rounded-[28px] border border-white/10 bg-[#07080d]">
              <LazyOperationalScene className="absolute inset-0 opacity-80" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_25%,rgba(7,8,13,0.7)_100%)]" />
              <div className="relative z-10 flex h-full items-center p-4 sm:p-5">
                <div className="relative h-full w-full">
                  {steps.map((step, index) => {
                    const Panel = step.Panel;
                    return (
                      <motion.div
                        key={step.number}
                        initial={false}
                        animate={{
                          opacity: active === index ? 1 : 0,
                          y: active === index ? 0 : 16,
                          scale: active === index ? 1 : 0.985,
                        }}
                        transition={{
                          duration: reduce ? 0 : 0.4,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={cn(
                          "absolute inset-0 flex items-center",
                          active !== index && "pointer-events-none",
                        )}
                        aria-hidden={active !== index}
                      >
                        <div className="w-full">
                          <Panel />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
