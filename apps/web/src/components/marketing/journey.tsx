import { journeySteps } from "@/lib/marketing/content";

import { Reveal } from "./reveal";

const total = journeySteps.length;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/*
 * Recorrido del trabajo como línea de tiempo estática: sin pin, sin parallax y
 * sin scroll secuestrado. Cada etapa entra con un reveal corto que respeta
 * `prefers-reduced-motion`.
 */
export function Journey() {
  return (
    <section
      id="recorrido"
      aria-labelledby="journey-title"
      className="relative isolate scroll-mt-16 overflow-hidden bg-deep py-20 text-white sm:py-28"
    >
      <div aria-hidden="true" className="mk-grid-dark mk-grid-fade absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-label inline-flex items-center gap-3 text-mk-teal">
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

        <ol className="relative">
          {journeySteps.map((step, index) => (
            <li key={step.id} className="flex gap-4 pb-8 last:pb-0 sm:gap-5">
              <div className="flex flex-col items-center">
                <span className="numeric text-xs grid size-8 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 font-semibold text-white sm:size-10">
                  {pad(index + 1)}
                </span>
                {index < total - 1 && (
                  <span aria-hidden="true" className="mt-2 w-px flex-1 bg-white/10" />
                )}
              </div>
              <Reveal delay={Math.min(index * 0.04, 0.2)} className="min-w-0 flex-1">
                <h3 className="text-h3">{step.title}</h3>
                <p className="text-body mt-1.5 max-w-lg text-white/70">{step.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
