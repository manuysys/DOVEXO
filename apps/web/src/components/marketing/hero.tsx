import { ArrowRight, History, Link2, ShieldCheck } from "lucide-react";
import Link from "next/link";

import { demoAccount, heroCopy } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { HeroVisual } from "./hero-visual";
import { ctaGhostDark, ctaPrimary, delayStyle, focusDark } from "./ui";

const trustItems = [
  { icon: ShieldCheck, label: "Datos aislados por empresa" },
  { icon: Link2, label: "Links de presupuesto seguros" },
  { icon: History, label: "Historial de cada trabajo" },
];

/* Hero full-bleed en deep. El texto entra con CSS (sin esperar JS) para que el LCP sea el titular. */
export function Hero() {
  return (
    <section
      id="contenido"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100svh] scroll-mt-16 items-center overflow-hidden bg-deep pt-24 pb-14 text-white sm:pb-20 lg:pt-28"
    >
      <div aria-hidden="true" className="mk-grid-dark mk-grid-fade absolute inset-0 -z-10" />
      <div aria-hidden="true" className="mk-scan" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.02fr_1fr] lg:gap-10">
        <div>
          <p
            className="mk-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/85"
            style={delayStyle(0)}
          >
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent-teal" />
            {heroCopy.eyebrow}
          </p>

          <h1
            id="hero-title"
            className="mk-rise mt-6 font-display text-[clamp(2.5rem,5.4vw,4.6rem)] leading-[0.99] font-semibold tracking-[-0.035em] text-balance"
            style={delayStyle(80)}
          >
            {heroCopy.title} <span className="text-amber">{heroCopy.titleAccent}</span>
          </h1>

          <p
            className="mk-rise mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg"
            style={delayStyle(160)}
          >
            {heroCopy.description}
          </p>

          <div className="mk-rise mt-8 flex flex-col gap-3 sm:flex-row" style={delayStyle(240)}>
            <Link href="/register" className={cn(ctaPrimary, focusDark)}>
              Crear mi empresa
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/login" className={cn(ctaGhostDark, focusDark)}>
              Probar la demo
            </Link>
          </div>
          <p className="mk-rise mt-3 text-xs text-white/60" style={delayStyle(280)}>
            14 días de prueba. Sin tarjeta. Podés empezar hoy.
          </p>

          <ul
            className="mk-rise mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70"
            style={delayStyle(320)}
          >
            {trustItems.map((item) => (
              <li key={item.label} className="flex items-center gap-1.5">
                <item.icon className="size-3.5 text-accent-teal" aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>

          <details className="mk-rise mt-6 max-w-md text-xs text-white/60" style={delayStyle(360)}>
            <summary className="cursor-pointer rounded-md font-medium text-white/75 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber">
              Ver credenciales de la demo
            </summary>
            <p className="mt-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
              Email: <code className="font-mono text-white">{demoAccount.email}</code> · Contraseña:{" "}
              <code className="font-mono text-white">{demoAccount.password}</code>
            </p>
          </details>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
