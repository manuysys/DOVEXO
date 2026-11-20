import Link from "next/link";

import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

import { SiteFooter } from "./site-footer";

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mk-signal";

export type LegalSection = {
  title: string;
  paragraphs: readonly string[];
};

type LegalPageProps = {
  title: string;
  updatedAt: string;
  sections: readonly LegalSection[];
};

/** Layout de páginas legales. El contenido es borrador: revisar con asesor legal. */
export function LegalPage({ title, updatedAt, sections }: LegalPageProps) {
  return (
    <div className="mk-root bg-mk-paper text-mk-ink">
      <header className="border-b border-mk-line bg-mk-paper">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className={cn("rounded font-display text-lg font-semibold text-mk-ink", focusRing)}
          >
            {brand.name}
          </Link>
          <Link
            href="/"
            className={cn("rounded text-sm font-medium text-mk-ink underline", focusRing)}
          >
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-xs inline-flex rounded border border-mk-signal/30 bg-mk-signal/10 px-3 py-1 font-semibold text-mk-signal-strong">
          Borrador a revisar por asesor legal
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-mk-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-mk-slate">Última actualización: {updatedAt}</p>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-semibold text-mk-ink">{section.title}</h2>
              <div className="mt-3 space-y-3 text-base leading-7 text-mk-ink/85">
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
