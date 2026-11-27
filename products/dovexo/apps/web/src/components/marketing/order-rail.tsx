"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

type Station = {
  id: string;
  number: string;
  title: string;
  text: string;
  roles: readonly string[];
  image: string;
  alt: string;
  stamp: string;
  position: string;
};

const stations: readonly Station[] = [
  {
    id: "solicitud",
    number: "01",
    title: "Solicitud",
    text: "Entra por el portal, el teléfono o la oficina. Queda con cliente, dirección y motivo.",
    roles: ["Oficina", "Cliente"],
    image: "/product-tour/orders-v4.webp",
    alt: "Órdenes de trabajo en DOVEXO",
    stamp: "Recibida",
    position: "object-left-top",
  },
  {
    id: "turno",
    number: "02",
    title: "Turno",
    text: "Se asigna el técnico y se controla el solapamiento antes de confirmar la visita.",
    roles: ["Oficina", "Técnico"],
    image: "/product-tour/agenda-v4.webp",
    alt: "Agenda del día con los turnos asignados",
    stamp: "Agendada",
    position: "object-left-top",
  },
  {
    id: "presupuesto",
    number: "03",
    title: "Presupuesto",
    text: "El cliente lo ve y lo aprueba desde un link, sin crear una cuenta.",
    roles: ["Oficina", "Cliente"],
    image: "/product-tour/quotes-v4.webp",
    alt: "Presupuestos con estados e importes",
    stamp: "Aprobada",
    position: "object-left-top",
  },
  {
    id: "cobro",
    number: "04",
    title: "Cobro",
    text: "Total o parcial. El saldo queda asociado a la misma orden y a la vista.",
    roles: ["Oficina"],
    image: "/product-tour/portal.webp",
    alt: "Portal del cliente con pagos y saldo",
    stamp: "Cobrada",
    position: "object-[50%_0%]",
  },
] as const;

export function OrderRail() {
  const [active, setActive] = useState(0);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);
  const sectionRef = useRef<HTMLElement | null>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useEffect(() => {
    let ticking = false;

    const update = () => {
      ticking = false;
      const target = window.innerHeight * 0.45;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      itemRefs.current.forEach((element, index) => {
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
      ref={sectionRef}
      id="recorrido"
      aria-labelledby="rail-title"
      className="scroll-mt-24 border-y border-mk-line bg-mk-paper py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:gap-8">
          <div className="flex items-center gap-3">
            <b className="mk-label text-mk-signal-strong">01</b>
            <span aria-hidden="true" className="h-px w-8 bg-mk-signal" />
            <span className="mk-label text-mk-slate">Una sola orden</span>
          </div>
          <div>
            <h2
              id="rail-title"
              className="mk-display max-w-[22ch] text-[clamp(2.25rem,4.2vw,3.5rem)] leading-[1] font-medium tracking-[-0.03em] text-balance text-mk-ink"
            >
              La misma orden, de punta a punta.
            </h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.6] text-mk-ink/75">
              Nace en una solicitud, se agenda, se presupuesta y se cobra. Cada paso queda
              registrado con su actor y su fecha; la oficina, el técnico y el cliente miran la
              misma verdad.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-12">
          <ol className="order-2 space-y-2 lg:order-1">
            {stations.map((station, index) => {
              const selected = active === index;
              return (
                <li
                  key={station.id}
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  data-index={index}
                >
                  <motion.button
                    type="button"
                    onClick={() => {
                      setActive(index);
                      itemRefs.current[index]?.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      });
                    }}
                    whileHover={reduce ? undefined : { x: 3 }}
                    whileTap={reduce ? undefined : { scale: 0.995 }}
                    transition={{ type: "spring", stiffness: 320, damping: 26 }}
                    aria-pressed={selected}
                    className={cn(
                      "group grid w-full grid-cols-[2.5rem_1fr] gap-4 rounded-md border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal sm:p-5",
                      selected
                        ? "border-mk-ink/35 bg-mk-paper-2"
                        : "border-transparent hover:border-mk-line hover:bg-mk-paper-2/60",
                    )}
                  >
                    <span
                      className={cn(
                        "mk-label mt-1 grid size-8 place-items-center rounded-full border",
                        selected
                          ? "border-mk-signal-strong bg-mk-signal-strong text-mk-paper"
                          : "border-mk-line text-mk-slate",
                      )}
                    >
                      {station.number}
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[19px] font-bold tracking-[-0.01em] text-mk-ink">
                          {station.title}
                        </span>
                        <span className="flex flex-wrap gap-1.5">
                          {station.roles.map((role) => (
                            <span
                              key={role}
                              className="rounded-[2px] border border-mk-line px-1.5 py-0.5 text-[9px] font-bold tracking-[0.1em] uppercase text-mk-slate"
                            >
                              {role}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="mt-1 block text-[14px] leading-[1.5] text-mk-ink/75">
                        {station.text}
                      </span>
                      <span className="mt-2 flex items-center gap-2 font-mono text-[10px] tracking-[-0.02em] text-mk-slate">
                        OT-2026-0001
                        <span className="h-px w-4 bg-mk-line" />
                        <span className="text-mk-signal-strong">{station.stamp}</span>
                      </span>
                    </span>
                  </motion.button>
                </li>
              );
            })}
          </ol>

          <div className="sticky top-16 z-20 order-1 -mx-4 bg-mk-paper px-4 pt-1 pb-2 lg:static lg:order-2 lg:mx-0 lg:px-0 lg:py-0">
            <div className="lg:sticky lg:top-24">
              <div
                aria-hidden="true"
                className="relative aspect-[16/10] overflow-hidden rounded-md border border-mk-ink/20 bg-white shadow-[0_26px_55px_-40px_rgb(18_59_49/0.45)]"
              >
                {stations.map((station, index) => (
                  <motion.div
                    key={station.id}
                    initial={false}
                    animate={{
                      opacity: active === index ? 1 : 0,
                      scale: active === index ? 1 : 1.025,
                    }}
                    transition={{
                      duration: reduce ? 0 : 0.45,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={station.image}
                      alt={station.alt}
                      width={1440}
                      height={900}
                      sizes="(min-width: 1024px) 52vw, 92vw"
                      className={cn("h-full w-full object-cover", station.position)}
                    />
                  </motion.div>
                ))}

                <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 border-b border-mk-line bg-mk-paper/95 px-3 py-2 backdrop-blur-[2px]">
                  <span className="mk-label text-[9px] text-mk-slate">
                    {stations[active].number} · {stations[active].title}
                  </span>
                  <span className="font-mono text-[9px] tracking-[-0.02em] text-mk-slate">
                    OT-2026-0001
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 rounded-[2px] border border-mk-ink/20 bg-mk-paper/95 px-2 py-1.5 shadow-sm">
                  <span className="mk-label block text-[8px] text-mk-slate">Estado</span>
                  <span className="text-[11px] font-bold text-mk-signal-strong">
                    {stations[active].stamp}
                  </span>
                </div>
              </div>

              <div
                aria-hidden="true"
                className="mt-3 flex items-center justify-between gap-2 font-mono text-[10px] text-mk-slate"
              >
                {stations.map((station, index) => (
                  <span
                    key={station.id}
                    className={cn(
                      "transition-colors",
                      active === index ? "font-bold text-mk-signal-strong" : "",
                    )}
                  >
                    {station.number}
                  </span>
                ))}
              </div>
              <div aria-hidden="true" className="mt-2 h-px bg-mk-line">
                <motion.div
                  style={{ scaleX: reduce ? 1 : progress }}
                  className="h-px origin-left bg-mk-signal"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
