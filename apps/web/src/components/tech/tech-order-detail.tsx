"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { TechEmptyState } from "@/components/tech/tech-empty-state";
import { TechOrderSummary } from "@/components/tech/tech-order-summary";
import { TechOrderTimeline } from "@/components/tech/tech-order-timeline";
import { TechPrimaryAction } from "@/components/tech/tech-primary-action";
import { TechQueryError } from "@/components/tech/tech-query-error";
import { TechnicianAttachments } from "@/components/tech/technician-attachments";
import { TechnicianMaterials } from "@/components/tech/technician-materials";
import { TechnicianNoteForm } from "@/components/tech/technician-note-form";
import type { TechnicianWorkOrderWithAddress } from "@/components/tech/tech-format";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TechnicianAction } from "@/lib/technician";

export function TechOrderDetail() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const tenantId = activeTenantId ?? "";

  const orderQuery = useQuery({
    queryKey: ["tech-work-order", tenantId, orderId],
    queryFn: () => api.technicianWorkOrders.get(tenantId, orderId),
    enabled: Boolean(tenantId && orderId),
  });

  const transitionMutation = useMutation({
    mutationFn: (toStatus: TechnicianAction["to"]) =>
      api.technicianWorkOrders.transition(tenantId, orderId, toStatus),
    onSuccess: (updated) => {
      setActionError(null);
      queryClient.setQueryData(["tech-work-order", tenantId, orderId], updated);
      void queryClient.invalidateQueries({ queryKey: ["tech-work-orders", tenantId] });
    },
    onError: (error) => {
      setActionError(transitionErrorMessage(error));
    },
  });

  if (!activeTenantId) {
    return (
      <TechEmptyState
        title="No hay empresa activa"
        description="Volvé a iniciar sesión para ver este trabajo."
      />
    );
  }

  if (orderQuery.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <span className="sr-only">Cargando el trabajo…</span>
        <Skeleton className="h-5 w-28 bg-surface-2" />
        <Skeleton className="h-56 w-full rounded-xl bg-surface-2" />
        <Skeleton className="h-36 w-full rounded-xl bg-surface-2" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <TechQueryError
        error={orderQuery.error}
        scope="order"
        onRetry={() => void orderQuery.refetch()}
      />
    );
  }

  const order: TechnicianWorkOrderWithAddress | undefined = orderQuery.data;

  if (!order) {
    return <TechQueryError error={null} scope="order" onRetry={() => void orderQuery.refetch()} />;
  }

  function handleTransition(to: TechnicianAction["to"]) {
    setActionError(null);
    transitionMutation.mutate(to);
  }

  return (
    <>
      <div className="space-y-4">
        <Link
          href="/tech"
          className="text-small inline-flex min-h-11 items-center gap-1.5 font-medium text-text-2 transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Mis trabajos
        </Link>

        <TechOrderSummary order={order} />
        <TechnicianMaterials tenantId={tenantId} orderId={orderId} />
        <TechnicianAttachments tenantId={tenantId} orderId={orderId} />
        <TechnicianNoteForm tenantId={tenantId} orderId={orderId} />
        <TechOrderTimeline order={order} />
      </div>

      <TechPrimaryAction
        order={order}
        pending={transitionMutation.isPending}
        error={actionError}
        onTransition={handleTransition}
      />
    </>
  );
}

function transitionErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Tu sesión venció. Volvé a iniciar sesión.";
    if (error.status === 403) return "No tenés permiso para cambiar el estado de este trabajo.";
    if (error.status === 404) return "Este trabajo ya no está asignado a vos.";
  }
  return errorMessage(error, "No pudimos cambiar el estado. Reintentá.");
}
