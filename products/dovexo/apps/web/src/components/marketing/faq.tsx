import { Mail, Plus } from "lucide-react";

import { brand } from "@/lib/brand";
import { faqItems } from "@/lib/marketing/content";

import { SectionHeading } from "./section-heading";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal";

/* Acordeón nativo con <details>: accesible por teclado y sin JavaScript. */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 bg-mk-paper py-16 sm:py-24">
      <div className="mx-auto grid max-w-none gap-10 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <SectionHeading
            title="Lo que suele preguntarse antes de empezar."
            text="Respuestas sobre el estado real del producto, sin promesas de funciones que todavía no están operativas."
            titleId="faq-title"
          />

          <div className="mt-8 rounded-2xl border border-mk-line bg-mk-paper-2 p-5">
            <p className="text-[16px] flex items-center gap-2 font-semibold text-mk-ink">
              <Mail className="size-4 text-mk-signal" aria-hidden="true" />
              ¿Quedó otra duda?
            </p>
            <p className="text-[15px] leading-[1.55] mt-2 text-mk-slate">
              Escribinos y te respondemos. Todavía no hay un canal formal de soporte ni tiempos de
              respuesta comprometidos.
            </p>
            <a
              href={`mailto:${brand.email}`}
              className={`text-[15px] mt-3 inline-flex rounded font-semibold text-mk-signal-strong underline underline-offset-4 ${focusRing}`}
            >
              {brand.email}
            </a>
          </div>
        </div>

        <div className="divide-y divide-mk-line border-y border-mk-line">
          {faqItems.map((item) => (
            <details key={item.question} className="group">
              <summary
                className={`text-body flex cursor-pointer list-none items-center justify-between gap-4 rounded py-4 text-left font-semibold text-mk-ink [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                {item.question}
                <span
                  aria-hidden="true"
                  className="grid size-7 shrink-0 place-items-center rounded-full border border-mk-line bg-mk-paper text-mk-slate transition-colors group-open:border-mk-signal/40 group-open:bg-mk-signal/5 group-open:text-mk-signal-strong"
                >
                  <Plus className="size-4 transition-transform duration-200 group-open:rotate-45" />
                </span>
              </summary>
              <p className="text-[15px] leading-[1.6] max-w-2xl pr-10 pb-5 text-mk-slate">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

