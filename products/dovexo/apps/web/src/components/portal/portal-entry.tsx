"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Link2Off,
  Loader2,
  MonitorSmartphone,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { PortalPublicInfo } from "@/lib/portal-api";

type PortalEntryProps = {
  slug: string;
  token: string;
  info: PortalPublicInfo | undefined;
  error: string | null;
  isVerifying: boolean;
  isDemoLoading: boolean;
  demoAvailable: boolean;
  onEnterBrowser: () => void;
  onOpenDemo: () => void;
};

export function PortalEntry({
  slug,
  token,
  info,
  error,
  isVerifying,
  isDemoLoading,
  demoAvailable,
  onEnterBrowser,
  onOpenDemo,
}: PortalEntryProps) {
  const [copied, setCopied] = useState(false);
  const companyName = info?.portal.display_name ?? info?.tenant.name ?? null;
  const displayName = companyName ?? "Portal de clientes";
  const contactName = companyName ?? "la empresa";
  const companyInitial = (companyName?.trim().charAt(0) || brand.name.charAt(0)).toUpperCase();
  const welcome = info?.portal.welcome_message?.trim();
  const supportEmail = info?.portal.support_email?.trim();
  const supportPhone = info?.portal.support_phone?.trim();
  const deepLink = `dovexo://customer?slug=${encodeURIComponent(slug)}&token=${encodeURIComponent(token)}`;

  async function copyToken() {
    if (!navigator.clipboard) {
      setCopied(false);
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <main className="min-h-screen bg-bg px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-lg space-y-5">
        <header className="space-y-2">
          <p className="text-label flex items-center gap-2 text-primary">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-ds-sm bg-primary text-xs font-bold text-white"
            >
              {companyInitial}
            </span>
            {companyName ? "Portal de clientes" : brand.name}
          </p>
          <h1 className="text-h2 text-text">{displayName}</h1>
          {welcome ? (
            <p className="text-body text-text-2">{welcome}</p>
          ) : (
            <p className="text-body text-text-2">
              Consultá tus trabajos, turnos, presupuestos y pagos en un solo lugar.
            </p>
          )}
        </header>

        {error && (
          <p
            role="alert"
            className="text-small rounded-ds-md bg-danger-soft px-4 py-3 text-danger-strong"
          >
            {error}
          </p>
        )}

        {token ? (
          <Card className="p-5 sm:p-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-h4 text-text">Entrá a tu cuenta</h2>
                <p className="text-body text-text-2">
                  Este enlace es personal y se puede usar una sola vez. Elegí cómo querés continuar.
                </p>
              </div>

              <Button
                size="lg"
                className="w-full"
                onClick={onEnterBrowser}
                disabled={isVerifying}
                aria-busy={isVerifying}
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <MonitorSmartphone className="h-4 w-4" aria-hidden="true" />
                )}
                {isVerifying ? "Abriendo tu portal..." : "Ver mis servicios en el navegador"}
              </Button>

              <a
                href={deepLink}
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full")}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
                Abrir en la app {brand.name}
              </a>

              <p className="text-small text-text-2">
                Si entrás desde el navegador, el enlace queda usado y ya no va a servir en la app.
              </p>

              <details className="rounded-ds-md border border-border bg-surface-2 p-3">
                <summary className="text-small cursor-pointer rounded-ds-sm font-semibold text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                  Usar el código en la app
                </summary>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <code className="text-small min-w-0 flex-1 rounded-ds-sm border border-border bg-surface px-3 py-2 break-all text-text">
                    {token}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToken()}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied ? "Copiado" : "Copiar código"}
                  </Button>
                </div>
                <p aria-live="polite" className="sr-only">
                  {copied ? "Código copiado" : ""}
                </p>
              </details>
            </div>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ds-md bg-warning-soft text-warning-strong">
                <Link2Off className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <h2 className="text-h4 text-text">El enlace está incompleto</h2>
                <p className="text-body text-text-2">
                  Falta el código de acceso. Los enlaces del portal se generan desde la empresa y se
                  pueden usar una sola vez.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-ds-md bg-surface-2 p-4">
              <p className="text-small font-semibold text-text">
                Pedile a {contactName} que te genere un enlace nuevo.
              </p>
              {supportPhone && (
                <a
                  href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`}
                  className="text-small block font-semibold text-primary underline underline-offset-4"
                >
                  Llamar al {supportPhone}
                </a>
              )}
              {supportEmail && (
                <a
                  href={`mailto:${supportEmail}`}
                  className="text-small block font-semibold text-primary underline underline-offset-4"
                >
                  Escribir a {supportEmail}
                </a>
              )}
            </div>
          </Card>
        )}

        {!token && demoAvailable && (
          <div className="space-y-1 text-center">
            <Button
              variant="ghost"
              onClick={onOpenDemo}
              disabled={isDemoLoading}
              aria-busy={isDemoLoading}
            >
              {isDemoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {isDemoLoading ? "Abriendo la demo..." : "Probar con datos de ejemplo"}
            </Button>
            <p className="text-caption text-text-2">Datos ficticios para conocer el portal.</p>
          </div>
        )}

        <footer className="flex flex-col items-center gap-1.5 pt-2 text-center">
          <p className="text-caption flex items-center gap-1.5 text-text-2">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Enlace privado. No lo compartas.
          </p>
          <p className="text-caption text-text-2">
            Gestionado con {brand.name} ·{" "}
            <Link href="/privacy" className="text-primary underline underline-offset-4">
              Privacidad
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
