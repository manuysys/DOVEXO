"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiError, api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { userFacingError } from "@/lib/errors";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { CustomerDetailHeader } from "./customer-detail-header";
import { CustomerFormDialog } from "./customer-form-dialog";
import {
  customerAppointments,
  customerOrders,
  customerPayments,
  customerQuotes,
  customerRequests,
  latestActivityAt,
  openWorkOrders,
  pendingQuotes,
  type CustomerInsight,
} from "./customer-insights";
import type { CustomerRecord } from "./customer-labels";
import { CustomerOverview } from "./customer-overview";
import {
  CustomerEquipmentPanel,
  CustomerNotesPanel,
  CustomerOrdersPanel,
  CustomerPaymentsPanel,
  CustomerQuotesPanel,
  CustomerRequestsPanel,
} from "./customer-related-panels";
import { CustomerDetailSkeleton, CustomerErrorPanel } from "./customer-states";

const tabTriggerClass =
  "text-text-2 hover:text-text focus-visible:ring-primary data-[state=active]:bg-surface data-[state=active]:text-text data-[state=active]:shadow-card rounded-ds-sm px-3 py-2 text-sm font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:outline-none";

function countLabel(label: string, count: number, loading: boolean) {
  return loading ? label : `${label} (${count})`;
}

export function CustomerDetailView({ customerId }: { customerId: string }) {
  const { activeTenantId, tenants } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canManage = MANAGEMENT_ROLES.includes(role);
  const canViewFinancial = MANAGEMENT_ROLES.includes(role);

  const [tab, setTab] = useState("resumen");
  const [formOpen, setFormOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const customerQuery = useQuery({
    queryKey: ["customer", activeTenantId, customerId],
    queryFn: () => api.customers.get(activeTenantId ?? "", customerId),
    enabled: Boolean(activeTenantId && customerId),
  });

  const ordersQuery = useQuery({
    queryKey: ["work-orders", activeTenantId, "customer-detail"],
    queryFn: () => api.workOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const requestsQuery = useQuery({
    queryKey: ["service-requests", activeTenantId, "customer-detail"],
    queryFn: () => api.serviceRequests.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const quotesQuery = useQuery({
    queryKey: ["quotes", activeTenantId, "customer-detail"],
    queryFn: () => api.quotes.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canViewFinancial,
  });

  const paymentsQuery = useQuery({
    queryKey: ["payments", activeTenantId, "customer-detail"],
    queryFn: () => api.payments.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canViewFinancial,
  });

  const appointmentsQuery = useQuery({
    queryKey: ["appointments", activeTenantId, "customer-detail"],
    queryFn: () => api.appointments.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const customer: CustomerRecord | undefined = customerQuery.data;

  const orders = useMemo(
    () => (customer ? customerOrders(ordersQuery.data?.items ?? [], customer.id) : []),
    [customer, ordersQuery.data?.items],
  );
  const requests = useMemo(
    () => (customer ? customerRequests(requestsQuery.data?.items ?? [], customer.id) : []),
    [customer, requestsQuery.data?.items],
  );
  const quotes = useMemo(
    () => (customer ? customerQuotes(quotesQuery.data?.items ?? [], customer.id) : []),
    [customer, quotesQuery.data?.items],
  );
  const payments = useMemo(
    () => (customer ? customerPayments(paymentsQuery.data?.items ?? [], orders) : []),
    [customer, paymentsQuery.data?.items, orders],
  );
  const appointments = useMemo(
    () => (customer ? customerAppointments(appointmentsQuery.data?.items ?? [], orders) : []),
    [customer, appointmentsQuery.data?.items, orders],
  );

  const insight = useMemo<CustomerInsight | null>(() => {
    if (!customer) return null;
    return {
      customerId: customer.id,
      lastActivityAt: latestActivityAt(customer, orders, quotes),
      openOrders: openWorkOrders(orders).length,
      totalOrders: orders.length,
      pendingQuotes: pendingQuotes(quotes).length,
      totalQuotes: quotes.length,
    };
  }, [customer, orders, quotes]);

  const archiveMutation = useMutation({
    mutationFn: () => api.customers.remove(activeTenantId ?? "", customerId),
    onSuccess: () => {
      toast.success("Cliente archivado");
      setArchiveOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/customers");
    },
    onError: (error) => toast.error(userFacingError(error, "No se pudo archivar el cliente")),
  });

  if (!activeTenantId) {
    return (
      <Card className="text-text-2 p-8 text-sm">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  if (customerQuery.isLoading) {
    return <CustomerDetailSkeleton />;
  }

  if (customerQuery.isError || !customer || !insight) {
    const notFound = customerQuery.error instanceof ApiError && customerQuery.error.status === 404;
    return (
      <div className="space-y-4">
        <Link
          href="/customers"
          className="text-text-2 hover:text-text inline-flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a clientes
        </Link>
        <CustomerErrorPanel
          title={notFound ? "No encontramos este cliente" : "No pudimos cargar el cliente"}
          message={userFacingError(
            customerQuery.error,
            notFound
              ? "Puede que se haya archivado o que el enlace no sea correcto."
              : "Revisá la conexión e intentá de nuevo.",
          )}
          onRetry={() => void customerQuery.refetch()}
          retrying={customerQuery.isFetching}
          action={
            <Link
              href="/customers"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-9")}
            >
              Volver a clientes
            </Link>
          }
        />
      </div>
    );
  }

  const activityLoading =
    ordersQuery.isLoading ||
    requestsQuery.isLoading ||
    appointmentsQuery.isLoading ||
    (canViewFinancial && (quotesQuery.isLoading || paymentsQuery.isLoading));

  function openPortal() {
    setTab("resumen");
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      document.getElementById("portal-acceso")?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  return (
    <div className="space-y-5">
      <Link
        href="/customers"
        className="text-text-2 hover:text-text inline-flex items-center gap-1 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a clientes
      </Link>

      <CustomerDetailHeader
        customer={customer}
        canManage={canManage}
        lastActivityAt={insight.lastActivityAt}
        onEdit={() => setFormOpen(true)}
        onArchive={() => setArchiveOpen(true)}
        onOpenPortal={openPortal}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto pb-1">
          <TabsList className="border-border bg-surface-2 text-text-2 flex w-max gap-1 rounded-ds-md border p-1">
            <TabsTrigger value="resumen" className={tabTriggerClass}>
              Resumen
            </TabsTrigger>
            <TabsTrigger value="solicitudes" className={tabTriggerClass}>
              {countLabel("Solicitudes", requests.length, requestsQuery.isLoading)}
            </TabsTrigger>
            <TabsTrigger value="ordenes" className={tabTriggerClass}>
              {countLabel("Órdenes", orders.length, ordersQuery.isLoading)}
            </TabsTrigger>
            <TabsTrigger value="presupuestos" className={tabTriggerClass}>
              {canViewFinancial
                ? countLabel("Presupuestos", quotes.length, quotesQuery.isLoading)
                : "Presupuestos"}
            </TabsTrigger>
            <TabsTrigger value="pagos" className={tabTriggerClass}>
              {canViewFinancial
                ? countLabel("Pagos", payments.length, paymentsQuery.isLoading)
                : "Pagos"}
            </TabsTrigger>
            <TabsTrigger value="equipos" className={tabTriggerClass}>
              Equipos
            </TabsTrigger>
            <TabsTrigger value="notas" className={tabTriggerClass}>
              Notas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resumen" className="mt-4">
          <CustomerOverview
            customer={customer}
            insight={insight}
            requests={requests}
            orders={orders}
            quotes={quotes}
            payments={payments}
            appointments={appointments}
            canViewFinancial={canViewFinancial}
            isLoading={activityLoading}
          />
        </TabsContent>

        <TabsContent value="solicitudes" className="mt-4">
          <Card className="p-5">
            <CustomerRequestsPanel
              items={requests}
              isLoading={requestsQuery.isLoading}
              isError={requestsQuery.isError}
              onRetry={() => void requestsQuery.refetch()}
              retrying={requestsQuery.isFetching}
            />
          </Card>
        </TabsContent>

        <TabsContent value="ordenes" className="mt-4">
          <Card className="p-5">
            {role === "technician" && (
              <p className="text-text-2 mb-3 text-xs">
                Como técnico ves solo las órdenes que tenés asignadas.
              </p>
            )}
            <CustomerOrdersPanel
              items={orders}
              isLoading={ordersQuery.isLoading}
              isError={ordersQuery.isError}
              onRetry={() => void ordersQuery.refetch()}
              retrying={ordersQuery.isFetching}
            />
          </Card>
        </TabsContent>

        <TabsContent value="presupuestos" className="mt-4">
          <Card className="p-5">
            <CustomerQuotesPanel
              items={quotes}
              isLoading={quotesQuery.isLoading}
              isError={quotesQuery.isError}
              onRetry={() => void quotesQuery.refetch()}
              retrying={quotesQuery.isFetching}
              canView={canViewFinancial}
            />
          </Card>
        </TabsContent>

        <TabsContent value="pagos" className="mt-4">
          <Card className="p-5">
            <CustomerPaymentsPanel
              items={payments}
              orders={orders}
              isLoading={paymentsQuery.isLoading}
              isError={paymentsQuery.isError}
              onRetry={() => void paymentsQuery.refetch()}
              retrying={paymentsQuery.isFetching}
              canView={canViewFinancial}
            />
          </Card>
        </TabsContent>

        <TabsContent value="equipos" className="mt-4">
          <Card className="p-5">
            <CustomerEquipmentPanel />
          </Card>
        </TabsContent>

        <TabsContent value="notas" className="mt-4">
          <Card className="p-5">
            <CustomerNotesPanel
              key={`${customer.id}-${customer.updated_at}`}
              tenantId={activeTenantId}
              customer={customer}
              canManage={canManage}
            />
          </Card>
        </TabsContent>
      </Tabs>

      <CustomerFormDialog
        tenantId={activeTenantId}
        customer={customer}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archivar cliente</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés archivar a {customer.name}? El historial de trabajos,
              presupuestos y pagos se conserva.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={archiveMutation.isPending}
              onClick={() => archiveMutation.mutate()}
            >
              {archiveMutation.isPending ? "Archivando…" : "Archivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
