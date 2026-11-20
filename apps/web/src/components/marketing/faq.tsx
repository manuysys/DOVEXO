import { Mail, Plus } from "lucide-react";

import { brand } from "@/lib/brand";
import { faqItems } from "@/lib/marketing/content";

import { SectionHeading } from "./section-heading";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/* Acordeón nativo con <details>: accesible por teclado y sin JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-surface py-20 sm:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            eyebrow="Preguntas frecuentes"
            title="Lo que suele preguntarse antes de empezar."
            text="Respuestas sobre el estado real del producto, sin promesas de funciones que todavía no están operativas."
            titleId="faq-title"
          />

          <div className="mt-8 rounded-ds-lg border border-border bg-bg p-5">
            <p className="text-small flex items-center gap-2 font-semibold text-text">
              <Mail className="size-4 text-primary" aria-hidden="true" />
              ¿Quedó otra duda?
            </p>
            <p className="text-small mt-2 text-text-2">
              Escribinos y te respondemos. Todavía no hay un canal formal de soporte ni tiempos de
              respuesta comprometidos.
            </p>
            <a
              href={`mailto:${brand.email}`}
              className={`text-small mt-3 inline-flex rounded font-semibold text-primary underline underline-offset-4 ${focusRing}`}
            >
              {brand.email}
            </a>
          </div>
        </div>

        <div className="divide-y divide-border border-y border-border">
          {faqItems.map((item) => (
            <details key={item.question} className="group">
              <summary
                className={`text-body flex cursor-pointer list-none items-center justify-between gap-4 rounded py-4 text-left font-semibold text-text [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {item.question}
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-border bg-bg text-text-2 transition-colors group-open:border-primary/30 group-open:bg-info-soft group-open:text-primary"
                >
                  <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" />
                </span>
              </summary>
              <p className="text-small max-w-2xl pr-10 pb-5 text-text-2">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
