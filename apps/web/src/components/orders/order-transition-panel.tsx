"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, api, errorMessage } from "@/lib/api";

import { orderStatusLabel } from "./order-meta";

type OrderTransitionPanelProps = {
  tenantId: string;
  orderId: string;
  currentStatus: string;
  nextStatuses: string[];
  canTransition: boolean;
};

export function OrderTransitionPanel({
  tenantId,
  orderId,
  currentStatus,
  nextStatuses,
  canTransition,
}: OrderTransitionPanelProps) {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");
  const transitionMutation = useMutation({
    mutationFn: (toStatus: string) =>
      api.workOrders.transition(tenantId, orderId, toStatus, notes.trim() || undefined),
    onSuccess: (updated) => {
      setNotes("");
      toast.success(`Estado actualizado a ${orderStatusLabel(updated.operational_status)}`);
      void queryClient.invalidateQueries({ queryKey: ["work-order", tenantId, orderId] });
      void queryClient.invalidateQueries({ queryKey: ["work-order-events", tenantId, orderId] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders", tenantId] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
    },
  });

  const error = transitionMutation.error
    ? transitionMutation.error instanceof ApiError
      ? transitionMutation.error.detail
      : errorMessage(transitionMutation.error, "No se pudo cambiar el estado")
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cambiar estado</CardTitle>
        <CardDescription>
          Estado actual: <span className="text-text font-medium">{orderStatusLabel(currentStatus)}</span>. La
          nota queda registrada en el historial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!canTransition ? (
          <p className="text-text-2 bg-surface-2 rounded-ds-md px-3 py-2 text-small">
            Tu rol tiene acceso de solo lectura. Un responsable de la empresa puede cambiar el estado.
          </p>
        ) : nextStatuses.length === 0 ? (
          <p className="text-text-2 bg-surface-2 rounded-ds-md px-3 py-2 text-small">
            Esta orden no tiene transiciones disponibles.
          </p>
        ) : (
          <>
            <label htmlFor="order-transition-notes" className="text-text-2 mb-1 block text-caption font-medium">
              Nota (opcional)
            </label>
            <textarea
              id="order-transition-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              className="border-border text-text placeholder:text-text-2/70 focus:border-primary focus:ring-primary/20 w-full rounded-ds-md border bg-surface px-3 py-2 text-sm outline-none focus:ring-2"
              placeholder="Ej.: Se reprogramó por falta de repuesto"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {nextStatuses.map((status) => {
                const pending = transitionMutation.isPending && transitionMutation.variables === status;
                return (
                  <Button
                    key={status}
                    variant={status === "cancelled" ? "outline" : "primary"}
                    size="sm"
                    onClick={() => transitionMutation.mutate(status)}
                    disabled={transitionMutation.isPending}
                    aria-label={`Cambiar estado a ${orderStatusLabel(status)}`}
                  >
                    {pending ? "Guardando..." : orderStatusLabel(status)}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md mt-3 px-3 py-2 text-small">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
