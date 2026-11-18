"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useCallback, useRef, useState } from "react";

import { demoRefs, getQuote } from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

import { HeroFallback } from "./hero-fallback";
import { HeroScene } from "./hero-scene";
import { PanelMockup, PhoneTechMockup } from "./mockups";
import { ServiceMap } from "./service-map";

/*
 * Visual del hero: escena 3D de fondo (desktop, lazy), ilustración isométrica
 * 2D del circuito de servicio y mockups reales del producto (panel + teléfono
 * + notificación). Todo el contenido sale de demo-data.ts y se rotula una sola
 * vez como datos ilustrativos. El parallax respeta prefers-reduced-motion.
 */
export function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [24, -40]);
  const cardsY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [-10, 34]);

  const handleReady = useCallback(() => setSceneReady(true), []);
  const approvedQuote = getQuote(demoRefs.approvedQuoteId);

  return (
    <div
      ref={ref}
      className="relative mx-auto aspect-[4/4.6] w-full max-w-[36rem] sm:aspect-[5/4] lg:aspect-[6/5] lg:max-w-none"
    >
      <motion.div className="absolute inset-0" style={{ y: sceneY }}>
        <HeroFallback
          className={cn("transition-opacity duration-700", sceneReady && "opacity-0")}
        />
        <HeroScene onReady={handleReady} />
      </motion.div>

      <div aria-hidden="true" className="absolute inset-0 opacity-70">
        <ServiceMap />
      </div>

      <motion.div className="absolute inset-0" style={{ y: cardsY }}>
        <div className="absolute top-[4%] left-0 w-[82%] lg:w-[76%]">
          <PanelMockup />
        </div>

        <div className="absolute right-0 bottom-[3%] hidden w-[34%] max-w-[190px] sm:block">
          <PhoneTechMockup />
        </div>

        <div className="absolute bottom-[7%] left-[2%] w-[58%] max-w-[260px] rounded-xl border border-white/15 bg-mk-ink-2/95 p-3 text-white shadow-[0_20px_50px_-24px_rgb(0_0_0/0.9)]">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-accent-teal">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-teal" />
            Presupuesto aprobado
          </p>
          <p className="mt-1 text-sm font-semibold">{approvedQuote.id}</p>
          <p className="font-mono text-xs text-white/85">{formatArs(approvedQuote.total)}</p>
          <p className="mt-1 text-[10px] text-white/60">Aprobado desde el link público</p>
        </div>
      </motion.div>

      <p className="absolute right-3 bottom-1 text-[10px] text-white/55">Datos ilustrativos</p>
    </div>
  );
}
