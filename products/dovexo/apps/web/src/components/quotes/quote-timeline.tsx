"use client";

import { Clock, RefreshCw } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuoteEvent } from "@/lib/api";
import { QUOTE_EVENT_LABELS, quoteStatusLabel } from "@/lib/quote-status";
import { formatDate } from "@/lib/utils";

type QuoteTimelineProps = {
  events: QuoteEvent[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

function eventLabel(event: QuoteEvent) {
  return (
    QUOTE_EVENT_LABELS[event.event_type] ??
    (event.to_status ? `Estado: ${quoteStatusLabel(event.to_status)}` : event.event_type)
  );
}

export function QuoteTimeline({ events, isLoading, isError, onRetry }: QuoteTimelineProps) {
  const ordered = useMemo(
    () =>
      [...events].sort(
        (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
      ),
    [events],
  );

  return (
    <section
      aria-labelledby="quote-history-title"
      className="border-border bg-surface rounded-ds-lg border p-5 shadow-card"
    >
      <h2
        id="quote-history-title"
        className="text-text flex items-center gap-2 text-sm font-semibold"
      >
        <Clock className="text-text-2 h-4 w-4" aria-hidden="true" />
        Historial
      </h2>

      {isLoading ? (
        <div className="mt-4 space-y-3" aria-busy="true">
          <span className="sr-only">Cargando historial…</span>
          <Skeleton className="bg-surface-2 h-3 w-40" />
          <Skeleton className="bg-surface-2 h-3 w-32" />
          <Skeleton className="bg-surface-2 h-3 w-48" />
        </div>
      ) : isError ? (
        <div role="alert" className="mt-3">
          <p className="text-danger-strong text-sm">No se pudo cargar el historial.</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
        </div>
      ) : ordered.length === 0 ? (
        <p className="text-text-2 mt-3 text-sm">Sin eventos registrados todavía.</p>
      ) : (
        <ol className="border-border mt-4 space-y-4 border-l">
          {ordered.map((event) => {
            const notes = event.payload?.notes;
            return (
              <li key={event.id} className="relative pl-4">
                <span
                  aria-hidden="true"
                  className="bg-accent-teal ring-surface absolute top-1.5 -left-[3.5px] h-2 w-2 rounded-full ring-2"
                />
                <p className="text-text text-sm font-medium">{eventLabel(event)}</p>
                <p className="text-text-2 numeric mt-0.5 text-xs">{formatDate(event.created_at)}</p>
                {typeof notes === "string" && notes.length > 0 && (
                  <p className="text-text-2 mt-1 text-xs">{notes}</p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
