"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Plus, SearchX, ShieldAlert, WifiOff, X } from "lucide-react";
import { useMemo, useState } from "react";

import { OrderForm } from "@/components/orders/order-form";
import {
  EMPTY_ORDER_FILTERS,
  countActiveFilters,
  filterOrders,
  paginate,
  sortOrders,
  type OrderFilters,
  type OrderSortKey,
  type OrdersView,
  type SortDirection,
} from "@/components/orders/order-list-utils";
import { OrdersBoard } from "@/components/orders/orders-board";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersToolbar } from "@/components/orders/orders-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MANAGEMENT_ROLES } from "@/lib/navigation";

const PAGE_SIZE_DEFAULT = 10;

function OrdersSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando órdenes"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {Array.from({ length: 5 }).map((_, column) => (
        <div key={column} className="border-border bg-surface-2/60 rounded-ds-lg space-y-2 border p-2.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ))}
    </div>
  );
}

function OrdersErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const status = error instanceof ApiError ? error.status : null;
  const isPermission = status === 403;
  const Icon = isPermission ? ShieldAlert : WifiOff;

  return (
    <Card role="alert" className="p-6">
      <span
        className={
          isPermission
            ? "bg-warning-soft text-warning-strong flex h-11 w-11 items-center justify-center rounded-full"
            : "bg-danger-soft text-danger-strong flex h-11 w-11 items-center justify-center rounded-full"
        }
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="text-text text-h4 mt-3">
        {isPermission ? "No tenés permiso para ver las órdenes" : "No pudimos cargar las órdenes"}
      </h2>
      <p className="text-text-2 text-small mt-1">
        {isPermission
          ? "Pedile a un responsable de la empresa que revise tu rol."
          : errorMessage(error, "Revisá la conexión e intentá de nuevo.")}
      </p>
      {!isPermission && (
        <Button variant="outline" className="mt-4" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </Card>
  );
}

export default function OrdersPage() {
  const { activeTenantId, tenants, user } = useAuth();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canManage = MANAGEMENT_ROLES.includes(role);

  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<OrdersView>("board");
  const [filters, setFilters] = useState<OrderFilters>(EMPTY_ORDER_FILTERS);
  const [sort, setSort] = useState<OrderSortKey>("updated");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId, ""],
    queryFn: () => api.customers.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const ordersQuery = useQuery({
    queryKey: ["work-orders", activeTenantId],
    queryFn: () => api.workOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const techniciansQuery = useQuery({
    queryKey: ["technicians", activeTenantId],
    queryFn: () => api.technicians.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canManage,
  });

  const customers = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data]);
  const orders = useMemo(() => ordersQuery.data?.items ?? [], [ordersQuery.data]);
  const total = ordersQuery.data?.total ?? orders.length;
  const technicians = useMemo(() => techniciansQuery.data ?? [], [techniciansQuery.data]);

  const lookups = useMemo(
    () => ({
      customerName: (customerId: string) =>
        customers.find((customer) => customer.id === customerId)?.name ?? "",
      technicianName: (userId: string | null) => {
        if (!userId) {
          return "Sin asignar";
        }
        if (user && userId === user.id) {
          return "Vos";
        }
        return technicians.find((technician) => technician.id === userId)?.full_name ?? "Asignado";
      },
    }),
    [customers, technicians, user],
  );

  const filtered = useMemo(() => filterOrders(orders, filters, lookups), [orders, filters, lookups]);
  const sorted = useMemo(
    () => sortOrders(filtered, sort, direction, lookups),
    [filtered, sort, direction, lookups],
  );
  const pageSlice = paginate(sorted, page, pageSize);

  const openCount = orders.filter((order) =>
    ["new", "scheduled", "in_progress", "waiting"].includes(order.operational_status),
  ).length;
  const urgentCount = orders.filter((order) => order.priority === "urgent").length;
  const activeFilterCount = countActiveFilters(filters);
  const cancelledCount = sorted.filter((order) => order.operational_status === "cancelled").length;
  const boardOrders = sorted.filter((order) => order.operational_status !== "cancelled");
  const truncated = total > orders.length;

  function updateFilters(patch: Partial<OrderFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function handleSortChange(nextSort: OrderSortKey) {
    if (nextSort === sort) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(nextSort);
    setDirection(nextSort === "updated" || nextSort === "scheduled" ? "desc" : "asc");
  }

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize);
    setPage(1);
  }

  if (!activeTenantId) {
    return (
      <Card className="text-text-2 p-8 text-small">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operación"
        title="Órdenes de trabajo"
        description={`${total} ${total === 1 ? "orden" : "órdenes"} en ${
          activeTenant?.name ?? "tu empresa"
        } · ${openCount} abiertas · ${urgentCount} urgentes.`}
        actions={
          canManage ? (
            <Button
              variant={showForm ? "outline" : "primary"}
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? <X className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {showForm ? "Cancelar" : "Nueva orden"}
            </Button>
          ) : undefined
        }
      />

      {showForm && canManage && (
        <OrderForm
          tenantId={activeTenantId}
          customers={customers}
          onCreated={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {ordersQuery.isLoading ? (
        <OrdersSkeleton />
      ) : ordersQuery.isError ? (
        <OrdersErrorState error={ordersQuery.error} onRetry={() => void ordersQuery.refetch()} />
      ) : orders.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={ClipboardList}
            title="Todavía no hay órdenes"
            description="Creá la primera orden o convertí una solicitud en orden de trabajo."
            action={
              canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nueva orden
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <OrdersToolbar
            filters={filters}
            onFiltersChange={updateFilters}
            sort={sort}
            direction={direction}
            onSortChange={handleSortChange}
            view={view}
            onViewChange={setView}
            technicians={technicians}
            showTechnicianFilter={canManage}
            resultCount={sorted.length}
            totalCount={orders.length}
            activeFilterCount={activeFilterCount}
            onClearFilters={() => {
              setFilters(EMPTY_ORDER_FILTERS);
              setPage(1);
            }}
          />

          {truncated && (
            <p className="text-text-2 bg-surface-2 rounded-ds-md px-3 py-2 text-caption">
              La API devolvió las primeras {orders.length} de {total} órdenes. Refiná la búsqueda o los
              filtros para encontrar otras.
            </p>
          )}

          {sorted.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={SearchX}
                title="Sin resultados"
                description="No hay órdenes que coincidan con la búsqueda y los filtros aplicados."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters(EMPTY_ORDER_FILTERS);
                      setPage(1);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                }
              />
            </Card>
          ) : view === "board" ? (
            <OrdersBoard
              orders={boardOrders}
              customerName={lookups.customerName}
              technicianName={lookups.technicianName}
              cancelledCount={cancelledCount}
              onShowCancelled={() => {
                updateFilters({ status: "cancelled" });
                setView("table");
              }}
            />
          ) : (
            <OrdersTable
              page={pageSlice}
              total={sorted.length}
              pageSize={pageSize}
              customerName={lookups.customerName}
              technicianName={lookups.technicianName}
              sort={sort}
              direction={direction}
              onSortChange={handleSortChange}
              onPageChange={setPage}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}
    </div>
  );
}
