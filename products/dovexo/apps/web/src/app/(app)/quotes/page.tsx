"use client";

import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, RefreshCw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import { QuoteForm } from "@/components/quotes/quote-form";
import { QuoteList } from "@/components/quotes/quote-list";
import { quoteExpiryState } from "@/components/quotes/quote-expiry";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { sumMoney } from "@/lib/money";
import { cn, formatCurrency } from "@/lib/utils";

const filters = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Borradores" },
  { value: "sent", label: "Enviados" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
  { value: "expired", label: "Vencidos" },
] as const;

export default function QuotesPage() {
  const { activeTenantId, tenants } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);

  const quotesQuery = useQuery({
    queryKey: ["quotes", activeTenantId],
    queryFn: () => api.quotes.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId, ""],
    queryFn: () => api.customers.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const allQuotes = useMemo(() => quotesQuery.data?.items ?? [], [quotesQuery.data]);
  const total = quotesQuery.data?.total ?? 0;
  const customers = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data]);

  const customerName = useMemo(() => {
    const names = new Map(customers.map((customer) => [customer.id, customer.name]));
    return (customerId: string) => names.get(customerId) ?? "Cliente";
  }, [customers]);

  const searchedQuotes = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allQuotes;
    return allQuotes.filter(
      (quote) =>
        quote.number.toLowerCase().includes(term) ||
        customerName(quote.customer_id).toLowerCase().includes(term),
    );
  }, [allQuotes, customerName, search]);

  const visibleQuotes = useMemo(
    () =>
      statusFilter
        ? searchedQuotes.filter((quote) => quote.status === statusFilter)
        : searchedQuotes,
    [searchedQuotes, statusFilter],
  );

  const countByStatus = useMemo(() => {
    const counts: Record<string, number> = { "": searchedQuotes.length };
    for (const quote of searchedQuotes) {
      counts[quote.status] = (counts[quote.status] ?? 0) + 1;
    }
    return counts;
  }, [searchedQuotes]);

  const approvedQuotes = useMemo(
    () => allQuotes.filter((quote) => quote.status === "approved"),
    [allQuotes],
  );
  const approvedAmount = approvedQuotes.length
    ? sumMoney(approvedQuotes.map((quote) => quote.total))
    : "0";
  const sentCount = allQuotes.filter((quote) => quote.status === "sent").length;
  const dueSoonCount = allQuotes.filter((quote) => {
    if (quote.status !== "sent" || !quote.valid_until) return false;
    const { days } = quoteExpiryState(quote.valid_until, quote.status);
    return days !== null && days <= 7;
  }).length;

  const hasFilters = Boolean(statusFilter || search.trim());
  const isFilteredEmpty = allQuotes.length > 0 && visibleQuotes.length === 0;
  const isTruncated = total > allQuotes.length;

  if (!activeTenantId) {
    return <Card className="text-text-2 p-8 text-sm">No hay una empresa activa.</Card>;
  }

  function clearFilters() {
    setStatusFilter("");
    setSearch("");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Comercial"
        title="Presupuestos"
        description={`${total} presupuesto${total === 1 ? "" : "s"} en ${activeTenant?.name ?? "tu empresa"}.`}
        actions={
          <Button
            onClick={() => setShowForm((value) => !value)}
            aria-expanded={showForm}
            aria-controls="quote-form-panel"
            variant={showForm ? "outline" : "primary"}
          >
            {showForm ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            {showForm ? "Cancelar" : "Nuevo presupuesto"}
          </Button>
        }
      />

      {showForm && (
        <div id="quote-form-panel">
          <QuoteForm tenantId={activeTenantId} onCancel={() => setShowForm(false)} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Presupuestos" value={total} hint="Registrados en la empresa" icon={FileText} />
        <StatCard
          label="Enviados"
          value={sentCount}
          hint="Esperando respuesta del cliente"
          icon={FileText}
          tone="amber"
        />
        <StatCard
          label="Aprobados"
          value={approvedQuotes.length}
          hint={approvedQuotes.length ? formatCurrency(approvedAmount) : "Listos para ejecutar"}
          icon={FileText}
          tone="teal"
        />
        <StatCard
          label="Por vencer"
          value={dueSoonCount}
          hint="Enviados que vencen en 7 días o ya vencieron"
          icon={FileText}
          tone="danger"
        />
      </div>

      <Card className="overflow-hidden">
        <div className="border-border flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <label htmlFor="quote-search" className="sr-only">
                Buscar presupuestos por número o cliente
              </label>
              <Search
                aria-hidden="true"
                className="text-text-2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              />
              <Input
                id="quote-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por número o cliente"
                className="min-h-9 pl-9 text-sm sm:w-64"
              />
            </div>

            <div
              role="group"
              aria-label="Filtrar presupuestos por estado"
              className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
            >
              {filters.map((filter) => {
                const active = statusFilter === filter.value;
                const count = countByStatus[filter.value] ?? 0;
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
                    <span className="numeric text-[11px] opacity-75">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-text-2 numeric shrink-0 text-xs" aria-live="polite">
            {visibleQuotes.length} de {allQuotes.length}
          </p>
        </div>

        {quotesQuery.isLoading ? (
          <div className="space-y-2 p-4" aria-busy="true">
            <span className="sr-only">Cargando presupuestos…</span>
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="bg-surface-2 h-12 w-full" />
            ))}
          </div>
        ) : quotesQuery.isError ? (
          <div role="alert" className="p-6">
            <p className="text-danger-strong text-sm font-semibold">
              No se pudieron cargar los presupuestos.
            </p>
            <p className="text-text-2 mt-1 text-sm">
              Revisá la conexión e intentá de nuevo. No se perdió ningún dato.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => void quotesQuery.refetch()}
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reintentar
            </Button>
          </div>
        ) : allQuotes.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={FileText}
              title="Todavía no hay presupuestos"
              description="Creá el primero para enviárselo a un cliente y seguir su aprobación."
              action={
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nuevo presupuesto
                </Button>
              }
              className="border-border bg-surface-2/40"
            />
          </div>
        ) : isFilteredEmpty ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Search}
              title="Ningún presupuesto coincide"
              description="Probá con otro estado o limpiá la búsqueda para ver todos."
              action={
                hasFilters ? (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                ) : undefined
              }
              className="border-border bg-surface-2/40"
            />
          </div>
        ) : (
          <>
            <QuoteList quotes={visibleQuotes} customerName={customerName} />
            {isTruncated && (
              <p className="border-border text-text-2 border-t px-4 py-3 text-xs">
                Mostrando los primeros {allQuotes.length} de {total} presupuestos. Los filtros se
                aplican sobre esa lista.
              </p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
