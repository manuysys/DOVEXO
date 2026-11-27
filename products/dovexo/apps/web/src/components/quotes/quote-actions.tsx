"use client";

import { Check, Copy, Download, ExternalLink, Loader2, Send, X } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type QuoteAction = "send" | "approve" | "reject";

const STATUS_HINT: Record<string, string> = {
  draft: "Enviá el presupuesto para que el cliente pueda aprobarlo.",
  sent: "Esperando la respuesta del cliente. También podés registrarla vos.",
  approved: "Aprobado: el trabajo ya puede ejecutarse.",
  rejected: "Rechazado por el cliente. Podés crear un presupuesto nuevo.",
  expired: "Venció sin respuesta. Creá uno nuevo o acordá otra fecha.",
};

type QuoteActionsProps = {
  status: string;
  publicToken: string | null;
  busy: boolean;
  pdfPending: boolean;
  pendingAction: QuoteAction | null;
  onSend: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDownloadPdf: () => void;
  onCopyLink: () => void;
  /** `panel`: columna lateral del escritorio. `bar`: barra compacta para móvil. */
  layout?: "panel" | "bar";
};

export function QuoteActions({
  status,
  publicToken,
  busy,
  pdfPending,
  pendingAction,
  onSend,
  onApprove,
  onReject,
  onDownloadPdf,
  onCopyLink,
  layout = "panel",
}: QuoteActionsProps) {
  const canSend = status === "draft";
  // ADR-008: solo un presupuesto enviado puede aprobarse o rechazarse.
  const canDecide = status === "sent";
  const isBar = layout === "bar";

  return (
    <section
      aria-labelledby={isBar ? "quote-actions-mobile-title" : "quote-actions-title"}
      className={cn(
        isBar
          ? "border-border bg-surface rounded-ds-lg border p-3 shadow-card"
          : "border-border bg-surface rounded-ds-lg border p-5 shadow-card",
      )}
    >
      <h2
        id={isBar ? "quote-actions-mobile-title" : "quote-actions-title"}
        className="text-text text-sm font-semibold"
      >
        Acciones
      </h2>
      {!isBar && (
        <p className="text-text-2 mt-1 text-xs">
          {STATUS_HINT[status] ?? "Este presupuesto no tiene acciones disponibles."}
        </p>
      )}

      <div className={cn("mt-3", isBar ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2")}>
        {canSend && (
          <Button
            onClick={onSend}
            disabled={busy}
            className={cn("w-full justify-center", isBar ? "col-span-2" : "order-1")}
          >
            {pendingAction === "send" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            Enviar al cliente
          </Button>
        )}

        {canDecide && (
          <>
            <Button
              onClick={onApprove}
              disabled={busy}
              className="bg-success-strong hover:bg-success w-full justify-center text-white"
            >
              {pendingAction === "approve" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              Aprobar
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              disabled={busy}
              className="border-danger/30 text-danger-strong hover:bg-danger-soft w-full justify-center"
            >
              {pendingAction === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4" aria-hidden="true" />
              )}
              Rechazar
            </Button>
          </>
        )}

        <Button
          variant="outline"
          onClick={onDownloadPdf}
          disabled={busy}
          aria-busy={pdfPending}
          className={cn("w-full justify-center", isBar ? "col-span-2" : "order-last")}
        >
          {pdfPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Download className="h-4 w-4" aria-hidden="true" />
          )}
          {pdfPending ? "Generando PDF…" : "Descargar PDF"}
        </Button>

        {publicToken && (
          <>
            <Button
              variant="outline"
              onClick={onCopyLink}
              className={cn("w-full justify-center", isBar && "col-span-2")}
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copiar link
            </Button>
            <Link
              href={`/q/${publicToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "w-full justify-center",
                isBar && "col-span-2",
              )}
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Ver como cliente
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
