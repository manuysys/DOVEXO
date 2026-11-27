"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { QuoteActions, type QuoteAction } from "@/components/quotes/quote-actions";
import { QuoteDetailSummary } from "@/components/quotes/quote-detail-summary";
import { QuoteItems } from "@/components/quotes/quote-items";
import { QuotePdfPreview } from "@/components/quotes/quote-pdf-preview";
import { QuoteTimeline } from "@/components/quotes/quote-timeline";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { downloadBlob } from "@/lib/utils";

const ACTION_FEEDBACK: Record<QuoteAction, string> = {
  send: "Presupuesto enviado al cliente.",
  approve: "Presupuesto aprobado.",
  reject: "Presupuesto rechazado.",
};

const ACTION_CALLS: Record<QuoteAction, (tenantId: string, quoteId: string) => Promise<unknown>> = {
  send: (tenantId, quoteId) => api.quotes.send(tenantId, quoteId),
  approve: (tenantId, quoteId) => api.quotes.approve(tenantId, quoteId),
  reject: (tenantId, quoteId) => api.quotes.reject(tenantId, quoteId),
};

export default function QuoteDetailPage() {
  const params = useParams<{ id: string }>();
  const quoteId = params.id;
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);

  const quoteQuery = useQuery({
    queryKey: ["quote", activeTenantId, quoteId],
    queryFn: () => api.quotes.get(activeTenantId ?? "", quoteId),
    enabled: Boolean(activeTenantId && quoteId),
  });

  const eventsQuery = useQuery({
    queryKey: ["quote-events", activeTenantId, quoteId],
    queryFn: () => api.quotes.events(activeTenantId ?? "", quoteId),
    enabled: Boolean(activeTenantId && quoteId),
  });

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId, ""],
    queryFn: () => api.customers.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const refreshQuote = () => {
    void queryClient.invalidateQueries({ queryKey: ["quote", activeTenantId, quoteId] });
    void queryClient.invalidateQueries({ queryKey: ["quote-events", activeTenantId, quoteId] });
    void queryClient.invalidateQueries({ queryKey: ["quotes", activeTenantId] });
  };

  const actionMutation = useMutation({
    mutationFn: (action: QuoteAction) => ACTION_CALLS[action](activeTenantId ?? "", quoteId),
    onSuccess: (_data, action) => {
      setFeedback(ACTION_FEEDBACK[action]);
      refreshQuote();
    },
    onError: () => setFeedback(null),
  });

  const pdfMutation = useMutation({
    mutationFn: (fileNumber: string) =>
      api.quotes.pdf(activeTenantId ?? "", quoteId).then((blob) => ({ blob, fileNumber })),
    onSuccess: ({ blob, fileNumber }) => {
      downloadBlob(blob, `presupuesto-${fileNumber}.pdf`);
    },
  });

  if (!activeTenantId) {
    return <p className="text-text-2 text-sm">No hay una empresa activa.</p>;
  }

  if (quoteQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Cargando presupuesto…</span>
        <Skeleton className="bg-surface-2 h-4 w-40" />
        <Skeleton className="bg-surface-2 rounded-ds-lg h-56 w-full" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Skeleton className="bg-surface-2 rounded-ds-lg h-64 w-full" />
          <Skeleton className="bg-surface-2 rounded-ds-lg h-64 w-full" />
        </div>
      </div>
    );
  }

  if (quoteQuery.isError || !quoteQuery.data) {
    return (
      <div role="alert" className="border-border bg-surface rounded-ds-lg border p-8 shadow-card">
        <p className="text-text text-h4">No encontramos este presupuesto</p>
        <p className="text-text-2 mt-1 text-sm">
          Puede que se haya eliminado o que no tengas acceso con la empresa activa.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void quoteQuery.refetch()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
          <Link href="/quotes" className={buttonVariants({ variant: "ghost" })}>
            Volver a presupuestos
          </Link>
        </div>
      </div>
    );
  }

  const quote = quoteQuery.data;
  const customer = customersQuery.data?.items.find((item) => item.id === quote.customer_id);
  const events = eventsQuery.data ?? [];
  const actionError = actionMutation.error
    ? errorMessage(actionMutation.error, "No se pudo completar la acción")
    : null;
  const pdfError = pdfMutation.error
    ? errorMessage(pdfMutation.error, "No se pudo descargar el PDF")
    : null;
  const isBusy = actionMutation.isPending || pdfMutation.isPending;
  const pendingAction = actionMutation.isPending ? (actionMutation.variables ?? null) : null;

  async function copyPublicLink(token: string) {
    const link = `${window.location.origin}/q/${token}`;
    try {
      await navigator.clipboard.writeText(link);
      setFeedback("Link público copiado al portapapeles.");
    } catch {
      setFeedback(`No pudimos copiar automáticamente. Copiá este link: ${link}`);
    }
  }

  function runAction(action: QuoteAction) {
    if (action === "reject" && !window.confirm("¿Rechazar este presupuesto?")) {
      return;
    }
    setFeedback(null);
    actionMutation.mutate(action);
  }

  const actionProps = {
    status: quote.status,
    publicToken: quote.public_token,
    busy: isBusy,
    pdfPending: pdfMutation.isPending,
    pendingAction,
    onSend: () => runAction("send"),
    onApprove: () => runAction("approve"),
    onReject: () => runAction("reject"),
    onDownloadPdf: () => pdfMutation.mutate(quote.number),
    onCopyLink: () => void copyPublicLink(quote.public_token ?? ""),
  } as const;

  return (
    <div className="space-y-4">
      <Link
        href="/quotes"
        className="text-text-2 hover:text-text focus-visible:ring-primary inline-flex min-h-9 items-center gap-1 rounded-ds-sm text-sm font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a presupuestos
      </Link>

      <div aria-live="polite" className="space-y-2">
        {feedback && (
          <p
            role="status"
            className="bg-success-soft text-success-strong rounded-ds-md px-3 py-2 text-sm"
          >
            {feedback}
          </p>
        )}
        {actionError && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
            {actionError}
          </p>
        )}
        {pdfError && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
            {pdfError}
          </p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-4">
          <QuoteDetailSummary
            quote={quote}
            customerName={customer?.name ?? "Cliente"}
            tenantName={activeTenant?.name ?? "Empresa"}
          />

          {/* Móvil: acciones inmediatas después del total. */}
          <div className="lg:hidden">
            <QuoteActions {...actionProps} layout="bar" />
          </div>

          <QuoteItems quote={quote} />

          {quote.notes && (
            <section
              aria-labelledby="quote-notes-title"
              className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
            >
              <h2 id="quote-notes-title" className="text-text text-sm font-semibold">
                Notas para el cliente
              </h2>
              <p className="text-text-2 mt-2 text-sm whitespace-pre-line">{quote.notes}</p>
            </section>
          )}

          <QuoteTimeline
            events={events}
            isLoading={eventsQuery.isLoading}
            isError={eventsQuery.isError}
            onRetry={() => void eventsQuery.refetch()}
          />
        </div>

        <aside className="hidden space-y-4 lg:block">
          <QuoteActions {...actionProps} layout="panel" />
          <QuotePdfPreview
            key={quote.status}
            tenantId={activeTenantId}
            quoteId={quoteId}
            number={quote.number}
          />
        </aside>
      </div>
    </div>
  );
}
