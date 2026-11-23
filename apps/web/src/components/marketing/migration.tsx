import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { LazyGlassFolder } from "./lazy-glass-folder";
import { SectionHeading } from "./section-heading";

const bullets = [
  "CSV o XLSX, hasta 500 filas por archivo.",
  "Vista previa con duplicados y errores por línea.",
  "El importador crea clientes; las órdenes se cargan desde la bandeja.",
] as const;

/**
 * Migración con el objeto real: una carpeta de vidrio con los archivos que
 * entran. No hay captura de pantalla ni contador; la carpeta se abre y se
 * puede recorrer.
 */
export function Migration() {
  return (
    <section
      id="migracion"
      aria-labelledby="migration-title"
      className="scroll-mt-20 border-y border-mk-line bg-mk-paper-2 py-20 sm:py-28"
    >
      <div className="mx-auto grid max-w-none gap-12 px-5 sm:px-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-center xl:gap-16">
        <div>
          <SectionHeading
            title="De la planilla a DOVEXO."
            text="No tenés que cargar la cartera a mano ni empezar de cero. Importá los clientes, ordená servicios y equipo, y creá la primera orden."
            titleId="migration-title"
          />
          <ul className="mt-7 space-y-3">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex gap-3 text-[16px] leading-[1.55] text-mk-ink/80">
                <Check className="mt-1 size-4 shrink-0 text-mk-signal" aria-hidden="true" />
                {bullet}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[15px] leading-[1.5] text-mk-slate">
            La importación de esta página usa datos ficticios. No se sube ningún archivo.
          </p>
          <Link
            href="/register"
            className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-mk-ink px-6 py-3 text-sm font-semibold text-mk-paper transition-colors hover:bg-mk-ink-hover"
          >
            Crear mi empresa
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="relative mx-auto flex w-full max-w-[640px] flex-col items-center justify-center sm:grid sm:grid-cols-[250px_260px] sm:items-center sm:justify-center sm:gap-3 xl:justify-end">
          <div className="relative hidden w-[250px] -rotate-3 rounded-2xl border border-mk-line bg-mk-paper-2 p-4 shadow-[0_24px_50px_-38px_rgb(15_15_15/0.5)] sm:block">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[15px] font-semibold text-mk-ink">clientes.xlsx</p>
              <span className="text-[13px] text-mk-slate">128 filas</span>
            </div>
            <div className="mt-3 space-y-1.5 border-y border-mk-line py-3">
              {[
                ["Laura Gómez", "Palermo"],
                ["Carlos Pérez", "Villa Crespo"],
                ["Sofía Rodríguez", "Caballito"],
                ["Martín Sosa", "Flores"],
              ].map(([name, zone]) => (
                <div
                  key={name}
                  className="grid grid-cols-[1.4fr_0.8fr] gap-2 text-[13px] text-mk-ink/75"
                >
                  <span className="truncate">{name}</span>
                  <span className="truncate text-mk-slate">{zone}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-mk-foil-teal">124 válidas</span>
              <span className="text-mk-signal-strong">4 con error</span>
            </div>
          </div>

          <div className="relative z-10 mx-auto sm:justify-self-end">
            <LazyGlassFolder
              label="Clientes"
              meta="128 filas"
              tone="light"
              art="aurora"
              seed={4}
              width={260}
              action="add"
              autoAdd
              autoAddFile={{
                name: "clientes-extra.csv",
                meta: "12 filas",
                art: "glacier",
              }}
              labelPlacement="top-left"
              files={[
                { name: "clientes.xlsx", meta: "128 filas", art: "aurora" },
                { name: "ordenes.csv", meta: "2026", art: "ember" },
                { name: "presupuestos.pdf", meta: "PDF · 1.2 MB" },
                { name: "servicios.csv", meta: "20 servicios", art: "verdant" },
              ]}
            />
            <div className="mk-float-soft absolute -bottom-3 -left-8 z-20 hidden rounded-xl border border-mk-line bg-mk-paper px-3 py-2 text-[13px] font-medium text-mk-ink shadow-[0_14px_30px_-24px_rgb(15_15_15/0.6)] xl:block">
              clientes-extra.csv
            </div>
          </div>

          <div className="mt-5 w-full rounded-2xl border border-mk-line bg-mk-paper-2 px-4 py-3 text-center text-[14px] text-mk-ink/75 sm:hidden">
            128 filas · 124 válidas · 4 con error
          </div>
        </div>
      </div>
    </section>
  );
}
