"use client";

import { ArrowRight, CircleDot, Inbox, Sparkles, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatDate } from "@/lib/utils";
import type { WorkOrderEvent } from "@/lib/api";

import { formatRelativeTime, orderStatusLabel } from "./order-meta";

function eventIcon(eventType: string): LucideIcon {
  switch (eventType) {
    case "created":
      return Sparkles;
    case "created_from_request":
      return Inbox;
    case "status_changed":
      return ArrowRight;
    default:
      return CircleDot;
  }
}

function eventTitle(event: WorkOrderEvent): string {
  switch (event.event_type) {
    case "created":
      return "Orden creada";
    case "created_from_request":
      return "Orden creada desde una solicitud";
    case "status_changed":
      return `Estado: ${orderStatusLabel(event.from_status ?? "")} → ${orderStatusLabel(event.to_status ?? "")}`;
    default:
      return event.event_type;
  }
}

function eventNote(event: WorkOrderEvent): string | null {
  const notes = event.payload?.notes;
  return typeof notes === "string" && notes.trim().length > 0 ? notes.trim() : null;
}

type OrderTimelineProps = {
  events: WorkOrderEvent[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function OrderTimeline({ events, isLoading = false, isError = false, onRetry }: OrderTimelineProps) {
  const sorted = [...events].sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial</CardTitle>
        <CardDescription>Qué ocurrió con la orden, del evento más reciente al más antiguo.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="flex gap-3">
                <span className="bg-surface-2 h-7 w-7 shrink-0 animate-pulse rounded-full" />
                <div className="flex-1 space-y-2">
                  <span className="bg-surface-2 block h-3 w-1/2 animate-pulse rounded" />
                  <span className="bg-surface-2 block h-3 w-1/3 animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-small">
            <p>No se pudo cargar el historial.</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-danger-strong focus-visible:ring-danger mt-1 rounded-sm text-small font-semibold underline focus-visible:ring-2 focus-visible:outline-none"
              >
                Reintentar
              </button>
            )}
          </div>
        ) : sorted.length === 0 ? (
          <p className="text-text-2 text-small">Sin eventos registrados.</p>
        ) : (
          <ol aria-label="Historial de la orden" className="space-y-0">
            {sorted.map((event, index) => {
              const Icon = eventIcon(event.event_type);
              const note = eventNote(event);
              const cancelled = event.to_status === "cancelled";

              return (
                <li key={event.id} className="relative pb-5 pl-11 last:pb-0">
                  {index < sorted.length - 1 && (
                    <span aria-hidden="true" className="bg-border absolute top-8 bottom-0 left-[13px] w-px" />
                  )}
                  <span
                    className={cn(
                      "absolute top-0 left-0 flex h-7 w-7 items-center justify-center rounded-full",
                      cancelled
                        ? "bg-danger-soft text-danger-strong"
                        : "bg-surface-2 text-text-2",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <p className="text-text text-small font-medium">{eventTitle(event)}</p>
                  <p className="text-text-2 text-caption">
                    <time dateTime={event.created_at} title={formatDate(event.created_at)}>
                      {formatRelativeTime(event.created_at)}
                    </time>
                    {" · "}
                    {formatDate(event.created_at)}
                  </p>
                  {note && <p className="text-text mt-1 text-small">{note}</p>}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
