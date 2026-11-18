"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  Check,
  CheckCircle2,
  FileText,
  Loader2,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api";
import { ARGENTINA_TIME_ZONE, formatCurrency, formatDateOnly, formatNumber } from "@/lib/utils";

type Decision = "approve" | "reject";

type PublicQuoteViewProps = {
  token: string;
};

type StatusPresentation = {
  label: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

const STATUS_PRESENTATION: Record<string, StatusPresentation> = {
  draft: { label: "En preparación", tone: "neutral" },
  sent: { label: "Pendiente de tu respuesta", tone: "warning" },
  approved: { label: "Aprobado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
  expired: { label: "Vencido", tone: "neutral" },
};

const DATE_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: ARGENTINA_TIME_ZONE,
});

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

/**
 * Clave de día calendario. Las fechas sin hora (`2026-11-20`) se toman como
 * fecha civil: interpretarlas como UTC las correría un día en Argentina.
 */
function civilDayKey(value: string | Date): string {
  if (typeof value === "string" && DATE_ONLY_PATTERN.test(value)) return value;
  return DATE_KEY_FORMAT.format(typeof value === "string" ? new Date(value) : value);
}

/** Un presupuesto enviado con fecha límite pasada ya no se puede responder. */
function isExpired(status: string, validUntil: string | null) {
  if (status === "expired") return true;
  if (status !== "sent" || !validUntil) return false;
  return civilDayKey(validUntil) < civilDayKey(new Date());
}

/** Días calendario hasta el vencimiento (0 = hoy, negativo = vencido). */
function daysUntil(validUntil: string) {
  const from = Date.parse(`${civilDayKey(new Date())}T00:00:00Z`);
  const to = Date.parse(`${civilDayKey(validUntil)}T00:00:00Z`);
  return Math.round((to - from) / DAY_MS);
}

export function PublicQuoteView({ token }: PublicQuoteViewProps) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<Decision | null>(null);
  const [justDecided, setJustDecided] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const quoteQuery = useQuery({
    queryKey: ["public-quote", token],
    queryFn: () => api.publicQuotes.get(token),
    retry: false,
  });

  const decisionMutation = useMutation({
    mutationFn: (choice: Decision) =>
      choice === "approve" ? api.publicQuotes.approve(token) : api.publicQuotes.reject(token),
    onSuccess: (data) => {
      queryClient.setQueryData(["public-quote", token], data);
      setConfirm(null);
      setJustDecided(true);
      toast.success(data.status === "approved" ? "Presupuesto aprobado" : "Presupuesto rechazado");
      window.scrollTo({ top: 0 });
    },
  });

  const quote = quoteQuery.data;

  useEffect(() => {
    if (justDecided && statusRef.current) {
      statusRef.current.focus();
    }
  }, [justDecided]);

  if (quoteQuery.isPending) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Cargando presupuesto...</span>
        <div className="h-44 animate-pulse rounded-ds-xl bg-surface-2" />
        <div className="h-28 animate-pulse rounded-ds-lg border border-border bg-surface" />
        <div className="h-64 animate-pulse rounded-ds-lg border border-border bg-surface" />
      </div>
    );
  }

  if (quoteQuery.isError || !quote) {
    const notFound = quoteQuery.error instanceof ApiError && quoteQuery.error.status === 404;
    return (
      <Card className="mx-auto max-w-md p-6 text-center sm:p-8">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-ds-md bg-warning-soft text-warning-strong">
          <FileText className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-h3 mt-4 text-text">
          {notFound ? "No encontramos este presupuesto" : "No pudimos cargar el presupuesto"}
        </h1>
        <p className="text-body mt-2 text-text-2">
          {notFound
            ? "El enlace puede estar incompleto, vencido o haber sido reemplazado. Pedile a la empresa que te envíe uno nuevo."
            : "Revisá tu conexión e intentá de nuevo en unos minutos."}
        </p>
        {!notFound && (
          <Button className="mt-5" onClick={() => void quoteQuery.refetch()}>
            Reintentar
          </Button>
        )}
        <p className="text-caption mt-6 flex items-center justify-center gap-1.5 text-text-2">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Enlace privado
        </p>
      </Card>
    );
  }

  const expired = isExpired(quote.status, quote.valid_until);
  const canDecide = quote.status === "sent" && !expired;
  const daysLeft = quote.valid_until ? daysUntil(quote.valid_until) : null;
  const expiryNote =
    canDecide && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3
      ? daysLeft === 0
        ? "Vence hoy"
        : daysLeft === 1
          ? "Vence mañana"
          : `Vence en ${daysLeft} días`
      : null;
  const status = expired
    ? { label: "Vencido", tone: "neutral" as const }
    : (STATUS_PRESENTATION[quote.status] ?? { label: quote.status, tone: "neutral" as const });
  const decisionError = decisionMutation.isError
    ? decisionMutation.error instanceof ApiError && decisionMutation.error.status === 409
      ? "El presupuesto cambió de estado y ya no se puede responder desde este enlace."
      : decisionMutation.error instanceof ApiError && decisionMutation.error.status === 429
        ? "Hiciste varios intentos seguidos. Esperá un minuto y volvé a probar."
        : "No pudimos registrar tu respuesta. Revisá tu conexión e intentá de nuevo."
    : null;

  function openConfirm(choice: Decision) {
    decisionMutation.reset();
    setConfirm(choice);
  }

  return (
    <div className="space-y-4 pb-28 sm:pb-0 print:pb-0">
      <header className="overflow-hidden rounded-ds-xl bg-deep p-5 text-white sm:p-6 print:border print:border-border print:bg-white print:text-text">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-small flex items-center gap-2 text-white/70 print:text-text-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-ds-sm bg-primary text-xs font-bold text-white print:bg-surface-2 print:text-text"
              >
                {quote.tenant_name.charAt(0).toUpperCase()}
              </span>
              {quote.tenant_name}
            </p>
            <h1 className="text-h2 mt-3">
              Presupuesto <span className="numeric">{quote.number}</span>
            </h1>
          </div>
          <Badge variant={status.tone}>{status.label}</Badge>
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-caption text-white/55 print:text-text-2">Cliente</dt>
            <dd className="text-small mt-0.5 font-medium">{quote.customer_name}</dd>
          </div>
          <div>
            <dt className="text-caption text-white/55 print:text-text-2">Vencimiento</dt>
            <dd className="text-small mt-0.5 font-medium">
              {quote.valid_until ? formatDateOnly(quote.valid_until) : "Sin fecha de vencimiento"}
            </dd>
          </div>
        </dl>
      </header>

      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label text-text-2">Total del presupuesto</p>
            <p className="numeric mt-1 font-display text-3xl font-semibold tracking-tight text-text">
              {formatCurrency(quote.total)}
            </p>
          </div>
          <p className="text-small flex items-center gap-1.5 text-text-2">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            {quote.valid_until
              ? `Válido hasta el ${formatDateOnly(quote.valid_until)}`
              : "Sin fecha de vencimiento"}
          </p>
        </div>
        {expiryNote && (
          <p className="text-small mt-3 font-semibold text-warning-strong">{expiryNote}</p>
        )}
      </Card>

      {quote.status === "approved" && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          className="rounded-ds-lg bg-success-soft p-5 text-success-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            Aprobaste este presupuesto
          </p>
          <p className="text-small mt-1">
            Gracias. {quote.tenant_name} recibió tu aprobación y se va a comunicar con vos para
            coordinar los próximos pasos.
          </p>
        </div>
      )}

      {quote.status === "rejected" && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="status"
          className="rounded-ds-lg border border-border bg-surface-2 p-5 text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <p className="flex items-center gap-2 font-semibold">
            <XCircle className="h-5 w-5" aria-hidden="true" />
            Rechazaste este presupuesto
          </p>
          <p className="text-small mt-1 text-text-2">
            Si cambiás de opinión, comunicate con {quote.tenant_name}.
          </p>
        </div>
      )}

      {expired && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="rounded-ds-lg bg-warning-soft p-5 text-warning-strong focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <p className="flex items-center gap-2 font-semibold">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
            Este presupuesto venció
          </p>
          <p className="text-small mt-1">
            {quote.valid_until
              ? `La fecha límite era el ${formatDateOnly(quote.valid_until)}. Pedile a ${quote.tenant_name} que te envíe uno nuevo.`
              : `Pedile a ${quote.tenant_name} que te envíe un presupuesto nuevo.`}
          </p>
        </div>
      )}

      {quote.status === "draft" && (
        <div className="rounded-ds-lg bg-info-soft p-5 text-info-strong">
          <p className="font-semibold">Todavía no está disponible para responder</p>
          <p className="text-small mt-1">
            La empresa está preparando este presupuesto. Consultá con {quote.tenant_name}.
          </p>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-h4 text-text">Conceptos</h2>
        </div>
        <ul className="divide-y divide-border">
          {quote.items.map((item, index) => (
            <li
              key={`${index}-${item.description}`}
              className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0">
                <p className="text-small font-medium text-text">{item.description}</p>
                <p className="numeric text-caption mt-0.5 text-text-2">
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

        <div className="border-t border-border px-5 py-4">
          <dl className="text-small space-y-1.5 sm:ml-auto sm:max-w-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-text-2">Subtotal</dt>
              <dd className="numeric font-medium text-text">{formatCurrency(quote.subtotal)}</dd>
            </div>
            {Number(quote.discount_total) > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-2">Descuentos</dt>
                <dd className="numeric font-medium text-text">
                  − {formatCurrency(quote.discount_total)}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-text-2">IVA</dt>
              <dd className="numeric font-medium text-text">{formatCurrency(quote.tax_total)}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-border pt-2 text-base">
              <dt className="font-semibold text-text">Total</dt>
              <dd className="numeric font-semibold text-text">{formatCurrency(quote.total)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-h4 text-text">Condiciones y notas</h2>
        <ul className="text-small mt-2 space-y-1 text-text-2">
          <li>
            {quote.valid_until
              ? `El presupuesto es válido hasta el ${formatDateOnly(quote.valid_until)}.`
              : "El presupuesto no tiene fecha de vencimiento."}
          </li>
          <li>Los importes están expresados en pesos argentinos (ARS).</li>
          <li>Tu respuesta queda registrada con fecha y hora.</li>
        </ul>
        {quote.notes && (
          <p className="text-small mt-4 whitespace-pre-line text-text">{quote.notes}</p>
        )}
      </Card>

      {canDecide ? (
        <>
          <Card className="hidden border-primary/25 bg-primary/5 p-5 sm:block print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-h4 text-text">¿Querés avanzar?</h2>
                <p className="text-small mt-1 text-text-2">
                  Tu respuesta queda registrada y {quote.tenant_name} la recibe al instante.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="lg" onClick={() => openConfirm("approve")}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Aprobar presupuesto
                </Button>
                <Button size="lg" variant="outline" onClick={() => openConfirm("reject")}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Rechazar
                </Button>
              </div>
            </div>
          </Card>

          <div
            role="region"
            aria-label="Responder presupuesto"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden print:hidden"
          >
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-caption text-text-2">Total</p>
                <p className="numeric text-small font-semibold text-text">
                  {formatCurrency(quote.total)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" onClick={() => openConfirm("reject")}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Rechazar
                </Button>
                <Button onClick={() => openConfirm("approve")}>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  Aprobar
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : (
        !expired &&
        quote.status !== "approved" &&
        quote.status !== "rejected" &&
        quote.status !== "draft" && (
          <p className="text-small text-text-2">
            Este presupuesto todavía no está disponible para responder. Consultá con{" "}
            {quote.tenant_name}.
          </p>
        )
      )}

      <footer className="text-caption flex flex-col items-center gap-1 pt-2 pb-4 text-center text-text-2">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Enlace privado. No lo compartas con otras personas.
        </span>
        <span>Presupuesto gestionado con DOVEXO</span>
      </footer>

      <Dialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm === "approve" ? "Aprobar presupuesto" : "Rechazar presupuesto"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "approve"
                ? `Vas a aprobar ${quote.number} por ${formatCurrency(quote.total)}. ${quote.tenant_name} recibe tu respuesta al instante.`
                : `¿Confirmás que no querés avanzar con ${quote.number}? ${quote.tenant_name} va a recibir tu respuesta.`}
            </DialogDescription>
          </DialogHeader>

          {decisionError && (
            <p
              role="alert"
              className="text-small mt-3 rounded-ds-md bg-danger-soft px-3 py-2 text-danger-strong"
            >
              {decisionError}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant={confirm === "approve" ? "primary" : "danger"}
              onClick={() => {
                if (confirm) decisionMutation.mutate(confirm);
              }}
              disabled={decisionMutation.isPending}
              aria-busy={decisionMutation.isPending}
            >
              {decisionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : confirm === "approve" ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <X className="h-4 w-4" aria-hidden="true" />
              )}
              {confirm === "approve" ? "Sí, aprobar" : "Sí, rechazar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
