import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { demoAccount } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { ctaGhostDark, focusDark } from "./ui";

/* CTA final: una decisión por columna, sobre tinta y sin decoración. */
export function FinalCta() {
  return (
    <section
      id="demo"
      aria-labelledby="final-cta-title"
      className="scroll-mt-16 bg-mk-ink text-mk-paper"
    >
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
        <div>
          <p className="mk-label inline-flex items-center gap-3 text-mk-paper/70">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            Empezar
          </p>
          <h2
            id="final-cta-title"
            className="mt-4 max-w-[18ch] text-[clamp(2rem,3.6vw,3rem)] leading-[1.04] font-bold tracking-[-0.03em] text-balance"
          >
            Probá la demo o creá tu empresa <span className="text-mk-signal">hoy.</span>
          </h2>
          <p className="mt-5 max-w-lg text-[16px] leading-[1.6] text-mk-paper/75">
            La demo tiene datos de ejemplo. Al crear tu empresa empezás con un espacio propio, sin
            datos compartidos con otras empresas.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-lg bg-mk-paper px-5 py-3.5 text-sm font-semibold text-mk-ink transition-colors hover:bg-white",
                focusDark,
              )}
            >
              Crear mi empresa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className={cn(ctaGhostDark, "py-3.5", focusDark)}>
              Probar la demo
            </Link>
          </div>
        </div>

        <div className="rounded-md border border-mk-paper/15 bg-mk-paper/5 p-6">
          <p className="text-small flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-mk-signal" aria-hidden="true" />
            Cuenta demo
          </p>
          <dl className="text-small mt-4 space-y-3">
            <div>
              <dt className="text-mk-paper/60">Email</dt>
              <dd className="font-mono break-all">{demoAccount.email}</dd>
            </div>
            <div>
              <dt className="text-mk-paper/60">Contraseña</dt>
              <dd className="font-mono">{demoAccount.password}</dd>
            </div>
          </dl>
          <p className="text-caption mt-4 text-mk-paper/60">
            Datos de ejemplo. No cargues información real de clientes en la demo.
          </p>
        </div>
      </div>
    </section>
  );
}
