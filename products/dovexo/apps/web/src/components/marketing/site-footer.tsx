import Link from "next/link";

import { brand } from "@/lib/brand";
import { navLinks } from "@/lib/marketing/content";

import { focusDark } from "./ui";

const linkClass = `text-[14px] rounded text-mk-paper/75 transition-colors hover:text-mk-paper ${focusDark}`;
const columnTitle = "text-[15px] font-semibold text-mk-paper/80";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-mk-paper/15 bg-mk-ink text-mk-paper">
      <div className="mx-auto grid max-w-none gap-10 px-5 py-14 sm:px-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="mk-wordmark grid size-[26px] place-items-center rounded-[3px] bg-mk-paper text-[13px] font-bold text-mk-ink"
            >
              D
            </span>
            <span className="mk-wordmark text-lg font-bold tracking-[-0.03em]">{brand.name}</span>
          </p>
          <p className="mt-3 max-w-xs text-[15px] leading-[1.55] text-mk-paper/75">
            {brand.tagline}
          </p>
          <a
            href={`mailto:${brand.email}`}
            className={`mt-4 inline-flex rounded text-[15px] font-medium underline underline-offset-4 ${focusDark}`}
          >
            {brand.email}
          </a>
        </div>

        <nav aria-label="Producto">
          <p className={columnTitle}>Producto</p>
          <ul className="mt-3 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className={linkClass}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Cuenta">
          <p className={columnTitle}>Cuenta</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/login" className={linkClass}>
                Ingresar
              </Link>
            </li>
            <li>
              <Link href="/register" className={linkClass}>
                Crear mi empresa
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal">
          <p className={columnTitle}>Legal</p>
          <ul className="mt-3 space-y-2">
            <li>
              <Link href="/privacy" className={linkClass}>
                Política de privacidad
              </Link>
            </li>
            <li>
              <Link href="/terms" className={linkClass}>
                Términos y condiciones
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-mk-paper/15">
        <div className="mx-auto flex max-w-none flex-col gap-1 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[14px] text-mk-paper/70">
            © {year} {brand.legalName}. Hecho en Argentina · Montos en ARS.
          </p>
          <p className="text-[14px] text-mk-paper/70">La demo usa datos de ejemplo.</p>
        </div>
      </div>
    </footer>
  );
}

