"use client";

import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  UserMinus,
  UserX,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { AgendaConflict, AgendaConflictSeverity } from "@/components/agenda/agenda-utils";
import type { WorkOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

const severityStyles: Record<AgendaConflictSeverity, string> = {
  danger: "bg-danger-soft text-danger-strong",
  warning: "bg-warning-soft text-warning-strong",
  info: "bg-info-soft text-info-strong",
};

const kindIcons: Record<AgendaConflict["kind"], LucideIcon> = {
  overlap: AlertTriangle,
  unassigned: UserX,
  inactive_technician: UserMinus,
  rescheduled: CalendarClock,
  fully_booked: Clock3,
};

type AgendaConflictListProps = {
  conflicts: readonly AgendaConflict[];
  orders: readonly WorkOrder[];
  /** Texto del estado sin conflictos; cambia según el período consultado. */
  emptyMessage?: string;
  className?: string;
};

/**
 * Lista de conflictos con texto, etiqueta e icono además del color: nunca se
 * comunica un problema solo con color.
 */
export function AgendaConflictList({
  conflicts,
  orders,
  emptyMessage = "Sin conflictos en el período. Los turnos están asignados y sin superposiciones.",
  className,
}: AgendaConflictListProps) {
  if (conflicts.length === 0) {
    return (
      <div
        role="status"
        className={cn(
          "bg-success-soft text-success-strong flex items-start gap-2 rounded-ds-md px-3 py-2.5 text-small",
          className,
        )}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="agenda-conflicts-title"
      className={cn(
        "border-border bg-surface rounded-ds-lg border p-4 shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="agenda-conflicts-title" className="text-h4 text-text">
          Conflictos detectados
        </h2>
        <span className="bg-warning-soft text-warning-strong rounded-full px-2.5 py-0.5 text-caption font-semibold">
          {conflicts.length} {conflicts.length === 1 ? "aviso" : "avisos"}
        </span>
      </div>

      <ul className="mt-3 space-y-3">
        {conflicts.map((conflict) => {
          const Icon = kindIcons[conflict.kind];
          const linkedOrders = conflict.orderIds
            .map((orderId) => orders.find((order) => order.id === orderId))
            .filter((order): order is WorkOrder => Boolean(order));

          return (
            <li key={conflict.id} className="flex gap-2.5">
              <span
                className={cn(
                  "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  severityStyles[conflict.severity],
                )}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-text text-small font-semibold">{conflict.title}</p>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-caption font-semibold",
                      severityStyles[conflict.severity],
                    )}
                  >
                    {conflict.label}
                  </span>
                </div>
                <p className="text-text-2 text-caption">{conflict.description}</p>

                {linkedOrders.length > 0 && (
                  <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {linkedOrders.map((order) => (
                      <li key={order.id}>
                        <Link
                          href={`/orders/${order.id}`}
                          className="text-primary focus-visible:ring-primary rounded-sm text-caption font-semibold underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:outline-none"
                        >
                          Abrir {order.code}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
