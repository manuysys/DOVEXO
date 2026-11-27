"use client";

import { useMutation } from "@tanstack/react-query";
import { Check, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api";
import { portalApi, type PortalQuote, type PortalSession } from "@/lib/portal-api";
import { formatCurrency, formatDateOnly, formatNumber } from "@/lib/utils";

import {
  formatPortalDateTime,
  isPortalQuoteExpired,
  portalQuoteExpiryNote,
  portalQuoteStatus,
} from "./portal-labels";
import { PortalEmpty, PortalListSkeleton, PortalNotice, PortalSection } from "./portal-ui";

type Decision = "approve" | "reject";

function quoteOrder(quote: PortalQuote) {
  return quote.status === "sent" && !isPortalQuoteExpired(quote) ? 0 : 1;
}

function sortQuotes(quotes: PortalQuote[]) {
  return [...quotes].sort((a, b) => {
    const byPending = quoteOrder(a) - quoteOrder(b);
    if (byPending !== 0) return byPending;
    return (b.sent_at ?? "").localeCompare(a.sent_at ?? "");
  });
}

export function PortalQuotes({
  session,
  quotes,
  loading,
  onChanged,
}: {
  session: PortalSession;
  quotes: PortalQuote[];
  loading: boolean;
  onChanged: () => void;
}) {
  const pending = quotes.filter(
    (quote) => quote.status === "sent" && !isPortalQuoteExpired(quote),
  ).length;

  return (
    <PortalSection
      title="Presupuestos"
      description={
        pending > 0
          ? `Tenés ${pending} ${pending === 1 ? "presupuesto" : "presupuestos"} esperando tu respuesta.`
          : "Acá quedan los presupuestos que te enviamos."
      }
    >
      {loading ? (
        <PortalListSkeleton rows={2} />
      ) : quotes.length === 0 ? (
        <PortalEmpty
          icon={FileText}
          title="No tenés presupuestos"
          description="Cuando te enviemos uno, va a aparecer acá para que lo revises y respondas."
        />
      ) : (
        <div className="space-y-3">
          {sortQuotes(quotes).map((quote) => (
            <PortalQuoteCard key={quote.id} session={session} quote={quote} onChanged={onChanged} />
          ))}
        </div>
      )}
    </PortalSection>
  );
}

function PortalQuoteCard({
  session,
  quote,
  onChanged,
}: {
  session: PortalSession;
  quote: PortalQuote;
  onChanged: () => void;
}) {
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [decided, setDecided] = useState<PortalQuote | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: "success" | "info";
    message: string;
  } | null>(null);
  // El backend devuelve el presupuesto actualizado: se muestra al instante en
  // lugar de esperar el refetch de la lista completa.
  const current = decided ?? quote;
  const status = portalQuoteStatus(current.status);
  const expired = isPortalQuoteExpired(current);
  const canDecide = current.status === "sent" && !expired;
  const expiryNote = portalQuoteExpiryNote(current);

  const decision = useMutation({
    mutationFn: (choice: Decision) =>
      choice === "approve"
        ? portalApi.approveQuote(session.slug, session.token, quote.id)
        : portalApi.rejectQuote(session.slug, session.token, quote.id),
    onSuccess: (data, choice) => {
      setDecided(data);
      setApproveOpen(false);
      setRejectOpen(false);
      setFeedback(
        choice === "approve"
          ? {
              tone: "success",
              message: "Aprobaste este presupuesto. La empresa ya recibió tu respuesta.",
            }
          : {
              tone: "info",
              message: "Rechazaste este presupuesto. La empresa ya recibió tu respuesta.",
            },
      );
      toast.success(choice === "approve" ? "Presupuesto aprobado" : "Presupuesto rechazado");
      onChanged();
    },
  });

  const decisionError = decision.isError
    ? decision.error instanceof ApiError && decision.error.status === 409
      ? "El presupuesto cambió de estado. Actualizá la página para ver la información más reciente."
      : decision.error instanceof ApiError && decision.error.status === 429
        ? "Hiciste varios intentos seguidos. Esperá un minuto y volvé a probar."
        : "No pudimos registrar tu respuesta. Revisá tu conexión e intentá de nuevo."
    : null;

  function openApprove() {
    decision.reset();
    setApproveOpen(true);
  }

  function openReject() {
    decision.reset();
    setRejectOpen(true);
  }

  return (
    <article className="rounded-ds-lg border border-border bg-surface p-5 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-label text-text-2">Presupuesto</p>
          <h3 className="text-h4 numeric mt-0.5 text-text">{current.number}</h3>
          <p className="text-small mt-1 text-text-2">
            {current.valid_until
              ? `Válido hasta el ${formatDateOnly(current.valid_until)}`
              : "Sin fecha de vencimiento"}
          </p>
          {current.sent_at && (
            <p className="text-caption mt-1 text-text-2">
              Recibido el {formatPortalDateTime(current.sent_at)}
            </p>
          )}
          {expiryNote && (
            <p className="text-caption mt-1 font-semibold text-warning-strong">{expiryNote}</p>
          )}
        </div>
        <div className="flex items-end justify-between gap-3 border-t border-border pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
          <div>
            <p className="text-caption text-text-2">Total</p>
            <p className="numeric font-display text-xl font-semibold tracking-tight text-text">
              {formatCurrency(current.total)}
            </p>
          </div>
          <Badge variant={expired && current.status === "sent" ? "neutral" : status.tone}>
            {expired && current.status === "sent" ? "Vencido" : status.label}
          </Badge>
        </div>
      </div>

      <details className="group mt-4">
        <summary className="text-small cursor-pointer rounded-ds-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
          Ver conceptos y totales
        </summary>
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <ul className="divide-y divide-border">
            {current.items.map((item, index) => (
              <li
                key={`${current.id}-${index}`}
                className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="text-small font-medium text-text">{item.description}</p>
                  <p className="numeric text-caption text-text-2">
                    {formatNumber(item.quantity)} × {formatCurrency(item.unit_price)}
                    {Number(item.discount_rate) > 0
                      ? ` · Descuento ${formatNumber(item.discount_rate, 2)}%`
                      : ""}
                  </p>
                </div>
                <p className="numeric text-small font-semibold text-text sm:text-right">
                  {formatCurrency(item.line_total)}
                </p>
              </li>
            ))}
          </ul>
          <dl className="text-small ml-auto max-w-xs space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-text-2">Subtotal</dt>
              <dd className="numeric font-medium text-text">{formatCurrency(current.subtotal)}</dd>
            </div>
            {Number(current.discount_total) > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Descuentos</dt>
                <dd className="numeric font-medium text-text">
                  − {formatCurrency(current.discount_total)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-text-2">IVA</dt>
              <dd className="numeric font-medium text-text">{formatCurrency(current.tax_total)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-1.5">
              <dt className="font-semibold text-text">Total</dt>
              <dd className="numeric font-semibold text-text">{formatCurrency(current.total)}</dd>
            </div>
          </dl>
        </div>
      </details>

      {feedback && (
        <PortalNotice role="status" tone={feedback.tone} className="mt-4">
          {feedback.message}
        </PortalNotice>
      )}

      {decisionError && (
        <PortalNotice role="alert" tone="danger" className="mt-4">
          {decisionError}
        </PortalNotice>
      )}

      {canDecide ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button
            size="lg"
            className="sm:flex-1"
            onClick={openApprove}
            disabled={decision.isPending}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            Aprobar presupuesto
          </Button>
          <Button size="lg" variant="outline" onClick={openReject} disabled={decision.isPending}>
            <X className="h-4 w-4" aria-hidden="true" />
            Rechazar
          </Button>
        </div>
      ) : expired && current.status === "sent" ? (
        <PortalNotice tone="warning" className="mt-4">
          Este presupuesto venció. Pedile a la empresa que te envíe uno nuevo.
        </PortalNotice>
      ) : null}

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar presupuesto {current.number}</DialogTitle>
            <DialogDescription>
              Vas a aprobar un total de {formatCurrency(current.total)}. La empresa recibe tu
              respuesta al instante y se comunica para coordinar el trabajo.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={() => decision.mutate("approve")}
              disabled={decision.isPending}
              aria-busy={decision.isPending}
            >
              {decision.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4" aria-hidden="true" />
              )}
              Sí, aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar presupuesto {current.number}</DialogTitle>
            <DialogDescription>
              ¿Confirmás que no querés avanzar con este presupuesto? La empresa va a recibir tu
              respuesta.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="danger"
              onClick={() => decision.mutate("reject")}
              disabled={decision.isPending}
              aria-busy={decision.isPending}
            >
              {decision.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4" aria-hidden="true" />
              )}
              Sí, rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}
