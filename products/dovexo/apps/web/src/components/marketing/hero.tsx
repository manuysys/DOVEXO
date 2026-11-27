import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { heroCopy } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { QuoteDemo } from "./quote-demo";
import { ctaOutlineInk, ctaPrimary, focusLight } from "./ui";

/**
 * Hero: titular grande, un solo objeto real y una acción. Sin etiquetas
 * decorativas ni microcopys; el presupuesto se aprueba en el lugar.
 */
export function Hero() {
  return (
    <section
      id="contenido"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] items-center bg-mk-paper pt-24 pb-14 sm:pt-28 sm:pb-20"
    >
      <div
        aria-hidden="true"
        className="mk-grid-light mk-grid-fade pointer-events-none absolute inset-0 opacity-60"
      />
      <div className="relative mx-auto grid w-full max-w-none items-center gap-12 px-5 sm:px-8 xl:grid-cols-[1.02fr_0.98fr] xl:gap-10">
        <div className="min-w-0">
          <h1
            id="hero-title"
            aria-label={`${heroCopy.title} ${heroCopy.titleAccent}`}
            className="mk-display text-[clamp(3.5rem,7.8vw,7.75rem)] leading-[0.86] font-semibold tracking-[-0.065em] text-mk-ink"
          >
            <span className="block overflow-hidden pb-2">
              <span className="mk-line block">{heroCopy.title}</span>
            </span>{" "}
            <span className="block overflow-hidden pb-3">
              <span className="mk-line mk-line-2 block">{heroCopy.titleAccent}</span>
            </span>
          </h1>

          <p
            className="mk-rise mt-7 max-w-[46ch] text-[18px] leading-[1.55] text-mk-ink/75 sm:text-[20px]"
            style={{ animationDelay: "140ms" }}
          >
            {heroCopy.description}
          </p>

          <div
            className="mk-rise mt-9 flex flex-col gap-3 sm:flex-row"
            style={{ animationDelay: "220ms" }}
          >
            <Link
              href="/register"
              className={cn(ctaPrimary, "group rounded-full px-6 py-3.5", focusLight)}
            >
              Crear mi empresa
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="#producto"
              className={cn(ctaOutlineInk, "rounded-full px-6 py-3.5", focusLight)}
            >
              Ver el producto
            </Link>
          </div>
        </div>

        <div className="mk-rise min-w-0 xl:pl-4" style={{ animationDelay: "220ms" }}>
          <div className="mx-auto w-full max-w-[560px]">
            <QuoteDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
