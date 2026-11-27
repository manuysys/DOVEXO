"use client";

import { CalendarClock, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import type { WorkOrder } from "@/lib/api";

import { OrderPriorityBadge } from "./order-badges";
import { BOARD_STATUS_SEQUENCE, formatRelativeTime, orderStatusLabel } from "./order-meta";

type OrdersBoardProps = {
  orders: WorkOrder[];
  customerName: (customerId: string) => string;
  technicianName: (userId: string | null) => string;
  cancelledCount: number;
  onShowCancelled: () => void;
};

export function OrdersBoard({
  orders,
  customerName,
  technicianName,
  cancelledCount,
  onShowCancelled,
}: OrdersBoardProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {BOARD_STATUS_SEQUENCE.map((status) => {
          const columnOrders = orders.filter((order) => order.operational_status === status);
          const headingId = `board-${status}`;

          return (
            <section
              key={status}
              aria-labelledby={headingId}
              className="border-border bg-surface-2/60 rounded-ds-lg flex min-w-0 flex-col border"
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                <h2 id={headingId} className="text-text text-label">
                  {orderStatusLabel(status)}
                </h2>
                <span className="bg-surface text-text-2 numeric rounded-full px-2 py-0.5 text-caption">
                  {columnOrders.length}
                </span>
              </div>

              <ul className="flex flex-col gap-2 px-2 pb-2 xl:max-h-[calc(100vh-320px)] xl:overflow-y-auto">
                {columnOrders.map((order) => (
                  <li key={order.id} className="min-w-0">
                    <Link
                      href={`/orders/${order.id}`}
                      className="border-border bg-surface rounded-ds-md focus-visible:ring-primary focus-visible:ring-offset-surface-2 block border p-3 shadow-card transition-[border-color,box-shadow] duration-150 hover:border-primary/40 hover:shadow-raised focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-1.5">
                        <span className="text-text-2 numeric font-mono text-caption">
                          {order.code}
                        </span>
                        <OrderPriorityBadge priority={order.priority} withDot />
                      </div>
                      <p className="text-text mt-1.5 line-clamp-2 text-small leading-snug font-semibold">
                        {order.title}
                      </p>
                      <p className="text-text-2 mt-1 truncate text-caption">
                        {customerName(order.customer_id) || "Sin cliente"}
                      </p>
                      <div className="text-text-2 mt-2 flex items-center gap-1 text-caption">
                        <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {order.scheduled_at ? formatDate(order.scheduled_at) : "Sin programar"}
                        </span>
                      </div>
                      <div className="text-text-2 mt-1 flex items-center gap-1 text-caption">
                        <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          {technicianName(order.assigned_user_id) || "Sin asignar"}
                        </span>
                      </div>
                      <p className="text-text-2 mt-2 text-caption">
                        Actualizada <time dateTime={order.updated_at}>{formatRelativeTime(order.updated_at)}</time>
                      </p>
                    </Link>
                  </li>
                ))}

                {columnOrders.length === 0 && (
                  <li className="text-text-2 px-2 py-4 text-center text-caption">
                    Sin órdenes en este estado.
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {cancelledCount > 0 && (
        <div
          className={cn(
            "border-border bg-surface rounded-ds-lg flex flex-col gap-2 border p-3 shadow-card",
            "sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p className="text-text-2 text-small">
            {cancelledCount} {cancelledCount === 1 ? "orden cancelada no se muestra" : "órdenes canceladas no se muestran"}{" "}
            en el tablero.
          </p>
          <Button variant="outline" size="sm" onClick={onShowCancelled}>
            Ver canceladas en tabla
          </Button>
        </div>
      )}
    </div>
  );
}
