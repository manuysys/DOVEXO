"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, RefreshCw, Search, Wallet, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CollectionBar } from "@/components/payments/collection-bar";
import { PaymentForm } from "@/components/payments/payment-form";
import { PaymentList } from "@/components/payments/payment-list";
import { PendingBalances } from "@/components/payments/pending-balances";
import { fetchPaymentOverview } from "@/components/payments/payment-overview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api, errorMessage, type Payment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sumMoney } from "@/lib/money";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { paymentMethodLabel } from "@/lib/payment-status";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

const filters = [
  { value: "", label: "Todos" },
  { value: "registered", label: "Registrados" },
  { value: "voided", label: "Anulados" },
] as const;

export default function PaymentsPage() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManagePayments = MANAGEMENT_ROLES.includes(activeTenant?.role ?? "");

  const paymentsQuery = useQuery({
    queryKey: ["payments", activeTenantId],
    queryFn: () => api.payments.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManagePayments,
  });

  const ordersQuery = useQuery({
    queryKey: ["work-orders", activeTenantId],
    queryFn: () => api.workOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManagePayments,
  });

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary", activeTenantId],
    queryFn: () => api.dashboard.summary(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManagePayments,
  });

  const overviewQuery = useQuery({
    queryKey: ["payment-overview", activeTenantId],
    queryFn: () => fetchPaymentOverview(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManagePayments,
  });

  const voidMutation = useMutation({
    mutationFn: (paymentId: string) => api.payments.void(activeTenantId ?? "", paymentId),
    onSuccess: () => {
      toast.success("Pago anulado");
      void queryClient.invalidateQueries({ queryKey: ["payments", activeTenantId] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders", activeTenantId] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-summary", activeTenantId] });
      void queryClient.invalidateQueries({ queryKey: ["payment-overview", activeTenantId] });
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo anular el pago")),
  });

  const payments = useMemo(() => paymentsQuery.data?.items ?? [], [paymentsQuery.data]);
  const total = paymentsQuery.data?.total ?? 0;
  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data]);
  const summary = summaryQuery.data;
  const overview = overviewQuery.data;

  const orderCode = useMemo(() => {
    const codes = new Map(orders.map((order) => [order.id, order.code]));
    return (workOrderId: string) => codes.get(workOrderId) ?? "—";
  }, [orders]);

  const registeredPayments = useMemo(
    () => payments.filter((payment) => payment.status === "registered"),
    [payments],
  );
  const voidedPayments = useMemo(
    () => payments.filter((payment) => payment.status === "voided"),
    [payments],
  );
  const registeredTotal = registeredPayments.length
    ? sumMoney(registeredPayments.map((payment) => payment.amount))
    : "0";
  const voidedTotal = voidedPayments.length
    ? sumMoney(voidedPayments.map((payment) => payment.amount))
    : "0";
  const average = registeredPayments.length
    ? Number(registeredTotal) / registeredPayments.length
    : 0;
  const partialOrders = orders.filter((order) => order.payment_status === "partial").length;
  const pendingItems = overview?.finished_with_balance ?? [];
  const pendingTotal = pendingItems.length
    ? sumMoney(pendingItems.map((item) => item.balance))
    : "0";

  const searchedPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;
    return payments.filter(
      (payment) =>
        orderCode(payment.work_order_id).toLowerCase().includes(term) ||
        (payment.reference ?? "").toLowerCase().includes(term) ||
        paymentMethodLabel(payment.method).toLowerCase().includes(term),
    );
  }, [orderCode, payments, search]);

  const visiblePayments = useMemo(
    () =>
      statusFilter
        ? searchedPayments.filter((payment) => payment.status === statusFilter)
        : searchedPayments,
    [searchedPayments, statusFilter],
  );

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { "": searchedPayments.length };
    for (const payment of searchedPayments) {
      counts[payment.status] = (counts[payment.status] ?? 0) + 1;
    }
    return counts;
  }, [searchedPayments]);

  const lastPayment = useMemo(() => {
    if (registeredPayments.length === 0) return null;
    return registeredPayments.reduce((latest, payment) =>
      new Date(payment.paid_at).getTime() > new Date(latest.paid_at).getTime() ? payment : latest,
    );
  }, [registeredPayments]);

  if (!activeTenantId) {
    return <Card className="text-text-2 p-8 text-sm">No hay una empresa activa.</Card>;
  }

  if (!canManagePayments) {
    return (
      <Card className="text-text-2 p-8 text-sm">
        No tenés acceso a la información de pagos con tu rol actual.
      </Card>
    );
  }

  const displayMoney = (value: string | undefined) => {
    if (summaryQuery.isLoading) return "…";
    if (summaryQuery.isError || value === undefined) return "—";
    return formatCurrency(value);
  };
  const voidError = voidMutation.error
    ? errorMessage(voidMutation.error, "No se pudo anular el pago")
    : null;
  const isFilteredEmpty = payments.length > 0 && visiblePayments.length === 0;
  const hasFilters = Boolean(statusFilter || search.trim());

  function handleVoid(payment: Payment) {
    if (!window.confirm("¿Anular este pago? La anulación no se puede deshacer.")) {
      return;
    }
    voidMutation.mutate(payment.id);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finanzas"
        title="Pagos"
        description={`${total} movimiento${total === 1 ? "" : "s"} en ${activeTenant?.name ?? "tu empresa"}.`}
        actions={
          <Button
            onClick={() => {
              setShowForm((value) => !value);
              voidMutation.reset();
            }}
            aria-expanded={showForm}
            aria-controls="payment-form-panel"
            variant={showForm ? "outline" : "primary"}
          >
            {showForm ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {showForm ? "Cancelar" : "Registrar pago"}
          </Button>
        }
      />

      {showForm && (
        <div id="payment-form-panel">
          <PaymentForm
            tenantId={activeTenantId}
            orders={orders.filter((order) => order.operational_status !== "cancelled")}
            onDone={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Cobrado"
          value={displayMoney(summary?.payments_total)}
          hint="Pagos registrados, sin anulados"
          icon={Wallet}
          tone="teal"
        />
        <StatCard
          label="Pendiente de cobro"
          value={displayMoney(summary?.pending_balance)}
          hint="Aprobado que todavía no se cobró"
          icon={Receipt}
          tone="amber"
        />
        <StatCard
          label="Saldo vencido"
          value={
            overviewQuery.isLoading
              ? "…"
              : overviewQuery.isError
                ? "—"
                : formatCurrency(pendingTotal)
          }
          hint={
            overview
              ? `${overview.counts.finished_with_balance} trabajo${
                  overview.counts.finished_with_balance === 1 ? "" : "s"
                } finalizado${overview.counts.finished_with_balance === 1 ? "" : "s"} con saldo`
              : "Trabajos finalizados con saldo"
          }
          icon={Receipt}
          tone="danger"
        />
        <StatCard
          label="Pagos parciales"
          value={
            ordersQuery.isLoading ? "…" : ordersQuery.isError ? "—" : partialOrders
          }
          hint="Órdenes con pago parcial"
          icon={Receipt}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <PendingBalances
            items={pendingItems}
            total={overview?.counts.finished_with_balance ?? 0}
            isLoading={overviewQuery.isLoading}
            isError={overviewQuery.isError}
            onRetry={() => void overviewQuery.refetch()}
          />
        </div>
        <CollectionBar
          collected={summary?.payments_total ?? "0"}
          pending={summary?.pending_balance ?? "0"}
          isLoading={summaryQuery.isLoading}
          isError={summaryQuery.isError}
        />
      </div>

      {voidError && (
        <p role="alert" className="bg-danger-soft text-danger-strong rounded-ds-md px-3 py-2 text-sm">
          {voidError}
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="border-border flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <label htmlFor="payment-search" className="sr-only">
                Buscar pagos por orden, referencia o método
              </label>
              <Search
                aria-hidden="true"
                className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              />
              <Input
                id="payment-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por orden, referencia o método"
                className="min-h-9 pl-9 text-sm sm:w-72"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar pagos por estado"
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            >
              {filters.map((filter) => {
                const active = statusFilter === filter.value;
                return (
                  <button
                    key={filter.value || "all"}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setStatusFilter(filter.value)}
                    className={cn(
                      "inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors focus-visible:ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      active
                        ? "bg-primary text-white"
                        : "border-border text-text-2 hover:bg-surface-2 hover:text-text border bg-surface",
                    )}
                  >
                    {filter.label}
                    <span className="numeric text-[11px] opacity-75">
                      {countByStatus[filter.value] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-text-2 numeric shrink-0 text-xs" aria-live="polite">
            {visiblePayments.length} de {payments.length}
          </p>
        </div>

        {paymentsQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <span className="sr-only">Cargando pagos…</span>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="bg-surface-2 h-12 w-full" />
            ))}
          </div>
        ) : paymentsQuery.isError ? (
          <div role="alert" className="p-6">
            <p className="text-danger-strong text-sm font-semibold">No se pudieron cargar los pagos.</p>
            <p className="text-text-2 mt-1 text-sm">Revisá la conexión e intentá de nuevo.</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void paymentsQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Wallet}
              title="Todavía no hay pagos registrados"
              description="Registrá un cobro cuando un cliente pague una orden de trabajo."
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Registrar pago
                </Button>
              }
              className="border-border bg-surface-2/40"
            />
          </div>
        ) : isFilteredEmpty ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Search}
              title="Ningún pago coincide"
              description="Probá con otro estado o limpiá la búsqueda."
              action={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setStatusFilter("");
                      setSearch("");
                    }}
                  >
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
              className="border-border bg-surface-2/40"
            />
          </div>
        ) : (
          <>
            <PaymentList
              payments={visiblePayments}
              orderCode={orderCode}
              onVoid={handleVoid}
              voidingId={voidMutation.isPending ? (voidMutation.variables ?? null) : null}
            />
            <div className="border-border text-text-2 flex flex-col gap-1 border-t px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <p>
                En la lista: registrado {formatCurrency(registeredTotal)} en{" "}
                {registeredPayments.length} {registeredPayments.length === 1 ? "pago" : "pagos"}.
                {voidedPayments.length > 0 && (
                  <> Anulado: {formatCurrency(voidedTotal)} (no cuenta como cobrado).</>
                )}
              </p>
              <p>
                {registeredPayments.length > 0 && <>Ticket promedio {formatCurrency(average)} · </>}
                Último pago {lastPayment ? formatDate(lastPayment.paid_at) : "sin registros"}.
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
