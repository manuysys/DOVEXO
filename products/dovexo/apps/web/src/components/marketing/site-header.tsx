"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { brand } from "@/lib/brand";
import { navLinks } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

import { ctaPrimary, focusLight } from "./ui";

/*
 * Cabecera de la landing: papel opaco, filete de 1 px y tinta. Sin blur ni
 * transparencias para que el contenido no se vea a través de la barra.
 */
export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-mk-paper text-mk-ink">
      <a
        href="#contenido"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-mk-ink focus:px-3 focus:py-2 focus:font-semibold focus:text-mk-paper",
          focusLight,
        )}
      >
        Saltar al contenido
      </a>
      <div className="mx-auto flex h-16 max-w-none items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          href="/"
          className={cn("flex items-center gap-2.5 rounded-lg", focusLight)}
        >
          <span
            aria-hidden="true"
            className="mk-wordmark grid size-[26px] place-items-center rounded-[3px] bg-mk-ink text-[13px] font-bold text-mk-paper"
          >
            D
          </span>
          <span className="mk-wordmark text-lg font-bold tracking-[-0.03em]">
            {brand.name}
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium text-mk-ink/75 underline-offset-[10px] transition-colors hover:text-mk-ink hover:underline hover:decoration-mk-signal hover:decoration-2",
                focusLight,
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className={cn(
              "hidden rounded-lg px-2 py-2 text-sm font-medium text-mk-ink/80 transition-colors hover:text-mk-ink sm:inline-flex",
              focusLight,
            )}
          >
            Ingresar
          </Link>
          <Link
            href="/register"
            className={cn(
              "hidden rounded-lg bg-mk-ink px-4 py-2.5 text-sm font-semibold text-mk-paper transition-colors hover:bg-mk-ink-hover sm:inline-flex",
              focusLight,
            )}
          >
            Crear mi empresa
          </Link>

          <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Dialog.Trigger asChild>
              <button
                type="button"
                aria-label="Abrir menú"
                aria-expanded={menuOpen}
                className={cn(
                  "grid size-10 place-items-center rounded-lg border border-mk-line bg-mk-paper text-mk-ink lg:hidden",
                  focusLight,
                )}
              >
                <Menu className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-mk-ink/30" />
              <Dialog.Content className="fixed inset-x-0 top-0 z-50 rounded-b-2xl border-b border-mk-line bg-mk-paper p-5 text-mk-ink shadow-xl">
                <div className="flex items-center justify-between">
                  <Dialog.Title className="font-display text-lg font-semibold">Menú</Dialog.Title>
                  <Dialog.Close
                    aria-label="Cerrar menú"
                    className={cn("grid size-10 place-items-center rounded-lg", focusLight)}
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Dialog.Close>
                </div>
                <Dialog.Description className="sr-only">
                  Navegación de la landing y accesos de ingreso y registro.
                </Dialog.Description>
                <nav aria-label="Móvil" className="mt-4 flex flex-col">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "rounded-lg px-3 py-3 text-base font-medium hover:bg-mk-ink/5",
                        focusLight,
                      )}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
                <div className="mt-4 grid gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "rounded-lg border border-mk-ink px-4 py-3 text-center text-sm font-semibold text-mk-ink",
                      focusLight,
                    )}
                  >
                    Ingresar
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className={cn(ctaPrimary, "justify-center", focusLight)}
                  >
                    Crear mi empresa
                  </Link>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
