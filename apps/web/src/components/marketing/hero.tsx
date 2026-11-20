import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { heroCopy } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { ctaOutlineInk, ctaPrimary, focusLight } from "./ui";

const proofItems = [
  "Datos aislados por empresa",
  "Link de presupuesto",
  "Historial de cada trabajo",
];

/*
 * Héroe claro: papel, tinta y una sola señal. El producto real es la imagen
 * principal; no hay 3D, gradientes ni animación de entrada.
 */
export function Hero() {
  return (
    <section
      id="contenido"
      aria-labelledby="hero-title"
      className="relative overflow-hidden bg-mk-paper pt-24 pb-16 sm:pt-28 sm:pb-20"
    >
      <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
        <div className="min-w-0">
          <p className="mk-label inline-flex items-center rounded border border-mk-line bg-mk-paper-2/60 px-2.5 py-1.5 text-mk-ink/80">
            {heroCopy.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="mt-6 font-display text-[clamp(2.5rem,5.3vw,4.75rem)] leading-[0.98] font-bold tracking-[-0.035em] text-balance text-mk-ink"
          >
            {heroCopy.title}
            <br />
            <span className="relative inline-block after:absolute after:inset-x-0 after:-bottom-1.5 after:h-[3px] after:rounded-full after:bg-mk-signal">
              {heroCopy.titleAccent}
            </span>
          </h1>

          <p className="mt-7 max-w-[44ch] text-[17px] leading-[1.6] text-mk-ink/80 sm:text-[19px]">
            {heroCopy.description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={cn(ctaPrimary, "px-6 py-3.5", focusLight)}>
              Crear mi empresa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className={cn(ctaOutlineInk, "px-6 py-3.5", focusLight)}>
              Ver la demo
            </Link>
          </div>
          <p className="mt-3 text-[13px] text-mk-slate">
            14 días. Sin tarjeta. La demo usa datos de ejemplo.
          </p>

          <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-mk-line pt-4 text-[12px] text-mk-slate">
            {proofItems.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1 rounded-full bg-mk-signal" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative min-w-0">
          <div className="relative aspect-[658/440] overflow-hidden rounded-lg border border-mk-ink/20 bg-white shadow-[0_24px_48px_-40px_rgb(18_59_49/0.35)]">
            <Image
              src="/product-tour/dashboard.webp"
              alt="Panel de DOVEXO con las órdenes, los presupuestos y el saldo del día"
              width={1440}
              height={900}
              priority
              sizes="(min-width: 1024px) 80vw, 175vw"
              className="absolute top-[-0.9%] left-[-0.8%] w-[175%] max-w-none"
            />

            <span
              aria-hidden="true"
              className="absolute top-[29%] left-[36%] grid size-5 place-items-center rounded-full border-2 border-mk-paper bg-mk-signal text-[9px] font-bold text-mk-paper"
            >
              1
            </span>
            <span
              aria-hidden="true"
              className="absolute top-[70%] left-[37%] grid size-5 place-items-center rounded-full border-2 border-mk-paper bg-mk-signal text-[9px] font-bold text-mk-paper"
            >
              2
            </span>
          </div>

          <div className="mt-2 flex flex-wrap justify-end gap-x-4 gap-y-1 text-[11px] text-mk-slate">
            <span>
              <b className="font-semibold text-mk-signal-strong">1</b> Operación del día
            </span>
            <span>
              <b className="font-semibold text-mk-signal-strong">2</b> Primeros pasos
            </span>
          </div>
          <p className="mt-1 text-right text-[11px] text-mk-slate">
            Captura real del tenant demo. Datos de ejemplo.
          </p>
        </div>
      </div>
    </section>
  );
}
