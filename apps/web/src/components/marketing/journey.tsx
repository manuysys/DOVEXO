"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import { journeySteps } from "@/lib/marketing/content";

gsap.registerPlugin(ScrollTrigger);

const total = journeySteps.length;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/*
 * Recorrido del trabajo con una línea de progreso que se dibuja con el scroll
 * (GSAP ScrollTrigger, scrub) y entrada escalonada de cada etapa. Respeta
 * `prefers-reduced-motion`: en ese caso queda todo estático y visible.
 */
export function Journey() {
  const sectionRef = useRef<HTMLElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.from(".journey-step", {
        y: 26,
        opacity: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: {
          trigger: listRef.current,
          start: "top 78%",
          once: true,
        },
      });

      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 72%",
            end: "bottom 62%",
            scrub: 0.6,
          },
        },
      );

      gsap.to(".journey-grid", {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="recorrido"
      aria-labelledby="journey-title"
      className="bg-deep relative isolate scroll-mt-16 overflow-hidden py-20 text-white sm:py-28"
    >
      <div
        aria-hidden="true"
        className="journey-grid mk-grid-dark mk-grid-fade absolute inset-0 -z-10 opacity-60"
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-label text-accent-teal inline-flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            Recorrido
          </p>
          <h2 id="journey-title" className="text-h1 mt-4 text-balance">
            Del primer pedido al cobro, sin volver a cargar datos.
          </h2>
          <p className="text-body mt-5 max-w-md text-white/70">
            Cada paso alimenta al siguiente. La oficina, el técnico y el cliente trabajan sobre el
            mismo registro.
          </p>

          <ol
            aria-label="Etapas del recorrido"
            className="text-caption mt-8 flex flex-wrap items-center gap-x-2 gap-y-2 text-white/70"
          >
            {journeySteps.map((step, index) => (
              <li key={step.id} className="flex items-center gap-2">
                <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                  {step.title}
                </span>
                {index < total - 1 && (
                  <span aria-hidden="true" className="text-white/30">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>

          <p className="text-caption mt-8 flex items-baseline gap-2 text-white/60">
            <span className="numeric text-h3 text-white">{pad(total)}</span>
            etapas, un solo registro.
          </p>
        </div>

        <ol ref={listRef} className="relative">
          <span
            ref={lineRef}
            aria-hidden="true"
            className="bg-primary/40 absolute top-0 left-4 h-full w-px origin-top sm:left-5"
          />
          {journeySteps.map((step, index) => (
            <li key={step.id} className="journey-step relative flex gap-4 pb-8 last:pb-0 sm:gap-5">
              <span className="numeric bg-deep relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-white/20 font-semibold text-white sm:size-10">
                {pad(index + 1)}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-h3">{step.title}</h3>
                <p className="text-body mt-1.5 max-w-lg text-white/70">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
