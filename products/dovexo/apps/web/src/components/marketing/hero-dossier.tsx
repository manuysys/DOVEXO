import Image from "next/image";

import { FoilSeal } from "./foil-seal";

/**
 * El expediente del hero: panel real, presupuesto aprobado, sello y una
 * aproximación del celular del técnico. Las capas son HTML/CSS para que el
 * encuadre sea responsive y la captura no se deforme.
 *
 * El halo y el sello vienen de la materialidad de Originkit; el teléfono que
 * flota y la composición tipográfica, de Anubi. La imagen queda fuera de un
 * componente cliente para que el LCP no dependa de la hidratación.
 */
export function HeroDossier() {
  return (
    <div className="relative w-full">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 z-0 size-[min(92vw,620px)] -translate-x-1/2 -translate-y-1/2 lg:left-[46%]"
      >
        <div className="mk-halo size-full rounded-full" />
      </div>

      <span
        aria-hidden="true"
        className="mk-display pointer-events-none absolute top-1/2 -right-10 z-0 -translate-y-1/2 text-[clamp(6rem,14vw,12rem)] leading-none tracking-[-0.08em] text-mk-ink/[0.035] select-none"
      >
        ORDEN
      </span>

      <div className="relative mx-auto w-full max-w-[560px] lg:max-w-[680px]">
        <div
          aria-hidden="true"
          className="absolute inset-x-5 top-7 bottom-12 -rotate-2 rounded-md border border-mk-line bg-mk-paper-2 shadow-[0_18px_40px_-34px_rgb(18_59_49/0.35)]"
        />

        <figure
          aria-label="Panel de DOVEXO con la operación del día, presupuestos y cobros pendientes"
          className="relative z-10 mr-5 ml-1 overflow-hidden rounded-md border border-mk-ink/20 bg-white shadow-[0_26px_55px_-38px_rgb(18_59_49/0.45)] sm:mr-8 sm:ml-2"
        >
          <div className="flex items-center justify-between gap-3 border-b border-mk-line bg-mk-paper-2 px-3 py-2">
            <span className="mk-label text-[9px] text-mk-slate">Panel · Servicios Demo</span>
          </div>
          <div aria-hidden="true" className="relative aspect-[16/10] overflow-hidden">
            <Image
              src="/product-tour/dashboard-main-v4.webp"
              alt="Panel de DOVEXO con la operación del día, presupuestos y cobros pendientes"
              width={1169}
              height={730}
              priority
              fetchPriority="high"
              unoptimized
              sizes="(min-width: 1024px) 44vw, 92vw"
              className="h-full w-full object-cover object-left-top"
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent" />
          </div>
        </figure>

        <div className="absolute -bottom-6 left-1 z-20 w-[210px] -rotate-3 rounded-md border border-mk-ink/20 bg-mk-paper p-3 shadow-[0_18px_35px_-26px_rgb(18_59_49/0.55)] sm:w-[235px]">
          <p className="mk-label text-[9px] text-mk-slate">Presupuesto</p>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-mono text-[11px] text-mk-ink">QT-2026-0001</span>
            <span className="mk-display text-xl leading-none font-medium text-mk-ink">
              $95.500
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-mk-line pt-2">
            <span className="text-[10px] leading-tight text-mk-slate">Aprobado desde el link</span>
            <span className="shrink-0 rounded-[2px] border border-mk-signal-strong px-1.5 py-0.5 text-[8px] font-bold tracking-[0.12em] uppercase text-mk-signal-strong">
              Aprobado
            </span>
          </div>
        </div>

        <FoilSeal
          label="Aprobado"
          detail="QT-0001"
          size="md"
          className="mk-seal-in absolute -top-5 right-0 z-20 sm:-right-3"
        />

        <div className="mk-float-phone absolute -right-1 -bottom-12 z-20 hidden w-[118px] overflow-hidden rounded-[1.6rem] border-[5px] border-mk-ink bg-mk-ink shadow-[0_28px_55px_-30px_rgb(18_59_49/0.6)] xl:block">
          <Image
            src="/product-tour/tech.webp"
            alt="PWA del técnico con el próximo trabajo y la agenda del día"
            width={390}
            height={844}
            sizes="118px"
            className="h-auto w-full rounded-[1.2rem]"
          />
        </div>
      </div>
    </div>
  );
}
