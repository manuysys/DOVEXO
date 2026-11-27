"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SearchX, ShieldAlert, WifiOff } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { OrderPriorityBadge, OrderStatusBadge } from "@/components/orders/order-badges";
import { OrderCustomerCard } from "@/components/orders/order-customer-card";
import { OrderMediaCard } from "@/components/orders/order-media-card";
import { OrderQuotesCard } from "@/components/orders/order-quotes-card";
import { OrderSummaryCard } from "@/components/orders/order-summary-card";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { OrderTransitionPanel } from "@/components/orders/order-transition-panel";
import { technicianTransitions } from "@/components/orders/order-meta";
import { TechnicianAssignment } from "@/components/orders/technician-assignment";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { OPERATIONAL_TRANSITIONS } from "@/lib/order-status";
import { formatDate } from "@/lib/utils";

const TRANSITION_ROLES = [...MANAGEMENT_ROLES, "technician"];

function DetailSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Cargando orden">
      <Skeleton className="h-4 w-32" />
      <Card className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
      </Card>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}

function DetailErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = error instanceof ApiError ? error.status : null;
  const isPermission = status === 403;
  const isNotFound = status === 404;
  const Icon = isPermission ? ShieldAlert : isNotFound ? SearchX : WifiOff;
  const title = isPermission
    ? "No tenés permiso para ver esta orden"
    : isNotFound
      ? "No encontramos la orden"
      : "No pudimos cargar la orden";
  const description = isPermission
    ? "Pedile a un responsable de la empresa que revise tu rol."
    : isNotFound
      ? "Puede que se haya eliminado o que pertenezca a otra empresa."
      : errorMessage(error, "Revisá la conexión e intentá de nuevo.");

  return (
    <Card role="alert" className="p-6">
      <span className="bg-surface-2 text-text-2 flex h-11 w-11 items-center justify-center rounded-full">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-text text-h4 mt-3">{title}</h2>
      <p className="text-text-2 text-small mt-1">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {!isPermission && !isNotFound && (
          <Button variant="outline" onClick={onRetry}>
            Reintentar
          </Button>
        )}
        <Link
          href="/orders"
          className="border-border bg-surface text-text hover:bg-surface-2 focus-visible:ring-primary inline-flex min-h-10 items-center rounded-ds-md border px-4 text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          Volver a órdenes
        </Link>
      </div>
    </Card>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const { activeTenantId, tenants, user } = useAuth();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canManage = MANAGEMENT_ROLES.includes(role);
  const canTransition = TRANSITION_ROLES.includes(role);
  const isTechnician = role === "technician";

  const orderQuery = useQuery({
    queryKey: ["work-order", activeTenantId, orderId],
    queryFn: () => api.workOrders.get(activeTenantId ?? "", orderId),
    enabled: Boolean(activeTenantId && orderId),
  });

  const eventsQuery = useQuery({
    queryKey: ["work-order-events", activeTenantId, orderId],
    queryFn: () => api.workOrders.events(activeTenantId ?? "", orderId),
    enabled: Boolean(activeTenantId && orderId),
  });

  const customerId = orderQuery.data?.customer_id;
  const customerQuery = useQuery({
    queryKey: ["customer", activeTenantId, customerId],
    queryFn: () => api.customers.get(activeTenantId ?? "", customerId ?? ""),
    enabled: Boolean(activeTenantId && customerId),
  });

  const techniciansQuery = useQuery({
    queryKey: ["technicians", activeTenantId],
    queryFn: () => api.technicians.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  if (!activeTenantId) {
    return (
      <Card className="text-text-2 p-8 text-small">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (orderQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return <DetailErrorState error={orderQuery.error} onRetry={() => void orderQuery.refetch()} />;
  }

  const order = orderQuery.data;
  const customer = customerQuery.data;
  const nextStatuses = isTechnician
    ? technicianTransitions(order.operational_status)
    : (OPERATIONAL_TRANSITIONS[order.operational_status] ?? []);
  const assignedName = order.assigned_user_id
    ? user && order.assigned_user_id === user.id
      ? "Vos"
      : (techniciansQuery.data ?? []).find((technician) => technician.id === order.assigned_user_id)
          ?.full_name ?? "Asignado"
    : "Sin asignar";

  return (
    <div className="space-y-5">
      <Link
        href="/orders"
        className="text-text-2 hover:text-text focus-visible:ring-primary inline-flex items-center gap-1.5 rounded-sm text-small font-medium focus-visible:ring-2 focus-visible:outline-none"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a órdenes
      </Link>

      <header className="border-border bg-surface rounded-ds-lg border p-5 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-text-2 numeric font-mono text-caption">{order.code}</p>
            <h1 className="text-text font-display mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {order.title}
            </h1>
            <p className="text-text-2 mt-1 text-small">
              {customer?.name ?? "Cliente"} · {activeTenant?.name ?? "Empresa"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.operational_status} />
              <OrderPriorityBadge priority={order.priority} withDot />
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-3 text-small">
            <div>
              <dt className="text-text-2 text-caption">Programada</dt>
              <dd className="text-text mt-0.5">
                {order.scheduled_at ? formatDate(order.scheduled_at) : "Sin programar"}
              </dd>
            </div>
            <div>
              <dt className="text-text-2 text-caption">Actualizada</dt>
              <dd className="text-text mt-0.5">{formatDate(order.updated_at)}</dd>
            </div>
            <div>
              <dt className="text-text-2 text-caption">Técnico</dt>
              <dd className="text-text mt-0.5">{assignedName}</dd>
            </div>
            <div>
              <dt className="text-text-2 text-caption">Creada</dt>
              <dd className="text-text mt-0.5">{formatDate(order.created_at)}</dd>
            </div>
          </dl>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <OrderTransitionPanel
            tenantId={activeTenantId}
            orderId={order.id}
            currentStatus={order.operational_status}
            nextStatuses={nextStatuses}
            canTransition={canTransition}
          />

          <OrderTimeline
            events={eventsQuery.data ?? []}
            isLoading={eventsQuery.isLoading}
            isError={eventsQuery.isError}
            onRetry={() => void eventsQuery.refetch()}
          />

          <OrderMediaCard tenantId={activeTenantId} orderId={order.id} enabled={isTechnician} />
        </div>

        <aside aria-label="Datos de la orden" className="min-w-0 space-y-5">
          <OrderSummaryCard order={order} />
          <OrderCustomerCard
            customerId={order.customer_id}
            customer={customer}
            isLoading={customerQuery.isLoading}
          />
          {canManage && (
            <TechnicianAssignment
              key={order.id}
              tenantId={activeTenantId}
              order={order}
              technicians={techniciansQuery.data ?? []}
            />
          )}
          <OrderQuotesCard tenantId={activeTenantId} orderId={order.id} enabled={canManage} />
        </aside>
      </div>
    </div>
  );
}
