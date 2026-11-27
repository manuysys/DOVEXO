"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { userFacingError } from "@/lib/errors";
import { MANAGEMENT_ROLES } from "@/lib/navigation";
import { cn } from "@/lib/utils";

import { CustomerFormDialog } from "./customer-form-dialog";
import {
  buildCustomerInsights,
  isRecent,
  type CustomerInsight,
} from "./customer-insights";
import type { CustomerRecord } from "./customer-labels";
import { CustomerErrorPanel, CustomerListSkeleton, CustomerReadOnlyNotice } from "./customer-states";
import { CustomerTable, type CustomerListRow } from "./customer-table";

type CustomerFilter = "all" | "open-orders" | "pending-quotes" | "no-contact" | "recent";

const BASE_FILTERS: { value: CustomerFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open-orders", label: "Con órdenes abiertas" },
  { value: "no-contact", label: "Sin contacto" },
  { value: "recent", label: "Nuevos (30 días)" },
];

function plural(count: number, singular: string, pluralForm: string) {
  return count === 1 ? singular : pluralForm;
}

function fallbackInsight(customer: CustomerRecord): CustomerInsight {
  return {
    customerId: customer.id,
    lastActivityAt: customer.updated_at,
    openOrders: 0,
    totalOrders: 0,
    pendingQuotes: 0,
    totalQuotes: 0,
  };
}

export function CustomersView() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const role = activeTenant?.role ?? "";
  const canManage = MANAGEMENT_ROLES.includes(role);
  const canViewQuotes = MANAGEMENT_ROLES.includes(role);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<CustomerRecord | null>(null);

  // La búsqueda se resuelve en el backend: se evita una consulta por tecla.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId, search],
    queryFn: () => api.customers.list(activeTenantId ?? "", search),
    enabled: Boolean(activeTenantId),
  });

  const ordersQuery = useQuery({
    queryKey: ["work-orders", activeTenantId, "customer-activity"],
    queryFn: () => api.workOrders.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const quotesQuery = useQuery({
    queryKey: ["quotes", activeTenantId, "customer-activity"],
    queryFn: () => api.quotes.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId) && canViewQuotes,
  });

  const archiveMutation = useMutation({
    mutationFn: (customerId: string) => api.customers.remove(activeTenantId ?? "", customerId),
    onSuccess: () => {
      toast.success("Cliente archivado");
      setArchiveTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => toast.error(userFacingError(error, "No se pudo archivar el cliente")),
  });

  const customers = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data?.items]);
  const total = customersQuery.data?.total ?? 0;

  const insights = useMemo(
    () => buildCustomerInsights(customers, ordersQuery.data?.items ?? [], quotesQuery.data?.items ?? []),
    [customers, ordersQuery.data?.items, quotesQuery.data?.items],
  );

  const filters = useMemo(
    () =>
      canViewQuotes
        ? [
            ...BASE_FILTERS.slice(0, 2),
            { value: "pending-quotes" as const, label: "Presupuestos pendientes" },
            ...BASE_FILTERS.slice(2),
          ]
        : BASE_FILTERS,
    [canViewQuotes],
  );

  const rows = useMemo<CustomerListRow[]>(() => {
    return customers
      .filter((customer) => {
        const insight = insights.get(customer.id);
        switch (filter) {
          case "open-orders":
            return (insight?.openOrders ?? 0) > 0;
          case "pending-quotes":
            return (insight?.pendingQuotes ?? 0) > 0;
          case "no-contact":
            return !customer.phone && !customer.email;
          case "recent":
            return isRecent(customer);
          default:
            return true;
        }
      })
      .map((customer) => ({
        customer,
        insight: insights.get(customer.id) ?? fallbackInsight(customer),
      }));
  }, [customers, insights, filter]);

  if (!activeTenantId) {
    return (
      <Card className="text-text-2 p-8 text-sm">
        No hay una empresa activa. Cerrá sesión y volvé a ingresar.
      </Card>
    );
  }

  const tenantName = activeTenant?.name ?? "tu empresa";
  const hasFilters = search.length > 0 || filter !== "all";
  const activityError = ordersQuery.isError || (canViewQuotes && quotesQuery.isError);
  const summary = customersQuery.isLoading
    ? "Cargando clientes…"
    : filter === "all"
      ? `${rows.length} ${plural(rows.length, "cliente", "clientes")} en ${tenantName}.`
      : `${rows.length} de ${customers.length} ${plural(customers.length, "cliente", "clientes")} con este filtro.`;
  const pageLimited = total > customers.length;

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(customer: CustomerRecord) {
    setEditing(customer);
    setFormOpen(true);
  }

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilter("all");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CRM"
        title="Clientes"
        description={
          customersQuery.isLoading
            ? `Cartera de ${tenantName}.`
            : `${total} ${plural(total, "cliente", "clientes")} en ${tenantName}.`
        }
        actions={
          canManage ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nuevo cliente
            </Button>
          ) : null
        }
      />

      {!canManage && <CustomerReadOnlyNotice />}

      <Card>
        <div className="border-border flex flex-col gap-3 border-b p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:max-w-sm">
              <Search
                className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Input
                id="customer-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre, teléfono o email"
                aria-label="Buscar clientes"
                aria-describedby={pageLimited ? "customer-search-hint" : undefined}
                className="pr-10 pl-9"
                type="text"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="text-text-2 hover:bg-surface-2 hover:text-text focus-visible:ring-primary absolute top-1/2 right-1 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-ds-md transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div
              className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-0.5"
              role="group"
              aria-label="Filtrar clientes"
            >
              {filters.map((option) => {
                const active = filter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFilter(option.value)}
                    className={cn(
                      "focus-visible:ring-primary min-h-9 shrink-0 rounded-full border px-3 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                      active
                        ? "border-deep bg-deep text-white"
                        : "border-border bg-surface text-text-2 hover:bg-surface-2 hover:text-text",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-text-2 text-xs" aria-live="polite">
              {summary}
            </p>
            {pageLimited && (
              <p id="customer-search-hint" className="text-text-2 text-xs">
                Mostrando los primeros {customers.length} de {total}. Afiná la búsqueda para ver el
                resto.
              </p>
            )}
          </div>
          {activityError && (
            <p className="text-text-2 text-xs" role="status">
              No se pudo calcular la última actividad. La lista de clientes sigue disponible.
            </p>
          )}
        </div>

        {customersQuery.isLoading ? (
          <CustomerListSkeleton />
        ) : customersQuery.isError ? (
          <div className="p-4">
            <CustomerErrorPanel
              message={userFacingError(
                customersQuery.error,
                "No se pudieron cargar los clientes. Revisá la conexión e intentá de nuevo.",
              )}
              onRetry={() => void customersQuery.refetch()}
              retrying={customersQuery.isFetching}
            />
          </div>
        ) : customers.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Users}
              title={hasFilters ? "No encontramos clientes" : "Todavía no hay clientes"}
              description={
                hasFilters
                  ? "Probá con otro término de búsqueda o quitá los filtros."
                  : canManage
                    ? "Creá el primero para empezar a construir el historial de trabajos, presupuestos y pagos."
                    : "Cuando la empresa cargue clientes, van a aparecer acá."
              }
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                ) : canManage ? (
                  <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Nuevo cliente
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Search}
              title="Ningún cliente coincide con el filtro"
              description="Cambiá el filtro o limpiá la búsqueda para ver toda la cartera."
              action={
                <Button variant="outline" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              }
            />
          </div>
        ) : (
          <CustomerTable
            rows={rows}
            canManage={canManage}
            showQuoteInsights={canViewQuotes}
            onEdit={openEdit}
            onArchive={setArchiveTarget}
          />
        )}
      </Card>

      <CustomerFormDialog
        tenantId={activeTenantId}
        customer={editing}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
      />

      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archivar cliente</DialogTitle>
            <DialogDescription>
              ¿Confirmás que querés archivar a {archiveTarget?.name}? El historial de trabajos,
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
              onClick={() => archiveTarget && archiveMutation.mutate(archiveTarget.id)}
            >
              {archiveMutation.isPending ? "Archivando…" : "Archivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
