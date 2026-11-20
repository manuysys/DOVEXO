import Link from "next/link";

import { featureCards } from "@/lib/marketing/content";

const modules = featureCards.filter((feature) => feature.id !== "whatsapp");

/*
 * Índice de módulos: una tabla de contenidos, no nueve tarjetas con sombra.
 * Todo lo listado está operativo; WhatsApp queda aparte porque requiere
 * credenciales de Meta.
 */
export function ModuleIndex() {
  return (
    <section
      id="funciones"
      aria-labelledby="modules-title"
      className="scroll-mt-20 border-y border-mk-line bg-mk-paper-2 py-16 sm:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-2 lg:grid-cols-[220px_1fr] lg:gap-8">
          <div className="flex items-center gap-3">
            <b className="mk-label text-mk-signal-strong">02</b>
            <span aria-hidden="true" className="h-px w-8 bg-mk-signal" />
            <span className="mk-label text-mk-slate">Módulos</span>
          </div>
          <div>
            <h2
              id="modules-title"
              className="max-w-[24ch] text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.06] font-bold tracking-[-0.03em] text-balance text-mk-ink"
            >
              Lo que ya funciona, módulo por módulo.
            </h2>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-[1.6] text-mk-ink/75">
              Sin promesas de roadmap: todo lo que sigue está operativo en el tenant demo y
              comparte los mismos datos.
            </p>
          </div>
        </div>

        <ol className="mt-10 grid gap-x-10 gap-y-0 md:grid-cols-2">
          {modules.map((module, index) => (
            <li
              key={module.id}
              className="group flex gap-4 border-t border-mk-line py-4 transition-colors last:border-b md:last:border-b-0"
            >
              <span className="mk-label mt-1 w-6 shrink-0 text-mk-signal-strong">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold tracking-[-0.01em] text-mk-ink">
                  {module.title}
                </h3>
                <p className="mt-1 text-sm leading-[1.5] text-mk-ink/70">{module.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 border-t border-mk-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-[12px] leading-[1.5] text-mk-slate">
            <span className="font-semibold text-mk-ink">WhatsApp Cloud API oficial:</span> se
            configura con credenciales de Meta por empresa. Sin ellas no se envía ningún mensaje y
            el resto de la plataforma funciona igual.
          </p>
          <Link
            href="#producto"
            className="shrink-0 rounded text-sm font-semibold text-mk-ink underline decoration-mk-signal decoration-2 underline-offset-4 hover:text-mk-signal-strong"
          >
            Ver las pantallas del producto →
          </Link>
        </div>
      </div>
    </section>
  );
}
