"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowRightLeft, Inbox, Plus, SearchX, ShieldAlert, WifiOff, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EMPTY_REQUEST_FILTERS,
  countActiveRequestFilters,
  filterRequests,
  paginate,
  sortRequests,
  type RequestFilters,
  type RequestSortKey,
  type SortDirection,
} from "@/components/requests/request-list-utils";
import { RequestForm } from "@/components/requests/request-form";
import { RequestsTable } from "@/components/requests/requests-table";
import { RequestsToolbar } from "@/components/requests/requests-toolbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import { ApiError, api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { MANAGEMENT_ROLES } from "@/lib/navigation";

const PAGE_SIZE_DEFAULT = 10;

function RequestsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando solicitudes" className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index} className="space-y-2 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/4" />
        </Card>
      ))}
    </div>
  );
}

export default function RequestsPage() {
  const { activeTenantId, tenants } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const activeTenant = tenants.find((tenant) => tenant.id === activeTenantId);
  const canManage = MANAGEMENT_ROLES.includes(activeTenant?.role ?? "");

  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState<RequestFilters>(EMPTY_REQUEST_FILTERS);
  const [sort, setSort] = useState<RequestSortKey>("created");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_DEFAULT);

  const customersQuery = useQuery({
    queryKey: ["customers", activeTenantId, ""],
    queryFn: () => api.customers.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const requestsQuery = useQuery({
    queryKey: ["service-requests", activeTenantId],
    queryFn: () => api.serviceRequests.list(activeTenantId ?? ""),
    enabled: Boolean(activeTenantId),
  });

  const convertMutation = useMutation({
    mutationFn: (requestId: string) => api.serviceRequests.convert(activeTenantId ?? "", requestId),
    onSuccess: () => {
      toast.success("Solicitud convertida en orden");
      void queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      router.push("/orders");
    },
    onError: (error) =>
      toast.error(errorMessage(error, "No se pudo convertir la solicitud")),
  });

  const customers = useMemo(() => customersQuery.data?.items ?? [], [customersQuery.data]);
  const requests = useMemo(() => requestsQuery.data?.items ?? [], [requestsQuery.data]);
  const total = requestsQuery.data?.total ?? requests.length;

  const lookups = useMemo(
    () => ({
      customerName: (customerId: string) =>
        customers.find((customer) => customer.id === customerId)?.name ?? "",
    }),
    [customers],
  );

  const filtered = useMemo(() => filterRequests(requests, filters, lookups), [requests, filters, lookups]);
  const sorted = useMemo(
    () => sortRequests(filtered, sort, direction, lookups),
    [filtered, sort, direction, lookups],
  );
  const pageSlice = paginate(sorted, page, pageSize);

  const urgentCount = requests.filter((request) => request.priority === "urgent").length;
  const newCount = requests.filter((request) => request.status === "new").length;
  const convertedCount = requests.filter((request) => request.status === "converted").length;
  const activeFilterCount = countActiveRequestFilters(filters);
  const convertingId = convertMutation.isPending ? (convertMutation.variables ?? null) : null;
  const errorStatus = requestsQuery.error instanceof ApiError ? requestsQuery.error.status : null;

  function updateFilters(patch: Partial<RequestFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
    setPage(1);
  }

  function handleSortChange(nextSort: RequestSortKey) {
    if (nextSort === sort) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(nextSort);
    setDirection(nextSort === "created" ? "desc" : "asc");
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
        eyebrow="Entrada"
        title="Solicitudes"
        description={`Consultas y pedidos de servicio de ${activeTenant?.name ?? "tu empresa"}.`}
        actions={
          canManage ? (
            <Button
              variant={showForm ? "outline" : "primary"}
              onClick={() => setShowForm((current) => !current)}
            >
              {showForm ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              {showForm ? "Cancelar" : "Nueva solicitud"}
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={total} hint="Solicitudes registradas" icon={Inbox} />
        <StatCard label="Nuevas" value={newCount} hint="Sin clasificar" icon={Inbox} tone="teal" />
        <StatCard
          label="Urgentes"
          value={urgentCount}
          hint="Prioridad máxima"
          icon={AlertTriangle}
          tone="danger"
        />
        <StatCard
          label="Convertidas"
          value={convertedCount}
          hint="Ya son órdenes de trabajo"
          icon={ArrowRightLeft}
          tone="default"
        />
      </div>

      {showForm && canManage && (
        <RequestForm
          tenantId={activeTenantId}
          customers={customers}
          onCreated={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      )}

      {requestsQuery.isLoading ? (
        <RequestsSkeleton />
      ) : requestsQuery.isError ? (
        <Card role="alert" className="p-6">
          <span
            className={
              errorStatus === 403
                ? "bg-warning-soft text-warning-strong flex h-11 w-11 items-center justify-center rounded-full"
                : "bg-danger-soft text-danger-strong flex h-11 w-11 items-center justify-center rounded-full"
            }
          >
            {errorStatus === 403 ? (
              <ShieldAlert className="h-5 w-5" aria-hidden="true" />
            ) : (
              <WifiOff className="h-5 w-5" aria-hidden="true" />
            )}
          </span>
          <h2 className="text-text text-h4 mt-3">
            {errorStatus === 403 ? "No tenés permiso para ver las solicitudes" : "No pudimos cargar las solicitudes"}
          </h2>
          <p className="text-text-2 text-small mt-1">
            {errorStatus === 403
              ? "Pedile a un responsable de la empresa que revise tu rol."
              : errorMessage(requestsQuery.error, "Revisá la conexión e intentá de nuevo.")}
          </p>
          {errorStatus !== 403 && (
            <Button variant="outline" className="mt-4" onClick={() => void requestsQuery.refetch()}>
              Reintentar
            </Button>
          )}
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={Inbox}
            title="No hay solicitudes"
            description="Registrá la primera consulta para iniciar el circuito."
            action={
              canManage ? (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Nueva solicitud
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <RequestsToolbar
            filters={filters}
            onFiltersChange={updateFilters}
            sort={sort}
            direction={direction}
            onSortChange={handleSortChange}
            resultCount={sorted.length}
            totalCount={requests.length}
            activeFilterCount={activeFilterCount}
            onClearFilters={() => {
              setFilters(EMPTY_REQUEST_FILTERS);
              setPage(1);
            }}
          />

          {total > requests.length && (
            <p className="text-text-2 bg-surface-2 rounded-ds-md px-3 py-2 text-caption">
              La API devolvió las primeras {requests.length} de {total} solicitudes. Refiná la búsqueda o los
              filtros para encontrar otras.
            </p>
          )}

          {sorted.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={SearchX}
                title="Sin resultados"
                description="No hay solicitudes que coincidan con la búsqueda y los filtros aplicados."
                action={
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFilters(EMPTY_REQUEST_FILTERS);
                      setPage(1);
                    }}
                  >
                    Limpiar filtros
                  </Button>
                }
              />
            </Card>
          ) : (
            <RequestsTable
              page={pageSlice}
              total={sorted.length}
              pageSize={pageSize}
              customerName={lookups.customerName}
              sort={sort}
              direction={direction}
              onSortChange={handleSortChange}
              onPageChange={setPage}
              onPageSizeChange={(nextSize) => {
                setPageSize(nextSize);
                setPage(1);
              }}
              canConvert={canManage}
              onConvert={(requestId) => convertMutation.mutate(requestId)}
              convertingId={convertingId}
            />
          )}
        </>
      )}
    </div>
  );
}
