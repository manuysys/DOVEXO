"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useCallback, useState } from "react";

import { demoRefs, getQuote } from "@/lib/marketing/demo-data";
import { formatArs } from "@/lib/marketing/pricing";
import { cn } from "@/lib/utils";

import { HeroFallback } from "./hero-fallback";
import { HeroScene } from "./hero-scene";

type ChipProps = {
  className: string;
  delay: number;
  accent: "primary" | "teal" | "amber";
  title: string;
  children: ReactNode;
};

function Chip({ className, delay, accent, title, children }: ChipProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.7, 0.2, 1] }}
      className={cn(
        "absolute w-52 rounded-ds-md border border-white/12 bg-[#0B1220]/90 p-3 text-white shadow-[0_24px_60px_-24px_rgb(0_0_0/0.9)] backdrop-blur-sm sm:w-60",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-3 left-0 w-0.5 rounded-full",
          accent === "primary" && "bg-primary",
          accent === "teal" && "bg-accent-teal",
          accent === "amber" && "bg-amber",
        )}
      />
      <p
        className={cn(
          "text-[11px] font-medium",
          accent === "primary" && "text-secondary",
          accent === "teal" && "text-accent-teal",
          accent === "amber" && "text-amber",
        )}
      >
        {title}
      </p>
      {children}
    </motion.div>
  );
}

/*
 * Visual del héroe: escena isométrica propia (Three.js en desktop, SVG en
 * mobile/reduced motion) con tarjetas de producto flotando. Sin watermark de
 * terceros y con la misma paleta del design system. Los datos salen de
 * demo-data.ts.
 */
export function HeroVisual() {
  const [sceneReady, setSceneReady] = useState(false);
  const handleReady = useCallback(() => setSceneReady(true), []);
  const approvedQuote = getQuote(demoRefs.approvedQuoteId);

  return (
    <div className="relative mx-auto aspect-[4/4.4] w-full max-w-[38rem] sm:aspect-[5/4] lg:aspect-[6/5] lg:max-w-none">
      <div className="absolute inset-0 overflow-hidden rounded-[2rem]">
        <HeroFallback
          className={cn(
            "transition-opacity duration-700",
            sceneReady && "lg:opacity-0",
          )}
        />
        <HeroScene onReady={handleReady} />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#0B1220_100%)]"
        />
      </div>

      <Chip
        className="top-[6%] left-0 sm:left-2"
        delay={0.35}
        accent="teal"
        title={`Orden ${demoRefs.activeOrderId}`}
      >
        <p className="mt-1 text-sm font-semibold">Instalación de A/C split</p>
        <p className="text-[11px] text-white/65">Martín · 08:30 · En curso</p>
      </Chip>

      <Chip
        className="right-0 bottom-[22%]"
        delay={0.55}
        accent="amber"
        title="Presupuesto aprobado"
      >
        <p className="mt-1 text-sm font-semibold">{approvedQuote.id}</p>
        <p className="font-mono text-xs text-white/85">{formatArs(approvedQuote.total)}</p>
        <p className="mt-1 text-[10px] text-white/55">Aprobado desde el link público</p>
      </Chip>

      <Chip
        className="bottom-[4%] left-[6%] hidden sm:block"
        delay={0.75}
        accent="primary"
        title="Cobro parcial"
      >
        <p className="mt-1 text-xs text-white/80">
          Registrado <span className="font-mono">{formatArs(20000)}</span>
        </p>
        <p className="text-[10px] text-white/55">El saldo queda asociado a la orden</p>
      </Chip>

      <p className="absolute right-3 bottom-1 text-[10px] text-white/45">
        Escena 3D · datos ilustrativos
      </p>
    </div>
  );
}
