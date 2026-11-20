import Link from "next/link";

import { brand } from "@/lib/brand";
import { navLinks } from "@/lib/marketing/content";

import { focusDark } from "./ui";

const linkClass = `text-small rounded text-white/70 transition-colors hover:text-white ${focusDark}`;
const columnTitle = "text-xs font-semibold tracking-[0.12em] text-white/50 uppercase";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-semibold text-white"
            >
              D
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">{brand.name}</span>
          </p>
          <p className="text-small mt-3 max-w-xs text-white/70">{brand.tagline}</p>
          <a
            href={`mailto:${brand.email}`}
            className={`text-small mt-4 inline-flex rounded font-medium underline underline-offset-4 ${focusDark}`}
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

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-caption text-white/60">
            © {year} {brand.legalName}. Hecho en Argentina · Montos en ARS.
          </p>
          <p className="text-caption text-white/60">La demo usa datos de ejemplo.</p>
        </div>
      </div>
    </footer>
  );
}
