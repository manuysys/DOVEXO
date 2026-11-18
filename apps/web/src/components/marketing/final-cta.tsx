import { ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { demoAccount } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { ctaGhostDark, ctaPrimary, focusDark } from "./ui";

/* CTA final: una decisión por columna, sin animación permanente ni blur. */
export function FinalCta() {
  return (
    <section
      id="demo"
      aria-labelledby="final-cta-title"
      className="relative isolate scroll-mt-16 overflow-hidden bg-deep text-white"
    >
      <div aria-hidden="true" className="mk-grid-dark mk-grid-fade absolute inset-0 -z-10 opacity-60" />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-label inline-flex items-center gap-3 text-mk-teal">
            <span aria-hidden="true" className="h-px w-6 bg-current" />
            Empezar
          </p>
          <h2 id="final-cta-title" className="text-h1 mt-4 text-balance">
            Probá la demo o creá tu empresa <span className="text-amber">hoy.</span>
          </h2>
          <p className="text-body mt-5 max-w-lg text-white/70">
            La demo tiene datos de ejemplo. Al crear tu empresa empezás con un espacio propio, sin
            datos compartidos con otras empresas.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className={cn(ctaPrimary, focusDark)}>
              Crear mi empresa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className={cn(ctaGhostDark, focusDark)}>
              Probar la demo
            </Link>
          </div>
        </div>

        <div className="rounded-ds-lg border border-white/10 bg-white/[0.04] p-6">
          <p className="text-small flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-mk-teal" aria-hidden="true" />
            Cuenta demo
          </p>
          <dl className="text-small mt-4 space-y-3">
            <div>
              <dt className="text-white/60">Email</dt>
              <dd className="font-mono break-all">{demoAccount.email}</dd>
            </div>
            <div>
              <dt className="text-white/60">Contraseña</dt>
              <dd className="font-mono">{demoAccount.password}</dd>
            </div>
          </dl>
          <p className="text-caption mt-4 text-white/60">
            Datos de ejemplo. No cargues información real de clientes en la demo.
          </p>
        </div>
      </div>
    </section>
  );
}
